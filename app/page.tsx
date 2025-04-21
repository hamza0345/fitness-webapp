import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dumbbell, LineChart, Camera, ArrowRight } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
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
            <Button variant="outline" className="bg-white text-green-600 hover:bg-green-50">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-green-600 to-green-500 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Elevate Your Fitness Journey</h1>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Track your workouts, get research-backed recommendations, and achieve your fitness goals with FitTrack.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-green-600/20">
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
                  <Link href="/routines">
                    <Button variant="outline" className="w-full">
                      Explore Routines <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
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
                  <Link href="/tracker">
                    <Button variant="outline" className="w-full">
                      Start Tracking <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              <Card className="relative overflow-hidden border-2 border-green-500 shadow-lg">
                <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-bold">
                  FEATURED
                </div>
                <CardHeader className="bg-green-50">
                  <Camera className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>Visual Analysis</CardTitle>
                  <CardDescription>
                    Get posture correction and physique recommendations through research-backed visual analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>
                    Upload photos or use real-time analysis to receive personalized exercise recommendations based on
                    scientific research and proven methodologies.
                  </p>
                </CardContent>
                <CardFooter>
                  <Link href="/analysis">
                    <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">
                      Try Analysis <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-green-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Fitness Routine?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join FitTrack today and get scientifically-proven recommendations to achieve your fitness goals faster.
            </p>
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
              Get Started Now
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Dumbbell className="h-6 w-6" />
              <span className="text-xl font-bold">FitTrack</span>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} FitTrack. University Project. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
