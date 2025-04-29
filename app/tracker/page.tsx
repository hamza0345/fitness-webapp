"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2, Calendar, Plus, Loader2 } from "lucide-react" // Import Loader2
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import useAuthGuard from "@/hooks/useAuthGuard"
import { ExerciseCombobox } from "@/components/ExerciseCombobox" // Import the new component
import {
  getRoutines,
  getWorkoutSessions,
  createWorkoutSession,
  deleteWorkoutSession,
  getNutritionEntries,
  createNutritionEntry,
  updateNutritionEntry,
  deleteNutritionEntry,
  getPredefinedExercises, // Import API function
  RoutineWithEx,
  WorkoutSession,
  NutritionEntry,
  PredefinedExercise, // Import type
  WorkoutExercise, // Import type
  WorkoutSet, // Import type
} from "@/lib/api" // Adjust path as necessary

// Interface for tracking food items (remains the same)
interface FoodItem {
  name: string;
  calories: number;
  protein: number;
}

export default function TrackerPage() {
  // Auth Guard
  const isAuthenticated = useAuthGuard();

  // Refs
  const startTabRef = useRef<HTMLButtonElement>(null);

  // State
  const [routines, setRoutines] = useState<RoutineWithEx[]>([])
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null)
  const [predefinedExercises, setPredefinedExercises] = useState<PredefinedExercise[]>([]); // State for predefined exercises
  const [loading, setLoading] = useState({
    routines: true,
    workouts: true,
    nutrition: true,
    predefinedExercises: true, // Add loading state for exercises
  })
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([])
  const [todayFoods, setTodayFoods] = useState<FoodItem[]>([])
  const [newFood, setNewFood] = useState<FoodItem>({ name: '', calories: 0, protein: 0 })
  const [todayTotals, setTodayTotals] = useState({ calories: 0, protein: 0 })
  const [nutritionHistory, setNutritionHistory] = useState<{
    date: string;
    calories: number;
    protein: number;
    foods: FoodItem[];
  }[]>([])

  // --- Fetch initial data ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchAllData = async () => {
      // Fetch Routines
      try {
        setLoading(prev => ({ ...prev, routines: true }));
        const routinesData = await getRoutines();
        setRoutines(routinesData);
      } catch (error) {
        console.error("Failed to fetch routines:", error);
        toast.error("Failed to load routines");
      } finally {
        setLoading(prev => ({ ...prev, routines: false }));
      }

      // Fetch Workouts
      try {
        setLoading(prev => ({ ...prev, workouts: true }));
        const workoutsData = await getWorkoutSessions();
        setWorkoutSessions(workoutsData);
      } catch (error) {
        console.error("Failed to fetch workout sessions:", error);
        toast.error("Failed to load workout history");
      } finally {
        setLoading(prev => ({ ...prev, workouts: false }));
      }

      // Fetch Nutrition
      try {
        setLoading(prev => ({ ...prev, nutrition: true }));
        const nutritionData = await getNutritionEntries();
        setNutritionEntries(nutritionData);
        if (nutritionData && nutritionData.length > 0) {
          processNutritionHistory(nutritionData);
        }
      } catch (error) {
        console.error("Failed to fetch nutrition entries:", error);
        toast.error("Failed to load nutrition data");
      } finally {
        setLoading(prev => ({ ...prev, nutrition: false }));
      }

      // Fetch Predefined Exercises
      try {
        setLoading(prev => ({ ...prev, predefinedExercises: true }));
        const exercisesData = await getPredefinedExercises();
        setPredefinedExercises(exercisesData);
      } catch (error) {
        console.error("Failed to fetch predefined exercises:", error);
        toast.error("Failed to load exercise list");
      } finally {
        setLoading(prev => ({ ...prev, predefinedExercises: false }));
      }
    };

    fetchAllData();
  }, [isAuthenticated]); // Dependency array includes isAuthenticated

  // --- Nutrition processing (remains the same) ---
  const processNutritionHistory = (entries: NutritionEntry[]) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayEntry = entries.find(entry => entry.date === today);

    if (todayEntry && todayEntry.notes) {
      try {
        const foodItems: FoodItem[] = JSON.parse(todayEntry.notes);
        setTodayFoods(foodItems);
        const totals = foodItems.reduce((acc, food) => ({
          calories: acc.calories + (Number(food.calories) || 0), // Ensure numbers
          protein: acc.protein + (Number(food.protein) || 0) // Ensure numbers
        }), { calories: 0, protein: 0 });
        setTodayTotals(totals);
      } catch (error) {
        console.error("Error parsing food items:", error);
        setTodayFoods([]);
        setTodayTotals({ calories: 0, protein: 0 });
      }
    } else {
      setTodayFoods([]);
      setTodayTotals({ calories: 0, protein: 0 });
    }

    const last7Days: string[] = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return format(date, 'yyyy-MM-dd');
    });

    const history = last7Days.map(date => {
      const entry = entries.find(e => e.date === date);
      if (entry) {
        let foods: FoodItem[] = [];
        try {
          foods = entry.notes ? JSON.parse(entry.notes) : [];
        } catch { foods = []; }
        return { date, calories: entry.calories, protein: entry.protein, foods };
      }
      return { date, calories: 0, protein: 0, foods: [] };
    });
    setNutritionHistory(history);
  };

  // --- Workout functions ---
  const startWorkout = (routine: RoutineWithEx) => {
    if (!routine || !routine.exercises) return;
    const workout: WorkoutSession = {
      routine: routine.id || undefined,
      name: routine.name || "New Workout",
      exercises: routine.exercises.map((ex, index) => ({
        name: ex.name || "",
        order: ex.order ?? index,
        sets: Array.from({ length: ex.sets || 1 }).map((_, setIdx) => ({
          weight: Number(ex.weight) || 0, // Ensure number
          reps: Number(ex.reps) || 0, // Ensure number
          set_number: setIdx + 1,
        }))
      }))
    };
    setActiveWorkout(workout);
    // Switch to active tab - might need a state variable to control the active tab value
    // or find a way to trigger the tab click programmatically if Tabs component allows
  };

  const startEmptyWorkout = () => {
    const workout: WorkoutSession = {
      name: "Custom Workout - " + format(new Date(), 'yyyy-MM-dd'),
      exercises: []
    };
    setActiveWorkout(workout);
     // Switch to active tab
  };

  const completeWorkout = async () => {
    if (!activeWorkout || !activeWorkout.exercises || activeWorkout.exercises.length === 0) {
         toast.warning("Cannot save an empty workout.");
         return;
    }

     // Ensure all exercises have names
     if (activeWorkout.exercises.some(ex => !ex.name.trim())) {
         toast.error("Please provide a name for all exercises before saving.");
         return;
     }


    try {
      setLoading(prev => ({ ...prev, workouts: true }));
      const savedWorkout = await createWorkoutSession(activeWorkout);
      setWorkoutSessions([savedWorkout, ...workoutSessions]);
      setActiveWorkout(null);
      toast.success("Workout saved successfully!");
       if (startTabRef.current) startTabRef.current.click(); // Go back to start tab
    } catch (error: any) {
      console.error("Failed to save workout:", error);
      toast.error(`Failed to save workout: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(prev => ({ ...prev, workouts: false }));
    }
  };

   const handleDeleteWorkout = async (id: number | undefined) => {
    if (!id) return; // Check if id is defined
    if (!confirm("Are you sure you want to delete this workout session?")) return;
    try {
      setLoading(prev => ({...prev, workouts: true}));
      await deleteWorkoutSession(id);
      setWorkoutSessions(prev => prev.filter(workout => workout.id !== id));
      toast.success("Workout deleted");
    } catch (error: any) {
      console.error("Failed to delete workout:", error);
      toast.error(`Failed to delete workout: ${error.message || 'Unknown error'}`);
    } finally {
        setLoading(prev => ({...prev, workouts: false}));
    }
  };


  const addExerciseToWorkout = () => {
    if (!activeWorkout) return;
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises = [
      ...newWorkout.exercises,
      {
        name: "", // Start with empty name for combobox
        order: newWorkout.exercises.length,
        sets: [{ weight: 0, reps: 0, set_number: 1 }]
      }
    ];
    setActiveWorkout(newWorkout);
  };

  const handleExerciseNameChange = (exIndex: number, newName: string) => {
      if (!activeWorkout) return;
      const newWorkout = { ...activeWorkout };
      newWorkout.exercises[exIndex].name = newName;
      setActiveWorkout(newWorkout);
  };

  const handleSetChange = (exIndex: number, setIndex: number, field: keyof Omit<WorkoutSet, 'id' | 'set_number'>, value: string) => {
    if (!activeWorkout) return;
    const newWorkout = { ...activeWorkout };
    // Ensure the value is treated as a number
    (newWorkout.exercises[exIndex].sets[setIndex] as any)[field] = Number(value) || 0;
    setActiveWorkout(newWorkout);
  };


  const addSetToExercise = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    const newWorkout = { ...activeWorkout };
    const currentSets = newWorkout.exercises[exerciseIndex].sets;
    const lastSet = currentSets[currentSets.length - 1];
    newWorkout.exercises[exerciseIndex].sets = [
      ...currentSets,
      {
        weight: lastSet?.weight || 0,
        reps: lastSet?.reps || 0,
        set_number: currentSets.length + 1
      }
    ];
    setActiveWorkout(newWorkout);
  };

  const deleteExerciseFromWorkout = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    if (!confirm("Delete this exercise and all its sets?")) return;
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises = newWorkout.exercises.filter((_, i) => i !== exerciseIndex)
                                               .map((ex, idx) => ({ ...ex, order: idx })); // Re-order
    setActiveWorkout(newWorkout);
  };

  const deleteSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    const newWorkout = { ...activeWorkout };
    const exercise = newWorkout.exercises[exerciseIndex];

     // Prevent deleting the last set if it's the only set
    if (exercise.sets.length <= 1) {
      toast.warning("Cannot delete the last set. Delete the exercise instead.");
      return;
    }


    exercise.sets = exercise.sets.filter((_, i) => i !== setIndex)
                                 .map((set, idx) => ({ ...set, set_number: idx + 1 })); // Renumber sets
    setActiveWorkout(newWorkout);
  };

  // --- Nutrition functions (remain the same) ---
  const handleFoodChange = (field: keyof FoodItem, value: any) => {
      const numValue = Number(value) || 0; // Ensure numeric value, default 0
      if ((field === 'calories' || field === 'protein') && numValue < 0) return; // Prevent negative values

      setNewFood({ ...newFood, [field]: field === 'name' ? value : numValue });
  };

  const addFoodItem = async () => {
    if (!newFood.name.trim()) {
        toast.error("Please enter a food name.");
        return;
    }
    if (newFood.calories <= 0 && newFood.protein <= 0) {
         toast.error("Please enter calories or protein for the food item.");
        return;
    }

    const updatedFoods = [...todayFoods, { ...newFood, calories: Number(newFood.calories) || 0, protein: Number(newFood.protein) || 0 }]; // Ensure numbers
    setTodayFoods(updatedFoods);

    const newTotals = updatedFoods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein
    }), { calories: 0, protein: 0 });
    setTodayTotals(newTotals);

    try {
      setLoading(prev => ({ ...prev, nutrition: true }));
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingEntry = nutritionEntries.find(entry => entry.date === today);
      const nutritionData: Omit<NutritionEntry, 'id' | 'user'> = {
        date: today,
        calories: newTotals.calories,
        protein: newTotals.protein,
        notes: JSON.stringify(updatedFoods)
      };

      let savedEntry: NutritionEntry;
      if (existingEntry?.id) {
        savedEntry = await updateNutritionEntry(existingEntry.id, nutritionData);
        setNutritionEntries(prev => prev.map(entry => entry.id === existingEntry.id ? savedEntry : entry));
      } else {
        savedEntry = await createNutritionEntry(nutritionData);
        setNutritionEntries(prev => [savedEntry, ...prev]);
      }
      processNutritionHistory(nutritionEntries.map(e => e.id === savedEntry.id ? savedEntry : e)); // Re-process with updated entry

      setNewFood({ name: '', calories: 0, protein: 0 }); // Reset form
      toast.success("Food added successfully");
    } catch (error: any) {
      console.error("Failed to save nutrition entry:", error);
      toast.error(`Failed to save food item: ${error.message || 'Unknown error'}`);
      // Revert optimistic update on error
      setTodayFoods(todayFoods);
       setTodayTotals(todayFoods.reduce((acc, food) => ({
            calories: acc.calories + food.calories,
            protein: acc.protein + food.protein
       }), { calories: 0, protein: 0 }));
    } finally {
      setLoading(prev => ({ ...prev, nutrition: false }));
    }
  };

  const deleteFoodItem = async (index: number) => {
      const itemToDelete = todayFoods[index];
      const updatedFoods = todayFoods.filter((_, i) => i !== index);

      const newTotals = updatedFoods.reduce((acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein
      }), { calories: 0, protein: 0 });

       // Optimistic UI update
      setTodayFoods(updatedFoods);
      setTodayTotals(newTotals);


      try {
        setLoading(prev => ({ ...prev, nutrition: true }));
        const today = format(new Date(), 'yyyy-MM-dd');
        const existingEntry = nutritionEntries.find(entry => entry.date === today);

        if (existingEntry?.id) {
          const nutritionData: Omit<NutritionEntry, 'id' | 'user'> = {
            date: today,
            calories: newTotals.calories,
            protein: newTotals.protein,
            notes: JSON.stringify(updatedFoods)
          };
          const savedEntry = await updateNutritionEntry(existingEntry.id, nutritionData);
          setNutritionEntries(prev => prev.map(entry => entry.id === existingEntry.id ? savedEntry : entry));
           processNutritionHistory(nutritionEntries.map(e => e.id === savedEntry.id ? savedEntry : e)); // Re-process with updated entry
          toast.success("Food item removed");
        } else {
           // If no entry existed, something is wrong, but we already updated UI
           console.warn("Attempted to delete food item, but no backend entry found for today.");
           toast.info("Food item removed locally."); // Adjust message
        }
      } catch (error: any) {
        console.error("Failed to update nutrition entry:", error);
        toast.error(`Failed to remove food item: ${error.message || 'Unknown error'}`);
         // Revert optimistic update on error
        setTodayFoods(todayFoods); // Revert to original list
        setTodayTotals(todayFoods.reduce((acc, food) => ({
            calories: acc.calories + food.calories,
            protein: acc.protein + food.protein
        }), { calories: 0, protein: 0 })); // Revert totals
      } finally {
        setLoading(prev => ({ ...prev, nutrition: false }));
      }
  };

   // Navigate to Start Workout tab
   const navigateToStartWorkout = () => {
        if (startTabRef.current) {
          startTabRef.current.click();
        }
   };


  // --- Render Logic ---
  if (!isAuthenticated) {
    // Optional: Render a loading state or null while redirecting
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  return (
    // Use theme variables
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Workout & Nutrition Tracker</h1>

        {/* Use theme variables for Tabs */}
        <Tabs defaultValue={activeWorkout ? "active" : "start"} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-4"> {/* Adjusted grid layout */}
            <TabsTrigger value="start" ref={startTabRef}>Start Workout</TabsTrigger>
            {/* Conditionally render Active Workout tab trigger */}
            {activeWorkout ? (
                 <TabsTrigger value="active">Active Workout</TabsTrigger>
            ) : (
                 <span className="opacity-50 cursor-not-allowed flex items-center justify-center text-sm text-muted-foreground p-2">Active Workout</span> // Placeholder if no active workout
            )}

            <TabsTrigger value="history">Workout History</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          </TabsList>

          {/* Start Workout Tab */}
          <TabsContent value="start">
            {loading.routines ? (
              <div className="text-center py-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                Loading routines...
              </div>
            ) : (
              <div>
                {/* Card for Empty Workout */}
                <div className="mb-6 max-w-md mx-auto sm:mx-0">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Create Empty Workout</CardTitle>
                      <CardDescription className="text-sm">
                        Start a custom workout without a pre-defined routine.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <p className="text-xs text-muted-foreground">
                        Build your session from scratch by adding exercises and sets as you go.
                      </p>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button className="w-full" onClick={startEmptyWorkout}>
                        Start Empty Workout
                      </Button>
                    </CardFooter>
                  </Card>
                </div>

                {/* Routines List */}
                {routines.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Or select a routine:</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {routines.map((routine) => (
                        <Card key={routine.id} className="hover:shadow-lg transition-shadow flex flex-col">
                          <CardHeader>
                            <CardTitle>{routine.name}</CardTitle>
                            <CardDescription>
                                Created: {routine.created_at ? format(new Date(routine.created_at), 'PP') : 'N/A'}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{routine.description || "No description."}</p>
                             <p className="text-sm font-medium">Exercises: {routine.exercises?.length || 0}</p>
                          </CardContent>
                          <CardFooter>
                            <Button className="w-full" onClick={() => startWorkout(routine)}>
                              Start This Workout
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 mt-6 text-muted-foreground">
                    <p className="mb-4">No routines found.</p>
                    <Button asChild>
                      <Link href="/routines">Create Routine</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Active Workout Tab - Render only if activeWorkout exists */}
          {activeWorkout && (
            <TabsContent value="active">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-x-4">
                  <div>
                     {/* Allow editing workout name */}
                     <Input
                         value={activeWorkout.name}
                         onChange={(e) => setActiveWorkout(prev => prev ? { ...prev, name: e.target.value } : null)}
                         className="text-xl font-semibold p-1 h-auto border-0 shadow-none focus-visible:ring-0"
                         placeholder="Workout Name"
                     />
                    <CardDescription>Track your sets, reps, and weights.</CardDescription>
                  </div>
                  <Button onClick={addExerciseToWorkout}>
                    <Plus className="h-4 w-4 mr-2" /> Add Exercise
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {activeWorkout.exercises.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p className="mb-4">No exercises added yet.</p>
                        <Button variant="outline" onClick={addExerciseToWorkout}>
                          <Plus className="h-4 w-4 mr-2" /> Add First Exercise
                        </Button>
                      </div>
                    ) : (
                      activeWorkout.exercises.map((exercise, exIndex) => (
                        <div key={exIndex} className="border rounded-lg p-4 shadow-sm bg-card">
                          <div className="flex justify-between items-center mb-4 gap-4">
                            {/* Replace Input with ExerciseCombobox */}
                            <div className="flex-grow">
                               <ExerciseCombobox
                                  predefinedExercises={predefinedExercises}
                                  isLoading={loading.predefinedExercises}
                                  value={exercise.name}
                                  onChange={(newName) => handleExerciseNameChange(exIndex, newName)}
                                  placeholder="Type or select exercise..."
                                  className="font-medium" // Added font-medium for consistency
                                />
                            </div>
                            <div className="flex space-x-2 flex-shrink-0">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addSetToExercise(exIndex)}
                                    aria-label="Add Set"
                                >
                                    <Plus className="h-4 w-4" /> <span className="hidden sm:inline ml-1">Set</span>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost" // Use ghost for less emphasis
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => deleteExerciseFromWorkout(exIndex)}
                                    aria-label="Delete Exercise"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>

                          {/* Column Headers */}
                          {exercise.sets.length > 0 && (
                              <div className="grid grid-cols-12 gap-2 sm:gap-4 mb-2 px-1 sm:px-2">
                                <div className="col-span-2">
                                    <Label className="text-xs font-normal text-muted-foreground">Set</Label>
                                </div>
                                <div className="col-span-4 sm:col-span-3">
                                    <Label className="text-xs font-normal text-muted-foreground">Weight (kg)</Label>
                                </div>
                                <div className="col-span-4 sm:col-span-3">
                                    <Label className="text-xs font-normal text-muted-foreground">Reps</Label>
                                </div>
                                <div className="col-span-2"></div> {/* Actions column */}
                              </div>
                          )}

                          {/* Sets List */}
                          <div className="space-y-3">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                                <div className="col-span-2 flex items-center justify-center">
                                    <span className="text-sm font-medium bg-muted text-muted-foreground rounded-full h-6 w-6 flex items-center justify-center">{set.set_number}</span>
                                </div>
                                <div className="col-span-4 sm:col-span-3">
                                  <Input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    placeholder="0"
                                    aria-label={`Weight for set ${set.set_number}`}
                                    value={set.weight || ''} // Show empty string if 0 for better UX
                                    onChange={(e) => handleSetChange(exIndex, setIndex, "weight", e.target.value)}
                                    className="text-center"
                                  />
                                </div>
                                <div className="col-span-4 sm:col-span-3">
                                  <Input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    aria-label={`Reps for set ${set.set_number}`}
                                    value={set.reps || ''} // Show empty string if 0
                                    onChange={(e) => handleSetChange(exIndex, setIndex, "reps", e.target.value)}
                                    className="text-center"
                                  />
                                </div>
                                <div className="col-span-2 flex items-center justify-center">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => deleteSetFromExercise(exIndex, setIndex)}
                                    aria-label={`Delete set ${set.set_number}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4">
                   <Button
                      variant="outline"
                      onClick={() => {
                          if (confirm("Discard this workout? Any unsaved progress will be lost.")) {
                              setActiveWorkout(null);
                              if (startTabRef.current) startTabRef.current.click(); // Go back to start tab
                          }
                      }}
                  >
                    Discard Workout
                  </Button>
                  <Button
                    onClick={completeWorkout}
                    disabled={loading.workouts || !activeWorkout || activeWorkout.exercises.length === 0 || activeWorkout.exercises.some(ex => !ex.name.trim())}
                  >
                    {loading.workouts ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Complete & Save Workout
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}

           {/* Workout History Tab */}
           <TabsContent value="history">
             {loading.workouts ? (
               <div className="text-center py-12 text-muted-foreground">
                 <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
                 Loading workout history...
               </div>
             ) : workoutSessions.length > 0 ? (
               <div className="space-y-6">
                 {workoutSessions.map((workout) => (
                   <Card key={workout.id}>
                     <CardHeader>
                       <div className="flex justify-between items-start">
                         <div>
                           <CardTitle>{workout.name}</CardTitle>
                           <CardDescription>
                             {workout.date ? format(new Date(workout.date), 'PPp') : 'Date unknown'} • {workout.exercises?.length || 0} exercises
                           </CardDescription>
                         </div>
                         <Button
                           variant="ghost"
                           size="icon"
                           className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                           onClick={() => handleDeleteWorkout(workout.id)}
                           aria-label="Delete Workout Session"
                         >
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <div className="space-y-4">
                         {workout.exercises.map((ex, exIndex) => (
                           <div key={exIndex} className="border-t pt-4 first:border-0 first:pt-0">
                             <h4 className="font-medium mb-2">{ex.name}</h4>
                             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-sm">
                               {ex.sets.map((set, setIndex) => (
                                 <div key={setIndex} className="bg-muted rounded p-2 text-center text-muted-foreground">
                                   <span className="font-medium">Set {set.set_number}:</span> {set.weight}kg × {set.reps} reps
                                 </div>
                               ))}
                             </div>
                           </div>
                         ))}
                         {(!workout.exercises || workout.exercises.length === 0) && (
                            <p className="text-sm text-muted-foreground text-center py-4">No exercises recorded for this session.</p>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 ))}
               </div>
             ) : (
               <div className="text-center py-12 text-muted-foreground">
                 <p className="mb-4">No workout history yet.</p>
                 <Button variant="outline" onClick={navigateToStartWorkout}>
                   Start Your First Workout
                 </Button>
               </div>
             )}
           </TabsContent>


          {/* Nutrition Tracking Tab */}
          <TabsContent value="nutrition">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column: Add Food & Log */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Log Food for Today</CardTitle>
                            <CardDescription>{format(new Date(), 'MMMM d, yyyy')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Add Food Form */}
                             <div className="space-y-3">
                                <div>
                                    <Label htmlFor="food-name">Food Name</Label>
                                    <Input
                                        id="food-name"
                                        value={newFood.name}
                                        onChange={(e) => handleFoodChange('name', e.target.value)}
                                        placeholder="e.g., Chicken Breast (100g)"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                    <Label htmlFor="food-calories">Calories</Label>
                                    <Input
                                        id="food-calories"
                                        type="number"
                                        min="0"
                                        value={newFood.calories || ''}
                                        onChange={(e) => handleFoodChange('calories', e.target.value)}
                                        placeholder="kcal"
                                    />
                                    </div>
                                    <div>
                                    <Label htmlFor="food-protein">Protein (g)</Label>
                                    <Input
                                        id="food-protein"
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        value={newFood.protein || ''}
                                        onChange={(e) => handleFoodChange('protein', e.target.value)}
                                        placeholder="grams"
                                    />
                                    </div>
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={addFoodItem}
                                    disabled={loading.nutrition || !newFood.name.trim() || (newFood.calories <=0 && newFood.protein <=0)}
                                >
                                    {loading.nutrition ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <Plus className="h-4 w-4 mr-2" />}
                                    Add Food
                                </Button>
                             </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Today's Food Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {loading.nutrition && !todayFoods.length ? (
                               <div className="text-center py-4 text-muted-foreground">
                                   <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2"/> Loading...
                               </div>
                           ) : todayFoods.length > 0 ? (
                               <div className="space-y-2 max-h-60 overflow-y-auto">
                                   {/* Header Row */}
                                   <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground sticky top-0 bg-card pb-1 border-b">
                                       <div className="col-span-5">Food</div>
                                       <div className="col-span-3 text-center">Calories</div>
                                       <div className="col-span-3 text-center">Protein</div>
                                       <div className="col-span-1"></div> {/* Delete Button Col */}
                                   </div>
                                   {/* Food Items */}
                                   {todayFoods.map((food, index) => (
                                       <div key={index} className="grid grid-cols-12 items-center py-1 border-b last:border-0 text-sm">
                                           <div className="col-span-5 truncate pr-1">{food.name}</div>
                                           <div className="col-span-3 text-center">{food.calories}</div>
                                           <div className="col-span-3 text-center">{food.protein}g</div>
                                           <div className="col-span-1 text-right">
                                           <Button
                                               variant="ghost"
                                               size="icon"
                                               className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                               onClick={() => deleteFoodItem(index)}
                                               disabled={loading.nutrition}
                                               aria-label={`Delete ${food.name}`}
                                           >
                                               <Trash2 className="h-4 w-4" />
                                           </Button>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           ) : (
                               <div className="text-center py-4 text-muted-foreground">
                                   No food items logged today.
                               </div>
                           )}
                        </CardContent>
                    </Card>
                </div>

                 {/* Right Column: Totals & History */}
                 <div className="space-y-6">
                     {/* Today's Totals Card */}
                      <Card>
                         <CardHeader>
                           <CardTitle>Today's Totals</CardTitle>
                         </CardHeader>
                         <CardContent className="flex space-x-4">
                             <div className="bg-primary/10 rounded-lg p-4 text-center flex-1 border border-primary/20">
                               <p className="text-sm font-medium text-primary mb-1">Total Calories</p>
                               <p className="text-3xl font-bold text-primary">{todayTotals.calories}</p>
                             </div>
                             <div className="bg-primary/10 rounded-lg p-4 text-center flex-1 border border-primary/20">
                               <p className="text-sm font-medium text-primary mb-1">Total Protein</p>
                               <p className="text-3xl font-bold text-primary">{todayTotals.protein}g</p>
                             </div>
                         </CardContent>
                      </Card>

                     {/* History Card */}
                      <Card>
                         <CardHeader>
                             <CardTitle>Last 7 Days</CardTitle>
                             <CardDescription>Summary of your recent nutrition intake.</CardDescription>
                         </CardHeader>
                          <CardContent>
                             {loading.nutrition && !nutritionHistory.length ? (
                                <div className="text-center py-4 text-muted-foreground">
                                   <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2"/> Loading history...
                                </div>
                             ) : nutritionHistory.length > 0 ? (
                                 <div className="space-y-3 max-h-96 overflow-y-auto">
                                     {nutritionHistory.map((day) => (
                                         <div key={day.date} className="flex justify-between items-center border-b pb-2 last:border-0 text-sm">
                                             <span>{format(new Date(day.date + 'T00:00:00'), 'EEE, MMM d')}</span>
                                             <div className="text-right">
                                                 <span className="font-medium">{day.calories}</span> <span className="text-xs text-muted-foreground">kcal</span> /{' '}
                                                 <span className="font-medium">{day.protein}</span><span className="text-xs text-muted-foreground">g P</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             ) : (
                                 <p className="text-sm text-center text-muted-foreground py-4">No nutrition history found.</p>
                             )}
                          </CardContent>
                      </Card>
                 </div>
            </div>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}