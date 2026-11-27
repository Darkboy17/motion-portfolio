// Builds the portfolio page into site/dist: fills in site.config.json, adds
// each piece's length and script, and copies the web encodes and posters.
// Run `npm run render` and `npm run showreel` first.
//   npx tsx scripts/build-site.ts
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { resolveCues } from "../src/kit/cues";
import { PIECES } from "./pieces";

const ROOT = join(import.meta.dirname, "..");
const SITE = join(ROOT, "site");
const DIST = join(SITE, "dist");
const OUT = join(ROOT, "out");

type Config = { name: string; email: string; github: string; repo: string };
const configPath = join(SITE, "site.config.json");
if (!existsSync(configPath))
  throw new Error("Missing site/site.config.json (copy site/site.config.example.json).");
const config = JSON.parse(readFileSync(configPath, "utf8")) as Config;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const label = (url: string) => url.replace(/^https?:\/\//, "");

const duration = (file: string) => {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  );
  const s = Math.round(parseFloat(r.stdout));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

mkdirSync(join(DIST, "media"), { recursive: true });
let html = readFileSync(join(SITE, "index.html"), "utf8")
  .replaceAll("{{NAME}}", escape(config.name))
  .replaceAll("{{EMAIL}}", escape(config.email))
  .replaceAll("{{GITHUB_LABEL}}", escape(label(config.github)))
  .replaceAll("{{GITHUB}}", escape(config.github))
  .replaceAll("{{REPO_LABEL}}", escape(label(config.repo)))
  .replaceAll("{{REPO}}", escape(config.repo));

for (const p of PIECES) {
  const web = join(OUT, "web", `${p.slug}.mp4`);
  const poster = join(OUT, "poster", `${p.slug}.jpg`);
  if (!existsSync(web) || !existsSync(poster))
    throw new Error(`Render ${p.slug} first: npm run render -- ${p.slug}`);
  copyFileSync(web, join(DIST, "media", `${p.slug}.mp4`));
  copyFileSync(poster, join(DIST, "media", `${p.slug}.jpg`));
  html = html.replaceAll(`{{DURATION:${p.slug}}}`, duration(web));
  if (p.captions) {
    const script = resolveCues(p.captions.cues, p.captions.end)
      .map((c) => `<p>${escape(c.text.replace(/\*/g, ""))}</p>`)
      .join("\n              ");
    html = html.replaceAll(`{{TRANSCRIPT:${p.slug}}}`, script);
  }
}

for (const f of ["showreel.mp4", "showreel.jpg"]) {
  if (!existsSync(join(OUT, f))) throw new Error(`Missing out/${f}: run npm run showreel`);
  copyFileSync(join(OUT, f), join(DIST, "media", f));
}

const leftover = html.match(/{{[^}]+}}/g);
if (leftover) throw new Error(`Unfilled placeholders: ${[...new Set(leftover)].join(", ")}`);
writeFileSync(join(DIST, "index.html"), html);
copyFileSync(join(SITE, "style.css"), join(DIST, "style.css"));
console.log(`Built ${join(DIST, "index.html")}`);
