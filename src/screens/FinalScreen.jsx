import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Home, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function FinalScreen({ onRestart, measurements }) {
  const [secondsLeft, setSecondsLeft] = useState(300);
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRestart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  // Build the same VISTRA_VITALS JSON payload used in SummaryScreen
  const qrPayload = useMemo(() => {
    const m = measurements || {};
    const payload = {
      type: 'VISTRA_VITALS',
      version: '1.0',
      generatedAt: new Date().toISOString(),
      measurements: {
        height: m.height
          ? { value: m.height.value, unit: m.height.unit }
          : null,
        weight: m.weight
          ? { value: m.weight.value, unit: m.weight.unit }
          : null,
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
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-teal-50 relative overflow-hidden p-8">
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl opacity-50 animate-blob"></div>

      <div className="bg-white rounded-[3rem] shadow-2xl p-16 max-w-4xl w-full flex flex-col items-center text-center relative z-10 border border-teal-100">

        <div className="w-40 h-40 bg-green-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
          <CheckCircle2 className="w-24 h-24 text-green-500" />
        </div>

        <h2 className="text-6xl font-extrabold text-slate-800 mb-4">Health Check Complete</h2>
        <p className="text-2xl text-slate-500 mb-12">Your results have been securely processed.</p>

        {/* Removed Download and Print buttons per spec */}

        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border border-slate-200 mb-12 w-full max-w-sm">
          <div className="flex items-center space-x-2 mb-4 text-slate-600 font-medium">
            <QrCode className="w-5 h-5" />
            <span>Point Up to Return to Home</span>
          </div>
          <div className="text-center text-4xl font-bold text-slate-800 mb-4">
            {formatTime(secondsLeft)}
          </div>
          <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
            <QRCodeSVG
              value={qrPayload}
              size={176}
              level="M"
              fgColor="#0f172a"
              bgColor="#ffffff"
            />
          </div>
        </div>

        <button
          onClick={onRestart}
          className="px-12 py-5 bg-teal-600 hover:bg-teal-500 text-white text-2xl font-bold rounded-full shadow-xl shadow-teal-600/20 transition-transform transform hover:scale-105 flex items-center space-x-3"
        >
          <Home className="w-6 h-6" />
          <span>Return to Home</span>
        </button>

      </div>
    </div>
  );
}
