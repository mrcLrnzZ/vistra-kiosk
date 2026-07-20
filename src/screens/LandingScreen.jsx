import React, { useState, useEffect, useRef } from 'react';
import { Activity, Hand, MoveRight, MoveLeft } from 'lucide-react';

function GestureRow({ icon, name, action, delay, show }) {
  return (
    <div
      className={`flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-500 transform ${
        show ? `opacity-100 translate-x-0 ${delay}` : 'opacity-0 -translate-x-8'
      }`}
    >
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-14 h-14 bg-white rounded-xl shadow-sm text-teal-600">
          {icon}
        </div>
        <span className="text-2xl font-semibold text-slate-700">{name}</span>
      </div>
      <span className="text-xl font-medium text-slate-500">{action}</span>
    </div>
  );
}

export default function LandingScreen({ onStart, gestureStatus, lastGesture }) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const lastProcessedGesture = useRef(0);

  useEffect(() => {
    if (gestureStatus?.hand === 'Detected') {
      if (!hasAcknowledged) {
        setShowInstructions(true);
      }
    } else {
      const timer = setTimeout(() => {
        setShowInstructions(false);
        setHasAcknowledged(false); // Only reset acknowledgment if hand is completely gone for 4 seconds
      }, 4000); 
      return () => clearTimeout(timer);
    }
  }, [gestureStatus?.hand, hasAcknowledged]);

  useEffect(() => {
    if (lastGesture && lastGesture.timestamp > lastProcessedGesture.current) {
      if (lastGesture.name === 'Select') { // Thumbs Up
        lastProcessedGesture.current = lastGesture.timestamp;
        if (showInstructions) {
          setShowInstructions(false);
          setHasAcknowledged(true);
        } else {
          onStart();
        }
      } else if (lastGesture.name === 'Continue') { // Point Up
        lastProcessedGesture.current = lastGesture.timestamp;
        onStart(); // Point Up always starts the check, even if modal is visible
      }
    }
  }, [lastGesture, showInstructions, onStart]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className={`z-10 flex flex-col items-center text-center space-y-8 max-w-3xl transition-all duration-700 ${showInstructions ? 'opacity-30 blur-sm scale-95' : 'opacity-100'}`}>
        <div className="bg-white p-8 rounded-full shadow-xl shadow-teal-100/50 mb-4 ring-1 ring-teal-50">
          <Activity className="w-32 h-32 text-teal-500" />
        </div>

        <h1 className="text-6xl font-extrabold text-slate-800 tracking-tight">
          University Health <span className="text-teal-600">Kiosk</span>
        </h1>

        <p className="text-3xl text-slate-600 font-light mt-4">
          Monitor your vital signs quickly and safely.
        </p>

        <button
          onClick={onStart}
          className="mt-12 px-12 py-6 bg-teal-600 hover:bg-teal-500 text-white text-3xl font-bold rounded-full shadow-2xl shadow-teal-600/30 transition-all transform hover:scale-105 active:scale-95 flex items-center space-x-4"
        >
          <span>Start Health Check</span>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>

        <div className="mt-16 pt-8 border-t border-slate-200 text-slate-500 text-xl max-w-xl mx-auto">
          This kiosk demonstrates contactless health screening using smart sensors.
        </div>
      </div>

      {/* Hand Gesture Instructions Overlay */}
      <div
        className={`absolute inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-700 pointer-events-none ${
          showInstructions ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div
          className={`bg-white rounded-3xl shadow-2xl p-10 max-w-2xl w-full transform transition-all duration-700 delay-100 pointer-events-none ${
            showInstructions ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
          }`}
        >
          <div className="flex items-center space-x-4 mb-8">
            <div className="bg-teal-100 p-3 rounded-2xl flex items-center justify-center">
              <Hand className="w-10 h-10 text-teal-600" />
            </div>
            <h2 className="text-4xl font-bold text-slate-800">How to Navigate</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <GestureRow icon={<MoveRight className="w-8 h-8" />} name="Hover Right" action="Move Right" delay="delay-[200ms]" show={showInstructions} />
            <GestureRow icon={<MoveLeft className="w-8 h-8" />} name="Hover Left" action="Move Left" delay="delay-[300ms]" show={showInstructions} />
            <GestureRow icon={<span className="text-3xl">👍</span>} name="Thumbs Up" action="Select / Confirm" delay="delay-[400ms]" show={showInstructions} />
            <GestureRow icon={<span className="text-3xl">☝️</span>} name="Point Up" action="Continue / Next" delay="delay-[500ms]" show={showInstructions} />
            <GestureRow icon={<span className="text-3xl">👎</span>} name="Thumbs Down" action="Back / Exit" delay="delay-[600ms]" show={showInstructions} />
          </div>

          <div className={`mt-8 text-center transition-all duration-700 delay-[800ms] ${showInstructions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <p className="text-xl text-teal-600 font-bold bg-teal-50 inline-block px-6 py-3 rounded-full border border-teal-100 shadow-sm">
              👍 Give a Thumbs Up if understood
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
