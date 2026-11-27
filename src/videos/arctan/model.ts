// Positions, angles and the homing-missile simulation for the arctan explainer.
// World units with y pointing up; the turret sits at the origin.
import { aim, naiveAim, shortestTurn, toDeg } from "../../kit/math";

export type Vec = { x: number; y: number };

export const TRIANGLE_TARGET: Vec = { x: 4, y: 3 };
export const MIRROR_TARGET: Vec = { x: -4, y: -3 };
export const ABOVE_TARGET: Vec = { x: 0, y: 4 };

export const aimDeg = (p: Vec) => toDeg(aim(p.x, p.y));
export const naiveDeg = (p: Vec) => toDeg(naiveAim(p.x, p.y));

/** Formats degrees with one decimal and a real minus sign. */
export const deg = (d: number) => `${d < 0 ? "−" : ""}${Math.abs(d).toFixed(1)}°`;

/** The hook's target: a Lissajous loop that visits every quadrant. */
export const hookPath = (t: number): Vec => ({
  x: 4.3 * Math.cos(0.8 * t + 0.6),
  y: 3.3 * Math.sin(1.25 * t),
});

/** A wander that stays right of the turret, so plain arctan still works. */
export const rightHalfPath = (k: number): Vec => ({
  x: 4 + 1.6 * Math.sin(0.9 * k),
  y: 3 * Math.cos(0.7 * k),
});

/** A full circle, starting straight above the turret. */
export const circlePath = (k: number, r = 4): Vec => ({
  x: r * Math.cos(Math.PI / 2 + k),
  y: r * Math.sin(Math.PI / 2 + k),
});

export const lerpVec = (a: Vec, b: Vec, t: number): Vec => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

export type Missile = { pos: Vec; heading: number; trail: Vec[]; hitAt: number | null };

/**
 * Steers a missile toward a moving target: each step it turns toward
 * atan2(dy, dx) by at most `turnRate` radians a second, then moves forward.
 * Deterministic, so any frame can be simulated from launch.
 */
export const simulateMissile = (opts: {
  from: Vec;
  heading: number;
  target: (t: number) => Vec;
  launch: number;
  until: number;
  speed?: number;
  turnRate?: number;
  dt?: number;
}): Missile => {
  const { from, target, launch, until, speed = 6, turnRate = Math.PI * 1.1, dt = 1 / 120 } = opts;
  let pos = { ...from };
  let heading = opts.heading;
  const trail: Vec[] = [];
  for (let t = launch; t < until; t += dt) {
    const tg = target(t);
    const want = aim(tg.x - pos.x, tg.y - pos.y);
    const turn = Math.max(-turnRate * dt, Math.min(turnRate * dt, shortestTurn(heading, want)));
    heading += turn;
    pos = { x: pos.x + Math.cos(heading) * speed * dt, y: pos.y + Math.sin(heading) * speed * dt };
    if (Math.round((t - launch) / dt) % 6 === 0) trail.push(pos);
    if (Math.hypot(tg.x - pos.x, tg.y - pos.y) < 0.35) return { pos, heading, trail, hitAt: t };
  }
  return { pos, heading, trail, hitAt: null };
};
