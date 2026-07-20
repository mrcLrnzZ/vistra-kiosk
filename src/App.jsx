import { useState } from 'react'
import LandingScreen from './screens/LandingScreen'
import HealthCheckScreen from './screens/HealthCheckScreen'
import SummaryScreen from './screens/SummaryScreen'
import FinalScreen from './screens/FinalScreen'
import GestureIndicator from './components/GestureIndicator'
import GestureCamera from './components/GestureCamera'
import { useRef } from 'react'

function App() {
  const [currentScreen, setCurrentScreen] = useState('landing') // 'landing', 'healthCheck', 'summary', 'final'
  const [measurements, setMeasurements] = useState({})
  const [gestureStatus, setGestureStatus] = useState(null)

  const startCheck = () => {
    setMeasurements({})
    setCurrentScreen('healthCheck')
  }

  const lastGestureTime = useRef(0);
  const [lastGesture, setLastGesture] = useState({ name: 'None', timestamp: 0 });

  const handleGesture = (gesture) => {
    const now = Date.now();

    // Minimal debounce at App level, as GestureCamera now handles cooldowns natively
    if (now - lastGestureTime.current < 200) return;

    let handled = false;
    setLastGesture({ name: gesture, timestamp: now });

    if (currentScreen === 'landing') {
      // LandingScreen consumes its own events.
      handled = true;
    } else if (currentScreen === 'healthCheck') {
      // HealthCheckScreen consumes its own events. App.jsx fallback:
      handled = true;
    } else if (currentScreen === 'summary') {
      if (gesture === 'Continue') {
        setCurrentScreen('final');
        handled = true;
      } else if (gesture === 'Back') {
        setCurrentScreen('healthCheck');
        handled = true;
      }
    } else if (currentScreen === 'final') {
      if (gesture === 'Continue' || gesture === 'Back') {
        setCurrentScreen('landing');
        handled = true;
      }
    }

    if (handled) {
      lastGestureTime.current = now;
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden font-sans bg-slate-900 text-slate-900 select-none">
      <GestureIndicator status={gestureStatus} />
      <GestureCamera onGesture={handleGesture} onStatusChange={setGestureStatus} />

      <main className="w-full h-full">
        {currentScreen === 'landing' && (
          <LandingScreen onStart={startCheck} gestureStatus={gestureStatus} lastGesture={lastGesture} />
        )}

        {currentScreen === 'healthCheck' && (
          <HealthCheckScreen
            measurements={measurements}
            setMeasurements={setMeasurements}
            onComplete={() => setCurrentScreen('summary')}
            onBack={() => setCurrentScreen('landing')}
            lastGesture={lastGesture}
          />
        )}

        {currentScreen === 'summary' && (
          <SummaryScreen
            measurements={measurements}
            onNext={() => setCurrentScreen('final')}
          />
        )}

        {currentScreen === 'final' && (
          <FinalScreen
            onRestart={() => setCurrentScreen('landing')}
          />
        )}
      </main>
    </div>
  )
}

export default App
