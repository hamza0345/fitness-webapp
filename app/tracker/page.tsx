"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Trash2, Calendar, Plus } from "lucide-react"
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

// New interface for tracking food items
interface FoodItem {
  name: string;
  calories: number;
  protein: number;
}

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
  
  // New state for simplified nutrition tracking
  const [todayFoods, setTodayFoods] = useState<FoodItem[]>([])
  const [newFood, setNewFood] = useState<FoodItem>({
    name: '',
    calories: 0,
    protein: 0
  })
  const [todayTotals, setTodayTotals] = useState({
    calories: 0,
    protein: 0
  })
  const [nutritionHistory, setNutritionHistory] = useState<{
    date: string;
    calories: number;
    protein: number;
    foods: FoodItem[];
  }[]>([])
  
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
        
        // Process nutrition data for the new simplified view
        if (nutritionData && nutritionData.length > 0) {
          processNutritionHistory(nutritionData);
        }
      } catch (error) {
        console.error("Failed to fetch nutrition entries:", error);
        toast.error("Failed to load nutrition data");
      } finally {
        setLoading(prev => ({ ...prev, nutrition: false }));
      }
    };
    
    fetchData();
  }, [isAuthenticated]);
  
  // Process nutrition data to create history view and today's data
  const processNutritionHistory = (entries: NutritionEntry[]) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Find today's entry if exists
    const todayEntry = entries.find(entry => entry.date === today);
    
    if (todayEntry && todayEntry.notes) {
      try {
        // Parse the notes field which stores our food items as JSON
        const foodItems: FoodItem[] = JSON.parse(todayEntry.notes);
        setTodayFoods(foodItems);
        
        // Calculate today's totals
        const totals = foodItems.reduce((acc, food) => ({
          calories: acc.calories + food.calories,
          protein: acc.protein + food.protein
        }), { calories: 0, protein: 0 });
        
        setTodayTotals(totals);
      } catch (error) {
        console.error("Error parsing food items:", error);
        setTodayFoods([]);
      }
    } else {
      setTodayFoods([]);
      setTodayTotals({ calories: 0, protein: 0 });
    }
    
    // Build 7-day history
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(format(date, 'yyyy-MM-dd'));
    }
    
    const history = last7Days.map(date => {
      const entry = entries.find(e => e.date === date);
      
      if (entry) {
        let foods: FoodItem[] = [];
        try {
          foods = entry.notes ? JSON.parse(entry.notes) : [];
        } catch {
          foods = [];
        }
        
        return {
          date,
          calories: entry.calories,
          protein: entry.protein,
          foods
        };
      }
      
      return {
        date,
        calories: 0,
        protein: 0,
        foods: []
      };
    });
    
    setNutritionHistory(history);
  };
  
  // Start a new workout from a routine
  const startWorkout = (routine: RoutineWithEx) => {
    if (!routine || !routine.exercises) return;
    
    const workout: WorkoutSession = {
      routine: routine.id || undefined,
      name: routine.name || "New Workout",
      exercises: routine.exercises.map(ex => ({
        name: ex.name || "",
        sets: Array.from({ length: ex.sets || 1 }).map((_, setIdx) => ({
          weight: ex.weight || 0,
          reps: ex.reps || 0,
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

  // Handle food input changes
  const handleFoodChange = (field: keyof FoodItem, value: any) => {
    setNewFood({ ...newFood, [field]: value });
  };
  
  // Add a new food item to today's list
  const addFoodItem = async () => {
    if (!newFood.name || newFood.calories <= 0) {
      toast.error("Please enter a food name and calories");
      return;
    }
    
    // Add to today's foods
    const updatedFoods = [...todayFoods, newFood];
    setTodayFoods(updatedFoods);
    
    // Update today's totals
    const newTotals = {
      calories: todayTotals.calories + newFood.calories,
      protein: todayTotals.protein + newFood.protein
    };
    setTodayTotals(newTotals);
    
    // Save to backend
    try {
      setLoading(prev => ({ ...prev, nutrition: true }));
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingEntry = nutritionEntries.find(entry => entry.date === today);
      
      const nutritionData: NutritionEntry = {
        date: today,
        calories: newTotals.calories,
        protein: newTotals.protein,
        notes: JSON.stringify(updatedFoods)
      };
      
      if (existingEntry && existingEntry.id) {
        // Update existing entry
        await updateNutritionEntry(existingEntry.id, nutritionData);
        
        // Update local state
        const updatedEntries = nutritionEntries.map(entry => 
          entry.id === existingEntry.id ? { ...nutritionData, id: existingEntry.id } : entry
        );
        setNutritionEntries(updatedEntries);
        processNutritionHistory(updatedEntries);
      } else {
        // Create new entry
        const savedEntry = await createNutritionEntry(nutritionData);
        const updatedEntries = [savedEntry, ...nutritionEntries];
        setNutritionEntries(updatedEntries);
        processNutritionHistory(updatedEntries);
      }
      
      // Reset new food form
      setNewFood({
        name: '',
        calories: 0,
        protein: 0
      });
      
      toast.success("Food added successfully");
    } catch (error) {
      console.error("Failed to save nutrition entry:", error);
      toast.error("Failed to save food item");
    } finally {
      setLoading(prev => ({ ...prev, nutrition: false }));
    }
  };
  
  // Delete a food item from today
  const deleteFoodItem = async (index: number) => {
    const updatedFoods = todayFoods.filter((_, i) => i !== index);
    
    // Recalculate totals
    const newTotals = updatedFoods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein
    }), { calories: 0, protein: 0 });
    
    setTodayFoods(updatedFoods);
    setTodayTotals(newTotals);
    
    // Save to backend
    try {
      setLoading(prev => ({ ...prev, nutrition: true }));
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingEntry = nutritionEntries.find(entry => entry.date === today);
      
      if (existingEntry && existingEntry.id) {
        const nutritionData: NutritionEntry = {
          date: today,
          calories: newTotals.calories,
          protein: newTotals.protein,
          notes: JSON.stringify(updatedFoods)
        };
        
        await updateNutritionEntry(existingEntry.id, nutritionData);
        
        // Update local state
        const updatedEntries = nutritionEntries.map(entry => 
          entry.id === existingEntry.id ? { ...nutritionData, id: existingEntry.id } : entry
        );
        setNutritionEntries(updatedEntries);
        processNutritionHistory(updatedEntries);
        
        toast.success("Food item removed");
      }
    } catch (error) {
      console.error("Failed to update nutrition entry:", error);
      toast.error("Failed to remove food item");
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

  // Start a new empty workout
  const startEmptyWorkout = () => {
    const workout: WorkoutSession = {
      name: "Custom Workout",
      exercises: []
    };
    
    setActiveWorkout(workout);
  };
  
  // Add a new exercise to the active workout
  const addExerciseToWorkout = () => {
    if (!activeWorkout) return;
    
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises = [
      ...newWorkout.exercises, 
      {
        name: "New Exercise",
        sets: [
          {
            weight: 0,
            reps: 0,
            set_number: 1
          }
        ]
      }
    ];
    
    setActiveWorkout(newWorkout);
  };
  
  // Add a set to an exercise
  const addSetToExercise = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const newWorkout = { ...activeWorkout };
    const currentSets = newWorkout.exercises[exerciseIndex].sets;
    newWorkout.exercises[exerciseIndex].sets = [
      ...currentSets,
      {
        weight: currentSets[currentSets.length - 1]?.weight || 0,
        reps: currentSets[currentSets.length - 1]?.reps || 0,
        set_number: currentSets.length + 1
      }
    ];
    
    setActiveWorkout(newWorkout);
  };
  
  // Delete an exercise from the active workout
  const deleteExerciseFromWorkout = (exerciseIndex: number) => {
    if (!activeWorkout) return;
    
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises = newWorkout.exercises.filter((_, i) => i !== exerciseIndex);
    
    setActiveWorkout(newWorkout);
  };
  
  // Delete a set from an exercise
  const deleteSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    
    const newWorkout = { ...activeWorkout };
    newWorkout.exercises[exerciseIndex].sets = newWorkout.exercises[exerciseIndex].sets
      .filter((_, i) => i !== setIndex);
    
    // Renumber the remaining sets
    newWorkout.exercises[exerciseIndex].sets = newWorkout.exercises[exerciseIndex].sets
      .map((set, idx) => ({
        ...set,
        set_number: idx + 1
      }));
    
    // If all sets are removed, remove the exercise too
    if (newWorkout.exercises[exerciseIndex].sets.length === 0) {
      deleteExerciseFromWorkout(exerciseIndex);
      return;
    }
    
    setActiveWorkout(newWorkout);
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
            ) : (
              <div>
                <div className="mb-6 max-w-md">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Create Empty Workout</CardTitle>
                      <CardDescription className="text-sm">
                        Start a custom workout without a routine
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-xs text-gray-500">
                        Build your workout from scratch by adding exercises and sets
                      </p>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button className="w-full" onClick={startEmptyWorkout}>
                        Start Empty Workout
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                {routines.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Or select a routine:</h2>
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
                  </div>
                ) : (
                  <div className="text-center py-6 mt-6">
                    <p className="text-gray-500 mb-4">No routines found. You can create a routine or start with an empty workout.</p>
                    <Button asChild className="ml-2">
                      <Link href="/routines">Create Routine</Link>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Active Workout Tab */}
          {activeWorkout && (
            <TabsContent value="active">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>{activeWorkout.name}</CardTitle>
                  <CardDescription>Track your sets, reps, and weights for this workout</CardDescription>
                  </div>
                  <Button onClick={addExerciseToWorkout}>
                    <Plus className="h-4 w-4 mr-2" /> Add Exercise
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {activeWorkout.exercises.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No exercises added yet</p>
                        <Button onClick={addExerciseToWorkout}>
                          <Plus className="h-4 w-4 mr-2" /> Add Exercise
                        </Button>
                      </div>
                    ) : (
                      activeWorkout.exercises.map((exercise, exIndex) => (
                      <div key={exIndex} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex-1 mr-4">
                              <Input
                                value={exercise.name}
                                onChange={(e) => {
                                  const newWorkout = { ...activeWorkout };
                                  newWorkout.exercises[exIndex].name = e.target.value;
                                  setActiveWorkout(newWorkout);
                                }}
                                placeholder="Exercise Name"
                                className="font-medium"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => addSetToExercise(exIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Set
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => deleteExerciseFromWorkout(exIndex)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Column Headers */}
                          <div className="grid grid-cols-12 gap-4 mb-2 px-2">
                            <div className="col-span-2">
                              <Label className="text-sm text-gray-500">Set #</Label>
                            </div>
                            <div className="col-span-3">
                              <Label className="text-sm text-gray-500">Weight (kg)</Label>
                            </div>
                            <div className="col-span-3">
                              <Label className="text-sm text-gray-500">Reps</Label>
                            </div>
                            <div className="col-span-2"></div>
                          </div>

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
                                <div className="col-span-2">
                                <Button
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => deleteSetFromExercise(exIndex, setIndex)}
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
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveWorkout(null)}>
                    Cancel Workout
                  </Button>
                  <Button 
                    onClick={completeWorkout}
                    disabled={loading.workouts || activeWorkout.exercises.length === 0}
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

          {/* Simplified Nutrition Tracking Tab */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle>Simple Nutrition Tracker</CardTitle>
                <CardDescription>
                  {format(new Date(), 'MMMM d, yyyy')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Today's Totals */}
                  <div className="flex space-x-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center flex-1">
                      <p className="text-sm font-medium text-blue-600 mb-1">Today's Calories</p>
                      <p className="text-2xl font-bold text-blue-700">{todayTotals.calories}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center flex-1">
                      <p className="text-sm font-medium text-blue-600 mb-1">Today's Protein</p>
                      <p className="text-2xl font-bold text-blue-700">{todayTotals.protein}g</p>
                    </div>
                  </div>
                  
                  {/* Add Food Form */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Add Food</h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="food-name">Food Name</Label>
                        <Input
                          id="food-name"
                          value={newFood.name}
                          onChange={(e) => handleFoodChange('name', e.target.value)}
                          placeholder="e.g., Chicken Breast"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="food-calories">Calories</Label>
                          <Input
                            id="food-calories"
                            type="number"
                            value={newFood.calories || ''}
                            onChange={(e) => handleFoodChange('calories', Number(e.target.value))}
                            placeholder="kcal"
                          />
                        </div>
                        <div>
                          <Label htmlFor="food-protein">Protein (g)</Label>
                          <Input
                            id="food-protein"
                            type="number"
                            step="0.1"
                            value={newFood.protein || ''}
                            onChange={(e) => handleFoodChange('protein', Number(e.target.value))}
                            placeholder="grams"
                          />
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        onClick={addFoodItem}
                        disabled={loading.nutrition || !newFood.name || !newFood.calories}
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add Food
                      </Button>
                    </div>
                  </div>
                  
                  {/* Food Log */}
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-3">Today's Food Log</h3>
                    {loading.nutrition ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Loading nutrition data...</p>
                      </div>
                    ) : todayFoods.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-12 text-sm font-medium text-gray-500 mb-2">
                          <div className="col-span-5">Food</div>
                          <div className="col-span-3 text-center">Calories</div>
                          <div className="col-span-3 text-center">Protein</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {todayFoods.map((food, index) => (
                          <div key={index} className="grid grid-cols-12 items-center py-2 border-b last:border-0">
                            <div className="col-span-5">{food.name}</div>
                            <div className="col-span-3 text-center">{food.calories}</div>
                            <div className="col-span-3 text-center">{food.protein}g</div>
                            <div className="col-span-1 text-right">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => deleteFoodItem(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No food items logged today</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
