from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.payments.api.views import (
    AssessmentSettlementViewSet,
    ConsultantPayoutMethodViewSet,
    CourseEnrollmentViewSet,
    CourseOrderViewSet,
    OrderViewSet,
    PaymentCallbackView,
    RefundRequestViewSet,
    WalletTransactionViewSet,
    WithdrawalRequestViewSet,
)

router = DefaultRouter()
router.register("wallet-transactions", WalletTransactionViewSet, basename="wallet-transactions")
router.register("payout-methods", ConsultantPayoutMethodViewSet, basename="payout-methods")
router.register("withdrawals", WithdrawalRequestViewSet, basename="withdrawals")
router.register("orders", OrderViewSet, basename="orders")
router.register("course-orders", CourseOrderViewSet, basename="course-orders")
router.register("course-enrollments", CourseEnrollmentViewSet, basename="course-enrollments")
router.register("refund-requests", RefundRequestViewSet, basename="refund-requests")
router.register("settlements", AssessmentSettlementViewSet, basename="settlements")

urlpatterns = [
    path("callback/", PaymentCallbackView.as_view(), name="payment-callback"),
    *router.urls,
]
