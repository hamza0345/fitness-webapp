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
    completed = models.BooleanField(default=False)  # Keep the completed flag
    
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

# backend/api/models.py
# ... (keep existing models User, Routine, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet, NutritionEntry) ...

# ---------- NEW MODELS FOR IMPROVEMENT FEATURE ----------

class PredefinedExercise(models.Model):
    """ Stores a curated list of common exercises """
    name = models.CharField(max_length=120, unique=True)
    muscle_group = models.CharField(max_length=50, blank=True, help_text="Primary muscle group targeted")
    type = models.CharField(max_length=50, blank=True, help_text="e.g., Compound, Isolation, Isometric")
    equipment = models.CharField(max_length=100, blank=True, help_text="e.g., Barbell, Dumbbell, Cable, Machine, Bodyweight")

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


# backend/api/models.py
# ... imports ...

# backend/api/models.py
# ... (other imports and models) ...

class ImprovementRule(models.Model):
    """ Defines rules for suggesting exercise improvements """
    ACTION_CHOICES = [
        ('replace', 'Replace'),
        ('add', 'Add'),
        ('modify_technique', 'Modify Technique'),
    ]
    PREFERENCE_CHOICES = [
        ('hypertrophy', 'Hypertrophy'),
        ('powerlifting', 'Powerlifting'),
        # ('general_fitness', 'General Fitness'), # Keep commented/removed if desired
        # ('injury_prevention', 'Injury Prevention'), # Keep commented/removed if desired
        ('all', 'All'),
    ]

    trigger_exercise = models.ForeignKey(
        PredefinedExercise,
        # --- ADD on_delete HERE ---
        on_delete=models.CASCADE, # If the trigger exercise is deleted, delete this rule too.
        related_name='trigger_rules',
        help_text="The exercise in the user's routine that triggers this suggestion."
    )
    suggested_exercise = models.ForeignKey(
        PredefinedExercise,
        # --- ADD on_delete HERE ---
        on_delete=models.SET_NULL, # If suggested exercise is deleted, set this field to Null.
        null=True, blank=True,     # Required when using models.SET_NULL
        related_name='suggestion_rules',
        help_text="The exercise recommended as a replacement or addition (null if modifying technique)."
    )
    preference_focus = models.CharField(
        max_length=20,
        choices=PREFERENCE_CHOICES,
        default='all',
        help_text="The user preference this rule applies to."
    )
    reason = models.TextField(help_text="Scientific explanation for the suggestion.")
    source = models.CharField(max_length=200, blank=True, help_text="Optional source for the information (e.g., study name, expert).")
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES, default='replace')
    modification_details = models.TextField(
        blank=True,
        help_text="Specific instructions if action_type is 'add' or 'modify_technique'."
    )

    def __str__(self):
        # ... (keep existing __str__ method) ...
        if self.action_type == 'replace':
            return f"If doing {self.trigger_exercise}, consider replacing with {self.suggested_exercise} for {self.preference_focus}"
        elif self.action_type == 'add':
             return f"Consider adding {self.suggested_exercise} to routines with {self.trigger_exercise} for {self.preference_focus}"
        else: # modify_technique
            return f"Consider modifying technique for {self.trigger_exercise} for {self.preference_focus}"


    class Meta:
        ordering = ['trigger_exercise__name']
        unique_together = [['trigger_exercise', 'suggested_exercise', 'preference_focus', 'action_type']]

# ... (rest of models.py) ...