from django.urls import path

from apps.accounts.api.views import (
    ChangePasswordView,
    CsrfCookieView,
    CurrentUserView,
    ForgotPasswordStartView,
    ForgotPasswordVerifyView,
    NotificationListView,
    NotificationReadAllView,
    NotificationReadView,
    OTPVerifyView,
    RegistrationStartView,
    ResendOTPView,
    ResetPasswordView,
    SavedConsultantDetailView,
    SavedConsultantListCreateView,
    SessionLoginView,
    SessionLogoutView,
)


urlpatterns = [
    path("csrf/", CsrfCookieView.as_view(), name="csrf-cookie"),
    path("login/", SessionLoginView.as_view(), name="login"),
    path("logout/", SessionLogoutView.as_view(), name="logout"),
    path("me/", CurrentUserView.as_view(), name="current-user"),
    path("register/start/", RegistrationStartView.as_view(), name="register-start"),
    path("register/verify/", OTPVerifyView.as_view(), name="register-verify"),
    path("resend-otp/", ResendOTPView.as_view(), name="resend-otp"),
    path("forgot-password/", ForgotPasswordStartView.as_view(), name="forgot-password"),
    path("forgot-password/verify/", ForgotPasswordVerifyView.as_view(), name="forgot-password-verify"),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("notifications/", NotificationListView.as_view(), name="notifications"),
    path(
        "notifications/read-all/",
        NotificationReadAllView.as_view(),
        name="notifications-read-all",
    ),
    path(
        "notifications/<int:notification_id>/read/",
        NotificationReadView.as_view(),
        name="notification-read",
    ),
    path("saved-consultants/", SavedConsultantListCreateView.as_view(), name="saved-consultants"),
    path("saved-consultants/<int:saved_id>/", SavedConsultantDetailView.as_view(), name="saved-consultant-detail"),
]
