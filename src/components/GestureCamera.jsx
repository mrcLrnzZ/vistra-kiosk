import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

const CONFIG = {
  MIN_GESTURE_SCORE: 0.65,
  STABILITY_WINDOW: 8,
  STABILITY_RATIO: 0.6,
  HOLD_MS: 500,
  COOLDOWN_MS: 700,
  LEFT_ZONE_THRESHOLD: 0.33,
  RIGHT_ZONE_THRESHOLD: 0.67,
};

const HOLD_GESTURES = {
  Thumb_Up: 'Select',
  Pointing_Up: 'Continue',
  Thumb_Down: 'Back',
};

export default function GestureCamera({ onGesture, onStatusChange }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const recognizerRef = useRef(null);
  const requestRef = useRef(null);

  const onGestureRef = useRef(onGesture);
  const onStatusChangeRef = useRef(onStatusChange);

  useEffect(() => { onGestureRef.current = onGesture; }, [onGesture]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  const gestureBuffer = useRef([]);
  const stableGesture = useRef('None');
  const holdStartTime = useRef(null);
  const lastFiredGesture = useRef('None');

  const cooldownEndMs = useRef(0);
  const lastStatusString = useRef('');
  const currentZone = useRef('Neutral');

  useEffect(() => {
    let stream = null;

    const initializeGestureRecognizer = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6,
          cannedGesturesClassifierOptions: {
            scoreThreshold: CONFIG.MIN_GESTURE_SCORE
          }
        });
        recognizerRef.current = recognizer;
        setIsLoaded(true);

        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', predictWebcam);
        }
      } catch (error) {
        console.error("Error initializing MediaPipe or accessing camera:", error);
      }
    };

    initializeGestureRecognizer();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (recognizerRef.current) recognizerRef.current.close();
    };
  }, []);

  const pushGestureSample = (name) => {
    const buf = gestureBuffer.current;
    buf.push(name);
    if (buf.length > CONFIG.STABILITY_WINDOW) buf.shift();

    const counts = {};
    for (const g of buf) counts[g] = (counts[g] || 0) + 1;

    let best = 'None';
    let bestCount = 0;
    for (const [g, c] of Object.entries(counts)) {
      if (c > bestCount) { best = g; bestCount = c; }
    }

    const ratio = bestCount / buf.length;
    return ratio >= CONFIG.STABILITY_RATIO ? best : 'None';
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const recognizer = recognizerRef.current;

    if (!video || !canvas || !recognizer) return;

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      if (video.width !== video.videoWidth) {
        video.width = video.videoWidth;
        video.height = video.videoHeight;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    }

    const startTimeMs = performance.now();
    const now = Date.now();

    if (video.currentTime !== predictWebcam.lastVideoTime) {
      predictWebcam.lastVideoTime = video.currentTime;
      const results = recognizer.recognizeForVideo(video, startTimeMs);

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let actionToEmit = null;
      let newStatus = {
        camera: 'Connected',
        hand: 'Not Detected',
        gesture: 'Waiting...',
        zone: 'Neutral',
        cooldownRemaining: Math.max(0, (cooldownEndMs.current - now) / 1000)
      };

      const isCooldown = now < cooldownEndMs.current;

      if (results.gestures.length > 0 && results.landmarks.length > 0) {
        const top = results.gestures[0][0];
        const rawGesture = top.score >= CONFIG.MIN_GESTURE_SCORE ? top.categoryName : 'None';
        const landmarks = results.landmarks[0];

        let sumX = 0, sumY = 0;
        for (let i = 0; i < landmarks.length; i++) {
          sumX += landmarks[i].x;
          sumY += landmarks[i].y;
        }
        const centerX = sumX / landmarks.length;
        const centerY = sumY / landmarks.length;
        const visualX = 1.0 - centerX;
        
        let detectedZone = 'Neutral';
        if (visualX < CONFIG.LEFT_ZONE_THRESHOLD) detectedZone = 'Left';
        else if (visualX > CONFIG.RIGHT_ZONE_THRESHOLD) detectedZone = 'Right';

        newStatus.hand = 'Detected';
        newStatus.zone = detectedZone;

        const prevStable = stableGesture.current;
        const nextStable = pushGestureSample(rawGesture);
        stableGesture.current = nextStable;

        // Reset last fired gesture if they relax their hand
        if (nextStable !== lastFiredGesture.current && nextStable === 'None') {
          lastFiredGesture.current = 'None';
        }

        if (nextStable !== prevStable) {
          holdStartTime.current = now;
        }

        newStatus.gesture = nextStable === 'None' ? 'Reading...' : nextStable.replace('_', ' ');

        const holdAction = HOLD_GESTURES[nextStable];
        const priorityGestureActive = nextStable !== 'None' && holdAction;

        if (holdAction) {
          if (lastFiredGesture.current === nextStable) {
            newStatus.gesture = `Release hand to reset`;
          } else if (!isCooldown) {
            const heldFor = now - holdStartTime.current;
            if (heldFor > CONFIG.HOLD_MS) {
              actionToEmit = holdAction;
              cooldownEndMs.current = now + CONFIG.COOLDOWN_MS;
              lastFiredGesture.current = nextStable;
              newStatus.gesture = 'Gesture Detected';
            } else {
              const step = Math.round(heldFor / (CONFIG.HOLD_MS / 5));
              newStatus.gesture = `${nextStable.replace('_', ' ')} (Hold ${step}/5)`;
            }
          }
        }
        
        if (!priorityGestureActive && !isCooldown) {
          if (currentZone.current === 'Neutral' && detectedZone === 'Left') {
            actionToEmit = 'Previous';
            cooldownEndMs.current = now + CONFIG.COOLDOWN_MS;
            newStatus.gesture = 'Swiped Left';
          } else if (currentZone.current === 'Neutral' && detectedZone === 'Right') {
            actionToEmit = 'Next';
            cooldownEndMs.current = now + CONFIG.COOLDOWN_MS;
            newStatus.gesture = 'Swiped Right';
          }
        }
        currentZone.current = detectedZone;

        if (isCooldown) {
          if (!newStatus.gesture.includes('Swiped')) {
            newStatus.gesture = 'Cooldown...';
          }
        }

        for (const handLandmarks of results.landmarks) {
          drawConnectors(ctx, handLandmarks, HAND_CONNECTIONS, { color: "#00FF00", lineWidth: 3 });
          drawLandmarks(ctx, handLandmarks, { color: "#FF0000", lineWidth: 2 });
        }
        
        const canvasW = canvas.width;
        const canvasH = canvas.height;
        
        const drawLeftLineX = canvasW * (1.0 - CONFIG.LEFT_ZONE_THRESHOLD);
        const drawRightLineX = canvasW * (1.0 - CONFIG.RIGHT_ZONE_THRESHOLD);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.moveTo(drawLeftLineX, 0);
        ctx.lineTo(drawLeftLineX, canvasH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(drawRightLineX, 0);
        ctx.lineTo(drawRightLineX, canvasH);
        ctx.stroke();
        ctx.setLineDash([]);
        
        if (detectedZone === 'Left') {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.fillRect(drawLeftLineX, 0, canvasW - drawLeftLineX, canvasH);
        } else if (detectedZone === 'Right') {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.fillRect(0, 0, drawRightLineX, canvasH);
        }
        
        ctx.beginPath();
        ctx.arc(centerX * canvasW, centerY * canvasH, 16, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(20, 184, 166, 0.6)';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        gestureBuffer.current = [];
        stableGesture.current = 'None';
        holdStartTime.current = null;
        lastFiredGesture.current = 'None'; 
        currentZone.current = 'Neutral';

        if (isCooldown) {
          newStatus.gesture = 'Cooldown...';
        }
      }

      newStatus.cooldownRemaining = Math.max(0, (cooldownEndMs.current - now) / 1000).toFixed(1);

      const statusStr = JSON.stringify(newStatus);
      if (statusStr !== lastStatusString.current) {
        lastStatusString.current = statusStr;
        if (onStatusChangeRef.current) {
          onStatusChangeRef.current(newStatus);
        }
      }

      if (actionToEmit && onGestureRef.current) {
        onGestureRef.current(actionToEmit);
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ];

  const drawConnectors = (ctx, landmarks, connections, style) => {
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.lineWidth;
    connections.forEach(([start, end]) => {
      const p1 = landmarks[start];
      const p2 = landmarks[end];
      ctx.beginPath();
      ctx.moveTo(p1.x * ctx.canvas.width, p1.y * ctx.canvas.height);
      ctx.lineTo(p2.x * ctx.canvas.width, p2.y * ctx.canvas.height);
      ctx.stroke();
    });
  };

  const drawLandmarks = (ctx, landmarks, style) => {
    ctx.fillStyle = style.color;
    landmarks.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x * ctx.canvas.width, p.y * ctx.canvas.height, style.lineWidth, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  return (
    <div className="absolute top-6 left-6 z-50 bg-white/90 backdrop-blur shadow-lg rounded-2xl p-2 border border-teal-100 flex flex-col gap-2">
      <div className="relative w-48 h-36 rounded-xl overflow-hidden bg-slate-900 shadow-inner">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-teal-400 text-xs text-center p-2">
            Loading ML Model...
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full z-10 transform -scale-x-100"
        />
      </div>
      <div className="text-center">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vision System Active</span>
      </div>
    </div>
  );
}