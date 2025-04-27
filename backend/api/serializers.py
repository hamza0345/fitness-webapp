# backend/api/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Routine, Exercise


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
