from django.urls import path
from .views import (
    RegisterView,
    RoutineListCreateView,
    RoutineDetailView,
    WorkoutSessionListCreateView,
    WorkoutSessionDetailView,
    NutritionEntryListCreateView,
    NutritionEntryDetailView,
)

urlpatterns = [
    # auth
    path("auth/register/", RegisterView.as_view(), name="register"),

    # routines
    path("routines/", RoutineListCreateView.as_view(), name="routine-list-create"),
    path("routines/<int:pk>/", RoutineDetailView.as_view(), name="routine-detail"),
    
    # workouts
    path("workouts/", WorkoutSessionListCreateView.as_view(), name="workout-list-create"),
    path("workouts/<int:pk>/", WorkoutSessionDetailView.as_view(), name="workout-detail"),
    
    # nutrition
    path("nutrition/", NutritionEntryListCreateView.as_view(), name="nutrition-list-create"),
    path("nutrition/<int:pk>/", NutritionEntryDetailView.as_view(), name="nutrition-detail"),
]
