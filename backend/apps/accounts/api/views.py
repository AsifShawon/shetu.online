from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Avg, Count, Prefetch
from django.utils import timezone
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from django.contrib.auth import login, logout, update_session_auth_hash
from rest_framework import permissions, response, status
from rest_framework.views import APIView

from apps.accounts.api.serializers import (
    ChangePasswordSerializer,
    ForgotPasswordStartSerializer,
    ForgotPasswordVerifySerializer,
    LoginSerializer,
    NotificationSerializer,
    OTPVerifySerializer,
    RegistrationStartSerializer,
    SavedConsultantSerializer,
    ResendOTPSerializer,
    ResetPasswordSerializer,
    SaveConsultantSerializer,
    UserProfileUpdateSerializer,
    UserSerializer,
)
from apps.accounts.models import Notification, SavedConsultant
from apps.consultants.models import ConsultantService
from common.permissions.roles import IsStudentConsultantOrAgency


@method_decorator(ensure_csrf_cookie, name="dispatch")
class CsrfCookieView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return response.Response({"detail": "CSRF cookie set."}, status=status.HTTP_200_OK)


class SessionLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login(request, serializer.validated_data["user"])
        request.user.recalculate_profile_completion()
        return response.Response(UserSerializer(request.user, context={"request": request}).data)


class SessionLogoutView(APIView):
    def post(self, request):
        logout(request)
        return response.Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        if not request.user.is_authenticated:
            return response.Response({"detail": "Not authenticated."}, status=401)
        request.user.recalculate_profile_completion()
        return response.Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        if not request.user.is_authenticated:
            return response.Response({"detail": "Not authenticated."}, status=401)

        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        request.user.recalculate_profile_completion()
        return response.Response(UserSerializer(request.user, context={"request": request}).data)


class RegistrationStartView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegistrationStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response({"message": "OTP sent to your email."}, status=status.HTTP_200_OK)


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response({"message": "OTP resent successfully."}, status=status.HTTP_200_OK)


class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        login(request, user)
        user.recalculate_profile_completion()
        return response.Response(UserSerializer(user, context={"request": request}).data)


class ForgotPasswordStartView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response({"message": "Password reset OTP sent."}, status=status.HTTP_200_OK)


class ForgotPasswordVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return response.Response(payload, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return response.Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        update_session_auth_hash(request, user)
        return response.Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)


class NotificationListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        queryset = Notification.objects.filter(recipient=request.user)
        notifications = queryset[:30]
        return response.Response(
            {
                "notifications": NotificationSerializer(notifications, many=True).data,
                "unread_count": queryset.filter(read_at__isnull=True).count(),
            }
        )


class NotificationReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, notification_id: int):
        notification = Notification.objects.filter(
            recipient=request.user,
            id=notification_id,
        ).first()
        if not notification:
            return response.Response(
                {"detail": "Notification not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if notification.read_at is None:
            notification.read_at = timezone.now()
            notification.save(update_fields=["read_at", "updated_at"])

        return response.Response(NotificationSerializer(notification).data)


class NotificationReadAllView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        updated_count = Notification.objects.filter(
            recipient=request.user,
            read_at__isnull=True,
        ).update(read_at=timezone.now(), updated_at=timezone.now())
        return response.Response({"updated_count": updated_count, "unread_count": 0})


class SavedConsultantListCreateView(APIView):
    permission_classes = [IsStudentConsultantOrAgency]

    def get_queryset(self):
        consultant_service_qs = ConsultantService.objects.select_related("country")
        return (
            SavedConsultant.objects.filter(user=self.request.user)
            .select_related("consultant")
            .prefetch_related(Prefetch("consultant__consultant_services", queryset=consultant_service_qs))
            .annotate(
                consultant_rating_value=Avg("consultant__received_reviews__review_rating"),
                consultant_review_count_value=Count("consultant__received_reviews", distinct=True),
            )
        )

    def get(self, request):
        queryset = self.get_queryset()
        serializer = SavedConsultantSerializer(queryset, many=True, context={"request": request})
        return response.Response(serializer.data)

    def post(self, request):
        serializer = SaveConsultantSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        saved_consultant, created = SavedConsultant.objects.get_or_create(
            user=request.user,
            consultant=serializer.validated_data["consultant"],
        )
        saved_consultant = self.get_queryset().get(id=saved_consultant.id)
        read_serializer = SavedConsultantSerializer(saved_consultant, context={"request": request})
        return response.Response(
            read_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class SavedConsultantDetailView(APIView):
    permission_classes = [IsStudentConsultantOrAgency]

    def delete(self, request, saved_id: int):
        saved_consultant = SavedConsultant.objects.filter(user=request.user, id=saved_id).first()
        if not saved_consultant:
            return response.Response({"detail": "Saved consultant not found."}, status=status.HTTP_404_NOT_FOUND)

        saved_consultant.delete()
        return response.Response(status=status.HTTP_204_NO_CONTENT)
