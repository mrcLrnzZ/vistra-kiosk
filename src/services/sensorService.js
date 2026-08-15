// =============================================================================
// Sensor Service Layer
// =============================================================================
// This module isolates all sensor data logic from the UI.
// Currently uses dummy data for testing.
//
// FUTURE ARDUINO INTEGRATION:
// Replace the body of `readSensor(sensorId)` with actual
// Arduino / Node.js / SerialPort communication.
// The UI calls `await readSensor(sensorId)` and expects the same
// return shape — no UI changes required.
// =============================================================================

// ---------------------------------------------------------------------------
// Sensor Instruction Configuration
// ---------------------------------------------------------------------------
export const SENSOR_INSTRUCTIONS = {
  height: {
    title: 'Prepare for Height Measurement',
    steps: [
      'Stand directly on the designated measurement area.',
      'Stand straight with your feet flat on the floor.',
      'Keep your head upright and look straight ahead.',
      'Remove caps, hats, or other headwear.',
      'Keep still while the kiosk measures your height.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring your height...',
  },

  weight: {
    title: 'Prepare for Weight Measurement',
    steps: [
      'Step off the pressure plate if you are currently standing on it.',
      'Make sure the pressure plate is clear.',
      'Step onto the pressure plate.',
      'Position both feet properly.',
      'Stand still while the kiosk measures your weight.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring your weight...',
  },

  temperature: {
    title: 'Prepare for Temperature Scan',
    steps: [
      'Locate the blue sensor underneath the monitor.',
      'Place your hand in the designated sensor area.',
      'Keep your hand steady.',
      'Do not move while scanning.',
      'Wait for the measurement to complete.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Scanning your temperature...',
  },

  heartRate: {
    title: 'Prepare for Heart Rate Measurement',
    steps: [
      'Locate the sensor underneath the monitor.',
      'Place your hand or finger in the designated sensor area.',
      'Keep your hand still.',
      'Relax and breathe normally.',
      'Wait while the kiosk detects your pulse.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring your heart rate...',
  },

  bloodOxygen: {
    title: 'Prepare for Blood Oxygen Measurement',
    steps: [
      'Locate the blue sensor underneath the monitor.',
      'Place your hand or finger in the designated sensor area.',
      'Keep your hand still.',
      'Do not move while the measurement is in progress.',
      'Wait for the oxygen reading.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring blood oxygen...',
  },

  bloodPressure: {
    title: 'Prepare for Blood Pressure Measurement',
    steps: [
      'Locate the blue sensor underneath the monitor.',
      'Place your hand or finger in the designated sensor area.',
      'Keep your arm and hand still.',
      'Relax and avoid unnecessary movement.',
      'Wait for the measurement to complete.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring your blood pressure...',
  },
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Returns a random float between min (inclusive) and max (exclusive).
 */
export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Promise-based delay.
 */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Session-scoped base values for realistic retry variation
// ---------------------------------------------------------------------------
// On the first measurement of a session, a "base" value is generated.
// Subsequent retries jitter slightly around that base so values look
// consistent (e.g. 68.4 kg → 68.0 kg) rather than wildly different.

const sessionBaseValues = {};

function getOrCreateBase(sensorId) {
  if (sessionBaseValues[sensorId]) return sessionBaseValues[sensorId];

  const base = {};
  switch (sensorId) {
    case 'height':
      base.value = randomBetween(155, 185);
      break;
    case 'weight':
      base.value = randomBetween(45, 100);
      break;
    case 'temperature':
      base.value = randomBetween(36.0, 37.2);
      break;
    case 'heartRate':
      base.value = randomBetween(60, 100);
      break;
    case 'bloodOxygen':
      base.value = randomBetween(95, 100);
      break;
    case 'bloodPressure':
      base.systolic = randomBetween(105, 135);
      base.diastolic = randomBetween(65, 85);
      break;
    default:
      return null;
  }
  sessionBaseValues[sensorId] = base;
  return base;
}

/**
 * Reset session base values (call when starting a new kiosk session).
 */
export function resetSensorSession() {
  Object.keys(sessionBaseValues).forEach((key) => delete sessionBaseValues[key]);
}

// ---------------------------------------------------------------------------
// Dummy Sensor Data Generator
// ---------------------------------------------------------------------------

function jitter(base, variation) {
  return base + (Math.random() * variation * 2 - variation);
}

/**
 * Generate dummy sensor reading with session-based variation.
 */
export function generateDummySensorData(sensorId) {
  const base = getOrCreateBase(sensorId);
  if (!base) return null;

  switch (sensorId) {
    case 'height':
      return {
        value: Number(jitter(base.value, 0.5).toFixed(1)),
        unit: 'cm',
      };

    case 'weight':
      return {
        value: Number(jitter(base.value, 0.5).toFixed(1)),
        unit: 'kg',
      };

    case 'temperature':
      return {
        value: Number(Math.min(37.2, Math.max(36.0, jitter(base.value, 0.2))).toFixed(1)),
        unit: '°C',
      };

    case 'heartRate':
      return {
        value: Math.round(Math.min(100, Math.max(60, jitter(base.value, 2)))),
        unit: 'BPM',
      };

    case 'bloodOxygen':
      return {
        value: Math.round(Math.min(100, Math.max(95, jitter(base.value, 1)))),
        unit: '%',
      };

    case 'bloodPressure':
      return {
        systolic: Math.round(Math.min(135, Math.max(105, jitter(base.systolic, 3)))),
        diastolic: Math.round(Math.min(85, Math.max(65, jitter(base.diastolic, 2)))),
        unit: 'mmHg',
      };

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Read Sensor (the main abstraction)
// ---------------------------------------------------------------------------

/**
 * Simulate reading a physical sensor with hardware delay.
 *
 * FUTURE: Replace this function body with actual Arduino / Node.js /
 * SerialPort communication. The return shape must remain the same.
 *
 * @param {string} sensorId - One of: height, weight, temperature, heartRate, bloodOxygen, bloodPressure
 * @returns {Promise<Object>} Standardized sensor result
 */
export async function readSensor(sensorId) {
  // Simulate hardware delay (2–4 seconds)
  const delayMs = randomBetween(2000, 4000);
  await delay(delayMs);

  return generateDummySensorData(sensorId);
}

// ---------------------------------------------------------------------------
// Format Sensor Result for Display
// ---------------------------------------------------------------------------

/**
 * Converts a structured sensor result into a human-readable string.
 */
export function formatSensorResult(sensorId, result) {
  if (!result) return 'N/A';

  if (sensorId === 'bloodPressure') {
    return `${result.systolic} / ${result.diastolic} ${result.unit}`;
  }

  if (sensorId === 'bloodOxygen') {
    return `${result.value}% SpO₂`;
  }

  return `${result.value} ${result.unit}`;
}
