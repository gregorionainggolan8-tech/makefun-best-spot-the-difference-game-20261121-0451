// audio.js — every sound in the game is synthesised with WebAudio at run time.
// No audio files are shipped, so the game loads nothing over the network.

let audioContext = null;
let muted = false;

function context() {
  if (!audioContext) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioContext = new AC();
    } catch {
      return null;
    }
  }
  if (audioContext.state === 'suspended') void audioContext.resume();
  return audioContext;
}

export function isMuted() {
  return muted;
}

export function toggleMuted() {
  muted = !muted;
  return muted;
}

// One short oscillator note with an exponential fade.
function note(freq, startAt, dur, type, gainValue) {
  const ctx = context();
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + startAt);
  osc.stop(ctx.currentTime + startAt + dur + 0.05);
}

// The satisfying pop when a difference is found: two rising notes.
export function playFound() {
  note(523.25, 0, 0.16, 'sine', 0.22);
  note(783.99, 0.07, 0.24, 'sine', 0.22);
}

// A dull thud for a wrong click.
export function playWrong() {
  note(160, 0, 0.18, 'triangle', 0.18);
  note(110, 0.05, 0.22, 'triangle', 0.14);
}

// A small arpeggio when a level is cleared.
export function playLevelClear() {
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, i * 0.09, 0.28, 'sine', 0.2));
}

// A longer fanfare for the final victory.
export function playVictory() {
  [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
    note(f, i * 0.11, 0.3, 'triangle', 0.18),
  );
}

// A soft tick when the timer drops under ten seconds.
export function playTick() {
  note(880, 0, 0.06, 'square', 0.05);
}

// A quiet click for buttons and the crosshair.
export function playClick() {
  note(440, 0, 0.05, 'sine', 0.08);
}
