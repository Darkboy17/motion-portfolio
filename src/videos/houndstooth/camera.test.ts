import { describe, expect, it } from "vitest";
import { boxToScreen, frameBox, mixCam, toScreen, track } from "./camera";
import { SIZE, TILE, WEAVE_BOX, camera, shots } from "./timeline";

describe("the camera", () => {
  it("places a world box exactly on a screen box", () => {
    const cam = frameBox({ x: 0, y: 0, w: 8, h: 8 }, { x: 300, y: 360, w: 480, h: 480 }, SIZE);
    expect(boxToScreen(cam, SIZE, { x: 0, y: 0, w: 8, h: 8 })).toEqual({
      x: 300,
      y: 360,
      w: 480,
      h: 480,
    });
  });

  it("zooms in log space, so the halfway scale is the geometric mean", () => {
    const mid = mixCam({ x: 0, y: 0, s: 20 }, { x: 0, y: 0, s: 80 }, 0.5);
    expect(mid.s).toBeCloseTo(40, 6);
  });

  it("holds each key once its move is done, and starts from the first value", () => {
    const tr = track(
      0,
      [{ at: 1, dur: 1, value: 10 }],
      (a, b, t) => a + (b - a) * t,
      (t) => t,
    );
    expect(tr(0)).toBe(0);
    expect(tr(1.5)).toBe(5);
    expect(tr(9)).toBe(10);
  });

  it("puts every cell edge on a whole pixel in the framings that hold still", () => {
    const framings = [
      { cam: shots.plate, box: TILE },
      { cam: shots.tile3, box: TILE },
      { cam: shots.tile5, box: TILE },
      { cam: shots.weave, box: WEAVE_BOX },
    ];
    for (const { cam, box } of framings) {
      for (let k = 0; k <= box.w; k++) {
        const p = toScreen(cam, SIZE, k, k);
        expect(Math.abs(p.x - Math.round(p.x))).toBeLessThan(1e-6);
        expect(Math.abs(p.y - Math.round(p.y))).toBeLessThan(1e-6);
      }
    }
  });

  it("opens and closes on the same framing, so the piece loops", () => {
    expect(camera(0)).toEqual(shots.plate);
    expect(camera(24)).toEqual(shots.plate);
  });
});
