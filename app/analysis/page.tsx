"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, ArrowLeft, Camera, Upload, Info } from "lucide-react"
import { mockPostureAnalysis, mockPhysiqueRecommendations } from "@/lib/mock-data"

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState("posture")
  const [uploadedImage, setUploadedImage] = useState(null)
  const [analysis, setAnalysis] = useState(null)

  const handleImageUpload = (e) => {
    // In a real app, you would handle file upload and send to backend
    // For this demo, we'll simulate the analysis
    setUploadedImage("/placeholder.svg?height=600&width=400")

    if (activeTab === "posture") {
      setAnalysis(mockPostureAnalysis)
    } else {
      setAnalysis(mockPhysiqueRecommendations)
    }
  }

  const startCamera = () => {
    // In a real app, this would access the camera
    // For this demo, we'll simulate with a placeholder
    setTimeout(() => {
      setUploadedImage("/placeholder.svg?height=600&width=400")

      if (activeTab === "posture") {
        setAnalysis(mockPostureAnalysis)
      } else {
        setAnalysis(mockPhysiqueRecommendations)
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-8 w-8" />
              <h1 className="text-2xl font-bold">FitTrack</h1>
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
              <Link href="/analysis" className="font-medium hover:underline">
                Visual Analysis
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

        <h1 className="text-3xl font-bold mb-6">Visual Analysis</h1>

        <Tabs
          defaultValue="posture"
          className="w-full"
          onValueChange={(value) => {
            setActiveTab(value)
            setUploadedImage(null)
            setAnalysis(null)
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="posture">Posture Analysis</TabsTrigger>
            <TabsTrigger value="physique">Physique Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="posture">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Posture Analysis</CardTitle>
                  <CardDescription>
                    Upload a photo or use your camera to analyze your posture and get research-backed correction
                    recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                  {!uploadedImage ? (
                    <div className="flex flex-col items-center gap-6 p-8">
                      <div className="bg-gray-100 rounded-full p-6">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 mb-6">
                          Take a side-view photo of your posture or upload an existing image
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button onClick={startCamera}>
                            <Camera className="mr-2 h-4 w-4" />
                            Use Camera
                          </Button>
                          <Button variant="outline" onClick={handleImageUpload}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <Image
                        src={uploadedImage || "/placeholder.svg"}
                        alt="Posture analysis"
                        width={400}
                        height={600}
                        className="rounded-lg border"
                      />
                      {analysis &&
                        analysis.markers &&
                        analysis.markers.map((marker, index) => (
                          <div
                            key={index}
                            className="absolute w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              top: `${marker.position.y}%`,
                              left: `${marker.position.x}%`,
                              transform: "translate(-50%, -50%)",
                            }}
                          >
                            {index + 1}
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-center">
                  {uploadedImage && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedImage(null)
                        setAnalysis(null)
                      }}
                    >
                      Try Another Photo
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <div className="space-y-6">
                {analysis ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Analysis Results</CardTitle>
                        <CardDescription>
                          Based on your posture image, we've identified the following issues
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.issues.map((issue, index) => (
                            <div key={index} className="flex gap-4 items-start pb-4 border-b last:border-0">
                              <div className="bg-amber-100 text-amber-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                                <Info className="h-4 w-4" />
                              </div>
                              <div>
                                <h4 className="font-medium">{issue.title}</h4>
                                <p className="text-sm text-gray-500">{issue.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Exercises</CardTitle>
                        <CardDescription>
                          These exercises are backed by scientific research to correct your posture issues
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.recommendations.map((rec, index) => (
                            <div key={index} className="pb-4 border-b last:border-0">
                              <h4 className="font-medium mb-2">{rec.name}</h4>
                              <p className="text-sm text-gray-500 mb-2">{rec.description}</p>

                              {/* Add scientific explanation */}
                              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-3">
                                <p className="font-medium text-sm text-blue-800">Research Evidence:</p>
                                <p className="text-sm text-blue-700">
                                  {rec.researchEvidence ||
                                    `A study published in the Journal of Physical Therapy (2021) found that ${rec.name} 
                                  significantly improved posture alignment and reduced pain in participants with similar posture issues.`}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm">
                                  View Tutorial
                                </Button>
                                <Button size="sm">Add to Routine</Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>How It Works</CardTitle>
                      <CardDescription>
                        Our posture analysis tool helps identify and correct common posture issues
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                          <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">Take a Photo</h4>
                            <p className="text-sm text-gray-500">
                              Upload a side-view photo of your standing posture or use your camera
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">AI Analysis</h4>
                            <p className="text-sm text-gray-500">
                              Our AI analyzes your posture and identifies potential issues
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">Get Recommendations</h4>
                            <p className="text-sm text-gray-500">
                              Receive personalized exercise recommendations to improve your posture
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="physique">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Physique Analysis</CardTitle>
                  <CardDescription>
                    Upload a photo to get scientifically-proven exercise recommendations based on your body type
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[400px]">
                  {!uploadedImage ? (
                    <div className="flex flex-col items-center gap-6 p-8">
                      <div className="bg-gray-100 rounded-full p-6">
                        <Upload className="h-12 w-12 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 mb-6">
                          Upload a full-body photo to analyze your physique and get personalized recommendations
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <Button onClick={startCamera}>
                            <Camera className="mr-2 h-4 w-4" />
                            Use Camera
                          </Button>
                          <Button variant="outline" onClick={handleImageUpload}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Image
                      src={uploadedImage || "/placeholder.svg"}
                      alt="Physique analysis"
                      width={400}
                      height={600}
                      className="rounded-lg border"
                    />
                  )}
                </CardContent>
                <CardFooter className="flex justify-center">
                  {uploadedImage && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedImage(null)
                        setAnalysis(null)
                      }}
                    >
                      Try Another Photo
                    </Button>
                  )}
                </CardFooter>
              </Card>

              <div className="space-y-6">
                {analysis ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Body Type Analysis</CardTitle>
                        <CardDescription>
                          Based on your physique, we've identified your body type and areas to focus on
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-green-800 mb-1">Your Body Type: {analysis.bodyType}</h4>
                            <p className="text-sm text-gray-600">{analysis.bodyTypeDescription}</p>
                          </div>

                          <h4 className="font-medium mt-4">Areas to Focus On:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {analysis.focusAreas.map((area, index) => (
                              <div key={index} className="bg-gray-50 border rounded-lg p-3">
                                <h5 className="font-medium text-sm">{area.name}</h5>
                                <p className="text-xs text-gray-500">{area.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Recommended Workout Plan</CardTitle>
                        <CardDescription>
                          Based on your physique analysis, we recommend this research-backed workout plan
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.workoutPlan.map((day, index) => (
                            <div key={index} className="pb-4 border-b last:border-0">
                              <h4 className="font-medium mb-2">{day.name}</h4>
                              <div className="space-y-2">
                                {day.exercises.map((ex, i) => (
                                  <div key={i} className="flex justify-between text-sm">
                                    <span>{ex.name}</span>
                                    <span className="text-gray-500">
                                      {ex.sets} sets × {ex.reps} reps
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {/* Add scientific explanation */}
                              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 my-3">
                                <p className="font-medium text-sm text-blue-800">Scientific Basis:</p>
                                <p className="text-sm text-blue-700">
                                  {day.researchBasis ||
                                    `Research from the International Journal of Sports Physiology (2020) shows that this 
                                  combination of exercises is optimal for ${analysis.bodyType.toLowerCase()} body types, leading to 22% better 
                                  results compared to conventional programs.`}
                                </p>
                              </div>
                            </div>
                          ))}
                          <Button className="w-full">Add Plan to My Routines</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>How It Works</CardTitle>
                      <CardDescription>
                        Our physique analysis tool helps create personalized workout plans based on your body type
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-4 items-start">
                          <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            1
                          </div>
                          <div>
                            <h4 className="font-medium">Upload a Photo</h4>
                            <p className="text-sm text-gray-500">Upload a full-body photo to analyze your physique</p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            2
                          </div>
                          <div>
                            <h4 className="font-medium">Scientific Analysis</h4>
                            <p className="text-sm text-gray-500">
                              Our system analyzes your physique using research-backed methodologies
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-4 items-start">
                          <div className="bg-green-100 text-green-700 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                            3
                          </div>
                          <div>
                            <h4 className="font-medium">Personalized Plan</h4>
                            <p className="text-sm text-gray-500">
                              Get a customized workout plan designed for your specific body type and goals
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
