"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dumbbell, ArrowLeft, Trash2 } from "lucide-react"
import { mockRoutines, mockWorkoutHistory } from "@/lib/mock-data"
import { LineChart } from "@/components/ui/chart"

export default function TrackerPage() {
  const [activeWorkout, setActiveWorkout] = useState(null)
  const [workoutHistory, setWorkoutHistory] = useState(mockWorkoutHistory)

  const startWorkout = (routine) => {
    setActiveWorkout({
      routineId: routine.id,
      routineName: routine.name,
      date: new Date(),
      exercises: routine.exercises.map((ex) => ({
        ...ex,
        sets: Array(ex.sets)
          .fill()
          .map(() => ({ weight: "", reps: "", completed: false })),
      })),
    })
  }

  const completeWorkout = () => {
    setWorkoutHistory([activeWorkout, ...workoutHistory])
    setActiveWorkout(null)
  }

  // Sample data for the progress chart
  const chartData = [
    { name: "Week 1", Bench: 135, Squat: 185, Deadlift: 225 },
    { name: "Week 2", Bench: 145, Squat: 195, Deadlift: 235 },
    { name: "Week 3", Bench: 150, Squat: 205, Deadlift: 245 },
    { name: "Week 4", Bench: 155, Squat: 215, Deadlift: 255 },
    { name: "Week 5", Bench: 160, Squat: 225, Deadlift: 265 },
    { name: "Week 6", Bench: 165, Squat: 235, Deadlift: 275 },
  ]

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

        <h1 className="text-3xl font-bold mb-6">Workout Tracker</h1>

        <Tabs defaultValue={activeWorkout ? "active" : "start"} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="start">Start Workout</TabsTrigger>
            {activeWorkout && <TabsTrigger value="active">Active Workout</TabsTrigger>}
            <TabsTrigger value="history">Workout History</TabsTrigger>
            <TabsTrigger value="progress">Progress Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="start">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockRoutines.map((routine, index) => (
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
                      <p className="text-sm font-medium">Exercises: {routine.exercises.length}</p>
                      <p className="text-sm text-gray-500">Estimated time: {routine.exercises.length * 5} minutes</p>
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
          </TabsContent>

          {activeWorkout && (
            <TabsContent value="active">
              <Card>
                <CardHeader>
                  <CardTitle>{activeWorkout.routineName}</CardTitle>
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
                                <Label className="text-sm text-gray-500">Set {setIndex + 1}</Label>
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  placeholder="Weight"
                                  value={set.weight}
                                  onChange={(e) => {
                                    const newWorkout = { ...activeWorkout }
                                    newWorkout.exercises[exIndex].sets[setIndex].weight = e.target.value
                                    setActiveWorkout(newWorkout)
                                  }}
                                />
                              </div>
                              <div className="col-span-3">
                                <Input
                                  type="number"
                                  placeholder="Reps"
                                  value={set.reps}
                                  onChange={(e) => {
                                    const newWorkout = { ...activeWorkout }
                                    newWorkout.exercises[exIndex].sets[setIndex].reps = e.target.value
                                    setActiveWorkout(newWorkout)
                                  }}
                                />
                              </div>
                              <div className="col-span-4">
                                <Button
                                  variant={set.completed ? "default" : "outline"}
                                  className="w-full"
                                  onClick={() => {
                                    const newWorkout = { ...activeWorkout }
                                    newWorkout.exercises[exIndex].sets[setIndex].completed = !set.completed
                                    setActiveWorkout(newWorkout)
                                  }}
                                >
                                  {set.completed ? "Completed" : "Mark Complete"}
                                </Button>
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
                  <Button onClick={completeWorkout}>Complete Workout</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="history">
            <div className="space-y-6">
              {workoutHistory.length > 0 ? (
                workoutHistory.map((workout, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{workout.routineName}</CardTitle>
                          <CardDescription>
                            {new Date(workout.date).toLocaleDateString()} •{workout.exercises.length} exercises
                          </CardDescription>
                        </div>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {workout.exercises.map((ex, exIndex) => (
                          <div key={exIndex} className="border-b pb-4 last:border-0">
                            <h4 className="font-medium mb-2">{ex.name}</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              {ex.sets.map((set, setIndex) => (
                                <div key={setIndex} className="bg-gray-100 rounded p-2 text-center">
                                  <span className="text-gray-500">Set {setIndex + 1}:</span> {set.weight}lbs ×{" "}
                                  {set.reps} reps
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No workout history yet</p>
                  <Button variant="outline">Start Your First Workout</Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Strength Progress</CardTitle>
                <CardDescription>Track your strength gains over time for key exercises</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <LineChart
                    data={chartData}
                    index="name"
                    categories={["Bench", "Squat", "Deadlift"]}
                    colors={["#10b981", "#3b82f6", "#f97316"]}
                    yAxisWidth={40}
                    showLegend={true}
                    showXAxis={true}
                    showYAxis={true}
                    showGridLines={true}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-4">
                  <Select defaultValue="6weeks">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Time period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4weeks">Last 4 weeks</SelectItem>
                      <SelectItem value="6weeks">Last 6 weeks</SelectItem>
                      <SelectItem value="3months">Last 3 months</SelectItem>
                      <SelectItem value="6months">Last 6 months</SelectItem>
                      <SelectItem value="1year">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Exercises" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All exercises</SelectItem>
                      <SelectItem value="strength">Strength exercises</SelectItem>
                      <SelectItem value="upper">Upper body</SelectItem>
                      <SelectItem value="lower">Lower body</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
