from rest_framework import serializers

from apps.catalog.models import (
    City,
    Country,
    Course,
    EducationalInfo,
    EducationalPageContent,
    ScholarshipItem,
    ServiceCategory,
    StudyLevel,
    TopUniversity,
    University,
    VisaChecklistItem,
    WhyThisCountryPoint,
)


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = "__all__"


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = "__all__"


class CitySerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source="country.name", read_only=True)

    class Meta:
        model = City
        fields = "__all__"


class UniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = University
        fields = "__all__"


class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = "__all__"


class StudyLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudyLevel
        fields = "__all__"


class EducationalPageContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EducationalPageContent
        fields = "__all__"


class WhyThisCountryPointSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhyThisCountryPoint
        fields = "__all__"


class TopUniversitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TopUniversity
        fields = "__all__"


class VisaChecklistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisaChecklistItem
        fields = "__all__"


class ScholarshipItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScholarshipItem
        fields = "__all__"


class EducationalInfoSerializer(serializers.ModelSerializer):
    page_content = EducationalPageContentSerializer(read_only=True)
    why_this_country_points = WhyThisCountryPointSerializer(many=True, read_only=True)
    top_universities = TopUniversitySerializer(many=True, read_only=True)
    visa_checklist_items = VisaChecklistItemSerializer(many=True, read_only=True)
    scholarships = ScholarshipItemSerializer(many=True, read_only=True)

    class Meta:
        model = EducationalInfo
        fields = "__all__"
