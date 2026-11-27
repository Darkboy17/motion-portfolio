import { describe, expect, it } from "vitest";
import {
  REPEAT,
  TILE_PATH,
  cellDark,
  colourOrder,
  darkRuns,
  tile,
  warpUp,
  weftDark,
  weftFloats,
} from "./weave";

const ascii = (m: boolean[][]) => m.map((row) => row.map((d) => (d ? "#" : ".")).join(""));

describe("the houndstooth repeat", () => {
  it("is the classic 8 x 8 tooth", () => {
    expect(ascii(tile())).toEqual([
      "####..##",
      "#####..#",
      "######..",
      "####.##.",
      "##......",
      ".##.....",
      "..##....",
      "#..#....",
    ]);
  });

  it("is half dark, and is not a checkerboard", () => {
    const cells = tile().flat();
    expect(cells.filter(Boolean)).toHaveLength(32);
    const checker = tile().map((row, r) => row.map((_, c) => r < 4 === c < 4));
    expect(ascii(tile())).not.toEqual(ascii(checker));
  });

  it("repeats every 8 cells both ways, including negative cells", () => {
    for (let r = -16; r < 16; r++) {
      for (let c = -16; c < 16; c++) {
        expect(cellDark(r + REPEAT, c)).toBe(cellDark(r, c));
        expect(cellDark(r, c + REPEAT)).toBe(cellDark(r, c));
      }
    }
  });
});

describe("the weave", () => {
  it("uses 4 dark, 4 light in the warp and in the weft", () => {
    expect(colourOrder()).toBe("DDDDLLLL");
    expect(colourOrder(REPEAT, weftDark)).toBe("DDDDLLLL");
  });

  it("is a 2/2 twill that steps one end per pick", () => {
    for (let r = 0; r < 8; r++) {
      const row = Array.from({ length: 8 }, (_, c) => (warpUp(r, c) ? "x" : "-")).join("");
      expect(row.match(/x/g)).toHaveLength(4);
      for (let c = 0; c < 8; c++) expect(warpUp(r + 1, c + 1)).toBe(warpUp(r, c));
    }
  });

  it("floats the weft over exactly two warps, shifting by one each row", () => {
    const starts: number[] = [];
    for (let r = 0; r < 4; r++) {
      const floats = weftFloats(r, 0, 16).filter((f) => f.a > 0 && f.b < 16);
      for (const f of floats) expect(f.b - f.a).toBe(2);
      starts.push(floats[0].a);
    }
    expect(starts).toEqual([2, 3, 4, 1]);
  });

  it("merges dark cells into runs that cover them exactly", () => {
    const bounds = { r0: -4, r1: 12, c0: -4, c1: 12 };
    const covered = new Set<string>();
    for (const run of darkRuns(bounds)) {
      for (let c = run.c0; c < run.c1; c++) covered.add(`${run.r},${c}`);
    }
    for (let r = bounds.r0; r < bounds.r1; r++) {
      for (let c = bounds.c0; c < bounds.c1; c++) {
        expect(covered.has(`${r},${c}`)).toBe(cellDark(r, c));
      }
    }
    expect(TILE_PATH.startsWith("M0 0h4v1h-4z")).toBe(true);
  });
});
