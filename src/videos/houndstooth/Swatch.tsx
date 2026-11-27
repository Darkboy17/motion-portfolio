// The colourway card: a swatch of the repeat drawn from the model, the colour
// pair as chips, and the colourway's name, which rolls over on each cut.
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  breathe,
  enterStyle,
  fonts,
  palettes,
  springs,
  useExit,
  useSec,
  useSpring,
} from "../../kit";
import type { Colourway } from "./timeline";
import { Caps, Roll, alpha } from "./Type";
import { REPEAT, TILE_PATH } from "./weave";

const c = palettes.atelier;
const CHIP = 80;

const NAME: React.CSSProperties = {
  fontFamily: fonts.serif,
  fontStyle: "italic",
  fontWeight: 400,
  fontSize: 42,
  lineHeight: 1.05,
  color: c.ink,
};

/** One repeat at swatch size: exactly 10 px a cell, so it stays crisp. */
const MiniTile: React.FC<{ way: Colourway; scale: number }> = ({ way, scale }) => (
  <svg
    width={CHIP}
    height={CHIP}
    viewBox={`0 0 ${REPEAT} ${REPEAT}`}
    shapeRendering="crispEdges"
    style={{ transform: `scale(${scale})`, display: "block" }}
  >
    <rect width={REPEAT} height={REPEAT} fill={way.light} />
    <path d={TILE_PATH} fill={way.dark} />
  </svg>
);

const Chip: React.FC<{ color: string; scale: number }> = ({ color, scale }) => (
  <div
    style={{
      width: 22,
      height: 22,
      background: color,
      boxShadow: `inset 0 0 0 1px ${alpha(c.ink, 0.12)}`,
      transform: `scale(${scale})`,
    }}
  />
);

export const Swatch: React.FC<{
  ways: Colourway[];
  /** When each colourway becomes current, in seconds. */
  times: readonly number[];
  at: number;
  exitAt: number;
  style?: React.CSSProperties;
}> = ({ ways, times, at, exitAt, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const p = useSpring(sec(at), "smooth");
  const exit = useExit(exitAt, 0.3);
  const t = frame / fps;
  const current = times.reduce((acc, time, i) => (t >= time ? i : acc), 0);
  const way = ways[current];
  const stamp = spring({ frame: frame - sec(times[current]), fps, config: springs.bouncy });
  const chipScale = current === 0 ? 1 : 0.82 + 0.18 * stamp;
  if (p <= 0.001 || exit >= 1) return null;
  return (
    <div style={{ position: "absolute", ...enterStyle(p, exit, { dx: -40, dy: 0 }), ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: 18,
          paddingRight: 30,
          background: c.surface,
          borderRadius: 3,
          boxShadow: `0 26px 50px -22px ${alpha(c.ink, 0.6)}, 0 2px 6px ${alpha(c.ink, 0.14)}`,
          transform: `translateY(${breathe(frame, 120, 2)}px)`,
        }}
      >
        <div style={{ boxShadow: `0 0 0 1px ${alpha(c.ink, 0.1)}` }}>
          <MiniTile way={way} scale={chipScale} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 236 }}>
          <Caps size={15} color={c.inkMute}>
            Colourway {String(current + 1).padStart(2, "0")} /{" "}
            {String(ways.length).padStart(2, "0")}
          </Caps>
          <Roll
            height={46}
            items={ways.map((w, i) => ({
              at: times[i],
              node: <div style={NAME}>{w.name}</div>,
            }))}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Chip color={way.dark} scale={chipScale} />
            <Chip color={way.light} scale={chipScale} />
            <Caps size={14} color={c.inkSoft} style={{ marginLeft: 6 }}>
              {way.pair}
            </Caps>
          </div>
        </div>
      </div>
    </div>
  );
};
