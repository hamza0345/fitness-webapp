# backend/api/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import (
    Routine, WorkoutSession, NutritionEntry,
    PredefinedExercise, ImprovementRule, Exercise # Added Exercise model for routine exercises
)
from .serializers import (
    RoutineSerializer,
    RegisterSerializer,
    WorkoutSessionSerializer,
    NutritionEntrySerializer,
    PredefinedExerciseSerializer,
    ImprovementSuggestionSerializer,
)
from django.shortcuts import get_object_or_404
import re # Make sure re is imported
import logging # Import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)
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

class PredefinedExerciseListView(generics.ListAPIView):
    """
    GET /api/exercises/predefined/
    Returns a list of all predefined exercises for use in dropdowns.
    """
    queryset = PredefinedExercise.objects.all()
    serializer_class = PredefinedExerciseSerializer
    permission_classes = [permissions.IsAuthenticated] # Or AllowAny if needed before login


# ---------- IMPROVEMENT FEATURE VIEWS ----------

class PredefinedExerciseListView(generics.ListAPIView):
    """
    GET /api/exercises/predefined/
    Returns a list of all predefined exercises for use in dropdowns.
    """
    # Allow anyone to get this list, even if not logged in, adjust if needed
    # permission_classes = [permissions.AllowAny]
    queryset = PredefinedExercise.objects.all()
    serializer_class = PredefinedExerciseSerializer
    # Keep IsAuthenticated if you only want logged-in users to see exercises
    permission_classes = [permissions.IsAuthenticated]


class AnalyzeRoutineView(APIView):
    """
    POST /api/routines/<routine_id>/analyze/
    Analyzes a specific routine based on user preferences and returns improvement suggestions.
    Expects JSON body: {"preferences": {"focus": "hypertrophy"}}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, routine_id):
        logger.info(f"--- Starting analysis for routine_id: {routine_id} by user: {request.user} ---")
        logger.debug(f"Request data received: {request.data}")

        try:
            #  Fetch the routine
            routine = get_object_or_404(Routine, pk=routine_id, user=request.user)
            logger.info(f"Successfully fetched routine '{routine.name}' (ID: {routine.id})")

            preferences = request.data.get('preferences', {})
            user_focus = preferences.get('focus', 'hypertrophy').lower() # Default preference if not provided
            logger.info(f"Using preference focus: '{user_focus}'")
            
            # Map frontend focus names to database values if needed
            # This fixes issues with focus option changes
            focus_mapping = {
                'hypertrophy': ['hypertrophy', 'all'],
                'powerlifting': ['powerlifting', 'all'],
                # Handle potential legacy values from frontend
                'muscle growth (hypertrophy)': ['hypertrophy', 'all'],
                'strength & power': ['powerlifting', 'all']
            }
            
            # Get valid focus values to match in database - default to all valid options if focus not found
            valid_focus_values = focus_mapping.get(user_focus, ['hypertrophy', 'powerlifting', 'all'])
            logger.info(f"Valid focus values to match in DB: {valid_focus_values}")

            # Get exercises from the user's routine
            
            routine_exercises = routine.exercises.all()
            routine_exercise_names = list(routine_exercises.values_list('name', flat=True))
            logger.info(f"Routine contains exercises: {routine_exercise_names}")

            if not routine_exercise_names:
                 logger.warning(f"Routine {routine_id} has no exercises. Returning empty suggestion list.")
                 return Response([], status=status.HTTP_200_OK) # Return empty list

            # DEBUG: List all predefined exercises for comparison
            all_predefined = list(PredefinedExercise.objects.values_list('name', flat=True))
            logger.info(f"Available predefined exercises: {all_predefined}")

           
            matched_predefined_ids = set()
            for exercise_name in routine_exercise_names:
                matches = PredefinedExercise.find_matches(exercise_name)
                for match in matches:
                    matched_predefined_ids.add(match.id)
                    logger.info(f"Match found: '{exercise_name}' -> '{match.name}' (ID: {match.id})")
                    
            # Convert to list for the filter
            matched_predefined_ids = list(matched_predefined_ids)
            logger.info(f"All matched PredefinedExercise IDs: {matched_predefined_ids}")

            if not matched_predefined_ids:
                logger.info("No exercises in the routine matched predefined exercises. No specific rules triggered.")
                # Decide if you want to return empty or potentially general advice here
                return Response([], status=status.HTTP_200_OK)

            # 4. Find applicable ImprovementRules
            suggestions = []
            applied_rules = set() # Avoid duplicate suggestions for the same rule
            
            # List all rules for debugging
            all_rules = ImprovementRule.objects.values('id', 'trigger_exercise__name', 'action_type', 'preference_focus')
            logger.info(f"All available improvement rules: {list(all_rules)}")

            triggered_rules = ImprovementRule.objects.filter(
                trigger_exercise_id__in=matched_predefined_ids,     # Rule triggered by an exercise in the routine
                preference_focus__in=valid_focus_values     # Rule matches user focus or is 'all'
            ).select_related('trigger_exercise', 'suggested_exercise') # Optimize query
            
            # TEMPORARY FIX: If we didn't find any rules matching the focus, try with ANY focus
            if not triggered_rules.exists():
                logger.warning(f"No rules found matching focus={valid_focus_values}. Trying with ANY focus.")
                
                # List all rules to see what's in the database
                all_rules = ImprovementRule.objects.all()
                logger.info(f"Total rules in database: {all_rules.count()}")
                
                for rule in all_rules:
                    logger.info(f"Rule ID={rule.id}, Trigger={rule.trigger_exercise.name}, Focus={rule.preference_focus}, Action={rule.action_type}")
                
                # Try again with any focus
                triggered_rules = ImprovementRule.objects.filter(
                    trigger_exercise_id__in=matched_predefined_ids     # Just match on exercise
                ).select_related('trigger_exercise', 'suggested_exercise')
            
            logger.info(f"Found {triggered_rules.count()} potential improvement rules matching criteria for focus={user_focus}")
            
            # Debug log each triggered rule
            for rule in triggered_rules:
                logger.info(f"Triggered Rule: ID={rule.id}, Trigger={rule.trigger_exercise.name}, Focus={rule.preference_focus}, Action={rule.action_type}")

            for rule in triggered_rules:
                 if rule.id not in applied_rules:
                     suggestion_data = {
                        'id': rule.id,
                        'trigger_exercise_name': rule.trigger_exercise.name,
                        'suggested_exercise_name': rule.suggested_exercise.name if rule.suggested_exercise else None,
                        'action_type': rule.action_type,
                        'reason': rule.reason,
                        'source': rule.source,
                        'preference_focus': rule.preference_focus,
                        'modification_details': rule.modification_details,
                     }
                     suggestions.append(suggestion_data)
                     applied_rules.add(rule.id)
                     logger.debug(f"Added suggestion from rule ID {rule.id} (Trigger: '{rule.trigger_exercise.name}', Action: {rule.action_type})")

            logger.info(f"Generated {len(suggestions)} final suggestions for routine {routine_id}.")

            # 5. Serialize the results
            try:
                serializer = ImprovementSuggestionSerializer(suggestions, many=True)
                serialized_data = serializer.data # Get the serialized data
                logger.debug("Serialization successful.")
                return Response(serialized_data, status=status.HTTP_200_OK)
            except Exception as serialization_error:
                 # Log serialization specific error
                 logger.exception(f"Error serializing suggestions for routine {routine_id}: {serialization_error}")
                 return Response(
                    {"detail": f"Error formatting suggestions: {serialization_error}"}, # Provide more specific error if possible
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                 )

        # Catch specific expected errors first
        except Routine.DoesNotExist:
            logger.warning(f"Routine with id {routine_id} not found for user {request.user}.")
            # This case should be handled by get_object_or_404, which returns 404 usually
            # If it gets here, something else might be wrong, but return 404
            return Response({"detail": "Routine not found or you do not have permission to access it."}, status=status.HTTP_404_NOT_FOUND)

        # Catch any other unexpected error during the process
        except Exception as e:
            # Log the full exception traceback for debugging
            logger.exception(f"--- Unexpected error during routine analysis (routine_id: {routine_id}) ---")
            # Return a generic 500 error with a detail message
            return Response(
                {"detail": "An internal server error occurred while analyzing the routine. Please contact support if the problem persists."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ---------- DIAGNOSTIC ENDPOINTS ----------
class DiagnosticView(APIView):
    """
    GET /api/diagnostic/
    Returns diagnostic information about the system
    """
    def get(self, request):
        exercises = PredefinedExercise.objects.all()
        exercise_count = exercises.count()
        exercise_names = list(exercises.values_list('name', flat=True))
        
        rules = ImprovementRule.objects.all()
        rule_count = rules.count()
        focus_values = list(set(rules.values_list('preference_focus', flat=True)))
        
        rule_summary = []
        for rule in rules:
            rule_summary.append({
                'id': rule.id,
                'trigger': rule.trigger_exercise.name,
                'action': rule.action_type,
                'focus': rule.preference_focus,
                'suggestion': rule.suggested_exercise.name if rule.suggested_exercise else None
            })
            
        return Response({
            'exercises': {
                'count': exercise_count,
                'names': exercise_names
            },
            'rules': {
                'count': rule_count,
                'focus_values': focus_values,
                'summary': rule_summary
            }
        })
