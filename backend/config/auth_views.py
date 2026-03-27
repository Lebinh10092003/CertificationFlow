import json

from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST


def _serialize_user(user):
    return {
        "id": user.id,
        "username": user.get_username(),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
    }


@ensure_csrf_cookie
@require_GET
def session_view(request):
    if request.user.is_authenticated:
        return JsonResponse({"authenticated": True, "user": _serialize_user(request.user)})
    return JsonResponse({"authenticated": False, "user": None})


@require_POST
def login_view(request):
    try:
        payload = json.loads(request.body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        payload = request.POST

    username = str(payload.get("username", "")).strip()
    password = payload.get("password", "")
    if not username or not password:
        return JsonResponse({"detail": "Username and password are required"}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None or not user.is_active:
        return JsonResponse({"detail": "Invalid username or password"}, status=400)

    login(request, user)
    return JsonResponse({"authenticated": True, "user": _serialize_user(user)})


@require_POST
def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
    return JsonResponse({"authenticated": False, "user": None})
