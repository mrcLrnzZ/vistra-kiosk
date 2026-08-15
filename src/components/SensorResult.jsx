import React from 'react';
import { ArrowUp, ThumbsUp, ThumbsDown, AlertTriangle, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { formatSensorResult } from '../services/sensorService';

/**
 * Full-screen result display with Measure Again / Continue / Back actions.
 * Also renders the error state when isError is true.
 *
 * Props:
 *   sensor         – object from the SENSORS array
 *   result         – structured result from readSensor()
 *   isError        – boolean, true if the measurement failed
 *   onMeasureAgain – restart the instruction workflow for the same sensor
 *   onContinue     – accept the result and proceed
 *   onBack         – return to the sensor selection menu
 */
export default function SensorResult({ sensor, result, isError, onMeasureAgain, onContinue, onBack }) {
  const Icon = sensor.icon;

  // ---- Error State ----
  if (isError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
        <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl w-full max-w-2xl flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-red-50 flex items-center justify-center mb-8">
            <AlertTriangle className="w-16 h-16 text-red-500" />
          </div>

          <h3 className="text-4xl font-bold text-slate-800 mb-4">Measurement Failed</h3>
          <p className="text-xl text-slate-500 mb-10">
            We could not obtain a reading.<br />Please try again.
          </p>

          <div className="flex gap-4 w-full max-w-md">
            <button
              onClick={onBack}
              className="flex-1 py-4 rounded-2xl border-2 border-slate-200 text-slate-500 font-semibold text-lg hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={onMeasureAgain}
              className="flex-1 py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---- Success Result ----
  const displayValue = formatSensorResult(sensor.id, result);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] p-16 shadow-2xl w-full max-w-2xl flex flex-col items-center text-center">

        {/* Sensor icon */}
        <div className={clsx('w-32 h-32 rounded-full flex items-center justify-center mb-6', sensor.bg)}>
          <Icon className={clsx('w-16 h-16', sensor.color)} />
        </div>

        {/* Sensor label */}
        <h3 className="text-3xl font-bold text-slate-800 mb-2">{sensor.label}</h3>

        {/* Result value */}
        <div className={clsx('text-6xl font-extrabold my-6', sensor.color)}>
          {displayValue}
        </div>

        {/* TEST DATA warning */}
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-10">
          ⚠ Test Data — Simulated Reading
        </div>

        {/* Action buttons with gesture hints */}
        <div className="flex flex-col gap-4 w-full max-w-lg">
          {/* Measure Again */}
          <button
            onClick={onMeasureAgain}
            className="w-full py-4 rounded-2xl border-2 border-teal-200 text-teal-700 font-semibold text-lg hover:bg-teal-50 transition-colors flex items-center justify-center gap-3"
          >
            <ArrowUp className="w-5 h-5" />
            <span>Measure Again</span>
            <span className="text-sm text-slate-400 ml-2">↑ Point Up</span>
          </button>

          {/* Continue */}
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-lg shadow-lg transition-colors flex items-center justify-center gap-3"
          >
            <ThumbsUp className="w-5 h-5" />
            <span>Continue</span>
            <span className="text-sm text-teal-200 ml-2">👍 Thumbs Up</span>
          </button>

          {/* Back to Sensors */}
          <button
            onClick={onBack}
            className="w-full py-3 rounded-2xl text-slate-400 font-medium text-base hover:text-slate-600 transition-colors flex items-center justify-center gap-3"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>Back to Sensors</span>
            <span className="text-sm text-slate-300 ml-2">👎 Thumbs Down</span>
          </button>
        </div>
      </div>
    </div>
  );
}
