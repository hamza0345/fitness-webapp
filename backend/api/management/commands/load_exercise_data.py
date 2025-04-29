# backend/api/management/commands/load_exercise_data.py
import logging
from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import PredefinedExercise, ImprovementRule
from api.exercise_data import PREDEFINED_EXERCISES, IMPROVEMENT_RULES # Import from your data file

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Loads predefined exercises and improvement rules from exercise_data.py'

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Loading Predefined Exercises...")
        created_exercises_count = 0
        skipped_exercises_count = 0
        exercise_map = {} # To map names to IDs for rule creation

        # Load exercises
        for name, muscle_group, type, equipment in PREDEFINED_EXERCISES:
            obj, created = PredefinedExercise.objects.get_or_create(
                name=name,
                defaults={
                    'muscle_group': muscle_group,
                    'type': type,
                    'equipment': equipment,
                }
            )
            if created:
                created_exercises_count += 1
                exercise_map[name] = obj # Store newly created object
                logger.debug(f"Created exercise: {name}")
            else:
                skipped_exercises_count += 1
                exercise_map[name] = obj # Store existing object
                logger.debug(f"Skipped existing exercise: {name}")

        self.stdout.write(f"Finished exercises. Created: {created_exercises_count}, Skipped: {skipped_exercises_count}")

        self.stdout.write("Loading Improvement Rules...")
        created_rules_count = 0
        skipped_rules_count = 0

        # Load rules
        for data in IMPROVEMENT_RULES:
            # Unpack data, handle potential length difference if modification_details is missing
            if len(data) == 7:
                 trigger_name, suggested_name, pref, reason, source, action, mod_details = data
            elif len(data) == 6: # Assuming modification_details might be omitted
                 trigger_name, suggested_name, pref, reason, source, action = data
                 mod_details = None
            else:
                 self.stderr.write(f"Skipping invalid rule data tuple: {data}")
                 continue


            trigger_ex = exercise_map.get(trigger_name)
            suggested_ex = exercise_map.get(suggested_name) if suggested_name else None

            if not trigger_ex:
                self.stderr.write(f"Skipping rule: Trigger exercise '{trigger_name}' not found.")
                continue
            if suggested_name and not suggested_ex and action != 'modify_technique':
                self.stderr.write(f"Skipping rule: Suggested exercise '{suggested_name}' not found for trigger '{trigger_name}'.")
                continue

            try:
                _, created = ImprovementRule.objects.get_or_create(
                    trigger_exercise=trigger_ex,
                    suggested_exercise=suggested_ex,
                    preference_focus=pref.lower(),
                    action_type=action.lower(),
                    defaults={
                        'reason': reason,
                        'source': source,
                        'modification_details': mod_details or '',
                    }
                )
                if created:
                    created_rules_count += 1
                    logger.debug(f"Created rule for trigger: {trigger_name}")
                else:
                    skipped_rules_count += 1
                    logger.debug(f"Skipped existing rule for trigger: {trigger_name}")
            except Exception as e:
                 self.stderr.write(f"Error creating rule for trigger '{trigger_name}': {e}")


        self.stdout.write(f"Finished rules. Created: {created_rules_count}, Skipped: {skipped_rules_count}")
        self.stdout.write(self.style.SUCCESS('Successfully loaded exercise data.'))