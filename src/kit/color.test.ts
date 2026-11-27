import { describe, expect, it } from "vitest";
import { alpha, mix } from "./color";

describe("colour helpers", () => {
  it("writes a token at an opacity", () => {
    expect(alpha("#12A15A", 0.5)).toBe("rgba(18, 161, 90, 0.5)");
  });

  it("mixes two tokens and clamps the amount", () => {
    expect(mix("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(mix("#102030", "#ffffff", 0)).toBe("#102030");
    expect(mix("#102030", "#ffffff", 2)).toBe("#ffffff");
  });
});
