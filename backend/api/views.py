from rest_framework import generics, permissions
from django.contrib.auth.models import User
from .models import Routine, WorkoutSession, NutritionEntry
from .serializers import (
    RoutineSerializer,
    RegisterSerializer,
    WorkoutSessionSerializer,
    NutritionEntrySerializer,
)

# ----------  REGISTER ----------
class RegisterView(generics.CreateAPIView):
    """
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


# ----------  ROUTINES ----------
class RoutineListCreateView(generics.ListCreateAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Routine.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RoutineDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Routine.objects.filter(user=self.request.user)


# ----------  WORKOUT SESSIONS ----------
class WorkoutSessionListCreateView(generics.ListCreateAPIView):
    """
    GET /api/workouts/ - List all workout sessions
    POST /api/workouts/ - Create a new workout session
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WorkoutSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/workouts/<id>/ - Get a specific workout session
    PUT /api/workouts/<id>/ - Update a workout session
    DELETE /api/workouts/<id>/ - Delete a workout session
    """
    serializer_class = WorkoutSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WorkoutSession.objects.filter(user=self.request.user)


# ----------  NUTRITION ENTRIES ----------
class NutritionEntryListCreateView(generics.ListCreateAPIView):
    """
    GET /api/nutrition/ - List all nutrition entries
    POST /api/nutrition/ - Create a new nutrition entry
    """
    serializer_class = NutritionEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NutritionEntry.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class NutritionEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET /api/nutrition/<id>/ - Get a specific nutrition entry
    PUT /api/nutrition/<id>/ - Update a nutrition entry
    DELETE /api/nutrition/<id>/ - Delete a nutrition entry
    """
    serializer_class = NutritionEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NutritionEntry.objects.filter(user=self.request.user)
