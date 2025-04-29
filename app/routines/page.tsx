"use client";

import useAuthGuard from "@/hooks/useAuthGuard";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card"; // Added Footer/Desc
import { Loader2, Trash2, Edit, Plus, X } from "lucide-react"; // Added icons
import { toast } from "sonner"; // Import toast
import { ExerciseCombobox } from "@/components/ExerciseCombobox"; // Import the new component
import {
  getRoutines,
  deleteRoutine,
  createRoutineFull,
  updateRoutineFull,
  getPredefinedExercises, // Import API function
  RoutineWithEx,
  RoutineExercise, // Use RoutineExercise type here
  PredefinedExercise, // Import type
} from "@/lib/api"; // Adjust path as necessary

/* ---------- helpers ---------- */

// Use RoutineExercise type and ensure numeric fields are numbers or empty strings initially
const emptyExercise = (): RoutineExercise => ({
  name: "",
  sets: '' as any, // Allow empty string initially for input binding
  reps: '' as any,
  weight: '' as any,
});

// Deep copy utility (remains the same)
const deepCopy = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

/* ---------- component ---------- */

export default function RoutinesPage() {
  // Auth Guard
  const isAuthenticated = useAuthGuard();

  // State
  const [routines, setRoutines] = useState<RoutineWithEx[]>([]);
  const [predefinedExercises, setPredefinedExercises] = useState<PredefinedExercise[]>([]); // State for exercises
  const [draft, setDraft] = useState<RoutineWithEx>({
    name: "",
    description: "",
    exercises: [emptyExercise()],
  });
  const [editing, setEditing] = useState<number | null>(null); // Store ID of routine being edited
  const [loading, setLoading] = useState({
      routines: true,
      predefinedExercises: true,
      saving: false, // Add saving state
      deleting: null as number | null, // Track which routine is being deleted
  });
  const [error, setError] = useState(""); // General error state for the form

  /* --- Fetch initial data --- */
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(prev => ({ ...prev, routines: true, predefinedExercises: true }));
    setError(""); // Clear previous errors

    Promise.all([
        getRoutines(),
        getPredefinedExercises()
    ])
    .then(([routinesData, exercisesData]) => {
        setRoutines(routinesData);
        setPredefinedExercises(exercisesData);
    })
    .catch((e) => {
        console.error("Failed to load initial data:", e);
        setError(e.message || "Failed to load routines or exercises.");
        toast.error(e.message || "Failed to load data.");
    })
    .finally(() => {
        setLoading(prev => ({ ...prev, routines: false, predefinedExercises: false }));
    });

  }, [isAuthenticated]);

  /* --- Form field handlers --- */
  const handleAddExercise = () => {
    // Check if last exercise is empty before adding a new one
    const lastEx = draft.exercises[draft.exercises.length - 1];
    if (lastEx && !lastEx.name.trim() && !lastEx.sets && !lastEx.reps && !lastEx.weight) {
         toast.info("Please fill out the last exercise before adding a new one.");
         return;
    }
    setDraft({ ...draft, exercises: [...draft.exercises, emptyExercise()] });
  }

  const handleChangeEx = (idx: number, field: keyof RoutineExercise, value: string | number) => {
    const updatedExercises = [...draft.exercises];
    // Handle potential undefined exercise at index (shouldn't happen with proper checks)
    if (!updatedExercises[idx]) return;

    // Store raw string for text inputs, convert to number for numeric (handle potential NaN)
    (updatedExercises[idx] as any)[field] = value; // Allow storing string from combobox or input

    setDraft({ ...draft, exercises: updatedExercises });
  };

  const handleDeleteExercise = (idx: number) => {
      if (draft.exercises.length <= 1) {
          toast.warning("A routine must have at least one exercise.");
          return; // Don't allow deleting the last exercise
      }
      setDraft({
          ...draft,
          exercises: draft.exercises.filter((_, i) => i !== idx)
      });
  }

  const resetForm = () => {
      setDraft({ name: "", description: "", exercises: [emptyExercise()] });
      setEditing(null);
      setError(""); // Clear errors on reset/cancel
  }

  /* --- Save Routine --- */
  const handleSave = async () => {
    if (!draft.name.trim()) {
        toast.error("Please enter a routine name.");
        return;
    }
     if (draft.exercises.length === 0 || draft.exercises.every(ex => !ex.name.trim())) {
         toast.error("Please add at least one valid exercise with a name.");
         return;
     }


    setLoading(prev => ({ ...prev, saving: true }));
    setError(""); // Clear previous errors

    // Filter out completely empty exercises and convert numeric strings just before API call
    const exercisesToSave = draft.exercises
      .filter(e => e.name.trim() !== "") // Ensure exercise has a name
      .map((e, index) => ({
        name: e.name.trim(), // Trim name
        // Provide default 0 if empty string or invalid number
        sets: Number(e.sets) || 0,
        reps: Number(e.reps) || 0,
        weight: Number(e.weight) || 0,
        order: index, // Explicitly set order
      }));

      // Check again if after filtering, there are no exercises left
      if (exercisesToSave.length === 0) {
          toast.error("Please add at least one valid exercise with a name.");
          setLoading(prev => ({ ...prev, saving: false }));
          return;
      }


    const routinePayload: Omit<RoutineWithEx, 'id' | 'user' | 'created_at'> = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        exercises: exercisesToSave,
    };


    try {
      if (editing) { // Update existing routine
        const updatedRoutine = await updateRoutineFull(editing, routinePayload);
        setRoutines(routines.map((r) => (r.id === editing ? updatedRoutine : r)));
        toast.success(`Routine "${updatedRoutine.name}" updated.`);
      } else { // Create new routine
        const newRoutine = await createRoutineFull(routinePayload);
        setRoutines([...routines, newRoutine]);
        toast.success(`Routine "${newRoutine.name}" created.`);
      }
      resetForm(); // Reset form after successful save
    } catch (e: any) {
      console.error("Failed to save routine:", e);
      const errorMessage = e.message || "Could not save routine. Please check inputs.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  /* --- Edit / Delete Routine --- */
  const startEdit = (routineToEdit: RoutineWithEx) => {
     // Prepare draft state, ensuring exercises have string values for inputs
     const draftExercises = routineToEdit.exercises.map(ex => ({
         ...ex,
         sets: ex.sets?.toString() ?? '', // Convert to string or empty string
         reps: ex.reps?.toString() ?? '',
         weight: ex.weight?.toString() ?? '',
     }));

    setDraft({
        ...deepCopy(routineToEdit), // Copy other fields
        exercises: draftExercises.length > 0 ? draftExercises : [emptyExercise()] // Ensure at least one exercise row
    });
    setEditing(routineToEdit.id!); // Set the ID of the routine being edited
    setError(""); // Clear errors when starting edit
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the routine "${name}"?`)) return;

    setLoading(prev => ({ ...prev, deleting: id })); // Indicate which one is deleting
    setError("");

    try {
      await deleteRoutine(id);
      setRoutines(routines.filter((r) => r.id !== id));
      toast.success(`Routine "${name}" deleted.`);
       // If the deleted routine was being edited, reset the form
      if (editing === id) {
        resetForm();
      }
    } catch (e: any) {
      console.error("Failed to delete routine:", e);
      const errorMessage = e.message || "Could not delete routine.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, deleting: null }));
    }
  };

  // --- Render Logic ---
  if (!isAuthenticated) {
    return <div className="container mx-auto px-4 py-8 text-center">Authenticating...</div>;
  }

  // Loading state for initial data fetch
   if (loading.routines || loading.predefinedExercises) {
       return (
           <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                Loading data...
           </div>
        );
   }


  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Routine Creation/Editing Form Card */}
      <Card className="max-w-4xl mx-auto shadow-md">
        <CardHeader>
          <CardTitle>{editing ? `Editing: ${draft.name || 'Routine'}` : "Create New Routine"}</CardTitle>
           <CardDescription>
                {editing ? "Modify the details of your routine below." : "Define the name, description, and exercises for your new routine."}
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Routine Name and Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Input
                placeholder="Routine Name (e.g., Push Day, Full Body Strength)"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                required // Add required attribute
              />
             <Textarea // Use Textarea for description
                placeholder="Description (optional, e.g., Focus on chest and shoulders)"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={1} // Start with 1 row, expands automatically if needed via CSS potentially
                className="resize-y min-h-[40px]" // Allow vertical resize
              />
          </div>


          {/* Exercise Table */}
          <div className="border rounded-lg overflow-hidden">
              <h3 className="text-lg font-semibold p-4 bg-muted/50 border-b">Exercises</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                          <tr className="border-b">
                          <th className="py-2 px-3 text-left font-medium text-muted-foreground w-2/5">Name</th>
                          <th className="py-2 px-3 text-center font-medium text-muted-foreground w-1/6">Sets</th>
                          <th className="py-2 px-3 text-center font-medium text-muted-foreground w-1/6">Reps</th>
                          <th className="py-2 px-3 text-center font-medium text-muted-foreground w-1/6">Weight&nbsp;(kg)</th>
                          <th className="py-2 px-3 text-center font-medium text-muted-foreground w-[50px]"></th>
                          </tr>
                      </thead>
                      <tbody>
                          {draft.exercises.map((ex, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                              {/* Exercise Name Combobox */}
                              <td className="p-2 align-top"> {/* Use align-top if content height varies */}
                                <ExerciseCombobox
                                    predefinedExercises={predefinedExercises}
                                    isLoading={loading.predefinedExercises}
                                    value={ex.name}
                                    onChange={(newName) => handleChangeEx(i, "name", newName)}
                                    placeholder="Type or select..."
                                />
                              </td>
                              {/* Sets Input */}
                              <td className="p-2 align-top">
                                <Input
                                    type="number"
                                    min="0"
                                    value={ex.sets}
                                    placeholder="e.g. 3"
                                    onChange={(e) => handleChangeEx(i, "sets", e.target.value)}
                                    className="text-center"
                                />
                              </td>
                              {/* Reps Input */}
                              <td className="p-2 align-top">
                                <Input
                                    type="number"
                                    min="0"
                                    value={ex.reps}
                                    placeholder="e.g. 10"
                                    onChange={(e) => handleChangeEx(i, "reps", e.target.value)}
                                    className="text-center"
                                />
                              </td>
                              {/* Weight Input */}
                              <td className="p-2 align-top">
                                <Input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    value={ex.weight}
                                    placeholder="e.g. 50"
                                    onChange={(e) => handleChangeEx(i, "weight", e.target.value)}
                                    className="text-center"
                                />
                              </td>
                               {/* Delete Exercise Button */}
                              <td className="p-2 align-top text-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteExercise(i)}
                                    disabled={draft.exercises.length <= 1} // Disable if only one exercise
                                    aria-label="Delete Exercise Row"
                                  >
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </td>
                          </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              {/* Add Exercise Button - moved below table */}
              <div className="p-3 border-t bg-muted/30">
                 <Button variant="outline" size="sm" onClick={handleAddExercise}>
                    <Plus className="h-4 w-4 mr-2" /> Add Exercise Row
                  </Button>
              </div>
          </div>


          {/* Error Message */}
          {error && <p className="text-sm text-destructive text-center">{error}</p>}

        </CardContent>
         {/* Action Buttons */}
        <CardFooter className="flex justify-end gap-4 border-t pt-6">
             {editing && (
                <Button
                    variant="outline"
                    onClick={resetForm} // Use resetForm function
                    disabled={loading.saving}
                >
                    Cancel Edit
                </Button>
             )}
            <Button
                onClick={handleSave}
                disabled={loading.saving || !draft.name.trim() || draft.exercises.length === 0 || draft.exercises.every(ex => !ex.name.trim())}
            >
                {loading.saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editing ? "Save Changes" : "Create Routine"}
            </Button>
        </CardFooter>
      </Card>

      {/* List of Existing Routines Card */}
      <Card>
           <CardHeader>
               <CardTitle>Your Routines</CardTitle>
               <CardDescription>View and manage your saved workout routines.</CardDescription>
            </CardHeader>
            <CardContent>
                 {routines.length === 0 && !loading.routines ? (
                    <p className="text-center text-muted-foreground py-6">You haven't created any routines yet.</p>
                 ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {routines.map((r) => (
                        <Card key={r.id} className="shadow">
                            <CardHeader className="flex-row justify-between items-start">
                            <div>
                                <CardTitle>{r.name}</CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-2">{r.description || "No description."}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <Button size="sm" variant="secondary" onClick={() => startEdit(r)} disabled={loading.deleting === r.id}>
                                    <Edit className="h-3 w-3 mr-1" /> Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDelete(r.id!, r.name)}
                                    disabled={loading.deleting === r.id}
                                >
                                     {loading.deleting === r.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-3 w-3" />}
                                </Button>
                            </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-1 text-sm list-disc list-inside marker:text-muted-foreground">
                                {r.exercises.slice(0, 5).map((ex) => ( // Show first 5 exercises
                                    <li key={ex.id}>
                                        <span className="font-medium">{ex.name}</span> — {ex.sets}×{ex.reps} @ {ex.weight}kg
                                    </li>
                                ))}
                                 {r.exercises.length > 5 && <li className="text-muted-foreground italic">...and {r.exercises.length - 5} more</li>}
                                 {r.exercises.length === 0 && <li className="text-muted-foreground italic">No exercises added yet.</li>}
                                </ul>
                            </CardContent>
                        </Card>
                        ))}
                    </div>
                 )}
            </CardContent>
      </Card>
    </div>
  );
}