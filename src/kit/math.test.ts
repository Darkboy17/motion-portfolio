import { describe, expect, it } from "vitest";
import {
  aim,
  derivative,
  discriminant,
  fmt,
  naiveAim,
  niceTicks,
  projectile,
  secantSlope,
  shortestTurn,
  signed,
  solveQuadratic,
  toDeg,
  vertex,
  wrapAngle,
} from "./math";

describe("quadratics", () => {
  const throwUp = projectile(15, 2);

  it("models a throw as -4.9t^2 + v0 t + h0", () => {
    expect(throwUp).toEqual({ a: -4.9, b: 15, c: 2 });
  });

  it("finds both roots of the landing equation, in order", () => {
    const [before, landing] = solveQuadratic(throwUp);
    expect(before).toBeCloseTo(-0.128, 3);
    expect(landing).toBeCloseTo(3.189, 3);
  });

  it("puts the peak at t = -b / 2a", () => {
    const peak = vertex(throwUp);
    expect(peak.x).toBeCloseTo(1.531, 3);
    expect(peak.y).toBeCloseTo(13.48, 2);
  });

  it("has no real solution for a height above the peak", () => {
    const ledge = { ...throwUp, c: throwUp.c - 15 };
    expect(discriminant(ledge)).toBeCloseTo(-29.8, 6);
    expect(solveQuadratic(ledge)).toEqual([]);
  });

  it("returns a single root when the discriminant is zero", () => {
    expect(solveQuadratic({ a: 1, b: -4, c: 4 })).toEqual([2]);
  });
});

describe("derivatives", () => {
  const s = (t: number) => -0.3 * t ** 3 + 4.5 * t ** 2;

  it("secant slopes approach the derivative as the gap shrinks", () => {
    expect(secantSlope(s, 2, 4)).toBeCloseTo(20.4, 9);
    expect(secantSlope(s, 2, 1)).toBeCloseTo(16.8, 9);
    expect(secantSlope(s, 2, 0.01)).toBeCloseTo(14.427, 3);
    expect(derivative(s, 2)).toBeCloseTo(14.4, 6);
  });

  it("is zero where the car stops", () => {
    expect(derivative(s, 10)).toBeCloseTo(0, 6);
  });
});

describe("aiming", () => {
  it("agrees with atan2 when the target is to the right", () => {
    expect(naiveAim(4, 3)).toBeCloseTo(aim(4, 3), 12);
    expect(toDeg(aim(4, 3))).toBeCloseTo(36.87, 2);
  });

  it("loses the quadrant when the target is to the left", () => {
    expect(toDeg(naiveAim(-4, -3))).toBeCloseTo(36.87, 2);
    expect(toDeg(aim(-4, -3))).toBeCloseTo(-143.13, 2);
  });

  it("handles a target straight above, where dy/dx is undefined", () => {
    expect(toDeg(aim(0, 5))).toBe(90);
  });

  it("wraps angles and picks the short way round", () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI, 12);
    expect(toDeg(shortestTurn(Math.PI * 0.9, -Math.PI * 0.9))).toBeCloseTo(36, 9);
  });
});

describe("formatting", () => {
  it("produces nice ticks", () => {
    expect(niceTicks(0, 14, 7)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    expect(niceTicks(0, 150, 6)).toEqual([0, 50, 100, 150]);
  });

  it("formats with a real minus sign", () => {
    expect(signed(-4.9)).toBe("−4.9");
    expect(fmt(3.0)).toBe("3");
  });
});
