from rest_framework import serializers

from apps.catalog.models import Country, ServiceCategory, StudyLevel
from apps.consultants.models import ConsultantService
from apps.marketplace.models import Quotation, StudentPost


class StudentPostSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    country_id = serializers.PrimaryKeyRelatedField(
        source="country",
        queryset=Country.objects.all(),
        allow_null=True,
        required=False,
    )
    service_category_id = serializers.PrimaryKeyRelatedField(
        source="service_category",
        queryset=ServiceCategory.objects.all(),
        allow_null=True,
        required=False,
    )
    study_level_id = serializers.PrimaryKeyRelatedField(
        source="study_level",
        queryset=StudyLevel.objects.all(),
        allow_null=True,
        required=False,
    )
    custom_country_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=150)
    custom_service_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=150)
    custom_study_level_name = serializers.CharField(write_only=True, required=False, allow_blank=True, max_length=150)
    student_name = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    study_level_name = serializers.SerializerMethodField()

    class Meta:
        model = StudentPost
        fields = [
            "id",
            "student_id",
            "student_name",
            "title",
            "description",
            "country_id",
            "country_name",
            "custom_country_name",
            "service_category_id",
            "service_name",
            "custom_service_name",
            "subject",
            "institute",
            "session",
            "study_level_id",
            "study_level_name",
            "custom_study_level_name",
            "budget",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        instance = getattr(self, "instance", None)

        country = attrs.get("country", getattr(instance, "country", None))
        custom_country_name = self._clean_input(
            attrs.get("custom_country_name", getattr(instance, "custom_country_name", ""))
        )
        if not country and not custom_country_name:
            raise serializers.ValidationError({"country_id": "Select a country or enter a custom country."})

        service_category = attrs.get("service_category", getattr(instance, "service_category", None))
        custom_service_name = self._clean_input(
            attrs.get("custom_service_name", getattr(instance, "custom_service_name", ""))
        )
        if not service_category and not custom_service_name:
            raise serializers.ValidationError({"service_category_id": "Select a service or enter a custom service."})

        study_level = attrs.get("study_level", getattr(instance, "study_level", None))
        custom_study_level_name = self._clean_input(
            attrs.get("custom_study_level_name", getattr(instance, "custom_study_level_name", ""))
        )

        if country and custom_country_name:
            attrs["custom_country_name"] = ""
        else:
            attrs["custom_country_name"] = custom_country_name

        if service_category and custom_service_name:
            attrs["custom_service_name"] = ""
        else:
            attrs["custom_service_name"] = custom_service_name

        if study_level and custom_study_level_name:
            attrs["custom_study_level_name"] = ""
        else:
            attrs["custom_study_level_name"] = custom_study_level_name

        return attrs

    def get_student_name(self, obj):
        user = obj.student
        return f"{user.first_name} {user.last_name}".strip() or user.email

    def get_country_name(self, obj):
        return obj.country.name if obj.country else obj.custom_country_name or None

    def get_service_name(self, obj):
        return obj.service_category.name if obj.service_category else obj.custom_service_name or None

    def get_study_level_name(self, obj):
        if obj.study_level:
            return obj.study_level.name
        return obj.custom_study_level_name or None

    @staticmethod
    def _clean_input(value):
        return (value or "").strip()


class QuotationSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    post_id = serializers.PrimaryKeyRelatedField(source="post", queryset=StudentPost.objects.all())
    post_title = serializers.CharField(source="post.title", read_only=True)
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)
    consultant_name = serializers.SerializerMethodField()
    consultant_service_id = serializers.PrimaryKeyRelatedField(
        source="consultant_service",
        queryset=ConsultantService.objects.select_related("consultant"),
    )
    service_title = serializers.CharField(source="consultant_service.title", read_only=True)

    class Meta:
        model = Quotation
        fields = [
            "id",
            "student_id",
            "post_id",
            "post_title",
            "consultant_id",
            "consultant_name",
            "consultant_service_id",
            "service_title",
            "quotation",
            "status",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context["request"]
        post = attrs["post"]
        consultant_service = attrs["consultant_service"]

        if consultant_service.consultant_id != request.user.id:
            raise serializers.ValidationError(
                {"consultant_service_id": "You can only send quotations from your own services."}
            )

        return attrs

    def get_consultant_name(self, obj):
        user = obj.consultant
        return f"{user.first_name} {user.last_name}".strip() or user.email
