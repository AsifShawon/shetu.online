from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.payments.models import AssessmentSettlement, SettlementStatus, WalletTransaction


class Command(BaseCommand):
    help = "Release consultant assessment settlements that have completed their holding period."

    def handle(self, *args, **options):
        settlements = AssessmentSettlement.objects.filter(
            status=SettlementStatus.HOLDING,
            hold_until__lte=timezone.now(),
        ).select_related("consultant", "assessment")
        released = 0
        for settlement in settlements:
            transaction = WalletTransaction.objects.create(
                user=settlement.consultant,
                amount=settlement.net_amount,
                transaction_type="cash_in",
                invoice_number=getattr(getattr(settlement, "order", None), "invoice_number", ""),
                payment_method="assessment_settlement",
                gateway_reference=f"assessment:{settlement.assessment_id}",
            )
            settlement.wallet_transaction = transaction
            settlement.status = SettlementStatus.RELEASED
            settlement.released_at = timezone.now()
            settlement.save(update_fields=["wallet_transaction", "status", "released_at", "updated_at"])
            released += 1

        self.stdout.write(self.style.SUCCESS(f"Released {released} assessment settlements."))
