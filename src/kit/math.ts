// Pure maths used by the explainers. Every number shown on screen is computed
// from these, so the videos stay correct when their inputs change.

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const toDeg = (r: number) => (r * 180) / Math.PI;
export const toRad = (d: number) => (d * Math.PI) / 180;

export type Quadratic = { a: number; b: number; c: number };

export const evalQuadratic = ({ a, b, c }: Quadratic, x: number) => a * x * x + b * x + c;
export const discriminant = ({ a, b, c }: Quadratic) => b * b - 4 * a * c;

/** Real roots in ascending order: two, one (a repeated root) or none. */
export const solveQuadratic = (q: Quadratic): number[] => {
  const d = discriminant(q);
  if (q.a === 0) return q.b === 0 ? [] : [-q.c / q.b];
  if (d < 0) return [];
  if (d === 0) return [-q.b / (2 * q.a)];
  const s = Math.sqrt(d);
  return [(-q.b - s) / (2 * q.a), (-q.b + s) / (2 * q.a)].sort((m, n) => m - n);
};

export const vertex = (q: Quadratic) => {
  const x = -q.b / (2 * q.a);
  return { x, y: evalQuadratic(q, x) };
};

/** Height of a body thrown upward: h(t) = -g/2 t^2 + v0 t + h0. */
export const projectile = (v0: number, h0: number, g = 9.8): Quadratic => ({
  a: -g / 2,
  b: v0,
  c: h0,
});

/** Slope of the secant from x to x + h. */
export const secantSlope = (f: (x: number) => number, x: number, h: number) =>
  (f(x + h) - f(x)) / h;

/** Central-difference derivative. */
export const derivative = (f: (x: number) => number, x: number, h = 1e-5) =>
  (f(x + h) - f(x - h)) / (2 * h);

/** Naive aim: arctan of the ratio. Loses the quadrant and fails when dx = 0. */
export const naiveAim = (dx: number, dy: number) => Math.atan(dy / dx);

/** Correct aim: atan2 uses the signs of both legs, so it covers the full circle. */
export const aim = (dx: number, dy: number) => Math.atan2(dy, dx);

/** Wraps an angle in radians into (-PI, PI]. */
export const wrapAngle = (a: number) => {
  const t = ((((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  return t === -Math.PI ? Math.PI : t;
};

/** The signed shortest turn from angle `from` to angle `to`. */
export const shortestTurn = (from: number, to: number) => wrapAngle(to - from);

/** Evenly spaced "nice" tick values (steps of 1, 2 or 5 times a power of ten) covering [lo, hi]. */
export const niceTicks = (lo: number, hi: number, target = 6): number[] => {
  const raw = (hi - lo) / Math.max(1, target);
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  const first = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = first; v <= hi + step * 1e-6; v += step) out.push(Math.round(v / step) * step || 0);
  return out;
};

/** Formats a number with fixed decimals, dropping a trailing ".0". */
export const fmt = (v: number, decimals = 1) => {
  const s = v.toFixed(decimals);
  return decimals > 0 ? s.replace(/\.0+$/, "") : s;
};

/** Typographic minus sign for display. */
export const signed = (v: number, decimals = 1) =>
  v < 0 ? `−${fmt(-v, decimals)}` : fmt(v, decimals);
