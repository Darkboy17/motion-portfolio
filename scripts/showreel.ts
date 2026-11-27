// Cuts a silent 16:9 showreel from the rendered masters: one clip per piece,
// cross-faded. Square and vertical pieces sit centred on their own paper colour.
//   npx tsx scripts/showreel.ts    (after npm run render)
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const FADE = 0.4;

type Clip = { slug: string; start: number; dur: number; pad: string };
const LAB = "0xFAFBF9";
const ATELIER = "0xF3EDE4";

export const CLIPS: Clip[] = [
  { slug: "arctan", start: 0.9, dur: 3.4, pad: LAB },
  { slug: "shirt-anatomy", start: 7.5, dur: 3.2, pad: ATELIER },
  { slug: "quadratic", start: 58.8, dur: 3.6, pad: LAB },
  { slug: "houndstooth", start: 11, dur: 3.2, pad: ATELIER },
  { slug: "derivative", start: 48.8, dur: 3.6, pad: LAB },
  { slug: "festive-drop", start: 5, dur: 3.2, pad: ATELIER },
];

const inputs = CLIPS.flatMap((c) => ["-ss", String(c.start), "-t", String(c.dur), "-i", join(OUT, "master", `${c.slug}.mp4`)]);

const prep = CLIPS.map(
  (c, i) =>
    `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=${c.pad},setsar=1,fps=30,format=yuv420p,settb=AVTB[v${i}]`,
);

// Chain the cross-fades: each one starts FADE seconds before the running total ends.
const fades: string[] = [];
let total = CLIPS[0].dur;
let last = "v0";
CLIPS.slice(1).forEach((c, k) => {
  const i = k + 1;
  const out = i === CLIPS.length - 1 ? "reel" : `x${i}`;
  fades.push(`[${last}][v${i}]xfade=transition=fade:duration=${FADE}:offset=${(total - FADE).toFixed(3)}[${out}]`);
  total += c.dur - FADE;
  last = out;
});

const args = [
  "-y",
  "-v",
  "error",
  ...inputs,
  "-filter_complex",
  [...prep, ...fades].join(";"),
  "-map",
  "[reel]",
  "-an",
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  "22",
  "-pix_fmt",
  "yuv420p",
  "-movflags",
  "+faststart",
  join(OUT, "showreel.mp4"),
];
const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
if (r.status !== 0) throw new Error("ffmpeg failed");
spawnSync("ffmpeg", ["-y", "-v", "error", "-ss", "0.5", "-i", join(OUT, "showreel.mp4"), "-frames:v", "1", "-q:v", "3", join(OUT, "showreel.jpg")], {
  stdio: "inherit",
});
console.log(`out/showreel.mp4  ${total.toFixed(1)} s`);
