// Plane geometry for the garment. Outlines are lists of line and cubic
// segments; they are sampled into polygons when they need to morph, be offset
// (seam allowances, stitching) or be measured. Units are "shirt units":
// 8 units to the centimetre, so a 54 cm chest is 432 units.

export const UNITS_PER_CM = 8;

export type Pt = { x: number; y: number };
export const pt = (x: number, y: number): Pt => ({ x, y });

/** A straight line when it has no control points, otherwise a cubic Bézier. */
export type Seg = { to: Pt; c1?: Pt; c2?: Pt };
export const L = (x: number, y: number): Seg => ({ to: pt(x, y) });
export const C = (x1: number, y1: number, x2: number, y2: number, x: number, y: number): Seg => ({
  c1: pt(x1, y1),
  c2: pt(x2, y2),
  to: pt(x, y),
});

/** A start point and the segments that walk from it. Closed outlines end where they start. */
export type Path = { start: Pt; segs: Seg[] };
export const path = (x: number, y: number, ...segs: Seg[]): Path => ({ start: pt(x, y), segs });

const f = (n: number) => (Math.round(n * 100) / 100).toString();

export const pathD = (p: Path, closed = true) => {
  let d = `M ${f(p.start.x)} ${f(p.start.y)}`;
  for (const s of p.segs) {
    d +=
      s.c1 && s.c2
        ? ` C ${f(s.c1.x)} ${f(s.c1.y)} ${f(s.c2.x)} ${f(s.c2.y)} ${f(s.to.x)} ${f(s.to.y)}`
        : ` L ${f(s.to.x)} ${f(s.to.y)}`;
  }
  return closed ? `${d} Z` : d;
};

export const polyD = (pts: Pt[], closed = true) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${f(p.x)} ${f(p.y)}`).join(" ") + (closed ? " Z" : "");

export const segStart = (p: Path, i: number) => (i === 0 ? p.start : p.segs[i - 1].to);

export const segPoint = (p0: Pt, s: Seg, t: number): Pt => {
  if (!s.c1 || !s.c2) return { x: p0.x + (s.to.x - p0.x) * t, y: p0.y + (s.to.y - p0.y) * t };
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * s.c1.x + c * s.c2.x + d * s.to.x,
    y: a * p0.y + b * s.c1.y + c * s.c2.y + d * s.to.y,
  };
};

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
});

/** Dense polyline of one segment, start point included. */
const segPolyline = (p0: Pt, s: Seg, n = 40): Pt[] =>
  s.c1 ? Array.from({ length: n + 1 }, (_, i) => segPoint(p0, s, i / n)) : [p0, s.to];

export const polyLength = (pts: Pt[]) =>
  pts.slice(1).reduce((acc, p, i) => acc + dist(pts[i], p), 0);

/** `n` points spaced evenly along a polyline by arc length, from its start, excluding its end. */
export const resample = (poly: Pt[], n: number): Pt[] => {
  const total = polyLength(poly);
  const out: Pt[] = [];
  let seg = 0;
  let walked = 0;
  for (let i = 0; i < n; i++) {
    const target = (total * i) / n;
    while (seg < poly.length - 2 && walked + dist(poly[seg], poly[seg + 1]) < target) {
      walked += dist(poly[seg], poly[seg + 1]);
      seg++;
    }
    const len = dist(poly[seg], poly[seg + 1]) || 1;
    out.push(lerpPt(poly[seg], poly[seg + 1], (target - walked) / len));
  }
  return out;
};

/** Splits a path's segments into consecutive groups and returns each group as a dense polyline. */
export const groupPolylines = (p: Path, groups?: number[]): Pt[][] => {
  const sizes = groups ?? p.segs.map(() => 1);
  const out: Pt[][] = [];
  let i = 0;
  for (const size of sizes) {
    const poly: Pt[] = [];
    for (let k = 0; k < size; k++, i++) {
      const pts = segPolyline(segStart(p, i), p.segs[i]);
      poly.push(...(poly.length ? pts.slice(1) : pts));
    }
    out.push(poly);
  }
  return out;
};

/**
 * Samples two closed outlines into polygons whose points correspond one to one,
 * so one can morph into the other. Matching groups get the same number of
 * points, so corners stay corners through the morph.
 */
export const matchedPolygons = (
  a: Path,
  b: Path,
  groupsA?: number[],
  groupsB?: number[],
  step = 3,
): [Pt[], Pt[]] => {
  const ga = groupPolylines(a, groupsA);
  const gb = groupPolylines(b, groupsB);
  const pa: Pt[] = [];
  const pb: Pt[] = [];
  ga.forEach((polyA, i) => {
    const n = Math.max(2, Math.ceil(Math.max(polyLength(polyA), polyLength(gb[i])) / step));
    pa.push(...resample(polyA, n));
    pb.push(...resample(gb[i], n));
  });
  return [pa, pb];
};

/** A closed outline as a polygon: every segment sampled, corners kept exactly. */
export const toPolygon = (p: Path, step = 4): Pt[] =>
  groupPolylines(p).flatMap((poly) =>
    resample(poly, Math.max(1, Math.ceil(polyLength(poly) / step))),
  );

export const lerpPoly = (a: Pt[], b: Pt[], t: number): Pt[] => a.map((p, i) => lerpPt(p, b[i], t));

/** Positive for clockwise polygons in screen space (y down). */
const signedArea = (pts: Pt[]) =>
  pts.reduce((acc, p, i) => {
    const q = pts[(i + 1) % pts.length];
    return acc + (p.x * q.y - q.x * p.y);
  }, 0) / 2;

const unitNormal = (a: Pt, b: Pt): Pt => {
  const len = dist(a, b) || 1;
  return { x: (b.y - a.y) / len, y: -(b.x - a.x) / len };
};

/**
 * Offsets a closed polygon outwards by `d` (negative insets), with mitred
 * corners clamped so sharp collar points don't throw out long spikes.
 */
export const offsetPolygon = (pts: Pt[], d: number, miterLimit = 2.2): Pt[] => {
  // Clockwise on screen: the left-hand normal of each edge points outwards.
  const dir = signedArea(pts) > 0 ? 1 : -1;
  const n = pts.length;
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const n1 = unitNormal(prev, p);
    const n2 = unitNormal(p, next);
    const mx = n1.x + n2.x;
    const my = n1.y + n2.y;
    const mlen = Math.hypot(mx, my) || 1;
    const cos = (mx * n1.x + my * n1.y) / mlen;
    const k = Math.min(1 / Math.max(cos, 1e-3), miterLimit);
    return { x: p.x + (dir * d * k * mx) / mlen, y: p.y + (dir * d * k * my) / mlen };
  });
};

/** Where segments ab and cd cross, if they do. */
const crossing = (a: Pt, b: Pt, c: Pt, d: Pt): Pt | null => {
  const den = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x);
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c.x - a.x) * (d.y - c.y) - (c.y - a.y) * (d.x - c.x)) / den;
  const u = ((c.x - a.x) * (b.y - a.y) - (c.y - a.y) * (b.x - a.x)) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? lerpPt(a, b, t) : null;
};

/**
 * Joins polyline `next` onto `acc`. Inset lines overlap at a convex corner, so
 * both are cut where they cross; at a concave corner they simply connect.
 */
const joinAtCorner = (acc: Pt[], next: Pt[], reach = 24): Pt[] => {
  if (!acc.length) return [...next];
  for (let i = acc.length - 2; i >= Math.max(0, acc.length - 1 - reach); i--) {
    for (let j = 0; j < Math.min(next.length - 1, reach); j++) {
      const x = crossing(acc[i], acc[i + 1], next[j], next[j + 1]);
      if (x) return [...acc.slice(0, i + 1), x, ...next.slice(j + 1)];
    }
  }
  return [...acc, ...next.slice(1)];
};

/**
 * A stitch line: some segments of a closed outline, inset by `d` towards the
 * inside of the piece. Returns a polyline; with `closed`, the ends are joined
 * the same way as the corners.
 */
export const insetEdge = (
  outline: Path,
  segIdx: number[],
  d: number,
  step = 3,
  closed = false,
): Pt[] => {
  const poly = toPolygon(outline, 2);
  const inward = signedArea(poly) > 0 ? -1 : 1;
  let pts: Pt[] = [];
  segIdx.forEach((i) => {
    const s = outline.segs[i];
    const dense = segPolyline(segStart(outline, i), s, 60);
    const even = [...resample(dense, Math.max(2, Math.ceil(polyLength(dense) / step))), s.to];
    const shifted = even.map((p, j) => {
      const a = even[Math.max(0, j - 1)];
      const b = even[Math.min(even.length - 1, j + 1)];
      const nrm = unitNormal(a, b);
      return { x: p.x + nrm.x * d * inward, y: p.y + nrm.y * d * inward };
    });
    pts = joinAtCorner(pts, shifted);
  });
  if (closed) {
    // Close the loop where the last edge's inset crosses the first's.
    const n = pts.length;
    for (let i = n - 2; i >= Math.max(0, n - 25); i--) {
      for (let j = 0; j < Math.min(i - 1, 24); j++) {
        const x = crossing(pts[i], pts[i + 1], pts[j], pts[j + 1]);
        if (x) return [x, ...pts.slice(j + 1, i + 1), x];
      }
    }
  }
  return pts;
};

/** Trims a polyline by `a` units at its start and `b` at its end, so stitches stop short of corners. */
export const trimPolyline = (pts: Pt[], a: number, b: number): Pt[] => {
  const total = polyLength(pts);
  const n = Math.max(2, Math.ceil((total - a - b) / 2));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) out.push(pointAlong(pts, a + ((total - a - b) * i) / n));
  return out;
};

export const pointAlong = (pts: Pt[], at: number): Pt => {
  let walked = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const len = dist(pts[i], pts[i + 1]);
    if (walked + len >= at) return lerpPt(pts[i], pts[i + 1], (at - walked) / (len || 1));
    walked += len;
  }
  return pts[pts.length - 1];
};

export type Box = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
};
export const bbox = (pts: Pt[]): Box => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const y0 = Math.min(...ys);
  const y1 = Math.max(...ys);
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
};

export const mapPath = (p: Path, fn: (q: Pt) => Pt): Path => ({
  start: fn(p.start),
  segs: p.segs.map((s) => ({
    to: fn(s.to),
    c1: s.c1 ? fn(s.c1) : undefined,
    c2: s.c2 ? fn(s.c2) : undefined,
  })),
});

export const mirrorX = (q: Pt): Pt => ({ x: -q.x, y: q.y });

/** Where a piece's local frame sits in the flat drawing: origin in shirt units, rotation in degrees. */
export type Pose = { x: number; y: number; rotate: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Shirt coordinates to a piece's local coordinates. */
export const toLocal =
  (pose: Pose) =>
  (q: Pt): Pt => {
    const dx = q.x - pose.x;
    const dy = q.y - pose.y;
    const c = Math.cos(rad(-pose.rotate));
    const s = Math.sin(rad(-pose.rotate));
    return { x: dx * c - dy * s, y: dx * s + dy * c };
  };

/** Point and inward normal at parameter t of segment i of a closed outline. */
export const edgeFrame = (outline: Path, i: number, t: number) => {
  const p0 = segStart(outline, i);
  const s = outline.segs[i];
  const at = segPoint(p0, s, t);
  const a = segPoint(p0, s, Math.max(0, t - 0.01));
  const b = segPoint(p0, s, Math.min(1, t + 0.01));
  const inward = signedArea(toPolygon(outline, 6)) > 0 ? -1 : 1;
  const nrm = unitNormal(a, b);
  return { at, normal: { x: nrm.x * inward, y: nrm.y * inward }, tangent: { x: -nrm.y, y: nrm.x } };
};
