// The right-hand visual: a road with the car, the distance graph beside it,
// and the secant that becomes a tangent. Times are absolute seconds.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  Axes,
  FnPath,
  clipSegment,
  Gauge,
  Graph,
  Point,
  ease,
  fmt,
  fonts,
  palettes,
  tween,
  useExit,
  useGraph,
  useSec,
  useSpring,
} from "../../kit";
import type { Pt } from "../../kit";
import { DURATION, T0, kmh, s, secant, v } from "./model";
import { T, gapAt, slideAt } from "./timeline";

const c = palettes.lab;

export const GRAPH = { left: 900, top: 150, width: 960, height: 760 };
const X: [number, number] = [0, 10.6];
const Y: [number, number] = [0, 165];
const PAD = { l: 90, r: 40, t: 40, b: 80 };
const ROAD = { x: -100, w: 58 };

/** Unit vector along slope m, in screen pixels. */
const dirPx = (g: ReturnType<typeof useGraph>, m: number) => {
  const a = g.p(0, 0);
  const b = g.p(1, m);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  return { x: dx / len, y: dy / len };
};

/** A line through a graph point with a given slope, `len` pixels long. */
const SlopeSegment: React.FC<{
  t: number;
  m: number;
  len: number;
  color: string;
  width?: number;
  opacity?: number;
}> = ({ t, m, len, color, width = 5, opacity = 1 }) => {
  const g = useGraph();
  const p = g.p(t, s(t));
  const d = dirPx(g, m);
  const seg = clipSegment(
    { x: p.x - (d.x * len) / 2, y: p.y - (d.y * len) / 2 },
    { x: p.x + (d.x * len) / 2, y: p.y + (d.y * len) / 2 },
    g.box,
  );
  if (!seg) return null;
  return (
    <line
      x1={seg[0].x}
      y1={seg[0].y}
      x2={seg[1].x}
      y2={seg[1].y}
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
};

const Tag: React.FC<{
  at: Pt;
  text: string;
  color: string;
  bg: string;
  align?: "start" | "end";
  opacity?: number;
}> = ({ at, text, color, bg, align = "start", opacity = 1 }) => {
  const w = text.length * 13.2 + 34;
  const x = align === "start" ? at.x : at.x - w;
  return (
    <g opacity={opacity}>
      <rect x={x} y={at.y - 22} width={w} height={44} rx={22} fill={bg} />
      <text
        x={x + w / 2}
        y={at.y + 1}
        fill={color}
        fontFamily={fonts.sans}
        fontWeight={800}
        fontSize={23}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {text}
      </text>
    </g>
  );
};

/** Where the car is (simulated seconds), or null when it's hidden. */
const carSim = (t: number) => {
  if (t >= T.hookDrive - 0.4 && t < T.distance)
    return Math.min(DURATION, Math.max(0, (t - T.hookDrive) * 2));
  if (t >= T.distance + 0.3 && t < T.average) return Math.min(DURATION, Math.max(0, t - T.drive));
  if (t >= T.slide && t < T.rule) return slideAt(t);
  return null;
};

const Car: React.FC<{ y: number; opacity: number }> = ({ y, opacity }) => {
  const x = ROAD.x + ROAD.w / 2;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <rect x={-19} y={-34} width={38} height={68} rx={13} fill={c.ink} />
      <rect x={-14} y={-22} width={28} height={15} rx={5} fill={c.blueTint} />
      <rect x={-14} y={12} width={28} height={10} rx={4} fill={c.blueTint} opacity={0.7} />
      {[-1, 1].map((sx) =>
        [-21, 19].map((wy) => (
          <rect
            key={`${sx}${wy}`}
            x={sx * 21 - 4}
            y={wy - 1}
            width={8}
            height={14}
            rx={3}
            fill={c.ink}
          />
        )),
      )}
      <circle cx={-10} cy={-31} r={3.5} fill={c.amber} />
      <circle cx={10} cy={-31} r={3.5} fill={c.amber} />
    </g>
  );
};

const Road: React.FC = () => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const p = tween(frame, [sec(0.1), sec(0.9)], [0, 1], ease.out);
  const t = frame / fps;
  const sim = carSim(t);
  const top = g.sy(Y[1]);
  const bottom = g.sy(0);
  const h = (bottom - top) * p;
  // The car fades at chapter edges rather than popping.
  const fadeIn = (start: number) => tween(frame, [sec(start), sec(start + 0.35)], [0, 1], ease.out);
  const fadeOut = (end: number) => tween(frame, [sec(end - 0.35), sec(end)], [1, 0], ease.in);
  const carOpacity =
    t < T.distance
      ? fadeIn(T.hookDrive - 0.4) * fadeOut(T.distance)
      : t < T.average
        ? fadeIn(T.distance + 0.3) * fadeOut(T.average)
        : fadeIn(T.slide) * fadeOut(T.rule);
  const link = sim !== null && t >= T.drive - 0.2;
  const carY = sim === null ? 0 : g.sy(s(sim));
  const roadOut = tween(frame, [sec(T.rule - 0.4), sec(T.rule + 0.2)], [1, 0], ease.in);
  // While the secant is on screen, two outline cars mark its two moments on the road.
  const ghosts =
    tween(frame, [sec(T.average + 1), sec(T.average + 1.5)], [0, 1], ease.out) *
    tween(frame, [sec(T.slide - 0.5), sec(T.slide)], [1, 0], ease.in);
  const gap = t < T.shrink ? 4 : gapAt(t);
  const y1 = g.sy(s(T0));
  const y2 = g.sy(s(T0 + gap));
  const bx = ROAD.x - 14;
  return (
    <g opacity={roadOut}>
      <rect
        x={ROAD.x}
        y={bottom - h}
        width={ROAD.w}
        height={h}
        rx={12}
        fill={c.panel}
        stroke={c.line}
        strokeWidth={2}
      />
      <line
        x1={ROAD.x + ROAD.w / 2}
        y1={bottom - 10}
        x2={ROAD.x + ROAD.w / 2}
        y2={bottom - h + 10}
        stroke={c.line}
        strokeWidth={3}
        strokeDasharray="14 14"
      />
      <text
        x={ROAD.x + ROAD.w / 2}
        y={bottom + 34}
        fill={c.inkMute}
        fontFamily={fonts.sans}
        fontWeight={700}
        fontSize={18}
        textAnchor="middle"
        letterSpacing="0.1em"
        opacity={p}
      >
        ROAD
      </text>
      {link ? (
        <line
          x1={ROAD.x + ROAD.w + 6}
          y1={carY}
          x2={g.sx(sim)}
          y2={carY}
          stroke={c.inkMute}
          strokeWidth={2}
          strokeDasharray="3 8"
          strokeLinecap="round"
          opacity={carOpacity * 0.9}
        />
      ) : null}
      {sim !== null ? <Car y={carY} opacity={carOpacity} /> : null}
      {ghosts > 0 ? (
        <g opacity={ghosts}>
          <Car y={y1} opacity={0.35} />
          <Car y={y2} opacity={Math.max(0.12, 0.35 * Math.min(1, gap))} />
          <path
            d={`M ${bx + 8} ${y1} L ${bx} ${y1} L ${bx} ${y2} L ${bx + 8} ${y2}`}
            stroke={c.amber}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ) : null}
    </g>
  );
};

/** Hook only: a big speedometer that follows the car, then makes way for the graph. */
export const HookGauge: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const exit = useExit(T.distance - 0.6, 0.45);
  const t = frame / fps;
  const sim = Math.min(DURATION, Math.max(0, (t - T.hookDrive) * 2));
  return (
    <div
      style={{
        position: "absolute",
        left: GRAPH.left + 210,
        top: 250,
        opacity: 1 - exit,
        transform: `scale(${1 - exit * 0.08})`,
      }}
    >
      <Gauge value={kmh(v(sim))} max={100} step={20} unit="KM/H" size={540} at={0.3} />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 560,
          textAlign: "center",
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 24,
          color: c.inkMute,
          opacity: tween(frame, [sec(1), sec(1.5)], [0, 1]),
        }}
      >
        {fmt(v(sim), 1)} m/s
      </div>
    </div>
  );
};

/** Chapter 2 and 3: the secant from T0 to T0 + gap, with its rise and run. */
const Secant: React.FC = () => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const qIn = useSpring(sec(T.average + 1), "bouncy");
  if (t < T.average || t >= T.slide) return null;
  const gap = t < T.shrink ? 4 : gapAt(t);
  const sc = secant(gap);
  const P = g.p(sc.t1, s(sc.t1));
  const Q = g.p(sc.t2, s(sc.t2));
  const corner = g.p(sc.t2, s(sc.t1));
  const legs = tween(frame, [sec(T.average + 2), sec(T.average + 2.8)], [0, 1], ease.inOutSoft);
  const line = tween(frame, [sec(T.average + 3.4), sec(T.average + 4.2)], [0, 1], ease.inOutSoft);
  const toTangent = tween(
    frame,
    [sec(T.shrink + 10.8), sec(T.shrink + 11.6)],
    [0, 1],
    ease.inOutSoft,
  );
  const fade = tween(frame, [sec(T.slide - 0.5), sec(T.slide)], [1, 0], ease.in);
  const legFade = tween(frame, [sec(T.shrink + 8.6), sec(T.shrink + 9.4)], [1, 0], ease.out);
  const d = dirPx(g, sc.slope);
  const len = 620 * line;
  const color = toTangent > 0.5 ? c.hero : c.amber;
  const seg =
    line > 0
      ? clipSegment(
          { x: P.x - d.x * len * 0.35, y: P.y - d.y * len * 0.35 },
          { x: P.x + d.x * len * 0.65, y: P.y + d.y * len * 0.65 },
          g.box,
        )
      : null;
  return (
    <g opacity={fade}>
      {legs > 0 ? (
        <g opacity={legFade}>
          <line
            x1={P.x}
            y1={P.y}
            x2={P.x + (corner.x - P.x) * legs}
            y2={P.y}
            stroke={c.inkSoft}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <line
            x1={corner.x}
            y1={corner.y}
            x2={corner.x}
            y2={corner.y + (Q.y - corner.y) * legs}
            stroke={c.inkSoft}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <text
            x={(P.x + corner.x) / 2}
            y={P.y + 34}
            fill={c.inkSoft}
            fontFamily={fonts.sans}
            fontWeight={800}
            fontSize={24}
            textAnchor="middle"
            opacity={legs}
          >
            Δt = {fmt(gap, 2)} s
          </text>
          <text
            x={corner.x + 16}
            y={(corner.y + Q.y) / 2}
            fill={c.inkSoft}
            fontFamily={fonts.sans}
            fontWeight={800}
            fontSize={24}
            dominantBaseline="central"
            opacity={legs}
          >
            Δs = {fmt(sc.ds, 1)} m
          </text>
        </g>
      ) : null}
      {seg ? (
        <line
          x1={seg[0].x}
          y1={seg[0].y}
          x2={seg[1].x}
          y2={seg[1].y}
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
        />
      ) : null}
      <circle
        cx={P.x}
        cy={P.y}
        r={10}
        fill={c.surface}
        stroke={c.ink}
        strokeWidth={4}
        opacity={Math.min(1, qIn * 1.5)}
      />
      <circle cx={Q.x} cy={Q.y} r={9 * qIn} fill={color} opacity={1 - toTangent} />
      {line > 0 ? (
        <Tag
          at={{ x: P.x + d.x * len * 0.65 + 14, y: P.y + d.y * len * 0.65 }}
          text={`${fmt(sc.slope, gap < 0.5 ? 2 : 1)} m/s`}
          color={toTangent > 0.5 ? c.heroDeep : c.amberDeep}
          bg={toTangent > 0.5 ? c.heroTint : c.amberTint}
          opacity={line}
        />
      ) : null}
    </g>
  );
};

/** Chapter 4: the tangent rides the curve. Chapter 5: three fixed tangents. */
const Tangents: React.FC = () => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const parts: React.ReactNode[] = [];
  if (t >= T.slide && t < T.rule) {
    const tp = slideAt(t);
    const pin = tween(frame, [sec(T.slide), sec(T.slide + 0.5)], [0, 1], ease.out);
    const out = tween(frame, [sec(T.rule - 0.4), sec(T.rule)], [1, 0], ease.in);
    const p = g.p(tp, s(tp));
    parts.push(
      <g key="slide" opacity={pin * out}>
        <SlopeSegment t={tp} m={v(tp)} len={360} color={c.hero} />
        <circle cx={p.x} cy={p.y} r={11} fill={c.surface} stroke={c.hero} strokeWidth={5} />
        <Tag
          at={{ x: p.x + (tp > 6.5 ? -26 : 26), y: p.y + 46 }}
          align={tp > 6.5 ? "end" : "start"}
          text={`${fmt(v(tp), 1)} m/s`}
          color={c.heroDeep}
          bg={c.heroTint}
        />
      </g>,
    );
  }
  if (t >= T.rule) {
    const fixed = [
      { tt: T0, at: T.rule + 4.4, label: `${fmt(v(T0), 1)} m/s`, side: "end" as const, dy: -44 },
      {
        tt: 5,
        at: T.rule + 7.2,
        label: `${fmt(v(5), 1)} m/s · fastest`,
        side: "start" as const,
        dy: 48,
      },
      { tt: DURATION, at: T.rule + 9, label: "0 m/s · stopped", side: "end" as const, dy: 46 },
    ];
    fixed.forEach(({ tt, at, label, side, dy }) => {
      const p = tween(frame, [sec(at), sec(at + 0.5)], [0, 1], ease.out);
      if (p <= 0) return;
      const pt = g.p(tt, s(tt));
      parts.push(
        <g key={tt} opacity={p}>
          <SlopeSegment t={tt} m={v(tt)} len={300 * p} color={c.hero} width={4.5} />
          <circle cx={pt.x} cy={pt.y} r={9} fill={c.surface} stroke={c.hero} strokeWidth={4.5} />
          <Tag
            at={{ x: pt.x + (side === "start" ? 22 : -22), y: pt.y + dy }}
            text={label}
            color={c.heroDeep}
            bg={c.heroTint}
            align={side}
          />
        </g>,
      );
    });
  }
  return <>{parts}</>;
};

/** The distance curve, drawn in step with the car, with a head dot during the drive. */
const DistanceCurve: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sim = Math.min(DURATION, Math.max(0, t - T.drive));
  const dim = tween(frame, [fps * T.slide, fps * (T.slide + 0.6)], [1, 0.55], ease.out);
  return (
    <>
      <FnPath
        f={s}
        from={0}
        to={DURATION}
        progress={sim / DURATION}
        color={c.ink}
        width={5}
        opacity={dim}
      />
      {t >= T.drive && t < T.average ? (
        <Point x={sim} y={s(sim)} start={T.drive} color={c.ink} r={9} ring={false} />
      ) : null}
    </>
  );
};

export const DriveGraph: React.FC = () => (
  <div style={{ position: "absolute", left: GRAPH.left, top: GRAPH.top }}>
    <Graph width={GRAPH.width} height={GRAPH.height} x={X} y={Y} pad={PAD}>
      <Axes
        at={T.distance + 0.2}
        xTicks={[0, 2, 4, 6, 8, 10]}
        yTicks={[0, 25, 50, 75, 100, 125, 150]}
        xLabel="time, t (s)"
        yLabel="distance, s (m)"
      />
      <Road />
      <DistanceCurve />
      <Secant />
      <Tangents />
    </Graph>
  </div>
);
