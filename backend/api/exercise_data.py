PREDEFINED_EXERCISES = [
    # Generic exercise names that users might enter
    ("Bench Press", "Chest", "Compound", "Barbell/Dumbbell"),
    ("Squat", "Legs", "Compound", "Barbell/Bodyweight"),
    ("Deadlift", "Back", "Compound", "Barbell"),
    ("Bicep Curl", "Biceps", "Isolation", "Barbell/Dumbbell"),
    ("Shoulder Press", "Shoulders", "Compound", "Barbell/Dumbbell"),
    
    # Chest
    ("Barbell Bench Press", "Chest", "Compound", "Barbell"),
    ("Dumbbell Bench Press", "Chest", "Compound", "Dumbbell"),
    ("Incline Barbell Press", "Chest", "Compound", "Barbell"),
    ("Incline Dumbbell Press", "Chest", "Compound", "Dumbbell"),
    ("Decline Barbell Press", "Chest", "Compound", "Barbell"),
    ("Decline Dumbbell Press", "Chest", "Compound", "Dumbbell"),
    ("Push-up", "Chest", "Compound", "Bodyweight"),
    ("Dumbbell Flyes", "Chest", "Isolation", "Dumbbell"),
    ("Cable Crossover", "Chest", "Isolation", "Cable"),

    # Back
    ("Pull-up", "Back", "Compound", "Bodyweight"),
    ("Chin-up", "Back", "Compound", "Bodyweight"),
    ("Lat Pulldown", "Back", "Compound", "Cable"),
    ("Barbell Row", "Back", "Compound", "Barbell"),
    ("Dumbbell Row", "Back", "Compound", "Dumbbell"),
    ("T-Bar Row", "Back", "Compound", "Barbell/Machine"),
    ("Seated Cable Row", "Back", "Compound", "Cable"),
    ("Face Pull", "Shoulders", "Isolation", "Cable"), # Often included on back/pull days for shoulder health

    # Shoulders
    ("Overhead Press (Barbell)", "Shoulders", "Compound", "Barbell"),
    ("Overhead Press (Dumbbell)", "Shoulders", "Compound", "Dumbbell"),
    ("Arnold Press", "Shoulders", "Compound", "Dumbbell"),
    ("Lateral Raise (Dumbbell)", "Shoulders", "Isolation", "Dumbbell"),
    ("Lateral Raise (Cable)", "Shoulders", "Isolation", "Cable"),
    ("Front Raise (Dumbbell)", "Shoulders", "Isolation", "Dumbbell"),
    ("Upright Row (Barbell)", "Shoulders", "Compound", "Barbell"), # Controversial, good candidate for replacement
    ("Upright Row (Dumbbell)", "Shoulders", "Compound", "Dumbbell"), # Controversial
    ("Reverse Pec Deck", "Shoulders", "Isolation", "Machine"),

    # Legs
    ("Front Squat", "Legs", "Compound", "Barbell"),
    ("Leg Press", "Legs", "Compound", "Machine"),
    ("Romanian Deadlift", "Legs", "Compound", "Barbell"),
    ("Stiff-Leg Deadlift", "Legs", "Compound", "Barbell"),
    ("Good Morning", "Legs", "Compound", "Barbell"),
    ("Hamstring Curl", "Legs", "Isolation", "Machine"),
    ("Leg Extension", "Legs", "Isolation", "Machine"),
    ("Calf Raise", "Legs", "Isolation", "Machine/Bodyweight"),
    ("Lunge", "Legs", "Compound", "Bodyweight/Dumbbell/Barbell"),

    # Arms - Biceps
    ("Barbell Curl", "Biceps", "Isolation", "Barbell"),
    ("Dumbbell Curl", "Biceps", "Isolation", "Dumbbell"),
    ("Hammer Curl", "Biceps", "Isolation", "Dumbbell"),
    ("Preacher Curl", "Biceps", "Isolation", "Barbell/Dumbbell/Machine"),
    ("Concentration Curl", "Biceps", "Isolation", "Dumbbell"),

    # Arms - Triceps
    ("Close-Grip Bench Press", "Triceps", "Compound", "Barbell"),
    ("Dip", "Triceps", "Compound", "Bodyweight/Machine"),
    ("Skullcrusher (Barbell)", "Triceps", "Isolation", "Barbell"),
    ("Skullcrusher (Dumbbell)", "Triceps", "Isolation", "Dumbbell"),
    ("Overhead Dumbbell Extension", "Triceps", "Isolation", "Dumbbell"),
    ("Triceps Pushdown (Cable)", "Triceps", "Isolation", "Cable"),

    # Core
    ("Crunch", "Core", "Isolation", "Bodyweight"),
    ("Leg Raise", "Core", "Isolation", "Bodyweight"),
    ("Plank", "Core", "Isometric", "Bodyweight"),
    ("Russian Twist", "Core", "Isolation", "Bodyweight/Weight"),
    ("Cable Crunch", "Core", "Isolation", "Cable"),
]


IMPROVEMENT_RULES = [
    # Bench Press variants - very common exercise
    (
        "Bench Press",  # More generic name that might be used by users
        "Incline Dumbbell Press",
        "hypertrophy",
        "Incline Dumbbell Press allows for a greater range of motion and stretch on the upper pectoral fibers, potentially leading to better hypertrophy in that region. Dumbbells also require more stabilization.",
        "Exercise science studies on muscle activation",
        "replace",
        None,
    ),
    (
        "Bench Press",  # Same as above but for powerlifting focus
        "Close-Grip Bench Press",
        "powerlifting",
        "Close-Grip Bench Press can help build triceps strength which is often a limiting factor in bench press performance for powerlifters. It also places less stress on the shoulders.",
        "Powerlifting technique research",
        "replace",
        None,
    ),
    # Original rules
    (
        "Upright Row (Barbell)",
        "Face Pull",
        "powerlifting",
        "Barbell Upright Rows internally rotate the shoulder under load, increasing impingement risk. Face Pulls target rear deltoids and external rotators, improving posture and shoulder health.",
        "Multiple physio & biomechanics sources",
        "replace",
        None,
    ),
    (
        "Upright Row (Dumbbell)",
        "Lateral Raise (Dumbbell)",
        "hypertrophy",
        "While potentially safer than barbell upright rows, dumbbell upright rows can still cause impingement. Lateral raises offer a more direct way to target the medial deltoid for hypertrophy with less risk.",
        "Biomechanics principles",
        "replace",
        None,
    ),
     (
        "Upright Row (Barbell)",
        "Lateral Raise (Dumbbell)",
        "hypertrophy",
        "Upright rows can cause shoulder impingement. Lateral raises target the medial deltoid effectively for hypertrophy with a safer range of motion.",
        "Biomechanics principles",
        "replace",
        None,
    ),
    (
        "Barbell Bench Press",
        "Incline Dumbbell Press",
        "hypertrophy",
        "Incline Dumbbell Press allows for a greater range of motion and stretch on the upper pectoral fibers, potentially leading to better hypertrophy in that region. Dumbbells also require more stabilization.",
        "Exercise science studies on muscle activation",
        "replace",
        None,
    ),
    # Squat variations - another very common exercise
    (
        "Squat",  # Generic squats that users might enter
        "Front Squat",
        "hypertrophy",
        "Front Squats place more emphasis on the quadriceps and require a more upright torso position, which can be beneficial for athletes looking to build quad size and maintain proper posture.",
        "Biomechanical analysis of squat variations",
        "replace",
        None,
    ),
    (
        "Squat",  # Same for powerlifting
        "Low-Bar Squat",
        "powerlifting",
        "The low-bar squat position typically allows for greater loading due to favorable leverages and biomechanics, making it a preferred variation for powerlifters aiming to maximize strength.",
        "Powerlifting competition analysis",
        "replace",
        None,
    ),
    # Bicep work - virtually everyone does some form of bicep exercise
    (
        "Bicep Curl", 
        "Hammer Curl",
        "hypertrophy",
        "Hammer Curls target the brachialis and brachioradialis in addition to the biceps brachii, potentially leading to fuller arm development and greater overall arm size.",
        "Muscle activation studies",
        "replace",
        None,
    ),
    (
        "Bicep Curl",
        "Weighted Chin-Up",
        "powerlifting",
        "Weighted Chin-Ups are a compound movement that engages more muscle mass and allows for progressive overload more effectively than isolated curls, making them better suited for strength development.",
        "Strength training principles",
        "replace",
        None,
    ),
    # Deadlift improvements - fundamental compound exercise
    (
        "Deadlift",
        None, # No suggested exercise replacement
        "powerlifting",
        "Ensure you are bracing correctly before initiating the pull. Take a deep breath into your belly, engage your lats by pulling the bar tight ('pulling the slack out'), and maintain a neutral spine throughout the lift to maximize force production and minimize injury risk.",
        "Powerlifting technique guides (e.g., Starting Strength)",
        "modify_technique",
        "Focus on core bracing and lat engagement before initiating the lift. Maintain neutral spine.",
    ),
    (
        "Deadlift",
        "Romanian Deadlift",
        "hypertrophy",
        "Romanian Deadlifts place greater emphasis on the hamstrings and glutes compared to conventional deadlifts, leading to better posterior chain development when hypertrophy is the main goal.",
        "Research on muscle activation patterns",
        "replace",
        None,
    ),
    # Previous rules continuing
    (
        "Barbell Bench Press",
        "Dumbbell Bench Press",
        "powerlifting",
        "Dumbbell Bench Press allows for a more natural range of motion and requires greater stabilization, potentially improving functional strength and reducing muscle imbalances compared to the fixed barbell path.",
        "Functional training principles",
        "replace",
        None,
    ),
    (
        "Leg Extension",
        "Barbell Squat",
        "powerlifting",
        "Leg extensions isolate the quadriceps but are an open-chain exercise with less functional carryover. Squats are a compound, closed-chain exercise engaging multiple leg muscles and improving overall lower body strength and coordination.",
        "Compound vs Isolation exercise benefits",
        "replace",
        None,
    ),
    ( # Example: Adding an exercise
        "Barbell Bench Press", # Trigger exercise (just needs *any* exercise from the routine)
        "Face Pull",
        "powerlifting",
        "Adding Face Pulls (2-3 sets, 12-15 reps) to routines heavy on pressing movements helps balance shoulder development by strengthening rear deltoids and external rotators, reducing injury risk.",
        "Shoulder health protocols",
        "add", # Action type is 'add'
        "Add 2-3 sets of 12-15 reps, typically towards the end of your workout.", # Details for 'add' or 'modify'
    ),
    (
        "Crunch",
        "Plank",
        "hypertrophy",
        "Crunches involve repeated spinal flexion which may not be ideal long-term. Planks build core stability isometrically, which has better carryover to athletic movements and maintaining posture.",
        "Core training research (e.g., Stuart McGill)",
        "replace",
        None
    )
]