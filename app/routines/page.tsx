"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Routine {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");

  /* fetch once */
  useEffect(() => {
    (async () => {
      try {
        setRoutines(await getRoutines());
      } catch (e: any) {
        setError(e.message);
      }
    })();
  }, []);

  /* add / save */
  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (editing) {
        const updated = await updateRoutine(editing, name, description);
        setRoutines((r) => r.map((x) => (x.id === editing ? updated : x)));
        setEditing(null);
      } else {
        const newR = await createRoutine(name, description);
        setRoutines((r) => [...r, newR]);
      }
      setName("");
      setDescription("");
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* delete */
  const handleDelete = async (id: number) => {
    if (!confirm("Delete routine?")) return;
    try {
      await deleteRoutine(id);
      setRoutines((r) => r.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* begin edit */
  const startEdit = (r: Routine) => {
    setEditing(r.id);
    setName(r.name);
    setDescription(r.description ?? "");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>My Routines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* form */}
          <div className="space-y-2">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleSave}>
              {editing ? "Save changes" : "Add routine"}
            </Button>
            {editing && (
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          {/* list */}
          <ul className="space-y-2">
            {routines.map((r) => (
              <li
                key={r.id}
                className="border rounded-lg p-3 flex justify-between items-start gap-4"
              >
                <div>
                  <p className="font-medium">{r.name}</p>
                  {r.description && (
                    <p className="text-sm text-gray-600">{r.description}</p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => startEdit(r)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
            {routines.length === 0 && (
              <p className="text-sm text-gray-500">No routines yet.</p>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
