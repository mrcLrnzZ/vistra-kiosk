import { useState } from 'react';
import { ArrowUp, ThumbsDown, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import clsx from 'clsx';
import { SENSOR_INSTRUCTIONS } from '../services/sensorService';
import { speak, setMuted, getMuted } from '../services/voiceService';

/**
 * Reusable instruction modal for all sensors.
 * Displays preparation steps, gesture hints, and a touchscreen fallback.
 *
 * Props:
 *   sensor       – object from the SENSORS array ({ id, label, icon, color, bg })
 *   onReady      – called when user is ready (Point Up gesture or button)
 *   onCancel     – called when user cancels (Thumbs Down gesture or button)
 *   voiceInstruction – the voice instruction text for this sensor
 */
export default function SensorInstructionModal({ sensor, onReady, onCancel, voiceInstruction }) {
  const instructions = SENSOR_INSTRUCTIONS[sensor.id];

  const [isMuted, setIsMutedState] = useState(() => getMuted());

  const Icon = sensor.icon;

  if (!instructions) return null;

  // Handle mute toggle
  const handleMuteToggle = () => {
    const newMuted = setMuted(!isMuted);
    setIsMutedState(newMuted);
  };

  // Handle replay
  const handleReplay = async () => {
    if (voiceInstruction) {
      await speak(voiceInstruction);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl relative transform transition-all flex flex-col items-center text-center overflow-hidden">

        {/* Header band with sensor color */}
        <div className={clsx('w-full py-8 flex flex-col items-center', sensor.bg)}>
          {/* Voice Controls */}
          <div className="absolute top-6 right-8 flex items-center gap-2">
            <button
              onClick={handleReplay}
              className="p-2 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Replay voice instruction"
              title="Replay instruction"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleMuteToggle}
              className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label={isMuted ? 'Unmute voice instructions' : 'Mute voice instructions'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

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
