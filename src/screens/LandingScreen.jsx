
import React, { useEffect, useRef } from 'react';
import logoVistra from '../assets/logoVistra.png';

export default function LandingScreen({
  onStart,
  lastGesture,
  isTutorialActive,
}) {
  const lastProcessedGesture = useRef(lastGesture?.timestamp || 0);

  useEffect(() => {
    if (
      lastGesture &&
      lastGesture.timestamp > lastProcessedGesture.current
    ) {
      if (
        lastGesture.name === 'Select' ||
        lastGesture.name === 'Continue'
      ) {
        lastProcessedGesture.current = lastGesture.timestamp;
        onStart();
      }
    }
  }, [lastGesture, onStart]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-slate-50">

      {/* Ambient background decorations */}
      {!isTutorialActive && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          {/* Teal glow — upper left */}
          <div
            className="absolute -left-32 -top-32 h-[650px] w-[650px]
            rounded-full bg-teal-300/50 blur-[100px]"
          />

          {/* Blue glow — upper right */}
          <div
            className="absolute -right-32 top-10 h-[550px] w-[550px]
            rounded-full bg-sky-300/45 blur-[100px]"
          />

          {/* Emerald glow — bottom */}
          <div
            className="absolute -bottom-64 left-[20%] h-[550px] w-[700px]
            rounded-full bg-emerald-300/40 blur-[110px]"
          />

          {/* Subtle background gradient */}
          <div
            className="absolute inset-0
            bg-gradient-to-b from-white/10
            via-transparent to-teal-50/60"
          />
        </div>
      )}

      {/* Main content */}
      <div
        className="relative z-10 flex max-w-3xl flex-col items-center
        space-y-8 text-center opacity-100 transition-all duration-700"
      >

        {/* VISTRA Logo */}
        <div className="mb-4">
          <img
            src={logoVistra}
            alt="VISTRA Health Kiosk Logo"
            className="h-40 w-40 object-contain"
            draggable="false"
          />
        </div>

        {/* Title */}
        <h1 className="text-6xl font-extrabold tracking-tight text-slate-800">
          VISTRA Health{' '}
          <span className="text-teal-600">Kiosk</span>
        </h1>

        {/* Description */}
        <p className="mt-4 text-3xl font-light text-slate-600">
          Monitor your vital signs quickly and safely.
        </p>

        {/* Start button */}
        <button
          onClick={onStart}
          className="mt-12 flex items-center space-x-4 rounded-full
          bg-teal-600 px-12 py-6 text-3xl font-bold text-white
          shadow-2xl shadow-teal-600/30 transition-all
          duration-200 hover:scale-105 hover:bg-teal-500
          active:scale-95 focus:outline-none focus:ring-4
          focus:ring-teal-300"
        >
          <span>Start Health Check</span>

          <svg
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </button>

        {/* Gesture instructions */}
        <div
          className="mx-auto mt-16 max-w-xl border-t
          border-slate-200 pt-8 text-xl text-slate-500"
        >
          Show a gesture to view the tutorial, or point up
          to start the health check.
        </div>

      </div>
    </div>
  );
}
