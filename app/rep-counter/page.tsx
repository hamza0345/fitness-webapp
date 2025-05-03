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
    Bug,
    VideoOff // Added for Stop Camera button
} from "lucide-react";
import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils,
    NormalizedLandmark // Import NormalizedLandmark type
} from "@mediapipe/tasks-vision";
import useAuthGuard from "@/hooks/useAuthGuard";

/* ---- landmark indices (using constants for clarity) ---- */
const LEFT_SHOULDER = 11;
const LEFT_ELBOW = 13;
const LEFT_WRIST = 15;

// Define the type for a landmark point used in calculateAngle
interface Point {
    x: number;
    y: number;
}

export default function RepCounterPage() {
    // Call useAuthGuard to redirect if user is not authenticated
    // const isAuthenticated = useAuthGuard(); // Assuming you have this hook setup

    /* ---------- state ---------- */
    const [activeTab, setActiveTab] = useState("live");
    const [isCameraStarted, setIsCameraStarted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isLoadingModel, setIsLoadingModel] = useState(true);
    const [repCount, setRepCount] = useState(0);
    const [exerciseTime, setExerciseTime] = useState(0);
    const [formQuality, setFormQuality] = useState(85); // Placeholder - form quality logic not implemented yet
    const [curlStage, setCurlStage] = useState<"down" | "up" | null>(null);
    const [lastAngle, setLastAngle] = useState<number | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [debugMode, setDebugMode] = useState(true); // Set to true by default for easier troubleshooting

    /* ---------- refs ---------- */
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const requestRef = useRef<number | null>(null); // For requestAnimationFrame ID

    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const drawingUtilsRef = useRef<DrawingUtils | null>(null); // Ref for DrawingUtils instance

    let lastVideoTime = -1; // Track last processed video timestamp

    /* ---------- load model on mount ---------- */
    useEffect(() => {
        const createPoseLandmarker = async () => {
            try {
                setIsLoadingModel(true);
                setErrorMessage(null);
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(
                    vision,
                    {
                        baseOptions: {
                            modelAssetPath:
                                // Using the 'lite' model for potentially better performance
                                "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_lite.task",
                            delegate: "GPU" // Use GPU if available
                        },
                        runningMode: "VIDEO", // Essential for detectForVideo
                        numPoses: 1, // Only detect one person
                        minPoseDetectionConfidence: 0.5, // Corresponds to Python's min_detection_confidence
                        minTrackingConfidence: 0.5 // Corresponds to Python's min_tracking_confidence
                    }
                );
                console.log("Pose Landmarker loaded successfully.");
            } catch (err: any) {
                console.error("Error loading Pose Landmarker:", err);
                setErrorMessage(`Failed to load pose model: ${err.message || "Unknown error"}. Please refresh.`);
            } finally {
                setIsLoadingModel(false);
            }
        };

        createPoseLandmarker();

        // Cleanup function when component unmounts
        return () => {
            console.log("Cleaning up RepCounterPage...");
            stopProcessingAndCamera(); // Ensure camera and processing are stopped
            poseLandmarkerRef.current?.close(); // Close the landmarker model
            console.log("Pose Landmarker closed.");
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array ensures this runs only once on mount


    /* ---------- helpers ---------- */
    // Replicates the Python calculate_angle function using JavaScript's Math library
    const calculateAngle = useCallback((a: Point, b: Point, c: Point): number => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);

        if (angle > 180.0) {
            angle = 360.0 - angle; // Ensure angle is between 0 and 180 degrees
        }
        return angle;
    }, []);


    /* ---------- main processing loop ---------- */
    const predictWebcam = useCallback(async () => {
        // Exit checks
        if (!isProcessing || !videoRef.current || !poseLandmarkerRef.current || !canvasRef.current) {
            requestRef.current = null; // Clear request ID if we stop processing
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const poseLandmarker = poseLandmarkerRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("Could not get 2D context from canvas");
            setIsProcessing(false); // Stop processing if canvas context fails
            setErrorMessage("Failed to get canvas context. Cannot draw results.");
            requestRef.current = null;
            return;
        }

        // Lazily create DrawingUtils instance when canvas context is available
        if (!drawingUtilsRef.current) {
            drawingUtilsRef.current = new DrawingUtils(ctx);
            console.log("DrawingUtils initialized.");
        }
        const drawingUtils = drawingUtilsRef.current;

        // --- Start Drawing ---
        ctx.save(); // Save current state
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings
        
        // NO LONGER drawing the video frame to the canvas - video element is now visible underneath
        
        // Perform pose detection only on new frames
        if (video.readyState >= 3 && video.currentTime !== lastVideoTime) { // Check if video is ready and frame is new
            lastVideoTime = video.currentTime;
            const startTimeMs = performance.now();

            try {
                // Detect poses
                const results = await poseLandmarker.detectForVideo(video, startTimeMs);

                // Process results if landmarks are found
                if (results.landmarks && results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0] as NormalizedLandmark[]; // Assuming numPoses = 1

                    // --- Draw Landmarks and Connections ---
                    // Since video is already mirrored with CSS, we don't need to mirror the landmarks drawing
                    // Draw Connectors (lines between joints)
                    drawingUtils.drawConnectors(
                        landmarks,
                        PoseLandmarker.POSE_CONNECTIONS,
                        { color: "#3b82f6", lineWidth: 2 } // Blue connections
                    );
                    // Draw Landmarks (dots for joints)
                    drawingUtils.drawLandmarks(landmarks, {
                        color: "#4ade80", // Green dots
                        lineWidth: 1,
                        radius: 3
                    });
                    // --- End Drawing Landmarks ---


                    // --- Angle Calculation & Rep Counting Logic ---
                    const shoulder = landmarks[LEFT_SHOULDER];
                    const elbow = landmarks[LEFT_ELBOW];
                    const wrist = landmarks[LEFT_WRIST];

                    // Check visibility of required landmarks
                    const minVisibility = 0.5;
                    if (
                        shoulder && shoulder.visibility !== undefined && shoulder.visibility > minVisibility &&
                        elbow && elbow.visibility !== undefined && elbow.visibility > minVisibility &&
                        wrist && wrist.visibility !== undefined && wrist.visibility > minVisibility
                    ) {
                        // Get coordinates (these are normalized 0.0 - 1.0)
                        const shoulderPoint: Point = { x: shoulder.x, y: shoulder.y };
                        const elbowPoint: Point = { x: elbow.x, y: elbow.y };
                        const wristPoint: Point = { x: wrist.x, y: wrist.y };

                        // Calculate angle
                        const angle = calculateAngle(shoulderPoint, elbowPoint, wristPoint);
                        setLastAngle(angle); // Update state with the latest angle

                        // Curl Counter Logic (from Python code)
                        // Stage transition: Down
                        if (angle > 160) {
                            if (curlStage !== "down") {
                                console.log("Stage changed to DOWN");
                            }
                            setCurlStage("down");
                        }
                        // Stage transition: Up + Count Rep
                        if (angle < 30 && curlStage === 'down') {
                            if (curlStage !== "up") {
                                console.log("Stage changed to UP - Rep Counted!");
                            }
                            setCurlStage("up");
                            setRepCount(prev => prev + 1);
                        }

                        // Visualize Angle near Elbow (Drawing directly on canvas)
                        const elbowPixelX = elbowPoint.x * canvas.width;
                        const elbowPixelY = elbowPoint.y * canvas.height;
                        ctx.fillStyle = "white";
                        ctx.font = "bold 18px Arial";
                        ctx.textAlign = "center";
                        // Display angle near elbow - no need to adjust for mirroring, as the video is already mirrored
                        ctx.fillText(Math.round(angle).toString() + "°", elbowPixelX, elbowPixelY - 10);

                    } else {
                        // Reset angle if landmarks are not visible
                        setLastAngle(null);
                    }
                     // --- End Angle Calculation & Rep Counting ---

                } else {
                    // No landmarks detected
                    setLastAngle(null);
                }

            } catch (err: any) {
                console.error("Error during pose detection:", err);
                setErrorMessage(`Error during detection: ${err.message}`);
                setIsProcessing(false); // Stop processing on error
                requestRef.current = null;
                return; // Exit the loop
            }
        }

        // --- Draw Curl Stage Text ---
        if (curlStage) {
            ctx.fillStyle = curlStage === "up" ? "#4ade80" : "#facc15"; // Green for up, Yellow for down
            ctx.font = "bold 24px Arial";
            ctx.textAlign = "left";
            ctx.fillText(curlStage.toUpperCase(), 20, canvas.height - 20); // Bottom-left corner
        }
        // --- End Draw Curl Stage Text ---

        // --- Continue the loop ---
        if (isProcessing) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        } else {
            requestRef.current = null; // Clear request ID if stopped
        }

    }, [isProcessing, calculateAngle, curlStage]); // Dependencies for useCallback


    /* ---------- timer controls ---------- */
    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current); // Clear existing timer
        timerRef.current = setInterval(() => {
            setExerciseTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    /* ---------- camera & processing controls ---------- */
    const startCameraAndProcessing = async () => {
        if (isLoadingModel || !poseLandmarkerRef.current) {
            setErrorMessage("Model is still loading or failed to load. Please wait or refresh.");
            return;
        }
        if (isCameraStarted) {
            console.warn("Camera is already started.");
            return;
        }

        setErrorMessage(null); // Clear previous errors
        setIsProcessing(false); // Ensure processing is off initially

        try {
            // Check for mediaDevices support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("getUserMedia is not supported by your browser.");
            }

            // Request camera stream
            const constraints = {
                video: {
                    facingMode: "user", // Prefer front camera
                    width: { ideal: 1280 }, // Request HD resolution
                    height: { ideal: 720 }
                }
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream; // Store stream reference

            if (videoRef.current && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                
                // Set initial canvas size (will be updated when video metadata loads)
                canvas.width = 640;  // Default fallback width
                canvas.height = 480; // Default fallback height
                
                video.srcObject = stream;
                
                // Event listener for when video metadata is loaded
                video.onloadedmetadata = () => {
                    if (videoRef.current && canvasRef.current) {
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        
                        console.log(`Video dimensions on load: ${video.videoWidth}x${video.videoHeight}`);
                        
                        // Set canvas size based on video dimensions
                        if (video.videoWidth && video.videoHeight) {
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                            console.log(`Canvas size set to: ${canvas.width}x${canvas.height}`);
                        } else {
                            console.warn("Video dimensions not available, using default canvas size");
                        }
                        
                        video.play(); // Start playing the video feed
                        setIsCameraStarted(true);
                        console.log("Camera started and video playing.");
                        
                        // Delay starting processing slightly
                        setTimeout(() => {
                            setIsProcessing(true);
                            startTimer();
                            requestRef.current = requestAnimationFrame(predictWebcam); // Start the main loop
                            console.log("Processing started.");
                        }, 100);
                    }
                };
                
                // Additional event to handle video size changes or delayed size info
                video.addEventListener('loadeddata', () => {
                    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth) {
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        
                        // Update canvas dimensions if they haven't been set correctly yet
                        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                            console.log(`Updating canvas dimensions on loadeddata: ${video.videoWidth}x${video.videoHeight}`);
                            canvas.width = video.videoWidth;
                            canvas.height = video.videoHeight;
                        }
                    }
                });
                
                // Error handler for video element
                video.onerror = (e) => {
                    console.error("Video element error:", e);
                    setErrorMessage("An error occurred with the video stream.");
                    stopProcessingAndCamera(); // Stop everything on video error
                };
            } else {
                throw new Error("Video element ref is not available.");
            }
        } catch (err: any) {
            console.error("Error starting camera:", err);
            let userMessage = `Failed to start camera: ${err.message || "Unknown error"}`;
            if (err.name === "NotAllowedError") {
                userMessage = "Camera access denied. Please allow camera access in browser settings and refresh.";
            } else if (err.name === "NotFoundError") {
                userMessage = "No camera found. Please ensure a camera is connected and enabled.";
            } else if (err.name === "NotReadableError") {
                userMessage = "Camera is already in use or cannot be accessed. Try closing other apps using the camera.";
            }
            setErrorMessage(userMessage);
            stopProcessingAndCamera(); // Clean up if start fails
        }
    };

    const stopProcessingAndCamera = () => {
        console.log("Stopping processing and camera...");
        // Stop processing loop
        setIsProcessing(false);
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
            console.log("Animation frame cancelled.");
        }

        // Stop timer
        stopTimer();
        console.log("Timer stopped.");

        // Stop camera stream tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log(`Track ${track.kind} stopped.`);
            });
            streamRef.current = null;
        }

        // Clear video source
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            console.log("Video source cleared.");
        }

        // Reset state
        setIsCameraStarted(false);
        // Optionally reset stats here too, or keep them until manual reset
        // resetCounterState();

        // Clear drawing utils ref (will be recreated on next start)
        drawingUtilsRef.current = null;

         // Clear canvas
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                console.log("Canvas cleared.");
            }
        }
        console.log("Stopped.");
    };

    const pauseProcessing = () => {
        if (isProcessing) {
            setIsProcessing(false);
            stopTimer();
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
            console.log("Processing paused.");
        }
    };

    const resumeProcessing = () => {
        if (isCameraStarted && !isProcessing && !isLoadingModel && poseLandmarkerRef.current) {
            setIsProcessing(true);
            startTimer();
            requestRef.current = requestAnimationFrame(predictWebcam);
            console.log("Processing resumed.");
        } else if (!isCameraStarted) {
             console.warn("Cannot resume, camera is not started.");
        } else if (isLoadingModel) {
             console.warn("Cannot resume, model is still loading.");
        } else if (!poseLandmarkerRef.current) {
             console.warn("Cannot resume, pose landmarker not available.");
        }
    };

    const resetCounterState = () => {
        setRepCount(0);
        setExerciseTime(0);
        // setFormQuality(85); // Reset form quality if needed
        setCurlStage(null);
        setLastAngle(null);
        stopTimer(); // Stop current timer
        if (isProcessing) {
            startTimer(); // Restart timer only if currently processing
        }
        console.log("Counter state reset.");
    };


    const formatTime = (s: number) => {
        const minutes = String(Math.floor(s / 60)).padStart(2, "0");
        const seconds = String(s % 60).padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

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
                        size="icon" // Make it an icon button
                        onClick={() => setDebugMode(!debugMode)}
                        title={debugMode ? "Hide Debug Info" : "Show Debug Info"} // Tooltip
                    >
                        <Bug size={18} />
                    </Button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === "live" ? "border-b-2 border-green-500 text-green-600 font-semibold" : "text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => setActiveTab("live")}
                >
                    Live Camera
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === "tutorial" ? "border-b-2 border-green-500 text-green-600 font-semibold" : "text-gray-500 hover:text-gray-700"
                        }`}
                    onClick={() => setActiveTab("tutorial")}
                >
                    Tutorial
                </button>
            </div>

            {activeTab === "live" ? (
                <div>
                    {/* Video and canvas container */}
                    <div className="relative aspect-video bg-gray-900 rounded-lg shadow-lg mb-6 overflow-hidden border border-gray-700">
                        {/* Loading Indicator */}
                        {isLoadingModel && (
                            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
                                <div className="text-center">
                                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3 text-green-500" />
                                    <p className="text-white text-lg font-semibold">Loading Pose Model...</p>
                                    <p className="text-gray-300">This may take a moment.</p>
                                </div>
                            </div>
                        )}

                        {/* Start Button / Error Message Overlay */}
                        {!isLoadingModel && !isCameraStarted && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900/90 p-4">
                                {errorMessage && (
                                    <div className="bg-red-600/90 text-white p-3 rounded-md mb-4 max-w-md text-center shadow-lg">
                                        <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                                        <p className="font-semibold">Error</p>
                                        <p className="text-sm">{errorMessage}</p>
                                    </div>
                                )}
                                <Button
                                    onClick={startCameraAndProcessing}
                                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md"
                                    disabled={isLoadingModel} // Disable if model is still loading
                                >
                                    <Camera className="mr-2 h-5 w-5" />
                                    Start Camera
                                </Button>
                                <p className="text-gray-400 text-sm mt-3">Allow camera access when prompted.</p>
                            </div>
                        )}

                         {/* Video Element (Make it visible by removing opacity-0) */}
                         <video
                             ref={videoRef}
                             muted
                             playsInline
                             autoPlay
                             className="absolute top-0 left-0 w-full h-full object-contain z-0" // Made visible, lower z-index
                             style={{ transform: "scaleX(-1)" }} // Mirror video for natural selfie view
                         />

                         {/* Canvas Element (Transparent overlay for drawings) */}
                         <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full object-contain z-10"
                            style={{ backgroundColor: 'transparent' }} // Ensure canvas is transparent
                         />

                         {/* Angle display overlay */}
                         {isCameraStarted && lastAngle !== null && (
                             <div className="absolute top-2 right-2 bg-black/60 text-white px-3 py-1 rounded z-20 text-sm font-semibold">
                                 Angle: {Math.round(lastAngle)}°
                             </div>
                          )}

                    </div>

                    {/* Debug info */}
                    {debugMode && (
                        <Card className="mb-6 bg-gray-800 text-gray-200 border-gray-700">
                            <CardHeader className="py-2 px-4">
                                <CardTitle className="text-base text-yellow-400">Debug Information</CardTitle>
                            </CardHeader>
                            <CardContent className="text-xs space-y-1 px-4 pb-3">
                                <p>Camera Started: <span className={`font-mono ${isCameraStarted ? 'text-green-400' : 'text-red-400'}`}>{isCameraStarted ? 'Yes' : 'No'}</span></p>
                                <p>Processing: <span className={`font-mono ${isProcessing ? 'text-green-400' : 'text-red-400'}`}>{isProcessing ? 'Yes' : 'No'}</span></p>
                                <p>Model Loaded: <span className={`font-mono ${!isLoadingModel && poseLandmarkerRef.current ? 'text-green-400' : 'text-red-400'}`}>{!isLoadingModel && poseLandmarkerRef.current ? 'Yes' : 'No'}</span></p>
                                <p>Last Angle: <span className="font-mono text-cyan-400">{lastAngle !== null ? Math.round(lastAngle) + '°' : 'N/A'}</span></p>
                                <p>Curl Stage: <span className="font-mono text-orange-400">{curlStage || 'N/A'}</span></p>
                                <p>Video Time: <span className="font-mono text-purple-400">{lastVideoTime.toFixed(2)}</span></p>
                                <p>Canvas Size: <span className="font-mono text-blue-400">{canvasRef.current ? `${canvasRef.current.width}x${canvasRef.current.height}` : 'N/A'}</span></p>
                                <p>Error: <span className="font-mono text-red-400">{errorMessage || 'None'}</span></p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Controls */}
                    <div className="flex flex-wrap gap-3 mb-6 justify-center">
                        {isCameraStarted ? (
                            <>
                                {isProcessing ? (
                                    <Button variant="secondary" onClick={pauseProcessing} className="shadow">
                                        <Pause className="mr-2 h-4 w-4" /> Pause
                                    </Button>
                                ) : (
                                    <Button variant="secondary" onClick={resumeProcessing} className="shadow bg-blue-500 hover:bg-blue-600 text-white">
                                        <Play className="mr-2 h-4 w-4" /> Resume
                                    </Button>
                                )}
                                <Button variant="outline" onClick={resetCounterState} className="shadow">
                                    <RotateCcw className="mr-2 h-4 w-4" /> Reset
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={stopProcessingAndCamera}
                                    className="shadow"
                                >
                                     <VideoOff className="mr-2 h-4 w-4" /> Stop Camera
                                </Button>
                            </>
                        ) : (
                            // Show disabled start button if camera not yet started but model loaded
                           !isLoadingModel && <Button
                                onClick={startCameraAndProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md"
                                disabled={isLoadingModel}
                            >
                                <Camera className="mr-2 h-4 w-4" /> Start Camera
                            </Button>
                        )}
                    </div>

                    {/* Statistics and feedback */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">REPS</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold text-gray-900">{repCount}</div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">TIME</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-5xl font-bold text-gray-900">{formatTime(exerciseTime)}</div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">FORM QUALITY (Est.)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 mt-1">
                                    <Progress value={formQuality} className="flex-1 h-3" />
                                    <span className="text-xl font-bold text-gray-900">{formQuality}%</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Basic estimation</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tips */}
                    <Card className="bg-blue-50 border border-blue-200 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-base text-blue-700">
                                <Info size={18} className="text-blue-500" />
                                Tips for Best Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">
                                <li>Ensure your **left arm** (shoulder, elbow, wrist) is clearly visible to the camera.</li>
                                <li>Use good, consistent lighting. Avoid backlighting.</li>
                                <li>Wear clothing that contrasts with the background.</li>
                                <li>Perform curls at a steady, controlled pace.</li>
                                <li>Stand 4-6 feet away, allowing your upper body and arm to be in frame.</li>
                                <li>Keep your elbow relatively stable during the curl motion.</li>
                                 <li>If detection seems off, try resetting or adjusting your position/lighting.</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div>
                    {/* Tutorial content */}
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>How to Use the Rep Counter</CardTitle>
                            <CardDescription>
                                Follow these steps to start counting your bicep curls
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold">1. Prepare Your Space</h3>
                                <p className="text-sm text-gray-700">
                                    Find a well-lit area. Ensure your background is relatively simple and contrasts with your clothing.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold">2. Position Yourself</h3>
                                <p className="text-sm text-gray-700">
                                    Place your device (laptop/phone) stable on a surface. Stand 4-6 feet away so your **left side** (shoulder, elbow, wrist) is fully visible to the camera.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold">3. Start the Camera</h3>
                                <p className="text-sm text-gray-700">
                                    Click "Start Camera" on the 'Live Camera' tab. Grant camera permission if prompted. Wait for the model to load (you'll see an indicator).
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold">4. Begin Exercising</h3>
                                <p className="text-sm text-gray-700">
                                    Once the camera feed appears with pose landmarks (dots and lines), start performing bicep curls with your left arm at a steady pace. The counter increases when you complete a full curl (arm fully bent after being extended).
                                </p>
                            </div>
                             <div className="space-y-2">
                                <h3 className="font-semibold">5. Use Controls</h3>
                                <p className="text-sm text-gray-700">
                                    Use 'Pause'/'Resume' to take breaks, 'Reset' to clear stats, and 'Stop Camera' when finished.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={() => setActiveTab("live")}
                                className="w-full bg-green-600 hover:bg-green-700"
                            >
                                Go to Live Camera
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    );
}