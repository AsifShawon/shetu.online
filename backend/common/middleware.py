from django.contrib.auth import logout
from django.http import JsonResponse


class BanEnforcementMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        if user and user.is_authenticated and hasattr(user, "is_currently_banned") and user.is_currently_banned():
            logout(request)
            return JsonResponse(
                {"detail": "This account is suspended.", "ban_reason": user.ban_reason},
                status=403,
            )
        return self.get_response(request)
