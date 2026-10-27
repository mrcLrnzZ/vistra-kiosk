import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Home,
  ArrowUp,
  HeartPulse,
  ShieldCheck,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const SESSION_SECONDS = 300;
const WARNING_SECONDS = 60;
const URGENT_SECONDS = 10;

// Countdown ring geometry (SVG viewBox units; the element scales with CSS)
const RING_SIZE = 320;
const RING_STROKE = 10;
const RING_CENTER = RING_SIZE / 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2 - 6;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

// Palette
const BRAND = '#2A6D66';
const BRAND_DEEP = '#1d514c';
const RING_GREEN = '#3aa795';
const AMBER = '#f59e0b';
const ROSE = '#e11d48';
const TRACK = '#e3efec';

const formatTime = (secs) => {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function FinalScreen({ onRestart, measurements }) {
  const [secondsLeft, setSecondsLeft] = useState(SESSION_SECONDS);

  // Always call the latest onRestart without re-creating the timer
  const onRestartRef = useRef(onRestart);
  useEffect(() => {
    onRestartRef.current = onRestart;
  }, [onRestart]);

  // Guards against duplicate restarts (auto expiry, manual tap, Strict Mode)
  const hasRestartedRef = useRef(false);
  const triggerRestart = () => {
    if (hasRestartedRef.current) return;
    hasRestartedRef.current = true;
    onRestartRef.current?.();
  };

  // Deadline-based countdown: accurate even if the kiosk throttles timers
  const deadlineRef = useRef(null);
  useEffect(() => {
    if (deadlineRef.current === null) {
      deadlineRef.current = Date.now() + SESSION_SECONDS * 1000;
    }

    const tick = () => {
      const left = Math.max(
        Math.ceil((deadlineRef.current - Date.now()) / 1000),
        0
      );
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(timer);
        triggerRestart();
      }
    };

    const timer = setInterval(tick, 250);
    // Re-sync immediately when the page becomes visible again
    document.addEventListener('visibilitychange', tick);
    tick();

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
    // triggerRestart only touches refs, so it is safe to omit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same VISTRA_VITALS payload used in SummaryScreen (unchanged)
  const qrPayload = useMemo(() => {
    const m = measurements || {};
    const payload = {
      type: 'VISTRA_VITALS',
      version: '1.0',
      generatedAt: new Date().toISOString(),
      measurements: {
        height: m.height ? { value: m.height.value, unit: m.height.unit } : null,
        weight: m.weight ? { value: m.weight.value, unit: m.weight.unit } : null,
        temperature: m.temperature
          ? { value: m.temperature.value, unit: m.temperature.unit }
          : null,
        heartRate: m.heartAndOxygen
          ? { value: m.heartAndOxygen.heartRate, unit: 'bpm' }
          : null,
        spo2: m.heartAndOxygen
          ? { value: m.heartAndOxygen.bloodOxygen, unit: '%' }
          : null,
      },
    };
    return JSON.stringify(payload);
  }, [measurements]);

  const isWarning = secondsLeft <= WARNING_SECONDS;
  const isUrgent = secondsLeft <= URGENT_SECONDS;

  // Green -> amber -> rose as the code runs out
  const ringColor = isUrgent ? ROSE : isWarning ? AMBER : RING_GREEN;
  const digitColor = isUrgent ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-[#1d514c]';

  // Screen-reader message that changes only at coarse milestones
  const announcement = isUrgent
    ? 'The QR code expires in 10 seconds.'
    : isWarning
    ? 'The QR code expires in one minute or less.'
    : `The QR code expires in ${Math.ceil(secondsLeft / 60)} minutes.`;

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden select-none bg-gradient-to-b from-white via-white to-emerald-50 text-slate-800">
      <style>{`
        /* Ring drains clockwise on the same linear 300s clock as the deadline */
        @keyframes vt-drain { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -${RING_CIRCUMFERENCE}; } }
        @keyframes vt-orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes vt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        @keyframes vt-pop { from { transform: scale(0.75); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes vt-draw { to { stroke-dashoffset: 0; } }

        .vt-ring { animation: vt-drain ${SESSION_SECONDS}s linear forwards; }
        .vt-head { transform-origin: ${RING_CENTER}px ${RING_CENTER}px; animation: vt-orbit ${SESSION_SECONDS}s linear forwards; }
        .vt-urgent { animation: vt-pulse 1s ease-in-out infinite; }
        .vt-badge { animation: vt-pop 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.15) both; }
        .vt-check { stroke-dasharray: 1; stroke-dashoffset: 1; animation: vt-draw 0.5s 0.3s ease-out forwards; }

        @media (prefers-reduced-motion: reduce) {
          /* Countdown stays accurate; the ring ticks once per second instead of sweeping */
          .vt-ring, .vt-head { animation-timing-function: steps(${SESSION_SECONDS}, end); }
          .vt-urgent, .vt-badge { animation: none; }
          .vt-check { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Soft background decoration */}
      <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-emerald-200/40 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute -bottom-40 -right-28 w-[32rem] h-[32rem] rounded-full bg-teal-200/40 blur-3xl pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/3 right-[-6rem] w-64 h-64 rounded-full border border-emerald-200/60 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-1/4 left-[-5rem] w-48 h-48 rounded-full border border-emerald-200/50 pointer-events-none" aria-hidden="true" />

      {/* Screen-reader status (milestones only, not every second) */}
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {/* Brand */}
      

      {/* Single centered column: message, QR, timer */}
      <main className="relative flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-[clamp(0.75rem,2.2vh,1.75rem)] px-8 py-[clamp(0.5rem,1.5vh,1.25rem)]">
        {/* Success message */}
        <section
          className="flex flex-col items-center text-center"
          aria-labelledby="vt-title"
        >
 
          <h1
            id="vt-title"
            className="text-[clamp(2rem,4.5vh,3rem)] font-extrabold tracking-tight leading-tight"
            style={{ color: BRAND_DEEP }}
          >
            Health Check Complete
          </h1>
         
          <p className="mt-1 text-lg font-medium text-slate-700">
            Scan the QR code using the Vistra app to save your results in your account.
          </p>
        </section>

        {/* QR section */}
        <section
          className="flex flex-col items-center"
          aria-label="Results QR code"
        >
          <div
            className="relative shrink-0"
            style={{ width: 'min(38vh, 78vw)', aspectRatio: '1 / 1' }}
          >
            <svg
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className={`absolute inset-0 w-full h-full -rotate-90 overflow-visible ${isUrgent ? 'vt-urgent' : ''}`}
              aria-hidden="true"
            >
              {/* Track */}
              <circle
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                fill="none"
                stroke={TRACK}
                strokeWidth={RING_STROKE}
              />
              {/* Time remaining */}
              <circle
                className="vt-ring"
                cx={RING_CENTER}
                cy={RING_CENTER}
                r={RING_RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                style={{ transition: 'stroke 0.6s ease' }}
              />
              {/* Small head marking the leading edge of the drain */}
              <g className="vt-head">
                <circle
                  cx={RING_CENTER + RING_RADIUS}
                  cy={RING_CENTER}
                  r={RING_STROKE * 0.8}
                  fill="#ffffff"
                  stroke={ringColor}
                  strokeWidth={3.5}
                  style={{ transition: 'stroke 0.6s ease' }}
                />
              </g>
            </svg>

            {/* QR card */}
            <div
              className="absolute bg-white rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-900/10"
              style={{ inset: '17%', padding: '4%' }}
            >
              <QRCodeSVG
                value={qrPayload}
                size={256}
                level="M"
                fgColor="#0f172a"
                bgColor="#ffffff"
                role="img"
                aria-label="QR code containing your vital-sign results. Scan it with your phone."
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          </div>

          {/* Timer */}
          <div
            className="mt-[clamp(0.75rem,2vh,1.5rem)] text-center"
            role="timer"
            aria-label="Time until the QR code expires"
          >
            <p className="flex items-center justify-center gap-1.5 text-sm font-semibold tracking-[0.18em] text-slate-500">
              <ShieldCheck className="w-4 h-4" style={{ color: BRAND }} aria-hidden="true" />
              <span>QR CODE EXPIRES IN</span>
            </p>
            <p
              className={`text-[clamp(3.5rem,8vh,5.5rem)] leading-none font-extrabold tabular-nums transition-colors duration-500 ${digitColor}`}
            >
              {formatTime(secondsLeft)}
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative flex flex-col items-center gap-3 px-8 pb-[clamp(1rem,3vh,2rem)]">
        <button
          type="button"
          onClick={triggerRestart}
          aria-label="Return to home"
          className="inline-flex items-center justify-center gap-3 min-h-[4.5rem] px-12 text-white text-2xl font-bold rounded-full bg-gradient-to-b from-[#34897f] to-[#2A6D66] shadow-lg shadow-emerald-900/25 hover:from-[#2f7d73] hover:to-[#245d57] active:scale-95 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300 focus-visible:ring-offset-4 focus-visible:ring-offset-white"
        >
          <Home className="w-7 h-7" aria-hidden="true" />
          <span>Return to home</span>
        </button>
        <p className="flex items-center gap-2 text-base text-slate-600">
          <ArrowUp className="w-4 h-4" style={{ color: BRAND }} aria-hidden="true" />
          <span>Point up to return home</span>
        </p>
      </footer>
    </div>
  );
}