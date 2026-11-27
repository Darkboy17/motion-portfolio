// Left-hand panels for the derivative explainer. Each sits in a Sequence that
// starts at its chapter, so times in here are seconds from the chapter start.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  Enter,
  Eq,
  Frac,
  Gauge,
  Graph,
  Axes,
  FnPath,
  LottieClip,
  Op,
  PanelColumn,
  PanelNote,
  PanelTitle,
  Pill,
  RecapRows,
  Stagger,
  Sup,
  T as Term,
  V,
  ease,
  fmt,
  fonts,
  palettes,
  tween,
  useGraph,
  useSec,
} from "../../kit";
import { DURATION, GAPS, T0, kmh, numbers, s, secant, v } from "./model";
import { GAP_TIMES, T, slideAt } from "./timeline";

const c = palettes.lab;
const MINUS = "−";
const PRIME = "′";

const Delta: React.FC<{ of: string }> = ({ of }) => (
  <>
    Δ<V>{of}</V>
  </>
);

/** s(t) = -0.3t³ + 4.5t², with each term able to light up. */
const Distance: React.FC<{ size?: number; enter?: number; hl?: [number, number] }> = ({
  size = 56,
  enter,
  hl,
}) => {
  const e = (i: number) => (enter === undefined ? undefined : enter + i * 0.14);
  return (
    <Eq size={size} color={c.ink}>
      <Term at={e(0)}>
        <V>s</V>(<V>t</V>)<Op>=</Op>
      </Term>
      <Term at={e(1)} hl={c.amberTint} hlAt={hl?.[0] ?? 999}>
        {numbers.a3}
        <V>t</V>
        <Sup>3</Sup>
      </Term>
      <Term at={e(2)} hl={c.blueTint} hlAt={hl?.[1] ?? 999}>
        <Op tight>+</Op>
        {numbers.a2}
        <V>t</V>
        <Sup>2</Sup>
      </Term>
    </Eq>
  );
};

const bigNumber: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontWeight: 800,
  fontSize: 64,
  letterSpacing: "-0.03em",
  color: c.ink,
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1.05,
};

const Readout: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color = c.ink,
}) => (
  <div
    style={{
      flex: 1,
      padding: "18px 24px",
      borderRadius: 22,
      background: c.surface,
      border: `2px solid ${c.line}`,
    }}
  >
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 19,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: c.inkMute,
      }}
    >
      {label}
    </div>
    <div style={{ ...bigNumber, color }}>{value}</div>
  </div>
);

export const DistancePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sim = Math.min(DURATION, Math.max(0, frame / fps + T.distance - T.drive));
  return (
    <PanelColumn exitAt={T.average - T.distance - 0.5}>
      <PanelNote text="Distance after t seconds" at={0.3} />
      <Distance enter={0.5} />
      <Enter at={0.9}>
        <div style={{ display: "flex", gap: 16 }}>
          <Readout label="Time" value={`${sim.toFixed(1)} s`} />
          <Readout label="Distance" value={`${s(sim).toFixed(1)} m`} />
        </div>
      </Enter>
      <Stagger at={4.1} step={0.4} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Pill color={c.inkSoft} bg={c.panel} size={24}>
          Starts at rest
        </Pill>
        <Pill color={c.inkSoft} bg={c.panel} size={24}>
          {numbers.total} m in 10 s
        </Pill>
        <Pill color={c.inkSoft} bg={c.panel} size={24}>
          Stops at 10 s
        </Pill>
      </Stagger>
    </PanelColumn>
  );
};

export const AveragePanel: React.FC = () => {
  const four = secant(4);
  return (
    <PanelColumn exitAt={T.shrink - T.average - 0.5}>
      <PanelTitle text="Average *speed*" />
      <Eq size={50} color={c.ink}>
        <Term at={0.8}>
          <span style={{ fontWeight: 700 }}>average</span>
          <Op>=</Op>
          <Frac n={<Delta of="s" />} d={<Delta of="t" />} />
        </Term>
        <Term at={5}>
          <Op>=</Op>
          <Frac
            n={
              <>
                <V>s</V>(6)<Op tight>{MINUS}</Op>
                <V>s</V>(2)
              </>
            }
            d={
              <>
                6<Op tight>{MINUS}</Op>2
              </>
            }
          />
        </Term>
      </Eq>
      <Eq size={50} color={c.ink}>
        <Term at={6}>
          <Op>=</Op>
          <Frac n={`${fmt(s(6), 1)} ${MINUS} ${fmt(s(2), 1)}`} d="4" />
        </Term>
        <Term at={7} hl={c.amberTint} hlAt={7.2}>
          <Op>=</Op>
          <span style={{ fontWeight: 800, color: c.amberDeep }}>{fmt(four.slope, 1)} m/s</span>
        </Term>
      </Eq>
      <Enter at={9.3} style={{ marginTop: 8 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <Readout label="Average, 2 to 6 s" value={`${numbers.avg} m/s`} color={c.amberDeep} />
          <Readout label="Speedometer at 2 s" value="?" color={c.inkMute} />
        </div>
      </Enter>
    </PanelColumn>
  );
};

/** lim with its approach written underneath. */
const Lim: React.FC<{ under: React.ReactNode }> = ({ under }) => (
  <span
    style={{
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      margin: "0 0.2em",
      lineHeight: 1,
    }}
  >
    <span style={{ fontWeight: 600 }}>lim</span>
    <span
      style={{ fontSize: "0.42em", fontWeight: 600, marginTop: "0.25em", whiteSpace: "nowrap" }}
    >
      {under}
    </span>
  </span>
);

export const ShrinkPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const current = GAP_TIMES.reduce((acc, g, i) => (t >= g - 0.15 ? i : acc), -1);
  const settled = t >= 9.4;
  const cell: React.CSSProperties = {
    fontFamily: fonts.sans,
    fontSize: 28,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  };
  return (
    <PanelColumn exitAt={T.slide - T.shrink - 0.5} gap={22}>
      <PanelTitle text="Shrink the *gap*" />
      <Enter at={0.5}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            padding: "0 22px",
            ...cell,
            fontSize: 19,
            letterSpacing: "0.12em",
            color: c.inkMute,
          }}
        >
          <span>GAP Δt</span>
          <span>AVERAGE Δs ÷ Δt</span>
        </div>
      </Enter>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: -12 }}>
        {GAPS.map((g, i) => {
          const p = tween(
            frame,
            [sec(GAP_TIMES[i] - 0.15), sec(GAP_TIMES[i] + 0.25)],
            [0, 1],
            ease.out,
          );
          const on = i === current && !settled;
          return (
            <div
              key={g}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr",
                padding: "7px 22px",
                borderRadius: 14,
                background: on ? c.amberTint : "transparent",
                color: on ? c.amberDeep : c.inkSoft,
                opacity: p,
                transform: `translateY(${(1 - p) * 14}px)`,
                ...cell,
              }}
            >
              <span>{fmt(g, 2)} s</span>
              <span>{secant(g).slope.toFixed(g < 0.5 ? 3 : 2)} m/s</span>
            </div>
          );
        })}
        <Enter at={9.4} spring="bouncy">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: 16,
              background: c.heroTint,
              color: c.heroDeep,
              ...cell,
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            <span>Δt → 0</span>
            <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {numbers.instant} m/s
              <LottieClip
                at={9.5}
                file="check.json"
                tint={c.hero}
                style={{ width: 44, height: 44 }}
              />
            </span>
          </div>
        </Enter>
      </div>
      <Enter at={13.2} style={{ marginTop: 6 }}>
        <Eq size={48} color={c.ink}>
          <V>s</V>
          {PRIME}(2)
          <Op>=</Op>
          <Lim under="Δt → 0" />
          <Frac n={<Delta of="s" />} d={<Delta of="t" />} />
          <Op>=</Op>
          <span style={{ fontWeight: 800, color: c.heroDeep }}>{numbers.instant} m/s</span>
        </Eq>
      </Enter>
    </PanelColumn>
  );
};

/** v(t) drawn up to the tangent point, with a dot on its head. */
const SpeedTrace: React.FC<{ upTo: number }> = ({ upTo }) => {
  const g = useGraph();
  const p = g.p(upTo, v(upTo));
  return (
    <>
      <FnPath f={v} from={0} to={DURATION} progress={upTo / DURATION} color={c.hero} width={5} />
      <circle cx={p.x} cy={p.y} r={8} fill={c.surface} stroke={c.hero} strokeWidth={4} />
    </>
  );
};

export const SlidePanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tp = slideAt(frame / fps + T.slide);
  return (
    <PanelColumn exitAt={T.rule - T.slide - 0.5} gap={18} top={176}>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <Gauge value={kmh(v(tp))} max={100} step={20} unit="KM/H" size={330} at={0.3} />
        <Enter at={0.7} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <PanelNote text="Tangent slope" at={0.7} />
          <div style={{ ...bigNumber, fontSize: 72, color: c.heroDeep }}>{fmt(v(tp), 1)} m/s</div>
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 26, color: c.inkSoft }}>
            at t = {tp.toFixed(1)} s
          </div>
        </Enter>
      </div>
      <Enter at={0.9}>
        <div
          style={{
            background: c.surface,
            border: `2px solid ${c.line}`,
            borderRadius: 24,
            padding: "8px 8px 0",
          }}
        >
          <Graph
            width={640}
            height={290}
            x={[0, 10.4]}
            y={[0, 25]}
            pad={{ l: 70, r: 24, t: 44, b: 56 }}
          >
            <Axes
              at={1}
              xTicks={[0, 2, 4, 6, 8, 10]}
              yTicks={[0, 10, 20]}
              yLabel="speed, v (m/s)"
            />
            <SpeedTrace upTo={tp} />
          </Graph>
        </div>
      </Enter>
    </PanelColumn>
  );
};

export const RulePanel: React.FC = () => (
  <PanelColumn exitAt={T.recap - T.rule - 0.5} gap={20}>
    <PanelTitle text="The power *rule*" />
    <Enter at={0.8}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 18,
          padding: "10px 22px",
          borderRadius: 16,
          background: c.panel,
          width: "fit-content",
        }}
      >
        <Eq size={36} color={c.inkSoft}>
          <V>t</V>
          <Sup>
            <V>n</V>
          </Sup>
          <Op>→</Op>
          <V>n</V>
          <V>t</V>
          <Sup>
            <V>n</V> {MINUS} 1
          </Sup>
        </Eq>
      </div>
    </Enter>
    <Distance size={46} enter={1.4} hl={[2.5, 2.7]} />
    <Eq size={46} color={c.ink}>
      <Term at={2.5}>
        <V>s</V>
        {PRIME}(<V>t</V>)<Op>=</Op>
      </Term>
      <Term at={2.7} hl={c.amberTint} hlAt={2.9}>
        {numbers.d3}
        <V>t</V>
        <Sup>2</Sup>
      </Term>
      <Term at={2.9} hl={c.blueTint} hlAt={3.1}>
        <Op tight>+</Op>
        {numbers.d2}
        <V>t</V>
      </Term>
    </Eq>
    <Stagger
      at={4.4}
      step={2.4}
      style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}
    >
      {[
        { at: T0, val: `${numbers.instant} m/s`, note: "same as the limit" },
        { at: 5, val: `${numbers.peak} m/s`, note: `≈ ${numbers.peakKmh} km/h, top speed` },
        { at: DURATION, val: "0 m/s", note: "stopped" },
      ].map((r) => (
        <div key={r.at} style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Eq size={40} color={c.ink}>
            <V>s</V>
            {PRIME}({r.at})<Op>=</Op>
            <span style={{ fontWeight: 800, color: c.heroDeep }}>{r.val}</span>
          </Eq>
          <span style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 24, color: c.inkMute }}>
            {r.note}
          </span>
        </div>
      ))}
    </Stagger>
  </PanelColumn>
);

export const RecapPanel: React.FC = () => (
  <PanelColumn>
    <PanelTitle text="Speed is the *slope* of distance." />
    <RecapRows
      rows={[
        {
          k: "Secant",
          q: "Average speed over a gap",
          a: `${numbers.avg} m/s`,
          color: c.amberDeep,
          tint: c.amberTint,
        },
        {
          k: "Tangent",
          q: "Speed at one instant",
          a: `${numbers.instant} m/s`,
          color: c.heroDeep,
          tint: c.heroTint,
        },
        {
          k: "Derivative",
          q: "The slope at every instant",
          a: (
            <>
              <i>s</i>
              {PRIME}(<i>t</i>)
            </>
          ),
          color: c.heroDeep,
          tint: c.heroTint,
        },
      ]}
    />
    <Enter at={4.4}>
      <Pill color={c.blue} bg={c.blueTint} size={26}>
        Slope of speed = acceleration
      </Pill>
    </Enter>
  </PanelColumn>
);
