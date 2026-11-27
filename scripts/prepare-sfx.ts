// Cuts the sound library in public/sfx from the recordings in sfx-sources/
// (fetch them with fetch-sfx-sources.ts). Every slot has several real takes, so
// a sound that repeats never plays the same file twice in a row by default.
//
// Each take is trimmed to start on its transient, given a short fade so a cut
// never clicks, levelled to the same loudness (RMS peak -16 dBFS, true peak at
// most -1 dBFS) and saved as 48 kHz mono Ogg Vorbis. The slot list, takes,
// durations and gains go to src/kit/sfx-manifest.json for the Sfx component.
//   npx tsx scripts/prepare-sfx.ts
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "sfx-sources");
const OUT = join(ROOT, "public", "sfx");
const TMP = join(ROOT, "sfx-sources", ".work");

/** A take: a whole file, or a window [start, dur] of a longer recording. */
type Cut = { src: string; start?: number; dur?: number; max?: number; onset?: number };
type Slot = { takes: Cut[]; gain: number; about: string };

const kenney = (pack: string, ...names: string[]): Cut[] =>
  names.map((n) => ({ src: `kenney/${pack}/Audio/${n}.ogg` }));
/** Whole files, cut to at most `max` seconds after their onset. */
const capped = (max: number, cuts: Cut[]): Cut[] => cuts.map((c) => ({ ...c, max }));
const windows = (file: string, ...w: [number, number][]): Cut[] =>
  w.map(([start, dur]) => ({ src: `commons/${file}`, start, dur }));
const series = (prefix: string, from: number, to: number, pad = 3) =>
  Array.from(
    { length: to - from + 1 },
    (_, i) => `${prefix}${String(from + i).padStart(pad, "0")}`,
  );

export const SLOTS: Record<string, Slot> = {
  // Interface (Kenney, Interface Sounds)
  tick: {
    takes: kenney("interface-sounds", "tick_001", "tick_002", "tick_004"),
    gain: 0.3,
    about: "small reveals, list rows",
  },
  click: {
    takes: kenney("interface-sounds", ...series("click_", 1, 5)),
    gain: 0.35,
    about: "buttons, chips, a code line landing",
  },
  select: {
    takes: kenney("interface-sounds", ...series("select_", 1, 4)),
    gain: 0.35,
    about: "a card or row appearing",
  },
  toggle: {
    takes: kenney("interface-sounds", ...series("toggle_", 1, 4)),
    gain: 0.35,
    about: "a state flipping",
  },
  confirm: {
    takes: kenney("interface-sounds", ...series("confirmation_", 1, 4)),
    gain: 0.4,
    about: "a right answer",
  },
  error: {
    takes: kenney("interface-sounds", ...series("error_", 1, 3)),
    gain: 0.3,
    about: "a wrong answer",
  },
  glitch: {
    takes: kenney("interface-sounds", ...series("glitch_", 1, 4)),
    gain: 0.35,
    about: "a bug showing itself",
  },
  scratch: {
    takes: kenney("interface-sounds", ...series("scratch_", 1, 5)),
    gain: 0.4,
    about: "a strike-through",
  },
  rise: {
    takes: kenney("interface-sounds", ...series("maximize_", 1, 6)),
    gain: 0.35,
    about: "a panel or title arriving",
  },
  fall: {
    takes: kenney("interface-sounds", ...series("minimize_", 1, 6)),
    gain: 0.3,
    about: "a panel leaving, a chapter turning",
  },
  drop: {
    takes: kenney("interface-sounds", ...series("drop_", 1, 4)),
    gain: 0.35,
    about: "something settling into place",
  },
  pluck: {
    takes: kenney("interface-sounds", "pluck_001", "pluck_002"),
    gain: 0.35,
    about: "a soft highlight",
  },
  glass: {
    takes: kenney("interface-sounds", ...series("glass_", 1, 6)),
    gain: 0.3,
    about: "a bright accent",
  },
  // Foley (Kenney, RPG Audio)
  cloth: {
    takes: kenney("rpg-audio", "cloth1", "cloth2", "cloth3", "cloth4"),
    gain: 0.5,
    about: "fabric moving, soft transitions",
  },
  flip: {
    takes: kenney("rpg-audio", "bookFlip1", "bookFlip2", "bookFlip3"),
    gain: 0.45,
    about: "paper lifting",
  },
  place: {
    takes: kenney("rpg-audio", "bookPlace1", "bookPlace2", "bookPlace3"),
    gain: 0.45,
    about: "paper landing",
  },
  leather: {
    takes: kenney("rpg-audio", "dropLeather", "handleSmallLeather", "handleSmallLeather2"),
    gain: 0.45,
    about: "a garment landing",
  },
  latch: {
    takes: kenney("rpg-audio", "metalClick", "metalLatch").map((c) => ({ ...c, onset: 18 })),
    gain: 0.4,
    about: "a mechanical catch",
  },
  slice: { takes: kenney("rpg-audio", "knifeSlice", "knifeSlice2"), gain: 0.35, about: "a cut" },
  // Impacts (Kenney, Impact Sounds)
  thud: {
    takes: kenney("impact-sounds", ...series("impactSoft_heavy_", 0, 4)),
    gain: 0.6,
    about: "a heavy soft landing",
  },
  bump: {
    takes: kenney("impact-sounds", ...series("impactSoft_medium_", 0, 4)),
    gain: 0.45,
    about: "a small bounce",
  },
  wood: {
    takes: kenney("impact-sounds", ...series("impactWood_heavy_", 0, 4)),
    gain: 0.55,
    about: "a hard hit on the beat",
  },
  peg: {
    takes: kenney("impact-sounds", ...series("impactWood_light_", 0, 4)),
    gain: 0.3,
    about: "a light wooden tap",
  },
  plank: {
    takes: kenney("impact-sounds", ...series("impactPlank_medium_", 0, 4)),
    gain: 0.45,
    about: "a board set down",
  },
  bell: {
    takes: kenney("impact-sounds", ...series("impactBell_heavy_", 0, 4)),
    gain: 0.4,
    about: "a struck bell",
  },
  punch: {
    takes: kenney("impact-sounds", ...series("impactPunch_heavy_", 0, 4)),
    gain: 0.5,
    about: "a heavy slam",
  },
  // Game (Kenney, Sci-fi Sounds)
  laser: {
    takes: kenney("sci-fi-sounds", ...series("laserSmall_", 0, 4)),
    gain: 0.3,
    about: "a turret shot",
  },
  hit: {
    takes: kenney("sci-fi-sounds", ...series("impactMetal_", 0, 4)),
    gain: 0.35,
    about: "a shot landing",
  },
  boom: {
    takes: kenney("sci-fi-sounds", ...series("explosionCrunch_", 0, 4)),
    gain: 0.35,
    about: "a missile hit",
  },
  thruster: {
    takes: capped(1.1, kenney("sci-fi-sounds", ...series("thrusterFire_", 0, 4))),
    gain: 0.35,
    about: "a missile launch",
  },
  computer: {
    takes: capped(0.8, kenney("sci-fi-sounds", ...series("computerNoise_", 0, 3))),
    gain: 0.2,
    about: "a HUD changing",
  },
  // Recordings (Wikimedia Commons)
  chalk: {
    takes: windows(
      "264944_chalk-on-chalkboard.wav",
      [2.41, 0.42],
      [3.03, 0.42],
      [5.53, 0.42],
      [6.84, 0.42],
      [9.56, 0.42],
      [10.39, 0.4],
    ),
    gain: 0.6,
    about: "a chalk stroke as an equation term is written",
  },
  pencil: {
    takes: windows(
      "Pencil_scratchings.ogg",
      [17.12, 0.5],
      [20.3, 0.5],
      [21.88, 0.45],
      [27.38, 0.5],
      [30.57, 0.45],
      [35.56, 0.6],
    ),
    gain: 0.45,
    about: "a pencil line drawn on a graph or pattern",
  },
  sleigh: {
    takes: windows(
      "Sleigh_bells.wav",
      [0.56, 0.6],
      [1.16, 0.6],
      [2.36, 0.6],
      [2.95, 0.6],
      [3.85, 0.6],
      [6.56, 0.7],
    ),
    gain: 0.45,
    about: "a shake of small bells",
  },
  jingle: {
    takes: windows(
      "Soothing_jingling_little_bells_ambience.ogg",
      [1.34, 1.4],
      [20.58, 1.4],
      [23.93, 1.4],
      [42.33, 1.4],
    ),
    gain: 0.35,
    about: "a longer shimmer of bells",
  },
  sewing: {
    takes: windows("WWS_SewingMachine.ogg", [10.97, 1.3], [42.54, 1.3], [50.41, 1.3], [54.24, 1.3]),
    gain: 0.45,
    about: "a sewing machine running a seam",
  },
  typing: {
    takes: windows("Typing_-_Model_M_1986.ogg", [0.05, 2.6], [5.6, 2.6], [9.45, 2.4]),
    gain: 0.4,
    about: "keys under code being typed",
  },
  loom: {
    takes: windows("WWS_Narrowshuttleloom.ogg", [40, 5], [62, 5]),
    gain: 0.35,
    about: "a shuttle loom running",
  },
  clack: {
    takes: windows(
      "WWS_Narrowshuttleloom.ogg",
      [38.78, 0.45],
      [49.67, 0.45],
      [57.64, 0.45],
      [61.88, 0.45],
    ),
    gain: 0.4,
    about: "one beat of the loom",
  },
  engineStart: {
    takes: windows("WWS_FSRTarpan239Dvanstarting.ogg", [7.2, 4]),
    gain: 0.45,
    about: "an engine starting",
  },
  engine: {
    takes: windows("WWS_FSRTarpan239Dvandriving.ogg", [4, 11]),
    gain: 0.4,
    about: "a vehicle driving",
  },
};

const ff = (args: string[]) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args]);

/** Duration from the decoded samples, which is right even when a header isn't. */
const duration = (file: string) => {
  const r = spawnSync(
    "ffmpeg",
    [
      "-i",
      file,
      "-af",
      "astats=measure_overall=Number_of_samples:measure_perchannel=0",
      "-f",
      "null",
      "-",
    ],
    {
      encoding: "utf8",
    },
  );
  return Number(/Number of samples: (\d+)/.exec(r.stderr)?.[1] ?? 0) / 48000;
};

/** RMS peak and true peak of a file, in dBFS. */
const measure = (file: string) => {
  const r = spawnSync(
    "ffmpeg",
    [
      "-i",
      file,
      "-af",
      "astats=measure_overall=RMS_peak+Peak_level:measure_perchannel=0",
      "-f",
      "null",
      "-",
    ],
    {
      encoding: "utf8",
    },
  );
  const num = (key: string) =>
    Number(new RegExp(`${key}: (-?[\\d.]+|-inf)`).exec(r.stderr)?.[1] ?? "-inf");
  return { rmsPeak: num("RMS peak dB"), peak: num("Peak level dB") };
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) if (f.endsWith(".ogg")) rmSync(join(OUT, f));

const manifest: Record<string, { files: string[]; durations: number[]; gain: number }> = {};
for (const [slot, { takes, gain }] of Object.entries(SLOTS)) {
  manifest[slot] = { files: [], durations: [], gain };
  takes.forEach((cut, i) => {
    const raw = join(TMP, `${slot}-${i + 1}.wav`);
    const source = join(SRC, cut.src);
    const window = cut.start === undefined ? [] : ["-ss", String(cut.start), "-t", String(cut.dur)];
    // Whole files start where the sound does: the first moment within 30 dB of the
    // take's own peak, so room noise before a hit can't make it land late.
    const trim =
      cut.start === undefined
        ? `silenceremove=start_periods=1:start_threshold=${measure(source).peak - (cut.onset ?? 30)}dB,`
        : "";
    const cap = cut.max ? `atrim=end=${cut.max},` : "";
    ff([
      ...window,
      "-i",
      source,
      "-af",
      `${trim}${cap}aformat=sample_rates=48000:channel_layouts=mono,highpass=f=30`,
      raw,
    ]);
    const dur = duration(raw);
    const fadeOut = Math.min(0.08, dur * 0.3);
    const { rmsPeak, peak } = measure(raw);
    const gainDb = Math.min(-16 - rmsPeak, -1 - peak);
    const name = `${slot}-${i + 1}.ogg`;
    ff([
      "-i",
      raw,
      "-af",
      `afade=t=in:d=0.004,afade=t=out:st=${(dur - fadeOut).toFixed(3)}:d=${fadeOut.toFixed(3)},volume=${gainDb.toFixed(2)}dB`,
      "-c:a",
      "libvorbis",
      "-q:a",
      "5",
      join(OUT, name),
    ]);
    manifest[slot].files.push(`sfx/${name}`);
    manifest[slot].durations.push(Number(duration(join(OUT, name)).toFixed(3)));
  });
  console.log(`${slot.padEnd(12)} ${takes.length} takes`);
}
writeFileSync(
  join(ROOT, "src", "kit", "sfx-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
rmSync(TMP, { recursive: true, force: true });
