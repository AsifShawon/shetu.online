from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError

from apps.marketplace.api.serializers import QuotationSerializer, StudentPostSerializer
from apps.marketplace.models import Quotation, StudentPost
from common.permissions.roles import IsConsultant, IsStudent
from common.services.moderation import ModerationService


class StudentPostViewSet(viewsets.ModelViewSet):
    serializer_class = StudentPostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    queryset = StudentPost.objects.select_related(
        "student", "country", "service_category", "study_level"
    ).all()

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsStudent()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in {"update", "partial_update", "destroy"} and self.request.user.is_authenticated:
            return queryset.filter(student=self.request.user)
        if self.request.query_params.get("mine") == "1" and self.request.user.is_authenticated:
            return queryset.filter(student=self.request.user)
        if self.action == "list" and self.request.query_params.get("mine") != "1":
            return queryset.filter(status="active")
        return queryset

    def perform_create(self, serializer):
        try:
            ModerationService.flag_and_raise(
                user=self.request.user,
                source_type="student_post",
                text="\n".join(
                    [
                        serializer.validated_data.get("title", ""),
                        serializer.validated_data.get("description", ""),
                    ]
                ),
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        serializer.save(student=self.request.user)

    def perform_update(self, serializer):
        try:
            ModerationService.flag_and_raise(
                user=self.request.user,
                source_type="student_post",
                source_id=self.get_object().id,
                text="\n".join(
                    [
                        serializer.validated_data.get("title", self.get_object().title),
                        serializer.validated_data.get("description", self.get_object().description),
                    ]
                ),
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        serializer.save()


class QuotationViewSet(viewsets.ModelViewSet):
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == "create":
            return [IsConsultant()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = Quotation.objects.select_related("post", "student", "consultant", "consultant_service")
        user = self.request.user
        if user.role == "consultant":
            return queryset.filter(consultant=user)
        if user.role == "student":
            return queryset.filter(student=user)
        return queryset.none()

    def perform_create(self, serializer):
        post = serializer.validated_data["post"]
        try:
            ModerationService.flag_and_raise(
                user=self.request.user,
                source_type="quotation",
                source_id=post.id,
                text=serializer.validated_data["quotation"],
            )
        except ValueError as exc:
            raise ValidationError(str(exc)) from exc
        serializer.save(consultant=self.request.user, student=post.student)
