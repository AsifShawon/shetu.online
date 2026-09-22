from rest_framework import serializers

from apps.catalog.models import Country, ServiceCategory
from apps.students.models import (
    PostGraduateProfile,
    StudentChoice,
    StudentExperience,
    StudentProfile,
    StudentQualification,
    StudentTraining,
    StudyAbroadLead,
)


class EmptyDateStringMixin:
    date_fields: tuple[str, ...] = ()

    def to_internal_value(self, data):
        mutable = data.copy()
        for field in self.date_fields:
            if mutable.get(field) == "":
                mutable[field] = None
        return super().to_internal_value(mutable)


class StudentProfileSerializer(EmptyDateStringMixin, serializers.ModelSerializer):
    date_fields = ("last_education_start", "last_education_end")

    class Meta:
        model = StudentProfile
        fields = "__all__"
        extra_kwargs = {
            "user": {"read_only": True},
        }


class PostGraduateProfileSerializer(EmptyDateStringMixin, serializers.ModelSerializer):
    date_fields = ("start_date", "end_date")

    class Meta:
        model = PostGraduateProfile
        fields = "__all__"
        extra_kwargs = {
            "user": {"read_only": True},
        }


class StudentChoiceSerializer(serializers.ModelSerializer):
    service_id = serializers.PrimaryKeyRelatedField(
        source="service",
        queryset=ServiceCategory.objects.all(),
    )
    service_name = serializers.CharField(source="service.name", read_only=True)
    country_id = serializers.PrimaryKeyRelatedField(
        source="country",
        queryset=Country.objects.all(),
    )
    country_name = serializers.CharField(source="country.name", read_only=True)

    class Meta:
        model = StudentChoice
        fields = [
            "id",
            "user",
            "service_id",
            "service_name",
            "country_id",
            "country_name",
            "institute",
            "subject",
            "session",
            "budget",
            "created_at",
            "updated_at",
        ]
        extra_kwargs = {
            "user": {"read_only": True},
        }


class StudentQualificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentQualification
        fields = "__all__"
        extra_kwargs = {"user": {"read_only": True}}


class StudentExperienceSerializer(EmptyDateStringMixin, serializers.ModelSerializer):
    date_fields = ("start_date", "end_date")

    class Meta:
        model = StudentExperience
        fields = "__all__"
        extra_kwargs = {"user": {"read_only": True}}


class StudentTrainingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentTraining
        fields = "__all__"
        extra_kwargs = {"user": {"read_only": True}}


class StudyAbroadLeadSerializer(serializers.ModelSerializer):
    preferred_country_name = serializers.CharField(source="preferred_country.name", read_only=True)

    class Meta:
        model = StudyAbroadLead
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "last_education_title",
            "last_education_result",
            "ielts_score",
            "interest_for",
            "preferred_country",
            "preferred_country_name",
            "budget",
            "note",
            "created_at",
            "updated_at",
        ]
