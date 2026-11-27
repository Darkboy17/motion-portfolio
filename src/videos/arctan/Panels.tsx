// Left-hand panels for the arctan explainer. Times are seconds from each
// chapter's start, because each panel sits in its own Sequence.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  CodeBlock,
  Enter,
  Eq,
  Frac,
  Op,
  PanelColumn,
  PanelNote,
  PanelTitle,
  Pill,
  RecapRows,
  Stagger,
  T as Term,
  V,
  fonts,
  palettes,
  tween,
  ease,
  useSec,
} from "../../kit";
import { MIRROR_TARGET, TRIANGLE_TARGET, aimDeg, deg, naiveDeg } from "./model";
import { T, targetAt } from "./timeline";

const c = palettes.lab;
const MINUS = "−";

const DX: React.FC = () => <span style={{ color: c.blue }}>dx</span>;
const DY: React.FC = () => <span style={{ color: c.amberDeep }}>dy</span>;
const Theta: React.FC = () => <V color={c.heroDeep}>θ</V>;

const num = (v: number) => `${v < 0 ? MINUS : ""}${Math.abs(v).toFixed(1)}`;

const Readout: React.FC<{ label: React.ReactNode; value: string; color: string; bg?: string }> = ({
  label,
  value,
  color,
  bg = c.surface,
}) => (
  <div
    style={{
      flex: 1,
      padding: "16px 22px",
      borderRadius: 20,
      background: bg,
      border: `2px solid ${c.line}`,
    }}
  >
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: c.inkMute,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 800,
        fontSize: 50,
        letterSpacing: "-0.03em",
        color,
        fontVariantNumeric: "tabular-nums",
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
  </div>
);

export const TrianglePanel: React.FC = () => (
  <PanelColumn exitAt={T.track - T.triangle - 0.5} gap={26}>
    <PanelNote text="Two positions in" at={0.3} />
    <Stagger at={0.5} step={0.2} style={{ display: "flex", gap: 14, marginTop: -10 }}>
      <Pill color={c.heroDeep} bg={c.heroTint} size={28}>
        Turret (0, 0)
      </Pill>
      <Pill color={c.amberDeep} bg={c.amberTint} size={28}>
        Target ({TRIANGLE_TARGET.x}, {TRIANGLE_TARGET.y})
      </Pill>
    </Stagger>
    <Stagger at={3} step={0.3} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Eq size={44} color={c.ink}>
        <DX />
        <Op>=</Op>
        {TRIANGLE_TARGET.x}
        <Op tight>{MINUS}</Op>0<Op>=</Op>
        <span style={{ color: c.blue, fontWeight: 800 }}>{TRIANGLE_TARGET.x}</span>
      </Eq>
      <Eq size={44} color={c.ink}>
        <DY />
        <Op>=</Op>
        {TRIANGLE_TARGET.y}
        <Op tight>{MINUS}</Op>0<Op>=</Op>
        <span style={{ color: c.amberDeep, fontWeight: 800 }}>{TRIANGLE_TARGET.y}</span>
      </Eq>
    </Stagger>
    <Eq size={50} color={c.ink}>
      <Term at={6.6}>
        tan <Theta />
        <Op>=</Op>
        <Frac n={<DY />} d={<DX />} />
      </Term>
      <Term at={8.3}>
        <Op>→</Op>
        <Theta />
        <Op>=</Op>
        arctan
        <span style={{ margin: "0 0.1em" }}>(</span>
        <Frac n={<DY />} d={<DX />} scale={0.8} />
        <span>)</span>
      </Term>
    </Eq>
    <Eq size={50} color={c.ink}>
      <Term at={10.4}>
        <Op>=</Op>
        arctan(0.75)
      </Term>
      <Term at={10.9} hl={c.heroTint} hlAt={11.1}>
        <Op>=</Op>
        <span style={{ color: c.heroDeep, fontWeight: 800 }}>{deg(aimDeg(TRIANGLE_TARGET))}</span>
      </Term>
    </Eq>
  </PanelColumn>
);

export const TrackPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = targetAt(frame / fps + T.track);
  return (
    <PanelColumn exitAt={T.bug - T.track - 0.5} gap={26}>
      <PanelTitle text="Recompute every *frame*" />
      <Enter at={0.7}>
        <div style={{ display: "flex", gap: 14 }}>
          <Readout label="dx" value={num(p.x)} color={c.blue} />
          <Readout label="dy" value={num(p.y)} color={c.amberDeep} />
          <Readout label="θ" value={deg(aimDeg(p))} color={c.heroDeep} bg={c.heroTint} />
        </div>
      </Enter>
      <CodeBlock
        title="aim.ts"
        at={2.2}
        cps={42}
        size={27}
        code={"const angle = Math.atan(dy / dx);\nturret.rotation = angle;"}
        focus={[{ line: 1, at: 5.6 }]}
      />
    </PanelColumn>
  );
};

export const BugPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const cell: React.CSSProperties = {
    fontFamily: fonts.sans,
    fontSize: 30,
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
  };
  const rows = [
    { pt: TRIANGLE_TARGET, ok: true },
    { pt: MIRROR_TARGET, ok: false },
  ];
  const strike = tween(frame, [sec(7.4), sec(7.9)], [0, 1], ease.inOutSoft);
  return (
    <PanelColumn exitAt={T.atan2 - T.bug - 0.5} gap={24}>
      <PanelTitle text="The *quadrant* bug" />
      <Pill color={c.red} bg={c.redTint} at={3.6} size={28}>
        It aims the opposite way
      </Pill>
      <Enter at={6.2}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            background: c.surface,
            border: `2px solid ${c.line}`,
            borderRadius: 22,
            padding: "14px 10px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "160px 120px 1fr",
              padding: "4px 16px",
              ...cell,
              fontSize: 18,
              letterSpacing: "0.12em",
              color: c.inkMute,
            }}
          >
            <span>TARGET</span>
            <span>DY ÷ DX</span>
            <span>ARCTAN</span>
          </div>
          {rows.map(({ pt, ok }, i) => (
            <Enter key={i} at={6.4 + i * 0.6} dy={10}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "160px 120px 1fr",
                  alignItems: "center",
                  padding: "8px 16px",
                  borderRadius: 14,
                  background: ok ? "transparent" : c.redTint,
                  ...cell,
                }}
              >
                <span style={{ color: c.ink }}>
                  ({num(pt.x).replace(".0", "")}, {num(pt.y).replace(".0", "")})
                </span>
                <span style={{ color: c.inkSoft }}>{(pt.y / pt.x).toFixed(2)}</span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: ok ? c.heroDeep : c.red,
                  }}
                >
                  <span style={{ position: "relative" }}>
                    {deg(naiveDeg(pt))}
                    {!ok ? (
                      <span
                        style={{
                          position: "absolute",
                          left: -4,
                          right: -4,
                          top: "52%",
                          height: 3,
                          background: c.red,
                          transform: `scaleX(${strike})`,
                          transformOrigin: "left",
                        }}
                      />
                    ) : null}
                  </span>
                  {!ok ? (
                    <span
                      style={{
                        fontSize: 22,
                        fontWeight: 600,
                        color: c.inkSoft,
                        opacity: strike,
                        whiteSpace: "nowrap",
                      }}
                    >
                      should be {deg(aimDeg(pt))}
                    </span>
                  ) : null}
                </span>
              </div>
            </Enter>
          ))}
        </div>
      </Enter>
      <Enter at={11.5}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Eq size={44} color={c.ink}>
            <DX />
            <Op>=</Op>0<Op>→</Op>
            <Frac n={<DY />} d="0" />
          </Eq>
          <Pill color={c.red} bg={c.redTint} at={12} size={28}>
            divides by zero
          </Pill>
        </div>
      </Enter>
    </PanelColumn>
  );
};

export const Atan2Panel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = targetAt(frame / fps + T.atan2);
  const circling = T.circle - T.atan2;
  return (
    <PanelColumn exitAt={T.uses - T.atan2 - 0.5} gap={24}>
      <PanelTitle text="Use *atan2*" />
      <CodeBlock
        title="aim.ts"
        at={0.6}
        cps={52}
        size={27}
        code={
          "const dx = target.x - turret.x;\nconst dy = target.y - turret.y;\nconst angle = Math.atan2(dy, dx);\nturret.rotation = angle;"
        }
        focus={[{ line: 3, at: 3.8 }]}
      />
      <Enter at={circling}>
        <div style={{ display: "flex", gap: 14 }}>
          <Readout
            label="atan2(dy, dx)"
            value={deg(aimDeg(p))}
            color={c.heroDeep}
            bg={c.heroTint}
          />
          <Readout
            label="arctan(dy ÷ dx)"
            value={Math.abs(p.x) < 1e-9 ? "—" : deg(naiveDeg(p))}
            color={p.x < 0 ? c.red : c.inkSoft}
          />
        </div>
      </Enter>
    </PanelColumn>
  );
};

/** Small line icons for the uses list, drawn in the theme colours. */
const Icon: React.FC<{ kind: "aim" | "face" | "stick" | "homing" }> = ({ kind }) => {
  const s = {
    stroke: c.heroDeep,
    strokeWidth: 3,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg width={56} height={56} viewBox="0 0 56 56">
      <rect x={1} y={1} width={54} height={54} rx={16} fill={c.heroTint} />
      {kind === "aim" ? (
        <>
          <circle cx={22} cy={34} r={9} {...s} />
          <path d="M 28 28 L 42 14" {...s} strokeWidth={5} />
        </>
      ) : null}
      {kind === "face" ? (
        <>
          <circle cx={20} cy={28} r={8} {...s} />
          <path d="M 30 28 L 44 28 M 39 23 L 44 28 L 39 33" {...s} />
        </>
      ) : null}
      {kind === "stick" ? (
        <>
          <circle cx={28} cy={30} r={13} {...s} />
          <circle cx={34} cy={24} r={5} fill={c.heroDeep} />
        </>
      ) : null}
      {kind === "homing" ? (
        <>
          <path d="M 12 42 Q 18 16 40 16" {...s} strokeDasharray="4 5" />
          <path d="M 44 16 L 36 11 L 38 16 L 36 21 Z" fill={c.heroDeep} />
        </>
      ) : null}
    </svg>
  );
};

export const UsesPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const homing = tween(frame, [sec(4.4), sec(4.8)], [0, 1], ease.out);
  const rows = [
    { kind: "aim" as const, k: "Aiming", q: "Point a weapon at a target" },
    { kind: "face" as const, k: "Facing", q: "Turn an enemy toward the player" },
    { kind: "stick" as const, k: "Input", q: "Read a joystick's direction" },
    { kind: "homing" as const, k: "Homing", q: "Steer toward the target each frame" },
  ];
  return (
    <PanelColumn exitAt={T.recap - T.uses - 0.5} gap={26}>
      <PanelTitle text="Where you'll *use* it" />
      <Stagger at={0.8} step={0.5} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r, i) => (
          <div
            key={r.k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "12px 18px",
              borderRadius: 20,
              background: i === 3 ? `rgba(18,161,90,${0.1 * homing})` : "transparent",
              border: `2px solid ${i === 3 && homing > 0.5 ? c.hero : "transparent"}`,
            }}
          >
            <Icon kind={r.kind} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 30, color: c.ink }}>
                {r.k}
              </span>
              <span
                style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 24, color: c.inkMute }}
              >
                {r.q}
              </span>
            </div>
          </div>
        ))}
      </Stagger>
    </PanelColumn>
  );
};

export const RecapPanel: React.FC = () => (
  <PanelColumn>
    <PanelTitle text="Two positions in, *one angle* out." />
    <RecapRows
      rows={[
        {
          k: "tan θ = dy ÷ dx",
          q: "The right triangle",
          a: deg(aimDeg(TRIANGLE_TARGET)),
          color: c.heroDeep,
          tint: c.heroTint,
        },
        {
          k: "arctan(dy ÷ dx)",
          q: "Loses the left half",
          a: "180° wrong",
          color: c.red,
          tint: c.redTint,
        },
        {
          k: "atan2(dy, dx)",
          q: "Every direction, dx = 0 too",
          a: `${MINUS}180° to 180°`,
          color: c.heroDeep,
          tint: c.heroTint,
        },
      ]}
    />
  </PanelColumn>
);
