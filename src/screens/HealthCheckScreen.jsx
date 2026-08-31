import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Ruler, Weight, Thermometer, Activity, Wind, HeartPulse, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import SensorInstructionModal from '../components/SensorInstructionModal';
import SensorMeasuring from '../components/SensorMeasuring';
import SensorResult from '../components/SensorResult';
import { readSensor, formatSensorResult } from '../services/sensorService';

const SENSORS = [
  { id: 'height', label: 'Height', icon: Ruler, description: 'Measure your height automatically.', btnText: 'Measure Height', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'weight', label: 'Weight', icon: Weight, description: 'Measure your body weight.', btnText: 'Measure Weight', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'temperature', label: 'Body Temperature', icon: Thermometer, description: 'Non-contact temperature scan.', btnText: 'Scan Temperature', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'heartAndOxygen', label: 'Heart Rate & SpO₂', icon: Activity, description: 'Measure pulse rate and oxygen saturation.', btnText: 'Measure Vitals', color: 'text-rose-500', bg: 'bg-rose-50' },
];

export default function HealthCheckScreen({ mode, measurements, setMeasurements, onComplete, onBack, lastGesture }) {
  // --- State ---
  const [activeSensor, setActiveSensor] = useState(null);
  const [measurementState, setMeasurementState] = useState('idle'); // idle | instructions | measuring | result | error
  const [sensorResult, setSensorResult] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const lastProcessedTime = useRef(lastGesture?.timestamp || 0);
  const measurementAbortRef = useRef(false);

  const isAuto = mode === 'auto';
  const completedCount = SENSORS.filter(s => measurements[s.id] !== undefined).length;
  const allCompleted = completedCount === SENSORS.length;

  // --- Sensor selection ---
  const selectSensor = useCallback((sensor) => {
    setActiveSensor(sensor);
    setSensorResult(null);
    setMeasurementState('instructions');
    measurementAbortRef.current = false;
  }, []);

  // --- Start measurement ---
  const startMeasurement = useCallback(async () => {
    if (!activeSensor) return;
    setMeasurementState('measuring');
    measurementAbortRef.current = false;

    try {
      const result = await readSensor(activeSensor.id);

      // If the user navigated away during measurement, discard
      if (measurementAbortRef.current) return;

      if (!result) {
        setMeasurementState('error');
        return;
      }

      setSensorResult(result);
      setMeasurementState('result');
    } catch (err) {
      console.error('Sensor read failed:', err);
      if (!measurementAbortRef.current) {
        setMeasurementState('error');
      }
    }
  }, [activeSensor]);

  // --- Handlers ---
  const handleReady = useCallback(() => {
    startMeasurement();
  }, [startMeasurement]);

  const handleCancel = useCallback(() => {
    measurementAbortRef.current = true;
    setActiveSensor(null);
    setSensorResult(null);
    setMeasurementState('idle');
  }, []);

  const handleMeasureAgain = useCallback(() => {
    // Restart instruction workflow for the SAME sensor
    setSensorResult(null);
    setMeasurementState('instructions');
  }, []);

  const handleContinue = useCallback(() => {
    // Accept the result, store it, return to grid
    if (activeSensor && sensorResult) {
      setMeasurements(prev => ({ ...prev, [activeSensor.id]: sensorResult }));
    }
    measurementAbortRef.current = true;
    setActiveSensor(null);
    setSensorResult(null);
    setMeasurementState('idle');
  }, [activeSensor, sensorResult, setMeasurements]);

  const handleBackToSensors = useCallback(() => {
    // Discard result, return to grid
    measurementAbortRef.current = true;
    setActiveSensor(null);
    setSensorResult(null);
    setMeasurementState('idle');
  }, []);

  // --- Auto mode sequencer ---
  useEffect(() => {
    if (isAuto && !activeSensor && !allCompleted && measurementState === 'idle') {
      const nextIndex = SENSORS.findIndex(s => measurements[s.id] === undefined);
      if (nextIndex !== -1) {
        setSelectedIndex(nextIndex);
        selectSensor(SENSORS[nextIndex]);
      }
    } else if (isAuto && !activeSensor && allCompleted && measurementState === 'idle') {
      onComplete();
    }
  }, [isAuto, activeSensor, allCompleted, measurements, measurementState, onComplete, selectSensor]);

  // Auto mode: auto-trigger ready after showing instructions briefly
  useEffect(() => {
    if (isAuto && measurementState === 'instructions' && activeSensor) {
      const timer = setTimeout(() => {
        startMeasurement();
      }, 3000); // Show instructions for 3 seconds in auto mode
      return () => clearTimeout(timer);
    }
  }, [isAuto, measurementState, activeSensor, startMeasurement]);

  // Auto mode: auto-continue after result
  useEffect(() => {
    if (isAuto && measurementState === 'result' && activeSensor && sensorResult) {
      const timer = setTimeout(() => {
        handleContinue();
      }, 3000); // Show result for 3 seconds before auto-continuing
      return () => clearTimeout(timer);
    }
  }, [isAuto, measurementState, activeSensor, sensorResult, handleContinue]);

  // --- Gesture handling ---
  useEffect(() => {
    if (!lastGesture || lastGesture.timestamp <= lastProcessedTime.current) return;
    lastProcessedTime.current = lastGesture.timestamp;

    const gesture = lastGesture.name;

    // ---- Active measurement flow ----
    if (activeSensor) {
      switch (measurementState) {
        case 'instructions':
          if (gesture === 'Continue') {
            // Point Up → Ready
            handleReady();
          } else if (gesture === 'Back') {
            // Thumbs Down → Cancel
            handleCancel();
          }
          return;

        case 'measuring':
          // Block all gestures during measurement
          if (gesture === 'Back') {
            // Allow abort in manual mode
            if (!isAuto) handleCancel();
          }
          return;

        case 'result':
          if (gesture === 'Continue') {
            // Point Up → Measure Again
            handleMeasureAgain();
          } else if (gesture === 'Select') {
            // Thumbs Up → Accept / Continue
            handleContinue();
          } else if (gesture === 'Back') {
            // Thumbs Down → Back to Sensors
            handleBackToSensors();
          }
          return;

        case 'error':
          if (gesture === 'Continue' || gesture === 'Select') {
            handleMeasureAgain();
          } else if (gesture === 'Back') {
            handleBackToSensors();
          }
          return;

        default:
          return;
      }
    }

    // ---- Sensor grid navigation ----
    if (isAuto) {
      // In auto mode, only allow back to exit
      if (gesture === 'Back') onBack();
      return;
    }

    if (gesture === 'Next') {
      setSelectedIndex(prev => (prev + 1) % SENSORS.length);
    } else if (gesture === 'Previous') {
      setSelectedIndex(prev => (prev - 1 + SENSORS.length) % SENSORS.length);
    } else if (gesture === 'Select') {
      if (!allCompleted) {
        selectSensor(SENSORS[selectedIndex]);
      }
    } else if (gesture === 'Continue') {
      if (completedCount > 0) {
        onComplete();
      }
    } else if (gesture === 'Back') {
      onBack();
    }
  }, [lastGesture, activeSensor, measurementState, selectedIndex, allCompleted, completedCount,
      onComplete, onBack, isAuto, handleReady, handleCancel, handleMeasureAgain, handleContinue, handleBackToSensors, selectSensor]);

  // --- Render ---
  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-8 relative">
      {/* Header */}
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

      {/* Sensor Grid */}
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-4 gap-8 w-full">
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
                  selectSensor(sensor);
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
                  <div className="text-3xl font-extrabold text-teal-600 mb-2">
                    {formatSensorResult(sensor.id, measurements[sensor.id])}
                  </div>
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
      </div>

      {/* Measurement Flow Overlays */}
      {activeSensor && measurementState === 'instructions' && (
        <SensorInstructionModal
          sensor={activeSensor}
          onReady={handleReady}
          onCancel={handleCancel}
        />
      )}

      {activeSensor && measurementState === 'measuring' && (
        <SensorMeasuring sensor={activeSensor} />
      )}

      {activeSensor && (measurementState === 'result' || measurementState === 'error') && (
        <SensorResult
          sensor={activeSensor}
          result={sensorResult}
          isError={measurementState === 'error'}
          onMeasureAgain={handleMeasureAgain}
          onContinue={handleContinue}
          onBack={handleBackToSensors}
        />
      )}
    </div>
  );
}
