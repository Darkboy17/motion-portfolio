// The right-hand visual: a top-down game arena with a turret at the origin.
// World units, y up; one unit is U pixels. Times are absolute seconds.
import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  AngleArc,
  LottieClip,
  aim,
  breathe,
  ease,
  fonts,
  naiveAim,
  palettes,
  tween,
  useSec,
  useSpring,
} from "../../kit";
import { deg, simulateMissile } from "./model";
import type { Vec } from "./model";
import { LAUNCHES, SHOTS, SHOT_FLIGHT, T, targetAt } from "./timeline";

const c = palettes.lab;

export const SCREEN = { left: 880, top: 168, width: 960, height: 724 };
const U = 64;
const CX = SCREEN.width / 2;
const CY = SCREEN.height / 2;
const BARREL = 1.6;

const px = (p: Vec) => ({ x: CX + p.x * U, y: CY - p.y * U });
/** Screen rotation (clockwise degrees) for a world angle in radians. */
const rot = (a: number) => (-a * 180) / Math.PI;

type Mode = "atan2" | "naive";
/** Which aim the turret uses: plain arctan only in the bug chapter. */
const modeAt = (t: number): Mode => (t >= T.bug && t < T.atan2 ? "naive" : "atan2");

const angleFor = (mode: Mode, p: Vec) => (mode === "naive" ? naiveAim(p.x, p.y) : aim(p.x, p.y));

const Grid: React.FC = () => {
  const lines: React.ReactNode[] = [];
  for (let x = CX % U; x < SCREEN.width; x += U)
    lines.push(
      <line
        key={`x${x}`}
        x1={x}
        y1={0}
        x2={x}
        y2={SCREEN.height}
        stroke={c.screenLine}
        strokeWidth={1}
      />,
    );
  for (let y = CY % U; y < SCREEN.height; y += U)
    lines.push(
      <line
        key={`y${y}`}
        x1={0}
        y1={y}
        x2={SCREEN.width}
        y2={y}
        stroke={c.screenLine}
        strokeWidth={1}
      />,
    );
  return (
    <g>
      {lines}
      <line
        x1={0}
        y1={CY}
        x2={SCREEN.width}
        y2={CY}
        stroke={c.screenText}
        strokeOpacity={0.22}
        strokeWidth={2}
      />
      <line
        x1={CX}
        y1={0}
        x2={CX}
        y2={SCREEN.height}
        stroke={c.screenText}
        strokeOpacity={0.22}
        strokeWidth={2}
      />
    </g>
  );
};

const Turret: React.FC<{
  angle: number;
  color: string;
  ghost?: { angle: number; opacity: number };
}> = ({ angle, color, ghost }) => {
  const frame = useCurrentFrame();
  const o = px({ x: 0, y: 0 });
  const pulse = breathe(frame, 60, 2);
  return (
    <g>
      <circle cx={o.x} cy={o.y} r={0.95 * U + pulse} fill={color} opacity={0.08} />
      {ghost && ghost.opacity > 0 ? (
        <g
          transform={`translate(${o.x} ${o.y}) rotate(${rot(ghost.angle)})`}
          opacity={ghost.opacity}
        >
          <rect
            x={0}
            y={-13}
            width={BARREL * U}
            height={26}
            rx={13}
            fill="none"
            stroke={c.redBright}
            strokeWidth={3}
            strokeDasharray="7 7"
          />
        </g>
      ) : null}
      <g transform={`translate(${o.x} ${o.y}) rotate(${rot(angle)})`}>
        <rect x={0} y={-13} width={BARREL * U} height={26} rx={13} fill={color} />
        <rect x={BARREL * U - 22} y={-17} width={22} height={34} rx={7} fill={color} />
      </g>
      <circle cx={o.x} cy={o.y} r={0.55 * U} fill={c.screen} stroke={color} strokeWidth={6} />
      <circle cx={o.x} cy={o.y} r={0.2 * U} fill={color} />
    </g>
  );
};

const Target: React.FC<{ p: Vec }> = ({ p }) => {
  const frame = useCurrentFrame();
  const q = px(p);
  const spin = frame * 3;
  return (
    <g transform={`translate(${q.x} ${q.y})`}>
      <circle
        r={30 + breathe(frame, 40, 3)}
        fill="none"
        stroke={c.amberBright}
        strokeOpacity={0.35}
        strokeWidth={2}
      />
      <g transform={`rotate(${spin})`}>
        {[0, 90, 180, 270].map((a) => (
          <circle
            key={a}
            cx={Math.cos((a * Math.PI) / 180) * 17}
            cy={Math.sin((a * Math.PI) / 180) * 17}
            r={6}
            fill={c.amberBright}
            opacity={0.75}
          />
        ))}
      </g>
      <rect
        x={-11}
        y={-11}
        width={22}
        height={22}
        rx={4}
        fill={c.amberBright}
        transform="rotate(45)"
      />
    </g>
  );
};

/** The right triangle: dx along the ground, dy up to the target, the aim line and the angle. */
const Triangle: React.FC<{ p: Vec; shown: number; aimAngle: number; wrong: boolean }> = ({
  p,
  shown,
  aimAngle,
  wrong,
}) => {
  if (shown <= 0) return null;
  const o = px({ x: 0, y: 0 });
  const foot = px({ x: p.x, y: 0 });
  const tip = px(p);
  const arcColor = wrong ? c.redBright : c.heroBright;
  const label = (
    x: number,
    y: number,
    text: string,
    color: string,
    anchor: "start" | "middle" | "end" = "middle",
  ) => (
    <text
      x={x}
      y={y}
      fill={color}
      fontFamily={fonts.sans}
      fontWeight={800}
      fontSize={24}
      textAnchor={anchor}
      dominantBaseline="central"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </text>
  );
  const dxText = `dx = ${p.x < 0 ? "−" : ""}${Math.abs(p.x).toFixed(1)}`;
  const dyText = `dy = ${p.y < 0 ? "−" : ""}${Math.abs(p.y).toFixed(1)}`;
  return (
    <g opacity={shown}>
      <line
        x1={o.x}
        y1={o.y}
        x2={tip.x}
        y2={tip.y}
        stroke={c.screenText}
        strokeOpacity={0.55}
        strokeWidth={3}
        strokeDasharray="10 10"
      />
      <line
        x1={o.x}
        y1={o.y}
        x2={foot.x}
        y2={foot.y}
        stroke={c.blueBright}
        strokeWidth={5}
        strokeLinecap="round"
      />
      <line
        x1={foot.x}
        y1={foot.y}
        x2={tip.x}
        y2={tip.y}
        stroke={c.amberBright}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {Math.abs(p.x) > 0.5 && Math.abs(p.y) > 0.5 ? (
        <path
          d={`M ${foot.x - Math.sign(p.x) * 18} ${foot.y} L ${foot.x - Math.sign(p.x) * 18} ${foot.y - Math.sign(p.y) * 18} L ${foot.x} ${foot.y - Math.sign(p.y) * 18}`}
          fill="none"
          stroke={c.screenText}
          strokeOpacity={0.5}
          strokeWidth={2}
        />
      ) : null}
      {/* With dx near zero the triangle collapses to a line: dx goes under the turret, dy to the left. */}
      {Math.abs(p.x) < 0.6
        ? label(o.x, o.y + (p.y >= 0 ? 62 : -62), dxText, c.blueBright)
        : label((o.x + foot.x) / 2, foot.y + (p.y >= 0 ? 30 : -30), dxText, c.blueBright)}
      {label(
        foot.x + (p.x >= 0.6 ? 18 : -18),
        (foot.y + tip.y) / 2,
        dyText,
        c.amberBright,
        p.x >= 0.6 ? "start" : "end",
      )}
      <AngleArc
        center={o}
        r={1.95 * U}
        from={0}
        to={-aimAngle}
        color={arcColor}
        label={`θ ${deg((aimAngle * 180) / Math.PI)}`}
        labelColor={arcColor}
        labelSize={24}
        labelOffset={58}
        fillOpacity={0.16}
      />
    </g>
  );
};

/** Bullets and hit sparks for the opening. */
const Shots: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <g>
      {SHOTS.map((s) => {
        if (t < s || t > s + SHOT_FLIGHT) return null;
        const k = (t - s) / SHOT_FLIGHT;
        const from = targetAt(s);
        const a = aim(from.x, from.y);
        const muzzle = { x: Math.cos(a) * BARREL, y: Math.sin(a) * BARREL };
        const hit = targetAt(s + SHOT_FLIGHT);
        const p = px({
          x: muzzle.x + (hit.x - muzzle.x) * k,
          y: muzzle.y + (hit.y - muzzle.y) * k,
        });
        const back = px({
          x: muzzle.x + (hit.x - muzzle.x) * Math.max(0, k - 0.18),
          y: muzzle.y + (hit.y - muzzle.y) * Math.max(0, k - 0.18),
        });
        return (
          <line
            key={s}
            x1={back.x}
            y1={back.y}
            x2={p.x}
            y2={p.y}
            stroke={c.heroBright}
            strokeWidth={7}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

/** Lottie sparks over the SVG: one per bullet hit and per missile hit. */
const Sparks: React.FC<{ hits: { at: number; p: Vec }[] }> = ({ hits }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <>
      {hits.map(({ at, p }) => {
        if (t < at || t > at + 0.7) return null;
        const q = px(p);
        return (
          <div
            key={at}
            style={{ position: "absolute", left: q.x - 70, top: q.y - 70, width: 140, height: 140 }}
          >
            <LottieClip
              at={at}
              file="burst.json"
              tint={c.amberBright}
              style={{ width: 140, height: 140 }}
            />
          </div>
        );
      })}
    </>
  );
};

/** Missiles leave the muzzle heading well off target, so the homing turn is visible. */
const MISSILE = { speed: 3.4, turnRate: Math.PI * 0.85 };
const missileFrom = (target: Vec) => {
  const a = aim(target.x, target.y);
  return { from: { x: Math.cos(a) * BARREL, y: Math.sin(a) * BARREL }, heading: a + Math.PI * 0.6 };
};

/** Every missile's whole flight, from launch until it hits or the recap starts. */
export const missileFlights = () =>
  LAUNCHES.map((launch) =>
    simulateMissile({
      ...missileFrom(targetAt(launch)),
      target: targetAt,
      launch,
      until: T.recap,
      ...MISSILE,
    }),
  );

const Missiles: React.FC<{ flights: ReturnType<typeof simulateMissile>[] }> = ({ flights }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return (
    <g>
      {LAUNCHES.map((launch, i) => {
        if (t < launch) return null;
        const end = flights[i].hitAt ?? T.recap;
        if (t > end) return null;
        const start = targetAt(launch);
        const m = simulateMissile({
          ...missileFrom(start),
          target: targetAt,
          launch,
          until: t,
          ...MISSILE,
        });
        const q = px(m.pos);
        return (
          <g key={launch}>
            {m.trail.slice(-36).map((p, j, tail) => {
              const d = px(p);
              return (
                <circle
                  key={j}
                  cx={d.x}
                  cy={d.y}
                  r={3}
                  fill={c.screenText}
                  opacity={0.08 + (0.5 * j) / Math.max(1, tail.length)}
                />
              );
            })}
            <g transform={`translate(${q.x} ${q.y}) rotate(${rot(m.heading)})`}>
              <path d="M 16 0 L -12 -9 L -6 0 L -12 9 Z" fill={c.heroBright} />
            </g>
          </g>
        );
      })}
    </g>
  );
};

const Quadrants: React.FC<{ shown: number }> = ({ shown }) => {
  if (shown <= 0) return null;
  // One label at the centre of each quadrant, clear of the HUD.
  const items = [
    { x: CX + 250, y: CY - 200, signs: "dx +   dy +", range: "0° to 90°" },
    { x: CX - 250, y: CY - 200, signs: "dx −   dy +", range: "90° to 180°" },
    { x: CX - 250, y: CY + 200, signs: "dx −   dy −", range: "−180° to −90°" },
    { x: CX + 250, y: CY + 200, signs: "dx +   dy −", range: "−90° to 0°" },
  ];
  return (
    <g opacity={shown}>
      {items.map((q) => (
        <g key={q.range}>
          <text
            x={q.x}
            y={q.y - 14}
            fill={c.screenText}
            opacity={0.6}
            fontFamily={fonts.mono}
            fontSize={20}
            textAnchor="middle"
            style={{ whiteSpace: "pre" }}
          >
            {q.signs}
          </text>
          <text
            x={q.x}
            y={q.y + 18}
            fill={c.heroBright}
            fontFamily={fonts.sans}
            fontWeight={800}
            fontSize={24}
            textAnchor="middle"
          >
            {q.range}
          </text>
        </g>
      ))}
    </g>
  );
};

export const GameScreen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const appear = useSpring(sec(0.05), "smooth");
  const p = targetAt(t);
  const mode = modeAt(t);
  const angle = angleFor(mode, p);
  const wrong = mode === "naive" && p.x < 0;
  const turretColor = wrong ? c.redBright : c.heroBright;
  const triangle =
    tween(frame, [sec(T.triangle + 1.2), sec(T.triangle + 1.8)], [0, 1], ease.out) *
    tween(frame, [sec(T.atan2 - 0.4), sec(T.atan2)], [1, 0], ease.in);
  const ghost =
    tween(frame, [sec(T.circle), sec(T.circle + 0.4)], [0, 0.9], ease.out) *
    tween(frame, [sec(T.uses - 0.4), sec(T.uses)], [1, 0], ease.in);
  const quadrants =
    tween(frame, [sec(T.atan2 + 4.6), sec(T.atan2 + 5.2)], [0, 1], ease.out) *
    tween(frame, [sec(T.uses - 0.4), sec(T.uses)], [1, 0], ease.in);

  const flights = useMemo(missileFlights, []);
  const hits = [
    ...SHOTS.map((s) => ({ at: s + SHOT_FLIGHT, p: targetAt(s + SHOT_FLIGHT) })),
    ...flights.filter((f) => f.hitAt !== null).map((f) => ({ at: f.hitAt as number, p: f.pos })),
  ];
  const hud = mode === "naive" ? "aim = arctan(dy / dx)" : "aim = atan2(dy, dx)";
  return (
    <div
      style={{
        position: "absolute",
        left: SCREEN.left,
        top: SCREEN.top,
        width: SCREEN.width,
        height: SCREEN.height,
        borderRadius: 30,
        overflow: "hidden",
        background: c.screen,
        boxShadow: "0 40px 90px -40px rgba(15,26,20,0.55)",
        opacity: appear,
        transform: `translateY(${(1 - appear) * 30}px) scale(${0.97 + 0.03 * appear})`,
      }}
    >
      <svg width={SCREEN.width} height={SCREEN.height}>
        <Grid />
        <Quadrants shown={quadrants} />
        <Triangle p={p} shown={triangle} aimAngle={angle} wrong={wrong} />
        <Shots />
        <Missiles flights={flights} />
        <Target p={p} />
        <Turret
          angle={angle}
          color={turretColor}
          ghost={{ angle: naiveAim(p.x, p.y), opacity: ghost }}
        />
      </svg>
      <Sparks hits={hits} />
      <div
        style={{
          position: "absolute",
          left: 26,
          top: 22,
          display: "flex",
          gap: 14,
          alignItems: "center",
          fontFamily: fonts.mono,
          fontSize: 20,
          color: c.screenText,
          opacity: 0.85,
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 5, background: turretColor }} />
        <span style={{ color: wrong ? c.redBright : c.screenText }}>{hud}</span>
      </div>
      <div
        style={{
          position: "absolute",
          right: 26,
          top: 22,
          fontFamily: fonts.mono,
          fontSize: 20,
          color: c.screenText,
          opacity: 0.55,
        }}
      >
        target ({p.x.toFixed(1)}, {p.y.toFixed(1)})
      </div>
    </div>
  );
};
