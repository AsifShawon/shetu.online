from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.students.api.serializers import (
    PostGraduateProfileSerializer,
    StudentChoiceSerializer,
    StudentExperienceSerializer,
    StudentProfileSerializer,
    StudentQualificationSerializer,
    StudentTrainingSerializer,
    StudyAbroadLeadSerializer,
)
from apps.students.models import (
    PostGraduateProfile,
    StudentChoice,
    StudentExperience,
    StudentProfile,
    StudentQualification,
    StudentTraining,
    StudyAbroadLead,
)
from common.permissions.roles import IsStudent


class StudentProfileViewSet(viewsets.ModelViewSet):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return StudentProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        profile = serializer.save(user=self.request.user)
        profile.user.recalculate_profile_completion()

    def perform_update(self, serializer):
        profile = serializer.save()
        profile.user.recalculate_profile_completion()


class PostGraduateProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PostGraduateProfileSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return PostGraduateProfile.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudentChoiceViewSet(viewsets.ModelViewSet):
    serializer_class = StudentChoiceSerializer
    permission_classes = [IsStudent]

    def get_queryset(self):
        return StudentChoice.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudentQualificationViewSet(viewsets.ModelViewSet):
    serializer_class = StudentQualificationSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return StudentQualification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudentExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = StudentExperienceSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return StudentExperience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudentTrainingViewSet(viewsets.ModelViewSet):
    serializer_class = StudentTrainingSerializer
    permission_classes = [IsStudent]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return StudentTraining.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class StudyAbroadLeadViewSet(viewsets.ModelViewSet):
    queryset = StudyAbroadLead.objects.all()
    serializer_class = StudyAbroadLeadSerializer
    permission_classes = [permissions.AllowAny]
