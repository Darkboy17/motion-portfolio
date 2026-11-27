// Beat sheet for the derivative explainer, in seconds.
import { interpolate } from "remotion";
import { ease } from "../../kit";
import type { Cue } from "../../kit";
import { DURATION, GAPS, numbers } from "./model";

export const T = {
  hookDrive: 0.8,
  distance: 6.2,
  drive: 7,
  average: 18.5,
  shrink: 31.5,
  slide: 48,
  rule: 63.5,
  recap: 74.5,
  end: 83,
} as const;

export const DERIVATIVE_SECONDS = T.end;

export const chapters = [
  { label: "Distance", at: T.distance },
  { label: "Average", at: T.average },
  { label: "Instant", at: T.shrink },
  { label: "Tangent", at: T.slide },
  { label: "Rule", at: T.rule },
];

/** Seconds into the shrink chapter at which each gap is reached and held. */
export const GAP_TIMES = [0.6, 3.4, 5.4, 7.2, 9, 10.6];

/** The secant gap at absolute time t: eases through each value in log space, holding on each. */
export const gapAt = (t: number) => {
  const k = t - T.shrink;
  const times = GAP_TIMES.flatMap((g, i) => (i === 0 ? [g] : [g - 1.1, g]));
  const values = GAPS.flatMap((g, i) => (i === 0 ? [g] : [GAPS[i - 1], g])).map(Math.log);
  return Math.exp(
    interpolate(k, times, values, {
      easing: ease.inOutSoft,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
};

/** Where the tangent point sits while it slides along the curve. */
export const slideAt = (t: number) =>
  interpolate(t, [T.slide + 0.8, T.slide + 10.8], [0.15, DURATION], {
    easing: ease.inOutSoft,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const cues: Cue[] = [
  { at: 0.5, text: "Your speedometer shows your speed *right now*, at a single instant." },
  { at: 3.4, text: "But speed is distance over time, and an instant has *no time* in it." },
  {
    at: T.distance + 0.2,
    text: "Here's a car pulling away from a light. Its distance *s*, after *t* seconds:",
  },
  {
    at: T.drive + 3.6,
    text: `It speeds up, then brakes for the next light: *${numbers.total} m* in *10 s.*`,
  },
  { at: T.drive + 7.4, text: "Every point on the curve is where the car is at that moment." },
  {
    at: T.average + 0.2,
    text: "Average speed is easy: distance ÷ time, the *slope* of the line joining two moments.",
  },
  {
    at: T.average + 4.8,
    text: `From 2 s to 6 s the car covers *${numbers.avgDs} m* in *4 s*: an average of *${numbers.avg} m/s.*`,
  },
  { at: T.average + 9.2, text: "But at 2 s the car is still slow. That average *overshoots.*" },
  {
    at: T.shrink + 0.2,
    text: "So shrink the gap. Keep the start at 2 s and bring the end closer.",
  },
  { at: T.shrink + 5, text: "The line swings round, and the average *settles*..." },
  {
    at: T.shrink + 9.4,
    text: `...on *${numbers.instant} m/s.* That limit is the speed at the instant: the *derivative.*`,
  },
  {
    at: T.shrink + 13.2,
    text: "On the graph, it's the slope of the *tangent*: the line that just grazes the curve.",
  },
  { at: T.slide + 0.2, text: "Slide the tangent along, and its slope *is* the speedometer." },
  { at: T.slide + 5, text: "Steep means fast. Flat means stopped." },
  { at: T.slide + 9.6, text: "Its slope at every moment draws a new graph: *speed* against time." },
  { at: T.rule + 0.2, text: "Calculus gives that formula in one step, with the *power rule.*" },
  { at: T.rule + 4.4, text: `At 2 s it gives *${numbers.instant} m/s*: the same as the limit.` },
  {
    at: T.rule + 7.2,
    text: `Top speed at 5 s: *${numbers.peak} m/s*, about *${numbers.peakKmh} km/h.* At 10 s: *zero.*`,
  },
  { at: T.recap + 0.2, text: "Speed is the *slope* of distance. That's the *derivative.*" },
  { at: T.recap + 4.4, text: "And the slope of speed? *Acceleration*: the derivative, again." },
];
