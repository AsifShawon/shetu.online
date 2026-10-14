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
        subject = "Your Shetu Verification Code"
        message = (
            f"Your Shetu verification code is:\n\n"
            f"{code}\n\n"
            f"This code expires in 1 minute.\n\n"
            f"If you did not request this, please ignore this email."
        )
        html_message = (
            f'<!DOCTYPE html>\n'
            f'<html>\n'
            f'<head>\n'
            f'  <meta charset="utf-8">\n'
            f'  <title>Your Shetu Verification Code</title>\n'
            f'</head>\n'
            f'<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6fa; margin: 0; padding: 24px; color: #1e293b;">\n'
            f'  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px 24px; border: 1px solid #e2e8f0; text-align: center;">\n'
            f'    <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #0f255f;">Shetu</h2>\n'
            f'    <p style="margin: 0 0 20px; font-size: 15px; color: #475569;">Your Shetu verification code is:</p>\n'
            f'    <div style="display: inline-block; padding: 14px 28px; background-color: #f0f4fd; border: 1px solid #c8d8ef; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #0f255f; font-family: monospace, sans-serif; user-select: all; -webkit-user-select: all;">\n'
            f'      {code}\n'
            f'    </div>\n'
            f'    <p style="margin: 24px 0 8px; font-size: 13px; color: #64748b;">This code expires in 1 minute.</p>\n'
            f'    <p style="margin: 0; font-size: 12px; color: #94a3b8;">If you did not request this, please ignore this email.</p>\n'
            f'  </div>\n'
            f'</body>\n'
            f'</html>'
        )
        from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "Shetu Support <noreply@shetu.online>")
        if "EduWise" in from_email or "eduwise" in from_email:
            from_email = "Shetu Support <noreply@shetu.online>"
        send_mail(
            subject=subject,
            message=message,
            from_email=from_email,
            recipient_list=[email],
            fail_silently=False,
            html_message=html_message,
        )
        return OtpResult(code=code, channel="email", target=email)

    @staticmethod
    def send_phone_otp(phone: str, code: str) -> OtpResult:
        message = f"Your Shetu OTP verification code is {code}. It expires in 1 minute."
        SMSService().send(phone=phone, message=message)
        return OtpResult(code=code, channel="sms", target=phone)
