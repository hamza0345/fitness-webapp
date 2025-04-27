"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, LineChart, Camera, ArrowRight, Code, BookOpen, Github } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  // Handle navigation to protected routes
  const handleProtectedNavigation = (e: React.MouseEvent, path: string) => {
    if (!isLoggedIn) {
      e.preventDefault();
      router.push("/register");
    } else {
      router.push(path);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen"> 
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-600 to-green-500 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Elevate Your Fitness Journey</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Track your workouts, get research-backed recommendations, and achieve your fitness goals with
              BodyBlueprint.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-green-600/20 bg-green-600/30"
              >
                Learn More
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Dumbbell className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Workout Routines</CardTitle>
                  <CardDescription>
                    Create and customize your workout routines based on your fitness goals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Input your current routine and get AI-powered suggestions to optimize your workouts for better
                    results.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => handleProtectedNavigation(e, "/routines")}
                  >
                    Explore Routines <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <LineChart className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>
                    Track your sets, reps, and weights to monitor your progress over time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Log your workouts and visualize your improvements with detailed charts and statistics.</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => handleProtectedNavigation(e, "/tracker")}
                  >
                    Start Tracking <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>

              <Card className="relative overflow-hidden border-2 border-green-500 shadow-lg">
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold">BETA</div>
                <CardHeader className="bg-green-50">
                  <Camera className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Rep Counter</CardTitle>
                  <CardDescription>
                    Automatically count your repetitions using computer vision technology
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Our computer vision technology counts your reps in real-time as you exercise.
                    <span className="text-sm text-gray-500 block mt-1">Currently supports bicep curls only.</span>
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={(e) => handleProtectedNavigation(e, "/rep-counter")}
                  >
                    Try Rep Counter <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">About BodyBlueprint</h2>

              <div className="space-y-8">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                  <p className="text-gray-700">
                    BodyBlueprint was created with a simple mission: to help fitness enthusiasts optimize their workout
                    routines using scientific research and technology. We believe that everyone deserves access to
                    research-backed exercise science to improve their fitness journey.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3">The Story Behind BodyBlueprint</h3>
                  <p className="text-gray-700 mb-4">
                    BodyBlueprint started as a university project with the goal of applying computer science to solve
                    real-world fitness problems. What began as an academic exercise has evolved into a comprehensive
                    platform that we plan to develop into a fully deployed web application.
                  </p>
                  <p className="text-gray-700">
                    Our focus isn't on creating new workout plans from scratch, but rather on improving existing
                    routines with scientifically-backed recommendations. We analyze your current workout program and
                    suggest evidence-based modifications to help you achieve better results.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <Code className="h-6 w-6 text-green-600 mb-2" />
                      <CardTitle className="text-lg">Technical Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>
                            <strong>Frontend:</strong> React with Next.js for a responsive, modern UI
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>
                            <strong>Backend:</strong> Django REST framework for robust API development
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>
                            <strong>Computer Vision:</strong> OpenCV and Python for rep counting and form analysis
                          </span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <BookOpen className="h-6 w-6 text-green-600 mb-2" />
                      <CardTitle className="text-lg">Scientific Approach</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>All recommendations based on peer-reviewed research</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>Exercise modifications supported by biomechanical analysis</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>Computer vision algorithms trained on proper exercise form</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                  <h3 className="text-xl font-bold text-blue-800 mb-3">Future Development</h3>
                  <p className="text-blue-700 mb-4">
                    BodyBlueprint is actively being developed with new features on the horizon. Our rep counter
                    technology is currently in beta, supporting bicep curls, with plans to expand to more exercises.
                    We're also working on enhanced form analysis, personalized workout recommendations, and integration
                    with wearable fitness devices.
                  </p>
                  <p className="text-blue-700">
                    What started as a university project is evolving into a comprehensive fitness platform that combines
                    exercise science with cutting-edge technology to help you achieve your fitness goals more
                    efficiently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-green-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fitness Routine?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join BodyBlueprint today and get scientifically-proven recommendations to achieve your fitness goals
              faster.
            </p>
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
              <Link href="/register">Get Started Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Dumbbell className="h-6 w-6" />
              <span className="text-xl font-bold">BodyBlueprint</span>
            </div>
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <a href="#" className="text-gray-400 hover:text-white">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Terms
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Privacy
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                Contact
              </a>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} BodyBlueprint. University Project. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
