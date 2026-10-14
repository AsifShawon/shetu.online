from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
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
    DeliveryStatus,
    Order,
    PaymentStatus,
    RefundRequest,
    SettlementStatus,
    TransactionType,
    WalletTransaction,
    WithdrawalRequest,
    WithdrawalStatus,
)
from common.permissions.roles import IsAdmin, IsConsultant
from common.services.payment import PaymentConfigurationError, PaymentVerificationError, SurjoPayService


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
        with transaction.atomic():
            user = User.objects.select_for_update().get(id=self.request.user.id)
            amount = serializer.validated_data["amount"]
            if amount <= Decimal("0"):
                raise ValidationError({"amount": "Withdrawal amount must be greater than zero."})

            balance = get_withdrawable_balance(user)
            if amount > balance:
                raise PermissionDenied("Withdrawal amount exceeds available balance.")
            if (balance - amount) < MINIMUM_RESERVE:
                raise PermissionDenied(f"Withdrawal would breach the minimum reserve of {MINIMUM_RESERVE} Taka.")

            serializer.save(consultant=user, status=WithdrawalStatus.PENDING)

    def update(self, request, *args, **kwargs):
        raise PermissionDenied("Withdrawal requests cannot be modified once submitted.")

    def partial_update(self, request, *args, **kwargs):
        raise PermissionDenied("Withdrawal requests cannot be modified once submitted.")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status != WithdrawalStatus.PENDING:
            raise PermissionDenied("Only pending withdrawal requests may be cancelled.")
        return super().destroy(request, *args, **kwargs)

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

    def update(self, request, *args, **kwargs):
        raise PermissionDenied("Orders cannot be modified by clients.")

    def partial_update(self, request, *args, **kwargs):
        raise PermissionDenied("Orders cannot be modified by clients.")

    def destroy(self, request, *args, **kwargs):
        raise PermissionDenied("Orders cannot be deleted.")

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        subtotal = serializer.validated_data["subtotal"]
        total = serializer.validated_data["total"]
        order_number = f"ORD-{uuid4().hex[:12].upper()}"

        order = serializer.save(
            user=request.user,
            order_number=order_number,
            subtotal=subtotal,
            total=total,
            payment_status=PaymentStatus.UNPAID,
            delivery_status=DeliveryStatus.PENDING,
        )

        surjo_service = SurjoPayService()
        payment_configured = surjo_service.is_configured()

        payload = self.get_serializer(order).data
        payload["payment_configured"] = payment_configured

        if payment_configured:
            try:
                session = surjo_service.create_session(
                    amount=str(order.total),
                    reference=order.order_number,
                    return_url=request.build_absolute_uri("/api/payments/callback/"),
                    customer_name=f"{request.user.first_name} {request.user.last_name}".strip() or "Customer",
                    customer_email=request.user.email,
                    customer_phone=request.user.phone or "01700000000",
                )
                payload.update({
                    "checkout_url": session.checkout_url,
                    "payment_reference": session.reference,
                })
            except Exception as exc:
                payload["checkout_url"] = None
                payload["payment_error"] = str(exc)
        else:
            payload["checkout_url"] = None
            payload["payment_message"] = (
                "SurjoPay payment gateway credentials are not configured. "
                "Online payment is currently unavailable."
            )

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

    def get(self, request):
        return self._process_callback(request)

    def post(self, request):
        return self._process_callback(request)

    def _process_callback(self, request):
        data = request.data if request.method == "POST" and request.data else request.query_params
        provider_ref = (
            data.get("order_id")
            or data.get("sp_order_id")
            or data.get("reference")
        )
        if not provider_ref:
            raise ValidationError({"detail": "Missing provider payment reference (order_id)."})

        surjo = SurjoPayService()
        if not surjo.is_configured():
            raise ValidationError({
                "detail": "SurjoPay credentials are not configured. Unverified payments are rejected.",
                "verified": False,
            })

        try:
            verification = surjo.verify_payment(provider_ref)
        except Exception as exc:
            raise ValidationError({
                "detail": f"Server-side payment verification failed: {exc}",
                "verified": False,
            })

        if not verification.get("is_successful"):
            customer_ref = verification.get("customer_order_id") or provider_ref
            order = Order.objects.filter(order_number=customer_ref).first()
            if order:
                order.payment_status = PaymentStatus.UNPAID
                order.save(update_fields=["payment_status", "updated_at"])
            raise ValidationError({
                "detail": "Payment was not marked successful by provider verification.",
                "verification": verification,
            })

        customer_ref = verification.get("customer_order_id")
        verified_amount = Decimal(str(verification.get("amount", "0")))

        with transaction.atomic():
            order = Order.objects.select_for_update().filter(order_number=customer_ref).first()
            if order:
                if order.total != verified_amount:
                    raise ValidationError({
                        "detail": f"Amount mismatch: expected {order.total}, provider verified {verified_amount}."
                    })

                # Idempotent processing: if already successful, return early
                if order.payment_status == PaymentStatus.SUCCESS:
                    return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

                order.payment_status = PaymentStatus.SUCCESS
                order.payment_method = verification.get("method") or "surjopay"
                order.bank_transaction_id = verification.get("bank_trx_id") or ""
                order.invoice_number = verification.get("invoice_no") or ""
                order.save()

                WalletTransaction.objects.create(
                    user=order.user,
                    amount=order.total,
                    transaction_type=TransactionType.CASH_IN,
                    bank_transaction_id=order.bank_transaction_id,
                    invoice_number=order.invoice_number,
                    payment_method=order.payment_method,
                    gateway_reference=provider_ref,
                )

                if not order.assessment:
                    order.user.balance = (order.user.balance or Decimal("0")) + order.total
                    order.user.save(update_fields=["balance"])
                else:
                    if order.assessment.status == "created":
                        order.assessment.status = "in_progress"
                        order.assessment.save(update_fields=["status", "updated_at"])

                return Response(OrderSerializer(order).data, status=status.HTTP_200_OK)

            course_order = CourseOrder.objects.select_for_update().filter(order_number=customer_ref).first()
            if course_order:
                if course_order.price != verified_amount:
                    raise ValidationError({
                        "detail": f"Amount mismatch: expected {course_order.price}, provider verified {verified_amount}."
                    })

                if course_order.payment_status == PaymentStatus.SUCCESS:
                    return Response(CourseOrderSerializer(course_order).data, status=status.HTTP_200_OK)

                course_order.payment_status = PaymentStatus.SUCCESS
                course_order.payment_method = verification.get("method") or "surjopay"
                course_order.bank_transaction_id = verification.get("bank_trx_id") or ""
                course_order.invoice_number = verification.get("invoice_no") or ""
                course_order.save()

                CourseEnrollment.objects.get_or_create(
                    user=course_order.user,
                    training=course_order.training,
                    defaults={"access_enabled": True, "enrollment_type": "paid"},
                )
                return Response(CourseOrderSerializer(course_order).data, status=status.HTTP_200_OK)

        raise ValidationError({"detail": f"Unknown payment reference '{customer_ref}'."})

