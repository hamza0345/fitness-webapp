# backend/api/urls.py
from django.urls import path
from .views import (
    RegisterView,
    RoutineListCreateView,
    RoutineDetailView,
    WorkoutSessionListCreateView,
    WorkoutSessionDetailView,
    NutritionEntryListCreateView,
    NutritionEntryDetailView,
    # Add new views
    PredefinedExerciseListView,
    AnalyzeRoutineView,
    DiagnosticView,
)
import re # Import re here if not already imported in views

urlpatterns = [
    # auth
    path("auth/register/", RegisterView.as_view(), name="register"),

    # routines
    path("routines/", RoutineListCreateView.as_view(), name="routine-list-create"),
    path("routines/<int:pk>/", RoutineDetailView.as_view(), name="routine-detail"),
    path("routines/<int:routine_id>/analyze/", AnalyzeRoutineView.as_view(), name="routine-analyze"), # New

    # predefined exercises
    path("exercises/predefined/", PredefinedExerciseListView.as_view(), name="predefined-exercise-list"), # New

    # diagnostic
    path("diagnostic/", DiagnosticView.as_view(), name="diagnostic"),

    # workouts
    path("workouts/", WorkoutSessionListCreateView.as_view(), name="workout-list-create"),
    path("workouts/<int:pk>/", WorkoutSessionDetailView.as_view(), name="workout-detail"),

    # nutrition
    path("nutrition/", NutritionEntryListCreateView.as_view(), name="nutrition-list-create"),
    path("nutrition/<int:pk>/", NutritionEntryDetailView.as_view(), name="nutrition-detail"),
]