from datetime import timedelta

from django.contrib.auth import login
from django.db import OperationalError, ProgrammingError
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.api.serializers import validate_password_complexity
from apps.accounts.models import OTPVerification, User, UserRole, VerificationRequest
from apps.admin_portal.api.serializers import (
    ADMIN_RESOURCE_MODELS,
    ADMIN_RESOURCE_SERIALIZERS,
    AdminInvitationSerializer,
    AdminLoginSerializer,
    AdminUserSerializer,
    ModerationIncidentSerializer,
    VerificationRequestSerializer,
)
from apps.assessments.api.serializers import AssessmentReportSerializer
from apps.assessments.models import AssessmentReport, AssessmentReportSnapshot, ServiceChargeRule
from apps.assessments.pdf import serialize_university
from apps.assessments.reporting import normalize_report_content
from apps.admin_portal.models import AdminInvitation, ClassSchedule, ModerationIncident
from apps.catalog.models import Country, Course, EducationalInfo, ServiceCategory, StudyLevel, University
from apps.consultants.models import ConsultantService, ProPackage, Training
from apps.content.models import CompanyDetail, ContactSubmission, SiteSetting, Slider, Testimonial
from apps.payments.models import CourseOrder, Order, RefundRequest, WalletTransaction, WithdrawalRequest
from apps.students.models import StudyAbroadLead
from common.services.otp import OTPService
from common.permissions.roles import IsAdmin


def safe_count(model):
    try:
        return model.objects.count()
    except (ProgrammingError, OperationalError):
        return 0


def safe_recent(queryset, limit=5):
    try:
        return list(queryset[:limit])
    except (ProgrammingError, OperationalError):
        return []


def safe_monthly_counts(model, date_field="created_at"):
    try:
        monthly = [0] * 12
        values = (
            model.objects.extra(select={"month": f"MONTH({date_field})"})
            .values("month")
            .order_by("month")
        )
        for item in values:
            month = item.get("month")
            if month:
                monthly[int(month) - 1] += 1
        return monthly
    except (ProgrammingError, OperationalError):
        return [0] * 12


class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = AdminLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        login(request, user)
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)


class AdminRegisterStartView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get("invitation_token", "").strip()
        invitation = AdminInvitation.objects.filter(token=token).first()
        if not invitation or invitation.is_expired() or invitation.accepted_at:
            raise ValidationError("Invalid or expired invitation.")
        email = (request.data.get("email") or invitation.email).strip().lower()
        if email != invitation.email.lower():
            raise ValidationError({"email": "This invitation is only valid for the invited email address."})
        password = request.data.get("password", "")
        validate_password_complexity(password)
        OTPVerification.objects.filter(email=email, purpose="admin_registration").delete()
        code = OTPService.generate_code()
        OTPVerification.objects.create(
            email=email,
            code=code,
            purpose="admin_registration",
            payload={
                "email": email,
                "password": password,
                "first_name": request.data.get("first_name", ""),
                "last_name": request.data.get("last_name", ""),
                "phone": request.data.get("phone", ""),
                "invitation_token": token,
            },
            expires_at=timezone.now() + timedelta(minutes=1),
        )
        OTPService.send_email_otp(email, code)
        return Response({"message": "Admin OTP sent."}, status=status.HTTP_200_OK)


class AdminRegisterVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        code = request.data.get("code", "").strip()
        otp = (
            OTPVerification.objects.filter(
                email=email,
                code=code,
                purpose="admin_registration",
                consumed_at__isnull=True,
            )
            .order_by("-created_at")
            .first()
        )
        if not otp or otp.expires_at < timezone.now():
            raise ValidationError("Invalid or expired OTP.")
        invitation = AdminInvitation.objects.filter(token=otp.payload.get("invitation_token")).first()
        if not invitation or invitation.is_expired() or invitation.accepted_at:
            raise ValidationError("Invitation is no longer valid.")
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": otp.payload.get("first_name", ""),
                "last_name": otp.payload.get("last_name", ""),
                "phone": otp.payload.get("phone", ""),
                "role": UserRole.ADMIN,
                "is_staff": True,
            },
        )
        user.role = UserRole.ADMIN
        user.is_staff = True
        user.set_password(otp.payload["password"])
        user.save()
        invitation.accepted_at = timezone.now()
        invitation.save(update_fields=["accepted_at", "updated_at"])
        otp.consumed_at = timezone.now()
        otp.save(update_fields=["consumed_at"])
        login(request, user)
        return Response(AdminUserSerializer(user).data, status=status.HTTP_200_OK)


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        recent_contacts = safe_recent(ContactSubmission.objects.order_by("-created_at"), limit=5)
        recent_verifications = safe_recent(
            VerificationRequest.objects.select_related("user").order_by("-created_at"),
            limit=5,
        )
        recent_withdrawals = safe_recent(
            WithdrawalRequest.objects.select_related("consultant").order_by("-created_at"),
            limit=5,
        )

        return Response(
            {
                "dashboard_boxes": [
                    {
                        "title": "Message Request",
                        "value": safe_count(ContactSubmission),
                        "accent": "info",
                        "icon": "fa-solid fa-envelope-open-text",
                        "href": "/admin/contact",
                    },
                    {
                        "title": "Testimonials",
                        "value": safe_count(Testimonial),
                        "accent": "success",
                        "icon": "fa-solid fa-handshake",
                        "href": "/admin/testimonials",
                    },
                    {
                        "title": "Services",
                        "value": safe_count(ServiceCategory),
                        "accent": "warning",
                        "icon": "fa-solid fa-briefcase",
                        "href": "/admin/services",
                    },
                    {
                        "title": "Portfolios",
                        "value": safe_count(CompanyDetail),
                        "accent": "danger",
                        "icon": "fa-solid fa-address-card",
                        "href": "/admin/company-details",
                    },
                    {
                        "title": "All Blogs",
                        "value": safe_count(EducationalInfo),
                        "accent": "info",
                        "icon": "fa-solid fa-blog",
                        "href": "/admin/eduinfo",
                    },
                    {
                        "title": "All Brands",
                        "value": safe_count(Country),
                        "accent": "success",
                        "icon": "fa-brands fa-artstation",
                        "href": "/admin/country",
                    },
                    {
                        "title": "Teams",
                        "value": safe_count(User),
                        "accent": "warning",
                        "icon": "fa-solid fa-user-group",
                        "href": "/admin/user",
                    },
                    {
                        "title": "All Slider",
                        "value": safe_count(Slider),
                        "accent": "danger",
                        "icon": "fa-brands fa-slideshare",
                        "href": "/admin/slider",
                    },
                ],
                "chart_data": {
                    "labels": [
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                    ],
                    "contact_requests": safe_monthly_counts(ContactSubmission),
                    "testimonials": safe_monthly_counts(Testimonial),
                },
                "summary_cards": [
                    {
                        "title": "Contact Requests",
                        "value": safe_count(ContactSubmission),
                        "accent": "info",
                        "description": "Messages waiting for review from the public site.",
                    },
                    {
                        "title": "Testimonials",
                        "value": safe_count(Testimonial),
                        "accent": "success",
                        "description": "Testimonials visible across the marketing pages.",
                    },
                    {
                        "title": "Consultant Services",
                        "value": safe_count(ConsultantService),
                        "accent": "warning",
                        "description": "Live and draft consultancy offers across the platform.",
                    },
                    {
                        "title": "Hero Sliders",
                        "value": safe_count(Slider),
                        "accent": "danger",
                        "description": "Homepage hero slides and marketing banners.",
                    },
                ],
                "ops_cards": [
                    {
                        "title": "Pending Verification",
                        "value": VerificationRequest.objects.filter(status="pending").count(),
                        "description": "Consultants waiting for admin approval.",
                    },
                    {
                        "title": "Pending Withdrawals",
                        "value": WithdrawalRequest.objects.filter(status="pending").count(),
                        "description": "Consultant payout requests requiring action.",
                    },
                    {
                        "title": "Active Packages",
                        "value": ProPackage.objects.filter(status="active").count(),
                        "description": "Sellable consultant subscription packages.",
                    },
                    {
                        "title": "Training Catalog",
                        "value": safe_count(Training),
                        "description": "Courses and trainings available for purchase.",
                    },
                ],
                "catalog_snapshot": {
                    "countries": safe_count(Country),
                    "universities": safe_count(University),
                    "courses": safe_count(Course),
                    "study_levels": safe_count(StudyLevel),
                    "educational_info": safe_count(EducationalInfo),
                    "service_categories": safe_count(ServiceCategory),
                },
                "financial_snapshot": {
                    "wallet_transactions": safe_count(WalletTransaction),
                    "orders": safe_count(Order),
                    "course_orders": safe_count(CourseOrder),
                    "service_charge_rules": safe_count(ServiceChargeRule),
                },
                "content_snapshot": {
                    "company_details": safe_count(CompanyDetail),
                    "site_settings": safe_count(SiteSetting),
                    "student_queries": safe_count(StudyAbroadLead),
                    "class_schedules": safe_count(ClassSchedule),
                },
                "recent_contacts": [
                    {
                        "id": item.id,
                        "name": item.name,
                        "email": item.email,
                        "subject": item.subject,
                        "service_interest": item.service_interest,
                        "created_at": item.created_at,
                    }
                    for item in recent_contacts
                ],
                "recent_verifications": [
                    {
                        "id": item.id,
                        "user_id": item.user_id,
                        "name": f"{item.user.first_name} {item.user.last_name}".strip() or item.user.email,
                        "email": item.user.email,
                        "status": item.status,
                        "created_at": item.created_at,
                    }
                    for item in recent_verifications
                ],
                "recent_withdrawals": [
                    {
                        "id": item.id,
                        "consultant_id": item.consultant_id,
                        "name": f"{item.consultant.first_name} {item.consultant.last_name}".strip() or item.consultant.email,
                        "amount": item.amount,
                        "status": item.status,
                        "created_at": item.created_at,
                    }
                    for item in recent_withdrawals
                ],
            }
        )


class AdminManagedViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdmin]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    search_fields: tuple[str, ...] = tuple()
    ordering = ("-updated_at", "-created_at")

    def get_queryset(self):
        queryset = super().get_queryset()
        keyword = self.request.query_params.get("q", "").strip()
        if keyword and self.search_fields:
            query = Q()
            for field in self.search_fields:
                query |= Q(**{f"{field}__icontains": keyword})
            queryset = queryset.filter(query)
        return queryset.order_by(*self.ordering)


class AdminUserViewSet(AdminManagedViewSet):
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()
    search_fields = ("email", "first_name", "last_name", "phone", "role")
    ordering = ("-date_joined",)

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role")
        if role:
            queryset = queryset.filter(role=role)
        return queryset

    @action(detail=True, methods=["post"])
    def ban(self, request, pk=None):
        user = self.get_object()
        days = int(request.data.get("days", 60))
        user.is_banned = True
        user.banned_until = timezone.now() + timedelta(days=days)
        user.ban_reason = request.data.get("reason", "Contact-sharing violation.")
        user.save(update_fields=["is_banned", "banned_until", "ban_reason"])
        return Response(AdminUserSerializer(user, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def unban(self, request, pk=None):
        user = self.get_object()
        user.is_banned = False
        user.banned_until = None
        user.ban_reason = ""
        user.save(update_fields=["is_banned", "banned_until", "ban_reason"])
        return Response(AdminUserSerializer(user, context={"request": request}).data)


class VerificationRequestViewSet(AdminManagedViewSet):
    serializer_class = VerificationRequestSerializer
    queryset = VerificationRequest.objects.select_related("user").all()
    search_fields = ("user__email", "user__first_name", "user__last_name", "status", "notes")

    def perform_create(self, serializer):
        instance = serializer.save()
        instance.user.verification_status = instance.status
        instance.user.save(update_fields=["verification_status"])


class AdminInvitationViewSet(AdminManagedViewSet):
    serializer_class = AdminInvitationSerializer
    queryset = AdminInvitation.objects.select_related("invited_by").all()
    search_fields = ("email", "notes", "invited_by__email")

    def perform_create(self, serializer):
        serializer.save(invited_by=self.request.user)


class ModerationIncidentViewSet(AdminManagedViewSet):
    serializer_class = ModerationIncidentSerializer
    queryset = ModerationIncident.objects.select_related("reported_user", "reviewed_by").all()
    search_fields = ("reported_user__email", "source_type", "content_excerpt", "notes")

    def perform_update(self, serializer):
        serializer.save(reviewed_by=self.request.user)


class AssessmentReportAdminViewSet(AdminManagedViewSet):
    REQUIRED_QA_CHECKS = {
        "identity_verified",
        "required_sections_complete",
        "evidence_current",
        "recommendations_actionable",
        "limitations_declared",
    }
    serializer_class = AssessmentReportSerializer
    queryset = AssessmentReport.objects.select_related(
        "assessment",
        "assessment__consultant_service",
        "student",
        "consultant",
        "approved_by",
    ).prefetch_related(
        "assessment__consultant_service__service_categories",
        "assessment__recommended_universities",
    ).all()
    search_fields = ("assessment__assessment_title", "student__email", "consultant__email", "admin_approval_status")

    def _pending_snapshot(self, report):
        snapshot = report.snapshots.filter(admin_approval_status="pending").order_by("-version").first()
        if snapshot or report.schema_version >= 2:
            return snapshot
        return AssessmentReportSnapshot.objects.create(
            report=report,
            version=(report.snapshots.order_by("-version").values_list("version", flat=True).first() or 0) + 1,
            schema_version=report.schema_version,
            template_key=report.template_key or "dynamic_service_report",
            module_keys=report.module_keys or report.assessment.report_module_keys,
            content=normalize_report_content(
                report,
                report.module_keys or report.assessment.report_module_keys,
            ),
            recommended_universities=[
                serialize_university(item)
                for item in report.assessment.recommended_universities.order_by("-created_at")
            ],
            submitted_by=report.consultant,
        )

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        report = self.get_object()
        snapshot = self._pending_snapshot(report)
        if snapshot is None:
            raise ValidationError("No pending report snapshot is available for approval.")
        qa_checks = request.data.get("qa_checks") or {}
        missing_checks = [
            key
            for key in self.REQUIRED_QA_CHECKS
            if snapshot.schema_version >= 2 and qa_checks.get(key) is not True
        ]
        if missing_checks:
            raise ValidationError(
                {"qa_checks": f"Complete all QA checks before approval: {', '.join(sorted(missing_checks))}."}
            )
        now = timezone.now()
        snapshot.admin_approval_status = "approved"
        snapshot.reviewed_by = request.user
        snapshot.reviewed_at = now
        snapshot.qa_checks = qa_checks
        snapshot.review_notes = request.data.get("review_notes") or {}
        snapshot.save(
            update_fields=[
                "admin_approval_status",
                "reviewed_by",
                "reviewed_at",
                "qa_checks",
                "review_notes",
                "updated_at",
            ]
        )
        report.admin_approval_status = "approved"
        report.approved_by = request.user
        report.approved_at = now
        report.rejection_reason = ""
        report.submission_status = "submitted"
        report.save(
            update_fields=[
                "admin_approval_status",
                "approved_by",
                "approved_at",
                "rejection_reason",
                "submission_status",
                "updated_at",
            ]
        )
        report.assessment.status = "approved"
        report.assessment.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(report).data)

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        report = self.get_object()
        rejection_reason = str(request.data.get("rejection_reason", "")).strip()
        minimum_reason_length = 20 if report.schema_version >= 2 else 1
        if len(rejection_reason) < minimum_reason_length:
            raise ValidationError(
                {"rejection_reason": f"Provide a clear rejection reason of at least {minimum_reason_length} characters."}
            )
        snapshot = self._pending_snapshot(report)
        if snapshot is None:
            raise ValidationError("No pending report snapshot is available for rejection.")
        now = timezone.now()
        snapshot.admin_approval_status = "rejected"
        snapshot.reviewed_by = request.user
        snapshot.reviewed_at = now
        snapshot.qa_checks = request.data.get("qa_checks") or {}
        snapshot.review_notes = {
            **(request.data.get("review_notes") or {}),
            "rejection_reason": rejection_reason,
        }
        snapshot.save(
            update_fields=[
                "admin_approval_status",
                "reviewed_by",
                "reviewed_at",
                "qa_checks",
                "review_notes",
                "updated_at",
            ]
        )
        report.admin_approval_status = "rejected"
        report.approved_by = request.user
        report.approved_at = None
        report.rejection_reason = rejection_reason
        report.submission_status = "revision_requested"
        report.save(
            update_fields=[
                "admin_approval_status",
                "approved_by",
                "approved_at",
                "rejection_reason",
                "submission_status",
                "updated_at",
            ]
        )
        report.assessment.status = "revision_requested"
        report.assessment.save(update_fields=["status", "updated_at"])
        return Response(self.get_serializer(report).data)

    def perform_update(self, serializer):
        serializer.save()


def build_admin_resource_viewset(resource_key: str, search_fields: tuple[str, ...] = tuple()):
    model = ADMIN_RESOURCE_MODELS[resource_key]
    serializer_class = ADMIN_RESOURCE_SERIALIZERS[resource_key]
    queryset = model.objects.all()

    attrs = {
        "serializer_class": serializer_class,
        "queryset": queryset,
        "search_fields": search_fields,
    }

    return type(f"{model.__name__}AdminViewSet", (AdminManagedViewSet,), attrs)


SiteSettingAdminViewSet = build_admin_resource_viewset(
    "site-settings", ("company_name", "email", "phone", "address")
)
CompanyDetailAdminViewSet = build_admin_resource_viewset(
    "company-details", ("title", "subtitle", "slug", "description")
)
SliderAdminViewSet = build_admin_resource_viewset("sliders", ("title", "subtitle", "slug", "description"))
AboutSectionAdminViewSet = build_admin_resource_viewset("about-sections", ("title", "slug", "description"))
TestimonialAdminViewSet = build_admin_resource_viewset("testimonials", ("name", "designation", "description"))
FAQAdminViewSet = build_admin_resource_viewset("faqs", ("question", "answer"))
TermsDocumentAdminViewSet = build_admin_resource_viewset("terms-documents", ("title", "content"))
ContactSubmissionAdminViewSet = build_admin_resource_viewset(
    "contact-submissions", ("name", "email", "phone", "subject", "service_interest", "message")
)
StudyAbroadLeadAdminViewSet = build_admin_resource_viewset(
    "study-abroad-leads",
    ("name", "email", "phone", "last_education_title", "last_education_result", "ielts_score", "interest_for", "note"),
)
ServiceCategoryAdminViewSet = build_admin_resource_viewset("service-categories", ("name", "description", "status"))
CountryAdminViewSet = build_admin_resource_viewset("countries", ("name", "slug", "status"))
CityAdminViewSet = build_admin_resource_viewset("cities", ("name", "slug", "country__name", "status"))
UniversityAdminViewSet = build_admin_resource_viewset("universities", ("name", "slug", "status"))
CourseAdminViewSet = build_admin_resource_viewset("courses", ("name", "slug", "status"))
StudyLevelAdminViewSet = build_admin_resource_viewset("study-levels", ("name", "slug", "status"))
EducationalInfoAdminViewSet = build_admin_resource_viewset(
    "educational-info",
    ("title", "institution_name", "location", "course_name", "description", "status"),
)
EducationalPageContentAdminViewSet = build_admin_resource_viewset(
    "educational-page-contents", ("headline", "head_description", "living_cost", "academic_intake", "deadline")
)
WhyThisCountryPointAdminViewSet = build_admin_resource_viewset(
    "why-country-points", ("point", "point_detail", "source_link")
)
ProgramDurationAdminViewSet = build_admin_resource_viewset("program-durations", ("program_name", "duration"))
TopUniversityAdminViewSet = build_admin_resource_viewset(
    "top-universities", ("institution", "short_description", "ranking", "number_of_students")
)
VisaChecklistItemAdminViewSet = build_admin_resource_viewset("visa-checklist-items", ("text",))
CountryFAQAdminViewSet = build_admin_resource_viewset("country-faqs", ("question", "answer"))
ScholarshipItemAdminViewSet = build_admin_resource_viewset("scholarship-items", ("text",))
SubjectAdminViewSet = build_admin_resource_viewset("subjects", ("name",))
TrainingAdminViewSet = build_admin_resource_viewset(
    "trainings", ("title", "training_type", "organization", "language", "description", "status")
)
ConsultantServiceAdminViewSet = build_admin_resource_viewset(
    "consultant-services", ("title", "description", "duration", "status")
)
ProPackageAdminViewSet = build_admin_resource_viewset(
    "pro-packages", ("name", "level", "description", "status")
)
ProSubscriptionAdminViewSet = build_admin_resource_viewset("pro-subscriptions",)
ServiceChargeRuleAdminViewSet = build_admin_resource_viewset(
    "service-charge-rules", ("role_tier",)
)
AssessmentProposalAdminViewSet = build_admin_resource_viewset(
    "assessment-proposals", ("assessment__assessment_title", "consultant__email", "status", "message")
)
ReviewRequestAdminViewSet = build_admin_resource_viewset(
    "review-requests", ("assessment__assessment_title", "student__email", "consultant__email", "status", "reason")
)
RefundRequestAdminViewSet = build_admin_resource_viewset(
    "refund-requests", ("assessment__assessment_title", "requested_by__email", "status", "reason")
)
SettlementAdminViewSet = build_admin_resource_viewset(
    "settlements", ("assessment__assessment_title", "consultant__email", "status")
)
ClassScheduleAdminViewSet = build_admin_resource_viewset(
    "class-schedules", ("name", "link", "status")
)
WalletTransactionAdminViewSet = build_admin_resource_viewset(
    "wallet-transactions", ("bank_transaction_id", "invoice_number", "payment_method", "gateway_reference")
)
WithdrawalAdminViewSet = build_admin_resource_viewset(
    "withdrawals", ("transaction_reference", "status", "notes")
)
OrderAdminViewSet = build_admin_resource_viewset(
    "orders", ("order_number", "delivery_status", "payment_status", "payment_method", "invoice_number")
)
CourseOrderAdminViewSet = build_admin_resource_viewset(
    "course-orders", ("order_number", "payment_status", "payment_method", "invoice_number")
)
