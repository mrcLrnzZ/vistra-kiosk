// =============================================================================
// VISTRA Kiosk — Arduino Sensor Bridge Server
// =============================================================================
// Express server that communicates with Arduino Mega via USB Serial
// and exposes sensor data to the React frontend via Server-Sent Events (SSE).
//
// Architecture:
//   React (localhost:5173) → SSE → This Server (localhost:3001) → Serial → Arduino
//
// Endpoints:
//   GET /api/sensor/:command   — SSE stream of sensor readings
//   GET /api/status            — Arduino connection status
// =============================================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { SerialPort, ReadlineParser } = require('serialport');

const app = express();

const PORT = parseInt(process.env.SERVER_PORT, 10) || 3001;
const ARDUINO_PORT = process.env.ARDUINO_PORT || 'COM9';
const BAUD_RATE = parseInt(process.env.BAUD_RATE, 10) || 115200;

// ---------------------------------------------------------------------------
// CORS — allow the Vite dev server
// ---------------------------------------------------------------------------
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET'],
}));

// ---------------------------------------------------------------------------
// Serial Port Management
// ---------------------------------------------------------------------------
let serialPort = null;
let parser = null;
let isConnected = false;
let connectionError = null;

// Mutex: only one sensor command at a time
let activeMeasurement = null; // { command, sseRes, timeoutId }

function connectArduino() {
  if (serialPort && serialPort.isOpen) return;

  console.log(`[Serial] Attempting to connect to ${ARDUINO_PORT} at ${BAUD_RATE} baud...`);

  try {
    serialPort = new SerialPort({
      path: ARDUINO_PORT,
      baudRate: BAUD_RATE,
      autoOpen: false,
    });

    parser = serialPort.pipe(new ReadlineParser({ delimiter: '\n' }));

    serialPort.open((err) => {
      if (err) {
        console.error(`[Serial] Failed to open ${ARDUINO_PORT}:`, err.message);
        isConnected = false;
        connectionError = err.message;
        scheduleReconnect();
        return;
      }

      console.log(`[Serial] Connected to ${ARDUINO_PORT}`);
      isConnected = true;
      connectionError = null;
    });

    serialPort.on('close', () => {
      console.warn('[Serial] Port closed.');
      isConnected = false;
      scheduleReconnect();
    });

    serialPort.on('error', (err) => {
      console.error('[Serial] Error:', err.message);
      isConnected = false;
      connectionError = err.message;
    });

    // Handle incoming data from Arduino
    parser.on('data', (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      console.log(`[Arduino] ${trimmed}`);

      // If no active measurement, ignore
      if (!activeMeasurement) return;

      // Try to parse JSON
      let data;
      try {
        data = JSON.parse(trimmed);
      } catch {
        // Non-JSON line from Arduino — log and skip
        console.log(`[Arduino] Non-JSON: ${trimmed}`);
        return;
      }

      // Send SSE event to the client
      sendSSE(activeMeasurement.sseRes, 'status', data);

      // Check if this is a terminal status
      const terminalSuccess = data.status === 'success';
      const terminalError = [
        'unstable', 'no_person', 'no_hand', 'no_finger',
        'finger_removed', 'hand_removed', 'invalid_position',
        'insufficient_signal', 'sensor_error', 'read_error',
        'timeout', 'error',
      ].includes(data.status);

      if (terminalSuccess || terminalError) {
        // Clear timeout and release the lock
        if (activeMeasurement.timeoutId) {
          clearTimeout(activeMeasurement.timeoutId);
        }
        sendSSE(activeMeasurement.sseRes, 'done', data);
        activeMeasurement.sseRes.end();
        activeMeasurement = null;
      }
    });

  } catch (err) {
    console.error('[Serial] Connection error:', err.message);
    isConnected = false;
    connectionError = err.message;
    scheduleReconnect();
  }
}

let reconnectTimer = null;

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectArduino();
  }, 5000);
}

// ---------------------------------------------------------------------------
// SSE Helpers
// ---------------------------------------------------------------------------
function sendSSE(res, event, data) {
  if (res.writableEnded) return;
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ---------------------------------------------------------------------------
// API Routes
// ---------------------------------------------------------------------------

// --- Status Endpoint ---
app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    port: ARDUINO_PORT,
    baudRate: BAUD_RATE,
    error: connectionError,
    busy: activeMeasurement !== null,
  });
});

// --- Sensor SSE Endpoint ---
app.get('/api/sensor/:command', (req, res) => {
  const command = req.params.command.toUpperCase();

  // Validate command
  const validCommands = ['HEIGHT', 'TEMP', 'HEART', 'STATUS'];
  if (!validCommands.includes(command)) {
    return res.status(400).json({ error: `Invalid command: ${command}` });
  }

  // Check Arduino connection
  if (!isConnected || !serialPort || !serialPort.isOpen) {
    return res.status(503).json({
      error: 'Arduino not connected',
      message: 'Sensor unavailable. Check the kiosk sensor connection and try again.',
    });
  }

  // Check for concurrent measurement
  if (activeMeasurement) {
    return res.status(409).json({
      error: 'Sensor busy',
      message: 'Another measurement is in progress. Please wait.',
    });
  }

  // Set up SSE response
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  // Send initial connection event
  sendSSE(res, 'connected', { command, timestamp: Date.now() });

  // Set a timeout (60 seconds max per measurement)
  const timeoutId = setTimeout(() => {
    console.warn(`[Sensor] Timeout for command: ${command}`);
    sendSSE(res, 'status', { type: command.toLowerCase(), status: 'timeout' });
    sendSSE(res, 'done', { type: command.toLowerCase(), status: 'timeout' });
    res.end();
    activeMeasurement = null;
  }, 60000);

  // Acquire the lock
  activeMeasurement = { command, sseRes: res, timeoutId };

  // Handle client disconnect
  req.on('close', () => {
    console.log(`[SSE] Client disconnected during ${command}`);
    if (activeMeasurement && activeMeasurement.sseRes === res) {
      if (activeMeasurement.timeoutId) {
        clearTimeout(activeMeasurement.timeoutId);
      }
      activeMeasurement = null;
    }
  });

  // Send the command to Arduino
  serialPort.write(`${command}\n`, (err) => {
    if (err) {
      console.error(`[Serial] Write error:`, err.message);
      sendSSE(res, 'status', {
        type: command.toLowerCase(),
        status: 'sensor_error',
        message: err.message,
      });
      sendSSE(res, 'done', {
        type: command.toLowerCase(),
        status: 'sensor_error',
      });
      res.end();
      if (activeMeasurement && activeMeasurement.sseRes === res) {
        clearTimeout(activeMeasurement.timeoutId);
        activeMeasurement = null;
      }
    } else {
      console.log(`[Serial] Sent command: ${command}`);
    }
  });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  VISTRA Sensor Bridge Server`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  Arduino: ${ARDUINO_PORT} @ ${BAUD_RATE}`);
  console.log(`========================================\n`);
  connectArduino();
});
