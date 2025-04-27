"use client";
import useAuthGuard from "@/hooks/useAuthGuard";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getRoutines,
  deleteRoutine,
  createRoutineFull,
  updateRoutineFull,
  RoutineWithEx,
  Exercise,
} from "@/lib/api";

/* ---------- helpers ---------- */

const emptyExercise = (): Exercise => ({
  name: "",
  sets: "",      // let the user start empty
  reps: "",
  weight: "",
} as unknown as Exercise);  // we keep the Exercise type but allow ""

const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

/* ---------- component ---------- */

export default function RoutinesPage() {
  
  const [routines, setRoutines]     = useState<RoutineWithEx[]>([]);
  const [draft, setDraft]           = useState<RoutineWithEx>({
    name: "",
    description: "",
    exercises: [emptyExercise()],
  });
  const [editing, setEditing]       = useState<number | null>(null);
  const [error,   setError]         = useState("");

  /* fetch once ---------------------------------------------------- */
  useEffect(() => {
    getRoutines().then(setRoutines).catch((e) => setError(e.message));
  }, []);

  /* field-level handlers ------------------------------------------ */
  const handleAddExercise = () =>
    setDraft({ ...draft, exercises: [...draft.exercises, emptyExercise()] });

  const handleChangeEx = (idx: number, field: keyof Exercise, value: string) => {
    const ex = [...draft.exercises];
    // store raw string so the box can be emptied
    (ex[idx] as any)[field] = value;
    setDraft({ ...draft, exercises: ex });
  };

  /* save ---------------------------------------------------------- */
  const handleSave = async () => {
    if (!draft.name.trim()) return;

    // convert numeric strings to numbers just before hitting the API
    const prep = deepCopy(draft);
    prep.exercises = prep.exercises.map((e: any) => ({
      ...e,
      sets:  e.sets   === "" ? 0 : +e.sets,
      reps:  e.reps   === "" ? 0 : +e.reps,
      weight:e.weight === "" ? 0 : +e.weight,
    }));

    try {
      if (editing) {
        const up = await updateRoutineFull(editing, prep);
        setRoutines(routines.map((r) => (r.id === editing ? up : r)));
      } else {
        const nu = await createRoutineFull(prep);
        setRoutines([...routines, nu]);
      }
      // reset form
      setDraft({ name: "", description: "", exercises: [emptyExercise()] });
      setEditing(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* edit / delete ------------------------------------------------- */
  const startEdit = (r: RoutineWithEx) => {
    setDraft(deepCopy(r));
    setEditing(r.id!);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete routine?")) return;
    await deleteRoutine(id);
    setRoutines(routines.filter((r) => r.id !== id));
  };

  /* UI ------------------------------------------------------------ */
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>{editing ? "Edit Routine" : "New Routine"}</CardTitle>
        </CardHeader>

        {/* removed the extra `space-y` here so no blank gap appears */}
        <CardContent className="space-y-4">
          {/* routine fields */}
          <Input
            placeholder="Routine name"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <Input
            placeholder="Description"
            value={draft.description}
            onChange={(e) =>
              setDraft({ ...draft, description: e.target.value })
            }
          />

          {/* exercise table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Name</th>
                  <th>Sets</th>
                  <th>Reps</th>
                  <th>Weight&nbsp;(kg)</th>
                </tr>
              </thead>
              <tbody>
                {draft.exercises.map((ex, i) => (
                  <tr key={i} className="border-b">
                    <td>
                      <Input
                        value={ex.name}
                        onChange={(e) => handleChangeEx(i, "name", e.target.value)}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={ex.sets}
                        placeholder="0"
                        onChange={(e) => handleChangeEx(i, "sets", e.target.value)}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={ex.reps}
                        placeholder="0"
                        onChange={(e) => handleChangeEx(i, "reps", e.target.value)}
                      />
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={ex.weight}
                        placeholder="0"
                        onChange={(e) => handleChangeEx(i, "weight", e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Button variant="outline" onClick={handleAddExercise}>
            + Add Exercise
          </Button>

          {/* actions */}
          <div className="flex gap-4">
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handleSave}
            >
              {editing ? "Save changes" : "Create routine"}
            </Button>
            {editing && (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(null);
                  setDraft({
                    name: "",
                    description: "",
                    exercises: [emptyExercise()],
                  });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
      </Card>

      {/* list of routines */}
      <div className="grid md:grid-cols-2 gap-6 mt-10">
        {routines.map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex-row justify-between items-start">
              <div>
                <CardTitle>{r.name}</CardTitle>
                <p className="text-sm text-gray-500">{r.description}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(r)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(r.id!)}
                >
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {r.exercises.map((ex) => (
                  <li key={ex.id}>
                    {ex.name} — {ex.sets}×{ex.reps}@{ex.weight} kg
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
        {routines.length === 0 && <p>No routines yet.</p>}
      </div>
    </div>
  );
}
