from __future__ import annotations

import csv
import json
import logging
import re
from collections import defaultdict
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any

from django.apps import apps as django_apps
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.files import File
from django.core.management.base import CommandError
from django.db import connection, transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.accounts.models import (
    AccountType,
    SubscriptionStatus,
    UserRole,
    VerificationRequest,
    VerificationStatus,
)
from apps.admin_portal.models import ClassSchedule, LegacyImportMap, LegacyImportRun
from apps.assessments.models import (
    Assessment,
    AssessmentReport,
    AssessmentStatus,
    RecommendedUniversity,
    ReportApprovalStatus,
    ReportSubmissionStatus,
    Review,
    ServiceChargeRule,
)
from apps.catalog.models import (
    ActiveStatus,
    Country,
    CountryFAQ,
    Course,
    EducationalInfo,
    EducationalPageContent,
    ProgramDuration,
    ScholarshipItem,
    ServiceCategory,
    StudyLevel,
    TopUniversity,
    University,
    VisaChecklistItem,
    WhyThisCountryPoint,
)
from apps.consultants.models import (
    ConsultantService,
    ConsultantStatus,
    Experience,
    ProPackage,
    ProSubscription,
    Qualification,
    Subject,
    Training,
)
from apps.content.models import (
    AboutSection,
    CompanyDetail,
    ContactSubmission,
    FAQ,
    SiteSetting,
    Slider,
    Testimonial,
)
from apps.payments.models import (
    AssessmentSettlement,
    ConsultantPayoutMethod,
    CourseEnrollment,
    CourseOrder,
    DeliveryStatus,
    Order,
    PaymentStatus,
    PayoutMethodType,
    SettlementStatus,
    TransactionType,
    WalletTransaction,
    WithdrawalRequest,
    WithdrawalStatus,
)
from apps.students.models import PostGraduateProfile, StudentChoice, StudentProfile, StudyAbroadLead
from common.hashers import LaravelBcryptPasswordHasher


LOGGER = logging.getLogger("eduwise_v3.import_v2")


PASS_SEQUENCE = [
    "preflight",
    "identities",
    "catalog_and_content",
    "student_domain",
    "consultant_domain",
    "assessments_and_reports",
    "payments_and_finance",
    "courses_and_enrollment",
    "conditional_noop_passes",
]


@dataclass(slots=True)
class ImportOptions:
    sql_dump: Path
    media_root: Path
    report_path: Path | None = None
    dry_run: bool = False
    skip_media: bool = False
    strict: bool = False
    only_passes: list[str] | None = None


@dataclass(slots=True)
class LegacyDump:
    discovered_tables: set[str]
    rows_by_table: dict[str, list[dict[str, str | None]]]

    @property
    def populated_tables(self) -> dict[str, int]:
        return {table: len(rows) for table, rows in self.rows_by_table.items() if rows}

    def rows(self, table: str) -> list[dict[str, str | None]]:
        return self.rows_by_table.get(table, [])


class LegacySqlDumpParser:
    create_table_pattern = re.compile(r"^CREATE TABLE\s+`(?P<table>[^`]+)`", re.IGNORECASE)
    insert_pattern = re.compile(
        r"^INSERT INTO\s+`(?P<table>[^`]+)`\s+\((?P<columns>.+?)\)\s+VALUES\s*(?P<values>.+)$",
        re.IGNORECASE | re.DOTALL,
    )

    def parse(self, sql_dump: Path) -> LegacyDump:
        discovered_tables: set[str] = set()
        rows_by_table: dict[str, list[dict[str, str | None]]] = defaultdict(list)

        for statement in self._iter_statements(sql_dump.read_text(encoding="utf-8", errors="replace")):
            stripped = statement.strip()
            if not stripped:
                continue

            create_match = self.create_table_pattern.match(stripped)
            if create_match:
                discovered_tables.add(create_match.group("table"))
                continue

            insert_match = self.insert_pattern.match(stripped)
            if not insert_match:
                continue

            table = insert_match.group("table")
            discovered_tables.add(table)
            columns = [column.strip().strip("`") for column in insert_match.group("columns").split(",")]
            for values_tuple in self._split_values_block(insert_match.group("values").strip()):
                parsed_values = next(
                    csv.reader(
                        [values_tuple],
                        delimiter=",",
                        quotechar="'",
                        escapechar="\\",
                        doublequote=False,
                        skipinitialspace=False,
                    )
                )
                row = {
                    column: self._normalize_sql_value(value)
                    for column, value in zip(columns, parsed_values, strict=False)
                }
                rows_by_table[table].append(row)

        return LegacyDump(discovered_tables=discovered_tables, rows_by_table=dict(rows_by_table))

    def _iter_statements(self, content: str):
        buffer: list[str] = []
        in_quote = False
        escape = False

        for char in content:
            buffer.append(char)
            if in_quote:
                if escape:
                    escape = False
                elif char == "\\":
                    escape = True
                elif char == "'":
                    in_quote = False
                continue
            if char == "'":
                in_quote = True
            elif char == ";":
                yield "".join(buffer)
                buffer = []

        remainder = "".join(buffer).strip()
        if remainder:
            yield remainder

    def _split_values_block(self, values_block: str) -> list[str]:
        tuples: list[str] = []
        current: list[str] = []
        depth = 0
        in_quote = False
        escape = False

        for char in values_block:
            if in_quote:
                current.append(char)
                if escape:
                    escape = False
                elif char == "\\":
                    escape = True
                elif char == "'":
                    in_quote = False
                continue

            if char == "'":
                in_quote = True
                current.append(char)
                continue

            if char == "(":
                depth += 1
                if depth == 1:
                    current = []
                    continue

            if char == ")":
                depth -= 1
                if depth == 0:
                    tuples.append("".join(current))
                    current = []
                    continue

            if depth >= 1:
                current.append(char)

        return tuples

    def _normalize_sql_value(self, value: str) -> str | None:
        trimmed = value.strip()
        if trimmed.upper() == "NULL":
            return None
        if len(trimmed) >= 2 and trimmed.startswith("'") and trimmed.endswith("'"):
            trimmed = trimmed[1:-1]
        trimmed = (
            trimmed.replace("\\'", "'")
            .replace('\\"', '"')
            .replace("\\r\\n", "\n")
            .replace("\\n", "\n")
            .replace("\\r", "\r")
            .replace("\\t", "\t")
            .replace("\\\\", "\\")
        )
        return trimmed


class V2Importer:
    import_model_labels = {
        "admin_portal.legacyimportrun",
        "admin_portal.legacyimportmap",
    }

    def __init__(self, options: ImportOptions) -> None:
        self.options = options
        self.dump = LegacySqlDumpParser().parse(options.sql_dump)
        self.password_hasher = LaravelBcryptPasswordHasher()
        self.run_record: LegacyImportRun | None = None
        self.object_cache: dict[tuple[str, str], Any] = {}
        self.report: dict[str, Any] = {
            "status": "running",
            "manifest": {
                "discovered_tables": sorted(self.dump.discovered_tables),
                "populated_tables": self.dump.populated_tables,
            },
            "passes": [],
            "tables": {},
            "warnings": [],
        }
        for table in sorted(self.dump.discovered_tables):
            self.report["tables"][table] = {
                "source_rows": len(self.dump.rows(table)),
                "created": 0,
                "skipped": 0,
                "warnings": 0,
                "errors": 0,
            }

    def run(self) -> dict[str, Any]:
        selected_passes = self._selected_passes()

        if self.options.dry_run:
            with transaction.atomic():
                self.run_record = self._create_run(selected_passes)
                self._run_passes(selected_passes)
                self._finalize_run(LegacyImportRun.Status.DRY_RUN)
                transaction.set_rollback(True)
        else:
            self.run_record = self._create_run(selected_passes)
            try:
                self._run_passes(selected_passes)
            except Exception as exc:
                self._mark_failed(exc)
                raise
            self._finalize_run(LegacyImportRun.Status.COMPLETED)

        if self.options.report_path:
            self.options.report_path.parent.mkdir(parents=True, exist_ok=True)
            self.options.report_path.write_text(json.dumps(self.report, indent=2, default=str), encoding="utf-8")
        return self.report

    def _selected_passes(self) -> list[str]:
        if not self.options.only_passes:
            return PASS_SEQUENCE
        unknown = sorted(set(self.options.only_passes) - set(PASS_SEQUENCE))
        if unknown:
            raise CommandError(f"Unknown import passes: {', '.join(unknown)}")
        selected = [name for name in PASS_SEQUENCE if name in set(self.options.only_passes)]
        if "preflight" not in selected:
            selected.insert(0, "preflight")
        return selected

    def _create_run(self, selected_passes: list[str]) -> LegacyImportRun:
        return LegacyImportRun.objects.create(
            sql_dump_path=str(self.options.sql_dump),
            media_root=str(self.options.media_root),
            dry_run=self.options.dry_run,
            strict=self.options.strict,
            selected_passes=selected_passes,
        )

    def _run_passes(self, selected_passes: list[str]) -> None:
        for pass_name in selected_passes:
            LOGGER.info("Running import pass '%s'.", pass_name)
            if self.options.dry_run:
                self._execute_pass(pass_name)
            else:
                with transaction.atomic():
                    self._execute_pass(pass_name)
            self.report["passes"].append({"name": pass_name, "status": "completed"})

    def _execute_pass(self, pass_name: str) -> None:
        getattr(self, f"_pass_{pass_name}")()

    def _finalize_run(self, status: str) -> None:
        self.report["status"] = status
        summary = {
            "selected_passes": self._selected_passes(),
            "warnings": len(self.report["warnings"]),
            "created_rows": sum(table["created"] for table in self.report["tables"].values()),
            "skipped_rows": sum(table["skipped"] for table in self.report["tables"].values()),
        }
        self.report["summary"] = summary
        if self.run_record:
            self.run_record.status = status
            self.run_record.finished_at = timezone.now()
            self.run_record.summary = self.report
            self.run_record.save(update_fields=["status", "finished_at", "summary", "updated_at"])

    def _mark_failed(self, exc: Exception) -> None:
        self.report["status"] = LegacyImportRun.Status.FAILED
        self.report["error"] = str(exc)
        if self.run_record:
            self.run_record.status = LegacyImportRun.Status.FAILED
            self.run_record.finished_at = timezone.now()
            self.run_record.summary = self.report
            self.run_record.save(update_fields=["status", "finished_at", "summary", "updated_at"])

    def _pass_preflight(self) -> None:
        if not self.options.sql_dump.exists():
            raise CommandError(f"SQL dump does not exist: {self.options.sql_dump}")
        if not self.options.skip_media and not self.options.media_root.exists():
            raise CommandError(f"Media root does not exist: {self.options.media_root}")

        existing_tables = set(connection.introspection.table_names())
        required_tables = {
            model._meta.db_table
            for model in django_apps.get_models()
            if model._meta.app_label in {
                "accounts",
                "content",
                "catalog",
                "students",
                "consultants",
                "assessments",
                "payments",
                "agencies",
                "marketplace",
                "admin_portal",
            }
            and model._meta.managed
        }
        missing_tables = sorted(required_tables - existing_tables)
        if missing_tables:
            raise CommandError(
                "Required tables are missing. Run migrations before importing. Missing: "
                + ", ".join(missing_tables)
            )

        offenders: list[str] = []
        for model in django_apps.get_models():
            label = model._meta.label_lower
            if label in self.import_model_labels or not model._meta.managed:
                continue
            if model._meta.app_label not in {
                "accounts",
                "content",
                "catalog",
                "students",
                "consultants",
                "assessments",
                "payments",
                "agencies",
                "marketplace",
                "admin_portal",
            }:
                continue
            if model._default_manager.exists():
                offenders.append(f"{label} ({model._default_manager.count()})")
        if offenders:
            raise CommandError(
                "Target database is not empty. Bootstrap import requires a clean V3 database. "
                f"Found rows in: {', '.join(offenders[:10])}"
            )

    def _pass_identities(self) -> None:
        User = get_user_model()
        for row in self.dump.rows("users"):
            role = self._map_user_role(row.get("user_type"))
            email = self._fallback_email(row.get("email"), "user", row.get("id"))
            first_name, last_name = self._split_name(row.get("name"))
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=self._text(row.get("phone")),
                role=role,
                account_type=AccountType.PERSONAL,
                gender=self._text(row.get("gender")),
                present_address=self._text(row.get("present_address")),
                present_city=self._text(row.get("present_city")),
                present_country=self._text(row.get("present_country")),
                date_of_birth=self._parse_date(row.get("date_of_birth")),
                nationality=self._text(row.get("nationality")),
                passport_or_nid=self._text(row.get("passport_or_nid")),
                passport_issue_date=self._parse_date(row.get("passport_issue_date")),
                passport_expiry_date=self._parse_date(row.get("passport_expiry_date")),
                experience_summary=self._text(row.get("experience")),
                verification_status=self._map_verification_status(row.get("is_verified")),
                subscription_status=self._map_subscription_status(row.get("is_pro_user")),
                profile_completion=self._parse_int(row.get("completion_percentage")) or 0,
                assessment_price=self._parse_decimal(row.get("assessment_price")),
                assessment_duration=self._text(row.get("assessment_duration")),
                balance=self._parse_decimal(row.get("balance")) or Decimal("0"),
                date_joined=self._parse_datetime(row.get("created_at")) or timezone.now(),
                last_login=self._parse_datetime(row.get("email_verified_at")),
                is_active=True,
            )
            user.password = self._wrap_legacy_password(row.get("password"))
            self._attach_file(user, "image", row.get("image"), "users", row.get("id"))
            user.save()
            self._update_timestamps(User, user.pk, row)
            self._remember("users", row.get("id"), user)

        for row in self.dump.rows("admins"):
            email = self._fallback_email(row.get("email"), "admin", row.get("id"))
            first_name, last_name = self._split_name(row.get("name"))
            user = User(
                email=email,
                first_name=first_name,
                last_name=last_name,
                phone=self._text(row.get("phone")),
                role=UserRole.ADMIN,
                account_type=AccountType.PERSONAL,
                date_joined=self._parse_datetime(row.get("created_at")) or timezone.now(),
                last_login=self._parse_datetime(row.get("last_login_at")),
                is_active=True,
                is_staff=True,
                is_superuser=True,
                verification_status=VerificationStatus.ACCEPTED,
            )
            user.password = self._wrap_legacy_password(row.get("password"))
            self._attach_file(user, "image", row.get("image"), "admins", row.get("id"))
            user.save()
            self._update_timestamps(User, user.pk, row, extra_updates={"last_login": self._parse_datetime(row.get("last_login_at"))})
            self._remember("admins", row.get("id"), user)

        for row in self.dump.rows("user_verification"):
            user = self._resolve("users", row.get("user_id"))
            if not user:
                self._skip("user_verification", f"User {row.get('user_id')} was not imported.")
                continue
            status = self._map_verification_status(row.get("status"))
            request = VerificationRequest.objects.create(user=user, status=status)
            self._update_timestamps(VerificationRequest, request.pk, row)
            user.verification_status = status
            user.save(update_fields=["verification_status"])
            self._remember("user_verification", row.get("id"), request)

        for row in self.dump.rows("pro_user_packages"):
            duration_days = self._parse_int(row.get("duration")) or 30
            package_text = " ".join(
                filter(
                    None,
                    [
                        self._text(row.get("name")),
                        self._text(row.get("level")),
                        self._text(row.get("description")),
                    ],
                )
            ).lower()
            package = ProPackage.objects.create(
                name=self._text(row.get("name")) or f"Legacy Package {row.get('id')}",
                level=self._text(row.get("level")),
                package_type=(
                    ProPackage.PackageType.ANNUAL
                    if duration_days >= 365 or any(token in package_text for token in ("annual", "annually", "year", "yearly"))
                    else ProPackage.PackageType.MONTHLY
                ),
                duration_days=duration_days,
                description=self._text(row.get("description")),
                price=self._parse_decimal(row.get("price")) or Decimal("0"),
                features=self._to_list(row.get("features")),
                status=self._map_active_status(row.get("status"), consultant=True),
            )
            self._update_timestamps(ProPackage, package.pk, row)
            self._remember("pro_user_packages", row.get("id"), package)

        for row in self.dump.rows("pro_consultants"):
            user = self._resolve("users", row.get("user_id"))
            package = self._resolve("pro_user_packages", row.get("package_id"))
            if not user or not package:
                self._skip("pro_consultants", f"Subscription {row.get('id')} could not resolve user/package.")
                continue
            starts_at = self._parse_datetime(row.get("created_at")) or timezone.now()
            duration_days = self._parse_int(row.get("duration")) or package.duration_days
            subscription = ProSubscription.objects.create(
                user=user,
                package=package,
                starts_at=starts_at,
                ends_at=starts_at + timedelta(days=duration_days),
                active=True,
            )
            self._update_timestamps(ProSubscription, subscription.pk, row)
            self._remember("pro_consultants", row.get("id"), subscription)

    def _pass_catalog_and_content(self) -> None:
        for row in self.dump.rows("country"):
            country = Country(
                name=self._text(row.get("name")) or f"Legacy Country {row.get('id')}",
                slug=self._unique_slug(Country, row.get("slug") or row.get("name") or f"country-{row.get('id')}"),
                status=self._map_active_status(row.get("status")),
            )
            self._attach_file(country, "image", row.get("image"), "country", row.get("id"))
            country.save()
            self._update_timestamps(Country, country.pk, row)
            self._remember("country", row.get("id"), country)

        for row in self.dump.rows("services"):
            service = ServiceCategory(
                name=self._text(row.get("name")) or f"Legacy Service {row.get('id')}",
                description=self._text(row.get("description")),
                status=self._map_active_status(row.get("status")),
            )
            self._attach_file(service, "image", row.get("image_path"), "services", row.get("id"))
            service.save()
            self._update_timestamps(ServiceCategory, service.pk, row)
            self._remember("services", row.get("id"), service)

        for row in self.dump.rows("study_level"):
            level = StudyLevel.objects.create(
                name=self._text(row.get("name")) or f"Legacy Study Level {row.get('id')}",
                slug=self._unique_slug(StudyLevel, row.get("slug") or row.get("name") or f"study-level-{row.get('id')}"),
                status=self._map_active_status(row.get("status")),
            )
            self._update_timestamps(StudyLevel, level.pk, row)
            self._remember("study_level", row.get("id"), level)

        for row in self.dump.rows("university"):
            university = University(
                name=self._text(row.get("name")) or f"Legacy University {row.get('id')}",
                slug=self._unique_slug(University, row.get("slug") or row.get("name") or f"university-{row.get('id')}"),
                status=self._map_active_status(row.get("status")),
            )
            self._attach_file(university, "image", row.get("image"), "university", row.get("id"))
            university.save()
            self._update_timestamps(University, university.pk, row)
            self._remember("university", row.get("id"), university)

        for row in self.dump.rows("courses"):
            course = Course(
                name=self._text(row.get("name")) or f"Legacy Course {row.get('id')}",
                slug=self._unique_slug(Course, row.get("slug") or row.get("name") or f"course-{row.get('id')}"),
                status=self._map_active_status(row.get("status")),
            )
            self._attach_file(course, "image", row.get("image"), "courses", row.get("id"))
            course.save()
            self._update_timestamps(Course, course.pk, row)
            self._remember("courses", row.get("id"), course)

        for row in self.dump.rows("educational_info"):
            country = self._resolve_country(row.get("country"))
            if not country:
                self._skip("educational_info", f"Educational info {row.get('id')} has unknown country {row.get('country')!r}.")
                continue
            study_level = self._resolve_study_level(row.get("study_level"))
            info = EducationalInfo(
                title=self._text(row.get("title")) or f"Legacy Educational Info {row.get('id')}",
                country=country,
                institution_name=self._text(row.get("institution")),
                location=self._text(row.get("location")),
                next_batch=self._text(row.get("next_batch")),
                entry_score=self._text(row.get("entry_score")),
                course_name=self._text(row.get("course")),
                study_level=study_level,
                description=self._text(row.get("description")),
                budget=self._parse_decimal(row.get("budget")),
                scholarship_available=self._truthy(row.get("is_scholarship")),
                scholarship_percentage=self._text(row.get("scholarship_percentage")),
                status=self._map_active_status(row.get("status")),
                show_on_home=self._truthy(row.get("home_enabled")),
            )
            self._attach_file(info, "card_banner", row.get("card_banner"), "educational_info", row.get("id"))
            info.save()
            self._update_timestamps(EducationalInfo, info.pk, row)
            self._remember("educational_info", row.get("id"), info)

        for row in self.dump.rows("page_content"):
            info = self._resolve("educational_info", row.get("info_id"))
            if not info:
                self._skip("page_content", f"Page content {row.get('id')} references missing educational info.")
                continue
            page = EducationalPageContent(
                educational_info=info,
                headline=self._text(row.get("headline")),
                head_description=self._text(row.get("head_desc")),
                living_cost=self._text(row.get("living_cost")),
                academic_intake=self._text(row.get("academic_intake")),
                deadline=self._text(row.get("deadline")),
                popular_programs_text=self._text(row.get("populer_programs_text")),
                popular_program_names=self._to_list(row.get("populer_programs_name")),
            )
            self._attach_file(page, "banner_image", row.get("banner_image"), "page_content", row.get("id"))
            page.save()
            self._update_timestamps(EducationalPageContent, page.pk, row)
            self._remember("page_content", row.get("id"), page)

        for row in self.dump.rows("why_this_country"):
            info = self._resolve("educational_info", row.get("info_id"))
            if not info:
                self._skip("why_this_country", f"Why-this-country row {row.get('id')} references missing educational info.")
                continue
            obj = WhyThisCountryPoint.objects.create(
                educational_info=info,
                point=self._text(row.get("point")) or "",
                point_detail=self._text(row.get("point_detail")),
                source_link=self._text(row.get("source_link")),
            )
            self._update_timestamps(WhyThisCountryPoint, obj.pk, row)
            self._remember("why_this_country", row.get("id"), obj)

        for row in self.dump.rows("programs_duration"):
            info = self._resolve("educational_info", row.get("info_id"))
            if not info:
                self._skip("programs_duration", f"Program duration {row.get('id')} references missing educational info.")
                continue
            obj = ProgramDuration.objects.create(
                educational_info=info,
                program_name=self._text(row.get("programs")) or "",
                duration=self._text(row.get("duration")) or "",
            )
            self._update_timestamps(ProgramDuration, obj.pk, row)
            self._remember("programs_duration", row.get("id"), obj)

        for row in self.dump.rows("top_universities"):
            info = self._resolve("educational_info", row.get("info_id"))
            if not info:
                self._skip("top_universities", f"Top university {row.get('id')} references missing educational info.")
                continue
            obj = TopUniversity(
                educational_info=info,
                institution=self._text(row.get("institution")) or "",
                short_description=self._text(row.get("short_desc")),
                ranking=self._text(row.get("ranking")),
                number_of_students=self._text(row.get("number_of_students")),
            )
            self._attach_file(obj, "logo", row.get("logo"), "top_universities", row.get("id"))
            obj.save()
            self._update_timestamps(TopUniversity, obj.pk, row)
            self._remember("top_universities", row.get("id"), obj)

        for row in self.dump.rows("visa_checklist"):
            info = self._resolve("educational_info", row.get("info_id"))
            if not info:
                self._skip("visa_checklist", f"Visa checklist {row.get('id')} references missing educational info.")
                continue
            obj = VisaChecklistItem.objects.create(
                educational_info=info,
                text=self._text(row.get("list_text")) or "",
            )
            self._update_timestamps(VisaChecklistItem, obj.pk, row)
            self._remember("visa_checklist", row.get("id"), obj)

        for row in self.dump.rows("country_faq"):
            info = self._resolve("educational_info", row.get("info_id"))
            if not info:
                self._skip("country_faq", f"Country FAQ {row.get('id')} references missing educational info.")
                continue
            obj = CountryFAQ.objects.create(
                educational_info=info,
                question=self._text(row.get("question")) or "",
                answer=self._text(row.get("answer")) or "",
            )
            self._update_timestamps(CountryFAQ, obj.pk, row)
            self._remember("country_faq", row.get("id"), obj)

        for row in self.dump.rows("scholarships_this_country"):
            info = self._resolve("educational_info", row.get("info_id"))
            if not info:
                self._skip("scholarships_this_country", f"Scholarship {row.get('id')} references missing educational info.")
                continue
            obj = ScholarshipItem.objects.create(
                educational_info=info,
                text=self._text(row.get("scholarship_text")) or "",
            )
            self._update_timestamps(ScholarshipItem, obj.pk, row)
            self._remember("scholarships_this_country", row.get("id"), obj)

        for row in self.dump.rows("configers"):
            site_setting = SiteSetting(
                company_name=self._text(row.get("name")) or "EduWise",
                promo_video=self._text(row.get("video")),
                company_detail=self._text(row.get("companydetail")),
                phone=self._text(row.get("phone")),
                email=self._text(row.get("email")),
                address=self._text(row.get("address")),
                facebook=self._text(row.get("facebook")),
                twitter=self._text(row.get("twitter")),
                youtube=self._text(row.get("youtube")),
                instagram=self._text(row.get("instagram")),
            )
            self._attach_file(site_setting, "primary_logo", row.get("logo"), "configers", row.get("id"))
            self._attach_file(site_setting, "secondary_logo", row.get("logo_two"), "configers", row.get("id"))
            site_setting.save()
            self._update_timestamps(SiteSetting, site_setting.pk, row)
            self._remember("configers", row.get("id"), site_setting)

        for row in self.dump.rows("company_details"):
            obj = CompanyDetail(
                title=self._text(row.get("title")) or f"Legacy Company Detail {row.get('id')}",
                subtitle=self._text(row.get("subtitle")),
                slug=self._unique_slug(CompanyDetail, row.get("slug") or row.get("title") or f"company-detail-{row.get('id')}"),
                description=self._text(row.get("description")) or "",
            )
            self._attach_file(obj, "image", row.get("image"), "company_details", row.get("id"))
            obj.save()
            self._update_timestamps(CompanyDetail, obj.pk, row)
            self._remember("company_details", row.get("id"), obj)

        for row in self.dump.rows("sliders"):
            obj = Slider(
                subtitle=self._text(row.get("subtitle")) or "",
                title=self._text(row.get("title")) or f"Legacy Slider {row.get('id')}",
                slug=self._unique_slug(Slider, row.get("slug") or row.get("title") or f"slider-{row.get('id')}"),
                description=self._text(row.get("description")) or "",
            )
            self._attach_file(obj, "image", row.get("image"), "sliders", row.get("id"))
            obj.save()
            self._update_timestamps(Slider, obj.pk, row)
            self._remember("sliders", row.get("id"), obj)

        for row in self.dump.rows("abouts"):
            obj = AboutSection(
                title=self._text(row.get("title")) or f"Legacy About {row.get('id')}",
                subtitle=self._text(row.get("subtitle")),
                slug=self._unique_slug(AboutSection, row.get("slug") or row.get("title") or f"about-{row.get('id')}"),
                description=self._text(row.get("description")) or "",
            )
            self._attach_file(obj, "image", row.get("image"), "abouts", row.get("id"))
            obj.save()
            self._update_timestamps(AboutSection, obj.pk, row)
            self._remember("abouts", row.get("id"), obj)

        for row in self.dump.rows("testimonials"):
            obj = Testimonial(
                name=self._text(row.get("name")) or f"Legacy Testimonial {row.get('id')}",
                designation=self._text(row.get("designation")),
                description=self._text(row.get("description")) or "",
            )
            self._attach_file(obj, "image", row.get("image"), "testimonials", row.get("id"))
            obj.save()
            self._update_timestamps(Testimonial, obj.pk, row)
            self._remember("testimonials", row.get("id"), obj)

        for row in self.dump.rows("faq"):
            obj = FAQ.objects.create(
                question=self._text(row.get("question")) or "",
                answer=self._text(row.get("answer")) or "",
            )
            self._update_timestamps(FAQ, obj.pk, row)
            self._remember("faq", row.get("id"), obj)

        for row in self.dump.rows("contacts"):
            obj = ContactSubmission.objects.create(
                name=self._text(row.get("name")) or "",
                phone=self._text(row.get("phone")),
                email=self._fallback_optional_email(row.get("email")),
                service_interest=self._text(row.get("service_interest")),
                subject=self._text(row.get("subject")),
                message=self._text(row.get("message")),
            )
            self._update_timestamps(ContactSubmission, obj.pk, row)
            self._remember("contacts", row.get("id"), obj)

    def _pass_student_domain(self) -> None:
        for row in self.dump.rows("student_infos"):
            user = self._resolve("users", row.get("user_id"))
            if not user:
                self._skip("student_infos", f"Student info {row.get('id')} references missing user.")
                continue
            profile = StudentProfile(
                user=user,
                academic_track=self._map_academic_track(row.get("academic_type")),
                o_level_result=self._text(row.get("o_lavel_result")),
                a_level_result=self._text(row.get("a_lavel_result")),
                hsc_result=self._text(row.get("hsc_result")),
                ssc_result=self._text(row.get("ssc_result")),
                dakhil_result=self._text(row.get("dakhil_result")),
                alim_result=self._text(row.get("alim_result")),
                ielts_score=self._text(row.get("ielts_score")),
                last_education_title=self._text(row.get("last_edu_title")),
                last_education_department=self._text(row.get("last_edu_department")),
                last_education_result=self._text(row.get("last_edu_result")),
                last_education_start=self._parse_date(row.get("last_edu_startDate")),
                last_education_end=self._parse_date(row.get("last_edu_endDate")),
                last_education_duration=self._text(row.get("last_edu_Duration")),
            )
            self._attach_file(profile, "o_level_certificate", row.get("o_lavel_certificate"), "student_infos", row.get("id"))
            self._attach_file(profile, "a_level_certificate", row.get("a_lavel_certificate"), "student_infos", row.get("id"))
            self._attach_file(profile, "hsc_certificate", row.get("hsc_certificate"), "student_infos", row.get("id"))
            self._attach_file(profile, "ssc_certificate", row.get("ssc_certificate"), "student_infos", row.get("id"))
            self._attach_file(profile, "dakhil_certificate", row.get("dakhil_certificate"), "student_infos", row.get("id"))
            self._attach_file(profile, "alim_certificate", row.get("alim_certificate"), "student_infos", row.get("id"))
            self._attach_file(profile, "ielts_certificate", row.get("ielts_certificate"), "student_infos", row.get("id"))
            self._attach_file(profile, "last_education_certificate", row.get("last_edu_certificate"), "student_infos", row.get("id"))
            profile.save()
            self._update_timestamps(StudentProfile, profile.pk, row)
            self._remember("student_infos", row.get("id"), profile)

        for row in self.dump.rows("post_graduate_info"):
            user = self._resolve("users", row.get("user_id"))
            if not user:
                self._skip("post_graduate_info", f"Post-graduate row {row.get('id')} references missing user.")
                continue
            profile = PostGraduateProfile(
                user=user,
                grade=self._text(row.get("grade")),
                title=self._text(row.get("title")),
                duration=self._text(row.get("duration")),
                department=self._text(row.get("department")),
                start_date=self._parse_date(row.get("start_time")),
                end_date=self._parse_date(row.get("end_time")),
            )
            self._attach_file(profile, "certificate", row.get("certificate"), "post_graduate_info", row.get("id"))
            profile.save()
            self._update_timestamps(PostGraduateProfile, profile.pk, row)
            self._remember("post_graduate_info", row.get("id"), profile)

        for row in self.dump.rows("student_choice"):
            user = self._resolve("users", row.get("user_id"))
            service = self._resolve("services", row.get("service_id"))
            country = self._resolve_country(row.get("country"))
            if not user or not service or not country:
                self._skip("student_choice", f"Student choice {row.get('id')} could not resolve user/service/country.")
                continue
            choice = StudentChoice.objects.create(
                user=user,
                service=service,
                country=country,
                institute=self._text(row.get("institute")),
                subject=self._text(row.get("subject")),
                session=self._text(row.get("session")),
                budget=self._parse_decimal(row.get("budget")),
            )
            self._update_timestamps(StudentChoice, choice.pk, row)
            self._remember("student_choice", row.get("id"), choice)

        for row in self.dump.rows("student_query"):
            lead = StudyAbroadLead.objects.create(
                name=self._text(row.get("name")) or "",
                phone=self._text(row.get("phone")) or "",
                email=self._fallback_email(row.get("email"), "lead", row.get("id")),
                last_education_title=self._text(row.get("last_edu_title")),
                last_education_result=self._text(row.get("last_edu_result")),
                ielts_score=self._text(row.get("ielts_score")),
                interest_for=self._text(row.get("interest_for")),
                preferred_country=self._resolve_country(row.get("preferred_country")),
                budget=self._parse_decimal(row.get("budget")),
                note=self._text(row.get("note")),
            )
            self._update_timestamps(StudyAbroadLead, lead.pk, row)
            self._remember("student_query", row.get("id"), lead)

    def _pass_consultant_domain(self) -> None:
        for row in self.dump.rows("consultants_qualifications"):
            user = self._resolve("users", row.get("user_id"))
            if not user:
                self._skip("consultants_qualifications", f"Qualification {row.get('id')} references missing user.")
                continue
            qualification = Qualification(
                user=user,
                level_of_education=self._text(row.get("level_of_education")) or "",
                degree_title=self._text(row.get("degree_title")) or "",
                institution=self._text(row.get("institution")) or "",
                department=self._text(row.get("department")),
                passing_year=self._text(row.get("passing_year")),
                cgpa=self._text(row.get("cgpa")),
                duration=self._text(row.get("duration")),
            )
            self._attach_file(qualification, "document", row.get("documents"), "consultants_qualifications", row.get("id"))
            qualification.save()
            self._update_timestamps(Qualification, qualification.pk, row)
            self._remember("consultants_qualifications", row.get("id"), qualification)

        for row in self.dump.rows("experiences"):
            user = self._resolve("users", row.get("user_id"))
            if not user:
                self._skip("experiences", f"Experience {row.get('id')} references missing user.")
                continue
            experience = Experience(
                user=user,
                organization=self._text(row.get("organization")) or "",
                designation=self._text(row.get("designation")) or "",
                responsibilities=self._text(row.get("responsibilities")),
                start_date=self._parse_date(row.get("start_date")),
                end_date=self._parse_date(row.get("end_date")),
                duration=self._text(row.get("duration")),
                skill_languages=self._text(row.get("other_language")),
            )
            self._attach_file(experience, "document", row.get("documents"), "experiences", row.get("id"))
            self._attach_file(experience, "cv_document", row.get("cv_documents"), "experiences", row.get("id"))
            experience.save()
            self._update_timestamps(Experience, experience.pk, row)
            self._remember("experiences", row.get("id"), experience)

        for row in self.dump.rows("consultancy_services"):
            consultant = self._resolve("users", row.get("user_id"))
            country = self._resolve_country(row.get("country"))
            service_category = self._resolve("services", row.get("service_id"))
            if not consultant or not country or not service_category:
                self._skip("consultancy_services", f"Consultant service {row.get('id')} could not resolve consultant/service/country.")
                continue
            service = ConsultantService.objects.create(
                consultant=consultant,
                country=country,
                title=self._text(row.get("title")) or "",
                description=self._text(row.get("description")) or "",
                price=self._parse_decimal(row.get("price")),
                duration=self._text(row.get("duration")) or "",
                status=self._map_active_status(row.get("status"), consultant=True),
            )
            service.service_categories.set([service_category])
            subject_name = self._text(row.get("subject"))
            if subject_name:
                subject, _ = Subject.objects.get_or_create(name=subject_name)
                service.subjects.set([subject])
            self._update_timestamps(ConsultantService, service.pk, row)
            self._remember("consultancy_services", row.get("id"), service)

        for row in self.dump.rows("trainings"):
            training = Training(
                title=self._text(row.get("title")) or "",
                training_type=self._text(row.get("training_type")),
                description=self._text(row.get("description")),
                overview=self._text(row.get("overview")),
                organization=self._text(row.get("organization")),
                address=self._text(row.get("address")),
                language=self._text(row.get("language")),
                application_deadline=self._parse_datetime(row.get("app_deadline")),
                start_date=self._parse_datetime(row.get("start_date")),
                duration=self._text(row.get("duration")),
                price=self._parse_decimal(row.get("price")),
                status=self._map_active_status(row.get("status"), consultant=True),
            )
            self._attach_file(training, "thumbnail", row.get("thumbnail"), "trainings", row.get("id"))
            self._attach_file(training, "document", row.get("documents"), "trainings", row.get("id"))
            training.save()
            self._update_timestamps(Training, training.pk, row)
            self._remember("trainings", row.get("id"), training)

        for row in self.dump.rows("consultant_account_details"):
            consultant = self._resolve("users", row.get("consultant_id"))
            if not consultant:
                self._skip("consultant_account_details", f"Payout method {row.get('id')} references missing consultant.")
                continue
            method = ConsultantPayoutMethod.objects.create(
                consultant=consultant,
                method_type=self._map_payout_method(row.get("account_type")),
                account_holder_name=self._text(row.get("account_holder_name")) or "",
                email_address=self._fallback_optional_email(row.get("email_address")),
                phone_number=self._text(row.get("phone_number")),
                mobile_bank_type=self._text(row.get("mobile_bank_type")),
                mobile_bank_number=self._text(row.get("mobile_bank_number")),
                bank_name=self._text(row.get("bank_name")),
                account_number=self._text(row.get("account_number")),
                branch_name=self._text(row.get("branch_name")),
                routing_number=self._text(row.get("routing_number")),
            )
            self._update_timestamps(ConsultantPayoutMethod, method.pk, row)
            self._remember("consultant_account_details", row.get("id"), method)

    def _pass_assessments_and_reports(self) -> None:
        for row in self.dump.rows("assessments"):
            student = self._resolve("users", row.get("student_id"))
            consultant = self._resolve("users", row.get("consultant_id"))
            consultant_service = self._resolve("consultancy_services", row.get("consultancy_service_id"))
            assessment_country = self._resolve_country(row.get("assessment_country"))
            preferred_country = self._resolve_country(row.get("preferred_country"))
            if not student or not consultant or not consultant_service:
                self._skip("assessments", f"Assessment {row.get('id')} could not resolve student/consultant/service.")
                continue
            status = self._map_assessment_status(row.get("status"))
            submitted_at = self._parse_datetime(row.get("submit_date"))
            assessment = Assessment(
                student=student,
                consultant=consultant,
                consultant_service=consultant_service,
                assessment_country=assessment_country,
                assessment_charge=self._parse_decimal(row.get("assessment_charge")),
                assessment_duration=self._text(row.get("assessment_duration")),
                assessment_title=self._text(row.get("assessment_title")),
                assessment_description=self._text(row.get("assessment_description")),
                preferred_country=preferred_country,
                preferred_institute=self._text(row.get("preferred_institute")),
                preferred_subject=self._text(row.get("preferred_subject")),
                preferred_session=self._text(row.get("preferred_session")),
                student_budget=self._parse_decimal(row.get("student_budget")),
                status=status,
                submitted_at=submitted_at,
            )
            self._attach_file(assessment, "attachment", row.get("attachment"), "assessments", row.get("id"))
            assessment.save()
            self._update_timestamps(Assessment, assessment.pk, row)
            self._remember("assessments", row.get("id"), assessment)

        for row in self.dump.rows("other_assessments"):
            assessment = self._resolve("assessments", row.get("assessment_id"))
            student = self._resolve("users", row.get("student_id"))
            consultant = self._resolve("users", row.get("consultant_id"))
            if not assessment or not student or not consultant:
                self._skip("other_assessments", f"Assessment report {row.get('id')} could not resolve assessment/student/consultant.")
                continue
            approval_status = (
                ReportApprovalStatus.APPROVED
                if assessment.status == AssessmentStatus.COMPLETED
                else ReportApprovalStatus.PENDING
            )
            report = AssessmentReport.objects.create(
                assessment=assessment,
                student=student,
                consultant=consultant,
                ielts_score=self._text(row.get("ielts_score")),
                other_tests=self._text(row.get("other_tests")),
                english_preparation=self._text(row.get("english_prep")),
                health_insurance=self._text(row.get("health_insurance")),
                insurance_options=self._text(row.get("insurance_options")),
                additional_health=self._text(row.get("additional_health")),
                visa_type=self._text(row.get("visa_type")),
                visa_requirements=self._text(row.get("visa_requirements")),
                visa_processing=self._text(row.get("visa_processing")),
                visa_interview=self._text(row.get("visa_interview")),
                university_processing=self._text(row.get("university_processing")),
                admission_notification=self._text(row.get("admission_notification")),
                visa_application=self._text(row.get("visa_application")),
                final_confirmation=self._text(row.get("final_confirmation")),
                step_ielts=self._text(row.get("step_ielts")),
                step_documents=self._text(row.get("step_documents")),
                step_apply=self._text(row.get("step_apply")),
                step_scholarships=self._text(row.get("step_scholarships")),
                step_visa=self._text(row.get("step_visa")),
                step_interview=self._text(row.get("step_interview")),
                additional_comments=self._text(row.get("additional_comments")),
                submission_status=self._map_report_submission_status(row.get("submission_status")),
                admin_approval_status=approval_status,
                approved_at=self._parse_datetime(row.get("updated_at")) if approval_status == ReportApprovalStatus.APPROVED else None,
                student_accepted_at=self._parse_datetime(row.get("updated_at")) if assessment.status == AssessmentStatus.COMPLETED else None,
            )
            self._update_timestamps(AssessmentReport, report.pk, row)
            self._remember("other_assessments", row.get("id"), report)

        for row in self.dump.rows("recommended_universities"):
            assessment = self._resolve("assessments", row.get("assessment_id"))
            student = self._resolve("users", row.get("student_id"))
            consultant = self._resolve("users", row.get("consultant_id"))
            if not assessment or not student or not consultant:
                self._skip("recommended_universities", f"Recommendation {row.get('id')} could not resolve assessment/student/consultant.")
                continue
            recommendation = RecommendedUniversity.objects.create(
                assessment=assessment,
                student=student,
                consultant=consultant,
                university_name=self._text(row.get("university_name")) or "",
                course_name=self._text(row.get("course_name")) or "",
                tuition_fees=self._parse_decimal(row.get("tuition_fees")),
                living_expenses=self._parse_decimal(row.get("living_expenses")),
                total_estimated_budget=self._parse_decimal(row.get("total_estimated_budget")),
                ielts=self._text(row.get("ielts")),
                scholarships=self._text(row.get("scholarships")),
                visa_type=self._text(row.get("visa_type")),
                visa_processing_time=self._text(row.get("visa_processing_time")),
                application_processing_time=self._text(row.get("application_processing_time")),
                admission_notification_time=self._text(row.get("admission_notification_time")),
            )
            self._update_timestamps(RecommendedUniversity, recommendation.pk, row)
            self._remember("recommended_universities", row.get("id"), recommendation)

        for row in self.dump.rows("reviews"):
            assessment = self._resolve("assessments", row.get("assessment_id"))
            student = self._resolve("users", row.get("student_id"))
            consultant = self._resolve("users", row.get("consultant_id"))
            consultant_service = self._resolve("consultancy_services", row.get("consultancy_service_id"))
            if not assessment or not student or not consultant or not consultant_service:
                self._skip("reviews", f"Review {row.get('id')} could not resolve required relations.")
                continue
            review = Review.objects.create(
                assessment=assessment,
                student=student,
                consultant=consultant,
                consultant_service=consultant_service,
                review_message=self._text(row.get("review_message")) or "",
                review_rating=self._parse_decimal(row.get("review_rating")) or Decimal("0"),
            )
            self._update_timestamps(Review, review.pk, row)
            self._remember("reviews", row.get("id"), review)

        for row in self.dump.rows("class_schedules"):
            schedule = ClassSchedule.objects.create(
                name=self._text(row.get("name")) or "",
                link=self._text(row.get("link")) or "",
                status=self._map_class_schedule_status(row.get("status")),
                date_time=self._parse_datetime(row.get("date_time")) or timezone.now(),
            )
            self._update_timestamps(ClassSchedule, schedule.pk, row)
            self._remember("class_schedules", row.get("id"), schedule)

        for row in self.dump.rows("service_charge"):
            service_category = self._resolve("services", row.get("service_id")) or self._resolve("services", row.get("service_category_id"))
            if not service_category:
                self._skip("service_charge", f"Service charge {row.get('id')} references missing service category.")
                continue
            rule = ServiceChargeRule.objects.create(
                service_category=service_category,
                role_tier=self._text(row.get("role_tier")) or self._text(row.get("role")) or "default",
                commission=self._parse_decimal(row.get("commission")) or Decimal("0"),
            )
            self._update_timestamps(ServiceChargeRule, rule.pk, row)
            self._remember("service_charge", row.get("id"), rule)

    def _pass_payments_and_finance(self) -> None:
        for row in self.dump.rows("transactions"):
            user = self._resolve("users", row.get("user_id"))
            if not user:
                self._skip("transactions", f"Transaction {row.get('id')} references missing user.")
                continue
            txn = WalletTransaction.objects.create(
                user=user,
                amount=self._parse_decimal(row.get("amount")) or Decimal("0"),
                transaction_type=self._map_transaction_type(row.get("type")),
                bank_transaction_id=self._text(row.get("bank_trx_id")),
                invoice_number=self._text(row.get("invoice_no")),
                payment_method=self._text(row.get("payment_method")),
            )
            self._update_timestamps(WalletTransaction, txn.pk, row)
            self._remember("transactions", row.get("id"), txn)

        for row in self.dump.rows("orders"):
            user = self._resolve("users", row.get("user_id"))
            if not user:
                self._skip("orders", f"Order {row.get('id')} references missing user.")
                continue
            assessment = self._resolve("assessments", row.get("assessment_id")) if row.get("assessment_id") else None
            order = Order.objects.create(
                user=user,
                assessment=assessment,
                order_number=self._text(row.get("order_id")) or f"legacy-order-{row.get('id')}",
                delivery_status=self._map_delivery_status(row.get("delivery_status"), row.get("payment_status")),
                payment_status=self._map_payment_status(row.get("payment_status")),
                payment_method=self._text(row.get("payment_method")),
                subtotal=self._parse_decimal(row.get("sub_total")) or Decimal("0"),
                total=self._parse_decimal(row.get("total")) or Decimal("0"),
                bank_transaction_id=self._text(row.get("bank_trx_id")),
                invoice_number=self._text(row.get("invoice_no")),
            )
            self._update_timestamps(Order, order.pk, row)
            self._remember("orders", row.get("id"), order)

        for row in self.dump.rows("accounts"):
            user = self._resolve("users", row.get("user_id"))
            assessment = self._resolve("assessments", row.get("assessment_id"))
            if not user or not assessment or (row.get("type") or "").lower() != "profit_amount":
                self._skip("accounts", f"Account row {row.get('id')} could not be mapped to a settlement.")
                continue
            settlement = AssessmentSettlement.objects.create(
                assessment=assessment,
                consultant=user,
                order=None,
                gross_amount=self._parse_decimal(row.get("amount")) or Decimal("0"),
                net_amount=self._parse_decimal(row.get("amount")) or Decimal("0"),
                hold_until=self._parse_datetime(row.get("created_at")) or timezone.now(),
                status=SettlementStatus.RELEASED,
                released_at=self._parse_datetime(row.get("updated_at")) or self._parse_datetime(row.get("created_at")),
            )
            self._update_timestamps(AssessmentSettlement, settlement.pk, row)
            self._remember("accounts", row.get("id"), settlement)

        for row in self.dump.rows("withdrawal_transactions"):
            consultant = self._resolve("users", row.get("consultant_id"))
            if not consultant:
                self._skip("withdrawal_transactions", f"Withdrawal {row.get('id')} references missing consultant.")
                continue
            payout_method = self._get_or_create_payout_method_from_row(consultant, row)
            withdrawal = WithdrawalRequest.objects.create(
                consultant=consultant,
                payout_method=payout_method,
                amount=self._parse_decimal(row.get("amount")) or Decimal("0"),
                status=self._map_withdrawal_status(row.get("transaction_status")),
                notes=self._text(row.get("notes")),
                transaction_reference=self._text(row.get("transaction_id")),
            )
            self._update_timestamps(WithdrawalRequest, withdrawal.pk, row)
            self._remember("withdrawal_transactions", row.get("id"), withdrawal)

    def _pass_courses_and_enrollment(self) -> None:
        for row in self.dump.rows("course_order"):
            user = self._resolve("users", row.get("user_id"))
            training = self._resolve("trainings", row.get("coures_id"))
            if not user or not training:
                self._skip("course_order", f"Course order {row.get('id')} could not resolve user/training.")
                continue
            order = CourseOrder.objects.create(
                user=user,
                training=training,
                price=self._parse_decimal(row.get("price")) or Decimal("0"),
                order_number=self._text(row.get("order_id")) or f"legacy-course-order-{row.get('id')}",
                bank_transaction_id=self._text(row.get("bank_trx_id")),
                invoice_number=self._text(row.get("invoice_no")),
                payment_method=self._text(row.get("payment_method")),
                payment_status=self._map_payment_status(row.get("payment_status")),
            )
            self._update_timestamps(CourseOrder, order.pk, row)
            self._remember("course_order", row.get("id"), order)

        for row in self.dump.rows("course_enrollment"):
            user = self._resolve("users", row.get("user_id"))
            training = self._resolve("trainings", row.get("coures_id"))
            if not user or not training:
                self._skip("course_enrollment", f"Course enrollment {row.get('id')} could not resolve user/training.")
                continue
            enrollment = CourseEnrollment.objects.create(
                user=user,
                training=training,
                access_enabled=self._truthy(row.get("access_status"), truthy_values={"enable", "enabled", "1", "true"}),
                enrollment_type=(self._text(row.get("type")) or "paid").lower(),
                deadline=self._parse_date(row.get("deadline")),
            )
            self._update_timestamps(CourseEnrollment, enrollment.pk, row)
            self._remember("course_enrollment", row.get("id"), enrollment)

    def _pass_conditional_noop_passes(self) -> None:
        if not any(table.startswith("agency") for table in self.dump.discovered_tables):
            self._warn("Agency import skipped because no agency tables were found in the supplied dump.", "agencies")
        if not any(table in {"student_post", "post_quotation"} for table in self.dump.discovered_tables):
            self._warn("Marketplace import skipped because no marketplace tables were found in the supplied dump.", "marketplace")

    def _remember(self, source_table: str, source_pk: Any, obj: Any) -> None:
        source_key = self._stringify_pk(source_pk)
        if source_key is None:
            return
        self.object_cache[(source_table, source_key)] = obj
        self._created(source_table)
        if self.run_record:
            LegacyImportMap.objects.create(
                run=self.run_record,
                source_table=source_table,
                source_pk=source_key,
                target_app_label=obj._meta.app_label,
                target_model=obj._meta.model_name,
                target_pk=obj.pk,
            )

    def _resolve(self, source_table: str, source_pk: Any):
        source_key = self._stringify_pk(source_pk)
        if source_key is None:
            return None
        cached = self.object_cache.get((source_table, source_key))
        if cached is not None:
            return cached
        if self.run_record:
            mapping = LegacyImportMap.objects.filter(
                run=self.run_record,
                source_table=source_table,
                source_pk=source_key,
            ).first()
            if mapping:
                model = django_apps.get_model(mapping.target_app_label, mapping.target_model)
                obj = model.objects.filter(pk=mapping.target_pk).first()
                if obj is not None:
                    self.object_cache[(source_table, source_key)] = obj
                return obj
        return None

    def _resolve_country(self, value: str | None):
        if not value:
            return None
        mapping = self._resolve("country", value)
        if mapping:
            return mapping
        normalized = self._normalize_name(value)
        for country in Country.objects.all():
            if self._normalize_name(country.name) == normalized:
                return country
        if self.options.strict:
            return None
        country = Country.objects.create(
            name=str(value).strip(),
            slug=self._unique_slug(Country, value),
            status=ActiveStatus.ACTIVE,
        )
        self._warn(f"Created fallback country for legacy value {value!r}.", "country")
        return country

    def _resolve_study_level(self, value: str | None):
        if not value:
            return None
        mapping = self._resolve("study_level", value)
        if mapping:
            return mapping
        normalized = self._normalize_name(value)
        for level in StudyLevel.objects.all():
            if self._normalize_name(level.name) == normalized:
                return level
        level = StudyLevel.objects.create(
            name=str(value).strip(),
            slug=self._unique_slug(StudyLevel, value),
            status=ActiveStatus.ACTIVE,
        )
        self._warn(f"Created fallback study level for legacy value {value!r}.", "study_level")
        return level

    def _get_or_create_payout_method_from_row(self, consultant, row: dict[str, str | None]):
        method_type = self._map_payout_method(row.get("payment_method") or row.get("account_type"))
        defaults = {
            "method_type": method_type,
            "account_holder_name": self._text(row.get("account_holder_name")) or consultant.first_name or consultant.email,
            "email_address": self._fallback_optional_email(row.get("email_address")),
            "phone_number": self._text(row.get("phone_number")),
            "mobile_bank_type": self._text(row.get("mobile_bank_type")),
            "mobile_bank_number": self._text(row.get("mobile_bank_number")),
            "bank_name": self._text(row.get("bank_name")),
            "account_number": self._text(row.get("account_number")),
            "branch_name": self._text(row.get("branch_name")),
            "routing_number": self._text(row.get("routing_number")),
        }
        return ConsultantPayoutMethod.objects.filter(
            consultant=consultant,
            method_type=method_type,
            account_holder_name=defaults["account_holder_name"],
            account_number=defaults["account_number"],
            mobile_bank_number=defaults["mobile_bank_number"],
        ).first() or ConsultantPayoutMethod.objects.create(consultant=consultant, **defaults)

    def _attach_file(self, instance, field_name: str, source_value: str | None, table: str, source_pk: Any) -> None:
        if self.options.skip_media or not source_value:
            return
        source_path = self._resolve_media_source(source_value)
        if source_path is None:
            self._warn(
                f"Missing media for {table}:{source_pk} field {field_name} -> {source_value}",
                table,
            )
            return
        with source_path.open("rb") as file_handle:
            getattr(instance, field_name).save(source_path.name, File(file_handle), save=False)

    def _resolve_media_source(self, source_value: str) -> Path | None:
        clean_value = source_value.strip().lstrip("/")
        candidates = [
            self.options.media_root / clean_value,
            self.options.media_root.parent / clean_value,
            self.options.media_root / "storage" / clean_value.removeprefix("storage/"),
        ]
        for candidate in candidates:
            if candidate.exists() and candidate.is_file():
                return candidate
        return None

    def _wrap_legacy_password(self, raw_hash: str | None) -> str:
        if raw_hash:
            return self.password_hasher.encode_legacy_hash(raw_hash)
        return make_password(None)

    def _unique_slug(self, model, value: str | None) -> str:
        base = slugify(value or "legacy")
        slug = base or "legacy"
        suffix = 1
        while model.objects.filter(slug=slug).exists():
            suffix += 1
            slug = f"{base}-{suffix}" if base else f"legacy-{suffix}"
        return slug

    def _update_timestamps(self, model, pk: Any, row: dict[str, str | None], extra_updates: dict[str, Any] | None = None) -> None:
        updates: dict[str, Any] = extra_updates.copy() if extra_updates else {}
        created_at = self._parse_datetime(row.get("created_at"))
        updated_at = self._parse_datetime(row.get("updated_at"))
        if created_at is not None and "created_at" in {field.name for field in model._meta.fields}:
            updates["created_at"] = created_at
        if updated_at is not None and "updated_at" in {field.name for field in model._meta.fields}:
            updates["updated_at"] = updated_at
        if updates:
            model.objects.filter(pk=pk).update(**updates)

    def _normalize_name(self, value: str | None) -> str:
        if not value:
            return ""
        return re.sub(r"\s+", " ", str(value).strip()).casefold()

    def _text(self, value: str | None) -> str:
        return (value or "").strip()

    def _fallback_optional_email(self, value: str | None) -> str:
        email = self._text(value)
        return email if "@" in email else ""

    def _fallback_email(self, value: str | None, prefix: str, source_pk: Any) -> str:
        email = self._text(value)
        if email and "@" in email:
            return email
        fallback = f"legacy-{prefix}-{source_pk}@import.local"
        self._warn(f"Generated fallback email {fallback} for {prefix}:{source_pk}.")
        return fallback

    def _parse_int(self, value: str | None) -> int | None:
        if value in (None, ""):
            return None
        try:
            return int(str(value).strip())
        except (TypeError, ValueError):
            return None

    def _parse_decimal(self, value: str | None) -> Decimal | None:
        if value in (None, ""):
            return None
        try:
            return Decimal(str(value).strip())
        except (InvalidOperation, TypeError, ValueError):
            return None

    def _parse_date(self, value: str | None) -> date | None:
        if value in (None, ""):
            return None
        raw = str(value).strip()
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M:%S"):
            try:
                parsed = datetime.strptime(raw, fmt)
                return parsed.date()
            except ValueError:
                continue
        return None

    def _parse_datetime(self, value: str | None) -> datetime | None:
        if value in (None, ""):
            return None
        raw = str(value).strip()
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
            try:
                parsed = datetime.strptime(raw, fmt)
                if fmt == "%Y-%m-%d":
                    parsed = datetime.combine(parsed.date(), time.min)
                return timezone.make_aware(parsed, timezone.get_current_timezone())
            except ValueError:
                continue
        return None

    def _split_name(self, value: str | None) -> tuple[str, str]:
        name = self._text(value)
        if not name:
            return "", ""
        parts = name.split(maxsplit=1)
        return parts[0], parts[1] if len(parts) > 1 else ""

    def _map_user_role(self, value: str | None) -> str:
        normalized = self._normalize_name(value)
        if normalized == "consultant":
            return UserRole.CONSULTANT
        if normalized == "agency":
            return UserRole.AGENCY
        if normalized == "admin":
            return UserRole.ADMIN
        return UserRole.STUDENT

    def _map_verification_status(self, value: str | None) -> str:
        normalized = self._normalize_name(value).replace("-", "_").replace(" ", "_")
        mapping = {
            "pending": VerificationStatus.PENDING,
            "non_verified": VerificationStatus.PENDING,
            "in_progress": VerificationStatus.IN_PROGRESS,
            "accepted": VerificationStatus.ACCEPTED,
            "verified": VerificationStatus.ACCEPTED,
            "rejected": VerificationStatus.REJECTED,
        }
        return mapping.get(normalized, VerificationStatus.PENDING)

    def _map_subscription_status(self, value: str | None) -> str:
        return SubscriptionStatus.PRO if self._truthy(value) else SubscriptionStatus.NONE

    def _map_active_status(self, value: str | None, consultant: bool = False) -> str:
        normalized = self._normalize_name(value)
        if consultant:
            return ConsultantStatus.DISABLED if normalized in {"disable", "disabled", "inactive", "in_active"} else ConsultantStatus.ACTIVE
        return ActiveStatus.DISABLED if normalized in {"disable", "disabled", "inactive", "in_active"} else ActiveStatus.ACTIVE

    def _map_academic_track(self, value: str | None) -> str:
        normalized = self._normalize_name(value).replace("-", "_")
        mapping = {
            "bangla": "bangla",
            "english": "english",
            "madrasa": "madrasa",
            "post_graduate": "post_graduate",
        }
        return mapping.get(normalized, "")

    def _map_assessment_status(self, value: str | None) -> str:
        normalized = self._normalize_name(value)
        mapping = {
            "draft": AssessmentStatus.DRAFT,
            "pending": AssessmentStatus.PENDING,
            "accepted": AssessmentStatus.ACCEPTED,
            "submitted": AssessmentStatus.SUBMITTED,
            "approved": AssessmentStatus.APPROVED,
            "completed": AssessmentStatus.COMPLETED,
            "rejected": AssessmentStatus.REJECTED,
        }
        return mapping.get(normalized, AssessmentStatus.PENDING)

    def _map_report_submission_status(self, value: str | None) -> str:
        normalized = self._normalize_name(value)
        mapping = {
            "draft": ReportSubmissionStatus.DRAFT,
            "submitted": ReportSubmissionStatus.SUBMITTED,
            "revision_requested": ReportSubmissionStatus.REVISION_REQUESTED,
            "revision requested": ReportSubmissionStatus.REVISION_REQUESTED,
        }
        return mapping.get(normalized, ReportSubmissionStatus.SUBMITTED if normalized else ReportSubmissionStatus.DRAFT)

    def _map_transaction_type(self, value: str | None) -> str:
        return TransactionType.CASH_OUT if self._normalize_name(value) in {"cash_out", "cash-out"} else TransactionType.CASH_IN

    def _map_payout_method(self, value: str | None) -> str:
        normalized = self._normalize_name(value)
        return PayoutMethodType.BANK if normalized in {"bank_account", "bank account"} else PayoutMethodType.MOBILE

    def _map_withdrawal_status(self, value: str | None) -> str:
        normalized = self._normalize_name(value)
        if normalized == "completed":
            return WithdrawalStatus.COMPLETED
        if normalized == "rejected":
            return WithdrawalStatus.REJECTED
        return WithdrawalStatus.PENDING

    def _map_payment_status(self, value: str | None) -> str:
        normalized = self._normalize_name(value)
        if normalized == "success":
            return PaymentStatus.SUCCESS
        if normalized == "paid":
            return PaymentStatus.PAID
        return PaymentStatus.UNPAID

    def _map_delivery_status(self, delivery_status: str | None, payment_status: str | None) -> str:
        normalized = self._normalize_name(delivery_status)
        if normalized in {"confirmed", "in_progress", "delivered"}:
            return normalized
        payment = self._map_payment_status(payment_status)
        return DeliveryStatus.DELIVERED if payment in {PaymentStatus.PAID, PaymentStatus.SUCCESS} else DeliveryStatus.PENDING

    def _map_class_schedule_status(self, value: str | None) -> str:
        normalized = self._normalize_name(value)
        if normalized == "completed":
            return "completed"
        if normalized in {"in_active", "inactive", "disabled"}:
            return "inactive"
        return "active"

    def _truthy(self, value: str | None, truthy_values: set[str] | None = None) -> bool:
        normalized = self._normalize_name(value)
        return normalized in (truthy_values or {"1", "true", "yes", "y", "on", "active", "paid", "pro"})

    def _to_list(self, value: str | None) -> list[str]:
        if value in (None, ""):
            return []
        raw = str(value).strip()
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                if isinstance(parsed, list):
                    return [str(item).strip() for item in parsed if str(item).strip()]
            except json.JSONDecodeError:
                pass
        separators = [",", "\n", "\r"]
        for separator in separators:
            if separator in raw:
                return [item.strip() for item in re.split(r"[\r\n,]+", raw) if item.strip()]
        return [raw]

    def _created(self, table: str) -> None:
        if table not in self.report["tables"]:
            self.report["tables"][table] = {"source_rows": 0, "created": 0, "skipped": 0, "warnings": 0, "errors": 0}
        self.report["tables"][table]["created"] += 1

    def _skip(self, table: str, message: str) -> None:
        if table not in self.report["tables"]:
            self.report["tables"][table] = {"source_rows": 0, "created": 0, "skipped": 0, "warnings": 0, "errors": 0}
        self.report["tables"][table]["skipped"] += 1
        if self.options.strict:
            self.report["tables"][table]["errors"] += 1
            raise CommandError(message)
        self._warn(message, table)

    def _warn(self, message: str, table: str | None = None) -> None:
        self.report["warnings"].append(message)
        if table:
            if table not in self.report["tables"]:
                self.report["tables"][table] = {"source_rows": 0, "created": 0, "skipped": 0, "warnings": 0, "errors": 0}
            self.report["tables"][table]["warnings"] += 1

    def _stringify_pk(self, value: Any) -> str | None:
        if value in (None, ""):
            return None
        return str(value)
