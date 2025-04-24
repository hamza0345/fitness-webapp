// Mock data for the fitness app

// Mock workout routines
export const mockRoutines = [
  {
    id: 1,
    name: "Upper Body Power",
    description: "Focus on building strength in your upper body with compound movements",
    primaryFocus: "strength",
    fitnessLevel: "intermediate",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 6 },
      { name: "Barbell Row", sets: 4, reps: 6 },
      { name: "Overhead Press", sets: 3, reps: 8 },
      { name: "Pull-ups", sets: 3, reps: 8 },
      { name: "Tricep Extensions", sets: 3, reps: 10 },
      { name: "Bicep Curls", sets: 3, reps: 10 },
    ],
  },
  {
    id: 2,
    name: "Lower Body Hypertrophy",
    description: "Build muscle mass in your legs with higher volume training",
    primaryFocus: "hypertrophy",
    fitnessLevel: "intermediate",
    exercises: [
      { name: "Squats", sets: 4, reps: 10 },
      { name: "Romanian Deadlifts", sets: 3, reps: 12 },
      { name: "Leg Press", sets: 3, reps: 15 },
      { name: "Leg Extensions", sets: 3, reps: 15 },
      { name: "Leg Curls", sets: 3, reps: 15 },
      { name: "Calf Raises", sets: 4, reps: 20 },
    ],
  },
  {
    id: 3,
    name: "Full Body Beginner",
    description: "A complete full body workout for beginners to build a foundation",
    primaryFocus: "strength",
    fitnessLevel: "beginner",
    exercises: [
      { name: "Goblet Squats", sets: 3, reps: 10 },
      { name: "Push-ups", sets: 3, reps: 10 },
      { name: "Dumbbell Rows", sets: 3, reps: 10 },
      { name: "Lunges", sets: 2, reps: 10 },
      { name: "Plank", sets: 3, reps: "30 sec" },
    ],
  },
]

// Mock exercise improvements data
export const mockExerciseImprovements = [
  {
    id: 1,
    title: "Replace Bicep Curls with Incline Curls",
    description: "Optimize bicep development with a more effective variation",
    replacesExercise: "Bicep Curls",
    newExercise: "Incline Dumbbell Curls",
    sets: 3,
    reps: "10-12",
    applicableFor: ["strength", "hypertrophy", "intermediate"],
    scientificExplanation:
      "Incline dumbbell curls place the biceps under greater tension throughout the full range of motion. EMG studies show 23% greater activation of the long head of the biceps compared to standard curls, leading to more complete muscle development.",
    researchSource:
      "Journal of Strength and Conditioning Research (2019): 'Electromyographic Analysis of Biceps Brachii Activation During Various Curl Exercises'",
  },
  {
    id: 2,
    title: "Add Face Pulls for Shoulder Health",
    description: "Improve shoulder stability and prevent imbalances",
    addExercise: "Face Pulls",
    sets: 3,
    reps: "12-15",
    applicableFor: ["strength", "intermediate", "beginner"],
    scientificExplanation:
      "Face pulls target the often-neglected posterior deltoids and external rotators. Research shows that balanced development of these muscles reduces shoulder injury risk by up to 31% and improves posture. This is especially important for routines with pressing movements like bench press and overhead press.",
    researchSource:
      "Sports Medicine Journal (2021): 'Posterior Shoulder Strengthening and Injury Prevention in Resistance Training'",
  },
  {
    id: 3,
    title: "Replace Leg Extensions with Bulgarian Split Squats",
    description: "More functional lower body exercise with greater muscle activation",
    replacesExercise: "Leg Extensions",
    newExercise: "Bulgarian Split Squats",
    sets: 3,
    reps: "10-12 per leg",
    applicableFor: ["hypertrophy", "intermediate"],
    scientificExplanation:
      "Bulgarian split squats activate 34% more muscle fibers in the quadriceps compared to leg extensions, while also engaging the glutes and hamstrings. This unilateral exercise also addresses muscle imbalances between legs and improves functional strength and stability.",
    researchSource:
      "European Journal of Applied Physiology (2020): 'Muscle Activation Patterns in Unilateral vs. Bilateral Lower Body Exercises'",
  },
  {
    id: 4,
    title: "Modify Bench Press Technique",
    description: "Optimize grip width for better chest activation and shoulder safety",
    modifyTechnique: "Bench Press Grip Width",
    applicableFor: ["strength", "intermediate", "beginner"],
    scientificExplanation:
      "Research indicates that a grip width of 1.5x shoulder width maximizes chest muscle activation while minimizing shoulder strain. This moderate grip width led to 18% greater pectoralis major activation compared to very wide grips, while reducing anterior shoulder stress by 24%.",
    researchSource:
      "Journal of Sports Science and Medicine (2022): 'Effects of Grip Width on Muscle Activation and Joint Stress During the Bench Press'",
  },
  {
    id: 5,
    title: "Add Tempo Training to Romanian Deadlifts",
    description: "Enhance muscle growth with controlled eccentric phase",
    modifyTechnique: "Romanian Deadlift Tempo",
    applicableFor: ["hypertrophy", "intermediate"],
    scientificExplanation:
      "Implementing a 3-second eccentric (lowering) phase to Romanian deadlifts increases time under tension, a key factor for hypertrophy. Studies show this modification increases hamstring and glute hypertrophy by 27% compared to standard tempo, due to greater mechanical tension and metabolic stress.",
    researchSource:
      "International Journal of Sports Physiology and Performance (2021): 'Time Under Tension and Muscle Hypertrophy: A Meta-Analysis'",
  },
]

// Mock exercises database
export const mockExercises = [
  { id: "bench-press", name: "Bench Press", muscleGroup: "chest", equipment: "barbell" },
  { id: "squat", name: "Squat", muscleGroup: "legs", equipment: "barbell" },
  { id: "deadlift", name: "Deadlift", muscleGroup: "back", equipment: "barbell" },
  { id: "overhead-press", name: "Overhead Press", muscleGroup: "shoulders", equipment: "barbell" },
  { id: "pull-up", name: "Pull-up", muscleGroup: "back", equipment: "bodyweight" },
  { id: "push-up", name: "Push-up", muscleGroup: "chest", equipment: "bodyweight" },
  { id: "barbell-row", name: "Barbell Row", muscleGroup: "back", equipment: "barbell" },
  { id: "leg-press", name: "Leg Press", muscleGroup: "legs", equipment: "machine" },
  { id: "bicep-curl", name: "Bicep Curl", muscleGroup: "arms", equipment: "dumbbell" },
  { id: "tricep-extension", name: "Tricep Extension", muscleGroup: "arms", equipment: "cable" },
  { id: "lateral-raise", name: "Lateral Raise", muscleGroup: "shoulders", equipment: "dumbbell" },
  { id: "leg-curl", name: "Leg Curl", muscleGroup: "legs", equipment: "machine" },
  { id: "leg-extension", name: "Leg Extension", muscleGroup: "legs", equipment: "machine" },
  { id: "calf-raise", name: "Calf Raise", muscleGroup: "legs", equipment: "machine" },
  { id: "plank", name: "Plank", muscleGroup: "core", equipment: "bodyweight" },
]

// Mock recommendations
export const mockRecommendations = [
  {
    title: "Add Progressive Overload",
    description: "Gradually increase the weight or reps to continue making strength gains.",
    targetMuscleGroup: "strength",
    fitnessLevel: "intermediate",
    suggestedExercises: ["Increase bench press by 5lbs", "Add an extra set to pull-ups"],
    researchInsight:
      "A 2019 study in the Journal of Strength and Conditioning Research found that progressive overload led to 32% greater strength gains compared to static training protocols over an 8-week period.",
  },
  {
    title: "Improve Recovery Time",
    description: "Reduce rest between sets to 60-90 seconds to increase workout intensity.",
    targetMuscleGroup: "hypertrophy",
    fitnessLevel: "intermediate",
    suggestedExercises: ["Superset bicep curls with tricep extensions", "Circuit training for accessories"],
    researchInsight:
      "Research published in the European Journal of Applied Physiology (2020) demonstrated that shorter rest periods (60-90s) increased metabolic stress and growth hormone production, leading to enhanced muscle hypertrophy.",
  },
  {
    title: "Add Compound Movements",
    description: "Include more compound exercises to engage multiple muscle groups.",
    targetMuscleGroup: "strength",
    fitnessLevel: "beginner",
    suggestedExercises: ["Barbell Rows", "Deadlifts", "Overhead Press"],
    researchInsight:
      "A meta-analysis in Sports Medicine (2021) found that beginners who focused on compound movements saw 27% better overall strength development compared to those using primarily isolation exercises.",
  },
  {
    title: "Balance Your Routine",
    description: "Ensure you're working all opposing muscle groups equally to prevent imbalances.",
    targetMuscleGroup: "hypertrophy",
    fitnessLevel: "beginner",
    suggestedExercises: ["Add face pulls for rear delts", "Include hamstring curls to balance quad work"],
    researchInsight:
      "A longitudinal study in the Journal of Sports Medicine and Physical Fitness (2018) showed that balanced training protocols reduced injury risk by 41% and improved overall functional strength compared to unbalanced programs.",
  },
]

// Mock workout history
export const mockWorkoutHistory = [
  {
    routineId: 1,
    routineName: "Upper Body Power",
    date: "2023-04-15T10:30:00",
    exercises: [
      {
        name: "Bench Press",
        sets: [
          { weight: "135", reps: "8", completed: true },
          { weight: "155", reps: "6", completed: true },
          { weight: "175", reps: "5", completed: true },
          { weight: "175", reps: "4", completed: true },
        ],
      },
      {
        name: "Barbell Row",
        sets: [
          { weight: "135", reps: "8", completed: true },
          { weight: "155", reps: "6", completed: true },
          { weight: "155", reps: "6", completed: true },
          { weight: "155", reps: "5", completed: true },
        ],
      },
      {
        name: "Overhead Press",
        sets: [
          { weight: "95", reps: "8", completed: true },
          { weight: "105", reps: "6", completed: true },
          { weight: "105", reps: "5", completed: true },
        ],
      },
    ],
  },
  {
    routineId: 2,
    routineName: "Lower Body Hypertrophy",
    date: "2023-04-13T11:00:00",
    exercises: [
      {
        name: "Squats",
        sets: [
          { weight: "185", reps: "10", completed: true },
          { weight: "205", reps: "8", completed: true },
          { weight: "225", reps: "6", completed: true },
          { weight: "225", reps: "6", completed: true },
        ],
      },
      {
        name: "Romanian Deadlifts",
        sets: [
          { weight: "135", reps: "12", completed: true },
          { weight: "155", reps: "10", completed: true },
          { weight: "175", reps: "8", completed: true },
        ],
      },
    ],
  },
]

// Mock posture analysis data
export const mockPostureAnalysis = {
  markers: [
    { position: { x: 50, y: 20 } },
    { position: { x: 55, y: 40 } },
    { position: { x: 45, y: 60 } },
    { position: { x: 50, y: 80 } },
  ],
  issues: [
    {
      title: "Forward Head Posture",
      description: "Your head is positioned too far forward, which can lead to neck strain and upper back pain.",
    },
    {
      title: "Rounded Shoulders",
      description: "Your shoulders are rolling forward, which can cause shoulder pain and impingement.",
    },
    {
      title: "Anterior Pelvic Tilt",
      description: "Your pelvis is tilted forward, which can lead to lower back pain and hip issues.",
    },
  ],
  recommendations: [
    {
      name: "Chin Tucks",
      description: "Helps correct forward head posture by strengthening the deep neck flexors.",
      researchEvidence:
        "A 2020 study in the Journal of Physical Therapy Science found that regular chin tuck exercises reduced forward head posture by an average of 22% after 6 weeks of consistent practice.",
    },
    {
      name: "Wall Angels",
      description: "Helps improve shoulder position and thoracic mobility.",
      researchEvidence:
        "Research published in the International Journal of Sports Physical Therapy (2019) demonstrated that wall angel exercises significantly improved scapular positioning and reduced rounded shoulder posture in 87% of participants.",
    },
    {
      name: "Glute Bridges",
      description: "Strengthens glutes and helps correct anterior pelvic tilt.",
      researchEvidence:
        "A clinical trial in the Journal of Orthopaedic & Sports Physical Therapy (2021) showed that targeted glute strengthening reduced anterior pelvic tilt by 18% and decreased associated lower back pain by 32%.",
    },
    {
      name: "Plank",
      description: "Strengthens core muscles to support proper posture.",
      researchEvidence:
        "A comprehensive study in the Journal of Strength and Conditioning Research (2018) found that regular plank exercises improved core stability by 31% and led to measurable improvements in overall posture and spinal alignment.",
    },
  ],
}

// Mock physique recommendations
export const mockPhysiqueRecommendations = {
  bodyType: "Ectomorph",
  bodyTypeDescription:
    "You have a naturally lean build with difficulty gaining weight and muscle. Focus on compound movements and higher caloric intake.",
  focusAreas: [
    {
      name: "Upper Chest",
      description: "Needs development to balance your physique",
    },
    {
      name: "Shoulders",
      description: "Wider shoulders will improve your V-taper",
    },
    {
      name: "Legs",
      description: "Focus on overall leg development for a balanced physique",
    },
    {
      name: "Core",
      description: "Strengthen core for better overall performance",
    },
  ],
  workoutPlan: [
    {
      name: "Day 1: Chest and Shoulders",
      exercises: [
        { name: "Incline Bench Press", sets: 4, reps: "6-8" },
        { name: "Flat Dumbbell Press", sets: 3, reps: "8-10" },
        { name: "Overhead Press", sets: 4, reps: "6-8" },
        { name: "Lateral Raises", sets: 3, reps: "10-12" },
      ],
      researchBasis:
        "A 2022 study in the Journal of Sports Science found that incline pressing movements activate 24% more upper chest fibers than flat pressing, which is particularly beneficial for ectomorphs seeking to develop chest width and fullness.",
    },
    {
      name: "Day 2: Back and Biceps",
      exercises: [
        { name: "Deadlifts", sets: 4, reps: "5-6" },
        { name: "Pull-ups", sets: 3, reps: "8-10" },
        { name: "Barbell Rows", sets: 3, reps: "8-10" },
        { name: "Bicep Curls", sets: 3, reps: "10-12" },
      ],
      researchBasis:
        "Research published in the European Journal of Applied Physiology (2021) demonstrated that compound pulling movements like deadlifts and pull-ups produced 37% greater hormonal response in ectomorphic body types compared to isolation exercises.",
    },
    {
      name: "Day 3: Legs",
      exercises: [
        { name: "Squats", sets: 4, reps: "6-8" },
        { name: "Romanian Deadlifts", sets: 3, reps: "8-10" },
        { name: "Leg Press", sets: 3, reps: "10-12" },
        { name: "Calf Raises", sets: 4, reps: "15-20" },
      ],
      researchBasis:
        "A comparative study in the International Journal of Exercise Science (2020) found that ectomorphs who trained legs with this specific rep range and exercise selection gained 18% more muscle mass than those following traditional high-rep protocols.",
    },
  ],
}
