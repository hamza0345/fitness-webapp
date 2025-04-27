/* app/rep-counter/page.tsx */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Camera,
  Play,
  Pause,
  RotateCcw,
  Info,
  Loader2,
  AlertCircle,
  Bug
} from "lucide-react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";
import useAuthGuard from "@/hooks/useAuthGuard";

/* ---- landmark indices ---- */
const LEFT_SHOULDER = 11;
const LEFT_ELBOW = 13;
const LEFT_WRIST = 15;

export default function RepCounterPage() {
  // Call useAuthGuard to redirect if user is not authenticated
  const isAuthenticated = useAuthGuard();

  /* ---------- state ---------- */
  const [activeTab, setActiveTab] = useState("live");
  const [isCameraStarted, setIsCameraStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(true);
  const [repCount, setRepCount] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [formQuality, setFormQuality] = useState(85);
  const [curlStage, setCurlStage] = useState<"down" | "up" | null>(null);
  const [lastAngle, setLastAngle] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  /* ---------- refs ---------- */
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);
  const timerRef   = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef<number | null>(null);

  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const drawingUtilsRef   = useRef<DrawingUtils | null>(null);

  let lastVideoTime = -1;

  /* ---------- load model on mount ---------- */
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingModel(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_lite.task",
              delegate: "GPU"
            },
            runningMode: "VIDEO",
            numPoses: 1,
            minPoseDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          }
        );
        console.log("Pose Landmarker loaded");
      } catch (err) {
        console.error("Model load error:", err);
      } finally {
        setIsLoadingModel(false);
      }
    })();

    return () => {
      stopProcessingAndCamera();
      poseLandmarkerRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- helpers ---------- */
  const calculateAngle = (
    a: { x: number; y: number },
    b: { x: number; y: number },
    c: { x: number; y: number }
  ) => {
    const radians =
      Math.atan2(c.y - b.y, c.x - b.x) -
      Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
  };

  /* ---------- main loop ---------- */
  const predictWebcam = useCallback(() => {
    if (
      !isProcessing ||
      !videoRef.current ||
      !poseLandmarkerRef.current ||
      !canvasRef.current
    ) {
      requestRef.current = null;
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    /* create DrawingUtils lazily when canvas is ready */
    if (!drawingUtilsRef.current) {
      const ctx2d = canvas.getContext("2d");
      if (ctx2d) drawingUtilsRef.current = new DrawingUtils(ctx2d);
    }
    const drawingUtils = drawingUtilsRef.current;
    if (!drawingUtils) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    /* keep canvas size in sync */
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      console.log(`Canvas resized to ${canvas.width}x${canvas.height}`);
    }

    const ctx = canvas.getContext("2d")!;
    
    // Draw the video frame on the canvas first
    if (video.readyState >= 2) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Only process new frames
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        
        try {
          const res = poseLandmarkerRef.current.detectForVideo(
            video,
            performance.now()
          );
  
          if (res.landmarks?.length) {
            const lms = res.landmarks[0];
            
            // Draw landmarks and connections
            drawingUtils.drawLandmarks(lms, {
              radius: d => DrawingUtils.lerp(d.from!.z, -0.15, 0.1, 5, 1),
              color: "#4ade80"
            });
            drawingUtils.drawConnectors(
              lms,
              PoseLandmarker.POSE_CONNECTIONS,
              { color: "#3b82f6" }
            );
  
            if (
              lms[LEFT_SHOULDER] &&
              lms[LEFT_ELBOW] &&
              lms[LEFT_WRIST] &&
              lms[LEFT_SHOULDER].visibility! > 0.5 &&
              lms[LEFT_ELBOW].visibility! > 0.5 &&
              lms[LEFT_WRIST].visibility! > 0.5
            ) {
              const angle = calculateAngle(
                lms[LEFT_SHOULDER],
                lms[LEFT_ELBOW],
                lms[LEFT_WRIST]
              );
              setLastAngle(angle);
  
              if (angle > 160 && curlStage !== "down") setCurlStage("down");
              if (angle < 50 && curlStage === "down") {
                setCurlStage("up");
                setRepCount(prev => prev + 1);
              }
            } else {
              setLastAngle(null);
            }
          } else {
            setLastAngle(null);
          }
        } catch (err) {
          console.error("Error in pose detection:", err);
        }
      }
    }

    if (isProcessing) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [isProcessing, curlStage, calculateAngle]);

  /* ---------- camera controls ---------- */
  const startCameraAndProcessing = async () => {
    try {
      setErrorMessage(null);
      
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in your browser");
      }
      
      // Request camera access
      const constraints = { 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } 
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Make sure video element is visible and properly displayed
        videoRef.current.style.display = "block";
        
        // Set camera as started
        setIsCameraStarted(true);
        
        // Start processing once camera is ready
        videoRef.current.onloadeddata = () => {
          console.log("Video data loaded, starting processing");
          setIsProcessing(true);
          requestRef.current = requestAnimationFrame(predictWebcam);
          startTimer();
        };
        
        // Add error handler for video
        videoRef.current.onerror = (e) => {
          console.error("Video error:", e);
          setErrorMessage("Error with video display. Please refresh and try again.");
        };
      } else {
        throw new Error("Video element not found");
      }
    } catch (err: any) {
      console.error("Error starting camera:", err);
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setErrorMessage("Camera access denied. Please allow camera access in your browser settings.");
      } else if (err instanceof DOMException && err.name === "NotFoundError") {
        setErrorMessage("No camera found. Please connect a camera and try again.");
      } else {
        setErrorMessage(`Failed to start camera: ${err.message || "Unknown error"}. Please refresh and try again.`);
      }
    }
  };

  const stopProcessingAndCamera = () => {
    // Stop the animation frame
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    // Stop the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop the camera stream
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsProcessing(false);
    setIsCameraStarted(false);
  };

  const pauseProcessing = () => {
    if (isProcessing) {
      setIsProcessing(false);
      
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeProcessing = () => {
    if (isCameraStarted && !isProcessing) {
      setIsProcessing(true);
      requestRef.current = requestAnimationFrame(predictWebcam);
      startTimer();
    }
  };

  const resetCounterState = () => {
    setRepCount(0);
    setExerciseTime(0);
    setFormQuality(85);
    setCurlStage(null);
    setLastAngle(null);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isProcessing) {
      startTimer();
    }
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setExerciseTime(prev => prev + 1);
    }, 1000);
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  /* ---------- JSX ---------- */
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      {/* Header */}
      <header className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={16} />
          <span>Back to Home</span>
        </Link>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rep Counter</h1>
            <p className="text-gray-500">Count your bicep curls automatically with computer vision</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDebugMode(!debugMode)}
            className="flex items-center gap-1"
          >
            <Bug size={16} />
            {debugMode ? "Hide Debug" : "Debug Mode"}
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${
            activeTab === "live" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("live")}
        >
          Live Camera
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === "tutorial" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500"
          }`}
          onClick={() => setActiveTab("tutorial")}
        >
          Tutorial
        </button>
      </div>

      {activeTab === "live" ? (
        <div>
          {/* Video and canvas container */}
          <div className="relative aspect-video bg-gray-900 rounded-lg shadow-lg mb-6 overflow-hidden">
            {isLoadingModel ? (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-green-500" />
                  <p className="text-white">Loading pose detection model...</p>
                </div>
              </div>
            ) : !isCameraStarted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                {errorMessage && (
                  <div className="bg-red-600/90 text-white p-3 rounded-md mb-4 max-w-md text-center">
                    <AlertCircle className="h-5 w-5 mx-auto mb-1" />
                    <p>{errorMessage}</p>
                  </div>
                )}
                <Button
                  onClick={startCameraAndProcessing}
                  className="bg-green-600 hover:bg-green-700 z-20"
                >
                  <Camera className="mr-2" />
                  Start Camera
                </Button>
              </div>
            ) : null}

            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`absolute inset-0 w-full h-full object-contain ${debugMode ? 'opacity-100 z-10' : 'opacity-100'}`}
              style={{ transform: "scaleX(-1)" }}
            />
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-contain ${debugMode ? 'opacity-50 z-20' : ''}`}
              style={{ transform: "scaleX(-1)" }}
            />

            {/* Overlay for angle and stage */}
            {lastAngle !== null && (
              <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded z-30">
                Angle: {Math.round(lastAngle)}°
              </div>
            )}
            {curlStage && (
              <div className="absolute bottom-2 left-2 bg-green-600/80 text-white px-3 py-1 rounded-full z-30">
                {curlStage === "up" ? "UP" : "DOWN"}
              </div>
            )}
          </div>

          {/* Debug info */}
          {debugMode && (
            <Card className="mb-6 bg-gray-100">
              <CardHeader className="py-2">
                <CardTitle className="text-sm">Debug Information</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-1">
                <p>Camera Started: {isCameraStarted ? 'Yes' : 'No'}</p>
                <p>Processing: {isProcessing ? 'Yes' : 'No'}</p>
                <p>Model Loaded: {!isLoadingModel ? 'Yes' : 'No'}</p>
                <p>Video Opacity: {debugMode ? '100%' : '100%'}</p>
                <p>Canvas Opacity: {debugMode ? '50%' : '100%'}</p>
                <p>Last Angle: {lastAngle !== null ? Math.round(lastAngle) : 'N/A'}</p>
                <p>Curl Stage: {curlStage || 'N/A'}</p>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-3 mb-6 justify-center">
            {isCameraStarted && (
              <>
                {isProcessing ? (
                  <Button variant="outline" onClick={pauseProcessing}>
                    <Pause className="mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeProcessing}>
                    <Play className="mr-2" />
                    Resume
                  </Button>
                )}
                <Button variant="outline" onClick={resetCounterState}>
                  <RotateCcw className="mr-2" />
                  Reset
                </Button>
                <Button
                  variant="destructive"
                  onClick={stopProcessingAndCamera}
                >
                  Stop Camera
                </Button>
              </>
            )}
          </div>

          {/* Statistics and feedback */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Reps Counted</CardTitle>
                <CardDescription>Total bicep curls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{repCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time</CardTitle>
                <CardDescription>Duration of exercise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{formatTime(exerciseTime)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form Quality</CardTitle>
                <CardDescription>Estimated quality of movement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Progress value={formQuality} className="flex-1" />
                  <span className="font-bold">{formQuality}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Info className="text-blue-500" />
                Tips for Better Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1">
                <li>Stand with your left side facing the camera</li>
                <li>Ensure good lighting so your body is clearly visible</li>
                <li>Keep your elbow at a fixed position during curls</li>
                <li>Move slowly and deliberately for accurate counting</li>
                <li>Wear contrasting clothes to your background</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div>
          {/* Tutorial content */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use the Rep Counter</CardTitle>
              <CardDescription>
                Follow these steps to start counting your reps with computer vision
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">1. Prepare Your Space</h3>
                <p>
                  Find a well-lit area with enough space to perform bicep curls.
                  Make sure there's a clear background and good contrast between
                  you and the background.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">2. Position Your Device</h3>
                <p>
                  Place your device so that your entire left side is visible,
                  with focus on your arm. Stand approximately 4-6 feet away from
                  the camera.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">3. Start the Camera</h3>
                <p>
                  Click "Start Camera" and grant permission for your browser to
                  access your camera. The AI model will load (this may take a few
                  seconds).
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">4. Begin Your Exercise</h3>
                <p>
                  Stand with your left side facing the camera. Begin performing
                  bicep curls at a moderate pace. The system will automatically
                  count when you complete a full curl.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">5. Check Your Form</h3>
                <p>
                  The system provides feedback on your form quality. Try to
                  maintain good form throughout your exercise for more accurate
                  counting.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => setActiveTab("live")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Start Using the Rep Counter
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
