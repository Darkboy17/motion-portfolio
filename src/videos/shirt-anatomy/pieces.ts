// The shirt as data: eleven pattern pieces, each with an outline, where it
// sits in the flat drawing (its pose), the true pattern shape it unfolds into
// on the sheet, its stitching, buttons and pattern marks. Everything is
// authored in shirt units (8 to the cm, origin at the centre front, level with
// the high point of the shoulder) and converted to each piece's local frame.
import {
  C,
  L,
  bbox,
  insetEdge,
  mapPath,
  matchedPolygons,
  mirrorX,
  offsetPolygon,
  path,
  pathD,
  polyD,
  pt,
  toLocal,
  toPolygon,
  trimPolyline,
} from "./geometry";
import type { Box, Path, Pose, Pt } from "./geometry";
import type { LabelSize } from "./marks";
import type { StepId } from "./timeline";

export type PieceId =
  | "back"
  | "yoke"
  | "frontL"
  | "frontR"
  | "pocket"
  | "sleeveL"
  | "sleeveR"
  | "cuffL"
  | "cuffR"
  | "stand"
  | "collar";

/** Key measurements. Everything else is drawn relative to these. */
const NECK = 62; // half the neck width at the shoulder line
const SHOULDER = pt(182, 34);
const UNDERARM = pt(216, 206); // 54 cm chest
const HEM_SIDE = pt(212, 546);
const HEM = 608; // 76 cm from the high point of the shoulder
const PLACKET = 14; // half the placket width
const ARM = 34; // how far the sleeves hang out from vertical, degrees
const SLEEVE = 456; // 57 cm, shoulder point to cuff seam
const WRIST = 100; // half the cuff, as it shows in the flat
const CUFF = 50; // cuff depth
export const SEAM_ALLOWANCE = 8; // 1 cm

// Shared seam lines, so neighbouring pieces meet exactly.
const neckRight = C(24, 58, 56, 38, NECK, 0); // from (0, 58)
const armholeDown = C(175, 96, 184, 198, UNDERARM.x, UNDERARM.y); // from the shoulder point
const armholeUp = C(184, 198, 175, 96, SHOULDER.x, SHOULDER.y); // from the underarm
const sideDown = C(215, 320, 210, 440, HEM_SIDE.x, HEM_SIDE.y);
const hemTo = (x: number) => C(204, 598, 110, HEM, x, HEM);

/** A point in the right sleeve's frame: u across the arm (outwards), v down it from the shoulder point. */
const rad = (ARM * Math.PI) / 180;
const arm = (u: number, v: number) =>
  pt(
    SHOULDER.x + u * Math.cos(rad) + v * Math.sin(rad),
    SHOULDER.y - u * Math.sin(rad) + v * Math.cos(rad),
  );
const armPose = (u: number, v: number): Pose => ({ ...arm(u, v), rotate: -ARM });

type Mark = { seg: number; t: number; count?: number };

/** How a piece is authored. Shirt coordinates unless noted. */
type Spec = {
  id: PieceId;
  no: string;
  name: string;
  cut: string;
  /** Stacking order in the flat: low is behind. */
  z: number;
  /** Behind the fronts until the explode. */
  hidden?: boolean;
  flat: Path;
  /** Local frame in the flat. Defaults to the centre of the flat outline. */
  pose?: Pose;
  /** The true pattern shape, in local coordinates, when it differs from the flat. */
  pattern?: Path;
  /** Segment groups that correspond between flat and pattern, for the morph. */
  groups?: [number[], number[]];
  /** Lines drawn inside the piece. `flat` ones only show while the piece sits in the shirt. */
  details?: {
    p: Path;
    closed?: boolean;
    phase: "flat" | "always";
    kind?: "line" | "shade" | "tag";
  }[];
  stitches?: { pts: Pt[]; step: StepId; closed?: boolean }[];
  buttons?: Pt[];
  /** Pattern marks, on the pattern outline (local). */
  notches?: Mark[];
  /**
   * Grain line, as an offset from the pattern's centre (local), its length and
   * direction. The piece's label is printed in a break at its middle.
   */
  grain: { x?: number; y?: number; len: number; dir: "v" | "h" };
  label?: LabelSize;
  /** Drill holes (shirt coordinates, like the pocket corners on the front). */
  drills?: Pt[];
  /** Line-art timing, seconds from the start of the draw. */
  draw: { at: number; dur: number };
  /** Seconds after the explode starts. */
  explodeDelay: number;
  step: StepId;
};

export type Piece = {
  id: PieceId;
  no: string;
  name: string;
  cut: string;
  z: number;
  hidden: boolean;
  pose: Pose;
  morphs: boolean;
  /** Crisp outline for pieces that keep their shape. */
  flatD: string;
  /**
   * The cloth is laid in shirt space, not piece space, so stripes and checks
   * match across the placket, pocket and collar. Fills are drawn shifted by
   * this offset, inside a group that shifts them back.
   */
  fillShift: Pt;
  flatFillD: string;
  /** Matched polygons for pieces that unfold. */
  flatPoly: Pt[];
  patternPoly: Pt[];
  pattern: Path;
  box: Box;
  seamAllowanceD: string;
  details: { d: string; phase: "flat" | "always"; kind: "line" | "shade" | "tag" }[];
  stitches: { d: string; step: StepId; length: number }[];
  buttons: Pt[];
  notches: Mark[];
  grain: { from: Pt; to: Pt };
  label: { at: Pt; size: LabelSize };
  drills: Pt[];
  draw: { at: number; dur: number };
  explodeDelay: number;
  step: StepId;
};

const polyLen = (pts: Pt[]) =>
  pts.slice(1).reduce((acc, p, i) => acc + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

const build = (s: Spec): Piece => {
  const flatBox = bbox(toPolygon(s.flat));
  const pose = s.pose ?? { x: flatBox.cx, y: flatBox.cy, rotate: 0 };
  const local = toLocal(pose);
  const flat = mapPath(s.flat, local);
  const pattern = s.pattern ?? flat;
  const morphs = Boolean(s.pattern);
  const [flatPoly, patternPoly] = morphs
    ? matchedPolygons(flat, pattern, s.groups?.[0], s.groups?.[1])
    : [[], []];
  const patternPts = toPolygon(pattern, 2);
  const box = bbox(patternPts);
  const g = s.grain;
  const gc = pt(box.cx + (g.x ?? 0), box.cy + (g.y ?? 0));
  const half = g.len / 2;
  return {
    id: s.id,
    no: s.no,
    name: s.name,
    cut: s.cut,
    z: s.z,
    hidden: Boolean(s.hidden),
    pose,
    morphs,
    flatD: pathD(flat),
    fillShift: pt(pose.x, pose.y),
    flatFillD: pathD(mapPath(flat, (q) => pt(q.x + pose.x, q.y + pose.y))),
    flatPoly,
    patternPoly,
    pattern,
    box,
    seamAllowanceD: polyD(offsetPolygon(patternPts, SEAM_ALLOWANCE)),
    details: (s.details ?? []).map((d) => ({
      d: pathD(mapPath(d.p, local), d.closed ?? false),
      phase: d.phase,
      kind: d.kind ?? "line",
    })),
    stitches: (s.stitches ?? []).map((st) => {
      const pts = st.pts.map(local);
      return { d: polyD(pts, st.closed ?? false), step: st.step, length: polyLen(pts) };
    }),
    buttons: (s.buttons ?? []).map(local),
    notches: s.notches ?? [],
    grain: {
      from: g.dir === "v" ? pt(gc.x, gc.y - half) : pt(gc.x - half, gc.y),
      to: g.dir === "v" ? pt(gc.x, gc.y + half) : pt(gc.x + half, gc.y),
    },
    label: { at: gc, size: s.label ?? "big" },
    drills: (s.drills ?? []).map(local),
    draw: s.draw,
    explodeDelay: s.explodeDelay,
    step: s.step,
  };
};

/** The left-hand twin of a right-hand piece, mirrored about the centre front. */
const mirror = (s: Spec, over: Partial<Spec>): Spec => {
  const pose = s.pose ? { x: -s.pose.x, y: s.pose.y, rotate: -s.pose.rotate } : undefined;
  return {
    ...s,
    flat: mapPath(s.flat, mirrorX),
    pose,
    pattern: s.pattern ? mapPath(s.pattern, mirrorX) : undefined,
    details: s.details?.map((d) => ({ ...d, p: mapPath(d.p, mirrorX) })),
    stitches: s.stitches?.map((st) => ({ ...st, pts: st.pts.map(mirrorX) })),
    buttons: s.buttons?.map(mirrorX),
    drills: s.drills?.map(mirrorX),
    grain: { ...s.grain, x: s.grain.x === undefined ? undefined : -s.grain.x },
    ...over,
  };
};

// ---------------------------------------------------------------- body

const frontR = path(
  -PLACKET,
  58,
  L(0, 58),
  neckRight,
  L(SHOULDER.x, SHOULDER.y),
  armholeDown,
  sideDown,
  hemTo(-PLACKET),
  L(-PLACKET, 58),
);
// Segments: 0 placket top, 1 neck, 2 shoulder, 3 armhole, 4 side seam, 5 hem, 6 front edge.

const pocket = path(
  70,
  176,
  L(166, 176),
  L(166, 276),
  L(152, 290),
  L(84, 290),
  L(70, 276),
  L(70, 176),
);

const frontRSpec: Spec = {
  id: "frontR",
  no: "01",
  name: "Front right",
  cut: "Cut 1",
  z: 3,
  flat: frontR,
  details: [{ p: path(PLACKET, 56, L(PLACKET, HEM)), phase: "always" }],
  stitches: [
    { pts: insetEdge(frontR, [2], 5), step: "shoulders" },
    { pts: insetEdge(frontR, [6], 4), step: "shoulders" },
    { pts: [pt(PLACKET - 4, 58), pt(PLACKET - 4, HEM - 4)], step: "shoulders" },
    { pts: trimPolyline(insetEdge(frontR, [3], 5), 6, 4), step: "sleeves" },
    { pts: trimPolyline(insetEdge(frontR, [4], 5), 6, 6), step: "sides" },
    { pts: trimPolyline(insetEdge(frontR, [5], 5), 4, 2), step: "sides" },
  ],
  buttons: [112, 184, 256, 328, 400, 472, 544].map((y) => pt(0, y)),
  notches: [
    { seg: 3, t: 0.62 },
    { seg: 4, t: 0.4 },
  ],
  drills: [pt(76, 182), pt(160, 182)],
  grain: { x: 22, y: 70, len: 380, dir: "v" },
  draw: { at: 0, dur: 1.3 },
  explodeDelay: 0.24,
  step: "shoulders",
};

const backOutline = path(
  -182,
  92,
  L(182, 92),
  C(180, 150, 190, 200, UNDERARM.x, UNDERARM.y),
  sideDown,
  hemTo(0),
  C(-110, HEM, -204, 598, -HEM_SIDE.x, HEM_SIDE.y),
  C(-210, 440, -215, 320, -UNDERARM.x, UNDERARM.y),
  C(-190, 200, -180, 150, -182, 92),
);

const yokeOutline = path(
  -NECK,
  0,
  C(-48, 12, -24, 16, 0, 16),
  C(24, 16, 48, 12, NECK, 0),
  L(SHOULDER.x, SHOULDER.y),
  C(181, 54, 181, 74, 182, 92),
  L(-182, 92),
  C(-181, 74, -181, 54, -SHOULDER.x, SHOULDER.y),
  L(-NECK, 0),
);

// ---------------------------------------------------------------- sleeve and cuff

const sleeveFlat = path(
  SHOULDER.x,
  SHOULDER.y,
  { c1: arm(40, 90), c2: arm(26, 300), to: arm(14, SLEEVE) },
  { to: arm(14 - WRIST, SLEEVE) },
  { c1: arm(-92, 360), c2: arm(-84, 250), to: UNDERARM },
  armholeUp,
);

// The sleeve unfolds about its top fold into the full pattern: a bell-shaped
// cap and two underarm seams. Local frame: v measured from the sleeve's middle.
const SLEEVE_MID = SLEEVE / 2;
const sleevePattern = mapPath(
  path(
    0,
    0,
    C(56, 0, 92, 104, 122, 128), // back half of the cap
    L(WRIST, SLEEVE), // back underarm seam
    L(-WRIST, SLEEVE), // wrist
    L(-122, 128), // front underarm seam
    C(-92, 104, -56, 0, 0, 0), // front half of the cap
  ),
  (q) => pt(q.x, q.y - SLEEVE_MID),
);

const sleeveRSpec: Spec = {
  id: "sleeveR",
  no: "05",
  name: "Sleeve",
  cut: "Cut 2",
  z: 6,
  flat: sleeveFlat,
  pose: armPose(0, SLEEVE_MID),
  pattern: sleevePattern,
  groups: [
    [1, 1, 1, 1],
    [2, 1, 1, 1],
  ],
  details: [
    {
      p: path(arm(-54, SLEEVE).x, arm(-54, SLEEVE).y, { to: arm(-50, SLEEVE - 20) }),
      phase: "flat",
    },
    {
      p: path(arm(-38, SLEEVE).x, arm(-38, SLEEVE).y, { to: arm(-34, SLEEVE - 20) }),
      phase: "flat",
    },
  ],
  stitches: [{ pts: trimPolyline(insetEdge(sleeveFlat, [2], 5), 4, 8), step: "sides" }],
  notches: [
    { seg: 0, t: 0 },
    { seg: 0, t: 0.55, count: 2 },
    { seg: 4, t: 0.45 },
  ],
  grain: { y: 40, len: 330, dir: "v" },
  draw: { at: 1.1, dur: 0.9 },
  explodeDelay: 0.42,
  step: "sleeves",
};

const cuffFlat = path(
  arm(14 - WRIST, SLEEVE).x,
  arm(14 - WRIST, SLEEVE).y,
  { to: arm(14, SLEEVE) },
  { to: arm(14, SLEEVE + CUFF - 10) },
  { c1: arm(14, SLEEVE + CUFF - 4.5), c2: arm(9.5, SLEEVE + CUFF), to: arm(4, SLEEVE + CUFF) },
  { to: arm(24 - WRIST, SLEEVE + CUFF) },
  {
    c1: arm(18.5 - WRIST, SLEEVE + CUFF),
    c2: arm(14 - WRIST, SLEEVE + CUFF - 4.5),
    to: arm(14 - WRIST, SLEEVE + CUFF - 10),
  },
  { to: arm(14 - WRIST, SLEEVE) },
);

// A barrel cuff opens out to twice what the flat shows.
const cuffPattern = path(
  -WRIST,
  -CUFF / 2,
  L(WRIST, -CUFF / 2),
  L(WRIST, CUFF / 2 - 10),
  C(WRIST, CUFF / 2 - 4.5, WRIST - 4.5, CUFF / 2, WRIST - 10, CUFF / 2),
  L(10 - WRIST, CUFF / 2),
  C(4.5 - WRIST, CUFF / 2, -WRIST, CUFF / 2 - 4.5, -WRIST, CUFF / 2 - 10),
  L(-WRIST, -CUFF / 2),
);

const cuffRSpec: Spec = {
  id: "cuffR",
  no: "07",
  name: "Cuff",
  cut: "Cut 2",
  z: 8,
  flat: cuffFlat,
  pose: armPose(14 - WRIST / 2, SLEEVE + CUFF / 2),
  pattern: cuffPattern,
  stitches: [
    { pts: insetEdge(cuffFlat, [0, 1, 2, 3, 4, 5], 5, 3, true), step: "cuffs", closed: true },
  ],
  buttons: [arm(0, SLEEVE + CUFF / 2)],
  notches: [{ seg: 0, t: 0.5 }],
  grain: { y: 2, len: 184, dir: "h" },
  label: "inline",
  draw: { at: 1.7, dur: 0.5 },
  explodeDelay: 0.54,
  step: "cuffs",
};

// ---------------------------------------------------------------- collar and stand

const collarFlat = path(
  -92,
  100,
  C(-92, 40, -80, -8, -NECK, -22), // left wing, outer edge
  C(-46, -30, -22, -32, 0, -32), // back of the band
  C(22, -32, 46, -30, NECK, -22),
  C(80, -8, 92, 40, 92, 100), // right wing, outer edge
  C(64, 78, 30, 52, 10, 38), // right wing, front edge
  L(-10, 38), // where the wings meet the stand
  C(-30, 52, -64, 78, -92, 100), // left wing, front edge
);

// Unwrapped: a long curved band with a point at each end. Local frame.
const collarPattern = path(
  -186,
  -36,
  C(-156, -26, -112, -13, -70, -9),
  C(-44, -6, -20, -6, 0, -6),
  C(20, -6, 44, -6, 70, -9),
  C(112, -13, 156, -26, 186, -36),
  L(160, 18),
  C(108, 26, 58, 30, 10, 30),
  L(-10, 30),
  C(-58, 30, -108, 26, -160, 18),
  L(-186, -36),
);

const standFlat = path(
  -NECK,
  -22,
  C(-56, 12, -26, 34, -4, 34),
  L(4, 34),
  C(26, 34, 56, 12, NECK, -22),
  L(NECK, 0),
  C(56, 38, 24, 58, 0, 58),
  C(-24, 58, -56, 38, -NECK, 0),
  L(-NECK, -22),
);

const standPattern = path(
  -170,
  -14,
  C(-110, -4, -50, -1, -4, -1),
  L(4, -1),
  C(50, -1, 110, -4, 170, -14),
  C(182, -10, 184, 6, 172, 10),
  C(110, 22, 50, 25, 0, 25),
  C(-50, 25, -110, 22, -172, 10),
  C(-184, 6, -182, -10, -170, -14),
);

// The neck opening between the wings: the inside of the back neck, in shade.
const neckInside = path(
  -NECK,
  -22,
  C(-40, -6, -18, -4, 0, -4),
  C(18, -4, 40, -6, NECK, -22),
  C(42, -2, 22, 22, 10, 38),
  L(-10, 38),
  C(-22, 22, -42, -2, -NECK, -22),
);

const specs: Spec[] = [
  {
    id: "back",
    no: "03",
    name: "Back",
    cut: "Cut 1",
    z: 0,
    hidden: true,
    flat: backOutline,
    details: [
      { p: path(-18, 92, L(-18, 124)), phase: "always" },
      { p: path(18, 92, L(18, 124)), phase: "always" },
    ],
    notches: [
      { seg: 0, t: 0.5 },
      { seg: 1, t: 0.5, count: 2 },
      { seg: 6, t: 0.5, count: 2 },
    ],
    grain: { x: 0, y: 64, len: 330, dir: "v" },
    draw: { at: 0, dur: 0 },
    explodeDelay: 0.8,
    step: "yoke",
  },
  {
    id: "yoke",
    no: "04",
    name: "Yoke",
    cut: "Cut 2",
    z: 1,
    hidden: true,
    flat: yokeOutline,
    stitches: [{ pts: trimPolyline(insetEdge(yokeOutline, [4], 5), 4, 4), step: "yoke" }],
    notches: [
      { seg: 0, t: 1 },
      { seg: 4, t: 0.5 },
    ],
    grain: { x: 0, y: 14, len: 280, dir: "h" },
    label: "inline",
    draw: { at: 0, dur: 0 },
    explodeDelay: 0.92,
    step: "yoke",
  },
  mirror(frontRSpec, {
    id: "frontL",
    no: "02",
    name: "Front left",
    z: 2,
    details: [],
    stitches: [
      { pts: insetEdge(mapPath(frontR, mirrorX), [2], 5), step: "shoulders" },
      { pts: trimPolyline(insetEdge(mapPath(frontR, mirrorX), [3], 5), 6, 4), step: "sleeves" },
      { pts: trimPolyline(insetEdge(mapPath(frontR, mirrorX), [4], 5), 6, 6), step: "sides" },
      { pts: trimPolyline(insetEdge(mapPath(frontR, mirrorX), [5], 5), 4, 2), step: "sides" },
    ],
    buttons: [],
    drills: [],
    explodeDelay: 0.3,
  }),
  frontRSpec,
  {
    id: "pocket",
    no: "11",
    name: "Pocket",
    cut: "Cut 1",
    z: 4,
    flat: pocket,
    details: [{ p: path(70, 196, L(166, 196)), phase: "always" }],
    stitches: [
      { pts: insetEdge(pocket, [1, 2, 3, 4, 5], 4), step: "shoulders" },
      { pts: [pt(72, 200), pt(164, 200)], step: "shoulders" },
    ],
    notches: [
      { seg: 1, t: 0.2 },
      { seg: 5, t: 0.8 },
    ],
    grain: { x: 0, y: 12, len: 0, dir: "v" },
    label: "compact",
    draw: { at: 2.0, dur: 0.6 },
    explodeDelay: 0.16,
    step: "shoulders",
  },
  mirror(sleeveRSpec, { id: "sleeveL", no: "06", z: 5, explodeDelay: 0.36 }),
  sleeveRSpec,
  mirror(cuffRSpec, { id: "cuffL", no: "08", z: 7, explodeDelay: 0.48 }),
  cuffRSpec,
  {
    id: "stand",
    no: "10",
    name: "Stand",
    cut: "Cut 2",
    z: 9,
    flat: standFlat,
    pose: { x: 0, y: 18, rotate: 0 },
    pattern: standPattern,
    stitches: [{ pts: trimPolyline(insetEdge(standFlat, [4, 5], 4), 2, 2), step: "collar" }],
    buttons: [pt(0, 46)],
    grain: { y: 12, len: 240, dir: "h" },
    label: "inline",
    draw: { at: 0.75, dur: 0.5 },
    explodeDelay: 0.08,
    step: "collar",
  },
  {
    id: "collar",
    no: "09",
    name: "Collar",
    cut: "Cut 2",
    z: 10,
    flat: collarFlat,
    pose: { x: 0, y: 34, rotate: 0 },
    pattern: collarPattern,
    groups: [
      [1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 2, 1, 2],
    ],
    details: [
      { p: neckInside, closed: true, phase: "flat", kind: "shade" },
      {
        p: path(-NECK, -22, C(-40, -6, -18, -4, 0, -4), C(18, -4, 40, -6, NECK, -22)),
        phase: "flat",
      },
      { p: path(-NECK, -22, C(-42, -2, -22, 22, -10, 38)), phase: "flat" },
      { p: path(NECK, -22, C(42, -2, 22, 22, 10, 38)), phase: "flat" },
      { p: path(-9, 2, L(9, 2), L(9, 13), L(-9, 13)), closed: true, phase: "flat", kind: "tag" },
    ],
    stitches: [
      { pts: trimPolyline(insetEdge(collarFlat, [3, 4], 5), 18, 3), step: "collar" },
      { pts: trimPolyline(insetEdge(collarFlat, [6, 0], 5), 3, 18), step: "collar" },
    ],
    buttons: [pt(-80, 86), pt(80, 86)],
    notches: [
      { seg: 6, t: 0.5 },
      { seg: 5, t: 0.45 },
      { seg: 7, t: 0.55 },
    ],
    grain: { y: 12, len: 290, dir: "h" },
    label: "inline",
    draw: { at: 0.6, dur: 0.7 },
    explodeDelay: 0,
    step: "collar",
  },
];

export const PIECES: Piece[] = specs.map(build).sort((a, b) => a.z - b.z);
export const pieceById = (id: PieceId) => PIECES.find((p) => p.id === id) as Piece;

/** Flat-drawing extent, for framing the shirt. */
export const SHIRT_BOX = bbox(specs.filter((s) => !s.hidden).flatMap((s) => toPolygon(s.flat, 8)));

export const GEOMETRY = { NECK, SHOULDER, UNDERARM, HEM, PLACKET, SLEEVE, WRIST, CUFF } as const;
