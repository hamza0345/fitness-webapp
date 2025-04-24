from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    # auth endpoints (JWT)
    path("api/auth/login/",  TokenObtainPairView.as_view(), name="jwt-login"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="jwt-refresh"),

    # our app’s routes
    path("api/", include("api.urls")),
]
