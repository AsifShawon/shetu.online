from rest_framework.routers import DefaultRouter

from apps.assessments.api.views import (
    AssessmentReportViewSet,
    AssessmentViewSet,
    RecommendedUniversityViewSet,
    ReviewViewSet,
    ServiceChargeRuleViewSet,
)

router = DefaultRouter()
router.register("reports", AssessmentReportViewSet, basename="assessment-reports")
router.register("recommended-universities", RecommendedUniversityViewSet, basename="recommended-universities")
router.register("reviews", ReviewViewSet, basename="reviews")
router.register("service-charge-rules", ServiceChargeRuleViewSet, basename="service-charge-rules")
router.register("", AssessmentViewSet, basename="assessments")

urlpatterns = router.urls
