from dataclasses import dataclass
import random

from django.core.mail import send_mail
from django.conf import settings

from common.services.sms import SMSService


@dataclass
class OtpResult:
    code: str
    channel: str
    target: str


class OTPService:
    @staticmethod
    def generate_code() -> str:
        return f"{random.randint(1000, 9999)}"

    @staticmethod
    def send_email_otp(email: str, code: str) -> OtpResult:
        subject = "Your EduWise Verification Code"
        message = (
            f"Your EduWise OTP verification code is: {code}\n\n"
            f"This code expires in 1 minute.\n"
            f"If you did not request this, please ignore this email."
        )
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return OtpResult(code=code, channel="email", target=email)

    @staticmethod
    def send_phone_otp(phone: str, code: str) -> OtpResult:
        message = f"Your EduWise OTP verification code is {code}. It expires in 1 minute."
        SMSService().send(phone=phone, message=message)
        return OtpResult(code=code, channel="sms", target=phone)
