// SVG diagram primitives. All coordinates are in the parent SVG's user space.
import React from "react";
import { evolvePath } from "@remotion/paths";
import { useCurrentFrame } from "remotion";
import { useExit, useSec, useSpring, tween } from "./motion";
import { ease, fonts } from "./theme";

export type Pt = { x: number; y: number };

/** Progress (0 to 1) of a draw that starts at `at` and lasts `dur` seconds. */
export const useDraw = (at: number, dur: number) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  return tween(frame, [sec(at), sec(at + dur)], [0, 1], ease.inOutSoft);
};

/** A path that draws itself on, then optionally fades out. */
export const DrawPath: React.FC<{
  d: string;
  at?: number;
  dur?: number;
  /** Overrides the timed draw with an explicit progress. */
  progress?: number;
  exitAt?: number;
  stroke: string;
  width?: number;
  fill?: string;
  dash?: string;
  opacity?: number;
  linecap?: "round" | "butt" | "square";
}> = ({
  d,
  at = 0,
  dur = 0.8,
  progress,
  exitAt,
  stroke,
  width = 3,
  fill = "none",
  dash,
  opacity = 1,
  linecap = "round",
}) => {
  const drawn = useDraw(at, dur);
  const p = progress ?? drawn;
  const exit = useExit(exitAt);
  if (p <= 0) return null;
  const evolved = evolvePath(Math.min(p, 1), d);
  const fillOpacity = tween(p, [0.85, 1], [0, 1], ease.out);
  return (
    <path
      d={d}
      fill={fill}
      fillOpacity={fill === "none" ? undefined : fillOpacity}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap={linecap}
      strokeLinejoin="round"
      opacity={opacity * (1 - exit)}
      // A dashed style and a draw-on can't share strokeDasharray, so dashed paths fade in instead.
      strokeDasharray={dash ?? evolved.strokeDasharray}
      strokeDashoffset={dash ? undefined : evolved.strokeDashoffset}
      style={dash ? { opacity: opacity * p * (1 - exit) } : undefined}
    />
  );
};

const angleOf = (a: Pt, b: Pt) => Math.atan2(b.y - a.y, b.x - a.x);

/** A straight arrow that draws from `from` to `to`; the head rides the tip. */
export const Arrow: React.FC<{
  from: Pt;
  to: Pt;
  at?: number;
  dur?: number;
  progress?: number;
  exitAt?: number;
  color: string;
  width?: number;
  head?: number;
  double?: boolean;
  dash?: string;
}> = ({
  from,
  to,
  at = 0,
  dur = 0.6,
  progress,
  exitAt,
  color,
  width = 3,
  head = 14,
  double = false,
  dash,
}) => {
  const drawn = useDraw(at, dur);
  const p = progress ?? drawn;
  const exit = useExit(exitAt);
  if (p <= 0) return null;
  const tip = { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p };
  const a = angleOf(from, to);
  const headPath = (pt: Pt, ang: number) => {
    const l = { x: pt.x - head * Math.cos(ang - 0.45), y: pt.y - head * Math.sin(ang - 0.45) };
    const r = { x: pt.x - head * Math.cos(ang + 0.45), y: pt.y - head * Math.sin(ang + 0.45) };
    return `M ${l.x} ${l.y} L ${pt.x} ${pt.y} L ${r.x} ${r.y}`;
  };
  const headScale = tween(p, [0.15, 0.4], [0, 1], ease.out);
  return (
    <g opacity={1 - exit}>
      <line
        x1={from.x}
        y1={from.y}
        x2={tip.x}
        y2={tip.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
      />
      <path
        d={headPath(tip, a)}
        stroke={color}
        strokeWidth={width}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={headScale}
      />
      {double ? (
        <path
          d={headPath(from, a + Math.PI)}
          stroke={color}
          strokeWidth={width}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={headScale}
        />
      ) : null}
    </g>
  );
};

/** SVG arc path from angle a0 to a1 (radians, SVG convention: y down, clockwise positive). */
export const arcPath = (c: Pt, r: number, a0: number, a1: number) => {
  const p0 = { x: c.x + r * Math.cos(a0), y: c.y + r * Math.sin(a0) };
  const p1 = { x: c.x + r * Math.cos(a1), y: c.y + r * Math.sin(a1) };
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const sweep = a1 > a0 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} ${sweep} ${p1.x} ${p1.y}`;
};

/** An angle marker: arc plus a label placed on the bisector. */
export const AngleArc: React.FC<{
  center: Pt;
  r: number;
  /** Radians, SVG convention. */
  from: number;
  to: number;
  color: string;
  label?: string;
  labelColor?: string;
  labelSize?: number;
  labelOffset?: number;
  width?: number;
  fillOpacity?: number;
  opacity?: number;
}> = ({
  center,
  r,
  from,
  to,
  color,
  label,
  labelColor,
  labelSize = 30,
  labelOffset = 34,
  width = 3,
  fillOpacity = 0.12,
  opacity = 1,
}) => {
  if (Math.abs(to - from) < 0.002) return null;
  const mid = (from + to) / 2;
  const wedge = `${arcPath(center, r, from, to)} L ${center.x} ${center.y} Z`;
  return (
    <g opacity={opacity}>
      <path d={wedge} fill={color} fillOpacity={fillOpacity} stroke="none" />
      <path
        d={arcPath(center, r, from, to)}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
      {label ? (
        <text
          x={center.x + (r + labelOffset) * Math.cos(mid)}
          y={center.y + (r + labelOffset) * Math.sin(mid)}
          fill={labelColor ?? color}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={labelSize}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** A dot that pops in with a spring and an expanding ring. */
export const PopDot: React.FC<{
  at: Pt;
  start?: number;
  exitAt?: number;
  r?: number;
  color: string;
  ring?: boolean;
  stroke?: string;
}> = ({ at, start = 0, exitAt, r = 9, color, ring = true, stroke }) => {
  const sec = useSec();
  const frame = useCurrentFrame();
  const p = useSpring(sec(start), "bouncy");
  const ringP = tween(frame, [sec(start), sec(start + 0.7)], [0, 1], ease.out);
  const exit = useExit(exitAt);
  if (p <= 0.001) return null;
  return (
    <g opacity={1 - exit}>
      {ring ? (
        <circle
          cx={at.x}
          cy={at.y}
          r={r + ringP * r * 2.6}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={(1 - ringP) * 0.7}
        />
      ) : null}
      <circle
        cx={at.x}
        cy={at.y}
        r={r * p}
        fill={color}
        stroke={stroke}
        strokeWidth={stroke ? 3 : 0}
      />
    </g>
  );
};

/**
 * Callout: a dot on the anchor, a leader line with one elbow, then a label.
 * Rendered inside an SVG; the label is SVG text so it scales with the drawing.
 */
export const Callout: React.FC<{
  anchor: Pt;
  label: Pt;
  text: string;
  sub?: string;
  at?: number;
  exitAt?: number;
  color: string;
  textColor: string;
  subColor?: string;
  size?: number;
  align?: "start" | "end";
}> = ({
  anchor,
  label,
  text,
  sub,
  at = 0,
  exitAt,
  color,
  textColor,
  subColor,
  size = 26,
  align = "start",
}) => {
  const sec = useSec();
  const frame = useCurrentFrame();
  const exit = useExit(exitAt);
  const line = tween(frame, [sec(at + 0.1), sec(at + 0.55)], [0, 1], ease.inOutSoft);
  const textP = useSpring(sec(at + 0.45), "snappy");
  const elbow = { x: label.x, y: label.y };
  const d = `M ${anchor.x} ${anchor.y} L ${elbow.x} ${elbow.y} L ${elbow.x + (align === "start" ? 28 : -28)} ${elbow.y}`;
  const tx = elbow.x + (align === "start" ? 38 : -38);
  if (frame < sec(at)) return null;
  return (
    <g opacity={1 - exit}>
      <PopDot at={anchor} start={at} r={6} color={color} ring={false} />
      <DrawPath d={d} progress={line} stroke={color} width={2.5} />
      <g
        opacity={Math.min(textP * 1.3, 1)}
        transform={`translate(${(1 - textP) * (align === "start" ? -10 : 10)} 0)`}
      >
        <text
          x={tx}
          y={elbow.y}
          fill={textColor}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={size}
          textAnchor={align}
          dominantBaseline={sub ? "auto" : "central"}
        >
          {text}
        </text>
        {sub ? (
          <text
            x={tx}
            y={elbow.y + size * 1.1}
            fill={subColor ?? textColor}
            fontFamily={fonts.sans}
            fontWeight={500}
            fontSize={size * 0.78}
            textAnchor={align}
          >
            {sub}
          </text>
        ) : null}
      </g>
    </g>
  );
};
