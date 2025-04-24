from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Routine


# ----------  USERS  ----------
class RegisterSerializer(serializers.ModelSerializer):
    """
    Creates a new user.
    We’ll treat the email the student types in as their username.
    """
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password")
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # username will be the same as email for simplicity
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username")


# ----------  ROUTINES  ----------
class RoutineSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Routine
        fields = ("id", "user", "name", "description", "created_at")
        read_only_fields = ("id", "created_at", "user")
