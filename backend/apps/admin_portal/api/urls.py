from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.admin_portal.api.views import (
    AdminInvitationViewSet,
    AboutSectionAdminViewSet,
    AdminRegisterStartView,
    AdminRegisterVerifyView,
    ClassScheduleAdminViewSet,
    CompanyDetailAdminViewSet,
    AdminDashboardView,
    AdminLoginView,
    AdminUserViewSet,
    AssessmentProposalAdminViewSet,
    AssessmentReportAdminViewSet,
    ContactSubmissionAdminViewSet,
    CountryAdminViewSet,
    CityAdminViewSet,
    CountryFAQAdminViewSet,
    CourseAdminViewSet,
    CourseOrderAdminViewSet,
    EducationalInfoAdminViewSet,
    EducationalPageContentAdminViewSet,
    FAQAdminViewSet,
    OrderAdminViewSet,
    ProgramDurationAdminViewSet,
    ProPackageAdminViewSet,
    ProSubscriptionAdminViewSet,
    RefundRequestAdminViewSet,
    ReviewRequestAdminViewSet,
    ScholarshipItemAdminViewSet,
    StudyAbroadLeadAdminViewSet,
    SettlementAdminViewSet,
    ServiceCategoryAdminViewSet,
    ServiceChargeRuleAdminViewSet,
    SiteSettingAdminViewSet,
    SliderAdminViewSet,
    StudyLevelAdminViewSet,
    SubjectAdminViewSet,
    TermsDocumentAdminViewSet,
    TestimonialAdminViewSet,
    TopUniversityAdminViewSet,
    TrainingAdminViewSet,
    UniversityAdminViewSet,
    VerificationRequestViewSet,
    VisaChecklistItemAdminViewSet,
    WalletTransactionAdminViewSet,
    WhyThisCountryPointAdminViewSet,
    WithdrawalAdminViewSet,
    ConsultantServiceAdminViewSet,
    ModerationIncidentViewSet,
)

router = DefaultRouter()
router.register("users", AdminUserViewSet, basename="admin-users")
router.register("verification-requests", VerificationRequestViewSet, basename="admin-verification-requests")
router.register("invitations", AdminInvitationViewSet, basename="admin-invitations")
router.register("site-settings", SiteSettingAdminViewSet, basename="admin-site-settings")
router.register("company-details", CompanyDetailAdminViewSet, basename="admin-company-details")
router.register("sliders", SliderAdminViewSet, basename="admin-sliders")
router.register("about-sections", AboutSectionAdminViewSet, basename="admin-about-sections")
router.register("testimonials", TestimonialAdminViewSet, basename="admin-testimonials")
router.register("faqs", FAQAdminViewSet, basename="admin-faqs")
router.register("terms-documents", TermsDocumentAdminViewSet, basename="admin-terms-documents")
router.register("contact-submissions", ContactSubmissionAdminViewSet, basename="admin-contact-submissions")
router.register("study-abroad-leads", StudyAbroadLeadAdminViewSet, basename="admin-study-abroad-leads")
router.register("service-categories", ServiceCategoryAdminViewSet, basename="admin-service-categories")
router.register("countries", CountryAdminViewSet, basename="admin-countries")
router.register("cities", CityAdminViewSet, basename="admin-cities")
router.register("universities", UniversityAdminViewSet, basename="admin-universities")
router.register("courses", CourseAdminViewSet, basename="admin-courses")
router.register("study-levels", StudyLevelAdminViewSet, basename="admin-study-levels")
router.register("educational-info", EducationalInfoAdminViewSet, basename="admin-educational-info")
router.register("educational-page-contents", EducationalPageContentAdminViewSet, basename="admin-educational-page-contents")
router.register("why-country-points", WhyThisCountryPointAdminViewSet, basename="admin-why-country-points")
router.register("program-durations", ProgramDurationAdminViewSet, basename="admin-program-durations")
router.register("top-universities", TopUniversityAdminViewSet, basename="admin-top-universities")
router.register("visa-checklist-items", VisaChecklistItemAdminViewSet, basename="admin-visa-checklist-items")
router.register("country-faqs", CountryFAQAdminViewSet, basename="admin-country-faqs")
router.register("scholarship-items", ScholarshipItemAdminViewSet, basename="admin-scholarship-items")
router.register("subjects", SubjectAdminViewSet, basename="admin-subjects")
router.register("trainings", TrainingAdminViewSet, basename="admin-trainings")
router.register("consultant-services", ConsultantServiceAdminViewSet, basename="admin-consultant-services")
router.register("pro-packages", ProPackageAdminViewSet, basename="admin-pro-packages")
router.register("pro-subscriptions", ProSubscriptionAdminViewSet, basename="admin-pro-subscriptions")
router.register("service-charge-rules", ServiceChargeRuleAdminViewSet, basename="admin-service-charge-rules")
router.register("assessment-reports", AssessmentReportAdminViewSet, basename="admin-assessment-reports")
router.register("assessment-proposals", AssessmentProposalAdminViewSet, basename="admin-assessment-proposals")
router.register("review-requests", ReviewRequestAdminViewSet, basename="admin-review-requests")
router.register("refund-requests", RefundRequestAdminViewSet, basename="admin-refund-requests")
router.register("settlements", SettlementAdminViewSet, basename="admin-settlements")
router.register("moderation-incidents", ModerationIncidentViewSet, basename="admin-moderation-incidents")
router.register("class-schedules", ClassScheduleAdminViewSet, basename="admin-class-schedules")
router.register("wallet-transactions", WalletTransactionAdminViewSet, basename="admin-wallet-transactions")
router.register("withdrawals", WithdrawalAdminViewSet, basename="admin-withdrawals")
router.register("orders", OrderAdminViewSet, basename="admin-orders")
router.register("course-orders", CourseOrderAdminViewSet, basename="admin-course-orders")

urlpatterns = [
    path("login/", AdminLoginView.as_view(), name="admin-login"),
    path("register/start/", AdminRegisterStartView.as_view(), name="admin-register-start"),
    path("register/verify/", AdminRegisterVerifyView.as_view(), name="admin-register-verify"),
    path("dashboard/", AdminDashboardView.as_view(), name="admin-dashboard"),
    *router.urls,
]
