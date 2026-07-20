import React from 'react';
import { Ruler, Weight, Thermometer, Activity, Wind, HeartPulse } from 'lucide-react';

export default function SummaryScreen({ measurements, onNext }) {
  
  // Helpers
  const parseNum = (str) => parseFloat((str || '').replace(/[^\d.]/g, ''));
  
  const heightVal = parseNum(measurements.height);
  const weightVal = parseNum(measurements.weight);
  
  let bmi = 0;
  let bmiCategory = '';
  let bmiColor = '';

  if (heightVal && weightVal) {
    const heightM = heightVal / 100;
    bmi = weightVal / (heightM * heightM);
    
    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = 'text-yellow-600';
    } else if (bmi < 25) {
      bmiCategory = 'Normal';
      bmiColor = 'text-green-600';
    } else if (bmi < 30) {
      bmiCategory = 'Overweight';
      bmiColor = 'text-yellow-600';
    } else {
      bmiCategory = 'Obese';
      bmiColor = 'text-red-600';
    }
  }

  // Simple recommendations based on random rules
  const getRecommendation = () => {
    const temp = parseNum(measurements.temperature);
    const sysBP = parseNum(measurements.bloodPressure.split('/')[0]);
    
    if (temp > 37.5) {
      return { text: "Your temperature is elevated. Please consult the clinic nurse.", type: 'warning' };
    }
    if (sysBP > 130) {
      return { text: "Blood pressure is above the normal range. A follow-up check is recommended.", type: 'warning' };
    }
    return { text: "Your vital signs are within the normal range. Keep up the good work!", type: 'success' };
  };

  const rec = getRecommendation();

  const SUMMARY_CARDS = [
    { label: 'Height', value: measurements.height, icon: Ruler, bg: 'bg-blue-50', color: 'text-blue-500', status: 'normal' },
    { label: 'Weight', value: measurements.weight, icon: Weight, bg: 'bg-indigo-50', color: 'text-indigo-500', status: 'normal' },
    { label: 'Temperature', value: measurements.temperature, icon: Thermometer, bg: 'bg-orange-50', color: 'text-orange-500', status: parseNum(measurements.temperature) > 37.5 ? 'attention' : 'normal' },
    { label: 'Heart Rate', value: measurements.heartRate, icon: Activity, bg: 'bg-rose-50', color: 'text-rose-500', status: 'normal' },
    { label: 'SpO₂', value: measurements.bloodOxygen, icon: Wind, bg: 'bg-cyan-50', color: 'text-cyan-500', status: parseNum(measurements.bloodOxygen) < 95 ? 'attention' : 'normal' },
    { label: 'Blood Pressure', value: measurements.bloodPressure, icon: HeartPulse, bg: 'bg-purple-50', color: 'text-purple-500', status: parseNum(measurements.bloodPressure.split('/')[0]) > 130 ? 'attention' : 'normal' },
  ];

  const StatusDot = ({ status }) => {
    const colors = {
      normal: 'bg-green-500',
      warning: 'bg-yellow-500',
      attention: 'bg-red-500'
    };
    return <div className={`w-4 h-4 rounded-full ${colors[status]} shadow-sm`} />;
  };

  return (
    <div className="flex flex-col w-full h-full bg-slate-50 p-8">
      <h2 className="text-4xl font-bold text-slate-800 mb-8 text-center">Health Summary</h2>
      
      <div className="flex-1 flex gap-8 max-w-7xl mx-auto w-full">
        {/* Left Col: Measurements */}
        <div className="flex-2 grid grid-cols-2 gap-4 w-2/3">
          {SUMMARY_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mr-6 ${card.bg}`}>
                  <Icon className={`w-8 h-8 ${card.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{card.label}</div>
                  <div className="text-2xl font-bold text-slate-800">{card.value}</div>
                </div>
                <StatusDot status={card.status} />
              </div>
            );
          })}
        </div>

        {/* Right Col: BMI & Recommendation */}
        <div className="flex-1 w-1/3 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-bold text-slate-600 mb-4">Body Mass Index (BMI)</h3>
            <div className="text-6xl font-black text-slate-800 mb-2">{bmi.toFixed(1)}</div>
            <div className={`text-2xl font-bold ${bmiColor}`}>{bmiCategory}</div>
          </div>

          <div className={`bg-white rounded-3xl p-8 shadow-sm border ${rec.type === 'success' ? 'border-green-200' : 'border-yellow-200'} flex-1 flex flex-col items-center justify-center text-center`}>
            <h3 className="text-xl font-bold text-slate-600 mb-4">Recommendation</h3>
            <p className="text-2xl font-medium text-slate-800 leading-snug">
              {rec.text}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={onNext}
          className="px-12 py-5 bg-teal-600 hover:bg-teal-500 text-white text-2xl font-bold rounded-full shadow-xl shadow-teal-600/20 transition-transform transform hover:scale-105"
        >
          Complete Session
        </button>
      </div>
    </div>
  );
}
