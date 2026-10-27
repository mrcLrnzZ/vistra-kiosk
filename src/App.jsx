import { useState, useEffect, useRef, useCallback } from 'react'
import { resetSensorSession } from './services/sensorService'
import LandingScreen from './screens/LandingScreen'
import ModeSelectionScreen from './screens/ModeSelectionScreen'
import HealthCheckScreen from './screens/HealthCheckScreen'
import SummaryScreen from './screens/SummaryScreen'
import FinalScreen from './screens/FinalScreen'
import GestureIndicator from './components/GestureIndicator'
import GestureCamera from './components/GestureCamera'
import GestureTutorial from './components/GestureTutorial'
// import AccountChoiceScreen from './screens/AccountChoiceScreen'

function App() {
  const [currentScreen, setCurrentScreen] = useState('landing') // 'landing', 'modeSelection', 'healthCheck', 'summary', 'final'
  const [measurementMode, setMeasurementMode] = useState('manual') // 'auto' or 'manual'
  const [measurements, setMeasurements] = useState({})
  const [gestureStatus, setGestureStatus] = useState(null)
  const [tutorialCompleted, setTutorialCompleted] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const prevHandDetected = useRef(false)

  // Show tutorial when hand transitions from absent → present (not while continuously present)
  useEffect(() => {
    const isDetected = gestureStatus?.hand === 'Detected';
    const wasDetected = prevHandDetected.current;
    prevHandDetected.current = isDetected;

    // Only open on transition: hand was NOT detected, now IS detected
    if (!tutorialCompleted && isDetected && !wasDetected && !showTutorial && currentScreen === 'landing') {
      setShowTutorial(true);
    }
  }, [gestureStatus?.hand, tutorialCompleted, showTutorial, currentScreen]);

  // Skip / full completion — permanent, tutorial won't re-appear
  const handleTutorialComplete = useCallback(() => {
    setTutorialCompleted(true);
    setShowTutorial(false);
  }, []);

  // Timeout — temporary, tutorial can re-appear when hand re-appears
  const handleTutorialTimeout = useCallback(() => {
    setShowTutorial(false);
    // Reset prevHandDetected so the next hand appearance triggers re-open
    prevHandDetected.current = false;
  }, []);

  // Reset tutorial for the next user:
  // When the tutorial has been completed/skipped AND the hand disappears for 5s
  // (the user walked away), reset so the next person gets the onboarding.
  // Also resets on screen transitions back to landing.
  const idleResetTimer = useRef(null);

  useEffect(() => {
    // Reset on screen transition back to landing
    if (currentScreen === 'landing' && tutorialCompleted) {
      setTutorialCompleted(false);
      setShowTutorial(false);
      prevHandDetected.current = false;
    }
  }, [currentScreen]);

  useEffect(() => {
    const isDetected = gestureStatus?.hand === 'Detected';

    if (currentScreen === 'landing' && tutorialCompleted && !isDetected) {
      // User completed tutorial and hand left — start 5s reset timer
      idleResetTimer.current = setTimeout(() => {
        setTutorialCompleted(false);
        setShowTutorial(false);
        prevHandDetected.current = false;
      }, 5000);
    } else {
      // Hand is present, tutorial not done, or not on landing screen — cancel any pending reset
      if (idleResetTimer.current) {
        clearTimeout(idleResetTimer.current);
        idleResetTimer.current = null;
      }
    }

    return () => {
      if (idleResetTimer.current) {
        clearTimeout(idleResetTimer.current);
        idleResetTimer.current = null;
      }
    };
  }, [gestureStatus?.hand, tutorialCompleted]);

  const startCheck = () => {
    // Reset ALL session data for a clean new patient
    setMeasurements({})
    resetSensorSession() // Clear sensorService cache (heartAndOxygen, weight bases)
    console.log('[App] New health-check session started — all vitals cleared')
    setCurrentScreen('modeSelection')
  }

  const lastGestureTime = useRef(0);
  // Two separate gesture channels for complete isolation:
  // - tutorialGesture: always updates, consumed exclusively by the tutorial
  // - lastGesture: only updates after tutorial completion, consumed by screens
  const [tutorialGesture, setTutorialGesture] = useState({ name: 'None', timestamp: 0 });
  const [lastGesture, setLastGesture] = useState({ name: 'None', timestamp: 0 });

  const handleGesture = (gesture) => {
    const now = Date.now();

    // Minimal debounce at App level, as GestureCamera now handles cooldowns natively
    if (now - lastGestureTime.current < 200) return;

    // Tutorial channel — always fires so the tutorial can consume gestures
    setTutorialGesture({ name: gesture, timestamp: now });

    // Block all screen navigation while tutorial is active
    if (showTutorial && !tutorialCompleted) return;

    // Screen channel — only fires post-tutorial
    setLastGesture({ name: gesture, timestamp: now });

    let handled = false;

    if (currentScreen === 'landing') {
      // LandingScreen consumes its own events.
      handled = true;
    } else if (currentScreen === 'accountChoice') {
      // AccountChoiceScreen consumes its own events.
      handled = true;
    } else if (currentScreen === 'modeSelection') {
      // ModeSelectionScreen consumes its own events.
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

  const isTutorialActive = showTutorial && !tutorialCompleted;

  return (
    <div className="w-screen h-screen overflow-hidden font-sans bg-slate-900 text-slate-900 select-none">
      <GestureCamera onGesture={handleGesture} onStatusChange={setGestureStatus} />

      {/* Progressive gesture tutorial */}
      {isTutorialActive && (
        <GestureTutorial
          lastGesture={tutorialGesture}
          onComplete={handleTutorialComplete}
          onTimeout={handleTutorialTimeout}
        />
      )}

      <GestureIndicator status={gestureStatus} />

      <main className="w-full h-full">
        {currentScreen === 'landing' && (
          <LandingScreen
            onStart={startCheck}
            lastGesture={lastGesture}
            isTutorialActive={isTutorialActive}
          />
        )}

        {/* Removed accountChoice screen – jump directly to mode selection */}

        {currentScreen === 'modeSelection' && (
          <ModeSelectionScreen
            onSelectMode={(mode) => {
              setMeasurementMode(mode);
              setCurrentScreen('healthCheck');
            }}
            onBack={() => setCurrentScreen('landing')}
            lastGesture={lastGesture}
          />
        )}

        {currentScreen === 'healthCheck' && (
          <HealthCheckScreen
            mode={measurementMode}
            measurements={measurements}
            setMeasurements={setMeasurements}
            onComplete={() => setCurrentScreen('summary')}
            onBack={() => setCurrentScreen('modeSelection')}
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
            measurements={measurements}
          />
        )}
      </main>
    </div>
  )
}

export default App
