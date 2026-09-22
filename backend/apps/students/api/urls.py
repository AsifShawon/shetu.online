from rest_framework.routers import DefaultRouter

from apps.students.api.views import (
    PostGraduateProfileViewSet,
    StudentChoiceViewSet,
    StudentExperienceViewSet,
    StudentProfileViewSet,
    StudentQualificationViewSet,
    StudentTrainingViewSet,
    StudyAbroadLeadViewSet,
)

router = DefaultRouter()
router.register("profile", StudentProfileViewSet, basename="student-profile")
router.register("postgraduate-profile", PostGraduateProfileViewSet, basename="postgraduate-profile")
router.register("choices", StudentChoiceViewSet, basename="student-choices")
router.register("qualifications", StudentQualificationViewSet, basename="student-qualifications")
router.register("experiences", StudentExperienceViewSet, basename="student-experiences")
router.register("trainings", StudentTrainingViewSet, basename="student-trainings")
router.register("study-abroad-leads", StudyAbroadLeadViewSet, basename="study-abroad-leads")

urlpatterns = router.urls
