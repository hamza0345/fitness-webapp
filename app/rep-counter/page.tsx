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
    VideoOff
} from "lucide-react";
import {
    PoseLandmarker,
    FilesetResolver,
    DrawingUtils,
    NormalizedLandmark
} from "@mediapipe/tasks-vision";
import useAuthGuard from "@/hooks/useAuthGuard";

/* ---- landmark indices ---- */
const LEFT_SHOULDER = 11;
const LEFT_ELBOW = 13;
const LEFT_WRIST = 15;

interface Point {
    x: number;
    y: number;
}

export default function RepCounterPage() {
    // ... (other state variables remain the same) ...
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
    const [debugMode, setDebugMode] = useState(true);

    /* ---------- refs ---------- */
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const requestRef = useRef<number | null>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const drawingUtilsRef = useRef<DrawingUtils | null>(null);
    const lastVideoTimeRef = useRef(-1); // Use a ref for lastVideoTime

    /* ---------- load model on mount ---------- */
    useEffect(() => {
        console.log("useEffect: Initializing...");
        const createPoseLandmarker = async () => {
            // ... (model loading logic remains the same - keep logs) ...
             try {
                setIsLoadingModel(true);
                setErrorMessage(null);
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
                );
                console.log("useEffect: FilesetResolver loaded.");

                poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(
                    vision,
                    { /* ... options ... */
                        baseOptions: {
                            modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/pose_landmarker/pose_landmarker_lite.task",
                            delegate: "GPU"
                        },
                        runningMode: "VIDEO",
                        numPoses: 1,
                        minPoseDetectionConfidence: 0.5,
                        minTrackingConfidence: 0.5
                    }
                );
                console.log("useEffect: PoseLandmarker created:", poseLandmarkerRef.current);
            } catch (err: any) {
                console.error("Error loading Pose Landmarker:", err);
                setErrorMessage(`Failed to load pose model: ${err.message || "Unknown error"}. Please refresh.`);
            } finally {
                setIsLoadingModel(false);
                 console.log("useEffect: Finished loading attempt. isLoadingModel set to false.");
            }
        };
        createPoseLandmarker();

        return () => {
            console.log("useEffect cleanup: Starting cleanup...");
            // Ensure stopProcessingAndCamera also cancels any pending animation frame
            stopProcessingAndCamera(true); // Pass flag to indicate component unmount cleanup
            if (poseLandmarkerRef.current) {
                 poseLandmarkerRef.current.close();
                 console.log("useEffect cleanup: PoseLandmarker closed.");
                 poseLandmarkerRef.current = null;
            } else {
                 console.log("useEffect cleanup: PoseLandmarker was already null or closed.");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    /* ---------- helpers ---------- */
    const calculateAngle = useCallback((a: Point, b: Point, c: Point): number => {
        // ... (calculateAngle logic remains the same) ...
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) { angle = 360.0 - angle; }
        return angle;
    }, []);


    /* ---------- main processing loop ---------- */
    const predictWebcam = useCallback(async () => {
        // console.log("predictWebcam: Loop called."); // Keep this log initially

        // Keep the initial check, but isProcessing should be reliably true now if loop is running
        if (!isProcessing || !videoRef.current || !poseLandmarkerRef.current || !canvasRef.current) {
            console.warn("predictWebcam: Exiting - Prerequisites failed unexpectedly.", { isProcessing, video: !!videoRef.current, landmarker: !!poseLandmarkerRef.current, canvas: !!canvasRef.current });
            requestRef.current = null;
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const poseLandmarker = poseLandmarkerRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            console.error("predictWebcam: Could not get 2D context. Stopping processing.");
            setErrorMessage("Canvas error. Cannot draw results.");
            setIsProcessing(false); // Stop loop by changing state
            requestRef.current = null;
            return;
        }

        if (!drawingUtilsRef.current) {
            drawingUtilsRef.current = new DrawingUtils(ctx);
            console.log("predictWebcam: DrawingUtils initialized.");
        }
        const drawingUtils = drawingUtilsRef.current;

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);

        // Use the ref for lastVideoTime
        // console.log("predictWebcam: video.readyState =", video.readyState);
        if (video.readyState >= 3 && video.currentTime !== lastVideoTimeRef.current) {
             // console.log("predictWebcam: Video ready and new frame.");
            lastVideoTimeRef.current = video.currentTime;
            const startTimeMs = performance.now();
             // console.log("predictWebcam: Timestamp =", startTimeMs);

            try {
                 // console.log("predictWebcam: Calling detectForVideo...");
                const results = await poseLandmarker.detectForVideo(video, startTimeMs);
                 // console.log("predictWebcam: detectForVideo finished.");
                 // console.log("predictWebcam: Results =", results);

                if (results && results.landmarks && results.landmarks.length > 0) {
                     // console.log("predictWebcam: Landmarks detected.");
                    const landmarks = results.landmarks[0] as NormalizedLandmark[];

                    drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, { color: "#3b82f6", lineWidth: 2 });
                    drawingUtils.drawLandmarks(landmarks, { color: "#4ade80", lineWidth: 1, radius: 3 });

                    const shoulder = landmarks[LEFT_SHOULDER];
                    const elbow = landmarks[LEFT_ELBOW];
                    const wrist = landmarks[LEFT_WRIST];
                    const minVisibility = 0.5;

                    if (
                        shoulder?.visibility > minVisibility &&
                        elbow?.visibility > minVisibility &&
                        wrist?.visibility > minVisibility
                    ) {
                        // console.log("predictWebcam: Visible landmarks found for angle calculation.");
                        const shoulderPoint: Point = { x: shoulder.x, y: shoulder.y };
                        const elbowPoint: Point = { x: elbow.x, y: elbow.y };
                        const wristPoint: Point = { x: wrist.x, y: wrist.y };

                        const angle = calculateAngle(shoulderPoint, elbowPoint, wristPoint);
                        // console.log("predictWebcam: Calculated angle:", angle);
                        setLastAngle(angle);

                        // Curl Counter Logic
                        if (angle > 160) {
                            if (curlStage !== "down") console.log("predictWebcam: Stage changed to DOWN");
                            setCurlStage("down");
                        }
                        if (angle < 30 && curlStage === 'down') {
                            setCurlStage("up");
                            setRepCount(prev => prev + 1);
                            console.log("predictWebcam: Stage changed to UP - Rep Counted!");
                        }

                        // Visualize Angle
                        const elbowPixelX = (1 - elbowPoint.x) * canvas.width;
                        const elbowPixelY = elbowPoint.y * canvas.height;
                        ctx.save();
                        ctx.translate(canvas.width, 0); ctx.scale(-1, 1); // Undo mirror for text
                        ctx.fillStyle = "white"; ctx.font = "bold 18px Arial"; ctx.textAlign = "center";
                        ctx.fillText(Math.round(angle).toString() + "°", elbowPixelX, elbowPixelY - 10);
                        ctx.restore(); // Restore mirror for drawing
                    } else {
                        // console.log("predictWebcam: Required landmarks not visible.", { shoulderVis: shoulder?.visibility, elbowVis: elbow?.visibility, wristVis: wrist?.visibility });
                        setLastAngle(null);
                    }
                } else {
                     console.log("predictWebcam: No pose landmarks detected in this frame.");
                    setLastAngle(null);
                }
            } catch (err: any) {
                console.error("Error during pose detection:", err);
                setErrorMessage(`Error during detection: ${err.message}`);
                setIsProcessing(false); // Stop loop by changing state
                requestRef.current = null;
                return;
            }
        }
        // else if (video.readyState < 3) { console.log("predictWebcam: Video not ready."); }
        // else if (video.currentTime === lastVideoTimeRef.current) { console.log("predictWebcam: Same frame."); }

        // Drawing stage text
        ctx.restore(); // Go back to non-mirrored drawing
        ctx.save();
        if (curlStage) {
            ctx.fillStyle = curlStage === "up" ? "#4ade80" : "#facc15";
            ctx.font = "bold 24px Arial"; ctx.textAlign = "left";
            ctx.fillText(curlStage.toUpperCase(), 20, canvas.height - 20);
        }
        ctx.restore();

        // --- Schedule next frame ---
        // The loop continuation is now handled by the useEffect hook below
        // No need to call requestAnimationFrame here anymore

    }, [isProcessing, calculateAngle, curlStage]); // Removed lastVideoTimeRef dependency


    // NEW useEffect hook to manage the animation loop based on isProcessing state
    useEffect(() => {
        console.log(`Loop Effect: isProcessing is ${isProcessing}.`);
        if (isProcessing) {
            console.log("Loop Effect: Starting animation loop.");
            // Define the function that calls predictWebcam and schedules the next frame
            const loop = async () => {
                await predictWebcam();
                // Only schedule next frame if we are *still* processing
                if (isProcessing && requestRef.current !== null) { // Check requestRef to prevent race conditions on stop
                     requestRef.current = requestAnimationFrame(loop);
                } else {
                     console.log("Loop Effect: loop function detected processing should stop. Cancelling.");
                     if(requestRef.current) {
                         cancelAnimationFrame(requestRef.current);
                         requestRef.current = null;
                     }
                }
            };
            requestRef.current = requestAnimationFrame(loop); // Start the loop
        } else {
            console.log("Loop Effect: Stopping animation loop.");
            // Stop the loop if isProcessing becomes false
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
                console.log("Loop Effect: Animation frame cancelled.");
            }
        }

        // Cleanup function for this effect
        return () => {
            console.log("Loop Effect: Cleanup function running.");
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
                console.log("Loop Effect Cleanup: Animation frame cancelled.");
            }
        };
    }, [isProcessing, predictWebcam]); // Rerun when isProcessing or predictWebcam changes


    /* ---------- timer controls ---------- */
    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setExerciseTime(prev => prev + 1), 1000);
        console.log("Timer started.");
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            console.log("Timer stopped.");
        }
    };

    /* ---------- camera & processing controls ---------- */
    const startCameraAndProcessing = async () => {
        console.log("startCameraAndProcessing: Attempting to start...");
        // ... (initial checks for isLoadingModel, poseLandmarkerRef, isCameraStarted remain the same) ...
        if (isLoadingModel || !poseLandmarkerRef.current || isCameraStarted) {
             console.warn("startCameraAndProcessing: Aborted - Pre-checks failed.", {isLoadingModel, hasLandmarker: !!poseLandmarkerRef.current, isCameraStarted});
             // Set appropriate error message if needed
             if(isLoadingModel) setErrorMessage("Model is still loading.");
             if(!poseLandmarkerRef.current && !isLoadingModel) setErrorMessage("Model failed to load. Please refresh.");
             return;
        }

        console.log("startCameraAndProcessing: PoseLandmarker instance available:", poseLandmarkerRef.current);
        setErrorMessage(null);
        // We no longer set isProcessing here initially

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("startCameraAndProcessing: getUserMedia not supported.");
                throw new Error("getUserMedia is not supported by your browser.");
            }
            console.log("startCameraAndProcessing: Requesting camera access...");
            const constraints = { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } } };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log("startCameraAndProcessing: Camera access granted.");
            streamRef.current = stream;

            if (videoRef.current && canvasRef.current) {
                console.log("startCameraAndProcessing: Video and Canvas refs available.");
                const video = videoRef.current;
                const canvas = canvasRef.current;
                canvas.width = 640; canvas.height = 480; // Default
                console.log(`startCameraAndProcessing: Initial canvas size set to: ${canvas.width}x${canvas.height}`);
                video.srcObject = stream;

                video.onloadedmetadata = () => {
                    console.log("video.onloadedmetadata: Fired.");
                    if (videoRef.current && canvasRef.current) {
                        const video = videoRef.current;
                        const canvas = canvasRef.current;
                        console.log(`video.onloadedmetadata: Video dimensions on load: ${video.videoWidth}x${video.videoHeight}`);
                        if (video.videoWidth && video.videoHeight) {
                            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                            console.log(`video.onloadedmetadata: Canvas size set to: ${canvas.width}x${canvas.height}`);
                        } else { console.warn("video.onloadedmetadata: Video dimensions not available..."); }

                        video.play();
                        setIsCameraStarted(true); // Set camera state
                        console.log("video.onloadedmetadata: Camera started and video playing.");

                        if (poseLandmarkerRef.current) {
                            console.log("video.onloadedmetadata: PoseLandmarker ready. Setting isProcessing true soon.");
                            // Delay starting processing slightly
                            setTimeout(() => {
                                console.log("video.onloadedmetadata: setTimeout fired - Setting isProcessing to true.");
                                setIsProcessing(true); // Trigger the loop effect
                                startTimer(); // Start the timer
                                // NO requestAnimationFrame call here anymore
                            }, 100);
                        } else { /* ... error handling ... */
                             console.error("video.onloadedmetadata: PoseLandmarker became unavailable.");
                             setErrorMessage("Model unavailable. Cannot start processing.");
                             stopProcessingAndCamera();
                        }
                    } else { console.error("video.onloadedmetadata: Video or Canvas ref became null."); }
                };

                video.addEventListener('loadeddata', () => { /* ... keep loadeddata listener ... */
                     console.log("video 'loadeddata' event: Fired.");
                    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth) {
                        const video = videoRef.current; const canvas = canvasRef.current;
                        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                            console.log(`video 'loadeddata' event: Updating canvas dimensions: ${video.videoWidth}x${video.videoHeight}`);
                            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                        } // else { console.log("video 'loadeddata' event: Canvas dimensions already match video."); }
                    }
                });
                video.onerror = (e) => { /* ... keep onerror handler ... */
                    console.error("Video element error:", e);
                    setErrorMessage("An error occurred with the video stream.");
                    stopProcessingAndCamera();
                };
            } else { /* ... error handling ... */
                console.error("startCameraAndProcessing: Video or Canvas ref is not available.");
                throw new Error("Video or Canvas element ref is not available.");
            }
        } catch (err: any) { /* ... keep catch block ... */
             console.error("Error starting camera:", err);
             // ... (set userMessage based on err.name) ...
             let userMessage = `Failed to start camera: ${err.message || "Unknown error"}`;
             if (err.name === "NotAllowedError") userMessage = "Camera access denied...";
             else if (err.name === "NotFoundError") userMessage = "No camera found...";
             else if (err.name === "NotReadableError") userMessage = "Camera is already in use...";
             setErrorMessage(userMessage);
             stopProcessingAndCamera();
        }
    };

    // Modified to accept an optional flag for component unmount cleanup
    const stopProcessingAndCamera = (isUnmounting = false) => {
        console.log(`stopProcessingAndCamera: Stopping (isUnmounting: ${isUnmounting})...`);
        setIsProcessing(false); // This will trigger the loop effect cleanup
        // The loop effect cleanup now handles cancelling the animation frame.
        // Explicit cancel here might be redundant but safe.
        if (!isUnmounting && requestRef.current) { // Avoid extra cancel if unmounting cleanup already ran
            console.log("stopProcessingAndCamera: Explicitly cancelling animation frame.");
             cancelAnimationFrame(requestRef.current);
             requestRef.current = null;
        }

        stopTimer();

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            console.log(`stopProcessingAndCamera: Stream tracks stopped.`);
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
            console.log("stopProcessingAndCamera: Video source cleared.");
        }

        setIsCameraStarted(false); // Set state after stopping tracks/source
        drawingUtilsRef.current = null; // Clear drawing utils

        if (canvasRef.current) { // Clear canvas
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            console.log("stopProcessingAndCamera: Canvas cleared.");
        }
        console.log("stopProcessingAndCamera: Stopped.");
    };

    const pauseProcessing = () => {
        if (isProcessing) {
            console.log("Pausing processing...");
            setIsProcessing(false); // Let the effect handle stopping the loop
            stopTimer();
        } else {
             console.log("pauseProcessing: Already paused or not running.");
        }
    };

    const resumeProcessing = () => {
         console.log("resumeProcessing: Attempting to resume...");
        // Just set the state, the effect will handle starting the loop
        if (isCameraStarted && !isProcessing && !isLoadingModel && poseLandmarkerRef.current) {
            setIsProcessing(true);
            startTimer();
            console.log("Processing resumed (set isProcessing true).");
        } else {
             // Add more specific warnings based on the condition failure
             if(!isCameraStarted) console.warn("resumeProcessing: Cannot resume, camera not started.");
             else if (isProcessing) console.warn("resumeProcessing: Already processing.");
             else if (isLoadingModel) console.warn("resumeProcessing: Model loading.");
             else if (!poseLandmarkerRef.current) console.warn("resumeProcessing: Landmarker not available.");
        }
    };

    const resetCounterState = () => {
        console.log("resetCounterState: Resetting stats...");
        setRepCount(0);
        setExerciseTime(0);
        setCurlStage(null);
        setLastAngle(null);
        stopTimer();
        if (isProcessing) { // Restart timer only if processing was active
            startTimer();
             console.log("resetCounterState: Restarted timer as processing was active.");
        }
        console.log("resetCounterState: Counter state reset.");
    };

    const formatTime = (s: number) => { /* ... formatTime remains the same ... */
        const minutes = String(Math.floor(s / 60)).padStart(2, "0");
        const seconds = String(s % 60).padStart(2, "0");
        return `${minutes}:${seconds}`;
    };

    /* ---------- JSX ---------- */
    // ... (JSX structure remains the same) ...
     return (
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
            {/* Header */}
            <header className="mb-6">
                 {/* ... Link and Title ... */}
                 <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft size={16} /><span>Back to Home</span>
                 </Link>
                 <div className="flex justify-between items-center">
                     <div>
                         <h1 className="text-3xl font-bold">Rep Counter</h1>
                         <p className="text-gray-500">Count your bicep curls automatically</p>
                     </div>
                     <Button variant="outline" size="icon" onClick={() => setDebugMode(!debugMode)} title={debugMode ? "Hide Debug Info" : "Show Debug Info"}>
                         <Bug size={18} />
                     </Button>
                 </div>
            </header>

            {/* Tabs */}
            <div className="flex border-b mb-6">
                 {/* ... Tab buttons ... */}
                  <button className={`px-4 py-2 ${activeTab === "live" ? "border-b-2 border-green-500 text-green-600 font-semibold" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("live")}>Live Camera</button>
                  <button className={`px-4 py-2 ${activeTab === "tutorial" ? "border-b-2 border-green-500 text-green-600 font-semibold" : "text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab("tutorial")}>Tutorial</button>
            </div>

            {activeTab === "live" ? (
                <div>
                    {/* Video and canvas container */}
                    <div className="relative aspect-video bg-gray-900 rounded-lg shadow-lg mb-6 overflow-hidden border border-gray-700">
                         {/* ... Loading Indicator ... */}
                          {isLoadingModel && ( /* ... */
                             <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70">
                                 <div className="text-center">
                                     <Loader2 className="h-12 w-12 animate-spin mx-auto mb-3 text-green-500" />
                                     <p className="text-white text-lg font-semibold">Loading Pose Model...</p>
                                     <p className="text-gray-300">This may take a moment.</p>
                                 </div>
                             </div>
                          )}
                         {/* ... Start Button / Error Message Overlay ... */}
                         {!isLoadingModel && !isCameraStarted && ( /* ... */
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-gray-900/90 p-4">
                                 {errorMessage && (
                                    <div className="bg-red-600/90 text-white p-3 rounded-md mb-4 max-w-md text-center shadow-lg">
                                         <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                                         <p className="font-semibold">Error</p>
                                         <p className="text-sm">{errorMessage}</p>
                                     </div>
                                 )}
                                 <Button onClick={startCameraAndProcessing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md" disabled={isLoadingModel || !!errorMessage}>
                                     <Camera className="mr-2 h-5 w-5" /> Start Camera
                                 </Button>
                                 <p className="text-gray-400 text-sm mt-3">Allow camera access when prompted.</p>
                             </div>
                         )}
                         {/* ... Video Element ... */}
                         <video ref={videoRef} muted playsInline autoPlay className="absolute top-0 left-0 w-full h-full object-contain z-0" style={{ transform: "scaleX(-1)" }} />
                         {/* ... Canvas Element ... */}
                         <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full object-contain z-10" style={{ backgroundColor: 'transparent' }} />
                    </div>

                    {/* ... Debug info ... */}
                     {debugMode && ( /* ... */
                        <Card className="mb-6 bg-gray-800 text-gray-200 border-gray-700">
                             <CardHeader className="py-2 px-4"><CardTitle className="text-base text-yellow-400">Debug Information</CardTitle></CardHeader>
                             <CardContent className="text-xs space-y-1 px-4 pb-3">
                                 <p>Cam Started: <span className={`font-mono ${isCameraStarted ? 'text-green-400' : 'text-red-400'}`}>{isCameraStarted?'Yes':'No'}</span></p>
                                 <p>Processing: <span className={`font-mono ${isProcessing ? 'text-green-400' : 'text-red-400'}`}>{isProcessing?'Yes':'No'}</span></p>
                                 <p>Model Loaded: <span className={`font-mono ${!isLoadingModel && poseLandmarkerRef.current ? 'text-green-400' : 'text-red-400'}`}>{!isLoadingModel && poseLandmarkerRef.current?'Yes':'No'}</span></p>
                                 <p>Landmarker Ref: <span className="font-mono text-gray-400">{poseLandmarkerRef.current?'Exists':'Null'}</span></p>
                                 <p>Last Angle: <span className="font-mono text-cyan-400">{lastAngle!==null?Math.round(lastAngle)+'°':'N/A'}</span></p>
                                 <p>Curl Stage: <span className="font-mono text-orange-400">{curlStage||'N/A'}</span></p>
                                 <p>Last Vid Time: <span className="font-mono text-purple-400">{lastVideoTimeRef.current.toFixed(2)}</span></p>
                                 <p>Canvas Size: <span className="font-mono text-blue-400">{canvasRef.current?`${canvasRef.current.width}x${canvasRef.current.height}`:'N/A'}</span></p>
                                 <p>Error: <span className="font-mono text-red-400">{errorMessage||'None'}</span></p>
                             </CardContent>
                         </Card>
                     )}

                    {/* ... Controls ... */}
                    <div className="flex flex-wrap gap-3 mb-6 justify-center">
                         {isCameraStarted ? (
                             <>
                                 {isProcessing ? (
                                     <Button variant="secondary" onClick={pauseProcessing} className="shadow"><Pause className="mr-2 h-4 w-4" /> Pause</Button>
                                 ) : (
                                     <Button variant="secondary" onClick={resumeProcessing} className="shadow bg-blue-500 hover:bg-blue-600 text-white"><Play className="mr-2 h-4 w-4" /> Resume</Button>
                                 )}
                                 <Button variant="outline" onClick={resetCounterState} className="shadow"><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                                 <Button variant="destructive" onClick={() => stopProcessingAndCamera()} className="shadow"><VideoOff className="mr-2 h-4 w-4" /> Stop Camera</Button>
                             </>
                         ) : (
                            !isLoadingModel && <Button onClick={startCameraAndProcessing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow-md" disabled={isLoadingModel || !!errorMessage}><Camera className="mr-2 h-4 w-4" /> Start Camera</Button>
                         )}
                     </div>

                    {/* ... Statistics and feedback ... */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          {/* ... Reps Card ... */}
                          <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">REPS</CardTitle></CardHeader><CardContent><div className="text-5xl font-bold text-gray-900">{repCount}</div></CardContent></Card>
                          {/* ... Time Card ... */}
                           <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">TIME</CardTitle></CardHeader><CardContent><div className="text-5xl font-bold text-gray-900">{formatTime(exerciseTime)}</div></CardContent></Card>
                          {/* ... Form Quality Card ... */}
                           <Card className="shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">FORM QUALITY (Est.)</CardTitle></CardHeader><CardContent><div className="flex items-center gap-2 mt-1"><Progress value={formQuality} className="flex-1 h-3" /><span className="text-xl font-bold text-gray-900">{formQuality}%</span></div><p className="text-xs text-gray-400 mt-1">Basic estimation</p></CardContent></Card>
                     </div>

                    {/* ... Tips Card ... */}
                     <Card className="bg-blue-50 border border-blue-200 shadow-sm">
                         <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-base text-blue-700"><Info size={18} className="text-blue-500" /> Tips for Best Results</CardTitle></CardHeader>
                         <CardContent><ul className="list-disc pl-5 space-y-1 text-sm text-blue-800">{/* ... Tips list items ... */}
                             <li>Ensure your **left arm** (shoulder, elbow, wrist) is clearly visible.</li><li>Use good, consistent lighting. Avoid backlighting.</li><li>Wear clothing that contrasts with the background.</li><li>Perform curls at a steady, controlled pace.</li><li>Stand 4-6 feet away, allowing your upper body and arm to be in frame.</li><li>Keep your elbow relatively stable during the curl motion.</li><li>If detection seems off, try resetting or adjusting your position/lighting.</li>
                         </ul></CardContent>
                     </Card>
                </div>
            ) : (
                 <div>{/* ... Tutorial Tab Content ... */}
                      <Card className="shadow-sm">
                         <CardHeader><CardTitle>How to Use the Rep Counter</CardTitle><CardDescription>Follow these steps...</CardDescription></CardHeader>
                         <CardContent className="space-y-4">{/* ... Tutorial Steps ... */}
                             <div className="space-y-2"><h3 className="font-semibold">1. Prepare Your Space</h3><p className="text-sm text-gray-700">Find a well-lit area...</p></div>
                             <div className="space-y-2"><h3 className="font-semibold">2. Position Yourself</h3><p className="text-sm text-gray-700">Place your device... **left side** visible...</p></div>
                             <div className="space-y-2"><h3 className="font-semibold">3. Start the Camera</h3><p className="text-sm text-gray-700">Click "Start Camera"... Grant permission...</p></div>
                             <div className="space-y-2"><h3 className="font-semibold">4. Begin Exercising</h3><p className="text-sm text-gray-700">Once the camera feed appears... start performing curls...</p></div>
                             <div className="space-y-2"><h3 className="font-semibold">5. Use Controls</h3><p className="text-sm text-gray-700">Use 'Pause'/'Resume', 'Reset', 'Stop Camera'.</p></div>
                         </CardContent>
                         <CardFooter><Button onClick={() => setActiveTab("live")} className="w-full bg-green-600 hover:bg-green-700">Go to Live Camera</Button></CardFooter>
                      </Card>
                 </div>
            )}
        </div>
    );
}