# backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Routine, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet, NutritionEntry
from .models import PredefinedExercise, ImprovementRule # Add new models here
import re

# ----------  USERS  ----------
class RegisterSerializer(serializers.ModelSerializer):
    """
    Creates a new user.
    We treat the email the student types in as both username + email.
    """
    email = serializers.EmailField(required=True)

    class Meta:
        model  = User
        fields = ("email", "password")       # ← username no longer required
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def create(self, validated_data):
        email = validated_data["email"]
        return User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


# ----------  ROUTINES + EXERCISES  ----------
class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Exercise
        # Ensure 'order' is handled if it exists in your Exercise model
        fields = ("id", "name", "sets", "reps", "weight", "order")


class RoutineSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    exercises = ExerciseSerializer(many=True, required=False)  # <- exercises inside routines

    class Meta:
        model  = Routine
        fields = ("id", "user", "name", "description", "created_at", "exercises")
        read_only_fields = ("id", "created_at", "user")

    # -------- create / update nested exercises ------------
    def create(self, validated_data):
        exercises_data = validated_data.pop("exercises", [])
        routine = Routine.objects.create(**validated_data)
        for idx, ex_data in enumerate(exercises_data): # Renamed ex to ex_data for clarity
            # Remove order from ex_data if it exists to avoid duplicate parameter
            # Use .get('order', idx) if order might be missing? Assuming it comes from request.
            # The original logic seems okay if order isn't expected in the input dict ex_data.
            ex_data_cleaned = ex_data.copy()
            if 'order' in ex_data_cleaned:
                 ex_data_cleaned.pop('order')
            # Ensure required fields like weight are present if necessary
            # Add default weight if not provided, matching api.ts logic
            ex_data_cleaned['weight'] = ex_data_cleaned.get('weight', 0)

            Exercise.objects.create(routine=routine, order=idx, **ex_data_cleaned)
        return routine

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop("exercises", [])
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.save()

        # delete old exercises and recreate (simple for now)
        instance.exercises.all().delete()
        for idx, ex_data in enumerate(exercises_data): # Renamed ex to ex_data
            # Remove order from ex_data if it exists
            ex_data_cleaned = ex_data.copy()
            if 'order' in ex_data_cleaned:
                ex_data_cleaned.pop('order')
             # Ensure required fields like weight are present if necessary
            ex_data_cleaned['weight'] = ex_data_cleaned.get('weight', 0)

            Exercise.objects.create(routine=instance, order=idx, **ex_data_cleaned)
        return instance


# ----------  WORKOUT TRACKING  ----------
class WorkoutSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSet
        fields = ('id', 'weight', 'reps', 'set_number')
        # You might want to add extra_kwargs for min_value validation if desired
        extra_kwargs = {
             'weight': {'min_value': 0},
             'reps': {'min_value': 0},
             'set_number': {'min_value': 1},
         }


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    sets = WorkoutSetSerializer(many=True, required=False)

    class Meta:
        model = WorkoutExercise
        fields = ('id', 'name', 'order', 'sets')
        # Order might be read_only if always calculated in WorkoutSessionSerializer
        read_only_fields = ('id',) # Order is often set based on list position

    # Create is usually handled within WorkoutSessionSerializer for nested structure


class WorkoutSessionSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, required=False)
    user = UserSerializer(read_only=True)
    # Ensure routine ID is accepted on write but serialized as object on read if needed
    routine = serializers.PrimaryKeyRelatedField(
        queryset=Routine.objects.all(), # Required queryset for PrimaryKeyRelatedField
        required=False,
        allow_null=True
        )

    class Meta:
        model = WorkoutSession
        fields = ('id', 'user', 'routine', 'name', 'date', 'exercises')
        read_only_fields = ('id', 'date', 'user')

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        # Ensure the user is set correctly (already done by perform_create in view)
        # validated_data['user'] = self.context['request'].user # Not needed if using perform_create
        workout = WorkoutSession.objects.create(**validated_data)

        for idx, exercise_data in enumerate(exercises_data):
            sets_data = exercise_data.pop('sets', [])

            # --- FIX for 'order' TypeError STARTS HERE ---
            # Remove 'order' from exercise_data if it exists, to prevent duplicate keyword argument
            exercise_data_cleaned = exercise_data.copy()
            if 'order' in exercise_data_cleaned:
                exercise_data_cleaned.pop('order')
            # --- FIX for 'order' TypeError ENDS HERE ---

            # Pass the explicit order=idx and the rest of the cleaned data
            # Ensure exercise name is present
            exercise_name = exercise_data_cleaned.get('name', f'Exercise {idx+1}') # Provide default name?
            if not exercise_name: # Or raise validation error earlier
                 # Handle missing name case - skip, use default, or raise error
                 print(f"Warning: Skipping exercise at index {idx} due to missing name.") # Log warning
                 continue # Skip this exercise


            exercise = WorkoutExercise.objects.create(
                workout_session=workout,
                order=idx, # Explicitly set the order based on the list index
                name=exercise_name, # Ensure name is passed
                **exercise_data_cleaned # Pass the rest of the data (potentially empty now)
            )

            for set_idx, set_data in enumerate(sets_data):
                # Ensure set_number is handled correctly
                set_number = set_data.pop('set_number', set_idx + 1) # Use provided or calculate default
                # Ensure weight and reps are numeric and handle missing keys
                weight = set_data.pop('weight', 0)
                reps = set_data.pop('reps', 0)

                WorkoutSet.objects.create(
                    exercise=exercise,
                    set_number=set_number,
                    weight=weight,
                    reps=reps,
                    # Pass any remaining set data if there is any
                    **set_data
                )

        return workout


# ----------  NUTRITION TRACKING  ----------
class NutritionEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = NutritionEntry
        fields = ('id', 'user', 'date', 'calories', 'protein', 'notes')
        read_only_fields = ('id', 'user')


# ---------- IMPROVEMENT FEATURE SERIALIZERS ----------

class PredefinedExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredefinedExercise
        fields = ('id', 'name', 'muscle_group', 'type', 'equipment')


# --- ImprovementSuggestionSerializer with 'title' KeyError fix ---
class ImprovementSuggestionSerializer(serializers.Serializer):
    """ Serializer for the output of the analysis endpoint """
    # Fields directly from the data dictionary built in the view
    id = serializers.IntegerField() # ID of the ImprovementRule
    trigger_exercise_name = serializers.CharField()
    suggested_exercise_name = serializers.CharField(allow_null=True, required=False) # Make optional
    action_type = serializers.CharField()
    reason = serializers.CharField()
    source = serializers.CharField(allow_blank=True, required=False)
    preference_focus = serializers.CharField()
    modification_details = serializers.CharField(allow_blank=True, required=False)

    # Fields derived/mapped for frontend compatibility (set as read_only if derived)
    replacesExercise = serializers.CharField(source='trigger_exercise_name', allow_null=True, read_only=True)
    newExercise = serializers.CharField(source='suggested_exercise_name', allow_null=True, read_only=True)
    addExercise = serializers.CharField(source='suggested_exercise_name', allow_null=True, read_only=True)
    modifyTechnique = serializers.CharField(source='modification_details', allow_blank=True, read_only=True)
    scientificExplanation = serializers.CharField(source='reason', read_only=True)
    researchSource = serializers.CharField(source='source', allow_blank=True, read_only=True)
    applicableFor = serializers.SerializerMethodField(read_only=True) # Use SerializerMethodField
    sets = serializers.CharField(read_only=True, default="N/A") # Populated in to_representation
    reps = serializers.CharField(read_only=True, default="N/A") # Populated in to_representation

    # Removed explicit title and description fields here

    def get_applicableFor(self, obj):
        # obj here is the dictionary like {'id': 1, 'trigger_exercise_name': ...}
        return [obj.get('preference_focus', 'all')]

    def to_representation(self, instance):
        """ Dynamically adjust fields and add title/description """
        # instance is the dictionary from the view
        ret = super().to_representation(instance) # Get basic representation

        # --- Construct title and description dynamically ---
        trigger = ret.get('trigger_exercise_name', 'Your routine')
        suggestion = ret.get('suggested_exercise_name')
        action = ret.get('action_type', 'suggestion').replace('_', ' ')

        if ret['action_type'] == 'replace' and suggestion:
            ret['title'] = f"Consider Replacing {trigger}"
            ret['description'] = f"Suggestion to replace {trigger} with {suggestion} based on your goals."
        elif ret['action_type'] == 'add' and suggestion:
             ret['title'] = f"Consider Adding {suggestion}"
             ret['description'] = f"Suggestion to add {suggestion} to complement your routine."
        elif ret['action_type'] == 'modify_technique':
             ret['title'] = f"Refine Technique for {trigger}"
             ret['description'] = f"Suggestion to modify technique for {trigger} for better results or safety."
        else:
             ret['title'] = f"General Suggestion for {trigger}" # Fallback title
             ret['description'] = f"A suggestion related to {trigger}." # Fallback description

        # --- Clear/Adjust fields based on action_type ---
        if ret['action_type'] == 'replace':
            ret['addExercise'] = None
            ret['modifyTechnique'] = None # Clear modify if replacing
            ret['sets'] = None
            ret['reps'] = None
        elif ret['action_type'] == 'add':
            ret['replacesExercise'] = None
            ret['newExercise'] = None # Keep addExercise
            ret['modifyTechnique'] = None
            # Try to extract sets/reps from modification_details if available
            details = instance.get('modification_details', '') # Use original instance dict
            match = re.search(r'(\d+-\d+|\d+)\s*sets.*(\d+-\d+|\d+)\s*reps', details, re.IGNORECASE)
            if match:
                ret['sets'] = match.group(1)
                ret['reps'] = match.group(2)
            else:
                ret['sets'] = "As recommended" # Keep default if no match
                ret['reps'] = "As recommended"
        elif ret['action_type'] == 'modify_technique':
            ret['replacesExercise'] = ret.get('trigger_exercise_name') # Show which exercise to modify
            ret['newExercise'] = None
            ret['addExercise'] = None
            # Use details if present, otherwise fallback to reason for modifyTechnique display
            ret['modifyTechnique'] = instance.get('modification_details') or instance.get('reason')
            ret['sets'] = None
            ret['reps'] = None
        # No 'else' needed if we want to keep base fields for unknown action types

        # Ensure all potentially expected frontend keys exist in the final dict
        # This list should match the fields the frontend component expects
        expected_frontend_keys = [
            'id', 'title', 'description', 'replacesExercise', 'newExercise',
            'addExercise', 'modifyTechnique', 'scientificExplanation',
            'researchSource', 'applicableFor', 'sets', 'reps',
            # Include base fields too if needed by frontend directly
             'trigger_exercise_name', 'suggested_exercise_name', 'action_type',
             'reason', 'source', 'preference_focus', 'modification_details'
             ]
        for key in expected_frontend_keys:
            if key not in ret:
                ret[key] = None # Add missing keys as None to avoid frontend KeyErrors

        return ret