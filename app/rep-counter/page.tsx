"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Camera, Play, Pause, RotateCcw, Info, Loader2 } from "lucide-react"; // Removed Dumbbell as it wasn't used in final UI
import { Progress } from "@/components/ui/progress";
import { PoseLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";

// Define landmark indices for clarity (based on Mediapipe Pose documentation)
const LEFT_SHOULDER = 11;
const LEFT_ELBOW = 13;
const LEFT_WRIST = 15;

export default function RepCounterPage() {
  const [activeTab, setActiveTab] = useState("live");
  const [isCameraStarted, setIsCameraStarted] = useState(false); // Camera stream active?
  const [isProcessing, setIsProcessing] = useState(false); // CV processing happening?
  const [isLoadingModel, setIsLoadingModel] = useState(true); // Loading state for the model
  const [repCount, setRepCount] = useState(0);
  const [exerciseTime, setExerciseTime] = useState(0);
  const [formQuality, setFormQuality] = useState(85); // Keep simulated for now
  const [curlStage, setCurlStage] = useState<"down" | "up" | null>(null); // Track curl stage
  const [lastAngle, setLastAngle] = useState<number | null>(null); // For display

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For drawing landmarks
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef<number | null>(null); // For requestAnimationFrame
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const drawingUtilsRef = useRef<DrawingUtils | null>(null);
  let lastVideoTime = -1; // Used to optimize frame processing

  // --- Mediapipe Setup ---
  useEffect(() => {
    const createPoseLandmarker = async () => {
      try {
        setIsLoadingModel(true);
        const vision = await FilesetResolver.forVisionTasks(
          // Path to Mediapipe WASM files - using CDN
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const newPoseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            // Using Google hosted model file
            modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_lite.task",
            delegate: "GPU", // Use GPU if available
          },
          runningMode: "VIDEO", // Process video stream
          numPoses: 1, // Detect one person
          minPoseDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        poseLandmarkerRef.current = newPoseLandmarker;

        // Setup DrawingUtils for the canvas
        const canvasCtx = canvasRef.current?.getContext("2d");
        if (canvasCtx) {
          drawingUtilsRef.current = new DrawingUtils(canvasCtx);
        } else {
           console.error("Could not get 2D context from canvas");
        }

        setIsLoadingModel(false);
        console.log("Pose Landmarker model loaded successfully.");
      } catch (error) {
        console.error("Error loading Pose Landmarker model:", error);
        // Consider adding user-facing error feedback here
        setIsLoadingModel(false);
      }
    };
    createPoseLandmarker();

    // Cleanup function: runs when component unmounts
    return () => {
      console.log("Cleaning up RepCounterPage...");
      stopProcessingAndCamera(); // Stop streams and timers
      poseLandmarkerRef.current?.close(); // Release model resources
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array means run only once on mount

  // --- Angle Calculation ---
  const calculateAngle = (a: { x: number, y: number }, b: { x: number, y: number }, c: { x: number, y: number }): number => {
    // Calculate angle using atan2, convert to degrees
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    // Ensure angle is <= 180 degrees
    if (angle > 180.0) {
      angle = 360 - angle;
    }
    return angle;
  };

  // --- Main Processing Loop (using requestAnimationFrame) ---
  const predictWebcam = useCallback(() => {
    // Exit checks
    if (!isProcessing || !videoRef.current || !poseLandmarkerRef.current || !canvasRef.current || !drawingUtilsRef.current) {
      // If any required element/state isn't ready, stop the loop for now
      // It will be restarted by resumeProcessing or startCameraAndProcessing
      requestRef.current = null;
      return;
    }

    const video = videoRef.current;
    const poseLandmarker = poseLandmarkerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const drawingUtils = drawingUtilsRef.current;

     if (!ctx) { // Should be caught by initial check, but safety first
         console.error("Canvas context lost");
         requestRef.current = null;
         return;
     }

    // Match canvas dimensions to video dimensions if they differ
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log(`Canvas resized to: ${canvas.width}x${canvas.height}`);
    }

    // Process video frame if time has advanced
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) { // Check readyState
      lastVideoTime = video.currentTime;
      const startTimeMs = performance.now();
      const results = poseLandmarker.detectForVideo(video, startTimeMs);

      // Clear canvas before drawing new frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw landmarks if detected
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]; // Get landmarks for the first detected pose

        // Draw the landmarks and connections
        drawingUtils.drawLandmarks(landmarks, {
          radius: (data) => DrawingUtils.lerp(data.from!.z, -0.15, 0.1, 5, 1), // Adjust size based on depth
          color: '#4ade80', // Green dots
        });
        drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
          color: '#3b82f6', // Blue lines
        });

        // --- Rep Counting Logic ---
        // Check if required landmarks are visible enough
        if (
          landmarks[LEFT_SHOULDER] && landmarks[LEFT_ELBOW] && landmarks[LEFT_WRIST] &&
          landmarks[LEFT_SHOULDER].visibility > 0.5 &&
          landmarks[LEFT_ELBOW].visibility > 0.5 &&
          landmarks[LEFT_WRIST].visibility > 0.5
        ) {
            const shoulder = landmarks[LEFT_SHOULDER];
            const elbow = landmarks[LEFT_ELBOW];
            const wrist = landmarks[LEFT_WRIST];

            // Calculate the elbow angle
            const angle = calculateAngle(shoulder, elbow, wrist);
            setLastAngle(angle); // Update state for display

            // Curl counter state machine logic
            if (angle > 160) { // Arm is extended (down phase)
              // Only update if not already 'down' to avoid redundant state changes
              if (curlStage !== "down") {
                 // console.log("Stage: down");
                 setCurlStage("down");
              }
            }
            // Check if arm is flexed (up phase) AND was previously in the 'down' state
            if (angle < 50 && curlStage === 'down') {
              // console.log("Stage: up, Rep counted!");
              setCurlStage("up");
              setRepCount((prev) => prev + 1);
              // Reset stage quickly? Or wait for extension? Current logic resets on next >160
            }
        } else {
            // Landmarks not clearly visible, reset angle display
             setLastAngle(null);
        }

      } else {
        // No pose detected in this frame
        setLastAngle(null);
      }
    }

    // Continue the loop for the next frame if still processing
    if (isProcessing) {
        requestRef.current = requestAnimationFrame(predictWebcam);
    } else {
        requestRef.current = null; // Ensure loop stops if isProcessing becomes false
    }
  }, [isProcessing, curlStage]); // Dependencies for the callback

  // --- Control Functions ---
  const startCameraAndProcessing = async () => {
    if (isLoadingModel || !poseLandmarkerRef.current) {
        console.log("Model not loaded yet.");
        // Optionally show a message to the user
        return;
    }
     if (isProcessing || isCameraStarted) {
         console.log("Camera/Processing already active.");
         return; // Already running
     }

    try {
        console.log("Attempting to start camera...");
        setIsCameraStarted(false); // Reset just in case
        setIsProcessing(false);

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: 640, height: 480 }, // Request specific size
            audio: false
        });
        streamRef.current = stream;
        console.log("Camera stream acquired.");

        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            // Wait for metadata to load to get dimensions
            videoRef.current.onloadedmetadata = () => {
                console.log("Video metadata loaded.");
                videoRef.current?.play().then(() => {
                    console.log("Video playback started.");
                    setIsCameraStarted(true);
                    setIsProcessing(true); // Start processing state
                    resetCounterState(false); // Reset counts but keep camera state
                    startTimer(); // Start exercise timer
                    // Kick off the prediction loop
                    if (!requestRef.current) {
                         requestRef.current = requestAnimationFrame(predictWebcam);
                         console.log("Processing loop initiated.");
                    }
                }).catch(playError => {
                    console.error("Error starting video play:", playError);
                    // Handle autoplay block or other errors
                    stopProcessingAndCamera(); // Clean up if play fails
                });
            };
             videoRef.current.onerror = (e) => {
                console.error("Video element error:", e);
                 stopProcessingAndCamera(); // Clean up on video error
             };
        } else {
             console.error("Video ref is not available.");
             stream.getTracks().forEach(track => track.stop()); // Release stream if video ref fails
        }
    } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please ensure permission is granted and no other app is using it.");
        setIsCameraStarted(false);
        setIsProcessing(false);
    }
  };

  const stopProcessingAndCamera = () => {
    console.log("Stopping processing and camera...");
    setIsProcessing(false); // Stop the processing loop trigger first
    setIsCameraStarted(false);

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
      console.log("Animation frame cancelled.");
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log("Timer cleared.");
    }

    // Stop camera stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      console.log("Media stream tracks stopped.");
    }

    // Release video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
       videoRef.current.onloadedmetadata = null; // Remove listener
       videoRef.current.onerror = null; // Remove listener
      console.log("Video source cleared.");
    }

    // Clear the canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
        ctx.clearRect(0,0, canvas.width, canvas.height);
        console.log("Canvas cleared.");
    }
    // Reset potentially stuck states
    setLastAngle(null);
    setCurlStage(null);
    console.log("Processing and camera stopped.");
  };


  const pauseProcessing = () => {
    if (!isProcessing) return; // Don't pause if already paused
    console.log("Pausing processing...");
    setIsProcessing(false); // This will stop the predictWebcam loop via its internal check
    // Keep animation frame ref? No, it should null itself out. cancelAnimationFrame just in case:
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
    }

    if (timerRef.current) { // Pause timer
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    console.log("Processing paused.");
  };

  const resumeProcessing = () => {
     if (!isCameraStarted || isProcessing) {
         console.log("Cannot resume: Camera not started or already processing.");
         return; // Only resume if camera is on and not already processing
     }
     console.log("Resuming processing...");
     setIsProcessing(true);
     startTimer(); // Restart timer

     // Restart the loop if it's not already running
     if (!requestRef.current) {
         console.log("Restarting animation frame loop.");
        requestRef.current = requestAnimationFrame(predictWebcam);
     }
  };

  // Resets counts, angle, stage. Optionally stops camera too.
  const resetCounterState = (stopCamera = true) => {
    console.log(`Resetting counter state... ${stopCamera ? 'and stopping camera' : 'keeping camera'}`);
    if (stopCamera) {
      stopProcessingAndCamera(); // Full stop and reset
    } else {
      // If keeping camera, just pause processing temporarily to reset counts
      pauseProcessing();
      // Reset counts immediately
       setRepCount(0);
       setExerciseTime(0);
       setFormQuality(85); // Reset simulated form quality
       setCurlStage(null);
       setLastAngle(null);
       console.log("Counts and state reset.");
       // Resume processing shortly after state updates apply
       // Note: This relies on pauseProcessing having stopped the loop and timer
       setTimeout(() => {
           if (isCameraStarted && !isProcessing) { // Check state again before resuming
               resumeProcessing();
           }
       }, 50); // Short delay
    }

     // If stopping camera, state reset happens after stopProcessingAndCamera finishes
     if (stopCamera) {
        setRepCount(0);
        setExerciseTime(0);
        setFormQuality(85);
        setCurlStage(null);
        setLastAngle(null);
     }
  };

  // Starts the exercise timer interval
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current); // Clear existing timer
    timerRef.current = setInterval(() => {
      // Use functional update to avoid stale state issues
      setExerciseTime((prevTime) => prevTime + 1);
    }, 1000);
  };

  // --- Helper to format time ---
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };


  // ---===[ JSX Rendering Starts Here ]===---
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl"> {/* Added max-width */}
      {/* Back Link */}
      <Link href="/" className="inline-flex items-center text-sm text-blue-600 hover:underline mb-4">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
        <h1 className="text-3xl font-bold">Rep Counter</h1>
        <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center shrink-0">
          <Info className="h-4 w-4 mr-1" />
          Beta Feature (Bicep Curls Only)
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <p className="text-gray-700 text-sm md:text-base">
          Use your camera to automatically count bicep curls. Position your <span className="font-medium">entire upper body, especially the working arm (shoulder, elbow, wrist)</span>, clearly in the frame. Good lighting and a side view are recommended.
        </p>
        {/* Loading/Error Messages */}
        {isLoadingModel && (
          <p className="text-blue-600 mt-2 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading AI Model...</p>
        )}
         {!isLoadingModel && !poseLandmarkerRef.current && (
          <p className="text-red-600 mt-2">Error loading AI Model. Please refresh the page or check console for details.</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab} // Controlled tab state
        className="w-full"
        onValueChange={(value) => {
          console.log("Tab changed to:", value);
          // Reset completely when switching tabs
          resetCounterState(true);
          setActiveTab(value); // Update the active tab state
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="live" disabled={isLoadingModel}>Live Counter</TabsTrigger>
          <TabsTrigger value="tutorial">How It Works</TabsTrigger>
        </TabsList>

        {/* --- Live Counter Tab --- */}
        <TabsContent value="live">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

            {/* Camera View Section */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden"> {/* Added overflow hidden */}
                <CardHeader>
                  <CardTitle>Bicep Curl Counter</CardTitle>
                  <CardDescription>Camera View & Pose Detection</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-0"> {/* Remove padding */}
                  {/* Video and Canvas Container - Aspect Ratio Controlled */}
                  <div className="relative w-full aspect-video bg-gray-100 flex items-center justify-center">
                    {/* Placeholder/Button when camera is off */}
                    {!isCameraStarted && !isLoadingModel && (
                      <div className="flex flex-col items-center gap-4 p-4 text-center z-10">
                          <div className="bg-white rounded-full p-4 shadow-md">
                              <Camera className="h-10 w-10 text-green-600" />
                          </div>
                          <p className="text-gray-500 text-sm">Enable your camera to start counting reps.</p>
                          <Button
                            onClick={startCameraAndProcessing}
                            disabled={isLoadingModel || !poseLandmarkerRef.current}
                            className="bg-green-600 hover:bg-green-700"
                          >
                              <Camera className="mr-2 h-4 w-4" /> Start Camera
                          </Button>
                      </div>
                    )}
                    {/* Loading Indicator */}
                    {isLoadingModel && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 z-10">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        Loading Model...
                      </div>
                    )}

                    {/* Video element (source for canvas, can be visually hidden) */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      // className="absolute top-0 left-0 w-full h-full object-contain" // Use object-contain
                      // Use opacity 0 to hide, but keep layout
                      className={`absolute top-0 left-0 w-full h-full object-contain opacity-0 ${isCameraStarted ? 'opacity-100' : 'opacity-0'}`}
                       style={{ transform: 'scaleX(-1)' }} // Flip horizontally for mirror effect
                    />
                    {/* Canvas for drawing landmarks (visible overlay) */}
                    <canvas
                      ref={canvasRef}
                      className={`absolute top-0 left-0 w-full h-full object-contain ${isCameraStarted ? 'opacity-100' : 'opacity-0'}`} // Use object-contain
                       style={{ transform: 'scaleX(-1)' }} // Also flip canvas to match video mirror
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap justify-center gap-2 sm:gap-4 pt-4"> {/* Use flex-wrap */}
                    {/* Control Buttons Logic */}
                    {!isCameraStarted && !isLoadingModel && (
                         <Button
                            onClick={startCameraAndProcessing}
                            disabled={isLoadingModel || !poseLandmarkerRef.current}
                            className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700" // Added min-width
                         >
                            <Camera className="mr-2 h-4 w-4" /> Start Camera
                        </Button>
                    )}
                    {isCameraStarted && isProcessing && (
                        <Button variant="outline" onClick={pauseProcessing} className="flex-1 min-w-[120px]">
                            <Pause className="mr-2 h-4 w-4" /> Pause
                        </Button>
                    )}
                    {isCameraStarted && !isProcessing && (
                        <Button onClick={resumeProcessing} className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700">
                            <Play className="mr-2 h-4 w-4" /> Resume
                        </Button>
                    )}
                    {isCameraStarted && (
                        <Button variant="destructive" onClick={() => resetCounterState(true)} className="flex-1 min-w-[120px]">
                            <RotateCcw className="mr-2 h-4 w-4" /> Stop & Reset
                        </Button>
                    )}
                </CardFooter>
              </Card>
            </div> {/* End Camera View Section */}

            {/* Statistics Section */}
            <div className="space-y-6">
              {/* Rep Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Rep Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Rep Count */}
                    <div className="text-center">
                      <div className="text-6xl font-bold text-green-600">{repCount}</div>
                      <div className="text-sm text-gray-500 mt-1">Reps Counted</div>
                    </div>

                    {/* Detailed Stats */}
                    <div className="space-y-4">
                      {/* Time */}
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="font-medium text-gray-600">Exercise Time</span>
                          <span className="font-medium">{formatTime(exerciseTime)}</span>
                        </div>
                      </div>
                      {/* Angle Display */}
                       <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="font-medium text-gray-600">Elbow Angle</span>
                          <span className="font-medium text-blue-600">
                            {lastAngle !== null ? `${lastAngle.toFixed(0)}°` : 'N/A'}
                          </span>
                        </div>
                      </div>
                      {/* Stage Display */}
                       <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="font-medium text-gray-600">Curl Stage</span>
                          <span className="font-medium capitalize text-blue-600">
                            {curlStage ?? 'N/A'}
                          </span>
                        </div>
                      </div>
                      {/* Form Quality (Simulated) */}
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="font-medium text-gray-600">Form Quality (Simulated)</span>
                          <span className="font-medium">{formQuality}%</span>
                        </div>
                        <Progress value={formQuality} className="h-2" />
                      </div>
                      {/* Average Speed */}
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span className="font-medium text-gray-600">Average Speed</span>
                          <span className="font-medium">
                            {repCount > 0 ? (exerciseTime / repCount).toFixed(1) : "0.0"} sec/rep
                          </span>
                        </div>
                      </div>
                    </div> {/* End Detailed Stats */}
                  </div>
                </CardContent>
              </Card> {/* End Rep Stats Card */}

              {/* Tips Card (Using original tips) */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Accurate Counting</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 font-semibold">1</span>
                      <span>Position your <span className="font-medium">full upper body</span> within the camera frame.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 font-semibold">2</span>
                      <span>Ensure <span className="font-medium">good, consistent lighting</span> on your body. Avoid backlighting.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 font-semibold">3</span>
                      <span>Perform <span className="font-medium">complete range of motion</span> for each rep (fully extend and flex).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 font-semibold">4</span>
                      <span>A <span className="font-medium">side view</span> often works best for tracking the elbow angle.</span>
                    </li>
                     <li className="flex items-start">
                      <span className="bg-green-100 text-green-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 font-semibold">5</span>
                      <span>Wear clothing that contrasts with the background if possible.</span>
                    </li>
                  </ul>
                </CardContent>
              </Card> {/* End Tips Card */}
            </div> {/* End Statistics Section */}
          </div> {/* End Grid */}
        </TabsContent> {/* End Live Counter Tab */}


        {/* --- Tutorial Tab (Using original structure/content) --- */}
        <TabsContent value="tutorial">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* How It Works Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>How the Rep Counter Works (Web Version)</CardTitle>
                        <CardDescription>Using Mediapipe directly in your browser</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-medium text-green-800 mb-2">In-Browser Computer Vision</h3>
                        <p className="text-sm text-gray-600">
                            This rep counter uses Google's Mediapipe (<code className="text-xs bg-gray-200 px-1 rounded">@mediapipe/tasks-vision</code>) library, which runs directly in your web browser using WebAssembly and JavaScript. It processes the video feed from your camera in real-time without sending data to a server.
                        </p>
                        </div>

                        <div className="space-y-4">
                        <h3 className="font-medium">The Process:</h3>
                        <div className="flex gap-4 items-start">
                            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm">1</div>
                            <div>
                            <h4 className="font-medium">Pose Detection</h4>
                            <p className="text-sm text-gray-500">Mediapipe identifies key body points (landmarks) like shoulders, elbows, and wrists from the video frames.</p>
                            </div>
                        </div>
                         <div className="flex gap-4 items-start">
                            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm">2</div>
                            <div>
                            <h4 className="font-medium">Angle Calculation</h4>
                            <p className="text-sm text-gray-500">The angle of the elbow joint (between shoulder, elbow, and wrist) is calculated using the landmark coordinates.</p>
                            </div>
                        </div>
                         <div className="flex gap-4 items-start">
                           <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm">3</div>
                            <div>
                            <h4 className="font-medium">Rep Counting Logic</h4>
                            <p className="text-sm text-gray-500">A state machine tracks the angle. When the arm goes from extended (large angle: ~160°+) to flexed (small angle: ~50°-), a rep is counted.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-start">
                            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-mono text-sm">4</div>
                            <div>
                            <h4 className="font-medium">Visualization</h4>
                            <p className="text-sm text-gray-500">The detected landmarks and connections are drawn onto a canvas overlaying the video feed for visual feedback.</p>
                            </div>
                        </div>
                        </div>
                    </div>
                    </CardContent>
                </Card> {/* End How It Works Card */}

                {/* Future Development Card (Using original content) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Future Development</CardTitle>
                        <CardDescription>What's coming next for our rep counter technology</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <p className="text-sm text-gray-700">
                            Our rep counter is currently in beta and supports bicep curls only. We're actively developing
                            support for additional exercises and features:
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-gray-50 border rounded-lg p-3">
                                    <h4 className="font-medium text-sm text-green-700">Squat Detection</h4>
                                    <p className="text-xs text-gray-500">Coming soon</p>
                                </div>
                                <div className="bg-gray-50 border rounded-lg p-3">
                                    <h4 className="font-medium text-sm text-green-700">Push-up Counting</h4>
                                    <p className="text-xs text-gray-500">Coming soon</p>
                                </div>
                                <div className="bg-gray-50 border rounded-lg p-3">
                                    <h4 className="font-medium text-sm text-green-700">Form Correction</h4>
                                    <p className="text-xs text-gray-500">Real-time feedback on exercise form</p>
                                </div>
                                <div className="bg-gray-50 border rounded-lg p-3">
                                    <h4 className="font-medium text-sm text-green-700">Workout Recording</h4>
                                    <p className="text-xs text-gray-500">Save and review your exercise sessions</p>
                                </div>
                            </div>

                            {/* Adjusted technical description for web */}
                            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                            <h4 className="font-medium text-blue-800 mb-2">Technical Implementation (Web)</h4>
                            <p className="text-sm text-blue-700">
                                This feature uses the Mediapipe Tasks Vision library for web, running pose estimation models (like PoseLandmarker) directly in the browser via JavaScript and WebAssembly. Custom logic analyzes joint angles from the detected landmarks to count reps.
                            </p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setActiveTab("live")} disabled={isLoadingModel}>
                            <Play className="mr-2 h-4 w-4" />
                            Try the Rep Counter
                        </Button>
                    </CardFooter>
                </Card> {/* End Future Development Card */}
            </div> {/* End Tutorial Grid */}
        </TabsContent> {/* End Tutorial Tab */}

      </Tabs> {/* End Tabs Component */}
    </div> // End Container div
  ); // End Return Statement
} // End RepCounterPage Component