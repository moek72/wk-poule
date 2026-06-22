'use strict';

const fs = require('fs');
const path = require('path');

// ─── Constants ────────────────────────────────────────────────────────────────
const SAMPLE_RATE = 44100;
const BPM = 100;
const BEAT_SAMPLES = Math.round(SAMPLE_RATE * 60 / BPM); // 26460
const DURATION_SEC = 55;
const TOTAL_SAMPLES = SAMPLE_RATE * DURATION_SEC;

// ─── Note frequencies ─────────────────────────────────────────────────────────
const FREQ = {
  G2: 98,
  D3: 147,
  E3: 165,
  G3: 196,
  A3: 220,
  B3: 247,
  C4: 262,
  D4: 294,
  E4: 330,
  G4: 392,
  A4: 440,
  B4: 494,
  C5: 523,
  D5: 587,
};

// ─── ADSR / synthesiser parameters ────────────────────────────────────────────
const ATTACK_MS   = 30;
const RELEASE_MS  = 200;

const ATTACK_SAMPLES  = Math.round(SAMPLE_RATE * ATTACK_MS  / 1000);
const RELEASE_SAMPLES = Math.round(SAMPLE_RATE * RELEASE_MS / 1000);

const MELODY_VOL = 0.30;
const BASS_VOL   = 0.20;

// ─── Phrase definitions ────────────────────────────────────────────────────────
// Each entry: [noteName, beats]
// Phrase A: 16 beats total
const PHRASE_A_MELODY = [
  ['G4', 1], ['E4', 1], ['G4', 1], ['A4', 1],
  ['G4', 2], ['E4', 2],
  ['A4', 1], ['G4', 1], ['A4', 1], ['B4', 1],
  ['A4', 2], ['G4', 2],
];

// Phrase B: 16 beats total
const PHRASE_B_MELODY = [
  ['B4', 1], ['G4', 1], ['A4', 1], ['B4', 1],
  ['C5', 2], ['A4', 2],
  ['D5', 1], ['C5', 1], ['B4', 1], ['A4', 1],
  ['G4', 4],
];

// Bass: 8 beats per phrase, played every 2 beats
// Phrase A bass: G3(2) D3(2) C3(2) G3(2)
// C3 is not in our freq table — we use C4/2 ≈ 131 Hz. Actually spec says C3 so let's add it.
const FREQ_C3 = 131;

const PHRASE_A_BASS = [
  ['G3', 2], ['D3', 2], ['C3', 2], ['G3', 2],
];
const PHRASE_B_BASS = [
  ['G3', 2], ['E3', 2], ['D3', 2], ['G3', 2],
];

// ─── Audio buffer ─────────────────────────────────────────────────────────────
const buffer = new Float32Array(TOTAL_SAMPLES);

// ─── Helper: look up frequency by name ────────────────────────────────────────
function getFreq(name) {
  if (name === 'C3') return FREQ_C3;
  const f = FREQ[name];
  if (!f) throw new Error(`Unknown note: ${name}`);
  return f;
}

// ─── Synthesise one note into the buffer at a given sample offset ─────────────
function addNote(freq, startSample, numSamples, volume) {
  // Clamp to buffer bounds
  const end = Math.min(startSample + numSamples, TOTAL_SAMPLES);
  const releaseStart = end - RELEASE_SAMPLES;

  for (let i = startSample; i < end; i++) {
    if (i < 0) continue;

    const pos = i - startSample;          // position within this note
    const t   = i / SAMPLE_RATE;         // time in seconds (for phase)

    // Envelope
    let env;
    if (pos < ATTACK_SAMPLES) {
      env = pos / ATTACK_SAMPLES;
    } else if (i >= releaseStart) {
      const relPos = i - releaseStart;
      env = 1.0 - (relPos / RELEASE_SAMPLES);
      if (env < 0) env = 0;
    } else {
      env = 1.0;
    }

    // Rich harmonics
    const f1 = 2 * Math.PI * freq * t;
    const sample =
      0.50 * Math.sin(f1) +
      0.30 * Math.sin(2 * f1) +
      0.15 * Math.sin(3 * f1) +
      0.05 * Math.sin(4 * f1);

    buffer[i] += sample * env * volume;
  }
}

// ─── Render a single phrase into the buffer ───────────────────────────────────
function renderPhrase(melodyNotes, bassNotes, startSample) {
  // Melody
  let offset = startSample;
  for (const [name, beats] of melodyNotes) {
    const numSamples = beats * BEAT_SAMPLES;
    addNote(getFreq(name), offset, numSamples, MELODY_VOL);
    offset += numSamples;
  }

  // Bass
  offset = startSample;
  for (const [name, beats] of bassNotes) {
    const numSamples = beats * BEAT_SAMPLES;
    addNote(getFreq(name), offset, numSamples, BASS_VOL);
    offset += numSamples;
  }
}

// ─── Build the full arrangement ───────────────────────────────────────────────
const PHRASE_SAMPLES = 16 * BEAT_SAMPLES; // 16 beats per phrase

let cursor = 0;
let phraseIndex = 0;

while (cursor < TOTAL_SAMPLES) {
  const isA = phraseIndex % 2 === 0;
  const melody = isA ? PHRASE_A_MELODY : PHRASE_B_MELODY;
  const bass   = isA ? PHRASE_A_BASS   : PHRASE_B_BASS;
  renderPhrase(melody, bass, cursor);
  cursor += PHRASE_SAMPLES;
  phraseIndex++;
}

// ─── Normalize to peak 0.85 ───────────────────────────────────────────────────
let peak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const abs = Math.abs(buffer[i]);
  if (abs > peak) peak = abs;
}
if (peak > 0) {
  const gain = 0.85 / peak;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    buffer[i] *= gain;
  }
}

// ─── Fade-in (2 s) and fade-out (3 s) ────────────────────────────────────────
const FADE_IN_SAMPLES  = 2 * SAMPLE_RATE;
const FADE_OUT_SAMPLES = 3 * SAMPLE_RATE;
const FADE_OUT_START   = TOTAL_SAMPLES - FADE_OUT_SAMPLES;

for (let i = 0; i < FADE_IN_SAMPLES; i++) {
  buffer[i] *= i / FADE_IN_SAMPLES;
}
for (let i = FADE_OUT_START; i < TOTAL_SAMPLES; i++) {
  const pos = i - FADE_OUT_START;
  buffer[i] *= 1 - (pos / FADE_OUT_SAMPLES);
}

// ─── Convert Float32 → Int16 PCM ─────────────────────────────────────────────
const pcm = Buffer.allocUnsafe(TOTAL_SAMPLES * 2);
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  let s = buffer[i];
  // Clamp
  if (s >  1) s =  1;
  if (s < -1) s = -1;
  const val = Math.round(s * 32767);
  pcm.writeInt16LE(val, i * 2);
}

// ─── Write WAV file ───────────────────────────────────────────────────────────
function writeWav(filePath, pcmData, sampleRate, numChannels, bitsPerSample) {
  const dataSize   = pcmData.length;          // bytes
  const fileSize   = 44 + dataSize;
  const byteRate   = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);

  const header = Buffer.allocUnsafe(44);
  let off = 0;

  // RIFF chunk descriptor
  header.write('RIFF', off); off += 4;
  header.writeUInt32LE(36 + dataSize, off); off += 4;  // ChunkSize
  header.write('WAVE', off); off += 4;

  // fmt sub-chunk
  header.write('fmt ', off); off += 4;
  header.writeUInt32LE(16, off); off += 4;              // Subchunk1Size (PCM)
  header.writeUInt16LE(1, off);  off += 2;              // AudioFormat (PCM = 1)
  header.writeUInt16LE(numChannels, off); off += 2;
  header.writeUInt32LE(sampleRate, off);  off += 4;
  header.writeUInt32LE(byteRate, off);    off += 4;
  header.writeUInt16LE(blockAlign, off);  off += 2;
  header.writeUInt16LE(bitsPerSample, off); off += 2;

  // data sub-chunk
  header.write('data', off); off += 4;
  header.writeUInt32LE(dataSize, off);    off += 4;

  const fd = fs.openSync(filePath, 'w');
  fs.writeSync(fd, header, 0, header.length);
  fs.writeSync(fd, pcmData, 0, pcmData.length);
  fs.closeSync(fd);

  return fileSize;
}

const outPath = path.join(__dirname, 'bgm.wav');
const fileSize = writeWav(outPath, pcm, SAMPLE_RATE, 1, 16);
console.log(`Written: ${outPath}`);
console.log(`File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
