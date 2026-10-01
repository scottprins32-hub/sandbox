// Every sound is synthesized with Web Audio, so there are no audio files to load.
// iPhone only allows sound after a tap, so call unlock() from a touch handler.
let ctx, master, musicGain, sfxGain, engine, engineGain, engineFilter;
let musicOn = true, sfxOn = true, musicTimer = null;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = musicOn ? 0.16 : 0; musicGain.connect(master);
    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxOn ? 0.5 : 0; sfxGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  // iOS: play one silent buffer inside the gesture
  const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource();
  s.buffer = b; s.connect(ctx.destination); s.start(0);
}
export function setMusic(on) { musicOn = on; if (musicGain) musicGain.gain.value = on ? 0.16 : 0; }
export function setSfx(on) { sfxOn = on; if (sfxGain) sfxGain.gain.value = on ? 0.5 : 0; if (engineGain && !on) engineGain.gain.value = 0; }

function tone(freq, dur, type = 'square', vol = 0.3, when = 0, slideTo) {
  if (!ctx) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(sfxGain);
  o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.3, freq = 1200) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  s.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start();
}

export const sfx = {
  coin: () => { tone(988, 0.08, 'square', 0.18); tone(1319, 0.25, 'square', 0.18, 0.07); },
  box: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 'triangle', 0.25, i * 0.04)),
  roulette: () => tone(600 + Math.random() * 600, 0.04, 'square', 0.08),
  got: () => { tone(784, 0.1, 'square', 0.2); tone(1175, 0.2, 'square', 0.2, 0.08); },
  boost: () => { noise(0.6, 0.5, 900); tone(200, 0.5, 'sawtooth', 0.15, 0, 600); },
  hit: () => { tone(500, 0.5, 'sawtooth', 0.25, 0, 80); noise(0.3, 0.4, 400); },
  throw: () => tone(300, 0.15, 'triangle', 0.25, 0, 700),
  drop: () => tone(400, 0.12, 'triangle', 0.25, 0, 200),
  bump: () => noise(0.12, 0.4, 300),
  zap: () => { for (let i = 0; i < 6; i++) tone(1500 - i * 200, 0.08, 'sawtooth', 0.2, i * 0.04); noise(0.5, 0.4, 3000); },
  star: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.12, 'square', 0.15, i * 0.05)),
  glide: () => { noise(1.0, 0.25, 500); tone(400, 0.6, 'sine', 0.2, 0, 900); },
  drift1: () => tone(880, 0.1, 'square', 0.12),
  drift2: () => tone(1175, 0.12, 'square', 0.14),
  drift3: () => tone(1568, 0.14, 'square', 0.16),
  beep: () => tone(660, 0.25, 'square', 0.25),
  go: () => tone(1320, 0.6, 'square', 0.28),
  lap: () => [784, 988, 1175].forEach((f, i) => tone(f, 0.14, 'square', 0.2, i * 0.09)),
  finalLap: () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.16, 'square', 0.22, i * 0.1)),
  finish: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.15, 'square', 0.22, i * 0.12)),
  tap: () => tone(880, 0.05, 'triangle', 0.18),
  unlock: () => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.18, 'triangle', 0.25, i * 0.08)),
};

// engine hum follows player speed
export function engineStart() {
  if (!ctx || engine) return;
  engine = ctx.createOscillator(); engine.type = 'sawtooth'; engine.frequency.value = 60;
  engineFilter = ctx.createBiquadFilter(); engineFilter.type = 'lowpass'; engineFilter.frequency.value = 500;
  engineGain = ctx.createGain(); engineGain.gain.value = 0;
  engine.connect(engineFilter); engineFilter.connect(engineGain); engineGain.connect(master);
  engine.start();
}
export function engineSet(speed01, boosting) {
  if (!engine) return;
  const t = ctx.currentTime;
  engine.frequency.setTargetAtTime(55 + speed01 * 110 + (boosting ? 40 : 0), t, 0.08);
  engineGain.gain.setTargetAtTime(sfxOn ? 0.035 + speed01 * 0.04 : 0, t, 0.1);
}
export function engineStop() { if (engine) { engine.stop(); engine.disconnect(); engine = null; } }

// tiny looping chiptune. Each track gets its own key and pattern from a seed.
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];
export function musicStart(seed = 1, tempo = 150) {
  musicStop();
  if (!ctx) return;
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const root = 196 * Math.pow(2, Math.floor(r() * 5) / 12);
  const melody = Array.from({ length: 32 }, (_, i) => (i % 4 === 3 && r() < 0.4 ? -1 : SCALE[Math.floor(r() * SCALE.length)]));
  const prog = [0, 5, 3, 4].map((d) => [0, 2, 4, 5, 7, 9, 11][d]);
  const step = 60 / tempo / 2;
  let i = 0, next = ctx.currentTime + 0.1;
  const play = (f, d, type, v, t) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + d + 0.02);
  };
  musicTimer = setInterval(() => {
    while (next < ctx.currentTime + 0.25) {
      const bar = Math.floor(i / 8) % 4, chord = prog[bar];
      const m = melody[i % 32];
      if (m >= 0) play(root * 2 * Math.pow(2, (m + chord) / 12), step * 0.9, 'square', 0.25, next);
      if (i % 2 === 0) play(root / 2 * Math.pow(2, (chord + (i % 4 === 2 ? 7 : 0)) / 12), step * 1.6, 'triangle', 0.5, next);
      if (i % 4 === 0) play(root * Math.pow(2, (chord + 4) / 12), step * 3, 'triangle', 0.12, next);
      next += step; i++;
    }
  }, 60);
}
export function musicStop() { if (musicTimer) clearInterval(musicTimer); musicTimer = null; }
