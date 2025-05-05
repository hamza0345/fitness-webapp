"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorkoutSession, getWorkoutSessions, addBicepCurlRepsToWorkout, WorkoutExercise, WorkoutSet } from '@/lib/api';
import { toast } from 'sonner';


interface CurlSetInfo {
  exerciseIndex: number;
  setIndex: number;
  exercise: WorkoutExercise;
  set: WorkoutSet;
}

interface WorkoutContextType {
  activeWorkout: WorkoutSession | null;
  setActiveWorkout: React.Dispatch<React.SetStateAction<WorkoutSession | null>>;
  workoutSessions: WorkoutSession[];
  setWorkoutSessions: React.Dispatch<React.SetStateAction<WorkoutSession[]>>;
  loading: boolean;
  addBicepCurls: (curls: number) => Promise<void>;
  findIncompleteCurlSet: () => CurlSetInfo | null;
  updateSetReps: (exerciseIndex: number, setIndex: number, reps: number) => void;
  markSetCompleted: (exerciseIndex: number, setIndex: number) => void;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Load workouts when component mounts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const sessions = await getWorkoutSessions();
        setWorkoutSessions(sessions);
      } catch (error) {
        console.error('Failed to fetch workout sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  // Function to find the first incomplete curl exercise set
  const findIncompleteCurlSet = (): CurlSetInfo | null => {
    if (!activeWorkout) return null;
    
    // Search through exercises to find any bicep curl variations
    for (let exerciseIndex = 0; exerciseIndex < activeWorkout.exercises.length; exerciseIndex++) {
      const exercise = activeWorkout.exercises[exerciseIndex];
      
      // Check if the exercise name contains any curl-related keywords
      const isCurlExercise = /\b(bicep|curl|curls)\b/i.test(exercise.name);
      
      if (isCurlExercise) {
        // Find the first incomplete set
        for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
          const set = exercise.sets[setIndex];
          
          if (!set.completed) {
            return {
              exerciseIndex,
              setIndex,
              exercise,
              set
            };
          }
        }
      }
    }
    
    return null;
  };

  // Function to update reps for a specific set
  const updateSetReps = (exerciseIndex: number, setIndex: number, reps: number) => {
    if (!activeWorkout) {
      return;
    }
    
    const newWorkout = { ...activeWorkout };
    const set = newWorkout.exercises[exerciseIndex].sets[setIndex];
    
    // Update the reps count with the exact value provided
    set.reps = reps;
    
    setActiveWorkout(newWorkout);
  };

  // Function to mark a set as completed
  const markSetCompleted = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return;
    
    const newWorkout = { ...activeWorkout };
    const set = newWorkout.exercises[exerciseIndex].sets[setIndex];
    
    // Mark as completed
    set.completed = true;
    
    setActiveWorkout(newWorkout);
  };

  // Function to add bicep curls to the active workout
  const addBicepCurls = async (curls: number) => {
    // First check if there's an active workout with an incomplete curl set
    const incompleteCurlSet = findIncompleteCurlSet();
    
    if (incompleteCurlSet) {
      // Update the incomplete set with the tracked rep count
      updateSetReps(incompleteCurlSet.exerciseIndex, incompleteCurlSet.setIndex, curls);
      markSetCompleted(incompleteCurlSet.exerciseIndex, incompleteCurlSet.setIndex);
      
      toast.success(`Added ${curls} reps to ${incompleteCurlSet.exercise.name}, Set ${incompleteCurlSet.set.set_number}`);
      return;
    }
    
    // If no active workout with incomplete curl set, use the API to add to existing workout
    if (!activeWorkout || !activeWorkout.id) {
      return;
    }

    try {
      setLoading(true);
      const updatedWorkout = await addBicepCurlRepsToWorkout(activeWorkout.id, curls);
      
      // Update the active workout and workout sessions
      setActiveWorkout(updatedWorkout);
      setWorkoutSessions(prev => 
        prev.map(session => 
          session.id === updatedWorkout.id ? updatedWorkout : session
        )
      );
      
      toast.success(`Added ${curls} reps to workout`);
    } catch (error) {
      console.error('Failed to add bicep curls to workout:', error);
      toast.error('Failed to update workout with bicep curls');
    } finally {
      setLoading(false);
    }
  };

  const value = {
    activeWorkout,
    setActiveWorkout,
    workoutSessions,
    setWorkoutSessions,
    loading,
    addBicepCurls,
    findIncompleteCurlSet,
    updateSetReps,
    markSetCompleted
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
} 