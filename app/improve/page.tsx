"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { Label } from "@/components/ui/label"; // Import Label
import { Dumbbell, ArrowLeft, CheckCircle, AlertCircle, ArrowRight, Beaker, RefreshCw, Info } from "lucide-react";
import { getRoutines, analyzeRoutine, updateRoutineFull, RoutineWithEx, RoutineExercise, ImprovementSuggestion } from "@/lib/api"; // Import API functions and types
import { useToast } from "@/components/ui/use-toast"; // Import useToast

// Define preference options
const FOCUS_OPTIONS = [
  { value: "general_fitness", label: "General Fitness" },
  { value: "hypertrophy", label: "Muscle Growth (Hypertrophy)" },
  { value: "powerlifting", label: "Strength & Power" },
  { value: "injury_prevention", label: "Injury Prevention & Recovery" },
];

export default function ImproveProgramPage() {
  const [routines, setRoutines] = useState<RoutineWithEx[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithEx | null>(null);
  const [analysisResults, setAnalysisResults] = useState<ImprovementSuggestion[] | null>(null);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [updatedExercises, setUpdatedExercises] = useState<number[]>([]); // Store IDs of applied improvements (ImprovementRule IDs)

  // User Preferences State
  const [preferences, setPreferences] = useState<{ focus: string }>({
    focus: FOCUS_OPTIONS[0].value, // Default to General Fitness
  });

  const { toast } = useToast();

  // Fetch routines on component mount
  useEffect(() => {           
    const fetchUserRoutines = async () => {
      setIsLoadingRoutines(true);
      setError(null);
      try {
        const fetchedRoutines = await getRoutines();
        setRoutines(fetchedRoutines);
      } catch (err: any) {
        console.error("Failed to fetch routines:", err);
        setError("Failed to load your routines. Please try again later.");
        toast({
            title: "Error",
            description: err.message || "Could not fetch routines.",
            variant: "destructive",
        });
      } finally {
        setIsLoadingRoutines(false);
      }
    };

    fetchUserRoutines();
  }, [toast]); // Add toast to dependency array

  const handleSelectRoutine = (routine: RoutineWithEx) => {
    setSelectedRoutine(routine);
    setAnalysisResults(null); // Reset analysis when routine changes
    setUpdatedExercises([]); // Reset applied improvements
    setAnalysisError(null); // Reset analysis error
  };

  const handlePreferenceChange = (value: string) => {
     setPreferences({ focus: value });
     setAnalysisResults(null); // Reset analysis if preferences change after analysis
     setUpdatedExercises([]);
     setAnalysisError(null);
  };

  // Function to trigger analysis
  const runAnalysis = async () => {
    if (!selectedRoutine) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);
    setAnalysisError(null);
    setUpdatedExercises([]); // Reset applied status on new analysis

    try {
      const results = await analyzeRoutine(selectedRoutine.id!, preferences); // Pass selected routine ID and preferences
      setAnalysisResults(results);
       if (results.length === 0) {
           toast({
                title: "Analysis Complete",
                description: "Your program looks solid based on current rules! No specific improvements suggested.",
            });
       } else {
            toast({
                title: "Analysis Complete",
                description: `Found ${results.length} potential improvement(s).`,
            });
       }
    } catch (err: any) {
      console.error("Failed to analyze routine:", err);
      setAnalysisError(`Failed to analyze routine: ${err.message || 'Please try again.'}`);
      toast({
        title: "Analysis Error",
        description: err.message || "Could not analyze the routine.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Function to mark an improvement as 'applied' (client-side only for now)
  const applyImprovement = async (improvementId: number) => {
    if (!selectedRoutine || !analysisResults) return;
    
    // Find the improvement suggestion by ID
    const improvement = analysisResults.find(imp => imp.id === improvementId);
    if (!improvement) {
      toast({
        title: "Error",
        description: "Could not find improvement details.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get a fresh copy of the routine to update
      const routineToUpdate = {...selectedRoutine};
      
      // Handle different action types
      if (improvement.action_type === 'replace' && improvement.trigger_exercise_name && improvement.newExercise) {
        // Find the exercise to replace
        const exerciseIndex = routineToUpdate.exercises.findIndex(
          ex => ex.name.toLowerCase() === improvement.trigger_exercise_name.toLowerCase()
        );
        
        if (exerciseIndex >= 0) {
          // Replace the exercise name but keep other properties like sets, reps, weight
          routineToUpdate.exercises[exerciseIndex] = {
            ...routineToUpdate.exercises[exerciseIndex],
            name: improvement.newExercise
          };
          
          // Update the routine
          await updateRoutineFull(routineToUpdate.id!, routineToUpdate);
          
          // Update local state
          setRoutines(prev => prev.map(r => r.id === routineToUpdate.id ? routineToUpdate : r));
          setSelectedRoutine(routineToUpdate);
          
          // Mark as applied
          setUpdatedExercises([...updatedExercises, improvementId]);
          
          toast({
            title: "Improvement Applied",
            description: `Successfully replaced "${improvement.trigger_exercise_name}" with "${improvement.newExercise}"`,
          });
        } else {
          toast({
            title: "Warning",
            description: `Could not find exercise "${improvement.trigger_exercise_name}" in the routine.`,
            variant: "destructive",
          });
        }
      } else if (improvement.action_type === 'add' && improvement.addExercise) {
        // Add the suggested exercise
        const newExercise: RoutineExercise = {
          name: improvement.addExercise,
          sets: improvement.sets ? parseInt(improvement.sets) : 3, // default to 3 sets
          reps: improvement.reps ? parseInt(improvement.reps) : 10, // default to 10 reps
          weight: 0, // default weight
          order: routineToUpdate.exercises.length // Add at the end
        };
        
        routineToUpdate.exercises.push(newExercise);
        
        // Update the routine
        await updateRoutineFull(routineToUpdate.id!, routineToUpdate);
        
        // Update local state
        setRoutines(prev => prev.map(r => r.id === routineToUpdate.id ? routineToUpdate : r));
        setSelectedRoutine(routineToUpdate);
        
        // Mark as applied
        setUpdatedExercises([...updatedExercises, improvementId]);
        
        toast({
          title: "Improvement Applied",
          description: `Successfully added "${improvement.addExercise}" to your routine.`,
        });
      } else {
        // Handle other action types or invalid data
        setUpdatedExercises([...updatedExercises, improvementId]);
        toast({
          title: "Improvement Marked",
          description: "This type of improvement requires manual application. Please update your routine accordingly.",
        });
      }
    } catch (err: any) {
      console.error("Failed to apply improvement:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to apply improvement to routine.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-primary hover:underline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Improve Your Program</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Routine Selection & Preferences */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Select Routine</CardTitle>
                <CardDescription>Choose a routine to analyze.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-h-60 overflow-y-auto">
                {isLoadingRoutines ? (
                  <div className="flex items-center justify-center p-4">
                    <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading routines...
                  </div>
                ) : error ? (
                   <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Routines</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : routines.length === 0 ? (
                     <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>No Routines Found</AlertTitle>
                        <AlertDescription>
                            You haven't created any routines yet.{" "}
                            <Link href="/routines" className="font-medium text-primary hover:underline">Create one now!</Link>
                        </AlertDescription>
                    </Alert>
                ) : (
                  routines.map((routine) => (
                    <div
                      key={routine.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRoutine?.id === routine.id
                          ? "bg-muted border-primary ring-1 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleSelectRoutine(routine)}
                    >
                      <h3 className="font-medium">{routine.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {/* Display inferred/placeholder focus and level */}
                        Focus: {routine.primaryFocus || 'N/A'} • Level: {routine.fitnessLevel || 'N/A'}
                      </p>
                       <p className="text-xs text-muted-foreground mt-1">
                           {routine.exercises.length} exercises
                       </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>2. Select Focus</CardTitle>
                    <CardDescription>Tailor suggestions to your primary goal.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-2">
                        <Label htmlFor="focus-select">Primary Training Goal</Label>
                        <Select
                            value={preferences.focus}
                            onValueChange={handlePreferenceChange}
                            disabled={!selectedRoutine || isAnalyzing}
                        >
                            <SelectTrigger id="focus-select">
                                <SelectValue placeholder="Select your focus..." />
                            </SelectTrigger>
                            <SelectContent>
                                {FOCUS_OPTIONS.map(option => (
                                     <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                 <CardFooter>
                    <Button
                        className="w-full"
                        onClick={runAnalysis}
                        disabled={!selectedRoutine || isAnalyzing || isLoadingRoutines}
                    >
                        {isAnalyzing ? (
                            <> <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Analyzing... </>
                        ) : (
                            "Analyze Program"
                        )}
                    </Button>
                </CardFooter>
            </Card>
          </div>

          {/* Column 2: Analysis Results */}
          <div className="lg:col-span-2">
            {selectedRoutine && !isAnalyzing && analysisResults !== null ? (
              // --- Analysis Results Display ---
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Program Analysis: {selectedRoutine.name}</CardTitle>
                    <CardDescription>
                      Analysis based on '{FOCUS_OPTIONS.find(o => o.value === preferences.focus)?.label}' focus.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                       <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                            <h3 className="font-medium text-blue-800 dark:text-blue-300 flex items-center">
                                <Beaker className="mr-2 h-5 w-5" />
                                Analysis Summary
                            </h3>
                            <p className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                                Your routine contains {selectedRoutine.exercises.length} exercises.
                                Based on scientific principles and your selected focus, we've identified{' '}
                                <span className="font-semibold">{analysisResults.length}</span> potential improvement(s).
                            </p>
                       </div>

                       {/* Optionally display current exercises again if needed */}
                        {/*
                        <h3 className="font-medium text-lg mt-4">Current Exercises:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedRoutine.exercises.map((exercise, index) => (
                            <div key={index} className="p-3 bg-muted/50 rounded-lg border">
                                <div className="font-medium">{exercise.name}</div>
                                <div className="text-sm text-muted-foreground">
                                {exercise.sets} sets × {exercise.reps} reps
                                </div>
                            </div>
                            ))}
                        </div>
                        */}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Suggested Improvements</CardTitle>
                    <CardDescription>Research-backed recommendations to enhance your program</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {analysisResults.length > 0 ? (
                      <div className="space-y-6">
                        {analysisResults.map((improvement) => (
                          <div key={improvement.id} className="border rounded-lg overflow-hidden bg-card">
                            <div className="p-4 bg-muted/30 border-b">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-medium">{improvement.title}</h3>
                                {updatedExercises.includes(improvement.id) && (
                                  <span className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs px-2 py-1 rounded-full flex items-center flex-shrink-0">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Applied
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{improvement.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                              {/* Left side: Recommendation Details */}
                              <div className="p-4 border-r-0 md:border-r">
                                <h4 className="text-sm font-medium mb-2">Recommendation:</h4>
                                {/* REPLACE */}
                                {improvement.action_type === 'replace' && improvement.replacesExercise && improvement.newExercise && (
                                  <div className="flex flex-col sm:flex-row sm:items-center mb-2 space-y-1 sm:space-y-0">
                                    <div className="text-sm text-muted-foreground line-through">
                                       {improvement.replacesExercise}
                                    </div>
                                    <ArrowRight className="mx-2 h-4 w-4 text-muted-foreground hidden sm:inline-block" />
                                     <span className="sm:hidden text-xs text-muted-foreground">replaced by</span>
                                    <div className="text-sm text-green-600 dark:text-green-400 font-medium">{improvement.newExercise}</div>
                                  </div>
                                )}
                                 {/* ADD */}
                                {improvement.action_type === 'add' && improvement.addExercise && (
                                  <div className="text-sm mb-2">
                                    <span className="text-muted-foreground">Add: </span>
                                    <span className="text-green-600 dark:text-green-400 font-medium">{improvement.addExercise}</span>
                                    {(improvement.sets || improvement.reps) && (
                                        <div className="text-muted-foreground text-xs mt-1">
                                            ({improvement.sets || 'Recommended'} sets × {improvement.reps || 'Recommended'} reps)
                                        </div>
                                    )}
                                  </div>
                                )}
                                {/* MODIFY */}
                                {improvement.action_type === 'modify_technique' && improvement.replacesExercise && improvement.modifyTechnique && (
                                   <div className="text-sm mb-2">
                                      <span className="text-muted-foreground">Modify Technique for: </span>
                                      <span className="font-medium">{improvement.replacesExercise}</span>
                                       <p className="text-xs text-muted-foreground mt-1 italic">{improvement.modifyTechnique}</p>
                                  </div>
                                )}
                              </div>

                              {/* Right side: Scientific Explanation */}
                              <div className="p-4 bg-blue-50 dark:bg-blue-900/30">
                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Scientific Explanation:</h4>
                                <p className="text-sm text-blue-700 dark:text-blue-400">{improvement.scientificExplanation}</p>
                                {improvement.researchSource && (
                                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-2 italic">
                                        Source: {improvement.researchSource}
                                    </p>
                                )}
                              </div>
                            </div>

                            <div className="p-3 bg-muted/30 border-t flex justify-end">
                              <Button
                                onClick={() => applyImprovement(improvement.id)}
                                disabled={updatedExercises.includes(improvement.id)}
                                size="sm"
                                variant={updatedExercises.includes(improvement.id) ? "secondary" : "default"}
                              >
                                {updatedExercises.includes(improvement.id) ? (
                                    <> <CheckCircle className="h-4 w-4 mr-1" /> Applied </>
                                ) : (
                                    "Mark as Applied" // Changed text for clarity as it doesn't auto-update routine
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                        // No improvements found message
                        <Alert className="border-green-300 dark:border-green-700">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <AlertTitle className="text-green-800 dark:text-green-300">No Specific Improvements Needed</AlertTitle>
                            <AlertDescription className="text-green-700 dark:text-green-400">
                                Based on the current rules and your '{FOCUS_OPTIONS.find(o => o.value === preferences.focus)?.label}' focus,
                                your program appears well-structured. Keep up the great work!
                            </AlertDescription>
                        </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : analysisError ? (
                 // --- Analysis Error Display ---
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Analysis Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error During Analysis</AlertTitle>
                            <AlertDescription>{analysisError}</AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                         <Button
                            onClick={runAnalysis}
                            disabled={!selectedRoutine || isAnalyzing}
                            variant="outline"
                        >
                             <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                         </Button>
                    </CardFooter>
                </Card>
            ) : isAnalyzing ? (
                 // --- Analyzing State ---
                 <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg text-center">
                     <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                     <h3 className="text-lg font-medium mb-1">Analyzing Your Program...</h3>
                     <p className="text-muted-foreground max-w-md">
                         Please wait while we analyze '{selectedRoutine?.name}' based on your '{FOCUS_OPTIONS.find(o => o.value === preferences.focus)?.label}' focus.
                    </p>
                 </div>
             ) : (
              // --- Initial Placeholder ---
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Dumbbell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">Analyze Your Program</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Select a routine and your primary training focus, then click "Analyze Program" to get research-backed recommendations.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}