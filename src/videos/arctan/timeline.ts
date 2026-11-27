// Beat sheet for the arctan explainer, in seconds, and where the target is at
// every moment. The turret, the triangle and the panels all read from here.
import { interpolate } from "remotion";
import { ease } from "../../kit/theme";
import type { Cue } from "../../kit/cues";
import {
  ABOVE_TARGET,
  MIRROR_TARGET,
  TRIANGLE_TARGET,
  aimDeg,
  circlePath,
  deg,
  hookPath,
  lerpVec,
  rightHalfPath,
} from "./model";
import type { Vec } from "./model";

export const T = {
  triangle: 6.4,
  track: 20.5,
  bug: 32.5,
  atan2: 48.5,
  circle: 56,
  uses: 64.5,
  recap: 75,
  end: 83,
} as const;

export const ARCTAN_SECONDS = T.end;

export const chapters = [
  { label: "Triangle", at: T.triangle },
  { label: "Track", at: T.track },
  { label: "The bug", at: T.bug },
  { label: "atan2", at: T.atan2 },
  { label: "In games", at: T.uses },
];

/** Hook bullets: one on every beat. */
export const SHOTS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5];
export const SHOT_FLIGHT = 0.3;

/** Homing missile launches in the last chapter. */
export const LAUNCHES = [T.uses + 0.9, T.uses + 4.8];

const polar = (r: number, deg: number): Vec => ({
  x: r * Math.cos((deg * Math.PI) / 180),
  y: r * Math.sin((deg * Math.PI) / 180),
});
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const eased = (t: number, a: number, b: number) => ease.inOutSoft(clamp01((t - a) / (b - a)));

/** Swings the target around the turret at radius 5, from one angle to another. */
const swing = (t: number, a: number, b: number, fromDeg: number, toDeg: number, r = 5) =>
  polar(r, interpolate(eased(t, a, b), [0, 1], [fromDeg, toDeg]));

export const targetAt = (t: number): Vec => {
  if (t < T.triangle) return hookPath(t);
  if (t < T.track)
    return lerpVec(hookPath(T.triangle), TRIANGLE_TARGET, eased(t, T.triangle, T.triangle + 1.2));
  if (t < T.bug) return rightHalfPath(t - T.track);
  const enterBug = rightHalfPath(T.bug - T.track);
  const startDeg = aimDeg(enterBug);
  if (t < T.bug + 3.4) {
    // Ease out to radius 5, then round the left side to the mirror point.
    const p = swing(t, T.bug + 0.2, T.bug + 3.2, startDeg, 216.87);
    return lerpVec(enterBug, p, eased(t, T.bug, T.bug + 0.8));
  }
  if (t < T.bug + 9.8) return MIRROR_TARGET;
  if (t < T.circle) {
    // Round to straight above, closing in from radius 5 to 4; land exactly on dx = 0.
    const k = eased(t, T.bug + 9.8, T.bug + 11.4);
    return k >= 1 ? ABOVE_TARGET : polar(5 - k, 216.87 - k * 126.87);
  }
  if (t < T.uses)
    return circlePath(interpolate(eased(t, T.circle, T.uses - 0.6), [0, 1], [0, Math.PI * 2]));
  return circlePath(0.85 * (t - T.uses));
};

export const cues = (): Cue[] => [
  {
    at: 0.5,
    text: "A turret tracks its target every frame. How does it know *which way* to point?",
  },
  { at: T.triangle + 0.2, text: "The game knows two positions: the turret, and the target." },
  { at: T.triangle + 3, text: "The gaps between them, *dx* and *dy*, make a right triangle." },
  {
    at: T.triangle + 6.6,
    text: "Opposite over adjacent is *tan θ*, so the angle is its inverse: *arctan(dy ÷ dx).*",
  },
  { at: T.triangle + 10.4, text: `Here that's arctan(0.75): *${deg(aimDeg(TRIANGLE_TARGET))}.*` },
  { at: T.track + 0.2, text: "Recompute it every frame, and the turret *follows* the target." },
  {
    at: T.track + 5.6,
    text: "So far, so good. But watch what happens when the target goes *left.*",
  },
  { at: T.bug + 0.4, text: "Watch the turret. The target swings round behind it..." },
  { at: T.bug + 3.6, text: "...and the turret aims the *opposite* way." },
  {
    at: T.bug + 6.2,
    text: "(−4, −3) gives the same ratio as (4, 3): *0.75.* Plain arctan can't tell them apart.",
  },
  { at: T.bug + 11.5, text: "And straight above, dx is zero: the ratio *divides by zero.*" },
  {
    at: T.atan2 + 0.2,
    text: "The fix is one function: *atan2*, which takes dy and dx *separately.*",
  },
  {
    at: T.atan2 + 4.6,
    text: "Because it sees both signs, it knows the quadrant, and dx = 0 is fine.",
  },
  {
    at: T.circle + 0.2,
    text: "Send the target all the way round: atan2 covers the *full circle*, −180° to 180°.",
  },
  {
    at: T.uses + 0.2,
    text: "You'll find it everywhere in games: aiming, facing the player, reading a joystick...",
  },
  {
    at: T.uses + 4.4,
    text: "...and *homing missiles*, which turn toward atan2 a little every frame.",
  },
  { at: T.recap + 0.2, text: "Two positions in, *one angle* out: atan2(dy, dx)." },
];
