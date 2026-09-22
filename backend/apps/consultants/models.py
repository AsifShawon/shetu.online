from django.db import models

from common.models import TimeStampedModel


class ConsultantStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    DISABLED = "disabled", "Disabled"


class AssessmentTimeUnit(models.TextChoices):
    HOURS = "hours", "Hours"
    DAYS = "days", "Days"


class ConsultantProfile(TimeStampedModel):
    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="consultant_profile"
    )
    years_of_experience = models.PositiveSmallIntegerField(blank=True, null=True)
    assessment_time_value = models.PositiveSmallIntegerField(blank=True, null=True)
    assessment_time_unit = models.CharField(
        max_length=20, choices=AssessmentTimeUnit.choices, blank=True
    )
    assessment_types = models.JSONField(default=list, blank=True)


class Qualification(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="qualifications"
    )
    level_of_education = models.CharField(max_length=120)
    degree_title = models.CharField(max_length=255)
    institution = models.CharField(max_length=255)
    department = models.CharField(max_length=255, blank=True)
    passing_year = models.CharField(max_length=20, blank=True)
    cgpa = models.CharField(max_length=20, blank=True)
    grading_system = models.CharField(max_length=50, blank=True)
    duration = models.CharField(max_length=100, blank=True)
    document = models.FileField(upload_to="consultants/qualifications/", blank=True, null=True)


class Experience(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="experiences"
    )
    organization = models.CharField(max_length=255)
    designation = models.CharField(max_length=255)
    responsibilities = models.TextField(blank=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True)
    document = models.FileField(upload_to="consultants/experiences/", blank=True, null=True)
    cv_document = models.FileField(upload_to="consultants/cv/", blank=True, null=True)
    cover_letter = models.FileField(upload_to="consultants/cover-letters/", blank=True, null=True)
    experience_certificate = models.FileField(
        upload_to="consultants/exp-certificates/", blank=True, null=True
    )
    skill_languages = models.CharField(max_length=255, blank=True)
    co_curricular_activities = models.TextField(blank=True)


class PersonalTraining(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="personal_trainings"
    )
    title = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)
    year = models.CharField(max_length=20)
    duration = models.CharField(max_length=100, blank=True)
    result_or_award = models.CharField(max_length=255, blank=True)
    document = models.FileField(
        upload_to="consultants/training-certs/", blank=True, null=True
    )


class Training(TimeStampedModel):
    title = models.CharField(max_length=255)
    thumbnail = models.ImageField(upload_to="trainings/", blank=True, null=True)
    training_type = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    overview = models.TextField(blank=True)
    organization = models.CharField(max_length=255, blank=True)
    address = models.CharField(max_length=255, blank=True)
    language = models.CharField(max_length=120, blank=True)
    application_deadline = models.DateTimeField(blank=True, null=True)
    start_date = models.DateTimeField(blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    document = models.FileField(upload_to="trainings/documents/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=ConsultantStatus.choices, default=ConsultantStatus.ACTIVE)


class Subject(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)


class ConsultantService(TimeStampedModel):
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="consultant_services"
    )
    country = models.ForeignKey(
        "catalog.Country", on_delete=models.CASCADE, related_name="consultant_services"
    )
    title = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    duration = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=ConsultantStatus.choices, default=ConsultantStatus.ACTIVE)
    service_categories = models.ManyToManyField(
        "catalog.ServiceCategory", related_name="consultant_services"
    )
    study_levels = models.ManyToManyField(
        "catalog.StudyLevel", related_name="consultant_services", blank=True
    )
    subjects = models.ManyToManyField(Subject, related_name="consultant_services", blank=True)


class ProPackage(TimeStampedModel):
    class PackageType(models.TextChoices):
        MONTHLY = "monthly", "Monthly"
        ANNUAL = "annual", "Annual"

    name = models.CharField(max_length=150)
    level = models.CharField(max_length=100, blank=True)
    package_type = models.CharField(
        max_length=20,
        choices=PackageType.choices,
        default=PackageType.MONTHLY,
    )
    duration_days = models.PositiveIntegerField(default=30)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=ConsultantStatus.choices, default=ConsultantStatus.ACTIVE)


class ProSubscription(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="pro_subscriptions"
    )
    package = models.ForeignKey(
        ProPackage, on_delete=models.CASCADE, related_name="subscriptions"
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    active = models.BooleanField(default=True)
