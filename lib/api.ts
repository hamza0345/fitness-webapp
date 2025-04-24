export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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

/* ----------  ROUTINES ---------- */

export async function createRoutine(name: string, description: string) {
  const token = localStorage.getItem("access");
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
