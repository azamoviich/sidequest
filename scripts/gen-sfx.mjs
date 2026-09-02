// Generates tiny synthesized WAV sound effects (sine-wave beeps) so the
// package ships real SFX with zero external asset/licensing dependencies.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SAMPLE_RATE = 22050;

function writeWav(path, samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  writeFileSync(path, buf);
}

function tone(freqStart, freqEnd, durationSec, volume = 0.3) {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const freq = freqStart + (freqEnd - freqStart) * (i / n);
    const envelope = Math.min(1, (n - i) / (SAMPLE_RATE * 0.02), i / (SAMPLE_RATE * 0.005));
    samples[i] = Math.sin(2 * Math.PI * freq * t) * volume * envelope;
  }
  return samples;
}

function concat(...parts) {
  const total = parts.reduce((sum, p) => sum + p.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

const OUT = new URL("../assets/sfx", import.meta.url).pathname;

writeWav(join(OUT, "eat.wav"), tone(660, 880, 0.08, 0.25));
writeWav(join(OUT, "gameover.wav"), tone(400, 120, 0.5, 0.3));
writeWav(join(OUT, "correct.wav"), concat(tone(523, 659, 0.09, 0.25), tone(784, 784, 0.12, 0.25)));
writeWav(join(OUT, "wrong.wav"), tone(200, 100, 0.3, 0.3));
writeWav(join(OUT, "done.wav"), concat(tone(523, 523, 0.1, 0.25), tone(659, 659, 0.1, 0.25), tone(784, 784, 0.2, 0.25)));
writeWav(join(OUT, "click.wav"), tone(880, 880, 0.03, 0.15));

console.log("sfx generated in", OUT);
