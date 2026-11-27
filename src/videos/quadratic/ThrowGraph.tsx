// The right-hand visual for the whole explainer: a throw that becomes a graph.
// Times here are absolute seconds, because this layer never leaves the screen.
import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Arrow,
  Axes,
  Callout,
  FnPath,
  Graph,
  Guide,
  Point,
  breathe,
  ease,
  fmt,
  fonts,
  palettes,
  solveQuadratic,
  springs,
  tween,
  useGraph,
  useSec,
  useSpring,
} from "../../kit";
import { spring } from "remotion";
import type { Model } from "./model";
import { T } from "./timeline";

const c = palettes.lab;

export const GRAPH = { left: 850, top: 150, width: 1010, height: 760 };

/** The height of the moving line during the discriminant sweep. */
export const sweepHeight = (t: number, m: Model, ledge: number) => {
  const k = t - T.sweep;
  if (k <= 0.6) return ledge;
  if (k <= 2.6) return interpolate(k, [0.6, 2.6], [ledge, m.peak.y], { easing: ease.inOutSoft });
  if (k <= 3.6) return m.peak.y;
  return interpolate(k, [3.6, 5.8], [m.peak.y, Math.max(m.q.c + 4, m.peak.y * 0.5)], {
    easing: ease.inOutSoft,
    extrapolateRight: "clamp",
  });
};

/** Discriminant sign as a label, treating a sliver around zero as zero. */
export const dState = (d: number) => (Math.abs(d) < 1e-6 ? "zero" : d > 0 ? "pos" : "neg");

const Ground: React.FC<{ fade: number }> = ({ fade }) => {
  const g = useGraph();
  const y = g.sy(0);
  const hatches = [];
  for (let x = g.box.left + 10; x < g.box.right; x += 26) {
    hatches.push(
      <line
        key={x}
        x1={x}
        y1={y + 4}
        x2={x - 14}
        y2={y + 18}
        stroke={c.line}
        strokeWidth={2.5}
        strokeLinecap="round"
      />,
    );
  }
  return <g opacity={fade}>{hatches}</g>;
};

const Launcher: React.FC<{ m: Model; p: number; exit: number }> = ({ m, p, exit }) => {
  const g = useGraph();
  const base = g.p(0, 0);
  const top = g.p(0, m.q.c);
  const h = (base.y - top.y) * p;
  return (
    <g opacity={1 - exit}>
      <rect x={base.x - 20} y={base.y - h} width={40} height={h} rx={6} fill={c.ink} />
      <rect
        x={base.x - 30}
        y={base.y - h - 8}
        width={60}
        height={10}
        rx={5}
        fill={c.ink}
        opacity={p}
      />
    </g>
  );
};

/** Ball, trail and readout. */
const Ball: React.FC<{ m: Model }> = ({ m }) => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;

  // Three appearances: first throw, replay, then parked at the peak.
  const segments = [
    { in: 0.6, out: T.model - 0.3, start: T.launch, park: undefined as number | undefined },
    { in: T.replay - 0.6, out: T.land - 0.3, start: T.replay, park: undefined },
    { in: T.peak + 6.4, out: T.reach - 0.3, start: 0, park: m.peak.x },
  ];
  const seg = segments.find((s) => t >= s.in && t < s.out + 0.4);
  if (!seg) return null;
  const s = seg.park ?? Math.min(Math.max(0, t - seg.start), m.landing);
  const pos = g.p(s, m.h(s));
  const pop = spring({ frame: frame - sec(seg.in), fps, config: springs.bouncy });
  const out = tween(frame, [sec(seg.out), sec(seg.out + 0.35)], [0, 1], ease.in);
  const landedAt = seg.start + m.landing;
  const squash =
    seg.park === undefined
      ? tween(frame, [sec(landedAt), sec(landedAt + 0.3)], [0.62, 1], ease.out)
      : 1;
  const isLanded = seg.park === undefined && t >= landedAt;
  const r = 17;
  const showTrail = seg === segments[0];
  const trailFade = tween(frame, [sec(T.model + 0.9), sec(T.model + 2.2)], [1, 0], ease.in);
  const dots = [];
  if (showTrail) {
    for (let k = 0.1; k < s; k += 0.1) {
      const d = g.p(k, m.h(k));
      dots.push(
        <circle key={k} cx={d.x} cy={d.y} r={4} fill={c.amber} opacity={0.55 * trailFade} />,
      );
    }
  }
  const readout = seg === segments[1] && t >= seg.start;
  return (
    <g>
      {dots}
      <g
        opacity={(1 - out) * Math.min(pop * 1.2, 1)}
        transform={`translate(${pos.x} ${pos.y - (isLanded ? r * squash : r)})`}
      >
        {seg.park !== undefined ? (
          <circle r={r * 2.2 + breathe(frame, 50, 3)} fill={c.amber} opacity={0.18} />
        ) : null}
        <ellipse
          rx={r * (isLanded ? 2 - squash : 1) * pop}
          ry={r * (isLanded ? squash : 1) * pop}
          fill={c.amber}
          stroke={c.amberDeep}
          strokeWidth={3}
        />
        <path
          d={`M ${-r * 0.7} ${-r * 0.2} Q 0 ${r * 0.5} ${r * 0.7} ${-r * 0.2}`}
          stroke={c.amberDeep}
          strokeWidth={2}
          fill="none"
          opacity={0.6 * pop}
        />
      </g>
      {readout ? (
        <g
          opacity={1 - out}
          transform={`translate(${pos.x + interpolate(s, [m.peak.x - 0.35, m.peak.x + 0.35], [-292, 32], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.inOutSoft })} ${pos.y - 66})`}
        >
          <rect
            x={0}
            y={-24}
            width={260}
            height={48}
            rx={24}
            fill={c.surface}
            stroke={c.line}
            strokeWidth={2}
          />
          <text
            x={130}
            y={1}
            fontFamily={fonts.sans}
            fontWeight={700}
            fontSize={22}
            fill={c.ink}
            textAnchor="middle"
            dominantBaseline="central"
            style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "pre" }}
          >
            t = {s.toFixed(2)} s h = {m.h(s).toFixed(2)} m
          </text>
        </g>
      ) : null}
    </g>
  );
};

const SweepLine: React.FC<{ m: Model; ledge: number }> = ({ m, ledge }) => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  if (t < T.sweep) return null;
  const H = sweepHeight(t, m, ledge);
  const roots = solveQuadratic({ ...m.q, c: m.q.c - H });
  const state = dState(m.q.b * m.q.b - 4 * m.q.a * (m.q.c - H));
  const color = state === "neg" ? c.red : state === "zero" ? c.amber : c.hero;
  const fadeOut = tween(frame, [sec(T.recap - 0.2), sec(T.recap + 0.3)], [1, 0], ease.in);
  const a = g.p(g.x[0], H);
  const b = g.p(g.x[1], H);
  return (
    <g opacity={fadeOut}>
      <line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <text
        x={b.x}
        y={a.y - 16}
        fill={color}
        fontFamily={fonts.sans}
        fontWeight={800}
        fontSize={24}
        textAnchor="end"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {fmt(H, 2)} m
      </text>
      {roots.map((r, i) => {
        const p = g.p(r, H);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={11}
            fill={c.surface}
            stroke={color}
            strokeWidth={5}
          />
        );
      })}
    </g>
  );
};

export const ThrowGraph: React.FC<{ m: Model; ledge: number }> = ({ m, ledge }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const groundIn = tween(frame, [sec(0.2), sec(1)], [0, 1], ease.out);
  const hatchFade = tween(frame, [sec(T.model + 0.4), sec(T.model + 1.2)], [1, 0.35], ease.out);
  const launcherIn = useSpring(sec(0.45), "smooth");
  const launcherOut = tween(frame, [sec(T.land - 0.4), sec(T.land)], [0, 1], ease.in);
  const twoMetre = m.text.c;
  return (
    <div style={{ position: "absolute", left: GRAPH.left, top: GRAPH.top }}>
      <Graph
        width={GRAPH.width}
        height={GRAPH.height}
        x={m.t.range}
        y={m.hAxis.range}
        pad={{ l: 90, r: 40, t: 40, b: 80 }}
      >
        <Ground fade={groundIn * hatchFade} />
        <Guide
          y={0}
          span={m.t.range}
          at={0.2}
          color={c.ink}
          dash="0"
          width={4}
          exitAt={T.model + 0.8}
        />
        <Axes
          at={T.model + 0.4}
          xTicks={m.t.ticks}
          yTicks={m.hAxis.ticks}
          xLabel="time, t (s)"
          yLabel="height, h (m)"
        />
        <Launcher m={m} p={launcherIn} exit={launcherOut} />
        <LaunchHeight m={m} label={`${twoMetre} m`} />
        <FnPath
          f={m.h}
          from={0}
          to={m.landing}
          at={T.model + 1}
          dur={1.4}
          color={c.hero}
          width={6}
        />
        {/* Chapter 2: both roots. The early one sits on the dashed extension. */}
        <FnPath
          f={m.h}
          from={0}
          to={m.before - 0.03}
          at={T.land + 13.4}
          dur={0.8}
          color={c.inkMute}
          width={4}
          dash="2 12"
        />
        <GCallout
          anchor={[m.landing, 0]}
          label={[m.landing - 0.42, m.hAxis.range[1] * 0.2]}
          text={`${m.text.landing} s`}
          sub="lands"
          align="end"
          at={T.land + 10.4}
          color={c.hero}
          textColor={c.heroDeep}
          subColor={c.inkSoft}
          size={30}
        />
        <GCallout
          anchor={[m.before, 0]}
          label={[-0.62, m.hAxis.range[1] * 0.5]}
          text={`${m.text.before} s`}
          sub="before launch"
          at={T.land + 14}
          color={c.inkMute}
          textColor={c.inkSoft}
          subColor={c.inkMute}
          size={28}
        />
        {/* Chapter 3: the vertex. */}
        <Guide x={m.peak.x} span={[0, m.peak.y]} at={T.peak + 3} color={c.amber} />
        <Guide y={m.peak.y} span={[m.t.range[0], m.peak.x]} at={T.peak + 6.4} color={c.amber} />
        <Point x={m.peak.x} y={m.peak.y} start={T.peak + 6.6} color={c.amber} r={8} />
        <GCallout
          anchor={[m.peak.x, m.peak.y]}
          label={[m.peak.x + 0.75, m.peak.y + m.hAxis.range[1] * 0.07]}
          text={`${m.text.peakH} m`}
          sub={`at ${m.text.peakT} s`}
          at={T.peak + 7}
          exitAt={T.reach + 0.2}
          color={c.amber}
          textColor={c.amberDeep}
          subColor={c.inkSoft}
          size={30}
        />
        {/* Chapter 4: the ledge, the gap, then the sweep. */}
        <Guide
          y={ledge}
          at={T.reach + 1}
          exitAt={T.sweep + 0.4}
          color={m.reaches ? c.hero : c.red}
          label={`ledge ${m.text.ledgeH} m`}
          labelSide="above"
          dash="10 10"
        />
        <Guide
          y={ledge}
          at={T.recap + 2.2}
          color={m.reaches ? c.hero : c.red}
          label={`ledge ${m.text.ledgeH} m`}
          labelSide="above"
          dash="10 10"
        />
        {!m.reaches ? <GapArrow m={m} ledge={ledge} /> : null}
        <SweepLine m={m} ledge={ledge} />
        <Ball m={m} />
      </Graph>
    </div>
  );
};

/** A Callout whose anchor and label are given in graph units. */
const GCallout: React.FC<
  Omit<React.ComponentProps<typeof Callout>, "anchor" | "label"> & {
    anchor: [number, number];
    label: [number, number];
  }
> = ({ anchor, label, ...rest }) => {
  const g = useGraph();
  return <Callout anchor={g.p(...anchor)} label={g.p(...label)} {...rest} />;
};

const LaunchHeight: React.FC<{ m: Model; label: string }> = ({ m, label }) => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const sec = useSec();
  const at = T.model + 5.4;
  const p = tween(frame, [sec(at), sec(at + 0.5)], [0, 1], ease.out);
  const out = tween(frame, [sec(T.land - 0.4), sec(T.land)], [0, 1], ease.in);
  if (p <= 0) return null;
  const x = g.sx(0) + 46;
  return (
    <g opacity={p * (1 - out)}>
      <Arrow
        from={{ x, y: g.sy(0) - 4 }}
        to={{ x, y: g.sy(m.q.c) + 4 }}
        progress={p}
        color={c.inkSoft}
        width={2.5}
        head={9}
        double
      />
      <text
        x={x + 14}
        y={(g.sy(0) + g.sy(m.q.c)) / 2}
        fill={c.inkSoft}
        fontFamily={fonts.sans}
        fontWeight={700}
        fontSize={22}
        dominantBaseline="central"
      >
        {label}
      </text>
    </g>
  );
};

const GapArrow: React.FC<{ m: Model; ledge: number }> = ({ m, ledge }) => {
  const g = useGraph();
  const frame = useCurrentFrame();
  const sec = useSec();
  const at = T.reach + 7.6;
  const p = tween(frame, [sec(at), sec(at + 0.5)], [0, 1], ease.out);
  const out = tween(frame, [sec(T.sweep), sec(T.sweep + 0.3)], [0, 1], ease.in);
  if (p <= 0) return null;
  const x = g.sx(m.peak.x);
  return (
    <g opacity={1 - out}>
      <Arrow
        from={{ x, y: g.sy(m.peak.y) - 14 }}
        to={{ x, y: g.sy(ledge) + 4 }}
        progress={p}
        color={c.red}
        width={3}
        head={9}
        double
      />
      <text
        x={x + 16}
        y={(g.sy(m.peak.y) + g.sy(ledge)) / 2}
        fill={c.red}
        fontFamily={fonts.sans}
        fontWeight={800}
        fontSize={22}
        dominantBaseline="central"
        opacity={p}
      >
        {m.text.shortBy} m short
      </text>
    </g>
  );
};
