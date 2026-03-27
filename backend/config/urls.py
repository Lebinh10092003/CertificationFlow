from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .auth_views import login_view, logout_view, session_view


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/session/", session_view, name="auth-session"),
    path("api/auth/login/", login_view, name="auth-login"),
    path("api/auth/logout/", logout_view, name="auth-logout"),
    path("api/health/", HealthCheckView.as_view(), name="health-check"),
    path("api/", include("apps.competitions.urls")),
    path("api/", include("apps.participants.urls")),
    path("api/", include("apps.data_imports.urls")),
    path("api/", include("apps.certificates.urls")),
    path("api/", include("apps.auditlog.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
