const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

/* ----------  small helpers ---------- */

export function getToken() {
  return localStorage.getItem("access");
}

/** very tiny jwt-decoder (no lib needed) */
export function getUserEmail(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // DRF puts the username in "username"
    return payload.username ?? null;
  } catch {
    return null;
  }
}

/* ----------  AUTH ---------- */

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  const data = await res.json(); // { access, refresh }
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

/* ----------  ROUTINES ---------- */

export async function getRoutines() {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch routines");
  return res.json();
}

export async function createRoutine(name: string, description: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error("Could not save routine");
  return res.json();
}

export async function updateRoutine(
  id: number,
  name: string,
  description: string
) {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/${id}/`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function deleteRoutine(id: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/routines/${id}/`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Delete failed");
}
