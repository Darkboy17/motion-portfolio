// Where things sit on the 1920x1080 frame: the assembled shirt, the pattern
// sheet (computed from the pieces' sizes, not hand-placed), the shrunken sheet
// the pieces are sewn from, and the measurements drawn on the sheet.
import { GEOMETRY, PIECES, SHIRT_BOX, pieceById } from "./pieces";
import type { PieceId } from "./pieces";
import { pt, toLocal } from "./geometry";
import type { Pt } from "./geometry";

export const FRAME = { width: 1920, height: 1080 } as const;

/** The assembled shirt: centred in the right-hand side of the frame. */
export const SHIRT = (() => {
  const scale = 1;
  const centre = pt(1290, 548);
  return {
    scale,
    x: centre.x - SHIRT_BOX.cx * scale,
    y: centre.y - SHIRT_BOX.cy * scale,
    left: centre.x - (SHIRT_BOX.w / 2) * scale,
    right: centre.x + (SHIRT_BOX.w / 2) * scale,
    top: centre.y - (SHIRT_BOX.h / 2) * scale,
    bottom: centre.y + (SHIRT_BOX.h / 2) * scale,
  };
})();

/** Shirt units to frame pixels for the assembled shirt. */
export const shirtToFrame = (q: Pt): Pt =>
  pt(SHIRT.x + q.x * SHIRT.scale, SHIRT.y + q.y * SHIRT.scale);

/**
 * The pattern sheet: five columns, mirrored about the back, bottom-aligned on
 * one baseline like pieces laid out on a cutting table.
 */
const COLUMNS: PieceId[][] = [
  ["sleeveL", "cuffL"],
  ["frontL"],
  ["collar", "stand", "yoke", "back"],
  ["frontR"],
  ["sleeveR", "cuffR", "pocket"],
];

export const SHEET = {
  scale: 0.9,
  gapX: 70,
  gapY: 30,
  baseline: 982,
  centreX: 960,
} as const;

export const SHEET_POS: Record<PieceId, Pt> = (() => {
  const k = SHEET.scale;
  const widths = COLUMNS.map((col) => Math.max(...col.map((id) => pieceById(id).box.w)));
  const total = widths.reduce((a, b) => a + b, 0) + SHEET.gapX * (COLUMNS.length - 1);
  const out = {} as Record<PieceId, Pt>;
  let x = SHEET.centreX - (total * k) / 2;
  COLUMNS.forEach((col, i) => {
    const cx = x + (widths[i] * k) / 2;
    let y = SHEET.baseline;
    for (const id of [...col].reverse()) {
      const box = pieceById(id).box;
      // Sheet position is where the piece's local origin goes, so allow for an off-centre box.
      out[id] = pt(cx - box.cx * k, y - (box.h / 2) * k - box.cy * k);
      y -= (box.h + SHEET.gapY) * k;
    }
    x += (widths[i] + SHEET.gapX) * k;
  });
  return out;
})();

/** Sheet extent in pixels, for the grid and the shrink into the corner. */
export const SHEET_BOUNDS = (() => {
  const k = SHEET.scale;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const p of PIECES) {
    const at = SHEET_POS[p.id];
    xs.push(at.x + p.box.x0 * k, at.x + p.box.x1 * k);
    ys.push(at.y + p.box.y0 * k, at.y + p.box.y1 * k);
  }
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return { x0, x1, y0, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
})();

/** The sheet shrunk into the bottom-left corner while the shirt is sewn. */
export const MINI = (() => {
  const area = { x0: 120, x1: 640, y0: 736, y1: 982 };
  const scale = Math.min(
    (area.x1 - area.x0) / SHEET_BOUNDS.w,
    (area.y1 - area.y0) / SHEET_BOUNDS.h,
  );
  return {
    scale,
    area,
    map: (q: Pt): Pt =>
      pt(area.x0 + (q.x - SHEET_BOUNDS.x0) * scale, area.y1 - (SHEET_BOUNDS.y1 - q.y) * scale),
  };
})();

export type Dim = {
  piece: PieceId;
  label: string;
  /** Measured points, in the piece's local units. */
  from: Pt;
  to: Pt;
  /** Perpendicular offset of the dimension line from the measured points (local units). */
  offset: number;
  at: number;
};

const { NECK, UNDERARM, HEM, SLEEVE } = GEOMETRY;
const localOf = (id: PieceId) => toLocal(pieceById(id).pose);
const back = localOf("back");
const frontL = localOf("frontL");

/** Measurements, in the order they draw. Values are read off the geometry, not typed in. */
export const DIMS: Omit<Dim, "at">[] = [
  {
    piece: "back",
    label: "Chest",
    from: back(pt(-UNDERARM.x, UNDERARM.y)),
    to: back(pt(UNDERARM.x, UNDERARM.y)),
    offset: 0,
  },
  {
    piece: "frontL",
    label: "Length",
    from: frontL(pt(-NECK, HEM)),
    to: frontL(pt(-NECK, 0)),
    offset: 186,
  },
  {
    piece: "sleeveR",
    label: "Sleeve",
    from: pt(0, -SLEEVE / 2),
    to: pt(0, SLEEVE / 2),
    offset: 166,
  },
  {
    piece: "collar",
    label: "Collar",
    from: pt(-160, 18),
    to: pt(160, 18),
    offset: 90,
  },
];
