from rest_framework import permissions, viewsets

from apps.catalog.api.serializers import (
    CitySerializer,
    CountrySerializer,
    CourseSerializer,
    EducationalInfoSerializer,
    ServiceCategorySerializer,
    StudyLevelSerializer,
    UniversitySerializer,
)
from apps.catalog.models import City, Country, Course, EducationalInfo, ServiceCategory, StudyLevel, University


class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [permissions.AllowAny]


class CityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = City.objects.select_related("country").all()
        country_id = self.request.query_params.get("country_id")
        if country_id:
            queryset = queryset.filter(country_id=country_id)
        return queryset


class UniversityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = University.objects.all()
    serializer_class = UniversitySerializer
    permission_classes = [permissions.AllowAny]


class CourseViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]


class StudyLevelViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = StudyLevel.objects.all()
    serializer_class = StudyLevelSerializer
    permission_classes = [permissions.AllowAny]


class EducationalInfoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EducationalInfo.objects.select_related("country", "study_level", "page_content").all()
    serializer_class = EducationalInfoSerializer
    permission_classes = [permissions.AllowAny]
