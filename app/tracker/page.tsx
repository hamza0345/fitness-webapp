"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dumbbell, ArrowLeft, Trash2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import useAuthGuard from "@/hooks/useAuthGuard"
import {
  getRoutines,
  getWorkoutSessions,
  createWorkoutSession,
  deleteWorkoutSession,
  getNutritionEntries,
  createNutritionEntry,
  updateNutritionEntry,
  deleteNutritionEntry,
  RoutineWithEx,
  WorkoutSession,
  NutritionEntry
} from "@/lib/api"

export default function TrackerPage() {
  // Call useAuthGuard to redirect if user is not authenticated
  const isAuthenticated = useAuthGuard();
  
  // Refs for tabs
  const startTabRef = useRef<HTMLButtonElement>(null);
  
  // State
  const [routines, setRoutines] = useState<RoutineWithEx[]>([])
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState({
    routines: true,
    workouts: true,
    nutrition: true,
  })
  const [nutritionEntries, setNutritionEntries] = useState<NutritionEntry[]>([])
  const [newNutrition, setNewNutrition] = useState<NutritionEntry>({
    date: format(new Date(), 'yyyy-MM-dd'),
    calories: 0,
    protein: 0,
    notes: ''
  })
  
  // Fetch data
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchData = async () => {
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
      
      try {
        setLoading(prev => ({ ...prev, nutrition: true }));
        const nutritionData = await getNutritionEntries();
        setNutritionEntries(nutritionData);
      } catch (error) {
        console.error("Failed to fetch nutrition entries:", error);
        toast.error("Failed to load nutrition data");
      } finally {
        setLoading(prev => ({ ...prev, nutrition: false }));
      }
    };
    
    fetchData();
  }, [isAuthenticated]);
  
  // Start a new workout from a routine
  const startWorkout = (routine: RoutineWithEx) => {
    const workout: WorkoutSession = {
      routine: routine.id,
      name: routine.name,
      exercises: routine.exercises.map(ex => ({
        name: ex.name,
        sets: Array(ex.sets).fill().map((_, setIdx) => ({
          weight: ex.weight,
          reps: ex.reps,
          set_number: setIdx + 1,
        }))
      }))
    };
    
    setActiveWorkout(workout);
  };
  
  // Complete and save the current workout
  const completeWorkout = async () => {
    if (!activeWorkout) return;
    
    try {
      setLoading(prev => ({ ...prev, workouts: true }));
      const savedWorkout = await createWorkoutSession(activeWorkout);
      setWorkoutSessions([savedWorkout, ...workoutSessions]);
      setActiveWorkout(null);
      toast.success("Workout saved successfully!");
    } catch (error) {
      console.error("Failed to save workout:", error);
      toast.error("Failed to save workout");
    } finally {
      setLoading(prev => ({ ...prev, workouts: false }));
    }
  };
  
  // Delete a workout
  const handleDeleteWorkout = async (id: number) => {
    if (!confirm("Are you sure you want to delete this workout?")) return;
    
    try {
      await deleteWorkoutSession(id);
      setWorkoutSessions(workoutSessions.filter(workout => workout.id !== id));
      toast.success("Workout deleted");
    } catch (error) {
      console.error("Failed to delete workout:", error);
      toast.error("Failed to delete workout");
    }
  };
  
  // Handle nutrition form changes
  const handleNutritionChange = (field: keyof NutritionEntry, value: any) => {
    setNewNutrition({ ...newNutrition, [field]: value });
  };
  
  // Submit new nutrition entry
  const handleNutritionSubmit = async () => {
    try {
      setLoading(prev => ({ ...prev, nutrition: true }));
      const savedEntry = await createNutritionEntry(newNutrition);
      setNutritionEntries([savedEntry, ...nutritionEntries]);
      // Reset form
      setNewNutrition({
        date: format(new Date(), 'yyyy-MM-dd'),
        calories: 0,
        protein: 0,
        notes: ''
      });
      toast.success("Nutrition entry saved");
    } catch (error) {
      console.error("Failed to save nutrition entry:", error);
      toast.error("Failed to save nutrition entry");
    } finally {
      setLoading(prev => ({ ...prev, nutrition: false }));
    }
  };
  
  // Delete nutrition entry
  const handleDeleteNutrition = async (id: number) => {
    if (!confirm("Are you sure you want to delete this nutrition entry?")) return;
    
    try {
      await deleteNutritionEntry(id);
      setNutritionEntries(nutritionEntries.filter(entry => entry.id !== id));
      toast.success("Nutrition entry deleted");
    } catch (error) {
      console.error("Failed to delete nutrition entry:", error);
      toast.error("Failed to delete nutrition entry");
    }
  };

  // Navigate to Start Workout tab
  const navigateToStartWorkout = () => {
    if (startTabRef.current) {
      startTabRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-green-600 hover:text-green-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Workout & Nutrition Tracker</h1>

        <Tabs defaultValue={activeWorkout ? "active" : "start"} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="start" ref={startTabRef}>Start Workout</TabsTrigger>
            {activeWorkout && <TabsTrigger value="active">Active Workout</TabsTrigger>}
            <TabsTrigger value="history">Workout History</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition Tracking</TabsTrigger>
          </TabsList>

          {/* Start Workout Tab */}
          <TabsContent value="start">
            {loading.routines ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Loading routines...</p>
              </div>
            ) : routines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routines.map((routine) => (
                  <Card key={routine.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{routine.name}</CardTitle>
                      <CardDescription>
                        Created: {new Date(routine.created_at || '').toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-500 mb-4">{routine.description}</p>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Exercises: {routine.exercises.length}</p>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" onClick={() => startWorkout(routine)}>
                        Start Workout
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No routines found. Create a routine to get started.</p>
                <Button asChild>
                  <Link href="/routines">Create Routine</Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Active Workout Tab */}
          {activeWorkout && (
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>{activeWorkout.name}</CardTitle>
                  <CardDescription>Track your sets, reps, and weights for this workout</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {activeWorkout.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="border rounded-lg p-4">
                        <h3 className="text-lg font-medium mb-4">{exercise.name}</h3>
                        <div className="space-y-4">
                          {exercise.sets.map((set, setIndex) => (
                            <div key={setIndex} className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-2">
                                <Label className="text-sm text-gray-500">Set {set.set_number}</Label>
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  placeholder="Weight"
                                  value={set.weight}
                                  onChange={(e) => {
                                    const newWorkout = { ...activeWorkout };
                                    newWorkout.exercises[exIndex].sets[setIndex].weight = Number(e.target.value);
                                    setActiveWorkout(newWorkout);
                                  }}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  placeholder="Reps"
                                  value={set.reps}
                                  onChange={(e) => {
                                    const newWorkout = { ...activeWorkout };
                                    newWorkout.exercises[exIndex].sets[setIndex].reps = Number(e.target.value);
                                    setActiveWorkout(newWorkout);
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveWorkout(null)}>
                    Cancel Workout
                  </Button>
                  <Button 
                    onClick={completeWorkout}
                    disabled={loading.workouts}
                  >
                    Complete Workout
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}

          {/* Workout History Tab */}
          <TabsContent value="history">
            {loading.workouts ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Loading workout history...</p>
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
                            {new Date(workout.date || '').toLocaleDateString()} • {workout.exercises.length} exercises
                          </CardDescription>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => workout.id && handleDeleteWorkout(workout.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {workout.exercises.map((ex, exIndex) => (
                          <div key={exIndex} className="border-b pb-4 last:border-0">
                            <h4 className="font-medium mb-2">{ex.name}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              {ex.sets.map((set, setIndex) => (
                                <div key={setIndex} className="bg-gray-100 rounded p-2 text-center">
                                  <span className="text-gray-500">Set {set.set_number}:</span> {set.weight}kg × {set.reps} reps
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No workout history yet</p>
                <Button variant="outline" onClick={navigateToStartWorkout}>
                  Start Your First Workout
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Nutrition Tracking Tab */}
          <TabsContent value="nutrition">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Add New Nutrition Entry */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Add Nutrition Entry</CardTitle>
                  <CardDescription>
                    Track your daily calories and protein intake
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={newNutrition.date}
                        onChange={(e) => handleNutritionChange('date', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="calories">Calories (kcal)</Label>
                      <Input
                        id="calories"
                        type="number"
                        value={newNutrition.calories}
                        onChange={(e) => handleNutritionChange('calories', Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="protein">Protein (g)</Label>
                      <Input
                        id="protein"
                        type="number"
                        step="0.1"
                        value={newNutrition.protein}
                        onChange={(e) => handleNutritionChange('protein', Number(e.target.value))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={newNutrition.notes || ''}
                        onChange={(e) => handleNutritionChange('notes', e.target.value)}
                        placeholder="Add notes about your meals, supplements, etc."
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={handleNutritionSubmit}
                    disabled={loading.nutrition || !newNutrition.calories || !newNutrition.protein}
                  >
                    Save Entry
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Nutrition History */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Nutrition History</CardTitle>
                  <CardDescription>
                    Your recent calorie and protein intake
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading.nutrition ? (
                    <div className="text-center py-6">
                      <p className="text-gray-500">Loading nutrition data...</p>
                    </div>
                  ) : nutritionEntries.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="py-2 px-4 text-left">Date</th>
                              <th className="py-2 px-4 text-left">Calories</th>
                              <th className="py-2 px-4 text-left">Protein</th>
                              <th className="py-2 px-4 text-left">Notes</th>
                              <th className="py-2 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {nutritionEntries.map((entry) => (
                              <tr key={entry.id} className="border-b border-gray-200">
                                <td className="py-3 px-4">
                                  {new Date(entry.date).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">{entry.calories} kcal</td>
                                <td className="py-3 px-4">{entry.protein}g</td>
                                <td className="py-3 px-4 text-sm text-gray-600 truncate max-w-[200px]">
                                  {entry.notes || '-'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => entry.id && handleDeleteNutrition(entry.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">No nutrition entries yet.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Start tracking your calories and protein by adding your first entry.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
