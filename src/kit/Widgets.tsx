// Readouts and chrome: gauge, counter, chapter bar, pill and panel.
import React from "react";
import { useCurrentFrame } from "remotion";
import { arcPath } from "./Diagram";
import { enterStyle, useExit, useSec, useSpring, tween } from "./motion";
import { ease, fonts, palettes } from "./theme";

const c = palettes.lab;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** A dial gauge (270-degree sweep) with ticks, an active arc and a digital readout. */
export const Gauge: React.FC<{
  value: number;
  max: number;
  step: number;
  minorPerStep?: number;
  unit: string;
  size?: number;
  color?: string;
  format?: (v: number) => string;
  at?: number;
}> = ({
  value,
  max,
  step,
  minorPerStep = 4,
  unit,
  size = 420,
  color = c.hero,
  format = (v) => Math.round(v).toString(),
  at = 0,
}) => {
  const sec = useSec();
  const p = useSpring(sec(at), "smooth");
  const r = size / 2;
  const ctr = { x: r, y: r };
  const start = 135;
  const sweep = 270;
  const ang = (v: number) => start + (sweep * Math.max(0, Math.min(v, max))) / max;
  const majors = Math.round(max / step);
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= majors * minorPerStep; i++) {
    const v = (i / minorPerStep) * step;
    const major = i % minorPerStep === 0;
    const a = rad(ang(v));
    const r0 = r * (major ? 0.74 : 0.79);
    const r1 = r * 0.86;
    ticks.push(
      <line
        key={`t${i}`}
        x1={ctr.x + r0 * Math.cos(a)}
        y1={ctr.y + r0 * Math.sin(a)}
        x2={ctr.x + r1 * Math.cos(a)}
        y2={ctr.y + r1 * Math.sin(a)}
        stroke={major ? c.ink : c.inkMute}
        strokeWidth={major ? 3.5 : 2}
        strokeLinecap="round"
      />,
    );
    if (major) {
      const rl = r * 0.6;
      ticks.push(
        <text
          key={`l${i}`}
          x={ctr.x + rl * Math.cos(a)}
          y={ctr.y + rl * Math.sin(a)}
          fill={c.inkSoft}
          fontFamily={fonts.sans}
          fontWeight={700}
          fontSize={size * 0.052}
          textAnchor="middle"
          dominantBaseline="central"
        >
          {Math.round(v)}
        </text>,
      );
    }
  }
  const na = rad(ang(value));
  const needleLen = r * 0.7;
  return (
    <div
      style={{
        ...enterStyle(p, 0, { dy: 30, scale: 0.9 }),
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        <circle
          cx={ctr.x}
          cy={ctr.y}
          r={r * 0.98}
          fill={c.surface}
          stroke={c.line}
          strokeWidth={3}
        />
        <path
          d={arcPath(ctr, r * 0.9, rad(start), rad(start + sweep))}
          fill="none"
          stroke={c.grid}
          strokeWidth={r * 0.05}
          strokeLinecap="round"
        />
        {value > 0.05 ? (
          <path
            d={arcPath(ctr, r * 0.9, rad(start), rad(ang(value)))}
            fill="none"
            stroke={color}
            strokeWidth={r * 0.05}
            strokeLinecap="round"
          />
        ) : null}
        {ticks}
        <line
          x1={ctr.x - Math.cos(na) * r * 0.12}
          y1={ctr.y - Math.sin(na) * r * 0.12}
          x2={ctr.x + Math.cos(na) * needleLen}
          y2={ctr.y + Math.sin(na) * needleLen}
          stroke={c.red}
          strokeWidth={6}
          strokeLinecap="round"
        />
        <circle cx={ctr.x} cy={ctr.y} r={r * 0.07} fill={c.ink} />
        <circle cx={ctr.x} cy={ctr.y} r={r * 0.025} fill={c.surface} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: r * 1.28,
          textAlign: "center",
          fontFamily: fonts.sans,
        }}
      >
        <div
          style={{
            fontSize: size * 0.15,
            fontWeight: 800,
            color: c.ink,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          {format(value)}
        </div>
        <div
          style={{
            fontSize: size * 0.05,
            fontWeight: 700,
            color: c.inkMute,
            letterSpacing: "0.12em",
            marginTop: 6,
          }}
        >
          {unit}
        </div>
      </div>
    </div>
  );
};

/** A number that counts to its value. Tabular figures stop the layout jittering. */
export const Counter: React.FC<{
  to: number;
  from?: number;
  at?: number;
  dur?: number;
  decimals?: number;
  suffix?: string;
  style?: React.CSSProperties;
}> = ({ to, from = 0, at = 0, dur = 1, decimals = 0, suffix = "", style }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const v = tween(frame, [sec(at), sec(at + dur)], [from, to], ease.out);
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
};

/** A rounded label. */
export const Pill: React.FC<{
  children: React.ReactNode;
  color: string;
  bg: string;
  size?: number;
  at?: number;
  exitAt?: number;
  style?: React.CSSProperties;
}> = ({ children, color, bg, size = 24, at = 0, exitAt, style }) => {
  const sec = useSec();
  const p = useSpring(sec(at), "bouncy");
  const exit = useExit(exitAt);
  return (
    <div
      style={{
        ...enterStyle(p, exit, { dy: 12, scale: 0.8 }),
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: `${size * 0.32}px ${size * 0.7}px`,
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: size,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** A white card that holds a group of content. */
export const Panel: React.FC<{
  at?: number;
  exitAt?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at = 0, exitAt, style, children }) => {
  const sec = useSec();
  const p = useSpring(sec(at), "smooth");
  const exit = useExit(exitAt);
  return (
    <div
      style={{
        ...enterStyle(p, exit, { dy: 30, scale: 0.97 }),
        background: c.surface,
        border: `2px solid ${c.line}`,
        borderRadius: 28,
        boxShadow: "0 30px 70px -40px rgba(15,26,20,0.28)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Chapter bar: the explainer's topic and its steps, with the current step
 * filled. Gives a module viewer a sense of where they are.
 */
export const ChapterBar: React.FC<{
  topic: string;
  chapters: { label: string; at: number }[];
  at?: number;
}> = ({ topic, chapters, at = 0 }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const p = useSpring(sec(at), "smooth");
  const t = frame / sec(1);
  const current = chapters.reduce((acc, ch, i) => (t >= ch.at ? i : acc), -1);
  return (
    <div
      style={{
        position: "absolute",
        top: 54,
        left: 96,
        right: 96,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: fonts.sans,
        ...enterStyle(p, 0, { dy: -16 }),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: c.ink,
        }}
      >
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 4,
            background: c.hero,
            transform: `rotate(${45 * p}deg)`,
          }}
        />
        {topic}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {chapters.map((ch, i) => {
          const on = tween(frame, [sec(ch.at), sec(ch.at + 0.4)], [0, 1], ease.out);
          const isCurrent = i === current;
          return (
            <div
              key={ch.label}
              style={{ display: "flex", flexDirection: "column", gap: 8, width: 150 }}
            >
              <div style={{ height: 5, borderRadius: 3, background: c.line, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${on * 100}%`,
                    background: isCurrent ? c.hero : c.inkMute,
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: isCurrent ? c.heroDeep : c.inkMute,
                  letterSpacing: "0.04em",
                }}
              >
                {String(i + 1).padStart(2, "0")} {ch.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
