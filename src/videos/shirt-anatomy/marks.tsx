// Pattern-sheet vocabulary as small SVG components: grain lines, notches, drill
// holes, piece labels, dimension lines, stitching and buttons. They draw in
// whatever coordinate space they're placed in; `px` is the size of one screen
// pixel in that space, so text and strokes stay a constant weight as pieces
// scale between the shirt and the sheet.
import React from "react";
import { interpolate } from "remotion";
import { ease, fonts, palettes, tween } from "../../kit";
import { edgeFrame } from "./geometry";
import type { Path, Pt } from "./geometry";

const c = palettes.atelier;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/**
 * A dash pattern that reveals a dashed line from its start: whole dashes up to
 * `p` of the length, then one long gap. Dashes stay put as the line grows.
 */
export const dashReveal = (length: number, p: number, dash: number, gap: number) => {
  const shown = length * clamp01(p);
  const period = dash + gap;
  const whole = Math.floor(shown / period);
  const parts: number[] = [];
  for (let i = 0; i < whole; i++) parts.push(dash, gap);
  parts.push(Math.min(dash, shown - whole * period), length + period);
  return parts.map((n) => n.toFixed(2)).join(" ");
};

/** A dashed line that sews itself on: topstitching, or a seam allowance. */
export const StitchPath: React.FC<{
  d: string;
  length: number;
  progress: number;
  px: number;
  color?: string;
  width?: number;
  dash?: number;
  gap?: number;
  opacity?: number;
}> = ({
  d,
  length,
  progress,
  px,
  color = c.inkSoft,
  width = 1.3,
  dash = 5,
  gap = 3.5,
  opacity = 1,
}) =>
  progress <= 0 ? null : (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width * px}
      strokeLinecap="butt"
      strokeDasharray={dashReveal(length, progress, dash * px, gap * px)}
      opacity={opacity}
    />
  );

/**
 * Grain line: a double-headed arrow that grows outwards from its middle, with
 * a break of `gap` pixels where the piece's label is printed.
 */
export const GrainLine: React.FC<{
  from: Pt;
  to: Pt;
  progress: number;
  px: number;
  gap?: number;
  color?: string;
}> = ({ from, to, progress, px, gap = 0, color = c.ink }) => {
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  // Too short to show beside its label (the pocket): the label alone carries it.
  if (progress <= 0 || len <= gap * px) return null;
  const u = { x: (to.x - from.x) / len, y: (to.y - from.y) / len };
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const half = (gap * px) / 2;
  const reach = half + (len / 2 - half) * clamp01(progress);
  const along = (d: number) => ({ x: mid.x + u.x * d, y: mid.y + u.y * d });
  const a = along(-reach);
  const b = along(reach);
  const head = 9 * px;
  const tip = (q: Pt, dir: number) =>
    `M ${q.x + head * Math.cos(dir - 0.42)} ${q.y + head * Math.sin(dir - 0.42)} L ${q.x} ${q.y} L ${
      q.x + head * Math.cos(dir + 0.42)
    } ${q.y + head * Math.sin(dir + 0.42)}`;
  const ang = Math.atan2(u.y, u.x);
  const heads = tween(progress, [0.5, 1], [0, 1], ease.out);
  const inner = (sign: number) => along(sign * half);
  return (
    <g
      stroke={color}
      strokeWidth={1.4 * px}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      <line x1={a.x} y1={a.y} x2={inner(-1).x} y2={inner(-1).y} />
      <line x1={inner(1).x} y1={inner(1).y} x2={b.x} y2={b.y} />
      <path d={tip(a, ang)} opacity={heads} />
      <path d={tip(b, ang + Math.PI)} opacity={heads} />
    </g>
  );
};

/** Notch: one or two short slits cut in from the edge, where seams must line up. */
export const Notch: React.FC<{
  outline: Path;
  seg: number;
  t: number;
  count?: number;
  progress: number;
  px: number;
}> = ({ outline, seg, t, count = 1, progress, px }) => {
  if (progress <= 0) return null;
  const { at, normal, tangent } = edgeFrame(outline, seg, t);
  const len = 10 * px * clamp01(progress);
  const spread = 4 * px;
  return (
    <g stroke={c.ink} strokeWidth={1.6 * px} strokeLinecap="round">
      {Array.from({ length: count }, (_, i) => {
        const shift = (i - (count - 1) / 2) * spread;
        const x = at.x + tangent.x * shift;
        const y = at.y + tangent.y * shift;
        return <line key={i} x1={x} y1={y} x2={x + normal.x * len} y2={y + normal.y * len} />;
      })}
    </g>
  );
};

/** Drill hole: a small circle and cross marking a placement, like the pocket corners. */
export const DrillHole: React.FC<{ at: Pt; progress: number; px: number }> = ({
  at,
  progress,
  px,
}) => {
  if (progress <= 0) return null;
  const s = interpolate(clamp01(progress), [0, 1], [0.3, 1]);
  const r = 3.2 * px * s;
  const arm = 7 * px * s;
  return (
    <g stroke={c.ink} strokeWidth={1.2 * px} fill="none" opacity={clamp01(progress * 1.5)}>
      <circle cx={at.x} cy={at.y} r={r} />
      <path d={`M ${at.x - arm} ${at.y} H ${at.x + arm} M ${at.x} ${at.y - arm} V ${at.y + arm}`} />
    </g>
  );
};

export type LabelSize = "big" | "compact" | "inline";

const LABEL_CAPS = {
  fontFamily: fonts.sans,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textAnchor: "middle" as const,
};
const INLINE = 12.5;

/** Room a label needs in its grain line, in pixels along the line. */
export const labelGap = (size: LabelSize, no: string, name: string, cut: string) => {
  if (size === "big") return 84;
  if (size === "compact") return 52;
  // Manrope caps with 0.16em tracking run about 0.84em a character.
  return Math.round(
    (name.length + cut.length) * INLINE * 0.84 + no.length * INLINE * 0.55 + 16 + 30,
  );
};

/** The label printed on a pattern piece: number, name and cutting instruction. */
export const PieceLabel: React.FC<{
  at: Pt;
  no: string;
  name: string;
  cut: string;
  size: LabelSize;
  progress: number;
  px: number;
}> = ({ at, no, name, cut, size, progress, px }) => {
  if (progress <= 0) return null;
  const p = clamp01(progress);
  const rise = (1 - p) * 10 * px;
  if (size === "inline") {
    return (
      <g opacity={p} transform={`translate(0 ${rise})`}>
        <text
          x={at.x}
          y={at.y}
          dominantBaseline="central"
          fontSize={INLINE * px}
          fill={c.ink}
          {...LABEL_CAPS}
        >
          <tspan fontFamily={fonts.serif} fontStyle="italic" fontWeight={400} letterSpacing="0">
            {no}
          </tspan>
          <tspan dx={8 * px}>{name.toUpperCase()}</tspan>
          <tspan dx={8 * px} fill={c.inkMute}>
            {cut.toUpperCase()}
          </tspan>
        </text>
      </g>
    );
  }
  // Stacked: number, name, cut. Sizes in pixels for the big and compact styles.
  const k =
    size === "big"
      ? { no: 28, name: 14, cut: 11, y: [-14, 10, 27] }
      : { no: 19, name: 11, cut: 9.5, y: [-8, 7, 20] };
  return (
    <g opacity={p} transform={`translate(0 ${rise})`}>
      <text
        x={at.x}
        y={at.y + k.y[0] * px}
        textAnchor="middle"
        fontFamily={fonts.serif}
        fontStyle="italic"
        fontSize={k.no * px}
        fill={c.ink}
      >
        {no}
      </text>
      <text x={at.x} y={at.y + k.y[1] * px} fontSize={k.name * px} fill={c.ink} {...LABEL_CAPS}>
        {name.toUpperCase()}
      </text>
      <text
        x={at.x}
        y={at.y + k.y[2] * px}
        fontSize={k.cut * px}
        fill={c.inkMute}
        {...LABEL_CAPS}
        fontWeight={600}
      >
        {cut.toUpperCase()}
      </text>
    </g>
  );
};

/**
 * Dimension line: extension lines from the measured points, then a line that
 * grows out from its middle with slash ticks, and a tag whose value counts up
 * as the line draws.
 */
export const Dimension: React.FC<{
  from: Pt;
  to: Pt;
  offset: number;
  label: string;
  value: number;
  unit: string;
  progress: number;
  exit?: number;
  px: number;
  color?: string;
}> = ({ from, to, offset, label, value, unit, progress, exit = 0, px, color = c.hero }) => {
  if (progress <= 0 || exit >= 1) return null;
  const len = Math.hypot(to.x - from.x, to.y - from.y);
  const u = { x: (to.x - from.x) / len, y: (to.y - from.y) / len };
  const n = { x: u.y, y: -u.x };
  const a = { x: from.x + n.x * offset, y: from.y + n.y * offset };
  const b = { x: to.x + n.x * offset, y: to.y + n.y * offset };
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const ext = tween(progress, [0, 0.3], [0, 1], ease.out);
  const line = tween(progress, [0.15, 0.85], [0, 1], ease.inOutSoft);
  const tag = tween(progress, [0.35, 0.75], [0, 1], ease.out);
  const shownValue = Math.round(value * tween(progress, [0.2, 0.9], [0, 1], ease.out));
  const pa = { x: mid.x + (a.x - mid.x) * line, y: mid.y + (a.y - mid.y) * line };
  const pb = { x: mid.x + (b.x - mid.x) * line, y: mid.y + (b.y - mid.y) * line };
  const overshoot = 8 * px;
  const tick = 7 * px;
  const slash = (q: Pt) =>
    `M ${q.x - (u.x + n.x) * tick} ${q.y - (u.y + n.y) * tick} L ${q.x + (u.x + n.x) * tick} ${q.y + (u.y + n.y) * tick}`;
  // Text reads along the line, but never upside down.
  let angle = (Math.atan2(u.y, u.x) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle <= -90) angle += 180;
  const text = `${label.toUpperCase()}  ${shownValue} ${unit}`;
  const tagW = (text.length * 8.6 + 22) * px;
  const tagH = 24 * px;
  return (
    <g opacity={1 - exit}>
      {offset !== 0 ? (
        <g stroke={color} strokeWidth={1 * px} opacity={0.75 * ext}>
          <line
            x1={from.x + n.x * Math.sign(offset) * 6 * px}
            y1={from.y + n.y * Math.sign(offset) * 6 * px}
            x2={a.x + n.x * Math.sign(offset) * overshoot}
            y2={a.y + n.y * Math.sign(offset) * overshoot}
          />
          <line
            x1={to.x + n.x * Math.sign(offset) * 6 * px}
            y1={to.y + n.y * Math.sign(offset) * 6 * px}
            x2={b.x + n.x * Math.sign(offset) * overshoot}
            y2={b.y + n.y * Math.sign(offset) * overshoot}
          />
        </g>
      ) : null}
      <g stroke={color} strokeWidth={1.6 * px} strokeLinecap="round" fill="none">
        <line x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} />
        <path d={slash(a)} opacity={tween(line, [0.9, 1], [0, 1])} />
        <path d={slash(b)} opacity={tween(line, [0.9, 1], [0, 1])} />
      </g>
      <g
        transform={`translate(${mid.x} ${mid.y}) rotate(${angle}) scale(${interpolate(tag, [0, 1], [0.85, 1])})`}
        opacity={tag}
      >
        <rect
          x={-tagW / 2}
          y={-tagH / 2}
          width={tagW}
          height={tagH}
          rx={tagH / 2}
          fill={c.surface}
          stroke={color}
          strokeWidth={1.2 * px}
        />
        <text
          x={0}
          y={0.5 * px}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={fonts.sans}
          fontWeight={800}
          fontSize={12.5 * px}
          letterSpacing="0.1em"
          fill={color}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {text}
        </text>
      </g>
    </g>
  );
};

/** A four-hole shirt button that pops in with a little overshoot. */
export const Button: React.FC<{ at: Pt; progress: number; px: number; r?: number }> = ({
  at,
  progress,
  px,
  r = 6.4,
}) => {
  if (progress <= 0.001) return null;
  const rr = r * px * progress;
  const hole = rr * 0.3;
  return (
    <g>
      <circle cx={at.x} cy={at.y + 0.8 * px} r={rr} fill={c.ink} opacity={0.14} />
      <circle cx={at.x} cy={at.y} r={rr} fill={c.surface} stroke={c.ink} strokeWidth={1.3 * px} />
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([dx, dy]) => (
        <circle
          key={`${dx}${dy}`}
          cx={at.x + dx * hole}
          cy={at.y + dy * hole}
          r={rr * 0.12}
          fill={c.ink}
        />
      ))}
    </g>
  );
};
