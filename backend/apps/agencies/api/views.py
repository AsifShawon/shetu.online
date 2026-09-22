from rest_framework import permissions, viewsets

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


class AgencyProfileViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyProfileSerializer
    permission_classes = [IsAgency]

    def get_queryset(self):
        return AgencyProfile.objects.filter(user=self.request.user)


class AgencyConsultantViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyConsultantSerializer
    permission_classes = [IsAgency]

    def get_queryset(self):
        return AgencyConsultant.objects.filter(agency__user=self.request.user)


class AgencyServiceViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyServiceSerializer
    permission_classes = [IsAgency]

    def get_queryset(self):
        return AgencyService.objects.filter(agency__user=self.request.user)


class AgencyCountryOfferingViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyCountryOfferingSerializer
    permission_classes = [IsAgency]

    def get_queryset(self):
        return AgencyCountryOffering.objects.filter(agency__user=self.request.user)


class AgencyGalleryImageViewSet(viewsets.ModelViewSet):
    serializer_class = AgencyGalleryImageSerializer
    permission_classes = [IsAgency]

    def get_queryset(self):
        return AgencyGalleryImage.objects.filter(agency__user=self.request.user)
