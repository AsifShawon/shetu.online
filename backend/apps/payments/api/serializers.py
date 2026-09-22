from rest_framework import serializers

from apps.assessments.models import Assessment
from apps.payments.models import (
    AssessmentSettlement,
    ConsultantPayoutMethod,
    CourseEnrollment,
    CourseOrder,
    Order,
    RefundRequest,
    WalletTransaction,
    WithdrawalRequest,
)


class WalletTransactionSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = WalletTransaction
        fields = [
            "id",
            "user",
            "user_name",
            "amount",
            "transaction_type",
            "bank_transaction_id",
            "invoice_number",
            "payment_method",
            "gateway_reference",
            "created_at",
            "updated_at",
        ]

    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class ConsultantPayoutMethodSerializer(serializers.ModelSerializer):
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)

    class Meta:
        model = ConsultantPayoutMethod
        fields = [
            "id",
            "consultant_id",
            "method_type",
            "account_holder_name",
            "email_address",
            "phone_number",
            "mobile_bank_type",
            "mobile_bank_number",
            "bank_name",
            "account_number",
            "branch_name",
            "routing_number",
            "created_at",
            "updated_at",
        ]


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)
    consultant_name = serializers.SerializerMethodField()
    payout_method_id = serializers.PrimaryKeyRelatedField(
        source="payout_method",
        queryset=ConsultantPayoutMethod.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = WithdrawalRequest
        fields = [
            "id",
            "consultant_id",
            "consultant_name",
            "payout_method_id",
            "amount",
            "status",
            "notes",
            "transaction_reference",
            "created_at",
            "updated_at",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["payout_method_id"].queryset = ConsultantPayoutMethod.objects.filter(
                consultant=request.user
            )

    def get_consultant_name(self, obj):
        return f"{obj.consultant.first_name} {obj.consultant.last_name}".strip() or obj.consultant.email


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    assessment_id = serializers.PrimaryKeyRelatedField(
        source="assessment",
        queryset=Assessment.objects.all(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "user",
            "customer_name",
            "assessment_id",
            "order_number",
            "delivery_status",
            "payment_status",
            "payment_method",
            "subtotal",
            "total",
            "bank_transaction_id",
            "invoice_number",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context["request"]
        assessment = attrs.get("assessment")
        if assessment and assessment.student_id != request.user.id:
            raise serializers.ValidationError({"assessment_id": "You can only create orders for your own assessments."})
        return attrs


class CourseOrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    training_id = serializers.IntegerField(source="training.id", read_only=True)
    training_title = serializers.CharField(source="training.title", read_only=True)

    class Meta:
        model = CourseOrder
        fields = [
            "id",
            "user",
            "customer_name",
            "training_id",
            "training_title",
            "price",
            "order_number",
            "bank_transaction_id",
            "invoice_number",
            "payment_method",
            "payment_status",
            "created_at",
            "updated_at",
        ]

    def get_customer_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email


class CourseEnrollmentSerializer(serializers.ModelSerializer):
    training_id = serializers.IntegerField(source="training.id", read_only=True)
    training_title = serializers.CharField(source="training.title", read_only=True)

    class Meta:
        model = CourseEnrollment
        fields = [
            "id",
            "user",
            "training_id",
            "training_title",
            "access_enabled",
            "enrollment_type",
            "deadline",
            "created_at",
            "updated_at",
        ]


class RefundRequestSerializer(serializers.ModelSerializer):
    assessment_id = serializers.PrimaryKeyRelatedField(source="assessment", queryset=Assessment.objects.all())
    order_id = serializers.PrimaryKeyRelatedField(source="order", queryset=Order.objects.all())
    requested_by_id = serializers.IntegerField(source="requested_by.id", read_only=True)

    class Meta:
        model = RefundRequest
        fields = [
            "id",
            "assessment_id",
            "order_id",
            "requested_by_id",
            "reason",
            "status",
            "admin_notes",
            "processed_at",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context["request"]
        assessment = attrs["assessment"]
        order = attrs["order"]
        if assessment.student_id != request.user.id or order.user_id != request.user.id:
            raise serializers.ValidationError("You can only request refunds for your own paid assessments.")
        if order.assessment_id != assessment.id:
            raise serializers.ValidationError({"order_id": "The order must belong to the selected assessment."})
        return attrs


class AssessmentSettlementSerializer(serializers.ModelSerializer):
    assessment_id = serializers.IntegerField(source="assessment.id", read_only=True)
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)
    order_id = serializers.IntegerField(source="order.id", read_only=True)

    class Meta:
        model = AssessmentSettlement
        fields = [
            "id",
            "assessment_id",
            "consultant_id",
            "order_id",
            "gross_amount",
            "net_amount",
            "hold_until",
            "status",
            "released_at",
            "created_at",
            "updated_at",
        ]
