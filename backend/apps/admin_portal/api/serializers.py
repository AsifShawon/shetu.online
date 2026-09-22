import secrets
from datetime import timedelta

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import serializers

from apps.accounts.models import User, VerificationRequest
from apps.accounts.api.serializers import ensure_user_is_not_banned, validate_password_complexity
from apps.accounts.api.serializers import UserSerializer
from apps.admin_portal.models import AdminInvitation, ClassSchedule, ModerationIncident
from apps.assessments.api.serializers import (
    AssessmentProposalSerializer,
    AssessmentReportSerializer,
    ReviewRequestSerializer,
    ServiceChargeRuleSerializer,
)
from apps.assessments.models import AssessmentProposal, AssessmentReport, ReviewRequest, ServiceChargeRule
from apps.catalog.api.serializers import (
    CitySerializer,
    CountrySerializer,
    CourseSerializer,
    EducationalInfoSerializer,
    EducationalPageContentSerializer,
    ScholarshipItemSerializer,
    ServiceCategorySerializer,
    StudyLevelSerializer,
    TopUniversitySerializer,
    UniversitySerializer,
    VisaChecklistItemSerializer,
    WhyThisCountryPointSerializer,
)
from apps.catalog.models import (
    City,
    Country,
    CountryFAQ,
    Course,
    EducationalInfo,
    EducationalPageContent,
    ProgramDuration,
    ScholarshipItem,
    ServiceCategory,
    StudyLevel,
    TopUniversity,
    University,
    VisaChecklistItem,
    WhyThisCountryPoint,
)
from apps.consultants.api.serializers import (
    ConsultantServiceSerializer,
    ProPackageSerializer,
    ProSubscriptionSerializer,
    SubjectSerializer,
    TrainingSerializer,
)
from apps.consultants.models import ConsultantService, ProPackage, ProSubscription, Subject, Training
from apps.content.api.serializers import (
    AboutSectionSerializer,
    CompanyDetailSerializer,
    ContactSubmissionSerializer,
    FAQSerializer,
    SiteSettingSerializer,
    SliderSerializer,
    TermsDocumentSerializer,
    TestimonialSerializer,
)
from apps.content.models import AboutSection, CompanyDetail, ContactSubmission, FAQ, SiteSetting, Slider, TermsDocument, Testimonial
from apps.payments.api.serializers import (
    AssessmentSettlementSerializer,
    CourseOrderSerializer,
    OrderSerializer,
    RefundRequestSerializer,
    WalletTransactionSerializer,
    WithdrawalRequestSerializer,
)
from apps.payments.models import (
    AssessmentSettlement,
    CourseOrder,
    Order,
    RefundRequest,
    WalletTransaction,
    WithdrawalRequest,
)
from apps.students.api.serializers import StudyAbroadLeadSerializer
from apps.students.models import StudyAbroadLead


class AdminLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid admin credentials.")
        if getattr(user, "role", None) != "admin":
            raise serializers.ValidationError("This account does not have admin access.")
        ensure_user_is_not_banned(user)
        attrs["user"] = user
        return attrs


class AdminUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    repassword = serializers.CharField(write_only=True, required=False, allow_blank=False)
    full_name = serializers.SerializerMethodField(read_only=True)
    image_url = serializers.SerializerMethodField(read_only=True)
    last_login_display = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "image",
            "image_url",
            "name",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "role",
            "account_type",
            "verification_status",
            "subscription_status",
            "profile_completion",
            "balance",
            "assessment_price",
            "assessment_duration",
            "occupation",
            "skill_languages",
            "is_banned",
            "banned_until",
            "ban_reason",
            "is_active",
            "is_staff",
            "date_joined",
            "last_login",
            "last_login_display",
            "password",
            "repassword",
        ]
        extra_kwargs = {
            "image": {"required": False, "allow_null": True},
        }

    def validate(self, attrs):
        name = attrs.pop("name", "").strip()
        if name:
            parts = name.split(maxsplit=1)
            attrs["first_name"] = parts[0]
            attrs["last_name"] = parts[1] if len(parts) > 1 else ""

        password = attrs.get("password")
        repassword = attrs.pop("repassword", None)
        if not self.instance and not password:
            raise serializers.ValidationError({"password": "Password is required."})
        if self.instance:
            if password or repassword:
                if not password or password != repassword:
                    raise serializers.ValidationError({"repassword": "Passwords do not match."})
        elif password != repassword:
            raise serializers.ValidationError({"repassword": "Passwords do not match."})
        if password:
            validate_password_complexity(password)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

    def get_last_login_display(self, obj):
        if not obj.last_login:
            return "Never logged in"
        return obj.last_login.strftime("%b %d, %Y %I:%M %p")


class VerificationRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True, required=False
    )

    class Meta:
        model = VerificationRequest
        fields = ["id", "user", "user_id", "status", "notes", "created_at", "updated_at"]


class ProgramDurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgramDuration
        fields = "__all__"


class CountryFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = CountryFAQ
        fields = "__all__"


class ClassScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassSchedule
        fields = "__all__"


class AdminInvitationSerializer(serializers.ModelSerializer):
    invited_by_email = serializers.CharField(source="invited_by.email", read_only=True)

    class Meta:
        model = AdminInvitation
        fields = [
            "id",
            "email",
            "token",
            "invited_by",
            "invited_by_email",
            "expires_at",
            "accepted_at",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("token", "accepted_at")

    def create(self, validated_data):
        return AdminInvitation.objects.create(
            token=secrets.token_hex(16),
            expires_at=timezone.now() + timedelta(days=7),
            **validated_data,
        )


class ModerationIncidentSerializer(serializers.ModelSerializer):
    reported_user_email = serializers.CharField(source="reported_user.email", read_only=True)
    reviewed_by_email = serializers.CharField(source="reviewed_by.email", read_only=True)

    class Meta:
        model = ModerationIncident
        fields = [
            "id",
            "reported_user",
            "reported_user_email",
            "source_type",
            "source_id",
            "matched_terms",
            "content_excerpt",
            "auto_flagged",
            "status",
            "notes",
            "reviewed_by",
            "reviewed_by_email",
            "created_at",
            "updated_at",
        ]


ADMIN_RESOURCE_SERIALIZERS = {
    "site-settings": SiteSettingSerializer,
    "company-details": CompanyDetailSerializer,
    "sliders": SliderSerializer,
    "about-sections": AboutSectionSerializer,
    "testimonials": TestimonialSerializer,
    "faqs": FAQSerializer,
    "terms-documents": TermsDocumentSerializer,
    "contact-submissions": ContactSubmissionSerializer,
    "study-abroad-leads": StudyAbroadLeadSerializer,
    "service-categories": ServiceCategorySerializer,
    "countries": CountrySerializer,
    "cities": CitySerializer,
    "universities": UniversitySerializer,
    "courses": CourseSerializer,
    "study-levels": StudyLevelSerializer,
    "educational-info": EducationalInfoSerializer,
    "educational-page-contents": EducationalPageContentSerializer,
    "why-country-points": WhyThisCountryPointSerializer,
    "program-durations": ProgramDurationSerializer,
    "top-universities": TopUniversitySerializer,
    "visa-checklist-items": VisaChecklistItemSerializer,
    "country-faqs": CountryFAQSerializer,
    "scholarship-items": ScholarshipItemSerializer,
    "subjects": SubjectSerializer,
    "trainings": TrainingSerializer,
    "consultant-services": ConsultantServiceSerializer,
    "pro-packages": ProPackageSerializer,
    "pro-subscriptions": ProSubscriptionSerializer,
    "service-charge-rules": ServiceChargeRuleSerializer,
    "assessment-reports": AssessmentReportSerializer,
    "assessment-proposals": AssessmentProposalSerializer,
    "review-requests": ReviewRequestSerializer,
    "refund-requests": RefundRequestSerializer,
    "settlements": AssessmentSettlementSerializer,
    "moderation-incidents": ModerationIncidentSerializer,
    "admin-invitations": AdminInvitationSerializer,
    "class-schedules": ClassScheduleSerializer,
    "wallet-transactions": WalletTransactionSerializer,
    "withdrawals": WithdrawalRequestSerializer,
    "orders": OrderSerializer,
    "course-orders": CourseOrderSerializer,
}


ADMIN_RESOURCE_MODELS = {
    "site-settings": SiteSetting,
    "company-details": CompanyDetail,
    "sliders": Slider,
    "about-sections": AboutSection,
    "testimonials": Testimonial,
    "faqs": FAQ,
    "terms-documents": TermsDocument,
    "contact-submissions": ContactSubmission,
    "study-abroad-leads": StudyAbroadLead,
    "service-categories": ServiceCategory,
    "countries": Country,
    "cities": City,
    "universities": University,
    "courses": Course,
    "study-levels": StudyLevel,
    "educational-info": EducationalInfo,
    "educational-page-contents": EducationalPageContent,
    "why-country-points": WhyThisCountryPoint,
    "program-durations": ProgramDuration,
    "top-universities": TopUniversity,
    "visa-checklist-items": VisaChecklistItem,
    "country-faqs": CountryFAQ,
    "scholarship-items": ScholarshipItem,
    "subjects": Subject,
    "trainings": Training,
    "consultant-services": ConsultantService,
    "pro-packages": ProPackage,
    "pro-subscriptions": ProSubscription,
    "service-charge-rules": ServiceChargeRule,
    "assessment-reports": AssessmentReport,
    "assessment-proposals": AssessmentProposal,
    "review-requests": ReviewRequest,
    "refund-requests": RefundRequest,
    "settlements": AssessmentSettlement,
    "moderation-incidents": ModerationIncident,
    "admin-invitations": AdminInvitation,
    "class-schedules": ClassSchedule,
    "wallet-transactions": WalletTransaction,
    "withdrawals": WithdrawalRequest,
    "orders": Order,
    "course-orders": CourseOrder,
}
