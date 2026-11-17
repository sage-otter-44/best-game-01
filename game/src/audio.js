// Lumen Orbit — sound. Every sound is synthesised live with WebAudio
// oscillators and noise; the game ships no audio files at all.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
  }

  // Browsers only allow audio after a user gesture, so the first call that
  // follows a click or keypress creates the context. Safe to call often.
  unlock() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.context = new AC();
      this.master = this.context.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.context.destination);
    } catch (err) {
      this.context = null; // headless or no audio: the game stays silent
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }

  // A short sine blip that climbs in pitch with the combo — the pickup
  // sound gets brighter the hotter the run is.
  pickup(combo) {
    if (!this.context || this.muted) return;
    const base = 520 * Math.pow(1.059, Math.min(combo, 12));
    this.tone(base, base * 1.5, 0.12, 'sine', 0.5);
    this.tone(base * 2, base * 2.4, 0.08, 'triangle', 0.18);
  }

  // A low thud plus a burst of filtered noise for taking a hit.
  hit() {
    if (!this.context || this.muted) return;
    this.tone(160, 55, 0.28, 'sawtooth', 0.5);
    this.noise(0.22, 900, 0.4);
  }

  // A quick rising whoosh for the dash.
  dash() {
    if (!this.context || this.muted) return;
    this.noise(0.16, 2600, 0.22);
    this.tone(280, 720, 0.14, 'sine', 0.2);
  }

  // A little major arpeggio when a wave clears.
  waveClear() {
    if (!this.context || this.muted) return;
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, freq, 0.22, 'triangle', 0.4), i * 90);
    });
  }

  // A short descending phrase for game over.
  gameOver() {
    if (!this.context || this.muted) return;
    [392, 330, 262, 196].forEach((freq, i) => {
      setTimeout(() => this.tone(freq, freq * 0.94, 0.3, 'triangle', 0.4), i * 140);
    });
  }

  click() {
    if (!this.context || this.muted) return;
    this.tone(880, 880, 0.05, 'square', 0.12);
  }

  // One oscillator that glides from one frequency to another.
  tone(fromFreq, toFreq, seconds, type, volume) {
    const t0 = this.context.currentTime;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(fromFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(toFreq, 1), t0 + seconds);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  // White noise through a low-pass filter, for whooshes and impacts.
  noise(seconds, cutoff, volume) {
    const t0 = this.context.currentTime;
    const length = Math.max(1, Math.floor(this.context.sampleRate * seconds));
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.context.createBufferSource();
    src.buffer = buffer;
    const filter = this.context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = this.context.createGain();
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }
}
