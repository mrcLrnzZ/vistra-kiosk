# Gesture System Report — Vistra Kiosk

## Overview

The Vistra kiosk is navigated entirely by hand gestures captured through the device camera, using **MediaPipe Gesture Recognizer** (`@mediapipe/tasks-vision`) running in the browser. There is no touch dependency for core navigation — every screen can be operated via gestures, with buttons available as a fallback.

The system is split into five cooperating pieces:

| File | Role |
|------|------|
| `src/components/GestureCamera.jsx` | Camera capture + ML inference + gesture detection + action emission |
| `src/App.jsx` | Orchestrates two gesture channels (tutorial vs. app screens), manages tutorial lifecycle |
| `src/components/GestureTutorial.jsx` | Progressive onboarding tutorial with video demos + voice instructions |
| `src/components/GestureIndicator.jsx` | On-screen status panel (camera, hand, zone, gesture, cooldown) |
| Individual screens (`*.jsx` in `src/screens/`) | Each consumes gestures for its own navigation/actions |

---

## 1. Detection Pipeline — `GestureCamera.jsx`

### Camera & model setup
- Loads MediaPipe vision tasks from CDN (`@mediapipe/tasks-vision@0.10.3`)
- Creates a `GestureRecognizer` with:
  - Model: `gesture_recognizer.task` (float16, from Google storage)
  - Delegate: GPU
  - Running mode: VIDEO
  - `numHands: 1`
  - Confidence thresholds: 0.6 for detection/presence/tracking
  - Canned-gestures score threshold: **0.65** (`CONFIG.MIN_GESTURE_SCORE`)
- Requests webcam at 640×480
- Runs inference on a `requestAnimationFrame` loop, **throttled to ~15 FPS (every 66 ms)** to limit CPU/GPU load

### Stabilization
A sliding buffer (`CONFIG.STABILITY_WINDOW: 8`) smooths noisy frame-by-frame predictions:
- Each detected gesture name is pushed into an 8-sample buffer
- The most frequent gesture wins; it only counts as "stable" if it appears in ≥60% of the window (`CONFIG.STABILITY_RATIO: 0.6`)
- Otherwise the stable gesture is `'None'`

### Hold gestures (require a steady hold)
Three canned MediaPipe gestures map to app actions:

| MediaPipe gesture | App action | Meaning |
|-------------------|------------|---------|
| `Thumb_Up` | `Select` | Select / confirm highlighted option |
| `Pointing_Up` | `Continue` | Continue to next screen / proceed |
| `Thumb_Down` | `Back` | Go back / cancel |

A hold gesture must be held steady for **`HOLD_MS: 500 ms`** before it fires. While holding, the UI shows `(Hold N/5)` progress; once detected it shows `Gesture Detected`, then `Release hand to reset` until the hand is removed.

### Swipe gestures (zone-based)
The hand's center X position (mirrored) divides the frame into three vertical zones:
- `Left` (x < 0.33)
- `Neutral` (middle)
- `Right` (x > 0.67)

A clean zone transition while Neutral emits a swipe:
- Neutral → Left = `Previous` ("Swiped Left")
- Neutral → Right = `Next` ("Swiped Right")

Swipes are suppressed while a hold gesture is active or during cooldown.

### Cooldown
After any action fires, a **`COOLDOWN_MS: 700 ms`** cooldown blocks repeat gestures. During cooldown the status shows `Cooldown...`.

### Outputs
`GestureCamera` calls two props:
- `onGesture(action)` — emits one of: `Select`, `Continue`, `Back`, `Previous`, `Next`
- `onStatusChange(status)` — emits `{ camera, hand, gesture, zone, cooldownRemaining }` every frame the status changes

The camera feed + landmarks are drawn on an overlay canvas with zone divider lines and a hand center dot.

---

## 2. App-Level Orchestration — `App.jsx`

### Two isolated gesture channels
To keep the tutorial from interfering with app navigation, App maintains **two separate gesture states**:

| Channel | State | Consumed by | When active |
|---------|-------|-------------|-------------|
| Tutorial | `tutorialGesture` | `GestureTutorial` | Always (even during tutorial) |
| App screens | `lastGesture` | Each screen | Only after tutorial completed |

`handleGesture(gesture)`:
1. Applies a minimal **200 ms debounce** at the App level (GestureCamera handles native cooldowns)
2. Always updates `tutorialGesture`
3. **Blocks screen navigation while the tutorial is active** (`if (showTutorial && !tutorialCompleted) return`)
4. Otherwise updates `lastGesture` and routes to the current screen's handler

App-level fallback routing (mostly handled by screens directly):
- `summary` + `Continue` → `final`; `Back` → `healthCheck`
- `final` + `Continue`/`Back` → `landing`

### Tutorial lifecycle
- When a hand transitions from absent → present on the landing screen (and tutorial not yet completed), the tutorial opens automatically
- Tutorial can be **skipped permanently** via Thumbs Up (`handleTutorialComplete` → `tutorialCompleted = true`)
- Tutorial can **time out** after 10 s of inactivity (`handleTutorialTimeout` → temporary close; re-opens when hand reappears)
- If a user completes/skips the tutorial and walks away (hand absent for 5 s on landing), the tutorial resets for the next user

---

## 3. Tutorial — `GestureTutorial.jsx`

A progressive 5-step onboarding, each step with a video demo and spoken voice instruction:

| Step | Gesture | Action taught |
|------|---------|---------------|
| 1 | `Previous` | Swipe left hand → previous option |
| 2 | `Next` | Swipe right hand → next option |
| 3 | `Continue` | Point index finger up → continue |
| 4 | `Back` | Thumbs down → back / cancel |
| 5 | `Select` | Thumbs up → select / confirm |

Behavior:
- Intro plays for 3 s, then step 1 begins
- Each step waits for the expected gesture (matched against `tutorialGesture`)
- Correct gesture → success animation → auto-advance to next step (1.4 s delay)
- Final step → completion celebration → closes tutorial
- **Thumbs Up on steps 1–4** skips the tutorial permanently
- Any gesture resets the **10 s inactivity countdown**; timeout closes the tutorial temporarily
- Voice instructions are spoken via `voiceService` (`speak()`), with mute/replay controls

---

## 4. Status Indicator — `GestureIndicator.jsx`

A top-right panel showing real-time system status:
- Camera: Connected / Initializing
- Hand: Detected / not detected (color-coded teal/slate)
- Position Zone: Left / Neutral / Right (with blue highlight when in a swipe zone)
- Gesture: current detected gesture text
- Cooldown: Ready / countdown seconds (amber when active)

---

## 5. Per-Screen Gesture Consumption

### LandingScreen (`src/screens/LandingScreen.jsx`)
- `Select` (Thumbs Up) or `Continue` (Point Up) → `onStart()` → begins health check
- Note: the on-screen text says "Show a gesture to view the tutorial, or point up to start"
- Tutorial auto-opens on first hand detection (handled in App.jsx)

### ModeSelectionScreen (`src/screens/ModeSelectionScreen.jsx`)
- `Next` / `Previous` → toggle between Auto and Manual mode
- `Select` or `Continue` → confirm selected mode → `onSelectMode(id)`
- `Back` → return to landing

### HealthCheckScreen (`src/screens/HealthCheckScreen.jsx`)
Gesture meaning depends on `measurementState`:

| State | Continue (Point Up) | Select (Thumbs Up) | Back (Thumbs Down) | Next/Previous |
|-------|---------------------|--------------------|--------------------|---------------|
| `instructions` | `handleReady()` (begin measuring) | — | `handleCancel()` | — |
| `measuring` | blocked | blocked | abort (manual only) | blocked |
| `result` | `handleMeasureAgain()` | `handleContinue()` | `handleBackToSensors()` | — |
| `error` | `handleMeasureAgain()` | `handleMeasureAgain()` | `handleBackToSensors()` | — |

Outside an active sensor (sensor-grid navigation):
- `Next` / `Previous` → cycle selected sensor
- `Select` → select sensor for measurement
- `Continue` → if any measurements completed, finish health check
- `Back` → return to mode selection
- Auto mode: only `Back` is allowed

### SummaryScreen / FinalScreen
Handled in App.jsx:
- `summary`: `Continue` → `final`; `Back` → `healthCheck`
- `final`: `Continue` or `Back` → `landing` (restart)

---

## 6. Configuration Constants (`GestureCamera.jsx`)

```js
CONFIG = {
  MIN_GESTURE_SCORE: 0.65,      // ML confidence threshold
  STABILITY_WINDOW: 8,          // frame buffer size
  STABILITY_RATIO: 0.6,         // % agreement needed for stable
  HOLD_MS: 500,                 // hold duration before firing
  COOLDOWN_MS: 700,             // lockout after firing
  LEFT_ZONE_THRESHOLD: 0.33,    // swipe left boundary
  RIGHT_ZONE_THRESHOLD: 0.67,   // swipe right boundary
}
```

---

## 7. Data Flow Summary

```
Webcam (640x480)
    │
    ▼
MediaPipe GestureRecognizer (~15 FPS)
    │
    ├──► 8-frame stability buffer (60% agreement)
    │         │
    │         ├─ hold gesture steady 500ms ───► Select / Continue / Back
    │         └─ zone change Neutral→Left/Right ─► Previous / Next
    │                   (700ms cooldown after any action)
    │
    ▼
GestureCamera.onGesture(action) ───┐
                                   │
GestureCamera.onStatusChange(status) ─► GestureIndicator (UI panel)
                                   │
                                   ▼
                              App.handleGesture(gesture)
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
         tutorialGesture      lastGesture          (blocked if tutorial active)
         (always updated)   (post-tutorial only)
              │                    │
              ▼                    ▼
      GestureTutorial      Each screen (landing, modeSelection,
      (5-step onboarding)    healthCheck, summary, final)
```

---

## Key Design Decisions

1. **Two-channel isolation** prevents tutorial gestures from accidentally navigating app screens.
2. **Stabilization buffer + hold requirement** prevents jittery ML predictions from triggering false actions.
3. **Zone-based swipes** give a natural "swipe left/right" metaphor without requiring precise gesture classification for navigation.
4. **Cooldown** prevents a single sustained gesture from firing repeatedly.
5. **Per-state gesture meaning** in HealthCheckScreen lets the same gesture (e.g. Continue) do different things (begin measuring / measure again / finish) depending on context.
6. **Tutorial auto-triggers on first hand detection**, resets after a user walks away (5 s idle), making the kiosk ready for the next person.
