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
        fields = ("email", "password")          # ← username no longer required
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
        for idx, ex in enumerate(exercises_data):
            # Remove order from ex if it exists to avoid duplicate parameter
            ex_data = ex.copy()
            if 'order' in ex_data:
                ex_data.pop('order')
            Exercise.objects.create(routine=routine, order=idx, **ex_data)
        return routine

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop("exercises", [])
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.save()

        # delete old exercises and recreate (simple for now)
        instance.exercises.all().delete()
        for idx, ex in enumerate(exercises_data):
            # Remove order from ex if it exists to avoid duplicate parameter
            ex_data = ex.copy()
            if 'order' in ex_data:
                ex_data.pop('order')
            Exercise.objects.create(routine=instance, order=idx, **ex_data)
        return instance


# ----------  WORKOUT TRACKING  ----------
class WorkoutSetSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutSet
        fields = ('id', 'weight', 'reps', 'set_number')


class WorkoutExerciseSerializer(serializers.ModelSerializer):
    sets = WorkoutSetSerializer(many=True, required=False)
    
    class Meta:
        model = WorkoutExercise
        fields = ('id', 'name', 'order', 'sets')
    
    def create(self, validated_data):
        sets_data = validated_data.pop('sets', [])
        exercise = WorkoutExercise.objects.create(**validated_data)
        
        for set_data in sets_data:
            WorkoutSet.objects.create(exercise=exercise, **set_data)
        
        return exercise


class WorkoutSessionSerializer(serializers.ModelSerializer):
    exercises = WorkoutExerciseSerializer(many=True, required=False)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = WorkoutSession
        fields = ('id', 'user', 'routine', 'name', 'date', 'exercises')
        read_only_fields = ('id', 'date', 'user')
    
    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        workout = WorkoutSession.objects.create(**validated_data)
        
        for idx, exercise_data in enumerate(exercises_data):
            sets_data = exercise_data.pop('sets', [])
            exercise = WorkoutExercise.objects.create(workout_session=workout, order=idx, **exercise_data)
            
            for set_idx, set_data in enumerate(sets_data):
                WorkoutSet.objects.create(
                    exercise=exercise,
                    set_number=set_data.get('set_number', set_idx + 1),
                    **{k: v for k, v in set_data.items() if k != 'set_number'}
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


class ImprovementSuggestionSerializer(serializers.Serializer):
    """ Serializer for the output of the analysis endpoint """
    id = serializers.IntegerField() # ID of the ImprovementRule
    trigger_exercise_name = serializers.CharField()
    suggested_exercise_name = serializers.CharField(allow_null=True)
    action_type = serializers.CharField()
    reason = serializers.CharField()
    source = serializers.CharField(allow_blank=True)
    preference_focus = serializers.CharField()
    modification_details = serializers.CharField(allow_blank=True)

    # These fields match the frontend mock structure for easier integration
    title = serializers.CharField() # We'll construct this in the view
    description = serializers.CharField() # We'll construct this
    replacesExercise = serializers.CharField(source='trigger_exercise_name', allow_null=True) # Map field name
    newExercise = serializers.CharField(source='suggested_exercise_name', allow_null=True) # Map field name
    addExercise = serializers.CharField(source='suggested_exercise_name', allow_null=True) # Map field name
    modifyTechnique = serializers.CharField(source='modification_details', allow_blank=True) # Map field name
    scientificExplanation = serializers.CharField(source='reason') # Map field name
    researchSource = serializers.CharField(source='source', allow_blank=True) # Map field name
    # Mock-like fields needed for display consistency
    applicableFor = serializers.SerializerMethodField() # Needed by frontend mock structure, populate with preference
    sets = serializers.CharField(default="N/A", read_only=True) # Placeholder for 'add' type
    reps = serializers.CharField(default="N/A", read_only=True) # Placeholder for 'add' type

    def get_applicableFor(self, obj):
        # Return the preference focus in a list as the frontend expects
        return [obj.get('preference_focus', 'all')]

    def to_representation(self, instance):
        """ Dynamically adjust fields based on action_type """
        ret = super().to_representation(instance)

        # Clear fields that don't apply to the action_type
        if ret['action_type'] == 'replace':
            ret['addExercise'] = None
            ret['modifyTechnique'] = None
            ret['sets'] = None
            ret['reps'] = None
        elif ret['action_type'] == 'add':
            ret['replacesExercise'] = None
            ret['newExercise'] = None # Keep addExercise
            ret['modifyTechnique'] = None
             # Try to extract sets/reps from modification_details if available
            details = ret.get('modification_details', '')
            import re
            match = re.search(r'(\d+-\d+|\d+)\s*sets.*(\d+-\d+|\d+)\s*reps', details, re.IGNORECASE)
            if match:
                ret['sets'] = match.group(1)
                ret['reps'] = match.group(2)
            else:
                ret['sets'] = "As recommended"
                ret['reps'] = "As recommended"

        elif ret['action_type'] == 'modify_technique':
            ret['replacesExercise'] = ret.get('trigger_exercise_name') # Show which exercise to modify
            ret['newExercise'] = None
            ret['addExercise'] = None
            ret['modifyTechnique'] = ret.get('modification_details') or ret.get('reason') # Use details or reason
            ret['sets'] = None
            ret['reps'] = None
        else: # Default case, clear specific action fields
             ret['replacesExercise'] = None
             ret['newExercise'] = None
             ret['addExercise'] = None
             ret['modifyTechnique'] = None
             ret['sets'] = None
             ret['reps'] = None


        # Construct title and description dynamically
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
             ret['title'] = f"General Suggestion for {trigger}"
             ret['description'] = f"A suggestion related to {trigger}."


        return ret
