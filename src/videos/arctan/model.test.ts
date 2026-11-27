import { describe, expect, it } from "vitest";
import {
  ABOVE_TARGET,
  MIRROR_TARGET,
  TRIANGLE_TARGET,
  aimDeg,
  deg,
  naiveDeg,
  rightHalfPath,
  simulateMissile,
} from "./model";

describe("aiming", () => {
  it("gives 36.9 degrees for a target at (4, 3)", () => {
    expect(deg(aimDeg(TRIANGLE_TARGET))).toBe("36.9°");
  });

  it("shows the quadrant bug at (-4, -3)", () => {
    expect(naiveDeg(MIRROR_TARGET)).toBeCloseTo(naiveDeg(TRIANGLE_TARGET), 12);
    expect(deg(aimDeg(MIRROR_TARGET))).toBe("−143.1°");
  });

  it("aims straight up when dx is zero", () => {
    expect(aimDeg(ABOVE_TARGET)).toBe(90);
  });

  it("keeps the tracking path right of the turret", () => {
    for (let k = 0; k < 20; k += 0.1) expect(rightHalfPath(k).x).toBeGreaterThan(0);
  });
});

describe("homing missile", () => {
  it("reaches a target circling the arena", () => {
    const m = simulateMissile({
      from: { x: 0, y: 0 },
      heading: 0,
      launch: 0,
      until: 6,
      target: (t) => ({ x: 4 * Math.cos(t), y: 3 * Math.sin(t) }),
    });
    expect(m.hitAt).not.toBeNull();
    expect(m.hitAt!).toBeLessThan(4);
  });
});
