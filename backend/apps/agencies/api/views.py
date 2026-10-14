from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from apps.agencies.api.serializers import (
    AgencyConsultantSerializer,
    AgencyCountryOfferingSerializer,
    AgencyGalleryImageSerializer,
    AgencyProfileSerializer,
    AgencyServiceSerializer,
)
from apps.agencies.models import (
    AgencyConsultant,
    AgencyCountryOffering,
    AgencyGalleryImage,
    AgencyProfile,
    AgencyService,
)
from common.permissions.roles import IsAgency


def _get_agency_profile(user):
    try:
        return user.agency_profile
    except AgencyProfile.DoesNotExist:
        raise ValidationError(
            {"detail": "Agency profile not found. Please create your agency profile before managing team members, services, countries, or gallery."}
        )


class AgencyProfileViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyProfileSerializer
    permission_classes = [IsAgency]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return AgencyProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        if AgencyProfile.objects.filter(user=self.request.user).exists():
            raise ValidationError({"detail": "An agency profile already exists for your account."})
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


class AgencyConsultantViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyConsultantSerializer
    permission_classes = [IsAgency]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (
            AgencyConsultant.objects.filter(agency__user=self.request.user)
            .select_related("agency", "consultant")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        agency = _get_agency_profile(self.request.user)
        consultant = serializer.validated_data.get("consultant")
        if AgencyConsultant.objects.filter(agency=agency, consultant=consultant).exists():
            raise ValidationError({"detail": "This consultant is already added to your agency."})
        serializer.save(agency=agency)

    def perform_update(self, serializer):
        agency = _get_agency_profile(self.request.user)
        serializer.save(agency=agency)


class AgencyServiceViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyServiceSerializer
    permission_classes = [IsAgency]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (
            AgencyService.objects.filter(agency__user=self.request.user)
            .select_related("agency", "service_category")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        agency = _get_agency_profile(self.request.user)
        serializer.save(agency=agency)

    def perform_update(self, serializer):
        agency = _get_agency_profile(self.request.user)
        serializer.save(agency=agency)


class AgencyCountryOfferingViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyCountryOfferingSerializer
    permission_classes = [IsAgency]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (
            AgencyCountryOffering.objects.filter(agency__user=self.request.user)
            .select_related("agency", "country")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        agency = _get_agency_profile(self.request.user)
        country = serializer.validated_data.get("country")
        if AgencyCountryOffering.objects.filter(agency=agency, country=country).exists():
            raise ValidationError({"detail": "This country is already offered by your agency."})
        serializer.save(agency=agency)

    def perform_update(self, serializer):
        agency = _get_agency_profile(self.request.user)
        serializer.save(agency=agency)


class AgencyGalleryImageViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyGalleryImageSerializer
    permission_classes = [IsAgency]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return (
            AgencyGalleryImage.objects.filter(agency__user=self.request.user)
            .select_related("agency")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        agency = _get_agency_profile(self.request.user)
        serializer.save(agency=agency)

    def perform_update(self, serializer):
        agency = _get_agency_profile(self.request.user)
        serializer.save(agency=agency)
