from datetime import timedelta
from decimal import Decimal

from django.db import transaction
from django.db.models import Max
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.assessments.api.serializers import (
    AssessmentProposalSerializer,
    AssessmentReportSerializer,
    AssessmentSerializer,
    RecommendedUniversitySerializer,
    ReviewSerializer,
    ReviewRequestSerializer,
    ServiceChargeRuleSerializer,
)
from apps.assessments.models import (
    Assessment,
    AssessmentProposal,
    AssessmentReport,
    AssessmentReportSnapshot,
    AssessmentStatus,
    ProposalStatus,
    RecommendedUniversity,
    Review,
    ReviewRequest,
    ServiceChargeRule,
)
from apps.assessments.reporting import (
    build_deadline,
    build_report_preview,
    get_module_definitions,
    normalize_report_content,
    render_report_html,
    resolve_report_blueprint,
    should_show_recommended_universities,
    sync_legacy_fields_from_content,
)
from apps.assessments.pdf import render_pdf_bytes, render_professional_report_html, serialize_university
from apps.assessments.reporting_v2 import (
    SCHEMA_VERSION,
    TEMPLATE_KEY,
    normalize_content_v2,
    report_number,
    validate_content_v2,
)
from apps.payments.models import AssessmentSettlement
from common.services.moderation import ModerationService
from common.permissions.roles import IsConsultant, IsStudent


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action == "create":
            return [IsStudent()]
        if self.action in {"update", "partial_update"}:
            return [permissions.IsAuthenticated()]
        if self.action == "accept_report":
            return [IsStudent()]
        if self.action in {"accept_request", "reject_request"}:
            return [IsConsultant()]
        if self.action in {"create_proposal", "create_review_request"}:
            return [permissions.IsAuthenticated()]
        if self.action == "accept_proposal":
            return [IsStudent()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = Assessment.objects.select_related(
            "student",
            "consultant",
            "consultant_service",
            "assessment_country",
            "preferred_country",
            "report",
        )
        if user.role == "student":
            return queryset.filter(student=user)
        if user.role == "consultant":
            return queryset.filter(consultant=user)
        if user.role == "admin":
            return queryset
        return queryset.filter(student=user) | queryset.filter(consultant=user)

    def perform_create(self, serializer):
        service = serializer.validated_data["consultant_service"]
        try:
            ModerationService.flag_and_raise(
                user=self.request.user,
                source_type="assessment",
                text=serializer.validated_data.get("assessment_description", ""),
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        serializer.save(
            student=self.request.user,
            consultant=service.consultant,
            assessment_country=service.country,
            assessment_charge=serializer.validated_data.get("assessment_charge") or service.price,
            assessment_duration=serializer.validated_data.get("assessment_duration") or service.duration,
            assessment_title=serializer.validated_data.get("assessment_title") or service.title,
            **resolve_report_blueprint([item.name for item in service.service_categories.all()]),
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user
        if user.role == "consultant" and instance.consultant_id != user.id:
            raise PermissionDenied("You cannot update another consultant's assessment.")
        if user.role == "student" and instance.student_id != user.id:
            raise PermissionDenied("You cannot update another student's assessment.")
        serializer.save()

    @action(detail=True, methods=["post"], url_path="proposals")
    def create_proposal(self, request, pk=None):
        assessment = self.get_object()
        if request.user.role != "consultant" or assessment.consultant_id != request.user.id:
            raise PermissionDenied("Only the assigned consultant can create proposals.")
        serializer = AssessmentProposalSerializer(
            data={**request.data, "assessment_id": assessment.id},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        AssessmentProposal.objects.filter(
            assessment=assessment, status=ProposalStatus.PENDING
        ).update(status=ProposalStatus.EXPIRED)
        proposal = serializer.save(consultant=request.user)
        assessment.status = AssessmentStatus.PROPOSAL_PENDING
        assessment.save(update_fields=["status", "updated_at"])
        return Response(AssessmentProposalSerializer(proposal, context={"request": request}).data, status=201)

    @action(detail=True, methods=["post"], url_path=r"proposals/(?P<proposal_id>[^/.]+)/accept")
    def accept_proposal(self, request, pk=None, proposal_id=None):
        assessment = self.get_object()
        if assessment.student_id != request.user.id:
            raise PermissionDenied("Only the student can accept a proposal.")
        proposal = assessment.proposals.filter(id=proposal_id).first()
        if not proposal:
            raise ValidationError("Proposal not found.")
        proposal.status = ProposalStatus.ACCEPTED
        proposal.save(update_fields=["status", "updated_at"])
        assessment.assessment_charge = proposal.proposed_charge
        assessment.assessment_duration = proposal.proposed_duration
        assessment.status = AssessmentStatus.ACCEPTED
        assessment.save(update_fields=["assessment_charge", "assessment_duration", "status", "updated_at"])
        assessment.proposals.exclude(id=proposal.id).filter(status=ProposalStatus.PENDING).update(
            status=ProposalStatus.REJECTED
        )
        return Response(AssessmentSerializer(assessment, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="accept-report")
    def accept_report(self, request, pk=None):
        assessment = self.get_object()
        if assessment.student_id != request.user.id:
            raise PermissionDenied("Only the student can accept a report.")
        if not hasattr(assessment, "report"):
            raise ValidationError("No report has been submitted yet.")
        report = assessment.report
        if report.admin_approval_status != "approved":
            raise ValidationError("The report must be approved by an admin first.")
        report.student_accepted_at = timezone.now()
        report.save(update_fields=["student_accepted_at", "updated_at"])
        assessment.status = AssessmentStatus.COMPLETED
        assessment.save(update_fields=["status", "updated_at"])
        order = getattr(assessment, "order", None)
        gross_amount = Decimal(str(order.total if order else assessment.assessment_charge or "0"))
        commission_rule = assessment.consultant_service.service_categories.first()
        commission = Decimal("0")
        if commission_rule:
            charge_rule = commission_rule.service_charge_rules.order_by("-created_at").first()
            if charge_rule:
                commission = Decimal(str(charge_rule.commission or "0"))
        net_amount = gross_amount - commission
        if net_amount < 0:
            net_amount = Decimal("0")
        AssessmentSettlement.objects.update_or_create(
            assessment=assessment,
            defaults={
                "consultant": assessment.consultant,
                "order": order,
                "gross_amount": gross_amount,
                "net_amount": net_amount,
                "hold_until": timezone.now() + timedelta(days=15),
                "status": "holding",
            },
        )
        return Response(AssessmentSerializer(assessment, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="accept")
    def accept_request(self, request, pk=None):
        assessment = self.get_object()
        if assessment.consultant_id != request.user.id:
            raise PermissionDenied("Only the assigned consultant can accept this request.")
        if assessment.status != AssessmentStatus.PENDING:
            raise ValidationError("Only pending requests can be accepted.")

        accepted_at = timezone.now()
        assessment.accepted_at = accepted_at
        assessment.deadline_at = build_deadline(assessment.assessment_duration, accepted_at)
        assessment.status = AssessmentStatus.ACCEPTED
        assessment.save(update_fields=["accepted_at", "deadline_at", "status", "updated_at"])
        return Response(AssessmentSerializer(assessment, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject_request(self, request, pk=None):
        assessment = self.get_object()
        if assessment.consultant_id != request.user.id:
            raise PermissionDenied("Only the assigned consultant can reject this request.")
        if assessment.status != AssessmentStatus.PENDING:
            raise ValidationError("Only pending requests can be rejected.")

        assessment.status = AssessmentStatus.REJECTED
        assessment.save(update_fields=["status", "updated_at"])
        return Response(AssessmentSerializer(assessment, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="review-requests")
    def create_review_request(self, request, pk=None):
        assessment = self.get_object()
        if assessment.student_id != request.user.id:
            raise PermissionDenied("Only the student can request a revision.")
        serializer = ReviewRequestSerializer(
            data={**request.data, "assessment_id": assessment.id},
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        review_request = serializer.save(
            student=request.user,
            consultant=assessment.consultant,
            report=getattr(assessment, "report", None),
        )
        assessment.status = AssessmentStatus.REVISION_REQUESTED
        assessment.save(update_fields=["status", "updated_at"])
        if hasattr(assessment, "report"):
            assessment.report.submission_status = "revision_requested"
            assessment.report.save(update_fields=["submission_status", "updated_at"])
        return Response(ReviewRequestSerializer(review_request).data, status=201)

    @action(detail=True, methods=["get"], url_path="report-workspace")
    def report_workspace(self, request, pk=None):
        assessment = self.get_object()
        report = getattr(assessment, "report", None)
        module_keys = assessment.report_module_keys or resolve_report_blueprint(
            assessment.requested_service_categories
            or [item.name for item in assessment.consultant_service.service_categories.all()]
        )["report_module_keys"]
        schema_version = report.schema_version if report else SCHEMA_VERSION
        show_recommended_universities = should_show_recommended_universities(module_keys)
        normalized_content = (
            normalize_report_content(report, module_keys)
            if report
            else normalize_content_v2({}, module_keys)
        )
        recommended_universities = assessment.recommended_universities.order_by("-created_at")
        student_profile = getattr(assessment.student, "student_profile", None)
        approved_snapshot = (
            report.snapshots.filter(admin_approval_status="approved").order_by("-version").first()
            if report
            else None
        )
        student_can_view = request.user.role != "student" or bool(
            report
            and report.admin_approval_status == "approved"
            and (approved_snapshot or report.schema_version < SCHEMA_VERSION)
        )
        if request.user.role == "student" and approved_snapshot:
            normalized_content = approved_snapshot.content
            schema_version = approved_snapshot.schema_version
        validation = (
            validate_content_v2(normalized_content, module_keys)
            if schema_version >= SCHEMA_VERSION
            else {
                "valid": True,
                "errors": {},
                "required_fields": 0,
                "completed_fields": 0,
                "completion_percentage": 100,
            }
        )
        validation.pop("normalized_content", None)

        if report and normalized_content != (report.content or {}):
            if request.user.role != "student":
                report.content = normalized_content

        report_data = (
            AssessmentReportSerializer(report, context={"request": request}).data
            if report
            else None
        )
        if report_data and request.user.role == "student":
            report_data["snapshots"] = []
            if student_can_view and approved_snapshot:
                report_data["content"] = approved_snapshot.content
                report_data["schema_version"] = approved_snapshot.schema_version
                report_data["current_version"] = approved_snapshot.version
            else:
                report_data["content"] = {}
                report_data["content_preview"] = ""
                report_data["module_definitions"] = []
                report_data["recommended_universities"] = []
                for legacy_field in (
                    "ielts_score",
                    "other_tests",
                    "english_preparation",
                    "health_insurance",
                    "insurance_options",
                    "additional_health",
                    "visa_type",
                    "visa_requirements",
                    "visa_processing",
                    "visa_interview",
                    "university_processing",
                    "admission_notification",
                    "visa_application",
                    "final_confirmation",
                    "step_ielts",
                    "step_documents",
                    "step_apply",
                    "step_scholarships",
                    "step_visa",
                    "step_interview",
                    "additional_comments",
                ):
                    report_data[legacy_field] = ""

        return Response(
            {
                "assessment": AssessmentSerializer(assessment, context={"request": request}).data,
                "report": report_data,
                "recommended_universities": (
                    approved_snapshot.recommended_universities
                    if request.user.role == "student" and approved_snapshot
                    else RecommendedUniversitySerializer(recommended_universities, many=True).data
                )
                if student_can_view
                else [],
                "schema_version": schema_version,
                "current_version": approved_snapshot.version
                if request.user.role == "student" and approved_snapshot
                else (report_data or {}).get("current_version", 0),
                "module_definitions": get_module_definitions(module_keys, schema_version=schema_version)
                if student_can_view
                else [],
                "content": normalized_content if student_can_view else {},
                "report_preview": build_report_preview(normalized_content) if student_can_view else "",
                "show_recommended_universities": show_recommended_universities,
                "can_view_report": student_can_view,
                "validation": validation,
                "can_edit": bool(
                    request.user.role == "consultant"
                    and assessment.consultant_id == request.user.id
                    and assessment.status in {AssessmentStatus.ACCEPTED, AssessmentStatus.REVISION_REQUESTED}
                ),
                "can_submit": bool(
                    request.user.role == "consultant"
                    and assessment.consultant_id == request.user.id
                    and assessment.status in {AssessmentStatus.ACCEPTED, AssessmentStatus.REVISION_REQUESTED}
                ),
                "report_locked": bool(
                    report
                    and report.submission_status == "submitted"
                    and assessment.status not in {AssessmentStatus.REVISION_REQUESTED}
                ),
                "student_profile": {
                    "academic_track": getattr(student_profile, "academic_track", ""),
                    "ielts_score": getattr(student_profile, "ielts_score", ""),
                    "last_education_title": getattr(student_profile, "last_education_title", ""),
                    "last_education_department": getattr(student_profile, "last_education_department", ""),
                    "last_education_result": getattr(student_profile, "last_education_result", ""),
                    "last_education_duration": getattr(student_profile, "last_education_duration", ""),
                }
                if student_profile
                else None,
            }
        )

    @action(detail=True, methods=["get"], url_path="report-export")
    def report_export(self, request, pk=None):
        assessment = self.get_object()
        report = getattr(assessment, "report", None)
        if report is None:
            raise ValidationError("No report exists for this assessment.")

        module_keys = report.module_keys or assessment.report_module_keys or resolve_report_blueprint(
            assessment.requested_service_categories
            or [item.name for item in assessment.consultant_service.service_categories.all()]
        )["report_module_keys"]
        content = normalize_report_content(report, module_keys)
        universities = list(assessment.recommended_universities.order_by("-created_at"))
        html = render_report_html(
            report=report,
            assessment=assessment,
            recommended_universities=universities,
            module_keys=module_keys,
            content=content,
        )
        return Response(
            {
                "filename": f"assessment-report-{assessment.id}.html",
                "title": assessment.assessment_title,
                "html": html,
            }
        )

    @action(detail=True, methods=["get"], url_path="report-pdf")
    def report_pdf(self, request, pk=None):
        assessment = self.get_object()
        report = getattr(assessment, "report", None)
        if report is None:
            raise ValidationError("No report exists for this assessment.")

        snapshot = None
        watermark = ""
        if request.user.role == "student":
            if report.admin_approval_status != "approved":
                raise PermissionDenied("The report is available after admin approval.")
            snapshot = report.snapshots.filter(admin_approval_status="approved").order_by("-version").first()
            if snapshot is None and report.schema_version >= SCHEMA_VERSION:
                raise ValidationError("The approved report snapshot is unavailable.")
        elif request.user.role == "admin":
            snapshot = report.snapshots.order_by("-version").first()
            watermark = (snapshot.admin_approval_status if snapshot else "draft").upper()
        else:
            if assessment.consultant_id != request.user.id:
                raise PermissionDenied("You cannot preview this report.")
            snapshot = report.snapshots.order_by("-version").first() if report.submission_status == "submitted" else None
            watermark = "PENDING APPROVAL" if snapshot else "DRAFT"

        module_keys = (
            snapshot.module_keys
            if snapshot
            else report.module_keys or assessment.report_module_keys
        )
        content = (
            snapshot.content
            if snapshot
            else normalize_report_content(report, module_keys)
        )
        universities = (
            snapshot.recommended_universities
            if snapshot
            else list(assessment.recommended_universities.order_by("-created_at"))
        )
        version = snapshot.version if snapshot else max(report.snapshots.count(), 1)

        if (snapshot.schema_version if snapshot else report.schema_version) < SCHEMA_VERSION:
            html = render_report_html(
                report=report,
                assessment=assessment,
                recommended_universities=list(assessment.recommended_universities.order_by("-created_at")),
                module_keys=module_keys,
                content=content,
            )
        else:
            html = render_professional_report_html(
                report=report,
                assessment=assessment,
                module_keys=module_keys,
                content=content,
                recommended_universities=universities,
                version=version,
                watermark=watermark,
            )
        try:
            pdf = render_pdf_bytes(html)
        except RuntimeError as exc:
            return Response({"detail": str(exc)}, status=503)
        filename = f"{report_number(report.id, report.created_at)}-v{version}.pdf"
        response = HttpResponse(pdf, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Cache-Control"] = "private, no-store"
        return response


class AssessmentReportViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsConsultant()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = AssessmentReport.objects.select_related(
            "assessment",
            "assessment__consultant_service",
            "student",
            "consultant",
        ).prefetch_related(
            "assessment__consultant_service__service_categories",
            "assessment__recommended_universities",
        )
        if user.role == "student":
            return queryset.filter(student=user)
        if user.role == "consultant":
            return queryset.filter(consultant=user)
        return queryset.filter(student=user) | queryset.filter(consultant=user)

    def perform_create(self, serializer):
        assessment = serializer.validated_data["assessment"]
        if assessment.consultant_id != self.request.user.id:
            raise PermissionDenied("You can only submit reports for your own assessments.")
        if assessment.status not in {AssessmentStatus.ACCEPTED, AssessmentStatus.REVISION_REQUESTED}:
            raise ValidationError("Reports can only be drafted for accepted or revision-requested assessments.")
        if hasattr(assessment, "report"):
            raise ValidationError("A report already exists for this assessment.")

        content = serializer.validated_data.get("content") or {}
        report = serializer.save(
            student=assessment.student,
            consultant=assessment.consultant,
            template_key=TEMPLATE_KEY,
            schema_version=SCHEMA_VERSION,
            module_keys=serializer.validated_data.get("module_keys") or assessment.report_module_keys,
            content=content,
            submission_status="draft",
            **sync_legacy_fields_from_content(content),
        )
        return report

    def perform_update(self, serializer):
        report = self.get_object()
        if report.consultant_id != self.request.user.id:
            raise PermissionDenied("You can only edit your own reports.")
        if report.submission_status == "submitted" and report.assessment.status != AssessmentStatus.REVISION_REQUESTED:
            raise ValidationError("Submitted reports are locked until a revision is requested.")

        content = serializer.validated_data.get("content")
        update_kwargs = {}
        if content is not None:
            update_kwargs.update(sync_legacy_fields_from_content(content))
            update_kwargs["content"] = content

        serializer.save(
            template_key=serializer.validated_data.get("template_key") or report.template_key or report.assessment.report_template_key,
            module_keys=serializer.validated_data.get("module_keys") or report.module_keys or report.assessment.report_module_keys,
            **update_kwargs,
        )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def submit(self, request, pk=None):
        report = self.get_object()
        if report.consultant_id != request.user.id:
            raise PermissionDenied("You can only submit your own reports.")
        if report.assessment.status not in {AssessmentStatus.ACCEPTED, AssessmentStatus.REVISION_REQUESTED}:
            raise ValidationError("This assessment is not ready for report submission.")

        module_keys = report.module_keys or report.assessment.report_module_keys
        normalized_content = normalize_report_content(report, module_keys)
        if report.schema_version >= SCHEMA_VERSION:
            validation = validate_content_v2(normalized_content, module_keys)
            if not validation["valid"]:
                raise ValidationError(
                    {
                        "detail": "Complete the required report sections before submission.",
                        "field_errors": validation["errors"],
                        "completion_percentage": validation["completion_percentage"],
                    }
                )
            normalized_content = validation["normalized_content"]
        report.content = normalized_content
        for field_name, value in sync_legacy_fields_from_content(normalized_content).items():
            setattr(report, field_name, value)
        report.submission_status = "submitted"
        report.admin_approval_status = "pending"
        report.rejection_reason = ""
        report.save(
            update_fields=[
                "content",
                *sync_legacy_fields_from_content(normalized_content).keys(),
                "submission_status",
                "admin_approval_status",
                "rejection_reason",
                "updated_at",
            ]
        )
        report.assessment.status = AssessmentStatus.SUBMITTED
        report.assessment.submitted_at = timezone.now()
        report.assessment.save(update_fields=["status", "submitted_at", "updated_at"])
        next_version = (
            report.snapshots.aggregate(max_version=Max("version"))["max_version"] or 0
        ) + 1
        AssessmentReportSnapshot.objects.create(
            report=report,
            version=next_version,
            schema_version=report.schema_version,
            template_key=report.template_key or TEMPLATE_KEY,
            module_keys=module_keys,
            content=normalized_content,
            recommended_universities=[
                serialize_university(item)
                for item in report.assessment.recommended_universities.order_by("-created_at")
            ],
            submitted_by=request.user,
        )
        return Response(self.get_serializer(report).data)


class RecommendedUniversityViewSet(viewsets.ModelViewSet):
    serializer_class = RecommendedUniversitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsConsultant()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        user = self.request.user
        queryset = RecommendedUniversity.objects.select_related("assessment", "student", "consultant")
        if user.role == "student":
            return queryset.filter(student=user)
        if user.role == "consultant":
            return queryset.filter(consultant=user)
        return queryset.filter(student=user) | queryset.filter(consultant=user)

    def perform_create(self, serializer):
        assessment = serializer.validated_data["assessment"]
        serializer.save(student=assessment.student, consultant=assessment.consultant)


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action == "create":
            return [IsStudent()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = Review.objects.select_related("student", "consultant", "assessment", "consultant_service")
        consultant_id = self.request.query_params.get("consultant_id")
        if consultant_id:
            return queryset.filter(consultant_id=consultant_id)

        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        if user.role == "consultant":
            return queryset.filter(consultant=user)
        if user.role == "student":
            return queryset.filter(student=user)
        return queryset

    def perform_create(self, serializer):
        assessment = serializer.validated_data["assessment"]
        try:
            ModerationService.flag_and_raise(
                user=self.request.user,
                source_type="assessment_review",
                source_id=assessment.id,
                text=serializer.validated_data["review_message"],
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        serializer.save(
            student=self.request.user,
            consultant=assessment.consultant,
            consultant_service=assessment.consultant_service,
        )


class ServiceChargeRuleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ServiceChargeRuleSerializer
    permission_classes = [permissions.AllowAny]
    queryset = ServiceChargeRule.objects.all()
