from decimal import Decimal
from uuid import uuid4

from django.db.models import Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.payments.api.serializers import (
    AssessmentSettlementSerializer,
    ConsultantPayoutMethodSerializer,
    CourseEnrollmentSerializer,
    CourseOrderSerializer,
    OrderSerializer,
    RefundRequestSerializer,
    WalletTransactionSerializer,
    WithdrawalRequestSerializer,
)
from apps.payments.models import (
    AssessmentSettlement,
    ConsultantPayoutMethod,
    CourseEnrollment,
    CourseOrder,
    Order,
    RefundRequest,
    SettlementStatus,
    WalletTransaction,
    WithdrawalRequest,
)
from common.permissions.roles import IsAdmin
from common.services.payment import SurjoPayService
from common.permissions.roles import IsConsultant


MINIMUM_RESERVE = Decimal("2000.00")


def get_withdrawable_balance(user) -> Decimal:
    released_total = (
        AssessmentSettlement.objects.filter(consultant=user, status=SettlementStatus.RELEASED)
        .aggregate(total=Sum("net_amount"))["total"]
        or Decimal("0")
    )
    reserved_withdrawals = (
        WithdrawalRequest.objects.filter(consultant=user, status__in=["pending", "completed"])
        .aggregate(total=Sum("amount"))["total"]
        or Decimal("0")
    )
    return released_total - reserved_withdrawals


class WalletTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = WalletTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WalletTransaction.objects.filter(user=self.request.user)


class ConsultantPayoutMethodViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultantPayoutMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [IsConsultant()]

    def get_queryset(self):
        return ConsultantPayoutMethod.objects.filter(consultant=self.request.user)

    def perform_create(self, serializer):
        serializer.save(consultant=self.request.user)


class WithdrawalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = WithdrawalRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        return [IsConsultant()]

    def get_queryset(self):
        return WithdrawalRequest.objects.select_related("payout_method").filter(
            consultant=self.request.user
        )

    def perform_create(self, serializer):
        balance = get_withdrawable_balance(self.request.user)

        if serializer.validated_data["amount"] > balance:
            raise PermissionDenied("Withdrawal amount exceeds available balance.")
        if (balance - serializer.validated_data["amount"]) < MINIMUM_RESERVE:
            raise PermissionDenied("Withdrawal would breach the minimum reserve of 2000 Taka.")

        serializer.save(consultant=self.request.user)

    @action(detail=False, methods=["get"], url_path="balance-summary")
    def balance_summary(self, request):
        released = (
            AssessmentSettlement.objects.filter(consultant=request.user, status=SettlementStatus.RELEASED)
            .aggregate(total=Sum("net_amount"))["total"]
            or Decimal("0")
        )
        holding = (
            AssessmentSettlement.objects.filter(consultant=request.user, status=SettlementStatus.HOLDING)
            .aggregate(total=Sum("net_amount"))["total"]
            or Decimal("0")
        )
        withdrawable = get_withdrawable_balance(request.user)
        return Response(
            {
                "released_balance": f"{released:.2f}",
                "holding_balance": f"{holding:.2f}",
                "withdrawable_balance": f"{withdrawable:.2f}",
                "minimum_reserve": f"{MINIMUM_RESERVE:.2f}",
            }
        )


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assessment = serializer.validated_data.get("assessment")
        subtotal = serializer.validated_data.get("subtotal")
        total = serializer.validated_data.get("total")
        if assessment:
            amount = assessment.assessment_charge or Decimal("0")
            subtotal = subtotal or amount
            total = total or amount
        if not subtotal or not total:
            raise ValidationError("Subtotal and total are required.")
        order = serializer.save(
            user=request.user,
            order_number=serializer.validated_data.get("order_number") or f"ASMT-{uuid4().hex[:12].upper()}",
            subtotal=subtotal,
            total=total,
        )
        session = SurjoPayService().create_session(
            amount=str(order.total),
            reference=order.order_number,
            return_url=request.build_absolute_uri("/payments/callback"),
        )
        payload = self.get_serializer(order).data
        payload.update({"checkout_url": session.checkout_url, "payment_reference": session.reference})
        return Response(payload, status=status.HTTP_201_CREATED)


class CourseOrderViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseOrder.objects.select_related("training").filter(user=self.request.user)


class CourseEnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseEnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CourseEnrollment.objects.select_related("training").filter(user=self.request.user)


class RefundRequestViewSet(viewsets.ModelViewSet):
    serializer_class = RefundRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = RefundRequest.objects.select_related("assessment", "order")
        user = self.request.user
        if getattr(user, "role", None) == "admin":
            return queryset
        return queryset.filter(requested_by=user)

    def get_permissions(self):
        if self.action in {"list", "retrieve", "create"}:
            return [permissions.IsAuthenticated()]
        return [IsAdmin()]

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)


class AssessmentSettlementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AssessmentSettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = AssessmentSettlement.objects.select_related("assessment", "consultant", "order")
        user = self.request.user
        if getattr(user, "role", None) == "admin":
            return queryset
        return queryset.filter(consultant=user)


class PaymentCallbackView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        reference = request.data.get("reference")
        status_value = (request.data.get("status") or "success").lower()
        payment_method = request.data.get("payment_method", "surjopay")
        if not reference:
            raise ValidationError("Missing payment reference.")

        order = Order.objects.filter(order_number=reference).first()
        if order:
            order.payment_status = "success" if status_value == "success" else "unpaid"
            order.payment_method = payment_method
            order.bank_transaction_id = request.data.get("bank_transaction_id", order.bank_transaction_id)
            order.invoice_number = request.data.get("invoice_number", order.invoice_number)
            order.save()
            return Response(OrderSerializer(order).data)

        course_order = CourseOrder.objects.filter(order_number=reference).first()
        if course_order:
            course_order.payment_status = "success" if status_value == "success" else "unpaid"
            course_order.payment_method = payment_method
            course_order.bank_transaction_id = request.data.get("bank_transaction_id", course_order.bank_transaction_id)
            course_order.invoice_number = request.data.get("invoice_number", course_order.invoice_number)
            course_order.save()
            if course_order.payment_status == "success":
                CourseEnrollment.objects.get_or_create(
                    user=course_order.user,
                    training=course_order.training,
                    defaults={"access_enabled": True, "enrollment_type": "paid"},
                )
            return Response(CourseOrderSerializer(course_order).data)

        raise ValidationError("Unknown payment reference.")
