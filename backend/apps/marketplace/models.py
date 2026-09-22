from django.db import models

from common.models import TimeStampedModel


class MarketplaceStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    DISABLED = "disabled", "Disabled"
    PENDING = "pending", "Pending"
    SENT = "sent", "Sent"


class StudentPost(TimeStampedModel):
    student = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="marketplace_posts"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    country = models.ForeignKey(
        "catalog.Country",
        on_delete=models.CASCADE,
        related_name="marketplace_posts",
        blank=True,
        null=True,
    )
    custom_country_name = models.CharField(max_length=150, blank=True)
    service_category = models.ForeignKey(
        "catalog.ServiceCategory",
        on_delete=models.CASCADE,
        related_name="marketplace_posts",
        blank=True,
        null=True,
    )
    custom_service_name = models.CharField(max_length=150, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    institute = models.CharField(max_length=255, blank=True)
    session = models.CharField(max_length=100, blank=True)
    study_level = models.ForeignKey(
        "catalog.StudyLevel",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="marketplace_posts",
    )
    custom_study_level_name = models.CharField(max_length=150, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=20, choices=MarketplaceStatus.choices, default=MarketplaceStatus.ACTIVE)


class Quotation(TimeStampedModel):
    student = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="quotations_received"
    )
    post = models.ForeignKey(
        StudentPost, on_delete=models.CASCADE, related_name="quotations"
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="quotations_sent"
    )
    consultant_service = models.ForeignKey(
        "consultants.ConsultantService",
        on_delete=models.CASCADE,
        related_name="quotations",
    )
    quotation = models.TextField()
    status = models.CharField(max_length=20, choices=MarketplaceStatus.choices, default=MarketplaceStatus.PENDING)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["post", "consultant", "consultant_service"],
                name="unique_consultant_post_service_quote",
            )
        ]
