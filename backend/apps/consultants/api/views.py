from django.db.models import Avg, Case, Count, DecimalField, Q, Sum, Value, When
from django.db.models.functions import Coalesce
from rest_framework import permissions, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.assessments.models import Assessment, Review
from apps.consultants.api.serializers import (
    ConsultantServiceSerializer,
    ExperienceSerializer,
    PersonalTrainingSerializer,
    ProPackageSerializer,
    ProSubscriptionSerializer,
    QualificationSerializer,
    SubjectSerializer,
    TrainingSerializer,
)
from apps.consultants.models import (
    ConsultantService,
    Experience,
    PersonalTraining,
    ProPackage,
    ProSubscription,
    Qualification,
    Subject,
    Training,
)
from apps.marketplace.models import StudentPost
from apps.payments.models import CourseEnrollment, CourseOrder, WalletTransaction
from common.permissions.roles import IsConsultant


class QualificationViewSet(viewsets.ModelViewSet):
    serializer_class = QualificationSerializer
    permission_classes = [IsConsultant]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Qualification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        qualification = serializer.save(user=self.request.user)
        qualification.user.recalculate_profile_completion()

    def perform_update(self, serializer):
        qualification = serializer.save()
        qualification.user.recalculate_profile_completion()

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.recalculate_profile_completion()


class ExperienceViewSet(viewsets.ModelViewSet):
    serializer_class = ExperienceSerializer
    permission_classes = [IsConsultant]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return Experience.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        experience = serializer.save(user=self.request.user)
        experience.user.recalculate_profile_completion()

    def perform_update(self, serializer):
        experience = serializer.save()
        experience.user.recalculate_profile_completion()

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        user.recalculate_profile_completion()


class TrainingViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Training.objects.all()
    serializer_class = TrainingSerializer
    permission_classes = [permissions.AllowAny]


class PersonalTrainingViewSet(viewsets.ModelViewSet):
    serializer_class = PersonalTrainingSerializer
    permission_classes = [IsConsultant]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return PersonalTraining.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SubjectViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [permissions.AllowAny]


class ConsultantServiceViewSet(viewsets.ModelViewSet):
    serializer_class = ConsultantServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            return [IsConsultant()]
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = (
            ConsultantService.objects.select_related("consultant", "country")
            .prefetch_related("service_categories", "study_levels", "subjects")
            .annotate(
                consultant_rating_value=Avg("reviews__review_rating"),
                consultant_review_count_value=Count("reviews", distinct=True),
            )
        )

        scope = self.request.query_params.get("scope")
        consultant_id = self.request.query_params.get("consultant_id")
        country_id = self.request.query_params.get("country_id")
        city_id = self.request.query_params.get("city_id")
        university_id = self.request.query_params.get("university_id")
        country = self.request.query_params.get("country")
        keyword = self.request.query_params.get("keyword")

        if scope == "mine" and self.request.user.is_authenticated and self.request.user.role == "consultant":
            queryset = queryset.filter(consultant=self.request.user)
        elif scope == "public":
            queryset = queryset.filter(status="active")
        elif self.request.user.is_authenticated and self.request.user.role == "consultant":
            queryset = queryset.filter(consultant=self.request.user)
        else:
            queryset = queryset.filter(status="active")

        if consultant_id:
            queryset = queryset.filter(consultant_id=consultant_id)

        if country_id:
            queryset = queryset.filter(country_id=country_id)

        if city_id:
            queryset = queryset.filter(consultant__preferred_cities__id=city_id)

        if university_id:
            queryset = queryset.filter(consultant__preferred_universities__id=university_id)

        if country:
            queryset = queryset.filter(
                Q(country__name__icontains=country) | Q(country__slug__icontains=country)
            )

        if keyword:
            queryset = queryset.filter(
                Q(consultant__first_name__icontains=keyword)
                | Q(consultant__last_name__icontains=keyword)
                | Q(consultant__email__icontains=keyword)
                | Q(title__icontains=keyword)
                | Q(description__icontains=keyword)
                | Q(country__name__icontains=keyword)
                | Q(service_categories__name__icontains=keyword)
                | Q(study_levels__name__icontains=keyword)
                | Q(subjects__name__icontains=keyword)
            )

        return queryset.distinct()

    def perform_create(self, serializer):
        service = serializer.save(consultant=self.request.user)
        service.consultant.recalculate_profile_completion()

    def perform_update(self, serializer):
        service = serializer.save()
        service.consultant.recalculate_profile_completion()

    def perform_destroy(self, instance):
        consultant = instance.consultant
        instance.delete()
        consultant.recalculate_profile_completion()


class ProPackageViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProPackage.objects.all()
    serializer_class = ProPackageSerializer
    permission_classes = [permissions.AllowAny]


class ProSubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProSubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ProSubscription.objects.filter(user=self.request.user)


class ConsultantDashboardSummaryView(APIView):
    permission_classes = [IsConsultant]

    def get(self, request):
        user = request.user
        assessments = (
            Assessment.objects.filter(consultant=user)
            .select_related("student", "consultant_service", "assessment_country")
            .order_by("-created_at")
        )
        reviews = Review.objects.filter(consultant=user)
        wallet = WalletTransaction.objects.filter(user=user)
        recent_posts = StudentPost.objects.select_related(
            "country", "service_category", "study_level", "student"
        ).filter(status="active").order_by("-created_at")[:6]
        sent_quotes = set(user.quotations_sent.values_list("post_id", flat=True))

        wallet_totals = wallet.aggregate(
            cash_in=Coalesce(
                Sum(
                    Case(
                        When(transaction_type="cash_in", then="amount"),
                        default=Value(0),
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    )
                ),
                Value(0),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
            cash_out=Coalesce(
                Sum(
                    Case(
                        When(transaction_type="cash_out", then="amount"),
                        default=Value(0),
                        output_field=DecimalField(max_digits=12, decimal_places=2),
                    )
                ),
                Value(0),
                output_field=DecimalField(max_digits=12, decimal_places=2),
            ),
        )

        total_earnings = wallet_totals["cash_in"] or 0
        total_spent = wallet_totals["cash_out"] or 0
        available_balance = total_earnings - total_spent

        data = {
            "stats": {
                "active_services": user.consultant_services.filter(status="active").count(),
                "total_services": user.consultant_services.count(),
                "total_requests": assessments.count(),
                "pending_requests": assessments.filter(status="pending").count(),
                "accepted_requests": assessments.filter(status="accepted").count(),
                "submitted_reports": assessments.filter(status="submitted").count(),
                "completed_requests": assessments.filter(status="completed").count(),
                "total_reviews": reviews.count(),
                "average_rating": round(float(reviews.aggregate(avg=Avg("review_rating"))["avg"] or 0), 1),
                "total_earnings": f"{total_earnings:.2f}",
                "available_balance": f"{available_balance:.2f}",
                "profile_completion": user.recalculate_profile_completion(save=False),
                "qualifications": user.qualifications.count(),
                "experiences": user.experiences.count(),
                "personal_trainings": user.personal_trainings.count(),
                "training_enrollments": CourseEnrollment.objects.filter(user=user).count(),
                "course_orders": CourseOrder.objects.filter(user=user).count(),
                "active_subscription": user.pro_subscriptions.filter(active=True).exists(),
            },
            "recent_requests": [
                {
                    "id": assessment.id,
                    "assessment_title": assessment.assessment_title,
                    "student_name": f"{assessment.student.first_name} {assessment.student.last_name}".strip()
                    or assessment.student.email,
                    "country_name": assessment.assessment_country.name
                    if assessment.assessment_country
                    else "",
                    "service_title": assessment.consultant_service.title,
                    "status": assessment.status,
                    "charge": str(assessment.assessment_charge or ""),
                    "duration": assessment.assessment_duration,
                    "created_at": assessment.created_at,
                }
                for assessment in assessments[:5]
            ],
            "recent_posts": [
                {
                    "id": post.id,
                    "title": post.title,
                    "description": post.description,
                    "student_name": f"{post.student.first_name} {post.student.last_name}".strip()
                    or post.student.email,
                    "country_name": post.country.name if post.country else post.custom_country_name,
                    "service_name": post.service_category.name
                    if post.service_category
                    else post.custom_service_name,
                    "study_level_name": post.study_level.name
                    if post.study_level
                    else post.custom_study_level_name,
                    "subject": post.subject,
                    "budget": str(post.budget or ""),
                    "quotation_count": post.quotations.count(),
                    "has_sent_quotation": post.id in sent_quotes,
                    "created_at": post.created_at,
                }
                for post in recent_posts
            ],
        }
        return Response(data)
