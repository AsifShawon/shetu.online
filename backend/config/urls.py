from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health", health),
    path("ready", health),
    path("django-admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.api.urls")),
    path("api/accounts/", include("apps.accounts.api.urls")),
    path("api/content/", include("apps.content.api.urls")),
    path("api/catalog/", include("apps.catalog.api.urls")),
    path("api/students/", include("apps.students.api.urls")),
    path("api/consultants/", include("apps.consultants.api.urls")),
    path("api/assessments/", include("apps.assessments.api.urls")),
    path("api/payments/", include("apps.payments.api.urls")),
    path("api/agencies/", include("apps.agencies.api.urls")),
    path("api/marketplace/", include("apps.marketplace.api.urls")),
    path("api/admin/", include("apps.admin_portal.api.urls")),
]
