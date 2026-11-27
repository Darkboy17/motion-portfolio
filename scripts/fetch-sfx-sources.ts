// Downloads the recordings the sound library is cut from into sfx-sources/
// (gitignored). Only needed to rebuild public/sfx with prepare-sfx.ts.
//   npx tsx scripts/fetch-sfx-sources.ts
//
// - Kenney's Impact, Interface, RPG and Sci-fi sound packs (CC0), through the same
//   signed-link flow as the "Continue without donating" button on kenney.nl.
// - Field recordings from Wikimedia Commons (CC0, public domain or CC BY 4.0), with
//   each file's licence and author saved to sfx-sources/commons/sources.json.
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "sfx-sources");
const UA = "motion-portfolio/1.0 (https://github.com/Darkboy17/motion-portfolio)";

export const KENNEY_PACKS = ["impact-sounds", "interface-sounds", "rpg-audio", "sci-fi-sounds"];

export const COMMONS_FILES = [
  "264944 chalk-on-chalkboard.wav",
  "Pencil scratchings.ogg",
  "Sleigh bells.wav",
  "Soothing jingling little bells ambience.ogg",
  "Typing - Model M 1986.ogg",
  "WWS SewingMachine.ogg",
  "WWS Narrowshuttleloom.ogg",
  "WWS FSRTarpan239Dvanstarting.ogg",
  "WWS FSRTarpan239Dvandriving.ogg",
];

const curl = (args: string[]) =>
  execFileSync("curl", ["-sS", "-L", "-A", UA, ...args], { maxBuffer: 1 << 30 });

const fetchKenney = (pack: string) => {
  const dir = join(ROOT, "kenney", pack);
  const jar = join(ROOT, "kenney", ".cookies");
  mkdirSync(dir, { recursive: true });
  const page = `https://kenney.nl/assets/${pack}`;
  curl(["-c", jar, "-b", jar, "-o", "/dev/null", page]);
  const id = Buffer.from(`assets/${pack}`).toString("hex");
  const { url } = JSON.parse(
    curl([
      "-c",
      jar,
      "-b",
      jar,
      "-H",
      `Referer: ${page}`,
      `https://kenney.nl/download-link/${id}`,
    ]).toString(),
  );
  const zip = join(dir, `${pack}.zip`);
  curl(["-c", jar, "-b", jar, "-H", `Referer: ${page}`, "-o", zip, url]);
  execFileSync("unzip", ["-o", "-q", zip, "-d", dir]);
  rmSync(zip);
  console.log(`kenney/${pack}`);
};

const fetchCommons = async () => {
  const dir = join(ROOT, "commons");
  mkdirSync(dir, { recursive: true });
  const titles = COMMONS_FILES.map((f) => `File:${f}`).join("|");
  const api = `https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&format=json&titles=${encodeURIComponent(titles)}`;
  const pages = Object.values(JSON.parse(curl([api]).toString()).query.pages) as {
    title: string;
    imageinfo: {
      url: string;
      descriptionurl: string;
      extmetadata: Record<string, { value: string }>;
    }[];
  }[];
  const sources: Record<string, unknown> = {};
  for (const p of pages) {
    const info = p.imageinfo[0];
    const name = p.title.slice(5).replace(/[^A-Za-z0-9._-]+/g, "_");
    curl(["-o", join(dir, name), info.url]);
    sources[name] = {
      title: p.title,
      page: info.descriptionurl,
      license: info.extmetadata.LicenseShortName?.value,
      author: (info.extmetadata.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim(),
    };
    console.log(`commons/${name}`);
  }
  writeFileSync(join(dir, "sources.json"), JSON.stringify(sources, null, 2) + "\n");
};

for (const pack of KENNEY_PACKS) fetchKenney(pack);
await fetchCommons();
