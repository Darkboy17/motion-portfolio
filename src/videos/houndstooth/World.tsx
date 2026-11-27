// The pattern layer: one SVG, one camera, one world. The point paper, the tiled
// field, the colourway sweeps and the thread diagram are all drawn in cell units
// inside the camera group; annotations are placed through the same camera.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ease, palettes, tween, useSec } from "../../kit";
import { boxToScreen, camTransform, intersect, viewBox } from "./camera";
import type { Box } from "./camera";
import { Overlays } from "./Overlays";
import { CellGrid, PatternField, TileDef, fieldTiles, sweepPath } from "./Pattern";
import { ThreadDefs, ThreadWeave } from "./ThreadWeave";
import { COLOURWAYS, SIZE, SWEEPS, SWEEP_DUR, T, TILE, camera, region, weave } from "./timeline";
import { alpha } from "./Type";

const c = palettes.atelier;
const REGION = "ht-region";
const SWEEP = "ht-sweep";
const PLATE_SHADOW = "ht-plate-shadow";

/** Which colourway the field shows, and how far the next one has swept across it. */
const colourAt = (t: number) => {
  let base = 0;
  let top = 0;
  let p = 1;
  for (const s of SWEEPS) {
    if (t < s.at) break;
    base = top;
    top = s.to;
    p = ease.inOutSoft(Math.min(1, (t - s.at) / SWEEP_DUR));
  }
  return p >= 1 ? { base: top, top, p: 1 } : { base, top, p };
};

/** The soft shadow of the plate on the paper, wherever the crop is smaller than the frame. */
const PlateShadow: React.FC<{ box: Box; opacity: number }> = ({ box, opacity }) => {
  const bleed = 60;
  const coversFrame =
    box.x < -bleed &&
    box.y < -bleed &&
    box.x + box.w > SIZE + bleed &&
    box.y + box.h > SIZE + bleed;
  if (opacity <= 0.001 || coversFrame) return null;
  return (
    <rect
      x={box.x}
      y={box.y + 14}
      width={box.w}
      height={box.h}
      fill={alpha(c.ink, 0.34)}
      filter={`url(#${PLATE_SHADOW})`}
      opacity={opacity}
    />
  );
};

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const cam = camera(t);
  const reg = region(t);
  const view = intersect(viewBox(cam, SIZE), reg);

  const range = (a: number, d: number, easing = ease.out) =>
    tween(frame, [sec(a), sec(a + d)], [0, 1], easing);
  const relax = range(T.relax, T.relaxEnd - T.relax, ease.inOut);

  // The plate's shadow: in with the point paper, out as the field takes over,
  // and back whenever the crop frames a plate again.
  const shadowBox = boxToScreen(cam, SIZE, t < T.weave ? TILE : reg);
  const shadowOpacity =
    t < T.tile3 ? range(T.grid, 0.6) : t < T.weave ? 1 - range(T.tile3, 0.3, ease.in) : 1;

  const showGrid = t < T.tile3 + 0.35;
  const showField = t >= T.tile3;
  const showThreads = t >= T.warp - 0.1 && t < T.relaxEnd;
  const tiles = showField ? fieldTiles(t, view) : [];
  const way = colourAt(t);
  const k0 = Math.floor(view.x) + Math.floor(view.y);
  const k1 = Math.ceil(view.x + view.w) + Math.ceil(view.y + view.h);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ position: "absolute", left: 0, top: 0 }}
    >
      <defs>
        <TileDef />
        <ThreadDefs shadow={0.55 * (1 - relax)} />
        <filter id={PLATE_SHADOW} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
        <clipPath id={REGION}>
          <rect x={reg.x} y={reg.y} width={reg.w} height={reg.h} />
        </clipPath>
        {way.p < 1 ? (
          <clipPath id={SWEEP}>
            <path d={sweepPath(view, k0 + (k1 - k0) * way.p)} />
          </clipPath>
        ) : null}
      </defs>

      <PlateShadow box={shadowBox} opacity={shadowOpacity} />

      <g transform={camTransform(cam, SIZE)}>
        <g clipPath={`url(#${REGION})`}>
          {showField ? (
            <PatternField
              tiles={tiles}
              dark={COLOURWAYS[way.base].dark}
              light={COLOURWAYS[way.base].light}
            />
          ) : null}
          {showField && way.p < 1 ? (
            <g clipPath={`url(#${SWEEP})`}>
              <PatternField
                tiles={tiles}
                dark={COLOURWAYS[way.top].dark}
                light={COLOURWAYS[way.top].light}
              />
            </g>
          ) : null}
          {showThreads ? (
            <ThreadWeave
              bounds={{ r0: 0, r1: weave.size, c0: 0, c1: weave.size }}
              dark={COLOURWAYS[0].dark}
              light={COLOURWAYS[0].light}
              gap={c.inkSoft}
              width={weave.width}
              warp={(col) => range(weave.warpAt(col), weave.warpDur)}
              weft={(row) => range(weave.weftAt(row), weave.weftDur, ease.inOutSoft)}
              relax={relax}
              loom={weave.size * range(T.warp - 0.1, 0.45)}
            />
          ) : null}
        </g>
        {showGrid ? <CellGrid /> : null}
      </g>

      <Overlays cam={cam} />
    </svg>
  );
};
