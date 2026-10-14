import json
import logging
import urllib.error
import urllib.request
from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)


class PaymentConfigurationError(Exception):
    """Raised when payment gateway credentials are not configured."""
    pass


class PaymentVerificationError(Exception):
    """Raised when payment verification fails or provider returns an error."""
    pass


@dataclass
class PaymentSession:
    provider: str
    checkout_url: str
    reference: str


class SurjoPayService:
    def __init__(self):
        self.base_url = getattr(settings, "SURJOPAY_BASE_URL", "https://sandbox.shurjopayment.com").rstrip("/")
        self.username = getattr(settings, "SURJOPAY_MERCHANT_USERNAME", "")
        self.password = getattr(settings, "SURJOPAY_MERCHANT_PASSWORD", "")
        self.prefix = getattr(settings, "SURJOPAY_MERCHANT_PREFIX", "NOK")

    def is_configured(self) -> bool:
        return bool(self.username and self.password)

    def _post(self, endpoint: str, payload: dict[str, Any], token: str | None = None) -> Any:
        url = f"{self.base_url}{endpoint}"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                content = response.read().decode("utf-8")
                return json.loads(content)
        except urllib.error.HTTPError as exc:
            err_body = exc.read().decode("utf-8", errors="replace")
            logger.error("SurjoPay HTTP error %s on %s: %s", exc.code, endpoint, err_body)
            raise PaymentVerificationError(f"SurjoPay API HTTP {exc.code}: {err_body}") from exc
        except urllib.error.URLError as exc:
            logger.error("SurjoPay network error on %s: %s", endpoint, exc.reason)
            raise PaymentVerificationError(f"SurjoPay connection failure: {exc.reason}") from exc
        except json.JSONDecodeError as exc:
            logger.error("SurjoPay invalid JSON response from %s", endpoint)
            raise PaymentVerificationError("Invalid JSON response from SurjoPay.") from exc

    def get_token(self) -> str:
        if not self.is_configured():
            raise PaymentConfigurationError("SurjoPay credentials are not configured.")

        payload = {
            "username": self.username,
            "password": self.password,
        }
        resp = self._post("/api/get_token", payload)
        token = resp.get("token")
        if not token:
            msg = resp.get("message") or "Failed to obtain auth token from SurjoPay."
            raise PaymentVerificationError(msg)
        return token

    def create_session(
        self,
        *,
        amount: str,
        reference: str,
        return_url: str,
        cancel_url: str = "",
        customer_name: str = "Customer",
        customer_email: str = "",
        customer_phone: str = "",
        customer_address: str = "Dhaka",
        customer_city: str = "Dhaka",
        client_ip: str = "127.0.0.1",
    ) -> PaymentSession:
        if not self.is_configured():
            raise PaymentConfigurationError(
                "SurjoPay payment gateway is not configured with active credentials."
            )

        token = self.get_token()
        payload = {
            "prefix": self.prefix,
            "token": token,
            "return_url": return_url,
            "cancel_url": cancel_url or return_url,
            "store_id": 1,
            "amount": amount,
            "order_id": reference,
            "currency": "BDT",
            "customer_name": customer_name,
            "customer_address": customer_address,
            "customer_email": customer_email,
            "customer_phone": customer_phone or "01700000000",
            "customer_city": customer_city,
            "client_ip": client_ip,
        }

        resp = self._post("/api/secret-pay", payload, token=token)
        checkout_url = resp.get("checkout_url")
        sp_order_id = resp.get("sp_order_id") or reference
        if not checkout_url:
            msg = resp.get("message") or resp.get("sp_message") or "Failed to initiate payment session."
            raise PaymentVerificationError(msg)

        return PaymentSession(
            provider="surjopay",
            checkout_url=checkout_url,
            reference=sp_order_id,
        )

    def verify_payment(self, order_id: str) -> dict[str, Any]:
        """
        Verify transaction status server-side using SurjoPay verification endpoint.
        order_id is the sp_order_id or reference returned by the gateway.
        """
        if not self.is_configured():
            raise PaymentConfigurationError(
                "SurjoPay payment gateway is not configured with active credentials."
            )

        token = self.get_token()
        payload = {
            "order_id": order_id,
            "token": token,
        }
        resp = self._post("/api/verification", payload, token=token)

        # SurjoPay verification returns a list with single item or a dict
        data = resp[0] if isinstance(resp, list) and len(resp) > 0 else resp
        if not isinstance(data, dict):
            raise PaymentVerificationError("Unexpected verification response structure.")

        sp_code = str(data.get("sp_code", ""))
        bank_status = str(data.get("bank_status", "")).lower()
        is_successful = sp_code == "1000" or bank_status in {"success", "completed"}

        return {
            "is_successful": is_successful,
            "sp_code": sp_code,
            "sp_message": data.get("sp_message", ""),
            "order_id": data.get("order_id", ""),  # SurjoPay internal ID
            "customer_order_id": data.get("customer_order_id", ""),  # Our reference / order_number
            "amount": str(data.get("amount", "0")),
            "currency": data.get("currency", "BDT"),
            "bank_status": data.get("bank_status", ""),
            "bank_trx_id": data.get("bank_trx_id", "") or "",
            "invoice_no": data.get("invoice_no", "") or "",
            "method": data.get("method", "surjopay") or "surjopay",
            "raw_response": data,
        }

