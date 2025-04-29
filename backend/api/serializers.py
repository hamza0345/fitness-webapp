# backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Routine, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet, NutritionEntry


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
