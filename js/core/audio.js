// Proste efekty dźwiękowe syntetyzowane przez WebAudio (bez plików audio).
// Głośność sterowana z ustawień; dźwięki można później podmienić na próbki.
let ctx = null;
let volume = 0.5;

const SOUNDS = {
  hit: { freq: 220, type: 'square', dur: 0.05, gain: 0.08 },
  crit: { freq: 440, type: 'sawtooth', dur: 0.09, gain: 0.1 },
  loot: { freq: 660, type: 'triangle', dur: 0.12, gain: 0.12, slide: 990 },
  level: { freq: 523, type: 'triangle', dur: 0.35, gain: 0.15, slide: 1046 },
  click: { freq: 800, type: 'sine', dur: 0.03, gain: 0.06 },
  defeat: { freq: 300, type: 'sawtooth', dur: 0.4, gain: 0.12, slide: 90 }
};

export function setVolume(v) { volume = Math.max(0, Math.min(1, v)); }

export function playSound(name) {
  if (volume <= 0) return;
  const s = SOUNDS[name];
  if (!s) return;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.freq, ctx.currentTime);
    if (s.slide) osc.frequency.exponentialRampToValueAtTime(s.slide, ctx.currentTime + s.dur);
    g.gain.setValueAtTime(s.gain * volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + s.dur);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + s.dur + 0.02);
  } catch (e) { /* brak WebAudio — gra działa bez dźwięku */ }
}
