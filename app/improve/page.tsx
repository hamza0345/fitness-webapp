"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dumbbell, ArrowLeft, CheckCircle, AlertCircle, ArrowRight, Beaker } from "lucide-react"
import { mockRoutines, mockExerciseImprovements } from "@/lib/mock-data"

export default function ImproveProgramPage() {
  const [selectedRoutine, setSelectedRoutine] = useState(null)
  const [analyzedRoutine, setAnalyzedRoutine] = useState(null)
  const [improvements, setImprovements] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [updatedExercises, setUpdatedExercises] = useState([])

  const handleSelectRoutine = (routine) => {
    setSelectedRoutine(routine)
    setAnalyzedRoutine(null)
    setImprovements([])
    setUpdatedExercises([])
  }

  const analyzeRoutine = () => {
    if (!selectedRoutine) return

    setIsAnalyzing(true)

    setTimeout(() => {
      setAnalyzedRoutine(selectedRoutine)

      const potentialImprovements = mockExerciseImprovements.filter((improvement) => {
        return (
          improvement.applicableFor.includes(selectedRoutine.primaryFocus) ||
          improvement.applicableFor.includes(selectedRoutine.fitnessLevel) ||
          selectedRoutine.exercises.some((ex) => improvement.replacesExercise === ex.name)
        )
      })

      setImprovements(potentialImprovements)
      setIsAnalyzing(false)
    }, 1500)
  }

  const applyImprovement = (improvement) => {
    setUpdatedExercises([...updatedExercises, improvement.id])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/" className="flex items-center text-green-600 hover:text-green-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Improve Your Program</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Select a Routine</CardTitle>
                <CardDescription>Choose a routine to analyze and improve</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockRoutines.map((routine, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRoutine?.id === routine.id ? "bg-green-50 border-green-500" : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleSelectRoutine(routine)}
                  >
                    <h3 className="font-medium">{routine.name}</h3>
                    <p className="text-sm text-gray-500">
                      {routine.primaryFocus} • {routine.fitnessLevel} Level
                    </p>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={analyzeRoutine} disabled={!selectedRoutine || isAnalyzing}>
                  {isAnalyzing ? "Analyzing..." : "Analyze Program"}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {analyzedRoutine ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Program Analysis: {analyzedRoutine.name}</CardTitle>
                    <CardDescription>Scientific analysis of your current workout routine</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <h3 className="font-medium text-blue-800 flex items-center">
                          <Beaker className="mr-2 h-5 w-5" />
                          Program Overview
                        </h3>
                        <p className="mt-2 text-sm text-blue-700">
                          Your {analyzedRoutine.primaryFocus}-focused, {analyzedRoutine.fitnessLevel}-level routine
                          contains {analyzedRoutine.exercises.length} exercises. Based on scientific research, we've
                          identified {improvements.length} potential improvements to optimize your results.
                        </p>
                      </div>

                      <h3 className="font-medium text-lg mt-4">Current Exercises:</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analyzedRoutine.exercises.map((exercise, index) => (
                          <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="font-medium">{exercise.name}</div>
                            <div className="text-sm text-gray-500">
                              {exercise.sets} sets × {exercise.reps} reps
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Suggested Improvements</CardTitle>
                    <CardDescription>Research-backed recommendations to enhance your program</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {improvements.length > 0 ? (
                      <div className="space-y-6">
                        {improvements.map((improvement, index) => (
                          <div key={index} className="border rounded-lg overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b">
                              <div className="flex justify-between items-start">
                                <h3 className="font-medium">{improvement.title}</h3>
                                {updatedExercises.includes(improvement.id) && (
                                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Applied
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{improvement.description}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                              <div className="p-4 border-r">
                                <h4 className="text-sm font-medium mb-2">Recommendation:</h4>
                                {improvement.replacesExercise && (
                                  <div className="flex items-center mb-2">
                                    <div className="text-sm text-gray-500">
                                      Replace: <span className="font-medium">{improvement.replacesExercise}</span>
                                    </div>
                                    <ArrowRight className="mx-2 h-4 w-4 text-gray-400" />
                                    <div className="text-sm text-green-600 font-medium">{improvement.newExercise}</div>
                                  </div>
                                )}
                                {improvement.addExercise && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Add: </span>
                                    <span className="text-green-600 font-medium">{improvement.addExercise}</span>
                                    <div className="text-gray-500 text-xs mt-1">
                                      {improvement.sets} sets × {improvement.reps} reps
                                    </div>
                                  </div>
                                )}
                                {improvement.modifyTechnique && (
                                  <div className="text-sm">
                                    <span className="text-gray-500">Modify: </span>
                                    <span className="text-green-600 font-medium">{improvement.modifyTechnique}</span>
                                  </div>
                                )}
                              </div>

                              <div className="p-4 bg-blue-50">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Scientific Explanation:</h4>
                                <p className="text-sm text-blue-700">{improvement.scientificExplanation}</p>
                                <p className="text-xs text-blue-600 mt-2 italic">
                                  Source: {improvement.researchSource}
                                </p>
                              </div>
                            </div>

                            <div className="p-3 bg-gray-50 border-t flex justify-end">
                              <Button
                                onClick={() => applyImprovement(improvement)}
                                disabled={updatedExercises.includes(improvement.id)}
                                size="sm"
                              >
                                {updatedExercises.includes(improvement.id) ? "Updated" : "Update Routine"}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>No improvements needed</AlertTitle>
                        <AlertDescription>
                          Your current program is well-balanced and follows scientific principles for optimal results.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Analyze Your Program</h3>
                  <p className="text-gray-500 mb-4 max-w-md">
                    Select a routine from the left and click "Analyze Program" to get research-backed recommendations
                    for improvement.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
