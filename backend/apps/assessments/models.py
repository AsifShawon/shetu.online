from django.db import models
from django.utils import timezone

from common.models import TimeStampedModel


class AssessmentStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING = "pending", "Pending"
    PROPOSAL_PENDING = "proposal_pending", "Proposal Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    REVISION_REQUESTED = "revision_requested", "Revision Requested"
    SUBMITTED = "submitted", "Submitted"
    APPROVED = "approved", "Approved"
    COMPLETED = "completed", "Completed"


class ProposalStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"
    EXPIRED = "expired", "Expired"


class ReportApprovalStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"


class ReviewRequestStatus(models.TextChoices):
    OPEN = "open", "Open"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    RESOLVED = "resolved", "Resolved"


class ReportSubmissionStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    SUBMITTED = "submitted", "Submitted"
    REVISION_REQUESTED = "revision_requested", "Revision Requested"


class Assessment(TimeStampedModel):
    student = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="student_assessments"
    )
    choice = models.ForeignKey(
        "students.StudentChoice",
        on_delete=models.SET_NULL,
        related_name="assessments",
        blank=True,
        null=True,
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="consultant_assessments"
    )
    consultant_service = models.ForeignKey(
        "consultants.ConsultantService",
        on_delete=models.CASCADE,
        related_name="assessments",
    )
    assessment_country = models.ForeignKey(
        "catalog.Country", on_delete=models.SET_NULL, blank=True, null=True
    )
    assessment_charge = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    assessment_duration = models.CharField(max_length=50, blank=True)
    assessment_title = models.CharField(max_length=150, blank=True)
    assessment_description = models.TextField(blank=True)
    preferred_country = models.ForeignKey(
        "catalog.Country",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="preferred_assessments",
    )
    preferred_institute = models.CharField(max_length=255, blank=True)
    preferred_subject = models.CharField(max_length=255, blank=True)
    preferred_session = models.CharField(max_length=100, blank=True)
    student_budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    requested_service_categories = models.JSONField(default=list, blank=True)
    report_template_key = models.CharField(max_length=100, blank=True)
    report_module_keys = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=AssessmentStatus.choices, default=AssessmentStatus.PENDING)
    attachment = models.FileField(upload_to="assessments/attachments/", blank=True, null=True)
    accepted_at = models.DateTimeField(blank=True, null=True)
    deadline_at = models.DateTimeField(blank=True, null=True)
    submitted_at = models.DateTimeField(blank=True, null=True)


class AssessmentReport(TimeStampedModel):
    assessment = models.OneToOneField(
        Assessment, on_delete=models.CASCADE, related_name="report"
    )
    student = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="assessment_reports"
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="written_reports"
    )
    template_key = models.CharField(max_length=100, blank=True)
    schema_version = models.PositiveSmallIntegerField(default=1)
    module_keys = models.JSONField(default=list, blank=True)
    content = models.JSONField(default=dict, blank=True)
    ielts_score = models.CharField(max_length=50, blank=True)
    other_tests = models.CharField(max_length=255, blank=True)
    english_preparation = models.CharField(max_length=255, blank=True)
    health_insurance = models.CharField(max_length=255, blank=True)
    insurance_options = models.CharField(max_length=255, blank=True)
    additional_health = models.CharField(max_length=255, blank=True)
    visa_type = models.CharField(max_length=255, blank=True)
    visa_requirements = models.TextField(blank=True)
    visa_processing = models.CharField(max_length=255, blank=True)
    visa_interview = models.CharField(max_length=255, blank=True)
    university_processing = models.CharField(max_length=255, blank=True)
    admission_notification = models.CharField(max_length=255, blank=True)
    visa_application = models.CharField(max_length=255, blank=True)
    final_confirmation = models.CharField(max_length=255, blank=True)
    step_ielts = models.CharField(max_length=255, blank=True)
    step_documents = models.CharField(max_length=255, blank=True)
    step_apply = models.CharField(max_length=255, blank=True)
    step_scholarships = models.CharField(max_length=255, blank=True)
    step_visa = models.CharField(max_length=255, blank=True)
    step_interview = models.CharField(max_length=255, blank=True)
    additional_comments = models.TextField(blank=True)
    submission_status = models.CharField(
        max_length=20,
        choices=ReportSubmissionStatus.choices,
        default=ReportSubmissionStatus.DRAFT,
    )
    admin_approval_status = models.CharField(
        max_length=20,
        choices=ReportApprovalStatus.choices,
        default=ReportApprovalStatus.PENDING,
    )
    approved_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="approved_assessment_reports",
    )
    approved_at = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True)
    student_accepted_at = models.DateTimeField(blank=True, null=True)


class AssessmentReportSnapshot(TimeStampedModel):
    report = models.ForeignKey(
        AssessmentReport,
        on_delete=models.CASCADE,
        related_name="snapshots",
    )
    version = models.PositiveIntegerField()
    schema_version = models.PositiveSmallIntegerField(default=2)
    template_key = models.CharField(max_length=100)
    module_keys = models.JSONField(default=list)
    content = models.JSONField(default=dict)
    recommended_universities = models.JSONField(default=list)
    submitted_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="submitted_report_snapshots",
    )
    submitted_at = models.DateTimeField(default=timezone.now)
    admin_approval_status = models.CharField(
        max_length=20,
        choices=ReportApprovalStatus.choices,
        default=ReportApprovalStatus.PENDING,
    )
    reviewed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="reviewed_report_snapshots",
    )
    reviewed_at = models.DateTimeField(blank=True, null=True)
    qa_checks = models.JSONField(default=dict, blank=True)
    review_notes = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ("-version",)
        constraints = [
            models.UniqueConstraint(
                fields=("report", "version"),
                name="assessment_report_snapshot_unique_version",
            )
        ]


class AssessmentProposal(TimeStampedModel):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="proposals"
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="assessment_proposals"
    )
    proposed_charge = models.DecimalField(max_digits=10, decimal_places=2)
    proposed_duration = models.CharField(max_length=50)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=ProposalStatus.choices, default=ProposalStatus.PENDING)


class ReviewRequest(TimeStampedModel):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="review_requests"
    )
    report = models.ForeignKey(
        AssessmentReport,
        on_delete=models.CASCADE,
        related_name="review_requests",
        blank=True,
        null=True,
    )
    student = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="review_requests"
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="received_review_requests"
    )
    reason = models.TextField()
    status = models.CharField(
        max_length=20, choices=ReviewRequestStatus.choices, default=ReviewRequestStatus.OPEN
    )
    admin_notes = models.TextField(blank=True)


class RecommendedUniversity(TimeStampedModel):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="recommended_universities"
    )
    student = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="recommended_universities"
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="consultant_recommendations"
    )
    university_name = models.CharField(max_length=255)
    course_name = models.CharField(max_length=255)
    country = models.CharField(max_length=100, blank=True)
    program_level = models.CharField(max_length=100, blank=True)
    intake = models.CharField(max_length=100, blank=True)
    duration = models.CharField(max_length=100, blank=True)
    application_deadline = models.DateField(blank=True, null=True)
    currency = models.CharField(max_length=3, blank=True)
    fit_category = models.CharField(max_length=20, blank=True)
    fit_score = models.PositiveSmallIntegerField(blank=True, null=True)
    official_program_url = models.URLField(blank=True)
    entry_requirements = models.TextField(blank=True)
    key_strengths = models.TextField(blank=True)
    key_risks = models.TextField(blank=True)
    tuition_fees = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    living_expenses = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    total_estimated_budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    ielts = models.CharField(max_length=50, blank=True)
    scholarships = models.CharField(max_length=255, blank=True)
    visa_type = models.CharField(max_length=255, blank=True)
    visa_processing_time = models.CharField(max_length=255, blank=True)
    application_processing_time = models.CharField(max_length=255, blank=True)
    admission_notification_time = models.CharField(max_length=255, blank=True)


class Review(TimeStampedModel):
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name="reviews"
    )
    student = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="given_reviews"
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="received_reviews"
    )
    consultant_service = models.ForeignKey(
        "consultants.ConsultantService",
        on_delete=models.CASCADE,
        related_name="reviews",
    )
    review_message = models.TextField()
    review_rating = models.DecimalField(max_digits=4, decimal_places=2)


class ServiceChargeRule(TimeStampedModel):
    service_category = models.ForeignKey(
        "catalog.ServiceCategory", on_delete=models.CASCADE, related_name="service_charge_rules"
    )
    role_tier = models.CharField(max_length=30)
    commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
