// Editorial type for the reel: Fraunces display lines with *italic* emphasis,
// and Manrope small caps for the details. Both rise in word by word.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, fonts, parseWords, springs, tween, useExit, useSec } from "../../kit";
import type { SpringName } from "../../kit";

type SerifLineProps = {
  /** Words wrapped in asterisks are set in italic: "The *Festive* Edit". */
  text: string;
  at?: number;
  per?: number;
  exitAt?: number;
  size: number;
  weight?: number;
  color: string;
  emphColor?: string;
  /** Letter-spacing settles from `trackFrom` to `track` (em) as the line lands. */
  track?: number;
  trackFrom?: number;
  spring?: SpringName;
  style?: React.CSSProperties;
};

/** A display line in Fraunces. Each word rises and fades in on its own spring. */
export const SerifLine: React.FC<SerifLineProps> = ({
  text,
  at = 0,
  per = 0.07,
  exitAt,
  size,
  weight = 600,
  color,
  emphColor,
  track = -0.02,
  trackFrom,
  spring: preset = "snappy",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const exit = useExit(exitAt);
  const words = parseWords(text);
  const settle = tween(frame, [sec(at), sec(at + 0.8)], [0, 1], ease.out);
  const tracking =
    trackFrom === undefined ? track : interpolate(settle, [0, 1], [trackFrom, track]);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: Math.round(size * 0.24),
        fontFamily: fonts.serif,
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.02,
        letterSpacing: `${tracking}em`,
        color,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 18}px)`,
        ...style,
      }}
    >
      {words.map((w, i) => {
        const p = spring({ frame: frame - sec(at + i * per), fps, config: springs[preset] });
        return (
          <span
            key={`${w.text}-${i}`}
            style={{
              display: "inline-block",
              opacity: Math.min(p * 1.6, 1),
              transform: `translateY(${interpolate(p, [0, 1], [size * 0.42, 0])}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
              fontStyle: w.emph ? "italic" : "normal",
              fontWeight: w.emph ? 400 : weight,
              color: w.emph ? (emphColor ?? color) : color,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/** Manrope small caps, with optional hairlines either side. Tracking settles as it lands. */
export const SmallCaps: React.FC<{
  text: string;
  at?: number;
  exitAt?: number;
  size?: number;
  color: string;
  rule?: string;
  weight?: number;
  style?: React.CSSProperties;
}> = ({ text, at = 0, exitAt, size = 26, color, rule, weight = 700, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const p = spring({ frame: frame - sec(at), fps, config: springs.smooth });
  const exit = useExit(exitAt);
  const ruleW = 56 * tween(frame, [sec(at + 0.1), sec(at + 0.6)], [0, 1], ease.out);
  const tracking = interpolate(p, [0, 1], [0.34, 0.2]);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        fontFamily: fonts.sans,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: `${tracking}em`,
        textTransform: "uppercase",
        color,
        opacity: Math.min(p * 1.4, 1) * (1 - exit),
        transform: `translateY(${(1 - p) * 14 - exit * 12}px)`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {rule ? <span style={{ width: ruleW, height: 2, background: rule }} /> : null}
      {/* Tracking also follows the last letter; pad the first so the line centres. */}
      <span style={{ paddingLeft: `${tracking}em` }}>{text}</span>
      {rule ? <span style={{ width: ruleW, height: 2, background: rule }} /> : null}
    </div>
  );
};
