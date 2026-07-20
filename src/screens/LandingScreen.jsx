import React from 'react';
import { Activity } from 'lucide-react';

export default function LandingScreen({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="z-10 flex flex-col items-center text-center space-y-8 max-w-3xl">
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
    </div>
  );
}
