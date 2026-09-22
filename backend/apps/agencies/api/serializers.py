from rest_framework import serializers

from apps.agencies.models import (
    AgencyConsultant,
    AgencyCountryOffering,
    AgencyGalleryImage,
    AgencyProfile,
    AgencyService,
)


class AgencyProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyProfile
        fields = "__all__"


class AgencyConsultantSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyConsultant
        fields = "__all__"


class AgencyServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyService
        fields = "__all__"


class AgencyCountryOfferingSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyCountryOffering
        fields = "__all__"


class AgencyGalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgencyGalleryImage
        fields = "__all__"
