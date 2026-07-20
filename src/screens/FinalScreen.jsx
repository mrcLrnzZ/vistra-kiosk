import React from 'react';
import { CheckCircle2, Download, Home, Printer, QrCode } from 'lucide-react';

export default function FinalScreen({ onRestart }) {
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

        <div className="grid grid-cols-2 gap-6 w-full max-w-2xl mb-12">
          <button className="flex items-center justify-center space-x-3 py-6 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold text-xl border border-slate-200 transition-colors">
            <Download className="w-6 h-6 text-teal-600" />
            <span>Download Report</span>
          </button>

          <button className="flex items-center justify-center space-x-3 py-6 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold text-xl border border-slate-200 transition-colors">
            <Printer className="w-6 h-6 text-teal-600" />
            <span>Print Result</span>
          </button>
        </div>

        <div className="flex flex-col items-center p-6 bg-slate-50 rounded-3xl border border-slate-200 mb-12 w-full max-w-sm">
          <div className="flex items-center space-x-2 mb-4 text-slate-600 font-medium">
            <QrCode className="w-5 h-5" />
            <span>Scan to save on phone</span>
          </div>
          <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
            {/* Placeholder QR Code */}
            <div className="grid grid-cols-5 grid-rows-5 gap-1 w-full h-full opacity-30">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className={`bg-slate-800 ${Math.random() > 0.5 ? 'rounded-sm' : 'rounded-none'}`}></div>
              ))}
            </div>
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
