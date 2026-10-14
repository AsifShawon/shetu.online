from decimal import Decimal
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User, UserRole
from apps.assessments.models import Assessment
from apps.catalog.models import Country
from apps.consultants.models import ConsultantService
from apps.payments.api.views import get_withdrawable_balance
from apps.payments.models import (
    AssessmentSettlement,
    ConsultantPayoutMethod,
    Order,
    WalletTransaction,
    WithdrawalRequest,
)


class PaymentsAndWithdrawalsSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.consultant = User.objects.create_user(
            email="consultant_fin@example.com",
            password="Password123!",
            role=UserRole.CONSULTANT,
            first_name="Alice",
            last_name="Fin",
            balance=Decimal("5000.00"),
        )

        self.student = User.objects.create_user(
            email="student_fin@example.com",
            password="Password123!",
            role=UserRole.STUDENT,
            first_name="Charlie",
            last_name="Student",
            balance=Decimal("0.00"),
        )

        self.country = Country.objects.create(name="United Kingdom", slug="uk-fin")
        self.service = ConsultantService.objects.create(
            consultant=self.consultant,
            country=self.country,
            title="Consultation Service",
            price=Decimal("5000.00"),
            duration="1 hour",
        )

        # Create released settlement so Alice has 5000.00 withdrawable balance
        self.assessment = Assessment.objects.create(
            student=self.student,
            consultant=self.consultant,
            consultant_service=self.service,
            assessment_title="Consultation",
            assessment_charge=Decimal("5000.00"),
            assessment_duration="1 hour",
        )
        AssessmentSettlement.objects.create(
            assessment=self.assessment,
            consultant=self.consultant,
            gross_amount=Decimal("5000.00"),
            net_amount=Decimal("5000.00"),
            hold_until=timezone.now(),
            status="released",
        )

        self.other_consultant = User.objects.create_user(
            email="other_consultant@example.com",
            password="Password123!",
            role=UserRole.CONSULTANT,
            first_name="Bob",
            last_name="Other",
            balance=Decimal("1000.00"),
        )

        self.payout_method = ConsultantPayoutMethod.objects.create(
            consultant=self.consultant,
            method_type="mobile_banking",
            account_holder_name="Alice Fin",
            mobile_bank_type="bKash",
            mobile_bank_number="01700000000",
        )

        self.other_payout_method = ConsultantPayoutMethod.objects.create(
            consultant=self.other_consultant,
            method_type="mobile_banking",
            account_holder_name="Bob Other",
            mobile_bank_type="Nagad",
            mobile_bank_number="01800000000",
        )

    def test_withdrawal_requires_positive_amount(self):
        """Zero or negative withdrawal amount is rejected."""
        self.client.force_authenticate(user=self.consultant)

        response = self.client.post(
            "/api/payments/withdrawals/",
            {"payout_method_id": self.payout_method.id, "amount": "-100.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_withdrawal_enforces_payout_method_ownership(self):
        """Consultant cannot withdraw using a payout method owned by another consultant."""
        self.client.force_authenticate(user=self.consultant)

        response = self.client.post(
            "/api/payments/withdrawals/",
            {"payout_method_id": self.other_payout_method.id, "amount": "500.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_withdrawal_enforces_minimum_reserve(self):
        """Withdrawal cannot leave balance below the 2000 BDT minimum reserve."""
        self.client.force_authenticate(user=self.consultant)

        # Alice balance is 5000. Minimum reserve is 2000. Max withdrawable is 3000.
        # Requesting 3500 should be rejected.
        response = self.client.post(
            "/api/payments/withdrawals/",
            {"payout_method_id": self.payout_method.id, "amount": "3500.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("minimum reserve", str(response.json()))

    def test_withdrawal_success_reserves_balance(self):
        """Valid withdrawal deducts balance and creates pending record."""
        self.client.force_authenticate(user=self.consultant)

        response = self.client.post(
            "/api/payments/withdrawals/",
            {"payout_method_id": self.payout_method.id, "amount": "1500.00"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(get_withdrawable_balance(self.consultant), Decimal("3500.00"))
        self.assertEqual(WithdrawalRequest.objects.filter(consultant=self.consultant, status="pending").count(), 1)

    def test_client_cannot_mutate_withdrawal_status(self):
        """Consultants cannot mark withdrawals as completed or modify records."""
        self.client.force_authenticate(user=self.consultant)

        withdrawal = WithdrawalRequest.objects.create(
            consultant=self.consultant,
            payout_method=self.payout_method,
            amount=Decimal("500.00"),
            status="pending",
        )

        patch_resp = self.client.patch(
            f"/api/payments/withdrawals/{withdrawal.id}/",
            {"status": "completed"},
            format="json",
        )
        # Updates are forbidden on withdrawals
        self.assertIn(patch_resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_405_METHOD_NOT_ALLOWED])

    def test_client_cannot_alter_order_status_or_amount(self):
        """Clients cannot modify orders or forge payment status directly."""
        self.client.force_authenticate(user=self.student)

        order = Order.objects.create(
            user=self.student,
            order_number="ORD-TEST-001",
            subtotal=Decimal("1000.00"),
            total=Decimal("1000.00"),
            payment_status="unpaid",
        )

        patch_resp = self.client.patch(
            f"/api/payments/orders/{order.id}/",
            {"payment_status": "success", "total": "1.00"},
            format="json",
        )
        self.assertIn(patch_resp.status_code, [status.HTTP_403_FORBIDDEN, status.HTTP_405_METHOD_NOT_ALLOWED])

    @override_settings(
        SURJOPAY_MERCHANT_USERNAME="test_merchant",
        SURJOPAY_MERCHANT_PASSWORD="test_password",
    )
    def test_payment_callback_rejects_unverified_status(self):
        """PaymentCallbackView does not trust submitted status and rejects unverified orders."""
        order = Order.objects.create(
            user=self.student,
            order_number="ORD-UNVERIFIED-1",
            subtotal=Decimal("500.00"),
            total=Decimal("500.00"),
            payment_status="unpaid",
        )

        with patch("apps.payments.api.views.SurjoPayService.verify_payment") as mock_verify:
            mock_verify.return_value = {
                "is_successful": False,
                "sp_code": "1001",
                "sp_message": "Verification signature mismatch",
                "customer_order_id": order.order_number,
                "amount": "500.00",
            }

            # Even if callback data claims 'success', server rejects it
            response = self.client.post(
                "/api/payments/orders/payment-callback/",
                {"order_id": order.order_number, "status": "success"},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            order.refresh_from_db()
            self.assertEqual(order.payment_status, "unpaid")

    @override_settings(
        SURJOPAY_MERCHANT_USERNAME="test_merchant",
        SURJOPAY_MERCHANT_PASSWORD="test_password",
    )
    def test_payment_callback_idempotency_and_ledger_update(self):
        """Verified payment credits top-up atomically and duplicate callbacks are idempotent."""
        order = Order.objects.create(
            user=self.student,
            order_number="ORD-TOPUP-SUCCESS-1",
            subtotal=Decimal("500.00"),
            total=Decimal("500.00"),
            payment_status="unpaid",
        )

        with patch("apps.payments.api.views.SurjoPayService.verify_payment") as mock_verify:
            mock_verify.return_value = {
                "is_successful": True,
                "sp_code": "1000",
                "customer_order_id": order.order_number,
                "amount": "500.00",
                "currency": "BDT",
                "bank_trx_id": "TXN-BANK-12345",
                "invoice_no": "INV-SP-12345",
                "method": "bkash",
            }

            # First callback: processes and credits
            res1 = self.client.post(
                "/api/payments/orders/payment-callback/",
                {"order_id": order.order_number},
                format="json",
            )
            self.assertEqual(res1.status_code, status.HTTP_200_OK)

            order.refresh_from_db()
            self.assertEqual(order.payment_status, "success")
            self.student.refresh_from_db()
            self.assertEqual(self.student.balance, Decimal("500.00"))
            self.assertEqual(WalletTransaction.objects.filter(user=self.student, transaction_type="cash_in").count(), 1)

            # Duplicate callback with same order_id
            res2 = self.client.post(
                "/api/payments/orders/payment-callback/",
                {"order_id": order.order_number},
                format="json",
            )
            self.assertEqual(res2.status_code, status.HTTP_200_OK)

            # Ensure student balance was NOT credited twice
            self.student.refresh_from_db()
            self.assertEqual(self.student.balance, Decimal("500.00"))
            self.assertEqual(WalletTransaction.objects.filter(user=self.student, transaction_type="cash_in").count(), 1)
