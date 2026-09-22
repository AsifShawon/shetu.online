from rest_framework.routers import DefaultRouter

from apps.content.api.views import (
    AboutSectionViewSet,
    ContactSubmissionViewSet,
    FAQViewSet,
    SiteSettingViewSet,
    SliderViewSet,
    TermsDocumentViewSet,
    TestimonialViewSet,
)

router = DefaultRouter()
router.register("settings", SiteSettingViewSet, basename="site-settings")
router.register("sliders", SliderViewSet, basename="sliders")
router.register("about", AboutSectionViewSet, basename="about")
router.register("testimonials", TestimonialViewSet, basename="testimonials")
router.register("faq", FAQViewSet, basename="faq")
router.register("terms", TermsDocumentViewSet, basename="terms")
router.register("contact-submissions", ContactSubmissionViewSet, basename="contact-submissions")

urlpatterns = router.urls
