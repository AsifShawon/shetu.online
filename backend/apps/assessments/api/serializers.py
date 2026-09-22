import json

from rest_framework import serializers

from apps.accounts.models import User, UserRole
from apps.assessments.models import (
    Assessment,
    AssessmentProposal,
    AssessmentReport,
    AssessmentReportSnapshot,
    ProposalStatus,
    RecommendedUniversity,
    Review,
    ReviewRequest,
    ServiceChargeRule,
)
from apps.assessments.reporting import (
    DEFAULT_TEMPLATE_KEY,
    build_report_preview,
    get_module_definitions,
    normalize_report_content,
    resolve_report_blueprint,
    should_show_recommended_universities,
)
from apps.assessments.reporting_v2 import SCHEMA_VERSION, report_number, validate_content_v2
from apps.catalog.models import Country
from apps.consultants.models import ConsultantService


class EmptyDateStringMixin:
    date_fields: tuple[str, ...] = ()

    def to_internal_value(self, data):
        mutable = data.copy()
        for field in self.date_fields:
            if mutable.get(field) == "":
                mutable[field] = None
        return super().to_internal_value(mutable)


class AssessmentSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_name = serializers.SerializerMethodField()
    consultant_id = serializers.PrimaryKeyRelatedField(
        source="consultant",
        queryset=User.objects.filter(role=UserRole.CONSULTANT),
        required=False,
    )
    consultant_name = serializers.SerializerMethodField()
    consultant_service_id = serializers.PrimaryKeyRelatedField(
        source="consultant_service",
        queryset=ConsultantService.objects.select_related("consultant", "country"),
    )
    service_title = serializers.CharField(source="consultant_service.title", read_only=True)
    assessment_country_id = serializers.IntegerField(source="assessment_country.id", read_only=True)
    country_name = serializers.SerializerMethodField()
    preferred_country_id = serializers.PrimaryKeyRelatedField(
        source="preferred_country",
        queryset=Country.objects.all(),
        allow_null=True,
        required=False,
    )
    proposals = serializers.SerializerMethodField(read_only=True)
    review_requests = serializers.SerializerMethodField(read_only=True)
    report_id = serializers.SerializerMethodField(read_only=True)
    admin_approval_status = serializers.SerializerMethodField(read_only=True)
    order_id = serializers.SerializerMethodField(read_only=True)
    requested_service_categories = serializers.ListField(read_only=True)
    report_template_key = serializers.CharField(read_only=True)
    report_module_keys = serializers.ListField(read_only=True)
    report_submission_status = serializers.SerializerMethodField(read_only=True)
    accepted_at = serializers.DateTimeField(read_only=True)
    deadline_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Assessment
        fields = [
            "id",
            "student_id",
            "student_name",
            "choice",
            "consultant_id",
            "consultant_name",
            "consultant_service_id",
            "service_title",
            "assessment_country_id",
            "country_name",
            "assessment_charge",
            "assessment_duration",
            "assessment_title",
            "assessment_description",
            "preferred_country_id",
            "preferred_institute",
            "preferred_subject",
            "preferred_session",
            "student_budget",
            "requested_service_categories",
            "report_template_key",
            "report_module_keys",
            "status",
            "attachment",
            "accepted_at",
            "deadline_at",
            "submitted_at",
            "proposals",
            "review_requests",
            "report_id",
            "report_submission_status",
            "admin_approval_status",
            "order_id",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        user = obj.student
        return f"{user.first_name} {user.last_name}".strip() or user.email

    def get_consultant_name(self, obj):
        user = obj.consultant
        return f"{user.first_name} {user.last_name}".strip() or user.email

    def get_country_name(self, obj):
        country = obj.assessment_country or obj.preferred_country
        return country.name if country else ""

    def get_proposals(self, obj):
        return [
            {
                "id": proposal.id,
                "proposed_charge": str(proposal.proposed_charge),
                "proposed_duration": proposal.proposed_duration,
                "message": proposal.message,
                "status": proposal.status,
                "created_at": proposal.created_at,
            }
            for proposal in obj.proposals.order_by("-created_at")[:5]
        ]

    def get_review_requests(self, obj):
        return [
            {
                "id": item.id,
                "reason": item.reason,
                "status": item.status,
                "admin_notes": item.admin_notes,
                "created_at": item.created_at,
            }
            for item in obj.review_requests.order_by("-created_at")[:5]
        ]

    def get_report_id(self, obj):
        return getattr(getattr(obj, "report", None), "id", None)

    def get_admin_approval_status(self, obj):
        report = getattr(obj, "report", None)
        return report.admin_approval_status if report else ""

    def get_report_submission_status(self, obj):
        report = getattr(obj, "report", None)
        return report.submission_status if report else ""

    def get_order_id(self, obj):
        return getattr(getattr(obj, "order", None), "id", None)


class AssessmentReportSerializer(serializers.ModelSerializer):
    assessment_id = serializers.PrimaryKeyRelatedField(source="assessment", queryset=Assessment.objects.all())
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)
    template_key = serializers.CharField(read_only=True)
    schema_version = serializers.IntegerField(read_only=True)
    module_keys = serializers.ListField(child=serializers.CharField(), read_only=True)
    content = serializers.JSONField(required=False)
    submission_status = serializers.CharField(read_only=True)
    admin_approval_status = serializers.CharField(read_only=True)
    approved_by_id = serializers.IntegerField(source="approved_by.id", read_only=True)
    deadline_at = serializers.DateTimeField(source="assessment.deadline_at", read_only=True)
    assessment_title = serializers.CharField(source="assessment.assessment_title", read_only=True)
    student_name = serializers.SerializerMethodField(read_only=True)
    consultant_name = serializers.SerializerMethodField(read_only=True)
    content_preview = serializers.SerializerMethodField(read_only=True)
    module_definitions = serializers.SerializerMethodField(read_only=True)
    show_recommended_universities = serializers.SerializerMethodField(read_only=True)
    recommended_universities = serializers.SerializerMethodField(read_only=True)
    current_version = serializers.SerializerMethodField(read_only=True)
    report_number = serializers.SerializerMethodField(read_only=True)
    validation = serializers.SerializerMethodField(read_only=True)
    snapshots = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AssessmentReport
        fields = [
            "id",
            "assessment_id",
            "student_id",
            "consultant_id",
            "template_key",
            "schema_version",
            "module_keys",
            "content",
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
            "submission_status",
            "admin_approval_status",
            "approved_by_id",
            "approved_at",
            "rejection_reason",
            "student_accepted_at",
            "deadline_at",
            "assessment_title",
            "student_name",
            "consultant_name",
            "content_preview",
            "module_definitions",
            "show_recommended_universities",
            "recommended_universities",
            "current_version",
            "report_number",
            "validation",
            "snapshots",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        user = obj.student
        return f"{user.first_name} {user.last_name}".strip() or user.email

    def get_consultant_name(self, obj):
        user = obj.consultant
        return f"{user.first_name} {user.last_name}".strip() or user.email

    def get_content_preview(self, obj):
        module_keys = obj.module_keys or getattr(obj.assessment, "report_module_keys", [])
        if not module_keys:
            module_keys = resolve_report_blueprint(
                obj.assessment.requested_service_categories
                or [item.name for item in obj.assessment.consultant_service.service_categories.all()]
            )["report_module_keys"]
        return build_report_preview(normalize_report_content(obj, module_keys))

    def get_module_definitions(self, obj):
        module_keys = obj.module_keys or obj.assessment.report_module_keys
        if not module_keys:
            module_keys = resolve_report_blueprint(
                obj.assessment.requested_service_categories
                or [item.name for item in obj.assessment.consultant_service.service_categories.all()]
            )["report_module_keys"]
        return get_module_definitions(module_keys, schema_version=obj.schema_version)

    def get_show_recommended_universities(self, obj):
        module_keys = obj.module_keys or obj.assessment.report_module_keys
        if not module_keys:
            module_keys = resolve_report_blueprint(
                obj.assessment.requested_service_categories
                or [item.name for item in obj.assessment.consultant_service.service_categories.all()]
            )["report_module_keys"]
        return should_show_recommended_universities(module_keys)

    def get_recommended_universities(self, obj):
        universities = obj.assessment.recommended_universities.order_by("-created_at")
        return RecommendedUniversitySerializer(universities, many=True).data

    def get_current_version(self, obj):
        latest = obj.snapshots.order_by("-version").only("version").first()
        return latest.version if latest else 0

    def get_report_number(self, obj):
        return report_number(obj.id, obj.created_at)

    def get_validation(self, obj):
        if obj.schema_version < SCHEMA_VERSION:
            return {
                "valid": True,
                "errors": {},
                "required_fields": 0,
                "completed_fields": 0,
                "completion_percentage": 100,
            }
        result = validate_content_v2(obj.content, obj.module_keys or obj.assessment.report_module_keys)
        result.pop("normalized_content", None)
        return result

    def get_snapshots(self, obj):
        return AssessmentReportSnapshotSerializer(
            obj.snapshots.select_related("submitted_by", "reviewed_by").all(),
            many=True,
        ).data

    def validate(self, attrs):
        attrs = super().validate(attrs)
        assessment = attrs.get("assessment") or getattr(self.instance, "assessment", None)
        if assessment is None:
            raise serializers.ValidationError("An assessment is required.")

        blueprint = resolve_report_blueprint(
            assessment.requested_service_categories
            or [item.name for item in assessment.consultant_service.service_categories.all()]
        )
        attrs.setdefault("template_key", getattr(self.instance, "template_key", "") or assessment.report_template_key or blueprint["report_template_key"])
        attrs.setdefault("module_keys", getattr(self.instance, "module_keys", None) or assessment.report_module_keys or blueprint["report_module_keys"])
        attrs.setdefault("content", getattr(self.instance, "content", None) or {})
        try:
            content_size = len(json.dumps(attrs["content"], ensure_ascii=False).encode("utf-8"))
        except (TypeError, ValueError) as exc:
            raise serializers.ValidationError({"content": "Report content must be valid JSON."}) from exc
        if content_size > 250_000:
            raise serializers.ValidationError({"content": "Report content cannot exceed 250 KB."})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        module_keys = instance.module_keys or instance.assessment.report_module_keys
        if not module_keys:
            module_keys = resolve_report_blueprint(
                instance.assessment.requested_service_categories
                or [item.name for item in instance.assessment.consultant_service.service_categories.all()]
            )["report_module_keys"]
        data["template_key"] = instance.template_key or instance.assessment.report_template_key or DEFAULT_TEMPLATE_KEY
        data["module_keys"] = module_keys
        data["content"] = normalize_report_content(instance, module_keys)
        request = self.context.get("request")
        if request and getattr(request.user, "role", None) == "student":
            approved_snapshot = instance.snapshots.filter(
                admin_approval_status="approved"
            ).order_by("-version").first()
            can_view = instance.admin_approval_status == "approved" and (
                approved_snapshot or instance.schema_version < SCHEMA_VERSION
            )
            if approved_snapshot:
                data["content"] = approved_snapshot.content
                data["schema_version"] = approved_snapshot.schema_version
                data["current_version"] = approved_snapshot.version
                data["recommended_universities"] = approved_snapshot.recommended_universities
            elif not can_view:
                data["content"] = {}
                data["content_preview"] = ""
                data["module_definitions"] = []
                data["recommended_universities"] = []
                data["snapshots"] = []
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
                    data[legacy_field] = ""
        return data


class AssessmentReportSnapshotSerializer(serializers.ModelSerializer):
    submitted_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentReportSnapshot
        fields = [
            "id",
            "version",
            "schema_version",
            "template_key",
            "module_keys",
            "content",
            "recommended_universities",
            "submitted_by_name",
            "submitted_at",
            "admin_approval_status",
            "reviewed_by_name",
            "reviewed_at",
            "qa_checks",
            "review_notes",
        ]

    def get_submitted_by_name(self, obj):
        return obj.submitted_by.get_full_name() or obj.submitted_by.email

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return ""
        return obj.reviewed_by.get_full_name() or obj.reviewed_by.email


class AssessmentProposalSerializer(serializers.ModelSerializer):
    assessment_id = serializers.PrimaryKeyRelatedField(source="assessment", queryset=Assessment.objects.all())
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)

    class Meta:
        model = AssessmentProposal
        fields = [
            "id",
            "assessment_id",
            "consultant_id",
            "proposed_charge",
            "proposed_duration",
            "message",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        request = self.context["request"]
        assessment = attrs["assessment"]
        if assessment.consultant_id != request.user.id:
            raise serializers.ValidationError("You can only propose terms for your own assessments.")
        return attrs


class ReviewRequestSerializer(serializers.ModelSerializer):
    assessment_id = serializers.PrimaryKeyRelatedField(source="assessment", queryset=Assessment.objects.all())
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)

    class Meta:
        model = ReviewRequest
        fields = [
            "id",
            "assessment_id",
            "student_id",
            "consultant_id",
            "reason",
            "status",
            "admin_notes",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        assessment = attrs["assessment"]
        request = self.context["request"]
        if assessment.student_id != request.user.id:
            raise serializers.ValidationError("You can only request a review for your own assessment.")
        if not hasattr(assessment, "report"):
            raise serializers.ValidationError("There is no submitted report to review yet.")
        return attrs


class RecommendedUniversitySerializer(serializers.ModelSerializer):
    assessment_id = serializers.PrimaryKeyRelatedField(source="assessment", queryset=Assessment.objects.all())
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)

    class Meta:
        model = RecommendedUniversity
        fields = [
            "id",
            "assessment_id",
            "student_id",
            "consultant_id",
            "university_name",
            "course_name",
            "country",
            "program_level",
            "intake",
            "duration",
            "application_deadline",
            "currency",
            "fit_category",
            "fit_score",
            "official_program_url",
            "entry_requirements",
            "key_strengths",
            "key_risks",
            "tuition_fees",
            "living_expenses",
            "total_estimated_budget",
            "ielts",
            "scholarships",
            "visa_type",
            "visa_processing_time",
            "application_processing_time",
            "admission_notification_time",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        fit_score = attrs.get("fit_score")
        if fit_score is not None and not 1 <= fit_score <= 5:
            raise serializers.ValidationError({"fit_score": "Fit score must be between 1 and 5."})
        fit_category = str(attrs.get("fit_category", "")).strip().lower()
        if fit_category and fit_category not in {"reach", "target", "safe"}:
            raise serializers.ValidationError({"fit_category": "Use Reach, Target, or Safe."})
        if fit_category:
            attrs["fit_category"] = fit_category
        currency = str(attrs.get("currency", "")).strip().upper()
        if currency and len(currency) != 3:
            raise serializers.ValidationError({"currency": "Use a three-letter ISO currency code."})
        if currency:
            attrs["currency"] = currency
        return attrs


class ReviewSerializer(serializers.ModelSerializer):
    assessment_id = serializers.PrimaryKeyRelatedField(source="assessment", queryset=Assessment.objects.all())
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_name = serializers.SerializerMethodField()
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)
    consultant_service_id = serializers.IntegerField(source="consultant_service.id", read_only=True)

    class Meta:
        model = Review
        fields = [
            "id",
            "assessment_id",
            "student_id",
            "student_name",
            "consultant_id",
            "consultant_service_id",
            "review_message",
            "review_rating",
            "created_at",
            "updated_at",
        ]

    def get_student_name(self, obj):
        user = obj.student
        return f"{user.first_name} {user.last_name}".strip() or user.email


class ServiceChargeRuleSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service_category.name", read_only=True)

    class Meta:
        model = ServiceChargeRule
        fields = [
            "id",
            "service_category",
            "service_name",
            "role_tier",
            "commission",
            "created_at",
            "updated_at",
        ]
