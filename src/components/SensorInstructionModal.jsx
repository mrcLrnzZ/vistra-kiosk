import React from 'react';
import { ArrowUp, ThumbsDown } from 'lucide-react';
import clsx from 'clsx';
import { SENSOR_INSTRUCTIONS } from '../services/sensorService';

/**
 * Reusable instruction modal for all sensors.
 * Displays preparation steps, gesture hints, and a touchscreen fallback.
 *
 * Props:
 *   sensor       – object from the SENSORS array ({ id, label, icon, color, bg })
 *   onReady      – called when user is ready (Point Up gesture or button)
 *   onCancel     – called when user cancels (Thumbs Down gesture or button)
 */
export default function SensorInstructionModal({ sensor, onReady, onCancel }) {
  const instructions = SENSOR_INSTRUCTIONS[sensor.id];
  if (!instructions) return null;

  const Icon = sensor.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl relative transform transition-all flex flex-col items-center text-center overflow-hidden">

        {/* Header band with sensor color */}
        <div className={clsx('w-full py-8 flex flex-col items-center', sensor.bg)}>
          <div className={clsx('w-28 h-28 rounded-full bg-white/80 flex items-center justify-center mb-4 shadow-lg')}>
            <Icon className={clsx('w-14 h-14', sensor.color)} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800">{instructions.title}</h2>
        </div>

        {/* Steps */}
        <div className="px-12 py-8 w-full">
          <ol className="text-left space-y-4">
            {instructions.steps.map((step, i) => (
              <li key={i} className="flex items-start text-xl text-slate-700">
                <span className={clsx(
                  'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base font-bold mr-4 mt-0.5',
                  sensor.bg, sensor.color
                )}>
                  {i + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Ready prompt */}
        <div className="w-full border-t border-slate-100 px-12 py-8 flex flex-col items-center gap-5">
          {/* Gesture hint */}
          <div className="flex flex-col items-center gap-2 text-slate-500">
            <ArrowUp className="w-10 h-10 text-teal-500 animate-bounce" />
            <span className="text-xl font-medium">{instructions.readyText}</span>
          </div>

          {/* Touchscreen fallback buttons */}
          <div className="flex gap-4 w-full max-w-md">
            <button
              onClick={onCancel}
              className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-semibold text-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <ThumbsDown className="w-5 h-5" />
              Cancel
            </button>
            <button
              onClick={onReady}
              className="flex-1 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowUp className="w-5 h-5" />
              I'm Ready
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
