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


# New models for workout tracking
class WorkoutSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="workout_sessions")
    routine = models.ForeignKey(Routine, on_delete=models.SET_NULL, null=True, related_name="workout_sessions")
    name = models.CharField(max_length=120)  # Name of the workout (usually same as routine name but can be custom)
    date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.date.strftime('%Y-%m-%d')}"


class WorkoutExercise(models.Model):
    workout_session = models.ForeignKey(WorkoutSession, on_delete=models.CASCADE, related_name="exercises")
    name = models.CharField(max_length=120)
    order = models.PositiveSmallIntegerField(default=0)
    
    def __str__(self):
        return f"{self.name} in {self.workout_session}"


class WorkoutSet(models.Model):
    exercise = models.ForeignKey(WorkoutExercise, on_delete=models.CASCADE, related_name="sets")
    weight = models.DecimalField(max_digits=6, decimal_places=2)
    reps = models.PositiveSmallIntegerField()
    set_number = models.PositiveSmallIntegerField()
    
    class Meta:
        ordering = ["set_number"]
    
    def __str__(self):
        return f"Set {self.set_number}: {self.weight}kg × {self.reps} reps"


# New model for nutrition tracking
class NutritionEntry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="nutrition_entries")
    date = models.DateField()
    calories = models.PositiveIntegerField()
    protein = models.DecimalField(max_digits=6, decimal_places=2)  # in grams
    notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ["-date"]
        unique_together = ['user', 'date']  # One nutrition entry per user per day
    
    def __str__(self):
        return f"{self.user.username} - {self.date}: {self.calories}kcal, {self.protein}g protein"
