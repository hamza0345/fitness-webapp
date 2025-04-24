from django.urls import path
from .views import (
    RegisterView,
    RoutineListCreateView,
    RoutineDetailView,
)

urlpatterns = [
    # auth
    path("auth/register/", RegisterView.as_view(), name="register"),

    # routines
    path("routines/", RoutineListCreateView.as_view(), name="routine-list-create"),
    path("routines/<int:pk>/", RoutineDetailView.as_view(), name="routine-detail"),
]
