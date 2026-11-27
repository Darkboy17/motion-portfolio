// Synthesizes the two placeholder music beds into public/sfx as 16-bit mono WAVs:
// a chord pad for the explainers and a 120 BPM pulse for the fashion pieces.
// Sound effects are real recordings now (see prepare-sfx.ts); these beds stay
// until licensed music replaces them. Deterministic, so CI can rebuild them.
//   npx tsx scripts/make-sfx.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SR = 48000;
const OUT = join(import.meta.dirname, "..", "public", "sfx");

const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const buf = (seconds: number) => new Float32Array(Math.ceil(seconds * SR));
const TAU = Math.PI * 2;

/** RBJ biquad band-pass, recomputed per sample so the centre can sweep. */
const bandpass = (x: Float32Array, freq: (t: number) => number, q: number) => {
  const y = new Float32Array(x.length);
  let x1 = 0,
    x2 = 0,
    y1 = 0,
    y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const w = (TAU * freq(i / SR)) / SR;
    const alpha = Math.sin(w) / (2 * q);
    const a0 = 1 + alpha;
    const b0 = alpha / a0,
      b2 = -alpha / a0;
    const a1 = (-2 * Math.cos(w)) / a0,
      a2 = (1 - alpha) / a0;
    const v = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
};

const lowpass = (x: Float32Array, fc: number) => {
  const a = 1 - Math.exp((-TAU * fc) / SR);
  let s = 0;
  return x.map((v) => (s += a * (v - s)));
};

const highpass = (x: Float32Array, fc: number) => {
  const lp = lowpass(x, fc);
  return x.map((v, i) => v - lp[i]);
};

const noise = (seconds: number, seed: number) => {
  const r = mulberry32(seed);
  return buf(seconds).map(() => r() * 2 - 1);
};

const normalize = (x: Float32Array, peak = 0.89) => {
  const m = x.reduce((a, v) => Math.max(a, Math.abs(v)), 0) || 1;
  return x.map((v) => (v / m) * peak);
};

/** Fades the last `seconds` to silence so no file ends on a click. */
const tailFade = (x: Float32Array, seconds = 0.01) => {
  const n = Math.min(x.length, Math.ceil(seconds * SR));
  for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n;
  return x;
};

const writeWav = (name: string, data: Float32Array) => {
  const pcm = Buffer.alloc(44 + data.length * 2);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(36 + data.length * 2, 4);
  pcm.write("WAVEfmt ", 8);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20);
  pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) =>
    pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), 44 + i * 2),
  );
  writeFileSync(join(OUT, `${name}.wav`), pcm);
  console.log(`sfx/${name}.wav  ${(data.length / SR).toFixed(2)}s`);
};

const env = (t: number, attack: number, decay: number) =>
  t < attack ? t / attack : Math.exp(-(t - attack) / decay);

const tone = (len: number, f: (t: number) => number, decay: number, attack = 0.002) => {
  let ph = 0;
  return buf(len).map((_, i) => {
    const t = i / SR;
    ph += (TAU * f(t)) / SR;
    return Math.sin(ph) * env(t, attack, decay);
  });
};

const mix = (...parts: [Float32Array, number][]) => {
  const len = Math.max(...parts.map(([p]) => p.length));
  const out = new Float32Array(len);
  for (const [p, g] of parts) p.forEach((v, i) => (out[i] += v * g));
  return out;
};

// ---------- beds ----------

const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** A slow chord pad with a seamless loop: each chord's tail wraps to the start. */
const pad = () => {
  const chordLen = 6;
  const chords = [
    [48, 55, 59, 62, 64], // Cmaj9
    [45, 52, 55, 59, 60], // Am9
    [41, 48, 52, 57, 67], // Fmaj7 add9
    [43, 50, 57, 60, 64], // G6sus
  ];
  const total = chordLen * chords.length;
  const out = buf(total);
  const N = out.length;
  chords.forEach((chord, ci) => {
    const start = ci * chordLen;
    const len = chordLen + 3;
    chord.forEach((m, vi) => {
      for (const detune of [-0.0025, 0.0025]) {
        const f = midi(m) * (1 + detune);
        let ph = vi * 1.7;
        for (let i = 0; i < len * SR; i++) {
          const t = i / SR;
          const a = Math.min(1, t / 1.8) * (t > chordLen ? Math.max(0, 1 - (t - chordLen) / 3) : 1);
          ph += (TAU * f) / SR;
          const v =
            (Math.sin(ph) + 0.18 * Math.sin(3 * ph) + 0.06 * Math.sin(5 * ph)) *
            a *
            (vi === 0 ? 0.9 : 0.55);
          out[(Math.round(start * SR) + i) % N] += v;
        }
      }
    });
  });
  const tremolo = out.map((v, i) => v * (0.85 + 0.15 * Math.sin((TAU * i) / SR / 4)));
  return normalize(lowpass(tremolo, 1800), 0.6);
};

/** A 120 BPM pulse (15 frames a beat at 30 fps): kick, clap, hats, sub and pad. */
const pulse = () => {
  const bpm = 120;
  const beat = 60 / bpm;
  const bars = 16;
  const total = bars * 4 * beat;
  const out = buf(total + 1);
  const add = (src: Float32Array, at: number, gain: number) => {
    const o = Math.round(at * SR);
    for (let i = 0; i < src.length && o + i < out.length; i++) out[o + i] += src[i] * gain;
  };
  const kick = mix(
    [tone(0.45, (t) => 46 + 110 * Math.exp(-t * 32), 0.17, 0.001), 1],
    [highpass(noise(0.02, 21), 2500).map((v, i) => v * env(i / SR, 0.0003, 0.003)), 0.25],
  );
  const clap = (() => {
    const n = bandpass(noise(0.3, 22), () => 1600, 0.9);
    return n.map((v, i) => {
      const t = i / SR;
      const bursts = [0, 0.011, 0.022].reduce(
        (a, s) => a + (t >= s ? env(t - s, 0.0005, s === 0.022 ? 0.09 : 0.006) : 0),
        0,
      );
      return v * bursts;
    });
  })();
  const hat = highpass(noise(0.08, 23), 7000).map((v, i) => v * env(i / SR, 0.0005, 0.018));
  const openHat = highpass(noise(0.3, 24), 6500).map((v, i) => v * env(i / SR, 0.001, 0.09));
  const roots = [45, 41, 48, 43]; // A F C G, two bars each
  const chords = [
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [55, 60, 64, 67],
    [55, 59, 62, 67],
  ];
  for (let b = 0; b < bars; b++) {
    const barT = b * 4 * beat;
    const sect = Math.floor(b / 2) % 4;
    const intro = b < 2;
    const outro = b >= bars - 1;
    for (let q = 0; q < 4; q++) {
      const t = barT + q * beat;
      if (!intro && !outro) add(kick, t, 0.95);
      if (!intro && (q === 1 || q === 3)) add(clap, t, 0.42);
      add(hat, t + beat / 2, 0.22);
      add(hat, t, 0.12);
      if (!intro && q === 3) add(openHat, t + beat / 2, 0.12);
    }
    // sub bass on the off-beat eighths, ducked under the kick
    if (!intro) {
      for (let e = 0; e < 8; e++) {
        const t = barT + e * (beat / 2);
        if (e % 2 === 0) continue;
        add(
          tone(beat / 2, () => midi(roots[sect] - 12), 0.12, 0.004),
          t,
          0.55,
        );
      }
    }
    // pad stab per bar
    if (b % 2 === 0) {
      const chord = chords[sect];
      const len = 8 * beat;
      const stab = buf(len);
      chord.forEach((m, k) => {
        let ph = k;
        for (let i = 0; i < stab.length; i++) {
          const t2 = i / SR;
          ph += (TAU * midi(m)) / SR;
          stab[i] +=
            (Math.sin(ph) + 0.25 * Math.sin(2 * ph)) *
            Math.min(1, t2 / 0.6) *
            Math.max(0, 1 - t2 / len) *
            0.25;
        }
      });
      add(lowpass(stab, 2200), barT, 0.5);
    }
  }
  return tailFade(normalize(out, 0.8), 0.05);
};

mkdirSync(OUT, { recursive: true });
writeWav("pad", pad());
writeWav("pulse", pulse());
