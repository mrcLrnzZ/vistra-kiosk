import React from 'react';
import clsx from 'clsx';
import { SENSOR_INSTRUCTIONS } from '../services/sensorService';
import { Loader2, Radio, Waves, RotateCcw } from 'lucide-react';

/**
 * Full-screen measuring state overlay with live status from Arduino.
 * Shows different messages and animations based on the current measurement state.
 *
 * Props:
 *   sensor        – object from the SENSORS array ({ id, label, icon, color, bg })
 *   liveStatus    – current UI state: 'waiting' | 'stabilizing' | 'measuring' | 'retrying'
 *   statusMessage – { title, subtitle } for the current state
 */
export default function SensorMeasuring({ sensor, liveStatus, statusMessage }) {
  const instructions = SENSOR_INSTRUCTIONS[sensor.id];
  const Icon = sensor.icon;

  // Determine display text based on live status
  const title = statusMessage?.title || instructions?.measuringText || 'Measuring...';
  const subtitle = statusMessage?.subtitle || 'Please hold still.';

  // Animation style varies by state
  const isWaiting = liveStatus === 'waiting';
  const isStabilizing = liveStatus === 'stabilizing';
  const isRetrying = liveStatus === 'retrying';
  const isMeasuring = liveStatus === 'measuring' || !liveStatus;

  // Pick a secondary status icon
  const StatusIcon = isWaiting ? Radio
    : isStabilizing ? Waves
    : isRetrying ? RotateCcw
    : Loader2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl w-full max-w-2xl flex flex-col items-center text-center">

        {/* Animated icon */}
        <div className={clsx(
          'w-36 h-36 rounded-full flex items-center justify-center mb-10 transition-all duration-700',
          sensor.bg,
          isWaiting && 'animate-pulse',
          isStabilizing && 'scale-105',
          isRetrying && 'scale-95',
        )}>
          <Icon className={clsx(
            'w-20 h-20 transition-all duration-500',
            sensor.color,
            isMeasuring && 'animate-pulse',
          )} />
        </div>

        {/* Sensor label */}
        <h3 className="text-4xl font-bold text-slate-800 mb-4">{sensor.label}</h3>

        {/* Live status title */}
        <p className="text-2xl text-slate-700 font-semibold mb-2">{title}</p>

        {/* Live status subtitle */}
        <p className="text-lg text-slate-400 font-medium mb-8">{subtitle}</p>

        {/* Animated loading indicator */}
        <div className="flex items-center gap-3 mb-4">
          {isMeasuring || isStabilizing ? (
            // Bouncing dots for active measurement
            <>
              <span className={clsx('w-4 h-4 rounded-full animate-bounce', sensor.color.replace('text-', 'bg-'))}
                    style={{ animationDelay: '0ms' }} />
              <span className={clsx('w-4 h-4 rounded-full animate-bounce', sensor.color.replace('text-', 'bg-'))}
                    style={{ animationDelay: '150ms' }} />
              <span className={clsx('w-4 h-4 rounded-full animate-bounce', sensor.color.replace('text-', 'bg-'))}
                    style={{ animationDelay: '300ms' }} />
            </>
          ) : isRetrying ? (
            // Spinning retry icon
            <RotateCcw className={clsx('w-8 h-8 animate-spin', sensor.color)} style={{ animationDuration: '2s' }} />
          ) : (
            // Pulsing radio icon for waiting
            <StatusIcon className={clsx('w-8 h-8 animate-pulse', sensor.color)} />
          )}
        </div>

        {/* Status badge */}
        <div className={clsx(
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider',
          isWaiting && 'bg-amber-50 text-amber-600 border border-amber-200',
          isStabilizing && 'bg-blue-50 text-blue-600 border border-blue-200',
          isMeasuring && 'bg-teal-50 text-teal-600 border border-teal-200',
          isRetrying && 'bg-orange-50 text-orange-600 border border-orange-200',
        )}>
          <StatusIcon className="w-4 h-4" />
          {isWaiting ? 'Waiting' : isStabilizing ? 'Stabilizing' : isRetrying ? 'Retrying' : 'Measuring'}
        </div>

        {/* Do not disturb message */}
        {(isMeasuring || isStabilizing || isRetrying) && (
          <p className="text-sm text-slate-400 mt-6">Please hold still. Do not move during measurement.</p>
        )}
      </div>
    </div>
  );
}
