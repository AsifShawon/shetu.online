from rest_framework import serializers

from apps.accounts.models import User
from apps.catalog.models import Country, ServiceCategory, StudyLevel
from apps.consultants.models import (
    ConsultantProfile,
    ConsultantService,
    Experience,
    PersonalTraining,
    ProPackage,
    ProSubscription,
    Qualification,
    Subject,
    Training,
)



class EmptyDateStringMixin:
    date_fields: tuple[str, ...] = ()

    def to_internal_value(self, data):
        mutable = data.copy()
        for field in self.date_fields:
            if mutable.get(field) == "":
                mutable[field] = None
        return super().to_internal_value(mutable)


class QualificationSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = Qualification
        fields = [
            "id",
            "user_id",
            "level_of_education",
            "degree_title",
            "institution",
            "department",
            "passing_year",
            "cgpa",
            "grading_system",
            "duration",
            "document",
            "created_at",
            "updated_at",
        ]


class ExperienceSerializer(EmptyDateStringMixin, serializers.ModelSerializer):
    date_fields = ("start_date", "end_date")
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = Experience
        fields = [
            "id",
            "user_id",
            "organization",
            "designation",
            "responsibilities",
            "start_date",
            "end_date",
            "duration",
            "document",
            "cv_document",
            "cover_letter",
            "experience_certificate",
            "skill_languages",
            "co_curricular_activities",
            "created_at",
            "updated_at",
        ]


class PersonalTrainingSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)

    class Meta:
        model = PersonalTraining
        fields = "__all__"
        extra_kwargs = {"user": {"read_only": True}}


class TrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Training
        fields = "__all__"


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"


class ConsultantServiceSerializer(serializers.ModelSerializer):
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)
    country_id = serializers.PrimaryKeyRelatedField(source="country", queryset=Country.objects.all())
    country_name = serializers.CharField(source="country.name", read_only=True)
    country_image = serializers.SerializerMethodField()
    service_categories = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=ServiceCategory.objects.all(),
        required=False,
    )
    study_levels = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=StudyLevel.objects.all(),
        required=False,
    )
    subjects = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Subject.objects.all(),
        required=False,
    )
    subject_names_input = serializers.ListField(
        child=serializers.CharField(max_length=150),
        write_only=True,
        required=False,
    )
    consultant_name = serializers.SerializerMethodField()
    consultant_image = serializers.SerializerMethodField()
    consultant_verification_status = serializers.CharField(
        source="consultant.verification_status", read_only=True
    )
    consultant_subscription_status = serializers.CharField(
        source="consultant.subscription_status", read_only=True
    )
    consultant_joined_at = serializers.DateTimeField(source="consultant.date_joined", read_only=True)
    consultant_rating = serializers.SerializerMethodField()
    consultant_review_count = serializers.SerializerMethodField()
    service_category_names = serializers.SerializerMethodField()
    study_level_names = serializers.SerializerMethodField()
    subject_names = serializers.SerializerMethodField()

    class Meta:
        model = ConsultantService
        fields = [
            "id",
            "created_at",
            "updated_at",
            "consultant_id",
            "consultant_name",
            "consultant_image",
            "consultant_rating",
            "consultant_review_count",
            "consultant_verification_status",
            "consultant_subscription_status",
            "consultant_joined_at",
            "country_id",
            "country_name",
            "country_image",
            "title",
            "description",
            "price",
            "duration",
            "status",
            "service_categories",
            "service_category_names",
            "study_levels",
            "study_level_names",
            "subjects",
            "subject_names_input",
            "subject_names",
        ]

    def _build_url(self, field_file):
        if not field_file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(field_file.url)
        return field_file.url

    def get_consultant_name(self, obj):
        user = obj.consultant
        return f"{user.first_name} {user.last_name}".strip() or user.email

    def get_consultant_image(self, obj):
        return self._build_url(obj.consultant.image)

    def get_consultant_rating(self, obj):
        value = getattr(obj, "consultant_rating_value", None)
        return round(float(value), 1) if value is not None else 0

    def get_consultant_review_count(self, obj):
        return getattr(obj, "consultant_review_count_value", 0) or 0

    def get_country_image(self, obj):
        return self._build_url(obj.country.image)

    def get_service_category_names(self, obj):
        return [item.name for item in obj.service_categories.all()]

    def get_study_level_names(self, obj):
        return [item.name for item in obj.study_levels.all()]

    def get_subject_names(self, obj):
        return [item.name for item in obj.subjects.all()]

    def create(self, validated_data):
        subject_names = validated_data.pop("subject_names_input", [])
        service_categories = validated_data.pop("service_categories", [])
        study_levels = validated_data.pop("study_levels", [])
        subjects = list(validated_data.pop("subjects", []))
        service = super().create(validated_data)
        service.service_categories.set(service_categories)
        service.study_levels.set(study_levels)
        if subject_names:
            subjects.extend(self._get_or_create_subjects(subject_names))
        service.subjects.set(subjects)
        return service

    def update(self, instance, validated_data):
        subject_names = validated_data.pop("subject_names_input", None)
        service_categories = validated_data.pop("service_categories", None)
        study_levels = validated_data.pop("study_levels", None)
        subjects = validated_data.pop("subjects", None)
        service = super().update(instance, validated_data)

        if service_categories is not None:
            service.service_categories.set(service_categories)
        if study_levels is not None:
            service.study_levels.set(study_levels)
        if subject_names is not None:
            subject_objects = self._get_or_create_subjects(subject_names)
            if subjects:
                subject_objects.extend(subjects)
            service.subjects.set(subject_objects)
        elif subjects is not None:
            service.subjects.set(subjects)

        return service

    @staticmethod
    def _get_or_create_subjects(subject_names):
        items = []
        for raw_name in subject_names:
            name = raw_name.strip()
            if not name:
                continue
            subject, _ = Subject.objects.get_or_create(name=name)
            items.append(subject)
        return items


class ProPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProPackage
        fields = "__all__"


class ProSubscriptionSerializer(serializers.ModelSerializer):
    package_name = serializers.CharField(source="package.name", read_only=True)

    class Meta:
        model = ProSubscription
        fields = [
            "id",
            "user",
            "package",
            "package_name",
            "starts_at",
            "ends_at",
            "active",
            "created_at",
            "updated_at",
        ]


class PublicConsultantProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    joined_at = serializers.DateTimeField(source="date_joined", read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    years_of_experience = serializers.SerializerMethodField()
    assessment_time_value = serializers.SerializerMethodField()
    assessment_time_unit = serializers.SerializerMethodField()
    assessment_types = serializers.SerializerMethodField()
    qualifications = QualificationSerializer(many=True, read_only=True)
    experiences = ExperienceSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "name",
            "full_name",
            "email",
            "phone",
            "gender",
            "image",
            "image_url",
            "present_address",
            "present_city",
            "present_country",
            "occupation",
            "skill_languages",
            "experience_summary",
            "verification_status",
            "subscription_status",
            "profile_completion",
            "joined_at",
            "avg_rating",
            "review_count",
            "years_of_experience",
            "assessment_time_value",
            "assessment_time_unit",
            "assessment_types",
            "qualifications",
            "experiences",
        ]

    def _build_url(self, field_file):
        if not field_file:
            return None
        request = self.context.get("request")
        if request:
            host = request.get_host()
            if "backend" in host:
                return field_file.url
            return request.build_absolute_uri(field_file.url)
        return field_file.url

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_full_name(self, obj):
        return self.get_name(obj)

    def get_image(self, obj):
        return self._build_url(obj.image)

    def get_image_url(self, obj):
        return self._build_url(obj.image)

    def get_avg_rating(self, obj):
        value = getattr(obj, "calculated_avg_rating", None)
        return round(float(value), 1) if value is not None else 0.0

    def get_review_count(self, obj):
        return getattr(obj, "calculated_review_count", 0) or 0

    def _consultant_profile(self, obj):
        try:
            return obj.consultant_profile
        except Exception:
            return None

    def get_years_of_experience(self, obj):
        profile = self._consultant_profile(obj)
        return profile.years_of_experience if profile else None

    def get_assessment_time_value(self, obj):
        profile = self._consultant_profile(obj)
        return profile.assessment_time_value if profile else None

    def get_assessment_time_unit(self, obj):
        profile = self._consultant_profile(obj)
        return profile.assessment_time_unit if profile else ""

    def get_assessment_types(self, obj):
        profile = self._consultant_profile(obj)
        return profile.assessment_types if profile else []

