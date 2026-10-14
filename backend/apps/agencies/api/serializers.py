from rest_framework import serializers

from apps.accounts.models import User, UserRole
from apps.agencies.models import (
    AgencyConsultant,
    AgencyCountryOffering,
    AgencyGalleryImage,
    AgencyProfile,
    AgencyService,
)
from apps.catalog.models import Country, ServiceCategory


def _build_url(request, file_field):
    if not file_field:
        return None
    url = file_field.url
    if request:
        url = request.build_absolute_uri(url)
        if "backend:8000" in url:
            url = url.replace("backend:8000", "localhost:8000")
    return url


class AgencyProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    banner_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AgencyProfile
        fields = [
            "id",
            "user_id",
            "slogan",
            "description",
            "banner_heading",
            "sub_heading",
            "banner",
            "banner_url",
            "about_text",
            "mission",
            "vision",
            "policy",
            "map_link",
            "image",
            "image_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_id", "banner_url", "image_url", "created_at", "updated_at"]

    def get_banner_url(self, obj):
        return _build_url(self.context.get("request"), obj.banner)

    def get_image_url(self, obj):
        return _build_url(self.context.get("request"), obj.image)


class AgencyConsultantSerializer(serializers.ModelSerializer):
    agency_id = serializers.IntegerField(source="agency.id", read_only=True)
    consultant_id = serializers.PrimaryKeyRelatedField(
        source="consultant",
        queryset=User.objects.filter(role=UserRole.CONSULTANT, is_active=True),
    )
    consultant_name = serializers.SerializerMethodField()
    consultant_email = serializers.EmailField(source="consultant.email", read_only=True)
    consultant_image = serializers.SerializerMethodField()
    verification_status = serializers.CharField(source="consultant.verification_status", read_only=True)

    class Meta:
        model = AgencyConsultant
        fields = [
            "id",
            "agency_id",
            "consultant_id",
            "consultant_name",
            "consultant_email",
            "consultant_image",
            "verification_status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "agency_id",
            "consultant_name",
            "consultant_email",
            "consultant_image",
            "verification_status",
            "created_at",
            "updated_at",
        ]

    def get_consultant_name(self, obj):
        name = f"{obj.consultant.first_name} {obj.consultant.last_name}".strip()
        return name or obj.consultant.email

    def get_consultant_image(self, obj):
        return _build_url(self.context.get("request"), obj.consultant.image)


class AgencyServiceSerializer(serializers.ModelSerializer):
    agency_id = serializers.IntegerField(source="agency.id", read_only=True)
    service_category_id = serializers.PrimaryKeyRelatedField(
        source="service_category",
        queryset=ServiceCategory.objects.all(),
        required=True,
    )
    service_name = serializers.CharField(source="service_category.name", read_only=True, default="")
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AgencyService
        fields = [
            "id",
            "agency_id",
            "service_category_id",
            "service_name",
            "title",
            "description",
            "image",
            "image_url",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "agency_id", "service_name", "image_url", "created_at", "updated_at"]

    def get_image_url(self, obj):
        return _build_url(self.context.get("request"), obj.image)


class AgencyCountryOfferingSerializer(serializers.ModelSerializer):
    agency_id = serializers.IntegerField(source="agency.id", read_only=True)
    country_id = serializers.PrimaryKeyRelatedField(
        source="country",
        queryset=Country.objects.all(),
        required=True,
    )
    country_name = serializers.CharField(source="country.name", read_only=True, default="")
    country_image = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AgencyCountryOffering
        fields = [
            "id",
            "agency_id",
            "country_id",
            "country_name",
            "country_image",
            "title",
            "description",
            "image",
            "image_url",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "agency_id",
            "country_name",
            "country_image",
            "image_url",
            "created_at",
            "updated_at",
        ]

    def get_country_image(self, obj):
        return _build_url(self.context.get("request"), obj.country.image)

    def get_image_url(self, obj):
        return _build_url(self.context.get("request"), obj.image)


class AgencyGalleryImageSerializer(serializers.ModelSerializer):
    agency_id = serializers.IntegerField(source="agency.id", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AgencyGalleryImage
        fields = [
            "id",
            "agency_id",
            "image",
            "image_url",
            "active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "agency_id", "image_url", "created_at", "updated_at"]

    def get_image_url(self, obj):
        return _build_url(self.context.get("request"), obj.image)
