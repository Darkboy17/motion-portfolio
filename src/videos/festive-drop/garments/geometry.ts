// Path helpers for the garment drawings. Garments are drawn in an 800 x 1100
// box, centred on x = 400, and most of each drawing is its left half mirrored.
import { Easing } from "remotion";

export const BOX = { w: 800, h: 1100, cx: 400 } as const;

export type Pt = readonly [number, number];
/** One cubic segment: control 1, control 2, end point. */
export type Seg = readonly [Pt, Pt, Pt];

const n = (v: number) => Math.round(v * 100) / 100;
const pt = ([x, y]: Pt) => `${n(x)} ${n(y)}`;
const mirror = ([x, y]: Pt, cx: number): Pt => [2 * cx - x, y];

/**
 * A closed silhouette, symmetric about x = cx. Give the left half as cubic
 * segments from the top centre down to the bottom centre; the right half is
 * mirrored and walked back up, so the two sides can never drift apart.
 */
export const symPath = (start: Pt, segs: readonly Seg[], cx: number = BOX.cx): string => {
  const ends = [start, ...segs.map((s) => s[2])];
  let d = `M ${pt(start)}`;
  for (const [c1, c2, p] of segs) d += ` C ${pt(c1)} ${pt(c2)} ${pt(p)}`;
  for (let i = segs.length - 1; i >= 0; i--) {
    const [c1, c2] = segs[i];
    d += ` C ${pt(mirror(c2, cx))} ${pt(mirror(c1, cx))} ${pt(mirror(ends[i], cx))}`;
  }
  return `${d} Z`;
};

/** A smooth curve through points (Catmull-Rom, as cubic Beziers). */
export const smoothPath = (pts: readonly Pt[], move = true): string => {
  let d = move ? `M ${pt(pts[0])}` : `L ${pt(pts[0])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${pt(c1)} ${pt(c2)} ${pt(p2)}`;
  }
  return d;
};

/** SVG transform that mirrors a group about x = cx. */
export const mirrorX = (cx: number = BOX.cx) => `translate(${2 * cx} 0) scale(-1 1)`;

/** Point on a quadratic Bezier at s, and its tangent angle in degrees. */
export const onQuad = (p0: Pt, c: Pt, p1: Pt, s: number) => {
  const u = 1 - s;
  const x = u * u * p0[0] + 2 * u * s * c[0] + s * s * p1[0];
  const y = u * u * p0[1] + 2 * u * s * c[1] + s * s * p1[1];
  const dx = 2 * u * (c[0] - p0[0]) + 2 * s * (p1[0] - c[0]);
  const dy = 2 * u * (c[1] - p0[1]) + 2 * s * (p1[1] - c[1]);
  return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI };
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

/** Rescales an already-eased progress so [a, b] maps to [0, 1], clamped. */
export const remap = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/** Local progress for item i of `count` sharing one 0-1 progress, overlapping by `spread`. */
export const staggerP = (p: number, i: number, count: number, spread = 3) => {
  const span = 1 / (count + spread - 1);
  return clamp01((p - i * span) / (span * spread));
};

const backOut = Easing.out(Easing.back(1.8));

/** A pop with a small overshoot, for dots and buttons landing. */
export const popScale = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : backOut(p));
