"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dumbbell, Plus, ArrowLeft, Save } from "lucide-react"
import { mockRoutines, mockExercises, mockRecommendations } from "@/lib/mock-data"

export default function RoutinesPage() {
  const [routines, setRoutines] = useState(mockRoutines)
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  const handleSelectRoutine = (routine) => {
    setSelectedRoutine(routine)
    // Simulate fetching recommendations from database
    setRecommendations(
      mockRecommendations.filter(
        (rec) => rec.targetMuscleGroup === routine.primaryFocus || rec.fitnessLevel === routine.fitnessLevel,
      ),
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8" />
              <h1 className="text-2xl font-bold">BodyBlueprint</h1>
            </div>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="font-medium hover:underline">
                Home
              </Link>
              <Link href="/routines" className="font-medium hover:underline">
                My Routines
              </Link>
              <Link href="/tracker" className="font-medium hover:underline">
                Workout Tracker
              </Link>
              <Link href="/improve" className="font-medium hover:underline">
                Improve Program
              </Link>
              <Link href="/rep-counter" className="font-medium hover:underline">
                Rep Counter
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-green-600 hover:text-green-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">My Workout Routines</h1>

        <Tabs defaultValue="routines" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="routines">My Routines</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
            {selectedRoutine && <TabsTrigger value="recommendations">Recommendations</TabsTrigger>}
          </TabsList>

          <TabsContent value="routines">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {routines.map((routine, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{routine.name}</CardTitle>
                    <CardDescription>
                      {routine.primaryFocus} • {routine.fitnessLevel} Level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">{routine.description}</p>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Exercises:</p>
                      <ul className="text-sm list-disc pl-5">
                        {routine.exercises.map((ex, i) => (
                          <li key={i}>
                            {ex.name} - {ex.sets} sets × {ex.reps} reps
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => handleSelectRoutine(routine)}>
                      Get Research-Backed Recommendations
                    </Button>
                    <Button variant="ghost">Edit</Button>
                  </CardFooter>
                </Card>
              ))}

              <Card className="border-dashed border-2 hover:shadow-md transition-shadow flex flex-col items-center justify-center p-6">
                <Plus className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4 text-center">Create a new workout routine</p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Routine
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle>Create New Routine</CardTitle>
                <CardDescription>
                  Design your custom workout routine and get personalized recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="routine-name">Routine Name</Label>
                      <Input id="routine-name" placeholder="e.g., Upper Body Power" />
                    </div>

                    <div>
                      <Label htmlFor="fitness-level">Fitness Level</Label>
                      <Select>
                        <SelectTrigger id="fitness-level">
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="primary-focus">Primary Focus</Label>
                      <Select>
                        <SelectTrigger id="primary-focus">
                          <SelectValue placeholder="Select focus" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strength">Strength</SelectItem>
                          <SelectItem value="hypertrophy">Hypertrophy</SelectItem>
                          <SelectItem value="endurance">Endurance</SelectItem>
                          <SelectItem value="weight-loss">Weight Loss</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="routine-description">Description</Label>
                      <Textarea id="routine-description" placeholder="Describe your routine and goals" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Exercises</Label>
                    <div className="border rounded-md p-4 space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`exercise-${i}`}>Exercise {i}</Label>
                            <Select>
                              <SelectTrigger id={`exercise-${i}`}>
                                <SelectValue placeholder="Select exercise" />
                              </SelectTrigger>
                              <SelectContent>
                                {mockExercises.map((ex, idx) => (
                                  <SelectItem key={idx} value={ex.id}>
                                    {ex.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`sets-${i}`}>Sets</Label>
                              <Input id={`sets-${i}`} type="number" min="1" placeholder="3" />
                            </div>
                            <div>
                              <Label htmlFor={`reps-${i}`}>Reps</Label>
                              <Input id={`reps-${i}`} type="number" min="1" placeholder="10" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Exercise
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Routine
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations">
            {selectedRoutine && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-2">Recommendations for {selectedRoutine.name}</h2>
                  <p className="text-gray-600 mb-4">
                    Based on your {selectedRoutine.primaryFocus}-focused, {selectedRoutine.fitnessLevel}-level routine,
                    we recommend the following research-backed improvements:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendations.map((rec, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{rec.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p>{rec.description}</p>
                          {rec.suggestedExercises && (
                            <div className="mt-4">
                              <p className="font-medium mb-2">Suggested Exercises:</p>
                              <ul className="list-disc pl-5">
                                {rec.suggestedExercises.map((ex, i) => (
                                  <li key={i}>{ex}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Add scientific explanation section */}
                          <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                            <p className="font-medium text-sm text-blue-800 mb-1">Research Insights:</p>
                            <p className="text-sm text-blue-700">
                              {rec.researchInsight ||
                                "A 2022 study in the Journal of Strength and Conditioning Research found that " +
                                  rec.title.toLowerCase() +
                                  " can improve performance by up to 15% for " +
                                  selectedRoutine.primaryFocus +
                                  "-focused training programs."}
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" size="sm">
                            Apply to Routine
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
