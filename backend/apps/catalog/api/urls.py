from rest_framework.routers import DefaultRouter

from apps.catalog.api.views import (
    CityViewSet,
    CountryViewSet,
    CourseViewSet,
    EducationalInfoViewSet,
    ServiceCategoryViewSet,
    StudyLevelViewSet,
    UniversityViewSet,
)

router = DefaultRouter()
router.register("services", ServiceCategoryViewSet, basename="service-categories")
router.register("countries", CountryViewSet, basename="countries")
router.register("cities", CityViewSet, basename="cities")
router.register("universities", UniversityViewSet, basename="universities")
router.register("courses", CourseViewSet, basename="courses")
router.register("study-levels", StudyLevelViewSet, basename="study-levels")
router.register("educational-info", EducationalInfoViewSet, basename="educational-info")

urlpatterns = router.urls
