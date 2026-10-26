// =============================================================================
// Sensor Service Layer
// =============================================================================
// This module isolates all sensor data logic from the UI.
//
// Real sensors (Height, Temperature, Heart Rate + SpO₂) communicate via
// Server-Sent Events (SSE) to a local Node.js backend that talks to Arduino.
//
// Weight sensor has no real hardware — it still uses dummy data.
//
// Architecture:
//   UI → streamSensor(sensorId, onStatus) → SSE → Node.js → Serial → Arduino
// =============================================================================

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Base URL for the local sensor bridge server */
const API_BASE = '/api';

// ---------------------------------------------------------------------------
// Sensor Instruction Configuration
// ---------------------------------------------------------------------------
export const SENSOR_INSTRUCTIONS = {
  height: {
    title: 'Prepare for Height Measurement',
    steps: [
      'Step into the designated measurement area.',
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
      'Locate the temperature sensor underneath the monitor.',
      'Place your hand near the sensor area.',
      'Keep your hand steady and in position.',
      'Do not move while scanning.',
      'Wait for the measurement to complete.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring hand temperature...',
  },

  heartAndOxygen: {
    title: 'Prepare for Heart Rate & SpO₂',
    steps: [
      'Locate the pulse sensor underneath the monitor.',
      'Place your finger on the sensor.',
      'Keep your finger still and pressed gently.',
      'Relax and breathe normally.',
      'Wait for the measurement to complete.',
    ],
    readyText: 'Point up when you are ready.',
    measuringText: 'Measuring heart rate and blood oxygen...',
  },
};

// ---------------------------------------------------------------------------
// Sensor ID → Arduino Command Mapping
// ---------------------------------------------------------------------------
const SENSOR_COMMANDS = {
  height: 'HEIGHT',
  temperature: 'TEMP',
  heartAndOxygen: 'HEART',
  // weight has no real hardware command
};

// ---------------------------------------------------------------------------
// Real sensor IDs — these use Arduino hardware
// ---------------------------------------------------------------------------
const REAL_SENSORS = new Set(['height', 'temperature', 'heartAndOxygen']);

/**
 * Check if a sensor has real hardware.
 */
export function isRealSensor(sensorId) {
  return REAL_SENSORS.has(sensorId);
}

// ---------------------------------------------------------------------------
// Arduino Status → UI State Mapping
// ---------------------------------------------------------------------------

/**
 * Map raw Arduino status strings to normalized UI states.
 * UI states: 'waiting' | 'stabilizing' | 'measuring' | 'retrying' | 'success' | 'error'
 */
function mapArduinoStatus(rawStatus) {
  switch (rawStatus) {
    // Waiting states
    case 'waiting_for_person':
    case 'waiting_for_hand':
    case 'waiting_for_finger':
      return 'waiting';

    // Stabilizing
    case 'stabilizing':
      return 'stabilizing';

    // Actively measuring
    case 'measuring':
      return 'measuring';

    // Retrying (NOT an error)
    case 'retrying':
      return 'retrying';

    // Success
    case 'success':
      return 'success';

    // Error / retry states
    case 'unstable':
    case 'no_person':
    case 'no_hand':
    case 'no_finger':
    case 'finger_removed':
    case 'hand_removed':
    case 'invalid_position':
    case 'insufficient_signal':
    case 'sensor_error':
    case 'read_error':
    case 'timeout':
    case 'error':
      return 'error';

    default:
      console.warn(`[SensorService] Unknown Arduino status: ${rawStatus}`);
      return 'measuring'; // Default to measuring for unknown states
  }
}

// ---------------------------------------------------------------------------
// Status Messages (per sensor, per UI state)
// ---------------------------------------------------------------------------
const STATUS_MESSAGES = {
  height: {
    waiting:     { title: 'Waiting for you...', subtitle: 'Stand straight under the height sensor.' },
    stabilizing: { title: 'Hold still...', subtitle: 'Preparing measurement.' },
    measuring:   { title: 'Measuring your height...', subtitle: 'Please stand straight and keep still.' },
    retrying:    { title: 'Please keep still...', subtitle: "We're getting a more stable measurement." },
    success:     { title: 'Height measured!', subtitle: '' },
    error:       { title: 'Measurement failed', subtitle: 'Please try again.' },
  },
  temperature: {
    waiting:     { title: 'Waiting for your hand...', subtitle: 'Place your hand near the temperature sensor.' },
    stabilizing: { title: 'Hold your hand still...', subtitle: 'Preparing measurement.' },
    measuring:   { title: 'Measuring hand temperature...', subtitle: 'Keep your hand in position.' },
    retrying:    { title: 'Please keep still...', subtitle: 'Getting a stable temperature reading.' },
    success:     { title: 'Temperature measured!', subtitle: '' },
    error:       { title: 'Measurement failed', subtitle: 'Please try again.' },
  },
  heartAndOxygen: {
    waiting:     { title: 'Waiting for your finger...', subtitle: 'Place your finger on the sensor.' },
    stabilizing: { title: 'Keep your finger still...', subtitle: 'Detecting your pulse.' },
    measuring:   { title: 'Measuring heart rate and blood oxygen...', subtitle: 'Please keep your finger still.' },
    retrying:    { title: 'Please keep still...', subtitle: 'Getting a more stable reading.' },
    success:     { title: 'Vitals measured!', subtitle: '' },
    error:       { title: 'Measurement failed', subtitle: 'Please try again.' },
  },
  weight: {
    waiting:     { title: 'Waiting...', subtitle: 'Step onto the scale.' },
    stabilizing: { title: 'Hold still...', subtitle: 'Preparing measurement.' },
    measuring:   { title: 'Measuring your weight...', subtitle: 'Please stand still.' },
    retrying:    { title: 'Please keep still...', subtitle: 'Getting a stable reading.' },
    success:     { title: 'Weight measured!', subtitle: '' },
    error:       { title: 'Measurement failed', subtitle: 'Please try again.' },
  },
};

// Specific error messages for Arduino error statuses
const ERROR_MESSAGES = {
  finger_removed:      'Your finger was removed too early. Please try again.',
  hand_removed:        'Your hand was removed too early. Please try again.',
  no_person:           'No person detected. Please stand under the sensor.',
  no_hand:             'No hand detected. Place your hand near the sensor.',
  no_finger:           'No finger detected. Place your finger on the sensor.',
  unstable:            'Measurement was unstable. Please keep still and try again.',
  invalid_position:    'Invalid position detected. Please adjust and try again.',
  insufficient_signal: 'Weak signal detected. Press your finger more firmly.',
  sensor_error:        'Sensor error. Check the kiosk sensor connection.',
  read_error:          'Reading error. Please try again.',
  timeout:             'Measurement timed out. Please try again.',
  error:               'An unexpected error occurred. Please try again.',
};

/**
 * Get the status message for a sensor + UI state.
 */
export function getStatusMessage(sensorId, uiState, rawStatus) {
  // For errors, check if we have a specific message
  if (uiState === 'error' && ERROR_MESSAGES[rawStatus]) {
    return { title: 'Measurement Issue', subtitle: ERROR_MESSAGES[rawStatus] };
  }

  return STATUS_MESSAGES[sensorId]?.[uiState] || { title: 'Processing...', subtitle: '' };
}

// ---------------------------------------------------------------------------
// Normalize Arduino result → App format
// ---------------------------------------------------------------------------

/**
 * Convert Arduino success response to the app's expected data format.
 */
function normalizeResult(sensorId, arduinoData) {
  switch (sensorId) {
    case 'height':
      return {
        value: arduinoData.height_cm,
        unit: 'cm',
        // Keep raw data for debugging
        _raw: arduinoData,
      };

    case 'temperature':
      return {
        value: arduinoData.temperature,
        unit: '°C',
        _raw: arduinoData,
      };

    case 'heartAndOxygen':
      return {
        heartRate: arduinoData.bpm,
        bloodOxygen: arduinoData.spo2,
        _raw: arduinoData,
      };

    default:
      return arduinoData;
  }
}

// ---------------------------------------------------------------------------
// Session Cache (for Heart + SpO₂ deduplication)
// ---------------------------------------------------------------------------
const sessionCache = {};

/**
 * Reset session cache (call when starting a new kiosk session).
 */
export function resetSensorSession() {
  const cachedKeys = Object.keys(sessionCache);
  const baseKeys = Object.keys(sessionBaseValues);
  cachedKeys.forEach((key) => delete sessionCache[key]);
  baseKeys.forEach((key) => delete sessionBaseValues[key]);
  console.log(`[Session] Clearing previous vitals — cached: [${cachedKeys}], bases: [${baseKeys}]`);
  console.log('[Session] Starting new health-check session');
}

/**
 * Clear cached result for a specific sensor (call on retry / measure again).
 * Critical for heartAndOxygen so a fresh HEART command is sent to Arduino.
 */
export function clearSensorCache(sensorId) {
  if (sessionCache[sensorId]) {
    console.log(`[Sensor] Cache cleared for ${sensorId}`);
    delete sessionCache[sensorId];
  }
}

/**
 * Check if a sensor result is already cached for this session.
 */
export function getCachedResult(sensorId) {
  return sessionCache[sensorId] || null;
}

/**
 * Cache a sensor result for this session.
 */
function cacheResult(sensorId, result) {
  sessionCache[sensorId] = result;
}

// ---------------------------------------------------------------------------
// Stream Sensor — Real Hardware via SSE
// ---------------------------------------------------------------------------

/**
 * Stream a real sensor measurement via SSE from the Node.js backend.
 *
 * @param {string} sensorId - One of: height, temperature, heartAndOxygen
 * @param {function} onStatus - Callback: (uiState, statusMessage, rawData) => void
 *   Called for each intermediate status update from Arduino.
 * @param {AbortSignal} [abortSignal] - Optional abort signal to cancel the measurement.
 * @returns {Promise<Object>} Normalized sensor result on success. Rejects on error.
 */
export function streamSensor(sensorId, onStatus, abortSignal) {
  const command = SENSOR_COMMANDS[sensorId];
  if (!command) {
    return Promise.reject(new Error(`No Arduino command for sensor: ${sensorId}`));
  }

  // Check cache for heartAndOxygen
  const cached = getCachedResult(sensorId);
  if (cached) {
    console.log(`[SensorService] Using cached result for ${sensorId}`);
    const msg = getStatusMessage(sensorId, 'success', 'success');
    onStatus?.('success', msg, cached);
    return Promise.resolve(cached);
  }

  return new Promise((resolve, reject) => {
    let eventSource;

    try {
      const url = `${API_BASE}/sensor/${command}`;
      console.log(`[SensorService] Opening SSE stream: ${url}`);
      eventSource = new EventSource(url);
    } catch (err) {
      console.error('[SensorService] Failed to create EventSource:', err);
      const msg = getStatusMessage(sensorId, 'error', 'sensor_error');
      onStatus?.('error', msg, null);
      reject(err);
      return;
    }

    // Handle abort
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => {
        console.log(`[SensorService] Measurement aborted for ${sensorId}`);
        eventSource.close();
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    }

    eventSource.addEventListener('connected', (e) => {
      console.log(`[SensorService] SSE connected for ${sensorId}:`, e.data);
    });

    eventSource.addEventListener('status', (e) => {
      try {
        const data = JSON.parse(e.data);
        const uiState = mapArduinoStatus(data.status);
        const msg = getStatusMessage(sensorId, uiState, data.status);

        console.log(`[SensorService] ${sensorId}: ${data.status} → ${uiState}`);
        onStatus?.(uiState, msg, data);
      } catch (err) {
        console.error('[SensorService] Failed to parse SSE status:', err);
      }
    });

    eventSource.addEventListener('done', (e) => {
      eventSource.close();

      try {
        const data = JSON.parse(e.data);

        if (data.status === 'success') {
          const result = normalizeResult(sensorId, data);
          cacheResult(sensorId, result);
          console.log(`[SensorService] ${sensorId} success:`, result);
          resolve(result);
        } else {
          const msg = getStatusMessage(sensorId, 'error', data.status);
          console.warn(`[SensorService] ${sensorId} failed: ${data.status}`);
          onStatus?.('error', msg, data);
          reject(new Error(msg.subtitle || `Sensor ${sensorId} failed: ${data.status}`));
        }
      } catch (err) {
        console.error('[SensorService] Failed to parse SSE done:', err);
        reject(err);
      }
    });

    eventSource.onerror = (err) => {
      console.error(`[SensorService] SSE error for ${sensorId}:`, err);
      eventSource.close();

      const msg = {
        title: 'Sensor Unavailable',
        subtitle: 'Check the kiosk sensor connection and try again.',
      };
      onStatus?.('error', msg, null);
      reject(new Error('Sensor unavailable. Check the kiosk sensor connection.'));
    };
  });
}

// ---------------------------------------------------------------------------
// Dummy Data — For sensors without real hardware (Weight)
// ---------------------------------------------------------------------------

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const sessionBaseValues = {};

function getOrCreateBase(sensorId) {
  if (sessionBaseValues[sensorId]) return sessionBaseValues[sensorId];

  const base = {};
  switch (sensorId) {
    case 'weight':
      base.value = randomBetween(65, 70);
      break;
    default:
      return null;
  }
  sessionBaseValues[sensorId] = base;
  return base;
}

function jitter(base, variation) {
  return base + (Math.random() * variation * 2 - variation);
}

export function generateDummySensorData(sensorId) {
  const base = getOrCreateBase(sensorId);
  if (!base) return null;

  switch (sensorId) {
    case 'weight':
      return {
        value: Number(jitter(base.value, 0.5).toFixed(1)),
        unit: 'kg',
      };
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Read Sensor — Unified entry point (dummy fallback for weight)
// ---------------------------------------------------------------------------

/**
 * Read a sensor that doesn't have real hardware (weight).
 * For real sensors, use streamSensor() instead.
 *
 * @param {string} sensorId
 * @returns {Promise<Object>} Sensor result
 */
export async function readSensor(sensorId) {
  // Weight uses dummy data
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
