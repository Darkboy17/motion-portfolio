// Renders the pieces and makes every deliverable from each one:
//   out/master/<slug>.mp4     Remotion's H.264 master (CRF 18)
//   out/web/<slug>.mp4        loudness-normalised (-16 LUFS), smaller, faststart, for the web
//   out/poster/<slug>.jpg     a poster frame
//   out/captions/<slug>.vtt   WebVTT captions, for the explainers
//
//   npx tsx scripts/render.ts                 every piece
//   npx tsx scripts/render.ts quadratic arctan  just these
//   npx tsx scripts/render.ts --stills        one poster still per piece (a quick smoke test)
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cuesToVtt } from "../src/kit/cues";
import type { Cue } from "../src/kit/cues";
import { buildModel, quadraticDefaults } from "../src/videos/quadratic/model";
import { cues as quadraticCues, QUADRATIC_SECONDS } from "../src/videos/quadratic/timeline";
import { cues as derivativeCues, DERIVATIVE_SECONDS } from "../src/videos/derivative/timeline";
import { cues as arctanCues, ARCTAN_SECONDS } from "../src/videos/arctan/timeline";

type Piece = {
  slug: string;
  id: string;
  /** Seconds into the piece for the poster frame. */
  poster: number;
  captions?: { cues: Cue[]; end: number };
};

export const PIECES: Piece[] = [
  {
    slug: "quadratic",
    id: "Quadratic",
    poster: 62.6,
    captions: { cues: quadraticCues(buildModel(quadraticDefaults)), end: QUADRATIC_SECONDS },
  },
  {
    slug: "derivative",
    id: "Derivative",
    poster: 53.4,
    captions: { cues: derivativeCues, end: DERIVATIVE_SECONDS },
  },
  {
    slug: "arctan",
    id: "Arctan",
    poster: 41,
    captions: { cues: arctanCues(), end: ARCTAN_SECONDS },
  },
  { slug: "shirt-anatomy", id: "ShirtAnatomy", poster: 12 },
  { slug: "houndstooth", id: "Houndstooth", poster: 9 },
  { slug: "festive-drop", id: "FestiveDrop", poster: 6 },
];

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const FPS = 30;

const run = (cmd: string, args: string[]) => {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} exited with ${r.status}`);
};

const entry = (p: Piece) => `src/entries/${p.slug}.tsx`;

const renderPiece = (p: Piece) => {
  const master = join(OUT, "master", `${p.slug}.mp4`);
  const web = join(OUT, "web", `${p.slug}.mp4`);
  run("npx", ["remotion", "render", entry(p), p.id, master, "--log=error"]);
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    master,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "23",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-af",
    "loudnorm=I=-16:TP=-1.5:LRA=11",
    "-c:a",
    "aac",
    "-b:a",
    "160k",
    "-ar",
    "48000",
    web,
  ]);
  run("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-ss",
    String(p.poster),
    "-i",
    master,
    "-frames:v",
    "1",
    "-q:v",
    "3",
    join(OUT, "poster", `${p.slug}.jpg`),
  ]);
  if (p.captions)
    writeFileSync(
      join(OUT, "captions", `${p.slug}.vtt`),
      cuesToVtt(p.captions.cues, p.captions.end),
    );
};

const still = (p: Piece) =>
  run("npx", [
    "remotion",
    "still",
    entry(p),
    p.id,
    join(OUT, "stills", `${p.slug}.png`),
    `--frame=${Math.round(p.poster * FPS)}`,
    "--log=error",
  ]);

const args = process.argv.slice(2);
const stillsOnly = args.includes("--stills");
const wanted = args.filter((a) => !a.startsWith("--"));
const pieces = wanted.length ? PIECES.filter((p) => wanted.includes(p.slug)) : PIECES;
if (wanted.length && pieces.length !== wanted.length) {
  throw new Error(`Unknown piece. Choose from: ${PIECES.map((p) => p.slug).join(", ")}`);
}

for (const dir of ["master", "web", "poster", "captions", "stills"])
  mkdirSync(join(OUT, dir), { recursive: true });
for (const p of pieces) (stillsOnly ? still : renderPiece)(p);
console.log(`\nDone: ${pieces.map((p) => p.slug).join(", ")}`);
