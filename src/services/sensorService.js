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

  heartAndOxygen: {
    title: 'Prepare for Heart Rate & SpO₂ Measurement',
    steps: [
      'Locate the sensor underneath the monitor.',
      'Place your hand or finger in the designated sensor area.',
      'Keep your hand still.',
      'Relax and breathe normally.',
      'Wait for the measurement to complete.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring your vitals...',
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
    case 'heartAndOxygen':
      base.heartRate = randomBetween(60, 100);
      base.bloodOxygen = randomBetween(95, 100);
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

    case 'heartAndOxygen':
      return {
        heartRate: Math.round(Math.min(100, Math.max(60, jitter(base.heartRate, 2)))),
        bloodOxygen: Math.round(Math.min(100, Math.max(95, jitter(base.bloodOxygen, 1)))),
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
 * @param {string} sensorId - One of: height, weight, temperature, heartAndOxygen
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

  if (sensorId === 'heartAndOxygen') {
    return `${result.heartRate} BPM / ${result.bloodOxygen}% SpO₂`;
  }

  return `${result.value} ${result.unit}`;
}
