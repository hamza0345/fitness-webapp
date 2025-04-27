from django.db import models
from django.contrib.auth.models import User


class Routine(models.Model):
    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name="routines")
    name         = models.CharField(max_length=120)
    description  = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Exercise(models.Model):
    routine   = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name="exercises")
    name      = models.CharField(max_length=120)
    sets      = models.PositiveSmallIntegerField(default=3)
    reps      = models.PositiveSmallIntegerField(default=10)
    weight    = models.DecimalField(max_digits=6, decimal_places=2)  # 9999.99 kg/lb max
    order     = models.PositiveSmallIntegerField(default=0)          # to keep them sorted

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.name} ({self.sets}×{self.reps}@{self.weight})"
