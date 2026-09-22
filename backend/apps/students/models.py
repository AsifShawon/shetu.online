from django.db import models

from common.models import TimeStampedModel


class AcademicTrack(models.TextChoices):
    BANGLA = "bangla", "Bangla"
    ENGLISH = "english", "English"
    MADRASA = "madrasa", "Madrasa"
    POST_GRADUATE = "post_graduate", "Post Graduate"


class StudentProfile(TimeStampedModel):
    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="student_profile"
    )
    academic_track = models.CharField(max_length=20, choices=AcademicTrack.choices, blank=True)
    o_level_result = models.CharField(max_length=50, blank=True)
    a_level_result = models.CharField(max_length=50, blank=True)
    hsc_result = models.CharField(max_length=50, blank=True)
    ssc_result = models.CharField(max_length=50, blank=True)
    dakhil_result = models.CharField(max_length=50, blank=True)
    alim_result = models.CharField(max_length=50, blank=True)
    ielts_score = models.CharField(max_length=20, blank=True)
    o_level_certificate = models.FileField(upload_to="students/certificates/", blank=True, null=True)
    a_level_certificate = models.FileField(upload_to="students/certificates/", blank=True, null=True)
    hsc_certificate = models.FileField(upload_to="students/certificates/", blank=True, null=True)
    ssc_certificate = models.FileField(upload_to="students/certificates/", blank=True, null=True)
    dakhil_certificate = models.FileField(upload_to="students/certificates/", blank=True, null=True)
    alim_certificate = models.FileField(upload_to="students/certificates/", blank=True, null=True)
    ielts_certificate = models.FileField(upload_to="students/certificates/", blank=True, null=True)
    last_education_title = models.CharField(max_length=255, blank=True)
    last_education_department = models.CharField(max_length=255, blank=True)
    last_education_result = models.CharField(max_length=50, blank=True)
    last_education_certificate = models.FileField(upload_to="students/last-education/", blank=True, null=True)
    last_education_start = models.DateField(blank=True, null=True)
    last_education_end = models.DateField(blank=True, null=True)
    last_education_duration = models.CharField(max_length=100, blank=True)
    cv_document = models.FileField(upload_to="students/cv/", blank=True, null=True)
    cover_letter = models.FileField(upload_to="students/cover-letters/", blank=True, null=True)
    experience_certificate = models.FileField(
        upload_to="students/experience-certificates/", blank=True, null=True
    )
    skill_languages = models.CharField(max_length=255, blank=True)
    co_curricular_activities = models.TextField(blank=True)


class PostGraduateProfile(TimeStampedModel):
    user = models.OneToOneField(
        "accounts.User", on_delete=models.CASCADE, related_name="postgraduate_profile"
    )
    grade = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=255, blank=True)
    duration = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=255, blank=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    certificate = models.FileField(upload_to="students/postgraduate/", blank=True, null=True)


class StudentChoice(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="student_choices"
    )
    service = models.ForeignKey(
        "catalog.ServiceCategory", on_delete=models.CASCADE, related_name="student_choices"
    )
    country = models.ForeignKey(
        "catalog.Country", on_delete=models.CASCADE, related_name="student_choices"
    )
    institute = models.CharField(max_length=255, blank=True)
    subject = models.CharField(max_length=255, blank=True)
    session = models.CharField(max_length=100, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)


class StudentQualification(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="student_qualifications"
    )
    level_of_education = models.CharField(max_length=120)
    degree_title = models.CharField(max_length=255)
    institution = models.CharField(max_length=255)
    board_or_university = models.CharField(max_length=255, blank=True)
    department = models.CharField(max_length=255, blank=True)
    passing_year = models.CharField(max_length=20, blank=True)
    result = models.CharField(max_length=20, blank=True)
    grading_system = models.CharField(max_length=50, blank=True)
    duration = models.CharField(max_length=100, blank=True)
    document = models.FileField(upload_to="students/qualifications/", blank=True, null=True)


class StudentExperience(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="student_experiences"
    )
    organization = models.CharField(max_length=255)
    designation = models.CharField(max_length=255)
    responsibilities = models.TextField(blank=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    duration = models.CharField(max_length=100, blank=True)
    cv_document = models.FileField(upload_to="students/experience/cv/", blank=True, null=True)
    cover_letter = models.FileField(upload_to="students/experience/cover-letters/", blank=True, null=True)
    experience_certificate = models.FileField(
        upload_to="students/experience/certificates/", blank=True, null=True
    )


class StudentTraining(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="student_trainings"
    )
    title = models.CharField(max_length=255)
    organization = models.CharField(max_length=255)
    year = models.CharField(max_length=20)
    duration = models.CharField(max_length=100, blank=True)
    result_or_award = models.CharField(max_length=255, blank=True)
    document = models.FileField(upload_to="students/training-certs/", blank=True, null=True)


class StudyAbroadLead(TimeStampedModel):
    name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20)
    email = models.EmailField(unique=True)
    last_education_title = models.CharField(max_length=255, blank=True)
    last_education_result = models.CharField(max_length=50, blank=True)
    ielts_score = models.CharField(max_length=20, blank=True)
    interest_for = models.CharField(max_length=120, blank=True)
    preferred_country = models.ForeignKey(
        "catalog.Country", on_delete=models.SET_NULL, blank=True, null=True
    )
    budget = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    note = models.TextField(blank=True)
