// Annotations in screen pixels, placed through the camera so they stay locked
// to the cells they describe: point-paper indices, the repeat outline and its
// dimension line, the weave draft's colour-order chips and the twill line.
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DrawPath, ease, fonts, palettes, springs, tween, useSec } from "../../kit";
import { boxToScreen, toScreen } from "./camera";
import type { Cam } from "./camera";
import { SIZE, T, TILE, WEAVE_BOX, weave } from "./timeline";
import { REPEAT, TWILL, colourOrder, warpDark, weftDark } from "./weave";

const c = palettes.atelier;

const capsText: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: "0.16em",
};

/** Column and row numbers around the point paper, popping in with the grid lines. */
const Indices: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const b = boxToScreen(cam, SIZE, TILE);
  const out = tween(frame, [sec(T.labelsOut), sec(T.labelsOut + 0.25)], [0, 1], ease.in);
  const style = { fontFamily: fonts.mono, fontSize: 14, fontWeight: 500 } as const;
  return (
    <g opacity={1 - out} fill={c.inkMute}>
      {Array.from({ length: REPEAT }, (_, k) => {
        const p = spring({
          frame: frame - sec(T.grid + 0.15 + k * 0.05),
          fps,
          config: springs.snappy,
        });
        const mid = (k + 0.5) * cam.s;
        return (
          <g key={k} opacity={Math.min(1, p * 1.5)}>
            <text x={b.x + mid} y={b.y - 16 + (1 - p) * 8} textAnchor="middle" style={style}>
              {k + 1}
            </text>
            <text
              x={b.x - 16 - (1 - p) * 8}
              y={b.y + mid}
              textAnchor="end"
              dominantBaseline="central"
              style={style}
            >
              {k + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
};

/** The one repeat, outlined in the hero colour, followed through the zoom-out. */
const RepeatOutline: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const b = boxToScreen(cam, SIZE, TILE);
  const p = tween(frame, [sec(T.repeat), sec(T.repeat + 0.7)], [0, 1], ease.inOutSoft);
  const out = tween(frame, [sec(T.field), sec(T.field + 0.3)], [0, 1], ease.in);
  const d = `M ${b.x} ${b.y} H ${b.x + b.w} V ${b.y + b.h} H ${b.x} Z`;
  return (
    <DrawPath d={d} progress={p} stroke={c.hero} width={4} linecap="square" opacity={1 - out} />
  );
};

/** A technical-drawing dimension line under the repeat, drawn out from the middle. */
const Dimension: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const b = boxToScreen(cam, SIZE, TILE);
  const p = tween(frame, [sec(T.repeat + 0.1), sec(T.repeat + 0.6)], [0, 1], ease.inOutSoft);
  const out = tween(frame, [sec(T.labelsOut), sec(T.labelsOut + 0.25)], [0, 1], ease.in);
  const y = b.y + b.h + 30;
  const mid = b.x + b.w / 2;
  const half = (b.w / 2) * p;
  const tick = tween(p, [0.75, 1], [0, 1], ease.out);
  if (p <= 0) return null;
  return (
    <g stroke={c.inkSoft} strokeWidth={1.5} opacity={1 - out}>
      <line x1={mid - half} y1={y} x2={mid + half} y2={y} />
      <line x1={b.x} y1={y - 8 * tick} x2={b.x} y2={y + 8 * tick} />
      <line x1={b.x + b.w} y1={y - 8 * tick} x2={b.x + b.w} y2={y + 8 * tick} />
    </g>
  );
};

/**
 * The weave draft's colour order: a chip above each warp end and beside each
 * weft pick, appearing as that thread arrives.
 */
const Draft: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const b = boxToScreen(cam, SIZE, WEAVE_BOX);
  const out = tween(frame, [sec(T.weaveOut), sec(T.weaveOut + 0.3)], [0, 1], ease.in);
  const w = weave.width * cam.s;
  const inset = (cam.s - w) / 2;
  const n = weave.size;
  const chip = 22;
  const off = 18;
  const pop = (at: number) => spring({ frame: frame - sec(at), fps, config: springs.snappy });
  const label = (at: number) => spring({ frame: frame - sec(at), fps, config: springs.smooth });
  const warpLabel = label(T.warp + 0.2);
  const weftLabel = label(T.weft + 0.1);
  const fill = (dark: boolean) => (dark ? c.ink : c.chalk);
  return (
    <g opacity={1 - out}>
      {Array.from({ length: n }, (_, col) => {
        const p = pop(weave.warpAt(col));
        if (p <= 0.001) return null;
        return (
          <rect
            key={`w${col}`}
            x={b.x + col * cam.s + inset}
            y={b.y - off - chip - (1 - p) * 10}
            width={w}
            height={chip}
            rx={2}
            fill={fill(warpDark(col))}
            stroke={c.line}
            strokeWidth={warpDark(col) ? 0 : 1.5}
            opacity={Math.min(1, p * 1.5)}
          />
        );
      })}
      {Array.from({ length: n }, (_, row) => {
        const p = pop(weave.weftAt(row));
        if (p <= 0.001) return null;
        return (
          <rect
            key={`f${row}`}
            x={b.x - off - chip - (1 - p) * 10}
            y={b.y + row * cam.s + inset}
            width={chip}
            height={w}
            rx={2}
            fill={fill(weftDark(row))}
            stroke={c.line}
            strokeWidth={weftDark(row) ? 0 : 1.5}
            opacity={Math.min(1, p * 1.5)}
          />
        );
      })}
      <text
        x={b.x + inset + (1 - warpLabel) * -16}
        y={b.y - off - chip - 20}
        fill={c.ink}
        opacity={Math.min(1, warpLabel * 1.4)}
        style={capsText}
      >
        {`WARP · ${count(colourOrder())}`}
      </text>
      <text
        transform={`translate(${b.x - off - chip - 20} ${b.y + inset + (1 - weftLabel) * 16}) rotate(-90)`}
        textAnchor="end"
        fill={c.ink}
        opacity={Math.min(1, weftLabel * 1.4)}
        style={capsText}
      >
        {`WEFT · ${count(colourOrder(REPEAT, weftDark))}`}
      </text>
    </g>
  );
};

/** "DDDDLLLL" as words, so the labels are read off the model, not typed in. */
const count = (order: string) => {
  const dark = order.split("").filter((ch) => ch === "D").length;
  return `${dark} DARK · ${order.length - dark} LIGHT`;
};

/** One twill line, drawn along the centre of a diagonal of warp floats. */
const TwillLine: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const p = tween(frame, [sec(T.twill), sec(T.twill + 0.8)], [0, 1], ease.inOutSoft);
  const out = tween(frame, [sec(T.relax), sec(T.relax + 0.25)], [0, 1], ease.in);
  // Warp floats sit where (c - r) mod 4 is 0 or 1, so a band's centre is x - y = 0.5 + 4k.
  const k = TWILL + 0.5;
  const a = toScreen(cam, SIZE, k, 0);
  const z = toScreen(cam, SIZE, weave.size, weave.size - k);
  return (
    <DrawPath
      d={`M ${a.x} ${a.y} L ${z.x} ${z.y}`}
      progress={p}
      stroke={c.hero}
      width={5}
      opacity={1 - out}
    />
  );
};

export const Overlays: React.FC<{ cam: Cam }> = ({ cam }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <g>
      {t >= T.grid && t < T.labelsOut + 0.3 ? <Indices cam={cam} /> : null}
      {t >= T.repeat && t < T.field + 0.35 ? <RepeatOutline cam={cam} /> : null}
      {t >= T.repeat && t < T.labelsOut + 0.3 ? <Dimension cam={cam} /> : null}
      {t >= T.warp && t < T.weaveOut + 0.35 ? <Draft cam={cam} /> : null}
      {t >= T.twill && t < T.relax + 0.3 ? <TwillLine cam={cam} /> : null}
    </g>
  );
};
