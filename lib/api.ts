// lib/api.ts
/* ------------------------------------------------------------------ */
/* lib/api.ts (Final Polished Version)                               */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/* ------------------------------------------------------------------ */
/* 🔸 Small helpers                                                    */
/* ------------------------------------------------------------------ */

export function getToken() {
  // Ensure this code only runs on the client-side
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("access");
}

export function getUserEmail(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? null; // Django SimpleJWT uses 'username' field by default even if it's email
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* 🔸 AUTH                                                            */
/* ------------------------------------------------------------------ */

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login/`, { // Assuming you use rest_framework_simplejwt default endpoint
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }), // Adjust if your login uses 'email' field
  });

  if (!res.ok) throw new Error("Invalid credentials");

  const data = await res.json();
  // Ensure this code only runs on the client-side
  if (typeof window !== "undefined") {
    localStorage.setItem("access", data.access);
    // Optionally store refresh token if you use it
    // localStorage.setItem("refresh", data.refresh);
  }
  return data;
}


export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let msg = "Registration failed";
    try {
        // Try to parse specific error messages from Django validation
        const errorData = await res.json();
        if (errorData.email) msg = `Email: ${errorData.email[0]}`;
        else if (errorData.password) msg = `Password: ${errorData.password[0]}`;
        else if (errorData.detail) msg = errorData.detail;
        else msg = JSON.stringify(errorData); // Fallback
    } catch (e) {
        // If parsing fails, use the status text
        msg = res.statusText || "Registration failed due to server error.";
    }
    throw new Error(msg);
  }
  return res.json();
}

export function logout() {
  // Ensure this code only runs on the client-side
  if (typeof window !== "undefined") {
    localStorage.removeItem("access");
    // localStorage.removeItem("refresh"); // Also remove refresh token if used
  }
}

/* ------------------------------------------------------------------ */
/* 🔸 TYPES                                                            */
/* ------------------------------------------------------------------ */

// Exercise within a Routine definition
export interface RoutineExercise {
  id?: number;
  name: string; // Could be predefined or custom
  sets: number;
  reps: number;
  weight: number; // Keep weight here for routine *template*
  order?: number;
}

// Routine definition including its exercises
export interface RoutineWithEx {
  id?: number;
  user?: { id: number; username: string }; // User info from backend
  name: string;
  description: string;
  created_at?: string;
  exercises: RoutineExercise[];
  // Add fields used by Improve page if needed, like primaryFocus, fitnessLevel
  // These might need to be added to the backend model/serializer or derived on frontend
  primaryFocus?: string; // Example: 'Hypertrophy', 'Strength' - Where does this come from? Needs clarification. For now, assume it's part of description or name perhaps?
  fitnessLevel?: string; // Example: 'Beginner', 'Intermediate' - Needs clarification.
}

// Actual set performed in a workout session
export interface WorkoutSet {
  id?: number;
  weight: number | string; // Allow weight to be either number or string
  reps: number;
  set_number: number;
  completed?: boolean; // Add completed flag for tracking set completion
}

// Actual exercise performed in a workout session
export interface WorkoutExercise {
  id?: number;
  name: string; // Could be predefined or custom
  order?: number;
  sets: WorkoutSet[];
}

// A logged workout session
export interface WorkoutSession {
  id?: number;
  routine?: number; // ID of the routine it was based on (optional)
  user?: { id: number; username: string }; // User info from backend
  name: string; // Name of the session (e.g., "Push Day" or Routine Name)
  date?: string; // ISO date string
  exercises: WorkoutExercise[];
}

// A logged nutrition entry
export interface NutritionEntry {
  id?: number;
  user?: { id: number; username: string }; // User info from backend
  date: string; // Should be 'YYYY-MM-DD' format for DateField
  calories: number;
  protein: number;
  notes?: string;
}

// Predefined exercise structure from backend
export interface PredefinedExercise {
    id: number;
    name: string;
    muscle_group: string;
    type: string;
    equipment: string;
}

// Structure for improvement suggestions received from backend
export interface ImprovementSuggestion {
    id: number; // ImprovementRule ID
    title: string;
    description: string;
    action_type: 'replace' | 'add' | 'modify_technique';
    trigger_exercise_name: string;
    // Fields matching the mock data structure for easier display mapping
    replacesExercise: string | null; // Original exercise name for 'replace'
    newExercise: string | null; // Suggested exercise name for 'replace'
    addExercise: string | null; // Suggested exercise name for 'add'
    modifyTechnique: string | null; // Details for 'modify' or reason fallback
    scientificExplanation: string; // The reason field from backend
    researchSource: string | null; // The source field from backend
    applicableFor: string[]; // List containing the preference_focus
    sets: string | null; // Sets for 'add' action
    reps: string | null; // Reps for 'add' action
}


/* ------------------------------------------------------------------ */
/* 🔸 ROUTINES (full version with exercises)                          */
/* ------------------------------------------------------------------ */

export async function getRoutines(): Promise<RoutineWithEx[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/routines/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch routines");
  // Add mock focus/level for now until backend provides it
  const routines: RoutineWithEx[] = await res.json();
  return routines.map(r => ({
      ...r,
      primaryFocus: r.name.toLowerCase().includes("strength") ? "Strength" : r.name.toLowerCase().includes("hypertrophy") ? "Hypertrophy" : "General Fitness",
      fitnessLevel: r.exercises.length > 6 ? "Intermediate" : "Beginner" // Very basic heuristic
  }));
}

export async function createRoutineFull(routine: Omit<RoutineWithEx, 'id' | 'user' | 'created_at'>): Promise<RoutineWithEx> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");

    // Ensure exercises have weight, default if missing (adjust default as needed)
    const processedRoutine = {
        ...routine,
        exercises: routine.exercises.map(ex => ({
            ...ex,
            weight: ex.weight ?? 0, // Default weight to 0 if not provided
        })),
    };


    const res = await fetch(`${API_URL}/routines/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(processedRoutine),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Could not create routine" }));
        console.error("Create routine error:", errorData);
        throw new Error(errorData.detail || JSON.stringify(errorData) || "Could not create routine");
    }
    return res.json();
}


export async function updateRoutineFull(id: number, routine: Omit<RoutineWithEx, 'id' | 'user' | 'created_at'>): Promise<RoutineWithEx> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");

     // Ensure exercises have weight, default if missing (adjust default as needed)
    const processedRoutine = {
        ...routine,
        exercises: routine.exercises.map(ex => ({
            ...ex,
            weight: ex.weight ?? 0, // Default weight to 0 if not provided
        })),
    };

    const res = await fetch(`${API_URL}/routines/${id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(processedRoutine), // Send only fields allowed by serializer
    });

    if (!res.ok) {
         const errorData = await res.json().catch(() => ({ detail: "Could not update routine" }));
         console.error("Update routine error:", errorData);
         throw new Error(errorData.detail || JSON.stringify(errorData) || "Could not update routine");
    }
    return res.json();
}

export async function deleteRoutine(id: number): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/routines/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204) { // 204 No Content is success for DELETE
      throw new Error("Could not delete routine");
  }
  // No return needed for successful delete
}


/* ------------------------------------------------------------------ */
/* 🔸 WORKOUT SESSIONS                                                */
/* ------------------------------------------------------------------ */

export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/workouts/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch workout sessions");
  return res.json();
}

export async function getWorkoutSession(id: number): Promise<WorkoutSession> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/workouts/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch workout session");
  return res.json();
}

// Type for creating a session - exercises might not have IDs yet
export type CreateWorkoutSessionData = Omit<WorkoutSession, 'id' | 'user' | 'date' | 'exercises'> & {
    exercises: Array<Omit<WorkoutExercise, 'id' | 'sets'> & {
        sets: Array<Omit<WorkoutSet, 'id'>>;
    }>;
};


export async function createWorkoutSession(session: CreateWorkoutSessionData): Promise<WorkoutSession> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Process the workout data to avoid sending duplicate parameters to the backend
  const processedSession = {
    ...session,
    exercises: session.exercises.map((ex, exIndex) => {
      // Make a clean copy of the exercise
      const { name, order, ...rest } = ex;  
      return {
        // Include these fields explicitly to avoid duplicates
        name,
        order: order ?? exIndex,
        // Process sets to ensure set_number is present & weight is formatted correctly
        sets: ex.sets.map((set, setIndex) => {
          const { set_number, ...restSet } = set;
          return {
            ...restSet,
            weight: parseFloat(set.weight.toString()).toFixed(2), // Convert to string with 2 decimal places
            set_number: set_number ?? setIndex + 1, // Add set_number if missing
          };
        }),
      };
    }),
  };

  const res = await fetch(`${API_URL}/workouts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(processedSession),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Could not create workout session" }));
    console.error("Create workout error:", errorData);

    // Provide more specific error messages if possible
    let errorMessage = "Could not create workout session.";
    if (typeof errorData === 'object' && errorData !== null) {
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.exercises) {
        errorMessage = `Error in exercises: ${JSON.stringify(errorData.exercises)}`;
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    }
    throw new Error(errorMessage);
  }
  return res.json();
}


export async function deleteWorkoutSession(id: number): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/workouts/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204) {
      throw new Error("Could not delete workout session");
  }
}

export async function updateWorkoutSession(id: number, workout: Partial<WorkoutSession>): Promise<WorkoutSession> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");

  // Process workout data to ensure weight values are properly formatted
  let processedWorkout = { ...workout };
  
  // If workout has exercises, format their weight values
  if (processedWorkout.exercises) {
    processedWorkout = {
      ...processedWorkout,
      exercises: processedWorkout.exercises.map(ex => ({
        ...ex,
        sets: ex.sets?.map(set => ({
          ...set,
          weight: typeof set.weight === 'number' ? parseFloat(set.weight.toString()).toFixed(2) : set.weight,
        })) || []
      }))
    };
  }

  const res = await fetch(`${API_URL}/workouts/${id}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(processedWorkout),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Could not update workout session" }));
    console.error("Update workout error:", errorData);
    throw new Error(errorData.detail || JSON.stringify(errorData) || "Could not update workout session");
  }
  return res.json();
}

// Function to add bicep curl reps to an existing workout session
export async function addBicepCurlRepsToWorkout(workoutId: number, reps: number): Promise<WorkoutSession> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  
  // First get the current workout
  const workout = await getWorkoutSession(workoutId);
  
  // Check if the workout has a "Bicep Curl" exercise
  let bicepExercise = workout.exercises.find(ex => 
    ex.name.toLowerCase().includes("bicep curl") || 
    ex.name.toLowerCase().includes("bicep") || 
    ex.name.toLowerCase().includes("curl")
  );
  
  // If no bicep exercise exists, add one
  if (!bicepExercise) {
    workout.exercises.push({
      name: "Bicep Curl",
      order: workout.exercises.length,
      sets: [{
        weight: "0.00", // Use string format with 2 decimal places
        reps: reps,
        set_number: 1
      }]
    });
  } else {
    // Add the reps to the last set of the bicep exercise
    const lastSet = bicepExercise.sets[bicepExercise.sets.length - 1];
    if (lastSet) {
      lastSet.reps += reps;
    } else {
      bicepExercise.sets.push({
        weight: "0.00", // Use string format with 2 decimal places
        reps: reps,
        set_number: 1
      });
    }
  }
  
  // Update the workout
  return updateWorkoutSession(workoutId, workout);
}

/* ------------------------------------------------------------------ */
/* 🔸 NUTRITION TRACKING                                              */
/* ------------------------------------------------------------------ */

export async function getNutritionEntries(): Promise<NutritionEntry[]> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/nutrition/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch nutrition entries");
  return res.json();
}

export async function getNutritionEntry(id: number): Promise<NutritionEntry> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/nutrition/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch nutrition entry");
  return res.json();
}

export async function createNutritionEntry(entry: Omit<NutritionEntry, 'id' | 'user'>): Promise<NutritionEntry> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");

    // Validate date format (YYYY-MM-DD) before sending
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        throw new Error("Invalid date format. Please use YYYY-MM-DD.");
    }

    const res = await fetch(`${API_URL}/nutrition/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
    });

    if (!res.ok) {
         const errorData = await res.json().catch(() => ({ detail: "Could not create nutrition entry" }));
          console.error("Create nutrition error:", errorData);
         // Check for unique constraint error
         if (res.status === 400 && typeof errorData === 'object' && errorData !== null && errorData.detail?.includes('unique constraint')) {
             throw new Error("An entry for this date already exists.");
         }
         throw new Error(errorData.detail || JSON.stringify(errorData) ||"Could not create nutrition entry");
    }
    return res.json();
}


export async function updateNutritionEntry(id: number, entry: Omit<NutritionEntry, 'id' | 'user'>): Promise<NutritionEntry> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");

    // Validate date format (YYYY-MM-DD) before sending
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
        throw new Error("Invalid date format. Please use YYYY-MM-DD.");
    }

    const res = await fetch(`${API_URL}/nutrition/${id}/`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
    });

     if (!res.ok) {
         const errorData = await res.json().catch(() => ({ detail: "Could not update nutrition entry" }));
          console.error("Update nutrition error:", errorData);
         throw new Error(errorData.detail || JSON.stringify(errorData) || "Could not update nutrition entry");
    }
    return res.json();
}

export async function deleteNutritionEntry(id: number): Promise<void> {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  const res = await fetch(`${API_URL}/nutrition/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok && res.status !== 204) {
      throw new Error("Could not delete nutrition entry");
  }
}


/* ------------------------------------------------------------------ */
/* 🔸 IMPROVEMENT FEATURE API                                         */
/* ------------------------------------------------------------------ */

/**
 * Fetches the list of predefined exercises from the backend.
 */
export async function getPredefinedExercises(): Promise<PredefinedExercise[]> {
    const token = getToken();
    // Allow fetching even if not logged in, depending on backend permissions
    // if (!token) throw new Error("Not authenticated");
    const res = await fetch(`${API_URL}/exercises/predefined/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}, // Send token if available
    });

    if (!res.ok) {
        console.error("Failed to fetch predefined exercises, Status:", res.status);
        throw new Error("Failed to fetch predefined exercises");
    }
    return res.json();
}


/**
 * Analyzes a given routine based on user preferences.
 * @param routineId The ID of the routine to analyze.
 * @param preferences An object containing user preferences, e.g., { focus: 'hypertrophy' }.
 */
export async function analyzeRoutine(routineId: number, preferences: { focus: string }): Promise<ImprovementSuggestion[]> {
    const token = getToken();
    if (!token) throw new Error("Not authenticated");
    
    console.log(`Analyzing routine ${routineId} with focus: ${preferences.focus}`);

    try {
        const res = await fetch(`${API_URL}/routines/${routineId}/analyze/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ preferences }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ detail: "Failed to analyze routine" }));
            console.error("Analyze routine error:", errorData);
            throw new Error(errorData.detail || JSON.stringify(errorData) || "Failed to analyze routine");
        }
        
        const data = await res.json();
        console.log(`Analysis complete. Found ${data.length} improvement suggestions.`);
        return data;
    } catch (error) {
        console.error("Error in analyzeRoutine:", error);
        throw error;
    }
}



/* ------------------------------------------------------------------ */
/* 🔸 (Legacy helpers, optional: only if old pages use them)         */
/* ------------------------------------------------------------------ */

// Note: These simplified versions might cause issues if exercises are expected.
// It's better to use createRoutineFull/updateRoutineFull directly.
// export async function createRoutine(name: string, description: string) {
//   return createRoutineFull({ name, description, exercises: [] });
// }

// export async function updateRoutine(id: number, name: string, description: string) {
//   // Fetch existing exercises first if you need to preserve them?
//   // This simplified update will WIPE existing exercises. Be careful.
//   console.warn("Using simplified updateRoutine - this will remove existing exercises unless handled properly.");
//   return updateRoutineFull(id, { name, description, exercises: [] });
// }