let ctx;
let master;
let humOsc;
let humGain;
let muted = false;
let volume = 0.28;

export function initAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : volume;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.03);
}

export function isMuted() {
  return muted;
}

function tone(freq, duration = 0.06, type = 'square', gainValue = 0.12, delay = 0) {
  if (!ctx || muted) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function sweep(from, to, duration = 0.3, type = 'sawtooth', gainValue = 0.08) {
  if (!ctx || muted) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(ctx.currentTime + duration + 0.03);
}

export function startHum() {
  initAudio();
  if (humOsc) return;
  humOsc = ctx.createOscillator();
  humGain = ctx.createGain();
  humOsc.type = 'triangle';
  humOsc.frequency.value = 58;
  humGain.gain.value = muted ? 0 : 0.018;
  humOsc.connect(humGain);
  humGain.connect(master);
  humOsc.start();
}

export const sounds = {
  click: () => tone(760, 0.045, 'square', 0.08),
  reelTick: () => tone(160 + Math.random() * 120, 0.018, 'square', 0.045),
  reelSpin: () => sweep(90, 260, 0.18, 'sawtooth', 0.04),
  reelStop: () => {
    tone(380, 0.055, 'square', 0.14);
    tone(150, 0.07, 'triangle', 0.06, 0.035);
  },
  win: () => [523, 659, 784, 1046].forEach((note, index) => tone(note, 0.15, 'square', 0.12, index * 0.085)),
  lose: () => {
    sweep(230, 150, 0.28, 'sawtooth', 0.07);
    tone(120, 0.08, 'square', 0.04, 0.24);
  },
  flip: () => {
    [880, 1046, 1320, 1046, 880, 660].forEach((note, index) => tone(note, 0.055, 'square', 0.07, index * 0.07));
  },
  feature: () => [330, 494, 660, 990].forEach((note, index) => tone(note, 0.14, 'triangle', 0.1, index * 0.09)),
  mystery: () => [400, 520, 650, 790, 940].forEach((note, index) => tone(note, 0.05, 'square', 0.06, index * 0.06)),
  jackpot: () => {
    [392, 523, 659, 784, 988, 1175, 1318, 1568, 2093].forEach((note, index) => tone(note, 0.16, 'square', 0.14, index * 0.075));
    setTimeout(() => [2093, 1760, 1568, 1318, 1046].forEach((note, index) => tone(note, 0.18, 'sawtooth', 0.1, index * 0.09)), 780);
  },
  dogBonus: () => {
    tone(280, 0.07, 'square', 0.08);
    tone(520, 0.08, 'square', 0.09, 0.1);
    tone(310, 0.07, 'square', 0.08, 0.22);
  },
  collect: () => [740, 880, 1046].forEach((note, index) => tone(note, 0.08, 'triangle', 0.08, index * 0.07)),
};
