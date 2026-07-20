# VISTRA Context Progress & Development Log

## 2026-07-20 - Workflow Planning & UI/UX Refinement: Instructions and Tutorial

### What was improved:
1. **Visual "How it Works" (Replaced Text-Heavy Screen):** The generic bullet-point instructions screen has been redesigned into a highly visual, 3-step "How it Works" screen (1. Stand & Measure, 2. Save via QR, 3. Take Receipt) using icons and minimal text.
2. **Added "Get Ready" Preparation Screen:** Inserted a transitional screen between Instructions and Measurement Mode. This tells the user exactly *how* to position themselves (e.g., "Step on the footprints, look forward, insert index finger into the clip") before sensors start reading.
3. **Unified Progress Indicator in Measurement Mode:** Added a constant, visible progress tracker (e.g., Step 1/5, 2/5) or a visual human silhouette highlighting the current active sensor (head for temp, feet for weight, etc.) across all measurement screens.
4. **Micro-Interactions for Transitions:** Defined that each successful measurement should display a clear "Success" visual (e.g., green checkmark) and a sound cue (if applicable) before auto-proceeding.
5. **Sensor Error Recovery Flow:** Added a workflow rule that if a sensor loses signal (e.g., finger slips out), the system pauses the measurement, prompts the user visually to correct their position, rather than failing the whole assessment or skipping.

### Why it was changed:
* **Cognitive Load:** Clinic visitors often skip reading bullet points. Visual steps are processed significantly faster and cross language barriers.
* **Accuracy & Flow:** Many kiosk errors occur because the user is not in the correct posture *before* the measurement starts. The "Get Ready" screen reduces sensor retries and calibration errors.
* **Anxiety Reduction:** A visible progress tracker helps users understand how much longer they need to stand still, reducing impatience and movement.
* **Error Prevention:** Giving users a chance to gracefully correct their position (Error Recovery) prevents frustration and avoids forcing them to restart the entire process.

### Remaining questions or issues:
* **Audio Cues:** Should the kiosk include voice prompts or just simple chimes/beeps for transitions and errors? (Need to check if hardware includes speakers).
* **Hardware Physical Layout:** The "Get Ready" screen depends on where the sensors are physically located. Are the heart rate and SpO2 sensors on a hand rest? Are users standing the entire time?
* **Pacing:** How long should the success transition take before moving to the next measurement? (Recommendation: 1.5 - 2 seconds).

### Suggested next steps:
* Finalize the layout concepts for the new 3-Step Instruction screen and the "Get Ready" screen.
* Confirm the physical posture required (e.g., can the user stand on the scale and use the SpO2 sensor at the same time?).
* Begin mapping out the specific UI state machine for the Measurement sequence.
