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
/*  🔸 (Legacy helpers, optional: only if old pages use them)           */
/* ------------------------------------------------------------------ */

export async function createRoutine(name: string, description: string) {
  return createRoutineFull({ name, description, exercises: [] });
}

export async function updateRoutine(id: number, name: string, description: string) {
  return updateRoutineFull(id, { name, description, exercises: [] });
}