// frontend/lib/api.ts
export async function fetchExercises() {
    const res = await fetch("http://localhost:8000/exercises");
    if (!res.ok) throw new Error("Backend returned " + res.status);
    return res.json();          // → [{ id, name, target_muscle, … }]
  }
  