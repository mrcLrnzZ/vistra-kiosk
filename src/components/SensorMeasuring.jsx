import React from 'react';
import clsx from 'clsx';
import { SENSOR_INSTRUCTIONS } from '../services/sensorService';

/**
 * Full-screen measuring state overlay.
 * Shows animated sensor icon, measuring text, and loading dots.
 *
 * Props:
 *   sensor – object from the SENSORS array ({ id, label, icon, color, bg })
 */
export default function SensorMeasuring({ sensor }) {
  const instructions = SENSOR_INSTRUCTIONS[sensor.id];
  const Icon = sensor.icon;
  const measuringText = instructions?.measuringText || 'Measuring...';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl w-full max-w-2xl flex flex-col items-center text-center">

        {/* Animated icon */}
        <div className={clsx('w-36 h-36 rounded-full flex items-center justify-center mb-10', sensor.bg)}>
          <Icon className={clsx('w-20 h-20 animate-pulse', sensor.color)} />
        </div>

        {/* Sensor label */}
        <h3 className="text-4xl font-bold text-slate-800 mb-4">{sensor.label}</h3>

        {/* Measuring text */}
        <p className="text-2xl text-slate-500 font-medium mb-8">{measuringText}</p>

        {/* Animated loading dots */}
        <div className="flex items-center gap-3">
          <span className={clsx('w-4 h-4 rounded-full animate-bounce', sensor.color.replace('text-', 'bg-'))}
                style={{ animationDelay: '0ms' }} />
          <span className={clsx('w-4 h-4 rounded-full animate-bounce', sensor.color.replace('text-', 'bg-'))}
                style={{ animationDelay: '150ms' }} />
          <span className={clsx('w-4 h-4 rounded-full animate-bounce', sensor.color.replace('text-', 'bg-'))}
                style={{ animationDelay: '300ms' }} />
        </div>

        {/* Do not disturb message */}
        <p className="text-sm text-slate-400 mt-8">Please hold still. Do not move during measurement.</p>
      </div>
    </div>
  );
}
