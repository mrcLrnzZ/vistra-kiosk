import React, { useEffect, useRef } from 'react';
import { QrCode } from 'lucide-react';

export default function AccountChoiceScreen({ onGuestContinue, lastGesture }) {
  const lastProcessedGesture = useRef(lastGesture?.timestamp || 0);

  useEffect(() => {
    if (lastGesture && lastGesture.timestamp > lastProcessedGesture.current) {
      if (lastGesture.name === 'Continue') { // Point Up
        lastProcessedGesture.current = lastGesture.timestamp;
        onGuestContinue();
      }
    }
  }, [lastGesture, onGuestContinue]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 relative overflow-hidden">
      
      <div className="z-10 flex flex-col items-center text-center space-y-12 max-w-5xl transition-all duration-700 opacity-100 w-full px-8">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-6xl font-extrabold text-slate-800 tracking-tight">
            Do you have an account?
          </h1>
          <p className="text-2xl text-slate-600 font-light max-w-3xl mx-auto leading-relaxed">
            If you already have an account, scan the QR code below to sign in and <strong className="font-bold text-slate-800"> Automatically save your vital data to your account.</strong><br/>
            If you don't have an account, simply use the <strong className="font-bold text-slate-800">Point Up</strong> gesture to continue as a guest.
          </p>
        </div>

        {/* QR Code Placeholder Section */}
        <div className="bg-white p-12 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center space-y-6">
          <div className="bg-slate-50 p-8 rounded-2xl border-4 border-dashed border-slate-200">
            <QrCode className="w-48 h-48 text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="text-2xl font-medium text-slate-500">
            Scan this QR code to sign in.
          </p>
        </div>

        {/* Guest Continue Section */}
        <div className="mt-8 pt-8 w-full border-t border-slate-200 flex flex-col items-center">
          <div onClick={onGuestContinue} className="cursor-pointer bg-teal-50 px-10 py-6 rounded-3xl border border-teal-100 flex items-center space-x-6 transform transition-transform shadow-sm hover:shadow-md hover:scale-[1.02]">
            <div className="bg-teal-500 p-4 rounded-full text-white shadow-md flex items-center justify-center w-16 h-16">
              <span className="text-4xl">☝️</span>
            </div>
            <div className="text-left">
              <h3 className="text-3xl font-bold text-teal-800 tracking-tight">Point Up to Continue as Guest</h3>
              <p className="text-lg text-teal-600/80 font-medium">No account required.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
