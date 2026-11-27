// A small charting system for explainers: a Graph sets up scales, and its
// children (axes, functions, points, guides) draw in graph coordinates.
import React, { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import { DrawPath, PopDot } from "./Diagram";
import type { Pt } from "./Diagram";
import { useExit, useSec, tween } from "./motion";
import { ease, fonts, palettes } from "./theme";

type Scale = {
  sx: (x: number) => number;
  sy: (y: number) => number;
  /** Graph point to SVG point. */
  p: (x: number, y: number) => Pt;
  x: [number, number];
  y: [number, number];
  box: { left: number; right: number; top: number; bottom: number };
};

const GraphCtx = createContext<Scale | null>(null);

export const useGraph = () => {
  const g = useContext(GraphCtx);
  if (!g) throw new Error("useGraph must be used inside <Graph>");
  return g;
};

export const makeScale = (
  width: number,
  height: number,
  x: [number, number],
  y: [number, number],
  pad = { l: 80, r: 30, t: 30, b: 70 },
): Scale => {
  const box = { left: pad.l, right: width - pad.r, top: pad.t, bottom: height - pad.b };
  const sx = (v: number) => box.left + ((v - x[0]) / (x[1] - x[0])) * (box.right - box.left);
  const sy = (v: number) => box.bottom - ((v - y[0]) / (y[1] - y[0])) * (box.bottom - box.top);
  return { sx, sy, p: (a, b) => ({ x: sx(a), y: sy(b) }), x, y, box };
};

export const Graph: React.FC<{
  width: number;
  height: number;
  x: [number, number];
  y: [number, number];
  pad?: { l: number; r: number; t: number; b: number };
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ width, height, x, y, pad, style, children }) => {
  const scale = makeScale(width, height, x, y, pad);
  return (
    <GraphCtx.Provider value={scale}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible", ...style }}
      >
        {children}
      </svg>
    </GraphCtx.Provider>
  );
};

const c = palettes.lab;

/** Axes, gridlines and tick labels, drawn on in sequence. */
export const Axes: React.FC<{
  at?: number;
  xTicks: number[];
  yTicks: number[];
  xLabel?: string;
  yLabel?: string;
  format?: (v: number) => string;
  formatY?: (v: number) => string;
  grid?: boolean;
  /** Where the x axis crosses the y axis (graph units). */
  originY?: number;
  exitAt?: number;
}> = ({
  at = 0,
  xTicks,
  yTicks,
  xLabel,
  yLabel,
  format = (v) => `${v}`,
  formatY,
  grid = true,
  originY,
  exitAt,
}) => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const sec = useSec();
  const exit = useExit(exitAt);
  const draw = tween(frame, [sec(at), sec(at + 0.8)], [0, 1], ease.inOutSoft);
  const y0 = g.sy(originY ?? Math.max(g.y[0], Math.min(0, g.y[1])));
  const label = (i: number) =>
    tween(frame, [sec(at + 0.3 + i * 0.04), sec(at + 0.7 + i * 0.04)], [0, 1], ease.out);
  const fy = formatY ?? format;
  return (
    <g opacity={1 - exit}>
      {grid
        ? yTicks.map((t, i) => (
            <line
              key={`gy${t}`}
              x1={g.box.left}
              x2={g.box.left + (g.box.right - g.box.left) * draw}
              y1={g.sy(t)}
              y2={g.sy(t)}
              stroke={c.grid}
              strokeWidth={1.5}
              opacity={label(i)}
            />
          ))
        : null}
      {grid
        ? xTicks.map((t, i) => (
            <line
              key={`gx${t}`}
              x1={g.sx(t)}
              x2={g.sx(t)}
              y1={g.box.bottom}
              y2={g.box.bottom - (g.box.bottom - g.box.top) * draw}
              stroke={c.grid}
              strokeWidth={1.5}
              opacity={label(i)}
            />
          ))
        : null}
      <DrawPath
        d={`M ${g.box.left} ${y0} L ${g.box.right} ${y0}`}
        progress={draw}
        stroke={c.inkSoft}
        width={2.5}
      />
      <DrawPath
        d={`M ${g.box.left} ${g.box.bottom} L ${g.box.left} ${g.box.top}`}
        progress={draw}
        stroke={c.inkSoft}
        width={2.5}
      />
      {xTicks.map((t, i) => (
        <text
          key={`tx${t}`}
          x={g.sx(t)}
          y={y0 + 34}
          fill={c.inkMute}
          fontFamily={fonts.sans}
          fontWeight={600}
          fontSize={22}
          textAnchor="middle"
          opacity={label(i)}
        >
          {format(t)}
        </text>
      ))}
      {yTicks.map((t, i) => (
        <text
          key={`ty${t}`}
          x={g.box.left - 16}
          y={g.sy(t)}
          fill={c.inkMute}
          fontFamily={fonts.sans}
          fontWeight={600}
          fontSize={22}
          textAnchor="end"
          dominantBaseline="central"
          opacity={label(i)}
        >
          {fy(t)}
        </text>
      ))}
      {xLabel ? (
        <text
          x={g.box.right}
          y={y0 + 66}
          fill={c.inkSoft}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={22}
          textAnchor="end"
          opacity={label(xTicks.length)}
        >
          {xLabel}
        </text>
      ) : null}
      {yLabel ? (
        <text
          x={g.box.left}
          y={g.box.top - 18}
          fill={c.inkSoft}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={22}
          textAnchor="start"
          opacity={label(yTicks.length)}
        >
          {yLabel}
        </text>
      ) : null}
    </g>
  );
};

/** Builds an SVG path for y = f(x) between two x values. */
export const fnPath = (
  g: Scale,
  f: (x: number) => number,
  from: number,
  to: number,
  samples = 160,
) => {
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = from + ((to - from) * i) / samples;
    const pt = g.p(x, f(x));
    pts.push(`${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`);
  }
  return pts.join(" ");
};

/** Plots y = f(x). Progress grows the domain from left to right, so the tip stays sharp. */
export const FnPath: React.FC<{
  f: (x: number) => number;
  from: number;
  to: number;
  at?: number;
  dur?: number;
  progress?: number;
  exitAt?: number;
  color: string;
  width?: number;
  dash?: string;
  opacity?: number;
}> = ({
  f,
  from,
  to,
  at = 0,
  dur = 1.2,
  progress,
  exitAt,
  color,
  width = 5,
  dash,
  opacity = 1,
}) => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const sec = useSec();
  const exit = useExit(exitAt);
  const p = progress ?? tween(frame, [sec(at), sec(at + dur)], [0, 1], ease.inOutSoft);
  if (p <= 0.001) return null;
  const d = fnPath(g, f, from, from + (to - from) * p);
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
      opacity={opacity * (1 - exit)}
    />
  );
};

/** A point in graph coordinates. */
export const Point: React.FC<{
  x: number;
  y: number;
  start?: number;
  exitAt?: number;
  r?: number;
  color: string;
  ring?: boolean;
}> = ({ x, y, ...rest }) => {
  const g = useGraph();
  return <PopDot at={g.p(x, y)} {...rest} />;
};

/** A guide line across the graph (horizontal at `y` or vertical at `x`), with an optional label. */
export const Guide: React.FC<{
  y?: number;
  x?: number;
  /** Limits the guide's extent, in graph units along its length. */
  span?: [number, number];
  at?: number;
  exitAt?: number;
  color: string;
  label?: string;
  labelSide?: "start" | "end";
  dash?: string;
  width?: number;
}> = ({
  y,
  x,
  span,
  at = 0,
  exitAt,
  color,
  label,
  labelSide = "end",
  dash = "8 10",
  width = 2.5,
}) => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const sec = useSec();
  const exit = useExit(exitAt);
  const p = tween(frame, [sec(at), sec(at + 0.6)], [0, 1], ease.inOutSoft);
  if (p <= 0) return null;
  let a: Pt;
  let b: Pt;
  if (y !== undefined) {
    const [x0, x1] = span ?? g.x;
    a = g.p(x0, y);
    b = g.p(x0 + (x1 - x0) * p, y);
  } else {
    const [y0, y1] = span ?? g.y;
    a = g.p(x ?? 0, y0);
    b = g.p(x ?? 0, y0 + (y1 - y0) * p);
  }
  const labelPt = labelSide === "end" ? b : a;
  return (
    <g opacity={1 - exit}>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
      {label ? (
        <text
          x={labelPt.x + (y !== undefined ? (labelSide === "end" ? 12 : -12) : 0)}
          y={labelPt.y + (y !== undefined ? 0 : -14)}
          fill={color}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={22}
          textAnchor={y !== undefined ? (labelSide === "end" ? "start" : "end") : "middle"}
          dominantBaseline={y !== undefined ? "central" : "auto"}
          opacity={tween(p, [0.6, 1], [0, 1])}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
};

/** A straight line through a graph point with a given slope, clipped to an x range. */
export const SlopeLine: React.FC<{
  x0: number;
  y0: number;
  slope: number;
  from: number;
  to: number;
  color: string;
  width?: number;
  opacity?: number;
  dash?: string;
}> = ({ x0, y0, slope, from, to, color, width = 4, opacity = 1, dash }) => {
  const g = useGraph();
  const a = g.p(from, y0 + slope * (from - x0));
  const b = g.p(to, y0 + slope * (to - x0));
  return (
    <line
      x1={a.x}
      y1={a.y}
      x2={b.x}
      y2={b.y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
      strokeDasharray={dash}
    />
  );
};
