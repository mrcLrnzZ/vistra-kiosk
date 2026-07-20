import React, { useState, useEffect, useRef } from 'react';
import { Ruler, Weight, Thermometer, Activity, Wind, HeartPulse, CheckCircle2, X } from 'lucide-react';
import clsx from 'clsx';

const SENSORS = [
  { id: 'height', label: 'Height', icon: Ruler, description: 'Measure your height automatically.', btnText: 'Measure Height', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'weight', label: 'Weight', icon: Weight, description: 'Measure your body weight.', btnText: 'Measure Weight', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'temperature', label: 'Body Temperature', icon: Thermometer, description: 'Non-contact temperature scan.', btnText: 'Scan Temperature', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'heartRate', label: 'Heart Rate', icon: Activity, description: 'Measure your pulse rate.', btnText: 'Measure BPM', color: 'text-rose-500', bg: 'bg-rose-50' },
  { id: 'bloodOxygen', label: 'Blood Oxygen (SpO₂)', icon: Wind, description: 'Measure oxygen saturation.', btnText: 'Measure SpO₂', color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { id: 'bloodPressure', label: 'Blood Pressure', icon: HeartPulse, description: 'Measure systolic and diastolic pressure.', btnText: 'Measure BP', color: 'text-purple-500', bg: 'bg-purple-50' },
];

export default function HealthCheckScreen({ mode, measurements, setMeasurements, onComplete, onBack, lastGesture }) {
  const [activeSensor, setActiveSensor] = useState(null);
  const [readingState, setReadingState] = useState('idle'); // idle, preparing, scanning, processing, done
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastProcessedTime = useRef(lastGesture?.timestamp || 0);

  const isAuto = mode === 'auto';
  const completedCount = SENSORS.filter(s => measurements[s.id] !== undefined).length;
  const allCompleted = completedCount === SENSORS.length;

  // Auto mode sequencer
  useEffect(() => {
    if (isAuto && !activeSensor && !allCompleted) {
       const nextIndex = SENSORS.findIndex(s => measurements[s.id] === undefined);
       if (nextIndex !== -1) {
         setSelectedIndex(nextIndex);
         handleMeasureClick(SENSORS[nextIndex]);
       }
    } else if (isAuto && !activeSensor && allCompleted) {
       onComplete();
    }
  }, [isAuto, activeSensor, allCompleted, measurements, onComplete]);

  // Gesture handling
  useEffect(() => {
    if (!lastGesture || lastGesture.timestamp <= lastProcessedTime.current) return;
    lastProcessedTime.current = lastGesture.timestamp;

    const gesture = lastGesture.name;

    // Handle gestures when a modal is open
    if (activeSensor) {
      if (gesture === 'Back') {
        if (isAuto) onBack(); else closeModal();
      } else if (gesture === 'Continue' && readingState === 'done') {
        closeModal();
      }
      return;
    }

    if (isAuto) return; // Prevent manual grid navigation in auto mode

    if (gesture === 'Next') {
      setSelectedIndex(prev => (prev + 1) % SENSORS.length);
    } else if (gesture === 'Previous') {
      setSelectedIndex(prev => (prev - 1 + SENSORS.length) % SENSORS.length);
    } else if (gesture === 'Select') {
      if (!allCompleted) {
        handleMeasureClick(SENSORS[selectedIndex]);
      }
    } else if (gesture === 'Continue') {
      if (completedCount > 0) {
        onComplete();
      }
    } else if (gesture === 'Back') {
      onBack();
    }
  }, [lastGesture, activeSensor, readingState, selectedIndex, allCompleted, completedCount, onComplete, onBack, isAuto]);

  const handleMeasureClick = (sensor) => {
    setActiveSensor(sensor);
    setReadingState('preparing');

    setTimeout(() => setReadingState('scanning'), 1000);
    setTimeout(() => setReadingState('processing'), 2000);

    setTimeout(() => {
      setReadingState('done');
      const val = generateRandomValue(sensor.id);
      setMeasurements(prev => ({ ...prev, [sensor.id]: val }));
    }, 3000);
  };

  const generateRandomValue = (id) => {
    switch (id) {
      case 'height': return (150 + Math.random() * 40).toFixed(1) + ' cm';
      case 'weight': return (50 + Math.random() * 40).toFixed(1) + ' kg';
      case 'temperature': return (36.1 + Math.random() * 1.5).toFixed(1) + ' °C';
      case 'heartRate': return Math.floor(60 + Math.random() * 40) + ' BPM';
      case 'bloodOxygen': return Math.floor(95 + Math.random() * 5) + '%';
      case 'bloodPressure': return `${Math.floor(110 + Math.random() * 20)} / ${Math.floor(70 + Math.random() * 15)} mmHg`;
      default: return 'N/A';
    }
  };

  const closeModal = () => {
    setActiveSensor(null);
    setReadingState('idle');
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-8 relative">
      <div className="flex flex-col mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-4xl font-bold text-slate-800">
              {isAuto ? "Automatic Health Check" : "Manual Health Check"}
            </h2>
            <p className="text-xl text-slate-500 mt-1">
              {isAuto ? "Please wait while we process your measurements." : "Use hand gestures to navigate and select."}
            </p>
          </div>
          <button
            onClick={onComplete}
            disabled={completedCount === 0}
            className={clsx(
              "px-8 py-4 text-2xl font-bold rounded-2xl shadow-lg transition-all",
              completedCount > 0
                ? "bg-teal-600 hover:bg-teal-500 text-white transform hover:scale-105"
                : "bg-slate-200 text-slate-400 cursor-not-allowed",
              completedCount > 0 && !isAuto ? "animate-[pulse_2s_infinite]" : ""
            )}
          >
            {isAuto ? "Auto Mode Active" : "Done (Continue)"}
          </button>
        </div>

        <div className="w-full">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">Overall Progress</span>
            <span className="text-teal-600 font-bold text-lg">{completedCount} / {SENSORS.length} Measurements Completed</span>
          </div>
          <div className="bg-slate-200 h-3 rounded-full overflow-hidden w-full shadow-inner">
            <div className="bg-teal-500 h-full transition-all duration-700 ease-out" style={{ width: `${(completedCount / SENSORS.length) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 flex-1">
        {SENSORS.map((sensor, index) => {
          const Icon = sensor.icon;
          const isCompleted = measurements[sensor.id] !== undefined;
          const isSelected = index === selectedIndex;

          return (
            <div
              key={sensor.id}
              onClick={() => {
                if (!isAuto) {
                  setSelectedIndex(index);
                  handleMeasureClick(sensor);
                }
              }}
              className={clsx(
                "relative rounded-3xl p-8 flex flex-col items-center text-center justify-between transition-all duration-300 ease-out",
                !isAuto && "cursor-pointer",
                (isSelected && !isAuto)
                  ? "bg-white ring-4 ring-blue-500 shadow-[0_15px_40px_-10px_rgba(59,130,246,0.6)] scale-105 z-10"
                  : "bg-white/70 border border-slate-200 opacity-60 scale-100",
                !isAuto && !isSelected && "hover:opacity-80",
                isAuto && isCompleted && "opacity-100 bg-white ring-2 ring-teal-500" // Highlight completed in auto mode
              )}
            >
              {isSelected && !isAuto && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-md">
                  Selected
                </div>
              )}

              <div className={clsx("w-24 h-24 rounded-full flex items-center justify-center mb-6", sensor.bg)}>
                <Icon className={clsx("w-12 h-12", sensor.color)} />
              </div>
              <h3 className="text-2xl font-bold text-slate-700 mb-2">{sensor.label}</h3>
              <p className="text-slate-500 flex-1">{sensor.description}</p>

              {isCompleted ? (
                <div className="mt-6 flex flex-col items-center w-full">
                  <div className="text-3xl font-extrabold text-teal-600 mb-2">{measurements[sensor.id]}</div>
                  <div className="flex items-center text-teal-600 font-medium bg-teal-50 px-4 py-2 rounded-full border border-teal-100">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Completed
                  </div>
                </div>
              ) : (
                <div
                  className={clsx(
                    "mt-6 w-full py-4 font-semibold text-lg rounded-xl transition-colors",
                    (isSelected && !isAuto) ? "bg-blue-500 text-white shadow-md" : "bg-slate-100 text-slate-500"
                  )}
                >
                  {isAuto ? "Pending" : (isSelected ? "Thumbs Up to Select" : sensor.btnText)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {activeSensor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl w-full max-w-2xl relative transform transition-all flex flex-col items-center text-center">
            {readingState === 'done' ? (
              <button onClick={() => {
                if (isAuto) onBack(); else closeModal();
              }} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600">
                <X className="w-8 h-8" />
              </button>
            ) : null}

            <div className={clsx("w-32 h-32 rounded-full flex items-center justify-center mb-8", activeSensor.bg)}>
              {readingState === 'done' ? (
                <CheckCircle2 className="w-20 h-20 text-teal-500" />
              ) : (
                <activeSensor.icon className={clsx("w-16 h-16 animate-pulse", activeSensor.color)} />
              )}
            </div>

            <h3 className="text-4xl font-bold text-slate-800 mb-4">{activeSensor.label}</h3>

            <div className="h-24 flex items-center justify-center">
              {readingState === 'done' ? (
                <div className="text-5xl font-extrabold text-teal-600">
                  {measurements[activeSensor.id]}
                </div>
              ) : (
                <div className="text-2xl text-slate-500 font-medium animate-pulse">
                  {readingState === 'preparing' && "Preparing sensor..."}
                  {readingState === 'scanning' && "Scanning..."}
                  {readingState === 'processing' && "Processing..."}
                </div>
              )}
            </div>

            {readingState === 'done' && (
              <div className="mt-8 flex flex-col items-center">
                <button
                  onClick={closeModal}
                  className="px-12 py-4 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xl rounded-full shadow-lg transition-colors mb-4"
                >
                  Continue
                </button>
                <span className="text-slate-400 text-sm font-medium">Point Up to Continue</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
