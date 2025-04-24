from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class Routine(models.Model):
    """
    One user-created workout routine.
    Example: 'Push Day A'
    """
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="routines")
    name        = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
