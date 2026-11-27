// The car in the derivative explainer: distance s(t) = -0.3t^3 + 4.5t^2 over
// 10 seconds. It pulls away, peaks at 5 s and stops at 10 s. Every number on
// screen comes from these functions.
import { derivative, fmt, secantSlope } from "../../kit";

export const A3 = -0.3;
export const A2 = 4.5;
export const DURATION = 10;

/** Distance in metres after t seconds. */
export const s = (t: number) => A3 * t ** 3 + A2 * t ** 2;
/** Speed in m/s: the exact derivative, from the power rule. */
export const v = (t: number) => 3 * A3 * t ** 2 + 2 * A2 * t;
export const kmh = (ms: number) => ms * 3.6;

/** The fixed start of the secant, and the gaps it shrinks through. */
export const T0 = 2;
export const GAPS = [4, 2, 1, 0.5, 0.1, 0.01];

export const secant = (dt: number) => ({
  t1: T0,
  t2: T0 + dt,
  ds: s(T0 + dt) - s(T0),
  slope: secantSlope(s, T0, dt),
});

export const peakT = -A2 / (3 * A3);

export const numbers = {
  total: fmt(s(DURATION), 0),
  avgDs: fmt(secant(4).ds, 1),
  avg: fmt(secant(4).slope, 1),
  instant: fmt(derivative(s, T0), 1),
  instantKmh: fmt(kmh(v(T0)), 1),
  peak: fmt(v(peakT), 1),
  peakKmh: fmt(kmh(v(peakT)), 0),
  peakT: fmt(peakT, 0),
  a3: "−" + fmt(-A3, 1),
  a2: fmt(A2, 1),
  d3: "−" + fmt(-3 * A3, 1),
  d2: fmt(2 * A2, 0),
};
