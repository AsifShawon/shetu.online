from rest_framework.routers import DefaultRouter

from apps.marketplace.api.views import QuotationViewSet, StudentPostViewSet

router = DefaultRouter()
router.register("posts", StudentPostViewSet, basename="student-posts")
router.register("quotations", QuotationViewSet, basename="quotations")

urlpatterns = router.urls
