// Beat sheet for "Pattern study: Houndstooth", in seconds. The bed runs at
// 120 BPM, so a beat is 0.5 s: every scene change and colour cut lands on one.
// The camera and the crop are tracks over the same timeline.
import { ease, palettes } from "../../kit/theme";
import { frameBox, mixBox, mixCam, track } from "./camera";
import type { Box, Cam } from "./camera";
import { REPEAT } from "./weave";

const c = palettes.atelier;

export const SIZE = 1080;
export const BEAT = 0.5;

export const T = {
  // 1. Title: kicker, title, and the first dark cell lands on beat 3.
  kicker: 0.15,
  title: 0.3,
  drop: 1.3,
  land: 1.5,
  // 2. The repeat: point paper draws on, cells fill in a diagonal sweep.
  grid: 2.0,
  fill: 2.75,
  fillEnd: 4.25,
  repeat: 4.5,
  mastheadOut: 5.5,
  labelsOut: 5.75,
  // 3. Step and repeat: 3 x 3, 5 x 5, then the full 7 x 7 field, and a hold.
  tile3: 6.0,
  tile5: 7.0,
  field: 8.0,
  // 4. How it's woven: crop to 16 x 16, warp, weft, twill, relax.
  weave: 10.0,
  heading: 10.75,
  warp: 10.75,
  weft: 11.5,
  twill: 13.0,
  relax: 14.0,
  relaxEnd: 14.75,
  moral: 14.5,
  weaveOut: 15.75,
  // 5. Colourways, one per two beats.
  colour: 16.0,
  ways: [16.5, 17.5, 18.5, 19.5],
  colourOut: 20.5,
  // 6. End card, then a fade back to the opening frame.
  end: 21.0,
  // The crop only clears the masthead's corner at about 21.85 s.
  endTitle: 21.9,
  fadeOut: 23.2,
  total: 24,
} as const;

/** The build fills one anti-diagonal of the repeat at a time. */
const DIAGONALS = 2 * REPEAT - 1;
export const fillAt = (diag: number) => T.fill + (diag * (T.fillEnd - T.fill)) / (DIAGONALS - 1);

/** Threads: each warp end drops in turn, then each weft pick shoots across. */
export const weave = {
  size: 16,
  warpAt: (col: number) => T.warp + col * 0.035,
  warpDur: 0.55,
  weftAt: (row: number) => T.weft + row * 0.095,
  weftDur: 0.42,
  /** Thread width as a share of a cell, before the threads relax flat. */
  width: 0.76,
};

/** Tile rings for the step and repeat. Ring 0 is the original repeat. */
export const ringAt = [T.tile3, T.tile3, T.tile5, T.field, T.field + 0.15, T.field + 0.25];
export const RING_STEP = [0, 0.035, 0.02, 0.01, 0.006, 0.004];
export const RING_DUR = 0.55;

// Framings, as world boxes (cells) placed on screen boxes (pixels).
export const TILE: Box = { x: 0, y: 0, w: REPEAT, h: REPEAT };
export const WEAVE_BOX: Box = { x: 0, y: 0, w: weave.size, h: weave.size };
/** Where the repeat sits on the title and end cards. */
export const PLATE: Box = { x: 300, y: 360, w: 480, h: 480 };
/** Where the 16 x 16 thread diagram sits, leaving room for the draft labels. */
export const WEAVE_PLATE: Box = { x: 316, y: 262, w: 672, h: 672 };
/** Everything the field ever needs to cover, with room to spare. */
export const FULL: Box = { x: -40, y: -40, w: 88, h: 88 };

const around = (n: number): Box => ({
  x: -REPEAT * ((n - 1) / 2),
  y: -REPEAT * ((n - 1) / 2),
  w: REPEAT * n,
  h: REPEAT * n,
});

export const shots = {
  plate: frameBox(TILE, PLATE, SIZE),
  tile3: frameBox(around(3), { x: 60, y: 60, w: 960, h: 960 }, SIZE),
  tile5: frameBox(around(5), { x: 0, y: 0, w: SIZE, h: SIZE }, SIZE),
  field: frameBox(around(7), { x: 0, y: 0, w: SIZE, h: SIZE }, SIZE),
  weave: frameBox(WEAVE_BOX, WEAVE_PLATE, SIZE),
} satisfies Record<string, Cam>;

export const camera = track<Cam>(
  shots.plate,
  [
    { at: T.tile3, dur: 0.75, value: shots.tile3 },
    { at: T.tile5, dur: 0.75, value: shots.tile5 },
    { at: T.field, dur: 0.9, value: shots.field },
    { at: T.weave, dur: 1.0, value: shots.weave },
    { at: T.colour, dur: 0.9, value: shots.field },
    { at: T.end, dur: 1.1, value: shots.plate },
  ],
  mixCam,
  ease.inOut,
);

/** The crop: the part of the world the flat pattern is allowed to cover. */
export const region = track<Box>(
  TILE,
  [
    { at: T.tile3, dur: 0, value: FULL },
    { at: T.weave, dur: 1.0, value: WEAVE_BOX },
    { at: T.colour, dur: 0.9, value: FULL },
    { at: T.end, dur: 1.1, value: TILE },
  ],
  mixBox,
  ease.inOut,
);

export type Colourway = { name: string; pair: string; dark: string; light: string };

export const COLOURWAYS: Colourway[] = [
  { name: "Classic", pair: "Ink on chalk", dark: c.ink, light: c.chalk },
  { name: "Oxblood", pair: "Oxblood on sand", dark: c.hero, light: c.sand },
  { name: "Indigo", pair: "Indigo on chambray", dark: c.indigo, light: c.chambray },
  { name: "Sage", pair: "Sage on chalk", dark: c.sage, light: c.chalk },
];

/** Colour cuts: the field sweeps to colourway `to` at `at`. The last one returns home. */
export const SWEEPS = [
  { at: T.ways[1], to: 1 },
  { at: T.ways[2], to: 2 },
  { at: T.ways[3], to: 3 },
  { at: T.end, to: 0 },
];
export const SWEEP_DUR = 0.45;
