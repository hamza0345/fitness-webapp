/* ------------------------------------------------------------------ */
/*  lib/api.ts (Final Polished Version)                              */
/* ------------------------------------------------------------------ */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/* ------------------------------------------------------------------ */
/*  🔸 Small helpers                                                   */
/* ------------------------------------------------------------------ */

export function getToken() {
  return localStorage.getItem("access");
}

export function getUserEmail(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.username ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  🔸 AUTH                                                            */
/* ------------------------------------------------------------------ */

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });

  if (!res.ok) throw new Error("Invalid credentials");

  const data = await res.json();
  localStorage.setItem("access", data.access);
  return data;
}

export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const msg = (await res.json()).detail ?? "Registration failed";
    throw new Error(msg);
  }
  return res.json();
}

export function logout() {
  localStorage.removeItem("access");
}

/* ------------------------------------------------------------------ */
/*  🔸 TYPES                                                          */
/* ------------------------------------------------------------------ */

export interface Exercise {
  id?: number;
  name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface RoutineWithEx {
  id?: number;
  name: string;
  description: string;
  created_at?: string;
  exercises: Exercise[];
}

export interface WorkoutSet {
  id?: number;
  weight: number;
  reps: number;
  set_number: number;
}

export interface WorkoutExercise {
  id?: number;
  name: string;
  order?: number;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id?: number;
  routine?: number;
  name: string;
  date?: string;
  exercises: WorkoutExercise[];
}

export interface NutritionEntry {
  id?: number;
  date: string;
  calories: number;
  protein: number;
  notes?: string;
}

/* ------------------------------------------------------------------ */
/*  🔸 ROUTINES (full version with exercises)                          */
/* ------------------------------------------------------------------ */

export async function getRoutines(): Promise<RoutineWithEx[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch routines");
  return res.json();
}

export async function createRoutineFull(routine: RoutineWithEx) {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(routine),
  });

  if (!res.ok) throw new Error("Could not create routine");
  return res.json();
}

export async function updateRoutineFull(id: number, routine: RoutineWithEx) {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(routine),
  });

  if (!res.ok) throw new Error("Could not update routine");
  return res.json();
}

export async function deleteRoutine(id: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Could not delete routine");
}

/* ------------------------------------------------------------------ */
/*  🔸 WORKOUT SESSIONS                                               */
/* ------------------------------------------------------------------ */

export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/workouts/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch workout sessions");
  return res.json();
}

export async function getWorkoutSession(id: number): Promise<WorkoutSession> {
  const token = getToken();
  const res = await fetch(`${API_URL}/workouts/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch workout session");
  return res.json();
}

export async function createWorkoutSession(session: WorkoutSession) {
  const token = getToken();
  const res = await fetch(`${API_URL}/workouts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(session),
  });

  if (!res.ok) throw new Error("Could not create workout session");
  return res.json();
}

export async function deleteWorkoutSession(id: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/workouts/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Could not delete workout session");
}

/* ------------------------------------------------------------------ */
/*  🔸 NUTRITION TRACKING                                             */
/* ------------------------------------------------------------------ */

export async function getNutritionEntries(): Promise<NutritionEntry[]> {
  const token = getToken();
  const res = await fetch(`${API_URL}/nutrition/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch nutrition entries");
  return res.json();
}

export async function getNutritionEntry(id: number): Promise<NutritionEntry> {
  const token = getToken();
  const res = await fetch(`${API_URL}/nutrition/${id}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch nutrition entry");
  return res.json();
}

export async function createNutritionEntry(entry: NutritionEntry) {
  const token = getToken();
  const res = await fetch(`${API_URL}/nutrition/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });

  if (!res.ok) throw new Error("Could not create nutrition entry");
  return res.json();
}

export async function updateNutritionEntry(id: number, entry: NutritionEntry) {
  const token = getToken();
  const res = await fetch(`${API_URL}/nutrition/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(entry),
  });

  if (!res.ok) throw new Error("Could not update nutrition entry");
  return res.json();
}

export async function deleteNutritionEntry(id: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/nutrition/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Could not delete nutrition entry");
}

/* ------------------------------------------------------------------ */
/*  🔸 (Legacy helpers, optional: only if old pages use them)           */
/* ------------------------------------------------------------------ */

export async function createRoutine(name: string, description: string) {
  return createRoutineFull({ name, description, exercises: [] });
}

export async function updateRoutine(id: number, name: string, description: string) {
  return updateRoutineFull(id, { name, description, exercises: [] });
}