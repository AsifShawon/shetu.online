from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone

from common.models import TimeStampedModel


class UserRole(models.TextChoices):
    STUDENT = "student", "Student"
    CONSULTANT = "consultant", "Consultant"
    AGENCY = "agency", "Agency"
    ADMIN = "admin", "Admin"


class AccountType(models.TextChoices):
    PERSONAL = "personal", "Personal"
    AGENCY = "agency", "Agency"


class VerificationStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    IN_PROGRESS = "in_progress", "In Progress"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"


class SubscriptionStatus(models.TextChoices):
    NONE = "none", "None"
    PRO = "pro", "Pro"


class NotificationKind(models.TextChoices):
    INFO = "info", "Info"
    SUCCESS = "success", "Success"
    WARNING = "warning", "Warning"


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email: str, password: str | None, **extra_fields):
        if not email:
            raise ValueError("The email address must be set.")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", UserRole.STUDENT)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", UserRole.ADMIN)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=UserRole.choices)
    account_type = models.CharField(
        max_length=20, choices=AccountType.choices, default=AccountType.PERSONAL
    )
    phone = models.CharField(max_length=20, blank=True)
    image = models.ImageField(upload_to="users/profile/", blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True)
    present_address = models.CharField(max_length=255, blank=True)
    present_city = models.CharField(max_length=100, blank=True)
    present_country = models.CharField(max_length=100, blank=True)
    occupation = models.CharField(max_length=150, blank=True)
    skill_languages = models.CharField(max_length=255, blank=True)
    date_of_birth = models.DateField(blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True)
    passport_or_nid = models.CharField(max_length=100, blank=True)
    passport_issue_date = models.DateField(blank=True, null=True)
    passport_expiry_date = models.DateField(blank=True, null=True)
    experience_summary = models.TextField(blank=True)
    profile_completion = models.PositiveSmallIntegerField(default=0)
    verification_status = models.CharField(
        max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING
    )
    subscription_status = models.CharField(
        max_length=20, choices=SubscriptionStatus.choices, default=SubscriptionStatus.NONE
    )
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    assessment_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    assessment_duration = models.CharField(max_length=50, blank=True)
    preferred_cities = models.ManyToManyField("catalog.City", blank=True, related_name="preferred_by_users")
    preferred_universities = models.ManyToManyField(
        "catalog.University", blank=True, related_name="preferred_by_users"
    )
    is_banned = models.BooleanField(default=False)
    banned_until = models.DateTimeField(blank=True, null=True)
    ban_reason = models.TextField(blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    def __str__(self) -> str:
        return self.email

    def is_currently_banned(self) -> bool:
        if not self.is_banned:
            return False
        if self.banned_until and self.banned_until <= timezone.now():
            return False
        return True

    def _has_valid_student_profile(self) -> bool:
        profile = getattr(self, "student_profile", None)
        if not profile:
            return False

        return bool(
            profile.last_education_title
            and profile.last_education_department
            and profile.last_education_start
            and profile.last_education_duration
            and profile.last_education_result
        )

    def _has_consultant_profile_evidence(self) -> bool:
        return bool(
            self.qualifications.exists()
            and self.experiences.exists()
            and self.consultant_services.exists()
        )

    def recalculate_profile_completion(self, save: bool = True) -> int:
        checks = [
            bool(self.first_name),
            bool(self.phone),
            bool(self.gender),
            bool(self.present_address),
            bool(self.present_city),
            bool(self.present_country),
            bool(self.date_of_birth),
            bool(self.nationality),
            bool(self.passport_or_nid),
            bool(self.passport_issue_date),
            bool(self.passport_expiry_date),
            bool(self.image),
        ]

        if self.role == UserRole.STUDENT:
            checks.append(self._has_valid_student_profile())
        elif self.role == UserRole.CONSULTANT:
            checks.extend(
                [
                    self._has_consultant_profile_evidence(),
                    bool(self.experience_summary),
                ]
            )

        percentage = int(round((sum(checks) / len(checks)) * 100)) if checks else 0

        if save and self.profile_completion != percentage:
            self.profile_completion = percentage
            self.save(update_fields=["profile_completion"])

        return percentage


class OTPVerification(TimeStampedModel):
    purpose = models.CharField(max_length=50, default="registration")
    email = models.EmailField()
    code = models.CharField(max_length=6)
    payload = models.JSONField(default=dict, blank=True)
    expires_at = models.DateTimeField()
    consumed_at = models.DateTimeField(blank=True, null=True)


class VerificationRequest(TimeStampedModel):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="verification_requests")
    status = models.CharField(max_length=20, choices=VerificationStatus.choices, default=VerificationStatus.PENDING)
    notes = models.TextField(blank=True)


class SavedConsultant(TimeStampedModel):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="saved_consultants")
    consultant = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="saved_by_users")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("user", "consultant"), name="accounts_saved_consultant_unique_user_consultant")
        ]
        ordering = ("-created_at",)


class Notification(TimeStampedModel):
    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=160)
    message = models.TextField(blank=True)
    kind = models.CharField(
        max_length=20,
        choices=NotificationKind.choices,
        default=NotificationKind.INFO,
    )
    action_url = models.CharField(max_length=500, blank=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(
                fields=("recipient", "read_at", "-created_at"),
                name="acct_notif_rec_read_idx",
            )
        ]

    def __str__(self) -> str:
        return f"{self.recipient_id}: {self.title}"
