from django.db import models
from django.utils import timezone

from common.models import TimeStampedModel


class AdminAuditLog(models.Model):
    actor_email = models.EmailField()
    action = models.CharField(max_length=255)
    context = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ClassScheduleStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    INACTIVE = "inactive", "In-active"
    COMPLETED = "completed", "Completed"


class ClassSchedule(TimeStampedModel):
    name = models.CharField(max_length=255)
    link = models.URLField(max_length=500)
    status = models.CharField(max_length=20, choices=ClassScheduleStatus.choices, default=ClassScheduleStatus.ACTIVE)
    date_time = models.DateTimeField()


class ModerationIncidentStatus(models.TextChoices):
    OPEN = "open", "Open"
    DISMISSED = "dismissed", "Dismissed"
    ACTIONED = "actioned", "Actioned"


class AdminInvitation(TimeStampedModel):
    email = models.EmailField(unique=True)
    token = models.CharField(max_length=64, unique=True)
    invited_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, blank=True, null=True, related_name="admin_invitations_sent"
    )
    expires_at = models.DateTimeField()
    accepted_at = models.DateTimeField(blank=True, null=True)
    notes = models.TextField(blank=True)

    def is_expired(self) -> bool:
        return self.expires_at <= timezone.now()


class ModerationIncident(TimeStampedModel):
    reported_user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="moderation_incidents"
    )
    source_type = models.CharField(max_length=50)
    source_id = models.PositiveBigIntegerField(blank=True, null=True)
    matched_terms = models.JSONField(default=list, blank=True)
    content_excerpt = models.TextField(blank=True)
    auto_flagged = models.BooleanField(default=True)
    status = models.CharField(
        max_length=20, choices=ModerationIncidentStatus.choices, default=ModerationIncidentStatus.OPEN
    )
    notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        "accounts.User", on_delete=models.SET_NULL, blank=True, null=True, related_name="moderation_reviews"
    )


class LegacyImportRun(TimeStampedModel):
    class Status(models.TextChoices):
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        DRY_RUN = "dry_run", "Dry Run"

    sql_dump_path = models.CharField(max_length=500)
    media_root = models.CharField(max_length=500, blank=True)
    dry_run = models.BooleanField(default=False)
    strict = models.BooleanField(default=False)
    selected_passes = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RUNNING)
    finished_at = models.DateTimeField(blank=True, null=True)
    summary = models.JSONField(default=dict, blank=True)


class LegacyImportMap(TimeStampedModel):
    run = models.ForeignKey(
        LegacyImportRun, on_delete=models.CASCADE, related_name="mappings"
    )
    source_table = models.CharField(max_length=100)
    source_pk = models.CharField(max_length=255)
    target_app_label = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_pk = models.PositiveBigIntegerField()

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["run", "source_table", "source_pk"],
                name="unique_legacy_import_source_mapping",
            )
        ]
