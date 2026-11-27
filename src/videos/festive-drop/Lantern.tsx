// The Loom & Lantern mark: a hanging lantern that draws itself on and then
// lights from within. The same drawing, small, sits in the top lockup, where
// its flame pulses with the kick.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { DrawPath, ease, fonts, tween, useExit, useSec, useSpring } from "../../kit";
import { staggerP } from "./garments/geometry";
import { fd, mix } from "./palette";
import { BEAT, T } from "./timeline";

// Drawn in a 200 x 340 box; the flame sits at the body's centre, 100, 176.
const PARTS = [
  "M 100 7 A 13 13 0 1 1 99.99 7",
  "M 100 33 L 100 52",
  "M 62 84 C 62 64 82 52 100 52 C 118 52 138 64 138 84",
  "M 50 86 L 150 86",
  "M 62 94 L 138 94 L 164 176 L 138 258 L 62 258 L 36 176 Z",
  "M 81 94 C 64 132 64 220 81 258",
  "M 119 94 C 136 132 136 220 119 258",
  "M 36 176 L 164 176",
  "M 52 266 L 148 266",
  "M 72 270 L 128 270 L 118 290 L 82 290 Z",
  "M 100 290 L 100 306",
  "M 92 306 L 108 306 L 105 336 L 95 336 Z",
];
const BODY = PARTS[4];
const FLAME = "M 100 144 C 114 162 116 182 100 200 C 84 182 86 162 100 144 Z";

export const Lantern: React.FC<{
  /** Draw-on progress, 0 to 1. */
  draw: number;
  /** How lit it is, 0 to 1. */
  light: number;
  /** Flame flicker, a small signed number. */
  flicker?: number;
  width?: number;
  stroke?: number;
  ink?: string;
  /** The halo around a lit lantern; off for the small lockup glyph. */
  halo?: boolean;
}> = ({ draw, light, flicker = 0, width = 200, stroke = 5, ink = fd.ink, halo = true }) => {
  const h = (width / 200) * 340;
  const glow = light * (0.92 + flicker * 0.08);
  return (
    <svg width={width} height={h} viewBox="0 0 200 340" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id={`lantern-glow-${width}`}>
          <stop offset="0%" stopColor={fd.saffron} stopOpacity={0.55} />
          <stop offset="55%" stopColor={fd.saffron} stopOpacity={0.16} />
          <stop offset="100%" stopColor={fd.saffron} stopOpacity={0} />
        </radialGradient>
      </defs>
      {halo && light > 0 ? (
        <circle
          cx={100}
          cy={176}
          r={230 * (0.9 + 0.1 * glow)}
          fill={`url(#lantern-glow-${width})`}
          opacity={glow}
        />
      ) : null}
      <path d={BODY} fill={mix(fd.saffron, fd.chalk, 0.5)} opacity={light * 0.95} />
      <path
        d="M 81 94 C 64 132 64 220 81 258 L 119 258 C 136 220 136 132 119 94 Z"
        fill={mix(fd.saffron, fd.chalk, 0.72)}
        opacity={light}
      />
      <path
        d={FLAME}
        fill={fd.saffron}
        opacity={light}
        transform={`translate(100 200) scale(${0.9 + 0.1 * glow} ${0.92 + 0.12 * glow}) translate(-100 -200)`}
      />
      {PARTS.map((d, i) => (
        <DrawPath
          key={d}
          d={d}
          progress={staggerP(draw, i, PARTS.length, 3)}
          stroke={ink}
          width={stroke}
        />
      ))}
    </svg>
  );
};

/** The small brand lockup at the top of the frame. Its flame pulses on every beat once the kick is in. */
export const Lockup: React.FC<{ at: number; exitAt: number }> = ({ at, exitAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const p = useSpring(sec(at), "smooth");
  const exit = useExit(exitAt);
  const t = frame / fps;
  const sinceBeat = t >= T.looks ? ((t - T.looks) % BEAT) / BEAT : 1;
  const pulse = Math.exp(-sinceBeat * 5);
  const draw = tween(frame, [sec(at), sec(at + 0.9)], [0, 1], ease.inOutSoft);
  return (
    <div
      style={{
        position: "absolute",
        top: 226,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        opacity: Math.min(p * 1.4, 1) * (1 - exit),
        transform: `translateY(${(1 - p) * -18 - exit * 14}px)`,
      }}
    >
      <Lantern draw={draw} light={0.55 + 0.45 * pulse} width={30} stroke={13} halo={false} />
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 800,
          fontSize: 25,
          letterSpacing: "0.3em",
          marginRight: "-0.3em",
          color: fd.ink,
          whiteSpace: "nowrap",
        }}
      >
        LOOM &amp; LANTERN
      </div>
    </div>
  );
};
