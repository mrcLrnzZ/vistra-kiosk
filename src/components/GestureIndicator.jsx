import React from 'react';
import { Camera, Hand, Activity, Timer, MoveHorizontal } from 'lucide-react';
import clsx from 'clsx';

export default function GestureIndicator({ status }) {
  const isCooldown = status?.cooldownRemaining > 0;

  return (
    <div className="absolute top-6 right-6 z-[110] bg-white/95 backdrop-blur-md shadow-xl rounded-2xl p-5 flex flex-col min-w-[280px] border border-teal-100 transition-all duration-300">
      <div className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-3 uppercase tracking-wider">
        System Status
      </div>

      <div className="flex flex-col space-y-3">
        {/* Camera */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </div>
          <span className="font-bold text-teal-600">
            {status ? status.camera : 'Initializing...'}
          </span>
        </div>

        {/* Hand */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <Hand className="w-4 h-4" />
            <span>Hand</span>
          </div>
          <span className={clsx("font-bold transition-colors", status?.hand === 'Detected' ? 'text-teal-600' : 'text-slate-400')}>
            {status ? status.hand : 'Waiting...'}
          </span>
        </div>

        {/* Zone */}
        <div className="flex flex-col space-y-1 pt-2 border-t border-slate-50">
          <div className="flex items-center space-x-2 text-slate-500 font-medium text-sm">
            <MoveHorizontal className="w-4 h-4" />
            <span>Position Zone</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100 shadow-inner">
            <span className={clsx(
              "font-bold transition-colors", 
              status?.zone === 'Left' || status?.zone === 'Right' ? 'text-blue-600' : 'text-slate-800'
            )}>
              {status ? status.zone : 'Waiting...'}
            </span>
          </div>
        </div>

        {/* Gesture */}
        <div className="flex flex-col space-y-1 pt-2 border-t border-slate-50">
          <div className="flex items-center space-x-2 text-slate-500 font-medium text-sm">
            <Activity className="w-4 h-4" />
            <span>Gesture</span>
          </div>
          <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100 shadow-inner">
            <span className="font-bold text-slate-800">
              {status ? status.gesture : 'Waiting...'}
            </span>
          </div>
        </div>

        {/* Cooldown */}
        <div className="flex items-center justify-between text-sm pt-2">
          <div className="flex items-center space-x-2 text-slate-500 font-medium">
            <Timer className="w-4 h-4" />
            <span>Cooldown</span>
          </div>
          <span className={clsx(
            "font-bold transition-colors",
            isCooldown ? "text-amber-500" : "text-green-500"
          )}>
            {isCooldown ? `${status.cooldownRemaining}s` : 'Ready'}
          </span>
        </div>
      </div>


    </div>
  );
}