"use client";

/*
  AnalysisPage now offers two computer‑vision features:
  1. Rep Counter – detects and counts biceps‑curl repetitions from webcam or uploaded video
  2. Live Posture – real‑time posture feedback overlay (shoulders / spine alignment)

  ‑ Uses shadcn/ui + lucide‑react icons (consistent with rest of app)
  ‑ Still mock‑powered for now: call placeholders `mockRepCount` and `mockLivePostureFeedback`
*/

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Button,
} from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dumbbell,
  ArrowLeft,
  Camera,
  Upload,
  PlayCircle,
  Video,
} from "lucide-react";
import { mockRepCount, mockLivePostureFeedback } from "@/lib/mock-data";

export default function AnalysisPage() {
  const [activeTab, setActiveTab] = useState<"reps" | "posture">("reps");
  const [uploadedMedia, setUploadedMedia] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleMediaUpload = () => {
    // TODO: integrate with backend CV endpoint
    setUploadedMedia("/placeholder.svg?height=400&width=400");
    if (activeTab === "reps") setResult(mockRepCount);
    else setResult(mockLivePostureFeedback);
  };

  const startCamera = () => {
    // TODO: access webcam and stream to backend
    setUploadedMedia("/placeholder.svg?height=400&width=400");
    if (activeTab === "reps") setResult(mockRepCount);
    else setResult(mockLivePostureFeedback);
  };

  /** Shared reset */
  const reset = () => {
    setUploadedMedia(null);
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white py-6">
        <div className="container mx-auto px-4 flex justify-between items-center">
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
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-2 text-green-600 hover:text-green-700">
          <ArrowLeft className="h-4 w-4" />
          <Link href="/">Back to Home</Link>
        </div>

        <h1 className="text-3xl font-bold mb-6">Visual Analysis</h1>

        <Tabs
          defaultValue="reps"
          className="w-full"
          onValueChange={(v) => {
            setActiveTab(v as any);
            reset();
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="reps">Rep Counter (Bicep Curl)</TabsTrigger>
            <TabsTrigger value="posture">Live Posture</TabsTrigger>
          </TabsList>

          {/* ── Rep Counter Tab ───────────────────────────────────────── */}
          <TabsContent value="reps">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Bicep‑Curl Rep Counter</CardTitle>
                  <CardDescription>
                    Upload a short video or use your webcam. Our model will count completed
                    repetitions and show tempo insights.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                  {!uploadedMedia ? (
                    <div className="flex flex-col items-center gap-6 p-8">
                      <div className="bg-gray-100 p-6 rounded-full">
                        <Video className="h-12 w-12 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-6 text-center">
                        Record or upload yourself performing standing dumbbell bicep curls.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={startCamera}>
                          <Camera className="mr-2 h-4 w-4" />
                          Use Webcam
                        </Button>
                        <Button variant="outline" onClick={handleMediaUpload}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Video
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={uploadedMedia}
                        alt="rep‑preview"
                        width={400}
                        height={300}
                        className="rounded border"
                      />
                      {result && (
                        <div className="mt-6 text-center">
                          <p className="text-4xl font-bold text-green-600">{result.count}</p>
                          <p className="text-sm text-gray-600">reps detected</p>
                          <p className="text-xs text-gray-500 mt-2">Tempo avg: {result.tempo}s</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                <CardFooter className="justify-center">
                  {uploadedMedia && (
                    <Button variant="outline" onClick={reset}>
                      Analyse Another Set
                    </Button>
                  )}
                </CardFooter>
              </Card>

              {/* Info or results sidebar */}
              <div className="space-y-6">
                {result ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Form Tips</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                      <p>Keep elbows pinned to your sides.</p>
                      <p>Control eccentric phase (2‑3 s lowering).</p>
                      <p>Full extension for each rep for maximum ROM.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>How Rep Counter Works</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-2">
                      <p>
                        A lightweight pose‑estimation model tracks wrist & elbow angles to identify a
                        full curl cycle. Tempo is computed from frame timestamps.
                      </p>
                      <p>
                        For best accuracy, film from the side with good lighting and ensure the whole
                        arm is visible.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Live Posture Tab ─────────────────────────────────────── */}
          <TabsContent value="posture">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Live Posture Feedback</CardTitle>
                  <CardDescription>
                    Stream your webcam to get real‑time cues on head, shoulder & pelvis alignment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                  {!uploadedMedia ? (
                    <div className="flex flex-col items-center gap-6 p-8">
                      <div className="bg-gray-100 p-6 rounded-full">
                        <Camera className="h-12 w-12 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-6 text-center">
                        Position yourself side‑on, press start, and stand still for 3 seconds.
                      </p>
                      <Button onClick={startCamera}>
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Start Live Feedback
                      </Button>
                    </div>
                  ) : (
                    <Image
                      src={uploadedMedia}
                      alt="live‑posture‑preview"
                      width={400}
                      height={300}
                      className="rounded border"
                    />
                  )}
                </CardContent>
                <CardFooter className="justify-center">
                  {uploadedMedia && <Button variant="outline" onClick={reset}>Reset</Button>}
                </CardFooter>
              </Card>

              <div className="space-y-6">
                {result ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Alignment Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-600">
                      <p>Head tilt: {result.headTilt}°</p>
                      <p>Shoulder angle: {result.shoulderAngle}°</p>
                      <p>Pelvis angle: {result.pelvisAngle}°</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Why Posture Matters</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-gray-600 space-y-2">
                      <p>
                        Poor posture can reduce force output, limit joint ROM and increase overuse
                        injury risk. Visual feedback is one of the fastest ways to correct it.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
