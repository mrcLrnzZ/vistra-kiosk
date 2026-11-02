/**
 * Voice Instruction Service
 * Wraps the Web Speech API (SpeechSynthesis) for kiosk voice guidance.
 * Provides play, stop, replay, and mute functionality.
 */

let isMuted = false;
let voiceReady = false;
let preferredVoice = null;

// Voice configuration constants
const VOICE_CONFIG = {
  rate: 0.85,        // Slower for clarity
  pitch: 1.0,        // Natural pitch
  volume: 1.0,       // Full volume (controlled by mute)
  lang: 'en-US',     // US English
};

/**
 * Initialize the speech synthesis and select the best available voice.
 * Call once on app startup.
 */
export function initVoiceService() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[VoiceService] Speech Synthesis API not supported');
    return false;
  }

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return false;

    // Prefer a natural-sounding US English voice
    const preferred = voices.find(v => 
      v.lang.startsWith('en-US') && 
      (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural'))
    ) || voices.find(v => v.lang.startsWith('en-US')) || voices[0];

    preferredVoice = preferred;
    voiceReady = true;
    console.log('[VoiceService] Voice selected:', preferredVoice.name, preferredVoice.lang);
    return true;
  };

  // Voices might load asynchronously
  if (!loadVoices()) {
    window.speechSynthesis.onvoiceschanged = () => {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = null;
    };
  }

  return true;
}

/**
 * Speak a text instruction.
 * Stops any currently playing utterance before starting the new one.
 * @param {string} text - The text to speak
 * @param {object} options - Optional overrides for rate, pitch, volume
 * @returns {Promise<void>} Resolves when speech finishes or is interrupted
 */
export function speak(text, options = {}) {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('[VoiceService] Speech Synthesis API not available');
      resolve();
      return;
    }

    if (isMuted) {
      console.log('[VoiceService] Muted, skipping:', text);
      resolve();
      return;
    }

    // Stop any current speech
    stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? VOICE_CONFIG.rate;
    utterance.pitch = options.pitch ?? VOICE_CONFIG.pitch;
    utterance.volume = isMuted ? 0 : (options.volume ?? VOICE_CONFIG.volume);
    utterance.lang = options.lang ?? VOICE_CONFIG.lang;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      // Ignore 'interrupted' errors (caused by calling stop())
      if (event.error !== 'interrupted' && event.error !== 'canceled') {
        console.error('[VoiceService] Speech error:', event.error);
      }
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop any currently playing speech immediately.
 */
export function stop() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Toggle mute state.
 * @param {boolean} muted - Optional explicit mute state
 * @returns {boolean} New mute state
 */
export function setMuted(muted) {
  if (typeof muted === 'boolean') {
    isMuted = muted;
  } else {
    isMuted = !isMuted;
  }

  // If muting, stop current speech
  if (isMuted) {
    stop();
  }

  console.log('[VoiceService] Mute:', isMuted);
  return isMuted;
}

/**
 * Get current mute state.
 * @returns {boolean}
 */
export function getMuted() {
  return isMuted;
}

/**
 * Replay the last spoken instruction (if any).
 * Note: This requires the caller to track the last instruction text.
 * @param {string} text - The text to replay
 * @param {object} options - Optional voice config overrides
 */
export function replay(text, options = {}) {
  return speak(text, options);
}

/**
 * Check if speech synthesis is currently speaking.
 * @returns {boolean}
 */
export function isSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
}

/**
 * Check if the voice service is ready (voices loaded).
 * @returns {boolean}
 */
export function isReady() {
  return voiceReady;
}