# backend/api/admin.py
from django.contrib import admin
from .models import (
    Routine, Exercise,
    WorkoutSession, WorkoutExercise, WorkoutSet,
    NutritionEntry,
    PredefinedExercise, ImprovementRule # Add new models
)

# ... (keep existing registrations if any, like Routine, Exercise)

@admin.register(PredefinedExercise)
class PredefinedExerciseAdmin(admin.ModelAdmin):
    list_display = ('name', 'muscle_group', 'type', 'equipment')
    search_fields = ('name', 'muscle_group', 'equipment')
    list_filter = ('muscle_group', 'type')

@admin.register(ImprovementRule)
class ImprovementRuleAdmin(admin.ModelAdmin):
    list_display = ('trigger_exercise', 'action_type', 'suggested_exercise', 'preference_focus')
    search_fields = ('trigger_exercise__name', 'suggested_exercise__name', 'reason', 'modification_details')
    list_filter = ('action_type', 'preference_focus', 'trigger_exercise__muscle_group')
    autocomplete_fields = ['trigger_exercise', 'suggested_exercise'] # Makes selecting exercises easier

# Make sure other models are registered too if needed
admin.site.register(Routine)
admin.site.register(Exercise)
admin.site.register(WorkoutSession)
admin.site.register(WorkoutExercise)
admin.site.register(WorkoutSet)
admin.site.register(NutritionEntry)