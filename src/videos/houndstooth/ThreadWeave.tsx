// The weave as threads, in world units inside the camera group. Warp ends run
// down the columns, weft picks run across the rows, and wherever the model says
// the weft is up, a float lies over the warp. When `relax` reaches 1 the threads
// are exactly the flat cells, which is the point: the weave is the pattern.
import React from "react";
import { palettes } from "../../kit";
import { warpDark, weftDark, weftFloats } from "./weave";
import type { Bounds } from "./weave";

const c = palettes.atelier;

export const SHEEN_X = "ht-sheen-x";
export const SHEEN_Y = "ht-sheen-y";
export const DIP = "ht-dip";
export const THREAD_SHADOW = "ht-thread-shadow";

/** Gradients that round the threads, and the shadow a thread casts on what is under it. */
export const ThreadDefs: React.FC<{ shadow: number }> = ({ shadow }) => {
  const round = (id: string, vertical: boolean) => (
    <linearGradient id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2={vertical ? "1" : "0"}>
      <stop offset="0" stopColor={c.ink} stopOpacity={0.34} />
      <stop offset="0.3" stopColor={c.chalk} stopOpacity={0.06} />
      <stop offset="0.5" stopColor={c.chalk} stopOpacity={0.16} />
      <stop offset="0.7" stopColor={c.chalk} stopOpacity={0.04} />
      <stop offset="1" stopColor={c.ink} stopOpacity={0.38} />
    </linearGradient>
  );
  return (
    <>
      {round(SHEEN_X, false)}
      {round(SHEEN_Y, true)}
      <linearGradient id={DIP} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor={c.ink} stopOpacity={0.42} />
        <stop offset="0.2" stopColor={c.ink} stopOpacity={0} />
        <stop offset="0.8" stopColor={c.ink} stopOpacity={0} />
        <stop offset="1" stopColor={c.ink} stopOpacity={0.42} />
      </linearGradient>
      <filter id={THREAD_SHADOW} x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow
          dx={0.03}
          dy={0.07}
          stdDeviation={0.07}
          floodColor={c.ink}
          floodOpacity={shadow}
        />
      </filter>
    </>
  );
};

type Span = { x0: number; x1: number };

/** The visible part of [x0, x1] once the pick has travelled `p` of the way across. */
const shot = (span: Span, b: Bounds, p: number, leftToRight: boolean): Span | null => {
  const front = leftToRight ? b.c0 + p * (b.c1 - b.c0) : b.c1 - p * (b.c1 - b.c0);
  const x0 = leftToRight ? span.x0 : Math.max(span.x0, front);
  const x1 = leftToRight ? Math.min(span.x1, front) : span.x1;
  return x1 - x0 > 0.001 ? { x0, x1 } : null;
};

export const ThreadWeave: React.FC<{
  bounds: Bounds;
  dark: string;
  light: string;
  /** The loom showing between threads. */
  gap: string;
  /** Width of a thread as a share of a cell, before relaxing. */
  width: number;
  /** 0 to 1 per warp end: how far it has dropped down its column. */
  warp: (col: number) => number;
  /** 0 to 1 per weft pick: how far it has shot across its row. */
  weft: (row: number) => number;
  /** 0 = round threads with gaps, 1 = flat cells. */
  relax: number;
  /** How much of the loom has been revealed, from the top, in rows. */
  loom: number;
}> = ({ bounds: b, dark, light, gap, width, warp, weft, relax, loom }) => {
  const w = width + (1 - width) * relax;
  const inset = (1 - w) / 2;
  const rx = 0.36 * w * (1 - relax);
  const shade = 1 - relax;
  // A float overlaps the warp ends either side of it by a hair, so its rounded
  // ends tuck over the gap rather than stopping short of the warp.
  const tuck = 0.3 * (1 - w);
  const cols = Array.from({ length: b.c1 - b.c0 }, (_, i) => b.c0 + i);
  const rows = Array.from({ length: b.r1 - b.r0 }, (_, i) => b.r0 + i);
  const height = b.r1 - b.r0;
  const colour = (isDark: boolean) => (isDark ? dark : light);

  const picks = rows.map((r) => {
    const p = weft(r);
    if (p <= 0) return null;
    const ltr = (r - b.r0) % 2 === 0;
    const under = shot({ x0: b.c0, x1: b.c1 }, b, p, ltr);
    const floats = weftFloats(r, b.c0, b.c1)
      .map((f) =>
        shot(
          {
            x0: f.a === b.c0 ? b.c0 : f.a + inset - tuck,
            x1: f.b === b.c1 ? b.c1 : f.b - inset + tuck,
          },
          b,
          p,
          ltr,
        ),
      )
      .filter((s): s is Span => s !== null);
    return { r, under, floats, fill: colour(weftDark(r)) };
  });

  return (
    <g>
      {/* Bleeds past the plate (the crop trims it) so no flat cell peeks out at the edges. */}
      <rect
        x={b.c0 - 0.25}
        y={b.r0 - 0.25}
        width={b.c1 - b.c0 + 0.5}
        height={loom >= height ? height + 0.5 : loom + 0.25}
        fill={gap}
        shapeRendering="crispEdges"
      />
      {/* Weft picks where they pass under the warp: seen only between the ends. */}
      <g>
        {picks.map((pk) =>
          pk && pk.under ? (
            <g key={pk.r}>
              <rect
                x={pk.under.x0}
                y={pk.r + inset}
                width={pk.under.x1 - pk.under.x0}
                height={w}
                rx={rx}
                fill={pk.fill}
              />
              <rect
                x={pk.under.x0}
                y={pk.r + inset}
                width={pk.under.x1 - pk.under.x0}
                height={w}
                rx={rx}
                fill={`url(#${SHEEN_Y})`}
                opacity={shade}
              />
            </g>
          ) : null,
        )}
      </g>
      {/* Warp ends, casting a shadow on the picks beneath them. */}
      <g filter={shade > 0.01 ? `url(#${THREAD_SHADOW})` : undefined}>
        {cols.map((col) => {
          const q = warp(col);
          if (q <= 0) return null;
          const len = height * q;
          return (
            <g key={col}>
              <rect
                x={col + inset}
                y={b.r0}
                width={w}
                height={len}
                rx={rx}
                fill={colour(warpDark(col))}
              />
              <rect
                x={col + inset}
                y={b.r0}
                width={w}
                height={len}
                rx={rx}
                fill={`url(#${SHEEN_X})`}
                opacity={shade}
              />
            </g>
          );
        })}
      </g>
      {/* Weft floats: over two ends, then down under the next two. */}
      <g filter={shade > 0.01 ? `url(#${THREAD_SHADOW})` : undefined}>
        {picks.map((pk) =>
          pk
            ? pk.floats.map((f, i) => (
                <g key={`${pk.r}:${i}`}>
                  <rect
                    x={f.x0}
                    y={pk.r + inset}
                    width={f.x1 - f.x0}
                    height={w}
                    rx={rx}
                    fill={pk.fill}
                  />
                  <rect
                    x={f.x0}
                    y={pk.r + inset}
                    width={f.x1 - f.x0}
                    height={w}
                    rx={rx}
                    fill={`url(#${SHEEN_Y})`}
                    opacity={shade}
                  />
                  <rect
                    x={f.x0}
                    y={pk.r + inset}
                    width={f.x1 - f.x0}
                    height={w}
                    rx={rx}
                    fill={`url(#${DIP})`}
                    opacity={shade}
                  />
                </g>
              ))
            : null,
        )}
      </g>
    </g>
  );
};
