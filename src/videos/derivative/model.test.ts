import { describe, expect, it } from "vitest";
import { derivative } from "../../kit";
import { GAPS, kmh, numbers, peakT, s, secant, v } from "./model";

describe("the car", () => {
  it("covers 150 m in 10 s and ends at rest", () => {
    expect(s(10)).toBeCloseTo(150, 9);
    expect(v(10)).toBeCloseTo(0, 9);
  });

  it("has the power-rule speed matching a numerical derivative", () => {
    for (const t of [0.5, 2, 5, 8.5]) expect(v(t)).toBeCloseTo(derivative(s, t), 6);
  });

  it("peaks at 5 s and 81 km/h", () => {
    expect(peakT).toBeCloseTo(5, 12);
    expect(kmh(v(peakT))).toBeCloseTo(81, 9);
  });

  it("has secant slopes that fall towards the instant speed", () => {
    const slopes = GAPS.map((g) => secant(g).slope);
    for (let i = 1; i < slopes.length; i++) expect(slopes[i]).toBeLessThan(slopes[i - 1]);
    expect(slopes.at(-1)).toBeCloseTo(14.4, 1);
    expect(numbers.avg).toBe("20.4");
    expect(numbers.instant).toBe("14.4");
  });
});
