import React, { useState, useEffect, useRef, useCallback } from 'react';
import './GestureTutorial.css';

// Import tutorial videos
import swipeleftVideo from '../assets/tutorials/swipeleft.mp4';
import swiperightVideo from '../assets/tutorials/swiperight.mp4';
import pointupVideo from '../assets/tutorials/pointup.mp4';
import thumbsdownVideo from '../assets/tutorials/thumbsdown.mp4';
import thumbsupVideo from '../assets/tutorials/thumbsup.mp4';

const STEPS = [
  {
    gesture: 'Previous',
    title: 'Swipe Left',
    description: 'Move your hand to the left side of the camera view',
    video: swipeleftVideo,
  },
  {
    gesture: 'Next',
    title: 'Swipe Right',
    description: 'Move your hand to the right side of the camera view',
    video: swiperightVideo,
  },
  {
    gesture: 'Continue',
    title: 'Point Up',
    description: 'Hold your index finger pointing upward',
    video: pointupVideo,
  },
  {
    gesture: 'Back',
    title: 'Thumbs Down',
    description: 'Hold your thumb pointing downward',
    video: thumbsdownVideo,
  },
  {
    gesture: 'Select',
    title: 'Thumbs Up',
    description: 'Hold your thumb pointing upward',
    video: thumbsupVideo,
  },
];

const SUCCESS_DELAY_MS = 1400;
const COMPLETION_DELAY_MS = 1800;
const INACTIVITY_TIMEOUT_MS = 10000;

export default function GestureTutorial({ lastGesture, onComplete, onTimeout }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState('waiting'); // 'waiting' | 'success'
  const [isExiting, setIsExiting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stepKey, setStepKey] = useState(0); // forces re-mount for animation
  const lastProcessedTimestamp = useRef(0);
  const videoRef = useRef(null);

  // Inactivity countdown
  const [countdown, setCountdown] = useState(INACTIVITY_TIMEOUT_MS / 1000);
  const [countdownKey, setCountdownKey] = useState(0); // resets CSS animation
  const inactivityTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const isClosingRef = useRef(false); // guards against double-close

  // ---------- Inactivity Timer ----------

  const clearInactivityTimers = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Animate exit then call the provided callback
  const animateExit = useCallback((callback) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    clearInactivityTimers();
    setIsExiting(true);
    setTimeout(() => {
      callback();
    }, 450);
  }, [clearInactivityTimers]);

  const startInactivityTimer = useCallback(() => {
    clearInactivityTimers();

    // Don't start a new timer if we're already closing / completed
    if (isClosingRef.current) return;

    setCountdown(INACTIVITY_TIMEOUT_MS / 1000);
    setCountdownKey((k) => k + 1); // restart CSS bar animation

    // Tick countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        const next = prev - 1;
        return next >= 0 ? next : 0;
      });
    }, 1000);

    // Fire timeout — temporary close, tutorial can re-appear
    inactivityTimerRef.current = setTimeout(() => {
      clearInactivityTimers();
      animateExit(onTimeout);
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimers, animateExit, onTimeout]);

  // Start inactivity timer on mount
  useEffect(() => {
    startInactivityTimer();
    return clearInactivityTimers;
  }, [startInactivityTimer, clearInactivityTimers]);

  // ---------- Close / Skip ----------

  // Skip via Thumbs Up — permanent close (calls onComplete)
  const handleSkip = useCallback(() => {
    animateExit(onComplete);
  }, [animateExit, onComplete]);

  // ---------- Gesture Matching ----------

  useEffect(() => {
    if (!lastGesture || isClosingRef.current || isCompleted) return;
    if (lastGesture.timestamp <= lastProcessedTimestamp.current) return;

    lastProcessedTimestamp.current = lastGesture.timestamp;

    // Any recognised gesture resets the inactivity timer
    startInactivityTimer();

    // --- Thumbs Up skip (on steps 1-4, where it's not the expected gesture) ---
    if (lastGesture.name === 'Select' && currentStep < STEPS.length - 1) {
      clearInactivityTimers();
      handleSkip();
      return;
    }

    // --- Normal step matching ---
    if (stepStatus !== 'waiting') return;

    const expectedGesture = STEPS[currentStep].gesture;
    if (lastGesture.name !== expectedGesture) return;

    // Pause inactivity timer during success animation
    clearInactivityTimers();
    setStepStatus('success');

    if (currentStep < STEPS.length - 1) {
      // Move to next step after delay
      setTimeout(() => {
        if (isClosingRef.current) return;
        setCurrentStep((prev) => prev + 1);
        setStepStatus('waiting');
        setStepKey((prev) => prev + 1);
        startInactivityTimer();
      }, SUCCESS_DELAY_MS);
    } else {
      // Final step — show completion then close
      setTimeout(() => {
        if (isClosingRef.current) return;
        setIsCompleted(true);
        setTimeout(() => {
          animateExit(onComplete);
        }, COMPLETION_DELAY_MS);
      }, SUCCESS_DELAY_MS);
    }
  }, [lastGesture, currentStep, stepStatus, isCompleted, handleSkip, animateExit, onComplete, startInactivityTimer, clearInactivityTimers]);

  // Ensure video loops when step changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [currentStep]);

  const step = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const isUrgent = countdown <= 2;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center ${
        isExiting ? 'tutorial-backdrop-exit' : 'tutorial-backdrop-enter'
      }`}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className={`relative w-full max-w-2xl mx-6 ${
          isExiting ? 'tutorial-modal-exit' : 'tutorial-modal-enter'
        }`}
      >
        {/* Main card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">

          {/* Inactivity countdown bar — thin strip at top of card */}
          {stepStatus === 'waiting' && !isCompleted && (
            <div className="relative h-1 w-full bg-slate-100 overflow-hidden">
              <div
                key={countdownKey}
                className="absolute inset-y-0 left-0 tutorial-countdown-bar rounded-r-full"
                style={{ '--countdown-duration': `${INACTIVITY_TIMEOUT_MS / 1000}s` }}
              />
            </div>
          )}

          {/* Header */}
          <div className="px-10 pt-8 pb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-teal-600 uppercase tracking-[0.2em]">
                Gesture Tutorial
              </h2>
              <div className="flex items-center gap-3">
                {/* Countdown seconds */}
                {stepStatus === 'waiting' && !isCompleted && (
                  <span
                    className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full transition-colors ${
                      isUrgent
                        ? 'bg-red-50 text-red-500 tutorial-countdown-urgent'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {countdown}s
                  </span>
                )}
                <span className="text-sm font-semibold text-slate-400">
                  Step {currentStep + 1} of {totalSteps}
                </span>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2.5 mt-4">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    index < currentStep
                      ? 'bg-teal-500 flex-[2]'
                      : index === currentStep
                      ? `bg-teal-500 flex-[3] ${stepStatus === 'waiting' ? 'tutorial-dot-active' : ''}`
                      : 'bg-slate-200 flex-[1]'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content — keyed for animation re-trigger */}
          <div key={stepKey} className="px-10 pb-6 tutorial-step-enter">
            {stepStatus === 'waiting' && !isCompleted && (
              <>
                {/* Gesture title */}
                <h3 className="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-lg text-slate-500 mb-8">
                  {step.description}
                </p>

                {/* Video container */}
                <div className="relative rounded-2xl overflow-hidden tutorial-video-glow bg-slate-900">
                  <video
                    ref={videoRef}
                    key={step.video}
                    src={step.video}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full aspect-video object-cover"
                  />
                  {/* Subtle gradient overlay on video edges */}
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 pointer-events-none" />
                </div>

                {/* Waiting indicator */}
                <div className="flex items-center justify-center gap-3 mt-8">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-500 tutorial-pulse-dot" />
                  <span className="text-base font-medium tutorial-shimmer">
                    Waiting for gesture…
                  </span>
                </div>
              </>
            )}

            {stepStatus === 'success' && !isCompleted && (
              <div className="flex flex-col items-center justify-center py-16">
                {/* Success checkmark */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-teal-500 flex items-center justify-center tutorial-check-pop">
                    <svg
                      className="w-12 h-12 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  {/* Burst ring */}
                  <div className="absolute inset-0 rounded-full border-teal-400 tutorial-celebrate-ring" style={{ borderStyle: 'solid' }} />
                </div>
                <p className="text-2xl font-bold text-slate-800 mt-6">Great!</p>
                <p className="text-base text-slate-400 mt-1">
                  {currentStep < totalSteps - 1
                    ? `Moving to ${STEPS[currentStep + 1].title}…`
                    : 'Completing tutorial…'}
                </p>
              </div>
            )}

            {isCompleted && (
              <div className="flex flex-col items-center justify-center py-16">
                {/* Completion celebration */}
                <div className="relative tutorial-check-pop">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-teal-500/30">
                    <svg
                      className="w-14 h-14 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 rounded-full border-emerald-400 tutorial-celebrate-ring" style={{ borderStyle: 'solid' }} />
                  <div className="absolute inset-0 rounded-full border-teal-300 tutorial-celebrate-ring" style={{ borderStyle: 'solid', animationDelay: '0.15s' }} />
                </div>
                <h3 className="text-3xl font-extrabold text-slate-800 mt-8">You're all set!</h3>
                <p className="text-lg text-slate-500 mt-2">
                  You've mastered all the gestures. Enjoy navigating!
                </p>
              </div>
            )}
          </div>

          {/* Skip hint — visible on every step, below the main content */}
          {!isCompleted && !isExiting && (
            <div className="px-10 pb-6">
              <div className="flex items-center justify-center gap-2 py-3 px-5 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-lg">👍</span>
                <span className="text-sm font-medium text-slate-400">
                  Make a <span className="font-semibold text-slate-500">Thumbs Up</span> gesture to skip this tutorial
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
