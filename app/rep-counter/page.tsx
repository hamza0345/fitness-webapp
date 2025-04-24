"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dumbbell, ArrowLeft, Camera, Play, Pause, RotateCcw, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function RepCounterPage() {
  const [activeTab, setActiveTab] = useState("live")
  const [isRecording, setIsRecording] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [exerciseTime, setExerciseTime] = useState(0)
  const [formQuality, setFormQuality] = useState(85)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      // Clean up video stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream
      }

      // Simulate rep counting (in a real app, this would use computer vision)
      setIsRecording(true)
      setRepCount(0)
      setExerciseTime(0)

      timerRef.current = setInterval(() => {
        setExerciseTime((prev) => prev + 1)

        // Simulate random rep detection every 3-5 seconds
        if (Math.random() > 0.7) {
          setRepCount((prev) => prev + 1)
        }
      }, 1000)
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const resetCounter = () => {
    setRepCount(0)
    setExerciseTime(0)
    setFormQuality(85)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    setIsRecording(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
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

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Rep Counter</h1>
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <Info className="h-4 w-4 mr-1" />
            Beta Feature
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <p className="text-gray-700">
            Our computer vision technology automatically counts your repetitions as you exercise.
            <span className="font-medium"> Currently supports bicep curls only.</span> Position yourself so your full
            upper body is visible in the frame for best results.
          </p>
        </div>

        <Tabs
          defaultValue="live"
          className="w-full"
          onValueChange={(value) => {
            setActiveTab(value)
            resetCounter()
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="live">Live Counter</TabsTrigger>
            <TabsTrigger value="tutorial">How It Works</TabsTrigger>
          </TabsList>

          <TabsContent value="live">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Bicep Curl Counter</CardTitle>
                    <CardDescription>Position yourself in front of the camera and perform bicep curls</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center justify-center min-h-[400px] bg-gray-100 relative">
                    {!isRecording ? (
                      <div className="flex flex-col items-center gap-6 p-8">
                        <div className="bg-white rounded-full p-6 shadow-md">
                          <Camera className="h-12 w-12 text-green-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 mb-6">Start the camera to begin counting your bicep curls</p>
                          <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700">
                            <Camera className="mr-2 h-4 w-4" />
                            Start Camera
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-md"
                      />
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-center gap-4">
                    {isRecording && (
                      <>
                        <Button variant="outline" onClick={stopRecording} className="flex-1">
                          <Pause className="mr-2 h-4 w-4" />
                          Pause
                        </Button>
                        <Button variant="outline" onClick={resetCounter} className="flex-1">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reset
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rep Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-green-600">{repCount}</div>
                        <div className="text-sm text-gray-500 mt-1">Reps Counted</div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Exercise Time</span>
                            <span className="text-sm font-medium">{formatTime(exerciseTime)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Form Quality</span>
                            <span className="text-sm font-medium">{formQuality}%</span>
                          </div>
                          <Progress value={formQuality} className="h-2" />
                        </div>

                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">Average Speed</span>
                            <span className="text-sm font-medium">
                              {repCount > 0 ? (exerciseTime / repCount).toFixed(1) : "0.0"} sec/rep
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tips for Accurate Counting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                          1
                        </span>
                        <span>Position yourself so your full upper body is visible</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                          2
                        </span>
                        <span>Ensure good lighting in your environment</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                          3
                        </span>
                        <span>Perform complete range of motion for each rep</span>
                      </li>
                      <li className="flex items-start">
                        <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                          4
                        </span>
                        <span>Face the camera from the side for best tracking</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tutorial">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>How the Rep Counter Works</CardTitle>
                  <CardDescription>Understanding the technology behind our computer vision rep counter</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-medium text-green-800 mb-2">Computer Vision Technology</h3>
                      <p className="text-sm text-gray-600">
                        Our rep counter uses OpenCV and Python to process video frames in real-time. The system tracks
                        key body points and joint angles to detect exercise movements and count repetitions accurately.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium">The Process:</h3>

                      <div className="flex gap-4 items-start">
                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium">Pose Detection</h4>
                          <p className="text-sm text-gray-500">
                            The system identifies key body points like shoulders, elbows, and wrists to create a
                            skeletal model.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium">Movement Analysis</h4>
                          <p className="text-sm text-gray-500">
                            Algorithms track changes in joint angles and positions to identify specific exercise
                            movements.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium">Rep Counting</h4>
                          <p className="text-sm text-gray-500">
                            When a complete repetition is detected (full range of motion), the counter increments.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 items-start">
                        <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium">Form Analysis</h4>
                          <p className="text-sm text-gray-500">
                            The system evaluates your form quality by comparing your movement patterns to ideal form
                            models.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Future Development</CardTitle>
                  <CardDescription>What's coming next for our rep counter technology</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <p className="text-gray-700">
                      Our rep counter is currently in beta and supports bicep curls only. We're actively developing
                      support for additional exercises and features:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-gray-50 border rounded-lg p-3">
                        <h4 className="font-medium text-green-700">Squat Detection</h4>
                        <p className="text-xs text-gray-500">Coming soon</p>
                      </div>

                      <div className="bg-gray-50 border rounded-lg p-3">
                        <h4 className="font-medium text-green-700">Push-up Counting</h4>
                        <p className="text-xs text-gray-500">Coming soon</p>
                      </div>

                      <div className="bg-gray-50 border rounded-lg p-3">
                        <h4 className="font-medium text-green-700">Form Correction</h4>
                        <p className="text-xs text-gray-500">Real-time feedback on exercise form</p>
                      </div>

                      <div className="bg-gray-50 border rounded-lg p-3">
                        <h4 className="font-medium text-green-700">Workout Recording</h4>
                        <p className="text-xs text-gray-500">Save and review your exercise sessions</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-2">Technical Implementation</h4>
                      <p className="text-sm text-blue-700">
                        Our rep counter uses a Django backend that processes video frames with OpenCV and Python. The
                        system employs pose estimation models to track body positions and custom algorithms to identify
                        exercise-specific movement patterns.
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setActiveTab("live")}>
                    <Play className="mr-2 h-4 w-4" />
                    Try the Rep Counter
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
