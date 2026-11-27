// The flat views of the pattern, all in world units (cells) inside the camera
// group: the point-paper build of one repeat, and the tiled field.
//
// Flat cells are drawn with crispEdges, so cells and tiles that touch never
// show an anti-aliased seam, at any zoom.
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, palettes, springs, tween, useSec } from "../../kit";
import type { Box } from "./camera";
import { RING_DUR, RING_STEP, T, fillAt, ringAt } from "./timeline";
import { REPEAT, TILE_PATH, diagonal, tile } from "./weave";

const c = palettes.atelier;

export const TILE_ID = "ht-tile";

/** One repeat's dark cells, defined once and reused by every tile. */
export const TileDef: React.FC = () => <path id={TILE_ID} d={TILE_PATH} />;

export type TileState = { i: number; j: number; dx: number; dy: number };

/** A field of repeats: each tile is a light square with the shared dark path on top. */
export const PatternField: React.FC<{ tiles: TileState[]; dark: string; light: string }> = ({
  tiles,
  dark,
  light,
}) => (
  <g shapeRendering="crispEdges">
    {tiles.map((t) => (
      <g
        key={`${t.i},${t.j}`}
        transform={`translate(${t.i * REPEAT + t.dx} ${t.j * REPEAT + t.dy})`}
      >
        <rect width={REPEAT} height={REPEAT} fill={light} />
        <use href={`#${TILE_ID}`} fill={dark} />
      </g>
    ))}
  </g>
);

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * Which tiles are on screen at `t`, and where. New rings slide out from under
 * the ring inside them, so the repeat visibly multiplies outwards.
 */
export const fieldTiles = (t: number, view: Box): TileState[] => {
  const i0 = Math.floor(view.x / REPEAT);
  const i1 = Math.ceil((view.x + view.w) / REPEAT);
  const j0 = Math.floor(view.y / REPEAT);
  const j1 = Math.ceil((view.y + view.h) / REPEAT);
  const out: (TileState & { ring: number })[] = [];
  for (let j = j0; j < j1; j++) {
    for (let i = i0; i < i1; i++) {
      const ring = Math.max(Math.abs(i), Math.abs(j));
      if (ring >= ringAt.length) continue;
      // Clockwise from the top-left corner of the ring.
      const turn = (Math.atan2(j, i) + (Math.PI * 3) / 4 + Math.PI * 2) % (Math.PI * 2);
      const order = ring === 0 ? 0 : (turn / (Math.PI * 2)) * 8 * ring;
      const start = ringAt[ring] + order * RING_STEP[ring];
      const p = ring === 0 ? 1 : ease.out(clamp01((t - start) / RING_DUR));
      if (p <= 0) continue;
      const back = ring === 0 ? 0 : (REPEAT / ring) * (1 - p);
      // No fade needed: every new tile starts hidden under the ring inside it.
      out.push({ i, j, ring, dx: -i * back, dy: -j * back });
    }
  }
  // Outer rings first, so each ring slides out from under the one inside it.
  return out.sort((a, b) => b.ring - a.ring);
};

/** The colourway sweep's front: every cell with r + c < k, as one path of row strips. */
export const sweepPath = (view: Box, k: number) => {
  const r0 = Math.floor(view.y);
  const r1 = Math.ceil(view.y + view.h);
  const c0 = Math.floor(view.x);
  let d = "";
  for (let r = r0; r < r1; r++) {
    const end = k - r;
    if (end > c0) d += `M${c0} ${r}H${end}V${r + 1}H${c0}Z`;
  }
  return d;
};

/**
 * Point paper: a chalk plate, a grid that draws on line by line, and the dark
 * cells of one repeat filling in a diagonal sweep. The first cell is the square
 * that drops in on the title card.
 */
export const CellGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const plate = tween(frame, [sec(T.grid), sec(T.grid + 0.6)], [0, 1], ease.out);
  const linesOut = tween(frame, [sec(T.labelsOut), sec(T.labelsOut + 0.3)], [0, 1], ease.in);
  const drop = spring({ frame: frame - sec(T.drop), fps, config: springs.snappy });
  const ring = tween(frame, [sec(T.land), sec(T.land + 0.6)], [0, 1], ease.out);
  // Once the dropped square has settled it becomes an ordinary crisp cell, so it
  // never shows an anti-aliased seam against its neighbours when the camera moves.
  const landed = frame >= sec(T.land + 0.6);
  const lines = Array.from({ length: REPEAT + 1 }, (_, k) => k);
  const lineDraw = (k: number, offset: number) =>
    tween(
      frame,
      [sec(T.grid + offset + k * 0.05), sec(T.grid + offset + k * 0.05 + 0.6)],
      [0, REPEAT],
      ease.inOutSoft,
    );
  const ps = 1 - 0.03 * (1 - plate);
  return (
    <g>
      <g
        shapeRendering="crispEdges"
        opacity={plate}
        transform={`translate(${REPEAT / 2} ${REPEAT / 2}) scale(${ps}) translate(${-REPEAT / 2} ${-REPEAT / 2})`}
      >
        <rect width={REPEAT} height={REPEAT} fill={c.chalk} />
      </g>
      <g shapeRendering="crispEdges" opacity={1 - linesOut}>
        {lines.map((k) => {
          const edge = k === 0 || k === REPEAT;
          const stroke = edge ? c.inkMute : c.line;
          const width = edge ? 1.5 : 1;
          return (
            <g key={k}>
              <line
                x1={k}
                y1={0}
                x2={k}
                y2={lineDraw(k, 0)}
                stroke={stroke}
                strokeWidth={width}
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={0}
                y1={k}
                x2={lineDraw(k, 0.025)}
                y2={k}
                stroke={stroke}
                strokeWidth={width}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          );
        })}
      </g>
      <g shapeRendering="crispEdges">
        {tile().map((row, r) =>
          row.map((dark, col) => {
            const seed = r === 0 && col === 0;
            if (!dark || (seed && !landed)) return null;
            const p = seed
              ? 1
              : spring({
                  frame: frame - sec(fillAt(diagonal(r, col))),
                  fps,
                  config: springs.snappy,
                });
            if (p <= 0.001) return null;
            const s = Math.min(p, 1.12);
            return (
              <rect
                key={`${r},${col}`}
                x={col + 0.5 - s / 2}
                y={r + 0.5 - s / 2}
                width={s}
                height={s}
                fill={c.ink}
                opacity={Math.min(1, p * 2)}
              />
            );
          }),
        )}
      </g>
      {ring > 0 && ring < 1 ? (
        <rect
          x={0.5 - (0.5 + ring * 0.9)}
          y={0.5 - (0.5 + ring * 0.9)}
          width={1 + ring * 1.8}
          height={1 + ring * 1.8}
          fill="none"
          stroke={c.inkSoft}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
          opacity={(1 - ring) * 0.8}
        />
      ) : null}
      {drop > 0.001 && !landed ? (
        <g
          transform={`translate(0.5 0.5) rotate(${(1 - drop) * -14}) scale(${2.4 - 1.4 * drop}) translate(-0.5 -0.5)`}
          opacity={Math.min(1, drop * 2.5)}
        >
          <rect width={1} height={1} fill={c.ink} />
        </g>
      ) : null}
    </g>
  );
};
