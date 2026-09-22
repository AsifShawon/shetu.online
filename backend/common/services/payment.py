from dataclasses import dataclass


@dataclass
class PaymentSession:
    provider: str
    checkout_url: str
    reference: str


class SurjoPayService:
    def create_session(self, *, amount: str, reference: str, return_url: str) -> PaymentSession:
        return PaymentSession(
            provider="surjopay",
            checkout_url=f"{return_url}?reference={reference}",
            reference=reference,
        )
