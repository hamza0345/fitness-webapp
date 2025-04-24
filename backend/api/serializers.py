from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Routine


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
            username=email,          # we still store it as username internally
            email=email,
            password=validated_data["password"],
        )



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
