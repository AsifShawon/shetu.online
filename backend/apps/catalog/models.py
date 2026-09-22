from django.db import models

from common.models import TimeStampedModel


class ActiveStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    DISABLED = "disabled", "Disabled"


class ServiceCategory(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="service-categories/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)


class Country(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="countries/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)


class City(TimeStampedModel):
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=150)
    slug = models.SlugField()
    status = models.CharField(max_length=20, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["country", "slug"], name="unique_city_slug_per_country"),
            models.UniqueConstraint(fields=["country", "name"], name="unique_city_name_per_country"),
        ]


class University(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="universities/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)


class Course(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to="courses/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)


class StudyLevel(TimeStampedModel):
    name = models.CharField(max_length=150, unique=True)
    slug = models.SlugField(unique=True)
    status = models.CharField(max_length=20, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)


class EducationalInfo(TimeStampedModel):
    title = models.CharField(max_length=255)
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name="educational_infos")
    institution_name = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    next_batch = models.CharField(max_length=120, blank=True)
    entry_score = models.CharField(max_length=120, blank=True)
    course_name = models.CharField(max_length=255, blank=True)
    study_level = models.ForeignKey(
        StudyLevel, on_delete=models.SET_NULL, blank=True, null=True, related_name="educational_infos"
    )
    description = models.TextField(blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    scholarship_available = models.BooleanField(default=False)
    scholarship_percentage = models.CharField(max_length=50, blank=True)
    card_banner = models.ImageField(upload_to="educational-info/cards/", blank=True, null=True)
    status = models.CharField(max_length=20, choices=ActiveStatus.choices, default=ActiveStatus.ACTIVE)
    show_on_home = models.BooleanField(default=False)


class EducationalPageContent(TimeStampedModel):
    educational_info = models.OneToOneField(
        EducationalInfo, on_delete=models.CASCADE, related_name="page_content"
    )
    headline = models.CharField(max_length=255, blank=True)
    head_description = models.TextField(blank=True)
    banner_image = models.ImageField(upload_to="educational-info/banner/", blank=True, null=True)
    living_cost = models.TextField(blank=True)
    academic_intake = models.TextField(blank=True)
    deadline = models.TextField(blank=True)
    popular_programs_text = models.TextField(blank=True)
    popular_program_names = models.JSONField(default=list, blank=True)


class WhyThisCountryPoint(TimeStampedModel):
    educational_info = models.ForeignKey(
        EducationalInfo, on_delete=models.CASCADE, related_name="why_this_country_points"
    )
    point = models.CharField(max_length=255)
    point_detail = models.TextField(blank=True)
    source_link = models.URLField(blank=True)


class ProgramDuration(TimeStampedModel):
    educational_info = models.ForeignKey(
        EducationalInfo, on_delete=models.CASCADE, related_name="program_durations"
    )
    program_name = models.CharField(max_length=255)
    duration = models.CharField(max_length=120)


class TopUniversity(TimeStampedModel):
    educational_info = models.ForeignKey(
        EducationalInfo, on_delete=models.CASCADE, related_name="top_universities"
    )
    institution = models.CharField(max_length=255)
    short_description = models.CharField(max_length=255, blank=True)
    ranking = models.CharField(max_length=50, blank=True)
    number_of_students = models.CharField(max_length=50, blank=True)
    logo = models.ImageField(upload_to="educational-info/universities/", blank=True, null=True)


class VisaChecklistItem(TimeStampedModel):
    educational_info = models.ForeignKey(
        EducationalInfo, on_delete=models.CASCADE, related_name="visa_checklist_items"
    )
    text = models.TextField()


class CountryFAQ(TimeStampedModel):
    educational_info = models.ForeignKey(
        EducationalInfo, on_delete=models.CASCADE, related_name="faqs"
    )
    question = models.TextField()
    answer = models.TextField()


class ScholarshipItem(TimeStampedModel):
    educational_info = models.ForeignKey(
        EducationalInfo, on_delete=models.CASCADE, related_name="scholarships"
    )
    text = models.TextField()
