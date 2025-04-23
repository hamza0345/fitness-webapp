"use client"
import { useState, useEffect } from "react"
// 1️⃣ remove: import { mockExercises } from "@/lib/mock-data"
import { fetchExercises } from "@/lib/api"

export default function RoutinesPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  // fetch once
  useEffect(() => {
    fetchExercises()
      .then((data) => setExercises(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading…</p>

  return (
    <ul>
      {exercises.map((ex) => (
        <li key={ex.id}>{ex.name} — {ex.target_muscle}</li>
      ))}
    </ul>
  )
}
