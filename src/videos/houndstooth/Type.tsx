// Editorial type for the pattern study: small-caps labels, a letter reveal for
// the title, and paper tags that sit on top of the fabric.
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  breathe,
  ease,
  enterStyle,
  fonts,
  palettes,
  springs,
  timing,
  tween,
  useExit,
  useSec,
  useSpring,
  alpha,
} from "../../kit";

const c = palettes.atelier;

export { alpha };

/** Manrope small caps: the label voice of the piece. */
export const Caps: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, color = c.inkSoft, size = 18, style }) => (
  <div
    style={{
      fontFamily: fonts.sans,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/**
 * Letters rise out of a slot one by one, and leave upwards faster than they came.
 * The slot is padded so italic overhangs and descenders are not clipped.
 */
export const LetterReveal: React.FC<{
  text: string;
  at: number;
  exitAt?: number;
  per?: number;
  size: number;
  style?: React.CSSProperties;
}> = ({ text, at, exitAt, per = 0.035, size, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const pad = { x: size * 0.14, top: size * 0.1, bottom: size * 0.26 };
  return (
    <div
      style={{
        display: "flex",
        overflow: "hidden",
        padding: `${pad.top}px ${pad.x}px ${pad.bottom}px`,
        margin: `${-pad.top}px ${-pad.x}px ${-pad.bottom}px`,
        fontSize: size,
        lineHeight: 1,
        ...style,
      }}
    >
      {[...text].map((ch, i) => {
        const p = spring({ frame: frame - sec(at + i * per), fps, config: springs.smooth });
        const outAt = exitAt === undefined ? undefined : exitAt + i * per * 0.4;
        const out =
          outAt === undefined
            ? 0
            : tween(frame, [sec(outAt), sec(outAt + timing.exit)], [0, 1], ease.in);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: Math.min(1, p * 1.6) * (1 - out),
              transform: `translateY(${(1 - p) * size * 0.95 - out * size * 0.6}px) rotate(${(1 - p) * 5}deg)`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

/** A paper label laid on the fabric: rises in with a snap, breathes, leaves quickly. */
export const Tag: React.FC<{
  at: number;
  exitAt?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at, exitAt, style, children }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const p = useSpring(sec(at), "snappy");
  const exit = useExit(exitAt, 0.3);
  if (p <= 0.001 || exit >= 1) return null;
  return (
    <div
      style={{ position: "absolute", ...enterStyle(p, exit, { dy: 18, scale: 0.94 }), ...style }}
    >
      <div
        style={{
          background: c.surface,
          borderRadius: 3,
          padding: "16px 22px 15px",
          boxShadow: `0 22px 44px -20px ${alpha(c.ink, 0.55)}, 0 2px 6px ${alpha(c.ink, 0.14)}`,
          transform: `translateY(${breathe(frame, 110, 2)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * A value that rolls over at set times: the old one drops out of the slot as the
 * new one springs up into it. Used for counters and names that change on a cut.
 */
export const Roll: React.FC<{
  items: { at: number; node: React.ReactNode }[];
  height: number;
  style?: React.CSSProperties;
}> = ({ items, height, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  return (
    <div style={{ position: "relative", height, overflow: "hidden", ...style }}>
      {items.map((item, i) => {
        const pin = spring({ frame: frame - sec(item.at), fps, config: springs.snappy });
        const next = items[i + 1]?.at;
        const pout =
          next === undefined ? 0 : tween(frame, [sec(next), sec(next + 0.2)], [0, 1], ease.in);
        if (pin <= 0.001 || pout >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              whiteSpace: "nowrap",
              opacity: Math.min(1, pin * 1.5) * (1 - pout),
              transform: `translateY(${(1 - pin) * height * 0.75 - pout * height * 0.55}px)`,
            }}
          >
            {item.node}
          </div>
        );
      })}
    </div>
  );
};
