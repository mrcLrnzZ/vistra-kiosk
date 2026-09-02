import React from 'react';
import { Ruler, Weight, Thermometer, Activity, CheckCircle2, AlertCircle, HeartPulse } from 'lucide-react';
import { formatSensorResult } from '../services/sensorService';

export default function SummaryScreen({ measurements, onNext }) {

  // Helpers
  const heightVal = measurements.height?.value;
  const weightVal = measurements.weight?.value;

  let bmi = 0;
  let bmiCategory = '';
  let bmiColor = '';

  if (heightVal && weightVal) {
    const heightM = heightVal / 100;
    bmi = weightVal / (heightM * heightM);

    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-blue-500';
    } else if (bmi < 25) {
      bmiCategory = 'Normal';
      bmiColor = 'text-green-500';
    } else if (bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-yellow-600';
    } else {
      bmiCategory = 'Obese';
      bmiColor = 'text-red-500';
    }
  }

  // Recommendation Logic
  const getRecommendation = () => {
    const temp = measurements.temperature?.value;
    const oxygen = measurements.heartAndOxygen?.bloodOxygen;

    if (temp && temp > 37.5) {
      return { text: "Your temperature is elevated. Please consult the clinic nurse.", type: 'warning' };
    }
    if (oxygen && oxygen < 95) {
      return { text: "Blood oxygen is below the normal range. A follow-up check is recommended.", type: 'warning' };
    }
    if (bmi > 0 && (bmi < 18.5 || bmi >= 25)) {
      return { text: `Your BMI is outside the normal range (${bmiCategory}). Consider discussing this with a healthcare provider.`, type: 'warning' };
    }
    return { text: "Your vital signs are within the normal range. Keep up the good work!", type: 'success' };
  };

  const rec = getRecommendation();

  const SUMMARY_CARDS = [
    { id: 'height', label: 'Height', icon: Ruler, bg: 'bg-blue-50', color: 'text-blue-600', border: 'border-blue-100', status: 'normal' },
    { id: 'weight', label: 'Weight', icon: Weight, bg: 'bg-purple-50', color: 'text-purple-600', border: 'border-purple-100', status: 'normal' },
    { id: 'temperature', label: 'Hand Skin Temperature', icon: Thermometer, bg: 'bg-orange-50', color: 'text-orange-500', border: 'border-orange-100', status: (measurements.temperature?.value ?? 0) > 37.5 ? 'attention' : 'normal' },
    { id: 'heartAndOxygen', label: 'Heart Rate & SpO₂', icon: HeartPulse, bg: 'bg-rose-50', color: 'text-rose-500', border: 'border-rose-100', status: (measurements.heartAndOxygen?.bloodOxygen ?? 100) < 95 ? 'attention' : 'normal' },
  ];

  const StatusBadge = ({ status }) => {
    if (status === 'normal') {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 border border-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3" />
          Measured
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
        <AlertCircle className="w-3 h-3" />
        Attention
      </div>
    );
  };

  const renderValue = (cardId, measurement) => {
    if (!measurement) return <span className="text-4xl font-black text-slate-200">—</span>;

    if (cardId === 'heartAndOxygen') {
      return (
        <div className="flex flex-col gap-2 mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{measurement.heartRate}</span>
            <span className="text-lg font-bold text-slate-400">BPM</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-black text-slate-800 tracking-tight">{measurement.bloodOxygen}</span>
            <span className="text-lg font-bold text-slate-400">% SpO₂</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-baseline gap-1.5 mt-2">
        <span className="text-5xl font-black text-slate-800 tracking-tight">{measurement.value}</span>
        <span className="text-xl font-bold text-slate-400">{measurement.unit}</span>
      </div>
    );
  };

  const BmiIndicator = ({ bmiValue }) => {
    const min = 15;
    const max = 40;
    const percentage = Math.max(0, Math.min(100, ((bmiValue - min) / (max - min)) * 100));

    return (
      <div className="w-full mt-6">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
          <span>Under</span>
          <span>Normal</span>
          <span>Over</span>
          <span>Obese</span>
        </div>
        <div className="relative w-full">
          <div className="h-2.5 rounded-full flex overflow-hidden opacity-90 shadow-inner">
            <div className="bg-blue-400 w-[14%]"></div>
            <div className="bg-green-400 w-[26%]"></div>
            <div className="bg-yellow-400 w-[20%]"></div>
            <div className="bg-red-400 w-[40%]"></div>
          </div>
          {bmiValue > 0 && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-4 border-slate-800 rounded-full shadow-md transition-all duration-1000"
              style={{ left: `calc(${percentage}% - 10px)` }}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-8 pt-0 overflow-y-auto">
      <div className="w-full shrink-0" style={{ height: '100px' }}></div>
      
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 text-teal-700 text-sm font-bold tracking-wide uppercase mb-3 border border-teal-100">
          <CheckCircle2 className="w-4 h-4" />
          {Object.keys(measurements).length} Measurements Completed
        </div>
        <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Health Summary</h2>
        <p className="text-lg text-slate-500 mt-2 font-medium">Your measurements are complete.</p>
      </div>

      <div className="flex-1 flex gap-6 max-w-[1400px] mx-auto w-full">
        {/* Left Col: Measurements */}
        <div className="flex-[2] grid grid-cols-2 gap-4">
          {SUMMARY_CARDS.map((card, idx) => {
            const Icon = card.icon;
            const measurement = measurements[card.id];

            return (
              <div 
                key={idx} 
                className={`bg-white rounded-[2rem] p-6 shadow-sm border ${measurement ? card.border : 'border-slate-100'} flex flex-col justify-between`}
              >
                <div className="flex justify-between items-start">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${card.bg}`}>
                    <Icon className={`w-7 h-7 ${card.color}`} strokeWidth={2.5} />
                  </div>
                  {measurement && <StatusBadge status={card.status} />}
                </div>
                
                <div className="mt-6">
                  <div className="text-sm text-slate-500 font-bold uppercase tracking-wider mb-1">{card.label}</div>
                  {renderValue(card.id, measurement)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Col: BMI & Recommendation */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Body Mass Index (BMI)</h3>
            <div className="text-7xl font-black text-slate-800 tracking-tighter mb-2 leading-none">
              {bmi > 0 ? bmi.toFixed(1) : '—'}
            </div>
            <div className={`text-xl font-bold tracking-wide uppercase ${bmiColor}`}>
              {bmiCategory || '—'}
            </div>
            <BmiIndicator bmiValue={bmi} />
          </div>

          <div className={`rounded-[2rem] p-8 shadow-sm border ${rec.type === 'success' ? 'border-emerald-100 bg-emerald-50/50' : 'border-amber-100 bg-amber-50/50'} flex-1 flex flex-col items-center justify-center text-center`}>
            {rec.type === 'success' 
              ? <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" /> 
              : <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
            }
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Recommendation</h3>
            <p className={`text-xl font-semibold leading-snug ${rec.type === 'success' ? 'text-emerald-800' : 'text-amber-800'}`}>
              {rec.text}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-4 flex justify-center shrink-0">
        <button
          onClick={onNext}
          className="flex items-center justify-center gap-3 px-16 py-6 bg-teal-600 hover:bg-teal-500 text-white text-2xl font-bold rounded-2xl shadow-xl shadow-teal-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <CheckCircle2 className="w-8 h-8" />
          Complete Session
        </button>
      </div>
    </div>
  );
}
