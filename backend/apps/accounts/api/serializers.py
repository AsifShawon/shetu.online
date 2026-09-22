import re
import secrets
from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import (
    Notification,
    OTPVerification,
    SavedConsultant,
    User,
    UserRole,
    VerificationRequest,
)
from apps.catalog.models import City, University
from apps.consultants.models import ConsultantProfile
from common.services.otp import OTPService


class EmptyDateStringMixin:
    date_fields: tuple[str, ...] = ()

    def to_internal_value(self, data):
        mutable = data.copy()
        for field in self.date_fields:
            if mutable.get(field) == "":
                mutable[field] = None
        return super().to_internal_value(mutable)


def validate_password_complexity(value: str) -> str:
    validate_password(value)
    rules = (
        (r"[A-Z]", "Password must contain at least one uppercase letter."),
        (r"[a-z]", "Password must contain at least one lowercase letter."),
        (r"\d", "Password must contain at least one number."),
        (r"[^A-Za-z0-9]", "Password must contain at least one special character."),
    )
    for pattern, message in rules:
        if not re.search(pattern, value):
            raise serializers.ValidationError(message)
    return value


def ensure_user_is_not_banned(user: User):
    if user.is_currently_banned():
        raise serializers.ValidationError("This account is suspended.")


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField(read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)
    preferred_city_ids = serializers.SerializerMethodField(read_only=True)
    preferred_university_ids = serializers.SerializerMethodField(read_only=True)
    years_of_experience = serializers.SerializerMethodField(read_only=True)
    assessment_time_value = serializers.SerializerMethodField(read_only=True)
    assessment_time_unit = serializers.SerializerMethodField(read_only=True)
    assessment_types = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "gender",
            "present_address",
            "present_city",
            "present_country",
            "occupation",
            "skill_languages",
            "date_of_birth",
            "nationality",
            "passport_or_nid",
            "passport_issue_date",
            "passport_expiry_date",
            "role",
            "account_type",
            "verification_status",
            "subscription_status",
            "profile_completion",
            "balance",
            "image_url",
            "preferred_city_ids",
            "preferred_university_ids",
            "years_of_experience",
            "assessment_time_value",
            "assessment_time_unit",
            "assessment_types",
            "is_banned",
            "banned_until",
            "ban_reason",
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_preferred_city_ids(self, obj):
        return list(obj.preferred_cities.values_list("id", flat=True))

    def get_preferred_university_ids(self, obj):
        return list(obj.preferred_universities.values_list("id", flat=True))

    def _consultant_profile(self, obj):
        try:
            return obj.consultant_profile
        except Exception:
            return None

    def get_years_of_experience(self, obj):
        profile = self._consultant_profile(obj)
        return profile.years_of_experience if profile else None

    def get_assessment_time_value(self, obj):
        profile = self._consultant_profile(obj)
        return profile.assessment_time_value if profile else None

    def get_assessment_time_unit(self, obj):
        profile = self._consultant_profile(obj)
        return profile.assessment_time_unit if profile else ""

    def get_assessment_types(self, obj):
        profile = self._consultant_profile(obj)
        return profile.assessment_types if profile else []


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "title",
            "message",
            "kind",
            "action_url",
            "is_read",
            "read_at",
            "created_at",
        ]
        read_only_fields = fields

    def get_is_read(self, obj):
        return obj.read_at is not None


class SavedConsultantSerializer(serializers.ModelSerializer):
    consultant_id = serializers.IntegerField(source="consultant.id", read_only=True)
    consultant_name = serializers.SerializerMethodField()
    consultant_image = serializers.SerializerMethodField()
    consultant_country_name = serializers.SerializerMethodField()
    consultant_country_image = serializers.SerializerMethodField()
    consultant_rating = serializers.SerializerMethodField()
    consultant_review_count = serializers.SerializerMethodField()
    consultant_verification_status = serializers.CharField(source="consultant.verification_status", read_only=True)
    consultant_subscription_status = serializers.CharField(source="consultant.subscription_status", read_only=True)

    class Meta:
        model = SavedConsultant
        fields = [
            "id",
            "consultant_id",
            "consultant_name",
            "consultant_image",
            "consultant_country_name",
            "consultant_country_image",
            "consultant_rating",
            "consultant_review_count",
            "consultant_verification_status",
            "consultant_subscription_status",
            "created_at",
        ]

    def _build_url(self, field_file):
        if not field_file:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(field_file.url)
        return field_file.url

    def _consultant_country(self, obj):
        consultant = obj.consultant
        services = getattr(consultant, "_prefetched_objects_cache", {}).get("consultant_services")
        service_list = list(services) if services is not None else list(
            consultant.consultant_services.select_related("country").all()
        )

        active_service = next((service for service in service_list if service.status == "active"), None)
        country = getattr(active_service, "country", None)
        if country is not None:
            return country

        fallback_service = next((service for service in service_list if getattr(service, "country", None) is not None), None)
        return getattr(fallback_service, "country", None)

    def get_consultant_name(self, obj):
        return f"{obj.consultant.first_name} {obj.consultant.last_name}".strip() or obj.consultant.email

    def get_consultant_image(self, obj):
        return self._build_url(obj.consultant.image)

    def get_consultant_country_name(self, obj):
        country = self._consultant_country(obj)
        return country.name if country else ""

    def get_consultant_country_image(self, obj):
        country = self._consultant_country(obj)
        return self._build_url(country.image) if country else None

    def get_consultant_rating(self, obj):
        value = getattr(obj, "consultant_rating_value", None)
        return round(float(value), 1) if value is not None else 0

    def get_consultant_review_count(self, obj):
        return getattr(obj, "consultant_review_count_value", 0) or 0


class SaveConsultantSerializer(serializers.Serializer):
    consultant_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source="consultant")

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        consultant = attrs["consultant"]

        if user.role not in {UserRole.STUDENT, UserRole.CONSULTANT, UserRole.AGENCY}:
            raise serializers.ValidationError("Only students, consultants, and agencies can save consultants.")

        if consultant.role != UserRole.CONSULTANT:
            raise serializers.ValidationError("Only consultant profiles can be saved.")

        if consultant.id == user.id:
            raise serializers.ValidationError("You cannot save your own consultant profile.")

        attrs["user"] = user
        return attrs


class UserProfileUpdateSerializer(EmptyDateStringMixin, serializers.ModelSerializer):
    date_fields = ("date_of_birth", "passport_issue_date", "passport_expiry_date")
    preferred_city_ids = serializers.PrimaryKeyRelatedField(
        source="preferred_cities",
        many=True,
        queryset=City.objects.all(),
        required=False,
    )
    preferred_university_ids = serializers.PrimaryKeyRelatedField(
        source="preferred_universities",
        many=True,
        queryset=University.objects.all(),
        required=False,
    )
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    assessment_time_value = serializers.IntegerField(required=False, allow_null=True)
    assessment_time_unit = serializers.CharField(required=False, allow_blank=True)
    assessment_types = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "first_name",
            "last_name",
            "phone",
            "gender",
            "present_address",
            "present_city",
            "present_country",
            "occupation",
            "skill_languages",
            "date_of_birth",
            "nationality",
            "passport_or_nid",
            "passport_issue_date",
            "passport_expiry_date",
            "image",
            "preferred_city_ids",
            "preferred_university_ids",
            "years_of_experience",
            "assessment_time_value",
            "assessment_time_unit",
            "assessment_types",
        ]

    def update(self, instance, validated_data):
        preferred_cities = validated_data.pop("preferred_cities", None)
        preferred_universities = validated_data.pop("preferred_universities", None)
        consultant_profile_updates = {
            "years_of_experience": validated_data.pop("years_of_experience", None),
            "assessment_time_value": validated_data.pop("assessment_time_value", None),
            "assessment_time_unit": validated_data.pop("assessment_time_unit", None),
            "assessment_types": validated_data.pop("assessment_types", None),
        }
        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()
        if preferred_cities is not None:
            instance.preferred_cities.set(preferred_cities)
        if preferred_universities is not None:
            instance.preferred_universities.set(preferred_universities)
        if instance.role == UserRole.CONSULTANT and any(value is not None for value in consultant_profile_updates.values()):
            profile, _ = ConsultantProfile.objects.get_or_create(user=instance)
            for key, value in consultant_profile_updates.items():
                if value is not None:
                    setattr(profile, key, value)
            profile.save()
        return instance


class LoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()
    password = serializers.CharField()

    def validate(self, attrs):
        identifier = attrs["identifier"].strip()
        user = User.objects.filter(email__iexact=identifier).first()
        if not user:
            user = User.objects.filter(phone=identifier).first()
        username = user.email if user else identifier
        user = authenticate(username=username, password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        ensure_user_is_not_banned(user)
        attrs["user"] = user
        return attrs


class RegistrationStartSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, validators=[validate_password_complexity])
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20)
    role = serializers.ChoiceField(choices=[choice for choice in UserRole.choices if choice[0] != UserRole.ADMIN])
    present_country = serializers.CharField(max_length=100, required=False, allow_blank=True)
    present_city = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def create(self, validated_data):
        OTPVerification.objects.filter(
            email=validated_data["email"],
            purpose="registration",
            consumed_at__isnull=True,
        ).delete()
        code = OTPService.generate_code()
        otp = OTPVerification.objects.create(
            purpose="registration",
            email=validated_data["email"],
            code=code,
            payload=validated_data,
            expires_at=timezone.now() + timedelta(minutes=1),
        )
        OTPService.send_email_otp(validated_data["email"], code)
        if validated_data.get("phone"):
            OTPService.send_phone_otp(validated_data["phone"], code)
        return otp


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)
    purpose = serializers.CharField(default="registration", required=False)

    def validate(self, attrs):
        otp = OTPVerification.objects.filter(
            email=attrs["email"],
            code=attrs["code"],
            purpose=attrs.get("purpose", "registration"),
            consumed_at__isnull=True,
        ).order_by("-created_at").first()
        if not otp or otp.expires_at < timezone.now():
            raise serializers.ValidationError("Invalid or expired OTP.")
        attrs["otp"] = otp
        return attrs

    def create(self, validated_data):
        otp = validated_data["otp"]
        payload = otp.payload
        user, _ = User.objects.get_or_create(
            email=payload["email"],
            defaults={
                "first_name": payload["first_name"],
                "last_name": payload.get("last_name", ""),
                "phone": payload["phone"],
                "role": payload["role"],
                "account_type": "agency" if payload["role"] == "agency" else "personal",
                "present_country": payload.get("present_country", ""),
                "present_city": payload.get("present_city", ""),
            },
        )
        user.set_password(payload["password"])
        user.save()
        otp.consumed_at = timezone.now()
        otp.save(update_fields=["consumed_at"])
        if user.role == UserRole.CONSULTANT:
            VerificationRequest.objects.get_or_create(user=user)
        return user


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    purpose = serializers.CharField(default="registration", required=False)

    def validate(self, attrs):
        latest = (
            OTPVerification.objects.filter(
                email=attrs["email"],
                purpose=attrs.get("purpose", "registration"),
                consumed_at__isnull=True,
            )
            .order_by("-created_at")
            .first()
        )
        if latest and latest.created_at >= timezone.now() - timedelta(minutes=1):
            raise serializers.ValidationError("Please wait at least 1 minute before requesting a new OTP.")
        attrs["latest"] = latest
        return attrs

    def save(self, **kwargs):
        latest = self.validated_data.get("latest")
        payload = latest.payload if latest else {}
        code = OTPService.generate_code()
        otp = OTPVerification.objects.create(
            purpose=self.validated_data.get("purpose", "registration"),
            email=self.validated_data["email"],
            code=code,
            payload=payload,
            expires_at=timezone.now() + timedelta(minutes=1),
        )
        OTPService.send_email_otp(self.validated_data["email"], code)
        phone = payload.get("phone")
        if phone:
            OTPService.send_phone_otp(phone, code)
        return otp


class ForgotPasswordStartSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("No account was found with this email.")
        return value

    def save(self, **kwargs):
        OTPVerification.objects.filter(email=self.validated_data["email"], purpose="password_reset").delete()
        code = OTPService.generate_code()
        otp = OTPVerification.objects.create(
            purpose="password_reset",
            email=self.validated_data["email"],
            code=code,
            payload={},
            expires_at=timezone.now() + timedelta(minutes=1),
        )
        OTPService.send_email_otp(self.validated_data["email"], code)
        return otp


class ForgotPasswordVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        otp = OTPVerification.objects.filter(
            email=attrs["email"],
            code=attrs["code"],
            purpose="password_reset",
            consumed_at__isnull=True,
        ).order_by("-created_at").first()
        if not otp or otp.expires_at < timezone.now():
            raise serializers.ValidationError("Invalid or expired OTP.")
        attrs["otp"] = otp
        return attrs

    def save(self, **kwargs):
        otp = self.validated_data["otp"]
        reset_token = secrets.token_urlsafe(32)
        otp.payload = {**otp.payload, "reset_token": reset_token}
        otp.save(update_fields=["payload"])
        return {"reset_token": reset_token}


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(min_length=8, validators=[validate_password_complexity])

    def validate(self, attrs):
        otp = OTPVerification.objects.filter(
            purpose="password_reset",
            consumed_at__isnull=True,
        ).order_by("-created_at")
        match = next(
            (item for item in otp if item.payload.get("reset_token") == attrs["token"]),
            None,
        )
        if not match:
            raise serializers.ValidationError("Invalid reset token.")
        if match.expires_at < timezone.now():
            raise serializers.ValidationError("The reset token has expired.")
        attrs["otp"] = match
        return attrs

    def save(self, **kwargs):
        otp = self.validated_data["otp"]
        user = User.objects.get(email__iexact=otp.email)
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        otp.consumed_at = timezone.now()
        otp.save(update_fields=["consumed_at"])
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8, validators=[validate_password_complexity])

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.check_password(attrs["old_password"]):
            raise serializers.ValidationError({"old_password": "Current password is incorrect."})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
