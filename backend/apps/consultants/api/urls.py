from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.consultants.api.views import (
    ConsultantDashboardSummaryView,
    ConsultantServiceViewSet,
    ExperienceViewSet,
    PersonalTrainingViewSet,
    ProPackageViewSet,
    ProSubscriptionViewSet,
    QualificationViewSet,
    SubjectViewSet,
    TrainingViewSet,
)

router = DefaultRouter()
router.register("qualifications", QualificationViewSet, basename="qualifications")
router.register("experiences", ExperienceViewSet, basename="experiences")
router.register("personal-trainings", PersonalTrainingViewSet, basename="personal-trainings")
router.register("trainings", TrainingViewSet, basename="trainings")
router.register("subjects", SubjectViewSet, basename="subjects")
router.register("services", ConsultantServiceViewSet, basename="consultant-services")
router.register("pro-packages", ProPackageViewSet, basename="pro-packages")
router.register("pro-subscriptions", ProSubscriptionViewSet, basename="pro-subscriptions")

urlpatterns = [
    path("dashboard-summary/", ConsultantDashboardSummaryView.as_view(), name="consultant-dashboard-summary"),
    *router.urls,
]
