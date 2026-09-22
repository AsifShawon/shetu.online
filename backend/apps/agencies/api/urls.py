from rest_framework.routers import DefaultRouter

from apps.agencies.api.views import (
    AgencyConsultantViewSet,
    AgencyCountryOfferingViewSet,
    AgencyGalleryImageViewSet,
    AgencyProfileViewSet,
    AgencyServiceViewSet,
)

router = DefaultRouter()
router.register("profile", AgencyProfileViewSet, basename="agency-profile")
router.register("consultants", AgencyConsultantViewSet, basename="agency-consultants")
router.register("services", AgencyServiceViewSet, basename="agency-services")
router.register("countries", AgencyCountryOfferingViewSet, basename="agency-countries")
router.register("gallery", AgencyGalleryImageViewSet, basename="agency-gallery")

urlpatterns = router.urls
