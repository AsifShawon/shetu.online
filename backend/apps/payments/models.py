from django.db import models

from common.models import TimeStampedModel


class TransactionType(models.TextChoices):
    CASH_IN = "cash_in", "Cash In"
    CASH_OUT = "cash_out", "Cash Out"


class PayoutMethodType(models.TextChoices):
    BANK = "bank_account", "Bank Account"
    MOBILE = "mobile_banking", "Mobile Banking"


class WithdrawalStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    COMPLETED = "completed", "Completed"
    REJECTED = "rejected", "Rejected"


class DeliveryStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    IN_PROGRESS = "in_progress", "In Progress"
    DELIVERED = "delivered", "Delivered"


class PaymentStatus(models.TextChoices):
    UNPAID = "unpaid", "Unpaid"
    PAID = "paid", "Paid"
    SUCCESS = "success", "Success"


class RefundStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    APPROVED = "approved", "Approved"
    REJECTED = "rejected", "Rejected"
    PROCESSED = "processed", "Processed"


class SettlementStatus(models.TextChoices):
    HOLDING = "holding", "Holding"
    RELEASED = "released", "Released"
    REFUNDED = "refunded", "Refunded"


class WalletTransaction(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="wallet_transactions"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    bank_transaction_id = models.CharField(max_length=255, blank=True)
    invoice_number = models.CharField(max_length=255, blank=True)
    payment_method = models.CharField(max_length=120, blank=True)
    gateway_reference = models.CharField(max_length=255, blank=True)


class ConsultantPayoutMethod(TimeStampedModel):
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="payout_methods"
    )
    method_type = models.CharField(max_length=30, choices=PayoutMethodType.choices)
    account_holder_name = models.CharField(max_length=255)
    email_address = models.EmailField(blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    mobile_bank_type = models.CharField(max_length=50, blank=True)
    mobile_bank_number = models.CharField(max_length=50, blank=True)
    bank_name = models.CharField(max_length=255, blank=True)
    account_number = models.CharField(max_length=255, blank=True)
    branch_name = models.CharField(max_length=255, blank=True)
    routing_number = models.CharField(max_length=255, blank=True)


class WithdrawalRequest(TimeStampedModel):
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="withdrawal_requests"
    )
    payout_method = models.ForeignKey(
        ConsultantPayoutMethod,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="withdrawal_requests",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=WithdrawalStatus.choices, default=WithdrawalStatus.PENDING)
    notes = models.TextField(blank=True)
    transaction_reference = models.CharField(max_length=255, blank=True)


class Order(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="orders"
    )
    assessment = models.OneToOneField(
        "assessments.Assessment",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="order",
    )
    order_number = models.CharField(max_length=120, unique=True)
    delivery_status = models.CharField(max_length=20, choices=DeliveryStatus.choices, default=DeliveryStatus.PENDING)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)
    payment_method = models.CharField(max_length=120, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    bank_transaction_id = models.CharField(max_length=255, blank=True)
    invoice_number = models.CharField(max_length=255, blank=True)


class RefundRequest(TimeStampedModel):
    assessment = models.ForeignKey(
        "assessments.Assessment",
        on_delete=models.CASCADE,
        related_name="refund_requests",
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="refund_requests",
    )
    requested_by = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="refund_requests"
    )
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=RefundStatus.choices, default=RefundStatus.PENDING)
    admin_notes = models.TextField(blank=True)
    processed_at = models.DateTimeField(blank=True, null=True)


class AssessmentSettlement(TimeStampedModel):
    assessment = models.OneToOneField(
        "assessments.Assessment",
        on_delete=models.CASCADE,
        related_name="settlement",
    )
    consultant = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="assessment_settlements"
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assessment_settlements",
    )
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2)
    net_amount = models.DecimalField(max_digits=12, decimal_places=2)
    hold_until = models.DateTimeField()
    status = models.CharField(max_length=20, choices=SettlementStatus.choices, default=SettlementStatus.HOLDING)
    released_at = models.DateTimeField(blank=True, null=True)
    wallet_transaction = models.ForeignKey(
        WalletTransaction,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="released_settlements",
    )


class CourseOrder(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="course_orders"
    )
    training = models.ForeignKey(
        "consultants.Training", on_delete=models.CASCADE, related_name="orders"
    )
    price = models.DecimalField(max_digits=12, decimal_places=2)
    order_number = models.CharField(max_length=120)
    bank_transaction_id = models.CharField(max_length=255, blank=True)
    invoice_number = models.CharField(max_length=255, blank=True)
    payment_method = models.CharField(max_length=120, blank=True)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.UNPAID)


class CourseEnrollment(TimeStampedModel):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="course_enrollments"
    )
    training = models.ForeignKey(
        "consultants.Training", on_delete=models.CASCADE, related_name="enrollments"
    )
    access_enabled = models.BooleanField(default=True)
    enrollment_type = models.CharField(max_length=20, default="paid")
    deadline = models.DateField(blank=True, null=True)
