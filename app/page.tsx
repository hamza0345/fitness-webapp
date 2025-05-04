"use client";

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, LineChart, Camera, ArrowRight, Code, BookOpen, Github, Star, Sparkles } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  
  return (
    <div className="flex flex-col min-h-screen"> 
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary/60 text-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary/90">Elevate Your Fitness Journey</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Track your workouts, get research-backed recommendations, and achieve your fitness goals with
              BodyBlueprint.
            </p>
            <div className="flex justify-center">
              <Button size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground px-8">
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="text-primary">Key Features</span>
              <Sparkles className="inline-block ml-2 h-6 w-6 text-accent" />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <Dumbbell className="h-10 w-10 text-primary mb-2" />
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
                  <Link href="/routines" className="w-full">
                    <Button variant="outline" className="w-full">
                      Explore Routines <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <LineChart className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Progress Tracking</CardTitle>
                  <CardDescription>
                    Track your sets, reps, and weights to monitor your progress over time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Log your workouts and visualize your improvements with detailed charts and statistics.</p>
                </CardContent>
                <CardFooter>
                  <Link href="/tracker" className="w-full">
                    <Button variant="outline" className="w-full">
                      Start Tracking <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="relative overflow-hidden border-2 border-accent shadow-lg">
                <div className="absolute top-0 right-0 bg-accent text-accent-foreground px-3 py-1 text-xs font-bold">BETA</div>
                <CardHeader className="bg-secondary/30">
                  <Camera className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Rep Counter</CardTitle>
                  <CardDescription>
                    Automatically count your repetitions using computer vision technology
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Our computer vision technology counts your reps in real-time as you exercise.
                    <span className="text-sm text-muted-foreground block mt-1">Currently supports bicep curls only.</span>
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/rep-counter" className="w-full">
                    <Button variant="default" className="w-full">
                      Try Rep Counter <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-8">
                <Star className="inline-block mr-2 h-6 w-6 text-primary" fill="#f472b6" />
                <span className="text-foreground">About BodyBlueprint</span>
              </h2>

              <div className="space-y-8">
                <div className="bg-background p-6 rounded">
                  <h3 className="text-xl font-bold mb-3 text-primary">Our Mission</h3>
                  <p className="text-foreground">
                    BodyBlueprint was created with a simple mission: to help fitness enthusiasts optimize their workout
                    routines using scientific research and technology. We believe that everyone deserves access to
                    research-backed exercise science to improve their fitness journey.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 text-primary">The Story Behind BodyBlueprint</h3>
                  <p className="text-foreground mb-4">
                    BodyBlueprint started as a university project with the goal of applying computer science to solve
                    real-world fitness problems. What began as an academic exercise has evolved into a comprehensive
                    platform that we plan to develop into a fully deployed web application.
                  </p>
                  <p className="text-foreground">
                    Our focus isn't on creating new workout plans from scratch, but rather on improving existing
                    routines with scientifically-backed recommendations. We analyze your current workout program and
                    suggest evidence-based modifications to help you achieve better results.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <Code className="h-6 w-6 text-primary mb-2" />
                      <CardTitle className="text-lg">Technical Stack</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>
                            <strong>Frontend:</strong> React with Next.js for a responsive, modern UI
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>
                            <strong>Backend:</strong> Django REST framework for robust API development
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
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
                      <BookOpen className="h-6 w-6 text-primary mb-2" />
                      <CardTitle className="text-lg">Scientific Approach</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>All recommendations based on peer-reviewed research</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>Exercise modifications supported by biomechanical analysis</span>
                        </li>
                        <li className="flex items-start">
                          <span className="bg-primary/20 text-primary rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
                            •
                          </span>
                          <span>Computer vision algorithms trained on proper exercise form</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-accent/30 p-6 rounded border-2 border-accent/40">
                  <h3 className="text-xl font-bold text-accent-foreground mb-3">Future Development</h3>
                  <p className="text-accent-foreground mb-4">
                    BodyBlueprint is actively being developed with new features on the horizon. Our rep counter
                    technology is currently in beta, supporting bicep curls, with plans to expand to more exercises.
                    We're also working on enhanced form analysis, personalized workout recommendations, and integration
                    with wearable fitness devices.
                  </p>
                  <p className="text-accent-foreground">
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
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fitness Routine?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join BodyBlueprint today and get scientifically-proven recommendations to achieve your fitness goals
              faster.
            </p>
            <Button size="lg" className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              <Link href="/register">Get Started Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-secondary/70 text-secondary-foreground py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Dumbbell className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">BodyBlueprint</span>
            </div>
            <div className="text-sm">
              <p>© 2023 BodyBlueprint. All rights reserved.</p>
              <p className="mt-1">A university project demonstrating fitness technology.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
