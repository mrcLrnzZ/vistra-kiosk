import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Hand, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

export default function ModeSelectionScreen({ onSelectMode, onBack, lastGesture }) {
  const [selectedIndex, setSelectedIndex] = useState(0); // 0: Auto, 1: Manual
  const lastProcessedTime = useRef(lastGesture?.timestamp || 0);

  const MODES = [
    {
      id: 'auto',
      title: 'Automatic Measurement',
      icon: Sparkles,
      description: 'Measures all available vital signs automatically in sequence. The system will guide you through each measurement step-by-step.',
      color: 'text-teal-500',
      bg: 'bg-teal-50',
      ring: 'ring-teal-500',
      shadow: 'shadow-[0_15px_40px_-10px_rgba(20,184,166,0.6)]'
    },
    {
      id: 'manual',
      title: 'Manual Measurement',
      icon: Hand,
      description: 'Measure at your own pace. Choose which vital signs you want to measure and in any order. Skip what you don\'t need.',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      ring: 'ring-blue-500',
      shadow: 'shadow-[0_15px_40px_-10px_rgba(59,130,246,0.6)]'
    }
  ];

  useEffect(() => {
    if (!lastGesture || lastGesture.timestamp <= lastProcessedTime.current) return;
    lastProcessedTime.current = lastGesture.timestamp;

    const gesture = lastGesture.name;

    if (gesture === 'Next') {
      setSelectedIndex(1);
    } else if (gesture === 'Previous') {
      setSelectedIndex(0);
    } else if (gesture === 'Select' || gesture === 'Continue') {
      onSelectMode(MODES[selectedIndex].id);
    } else if (gesture === 'Back') {
      onBack();
    }
  }, [lastGesture, selectedIndex, onSelectMode, onBack]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 relative p-8">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-[10%] right-[-5%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      
      <div className="z-10 w-full max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-extrabold text-slate-800 mb-4">Choose Measurement Mode</h2>
          <p className="text-2xl text-slate-500 font-light">Hover left or right to switch, Thumbs Up to select.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full">
          {MODES.map((mode, index) => {
            const isSelected = index === selectedIndex;
            const Icon = mode.icon;

            return (
              <div
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={clsx(
                  "relative rounded-3xl p-10 flex flex-col items-center text-center justify-between transition-all duration-300 ease-out cursor-pointer",
                  isSelected
                    ? `bg-white ring-4 ${mode.ring} ${mode.shadow} scale-105 z-10`
                    : "bg-white/70 border border-slate-200 opacity-60 scale-100 hover:opacity-80"
                )}
              >
                {isSelected && (
                  <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${mode.bg} ${mode.color} border border-current px-6 py-1 rounded-full text-sm font-bold uppercase tracking-widest shadow-md flex items-center`}>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Selected
                  </div>
                )}

                <div className={clsx("w-32 h-32 rounded-full flex items-center justify-center mb-8", mode.bg)}>
                  <Icon className={clsx("w-16 h-16", mode.color)} />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4">{mode.title}</h3>
                <p className="text-xl text-slate-500 leading-relaxed mb-8 flex-1">{mode.description}</p>

                <div
                  className={clsx(
                    "w-full py-5 font-bold text-xl rounded-2xl transition-colors",
                    isSelected ? `bg-slate-800 text-white shadow-md` : "bg-slate-100 text-slate-400"
                  )}
                >
                  {isSelected ? "Thumbs Up to Select" : "Tap to Select"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
