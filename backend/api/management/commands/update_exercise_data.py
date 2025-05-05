from django.core.management.base import BaseCommand
from api.models import PredefinedExercise, ImprovementRule
from api.exercise_data import PREDEFINED_EXERCISES, IMPROVEMENT_RULES

class Command(BaseCommand):
    help = 'Updates predefined exercises and improvement rules'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Updating exercise data...'))
        
        # First clear out existing data
        self.stdout.write('Clearing existing rules...')
        ImprovementRule.objects.all().delete()
        
        self.stdout.write('Clearing existing predefined exercises...')
        PredefinedExercise.objects.all().delete()
        
        # Load predefined exercises
        self.stdout.write('Loading predefined exercises...')
        predefined_exercises = {}
        for name, muscle_group, ex_type, equipment in PREDEFINED_EXERCISES:
            exercise = PredefinedExercise.objects.create(
                name=name,
                muscle_group=muscle_group,
                type=ex_type,
                equipment=equipment
            )
            predefined_exercises[name] = exercise
            
        # Load improvement rules
        self.stdout.write('Loading improvement rules...')
        for rule_data in IMPROVEMENT_RULES:
            trigger_name, suggested_name, focus, reason, source, action_type, modification_details = rule_data
            
            # Skip if the trigger exercise is not in our dictionary
            if trigger_name not in predefined_exercises:
                self.stderr.write(f'Trigger exercise "{trigger_name}" not found. Skipping rule.')
                continue
                
            trigger_exercise = predefined_exercises[trigger_name]
            suggested_exercise = None
            if suggested_name and suggested_name in predefined_exercises:
                suggested_exercise = predefined_exercises[suggested_name]
                
            # Create the rule
            ImprovementRule.objects.create(
                trigger_exercise=trigger_exercise,
                suggested_exercise=suggested_exercise,
                preference_focus=focus,
                reason=reason,
                source=source or "",
                action_type=action_type,
                modification_details=modification_details or ""
            )
            
        # Print counts for verification
        exercise_count = PredefinedExercise.objects.count()
        rule_count = ImprovementRule.objects.count()
        self.stdout.write(self.style.SUCCESS(f'Successfully loaded {exercise_count} exercises and {rule_count} improvement rules'))
        
        # Print focus values to verify
        focus_values = set(ImprovementRule.objects.values_list('preference_focus', flat=True))
        self.stdout.write(f'Focus values in database: {focus_values}') 