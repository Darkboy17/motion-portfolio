// Renders the pieces and makes every deliverable from each one:
//   out/master/<slug>.mp4     Remotion's H.264 master (CRF 18)
//   out/web/<slug>.mp4        loudness-normalised (-16 LUFS), smaller, faststart, for the web
//   out/poster/<slug>.jpg     a poster frame
//   out/captions/<slug>.vtt   WebVTT captions, for the explainers
//
//   npx tsx scripts/render.ts                 every piece
//   npx tsx scripts/render.ts quadratic arctan  just these
//   npx tsx scripts/render.ts --stills        one poster still per piece (a quick smoke test)
//   npx tsx scripts/render.ts --changed       only pieces whose inputs changed since their last render
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cuesToVtt } from "../src/kit/cues";
import { PIECES } from "./pieces";
import type { Piece } from "./pieces";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "out");
const FPS = 30;

const run = (cmd: string, args: string[]) => {
  console.log(`\n$ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, { cwd: ROOT, stdio: "inherit" });
  if (r.status !== 0) throw new Error(`${cmd} exited with ${r.status}`);
};

const entry = (p: Piece) => `src/entries/${p.slug}.tsx`;

/** Everything a render reads besides the piece's own folder and entry. */
const SHARED_INPUTS = [
  "src/kit",
  "public",
  "package-lock.json",
  "remotion.config.ts",
  "scripts/render.ts",
];

const filesUnder = (path: string): string[] => {
  const abs = join(ROOT, path);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return /\.(test\.ts|md)$/.test(path) ? [] : [path];
  return readdirSync(abs).flatMap((name) => filesUnder(join(path, name)));
};

/** A hash of every file that can change a piece's output, plus its settings. */
const inputsHash = (p: Piece) => {
  const h = createHash("sha256");
  h.update(JSON.stringify({ id: p.id, poster: p.poster }));
  const files = [...SHARED_INPUTS, `src/videos/${p.dir ?? p.slug}`, entry(p)]
    .flatMap(filesUnder)
    .sort();
  for (const f of files) h.update(f).update(readFileSync(join(ROOT, f)));
  return h.digest("hex");
};

const HASHES = join(OUT, "hashes.json");
const readHashes = (): Record<string, string> =>
  existsSync(HASHES) ? JSON.parse(readFileSync(HASHES, "utf8")) : {};

const outputs = (p: Piece) => [
  join(OUT, "master", `${p.slug}.mp4`),
  join(OUT, "web", `${p.slug}.mp4`),
  join(OUT, "poster", `${p.slug}.jpg`),
  ...(p.captions ? [join(OUT, "captions", `${p.slug}.vtt`)] : []),
];

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
const changedOnly = args.includes("--changed");
const wanted = args.filter((a) => !a.startsWith("--"));
const pieces = wanted.length ? PIECES.filter((p) => wanted.includes(p.slug)) : PIECES;
if (wanted.length && pieces.length !== wanted.length) {
  throw new Error(`Unknown piece. Choose from: ${PIECES.map((p) => p.slug).join(", ")}`);
}

for (const dir of ["master", "web", "poster", "captions", "stills"])
  mkdirSync(join(OUT, dir), { recursive: true });
if (stillsOnly) {
  for (const p of pieces) still(p);
} else {
  const hashes = readHashes();
  for (const p of pieces) {
    const hash = inputsHash(p);
    if (changedOnly && hashes[p.slug] === hash && outputs(p).every((f) => existsSync(f))) {
      console.log(`${p.slug}: unchanged, kept`);
      continue;
    }
    renderPiece(p);
    hashes[p.slug] = hash;
    writeFileSync(HASHES, JSON.stringify(hashes, null, 2) + "\n");
  }
}
console.log(`\nDone: ${pieces.map((p) => p.slug).join(", ")}`);
