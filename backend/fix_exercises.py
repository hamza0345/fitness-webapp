#!/usr/bin/env python
# Run with: python3 backend/fix_exercises.py (from fitness-app-cw directory)

import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import PredefinedExercise, ImprovementRule
from api.exercise_data import PREDEFINED_EXERCISES, IMPROVEMENT_RULES

def main():
    print("Starting database update...")
    
    # Clear existing data if needed
    print("Removing existing rules...")
    ImprovementRule.objects.all().delete()
    
    print("Removing existing exercises...")
    PredefinedExercise.objects.all().delete()
    
    # Add predefined exercises
    print("Adding predefined exercises...")
    predefined_exercises = {}
    for name, muscle_group, ex_type, equipment in PREDEFINED_EXERCISES:
        exercise = PredefinedExercise.objects.create(
            name=name,
            muscle_group=muscle_group,
            type=ex_type,
            equipment=equipment
        )
        predefined_exercises[name] = exercise
    
    # Add improvement rules
    print("Adding improvement rules...")
    rule_count = 0
    for rule_data in IMPROVEMENT_RULES:
        trigger_name, suggested_name, focus, reason, source, action_type, modification_details = rule_data
        
        if trigger_name not in predefined_exercises:
            print(f"Error: Trigger exercise '{trigger_name}' not found. Skipping rule.")
            continue
            
        trigger_exercise = predefined_exercises[trigger_name]
        suggested_exercise = None
        if suggested_name and suggested_name in predefined_exercises:
            suggested_exercise = predefined_exercises[suggested_name]
        
        ImprovementRule.objects.create(
            trigger_exercise=trigger_exercise,
            suggested_exercise=suggested_exercise,
            preference_focus=focus,
            reason=reason,
            source=source or "",
            action_type=action_type,
            modification_details=modification_details or ""
        )
        rule_count += 1
    
    # Print summary
    print(f"Added {len(predefined_exercises)} exercises and {rule_count} improvement rules")
    
    # Print focus values
    focus_values = set(ImprovementRule.objects.values_list('preference_focus', flat=True))
    print(f"Focus values in database: {focus_values}")

if __name__ == "__main__":
    main() 