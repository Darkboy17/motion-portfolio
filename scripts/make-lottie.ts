// Authors the Lottie animations in public/lottie as Bodymovin JSON.
// Black ([0,0,0]) is the "key" colour: LottieClip's `tint` replaces it with a
// theme colour, and any other colour is left alone.
//   npx tsx scripts/make-lottie.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(import.meta.dirname, "..", "public", "lottie");
const KEY = [0, 0, 0, 1];
const PAPER = [1, 1, 1, 1];

type Key = { t: number; s: number[] };
const EASE_OUT = { i: { x: [0.16], y: [1] }, o: { x: [0.3], y: [0] } };
const EASE_IN_OUT = { i: { x: [0.35], y: [1] }, o: { x: [0.65], y: [0] } };

const still = (k: unknown) => ({ a: 0, k });
const anim = (keys: Key[], ease = EASE_OUT) => ({
  a: 1,
  k: keys.map((key, n) => (n < keys.length - 1 ? { ...key, ...ease } : { t: key.t, s: key.s })),
});

const transform = (o: Partial<Record<"p" | "a" | "s" | "r" | "o", unknown>> = {}) => ({
  ty: "tr",
  p: o.p ?? still([0, 0]),
  a: o.a ?? still([0, 0]),
  s: o.s ?? still([100, 100]),
  r: o.r ?? still(0),
  o: o.o ?? still(100),
  sk: still(0),
  sa: still(0),
});

const group = (name: string, items: unknown[], tr = transform()) => ({
  ty: "gr",
  nm: name,
  it: [...items, tr],
});
const stroke = (w: unknown, c = KEY, o: unknown = still(100)) => ({
  ty: "st",
  c: still(c),
  o,
  w,
  lc: 2,
  lj: 2,
  ml: 4,
});
const fill = (c = KEY, o: unknown = still(100)) => ({ ty: "fl", c: still(c), o, r: 1 });
const trim = (s: unknown, e: unknown) => ({ ty: "tm", s, e, o: still(0), m: 1 });
const ellipse = (size: unknown, p = still([0, 0])) => ({ ty: "el", p, s: size, d: 1 });
const path = (v: number[][], closed = false, i?: number[][], o?: number[][]) => ({
  ty: "sh",
  ks: still({ v, i: i ?? v.map(() => [0, 0]), o: o ?? v.map(() => [0, 0]), c: closed }),
});

const layer = (
  ind: number,
  name: string,
  shapes: unknown[],
  op: number,
  ks: Record<string, unknown> = {},
) => ({
  ddd: 0,
  ind,
  ty: 4,
  nm: name,
  sr: 1,
  ao: 0,
  ip: 0,
  op,
  st: 0,
  bm: 0,
  ks: {
    o: ks.o ?? still(100),
    r: ks.r ?? still(0),
    p: ks.p ?? still([0, 0, 0]),
    a: ks.a ?? still([0, 0, 0]),
    s: ks.s ?? still([100, 100, 100]),
  },
  shapes,
});

const doc = (name: string, size: number, op: number, layers: unknown[]) => ({
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op,
  w: size,
  h: size,
  nm: name,
  ddd: 0,
  assets: [],
  layers,
});

/** Hit spark: eight rays shoot out, a ring expands, a core pops. 20 frames. */
const burst = () => {
  const c = 200;
  const rays = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const p0 = [Math.cos(a) * 46, Math.sin(a) * 46];
    const p1 = [Math.cos(a) * 150, Math.sin(a) * 150];
    return group(`ray${k}`, [
      path([p0, p1]),
      trim(
        anim([
          { t: 3, s: [0] },
          { t: 15, s: [100] },
        ]),
        anim([
          { t: 0, s: [0] },
          { t: 9, s: [100] },
        ]),
      ),
      stroke(still(k % 2 ? 9 : 13)),
    ]);
  });
  const ring = group("ring", [
    ellipse(
      anim([
        { t: 0, s: [20, 20] },
        { t: 16, s: [300, 300] },
      ]),
    ),
    stroke(
      anim([
        { t: 0, s: [16] },
        { t: 16, s: [0] },
      ]),
    ),
  ]);
  const core = group("core", [
    ellipse(
      anim([
        { t: 0, s: [0, 0] },
        { t: 4, s: [70, 70] },
        { t: 12, s: [0, 0] },
      ]),
    ),
    fill(),
  ]);
  return doc("burst", 400, 20, [
    layer(1, "burst", [...rays, ring, core], 20, { p: still([c, c, 0]) }),
  ]);
};

/** Tick in a circle: the circle draws, then the tick, with a small overshoot. 30 frames. */
const check = () => {
  const circle = group("circle", [
    ellipse(still([300, 300])),
    trim(
      still(0),
      anim(
        [
          { t: 0, s: [0] },
          { t: 14, s: [100] },
        ],
        EASE_IN_OUT,
      ),
    ),
    stroke(still(22)),
  ]);
  const tick = group("tick", [
    path([
      [-62, 4],
      [-18, 48],
      [70, -48],
    ]),
    trim(
      still(0),
      anim(
        [
          { t: 10, s: [0] },
          { t: 22, s: [100] },
        ],
        EASE_IN_OUT,
      ),
    ),
    stroke(still(26)),
  ]);
  return doc("check", 400, 30, [
    layer(1, "check", [circle, tick], 30, {
      p: still([200, 200, 0]),
      s: anim([
        { t: 0, s: [80, 80, 100] },
        { t: 16, s: [106, 106, 100] },
        { t: 26, s: [100, 100, 100] },
      ]),
    }),
  ]);
};

/** Three four-point stars that twinkle in turn. Loops cleanly over 48 frames. */
const sparkle = () => {
  const star = (r: number) => {
    const v = [
      [0, -r],
      [r, 0],
      [0, r],
      [-r, 0],
    ];
    const k = r * 0.62;
    const t = [
      [0, k],
      [-k, 0],
      [0, -k],
      [k, 0],
    ];
    return path(v, true, t, t);
  };
  const stars = [
    { p: [200, 170], r: 70, d: 0 },
    { p: [300, 270], r: 38, d: 16 },
    { p: [110, 290], r: 30, d: 26 },
  ].map(({ p, r, d }, n) => {
    const keys: Key[] = [{ t: 0, s: [0, 0, 100] }];
    if (d > 0) keys.push({ t: d, s: [0, 0, 100] });
    keys.push({ t: d + 10, s: [100, 100, 100] }, { t: d + 22, s: [0, 0, 100] });
    if (d + 22 < 48) keys.push({ t: 48, s: [0, 0, 100] });
    return layer(n + 1, `star${n}`, [group("star", [star(r), fill()])], 48, {
      p: still([p[0], p[1], 0]),
      r: anim(
        [
          { t: 0, s: [0] },
          { t: 48, s: [90] },
        ],
        EASE_IN_OUT,
      ),
      s: anim(keys, EASE_IN_OUT),
    });
  });
  return doc("sparkle", 400, 48, stars);
};

/** A swing tag on a string, settling with a damped swing. 60 frames. */
const tag = () => {
  const body = group("tag", [
    path(
      [
        [0, 120],
        [62, 160],
        [62, 330],
        [-62, 330],
        [-62, 160],
      ],
      true,
    ),
    fill(),
  ]);
  const hole = group("hole", [ellipse(still([26, 26]), still([0, 168])), fill(PAPER)]);
  const lines = group("lines", [
    path([
      [-34, 236],
      [34, 236],
    ]),
    path([
      [-34, 262],
      [20, 262],
    ]),
    path([
      [-34, 288],
      [28, 288],
    ]),
    stroke(still(8), PAPER, still(70)),
  ]);
  const string = group("string", [
    path([
      [0, 0],
      [0, 168],
    ]),
    stroke(still(5)),
  ]);
  const swing = [-22, 15, -9, 5, -2.5, 1, 0];
  return doc("tag", 400, 60, [
    layer(1, "tag", [hole, lines, body, string], 60, {
      p: still([200, 40, 0]),
      r: anim(
        swing.map((s, k) => ({ t: k * 8, s: [s] })),
        EASE_IN_OUT,
      ),
    }),
  ]);
};

mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries({ burst, check, sparkle, tag })) {
  writeFileSync(join(OUT, `${name}.json`), JSON.stringify(make()));
  console.log(`lottie/${name}.json`);
}
