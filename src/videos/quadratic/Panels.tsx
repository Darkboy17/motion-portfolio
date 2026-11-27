// Left-hand panels, one per chapter. Each sits in a Sequence that starts at its
// chapter, so times in here are seconds from the chapter start.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  Counter,
  Enter,
  Eq,
  ExitAt,
  Frac,
  Kicker,
  LottieClip,
  Op,
  Pill,
  Sqrt,
  Stagger,
  Sup,
  T as Term,
  V,
  WordReveal,
  ease,
  fmt,
  fonts,
  palettes,
  tween,
  useSec,
} from "../../kit";
import type { Model } from "./model";
import { T } from "./timeline";
import { dState, sweepHeight } from "./ThrowGraph";

const c = palettes.lab;
const MINUS = "−";

export const PANEL: React.CSSProperties = {
  position: "absolute",
  left: 96,
  top: 196,
  width: 720,
  display: "flex",
  flexDirection: "column",
  gap: 30,
};

const title: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontWeight: 800,
  fontSize: 62,
  letterSpacing: "-0.035em",
  lineHeight: 1.05,
};

const Title: React.FC<{ text: string; at?: number }> = ({ text, at = 0.15 }) => (
  <WordReveal
    text={text}
    at={at}
    color={c.ink}
    emphColor={c.heroDeep}
    emphFill={c.heroTint}
    style={title}
  />
);

const Note: React.FC<{ text: string; at: number }> = ({ text, at }) => (
  <Enter at={at} dy={14}>
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: c.inkMute,
      }}
    >
      {text}
    </div>
  </Enter>
);

/** h(t) = at² + bt + c with each term able to light up on its own. */
const Model: React.FC<{
  m: Model;
  size?: number;
  enter?: number;
  hl?: { a?: number; b?: number; c?: number };
  rhs?: React.ReactNode;
  lhs?: boolean;
}> = ({ m, size = 58, enter, hl = {}, rhs, lhs = true }) => {
  const e = (i: number) => (enter === undefined ? undefined : enter + i * 0.14);
  return (
    <Eq size={size} color={c.ink}>
      {lhs ? (
        <Term at={e(0)}>
          <V>h</V>(<V>t</V>)<Op>=</Op>
        </Term>
      ) : null}
      <Term at={e(1)} hl={c.redTint} hlAt={hl.a ?? 999}>
        {m.text.a}
        <V>t</V>
        <Sup>2</Sup>
      </Term>
      <Term at={e(2)} hl={c.heroTint} hlAt={hl.b ?? 999}>
        <Op tight>+</Op>
        {m.text.b}
        <V>t</V>
      </Term>
      <Term at={e(3)} hl={c.blueTint} hlAt={hl.c ?? 999}>
        <Op tight>+</Op>
        {m.text.c}
      </Term>
      {rhs ? <Term at={e(4)}>{rhs}</Term> : null}
    </Eq>
  );
};

export const HookTitle: React.FC = () => (
  <ExitAt at={T.model - 0.7}>
    <div
      style={{
        position: "absolute",
        left: 96,
        top: 300,
        width: 700,
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <Kicker text="Algebra · Quadratic equations" color={c.heroDeep} at={0.15} />
      <WordReveal
        text="Every throw draws a *parabola.*"
        at={0.35}
        color={c.ink}
        emphColor={c.heroDeep}
        emphFill={c.heroTint}
        style={{ ...title, fontSize: 100 }}
      />
      <Enter at={1.5}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 500,
            fontSize: 30,
            lineHeight: 1.4,
            color: c.inkSoft,
            maxWidth: 620,
          }}
        >
          One equation says when it lands, how high it goes, and whether it can reach a ledge.
        </div>
      </Enter>
    </div>
  </ExitAt>
);

const Row: React.FC<{ chip: React.ReactNode; tint: string; text: string }> = ({
  chip,
  tint,
  text,
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
    <div
      style={{
        minWidth: 150,
        display: "flex",
        justifyContent: "center",
        padding: "10px 18px",
        borderRadius: 16,
        background: tint,
      }}
    >
      <Eq size={34} color={c.ink}>
        {chip}
      </Eq>
    </div>
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 600,
        fontSize: 27,
        lineHeight: 1.3,
        color: c.inkSoft,
      }}
    >
      {text}
    </div>
  </div>
);

export const ModelPanel: React.FC<{ m: Model; v0: number; h0: number }> = ({ m, v0, h0 }) => (
  <ExitAt at={T.land - T.model - 0.5}>
    <div style={PANEL}>
      <Note text="Height after t seconds" at={0.2} />
      <Model m={m} enter={0.5} hl={{ a: 3.6, b: 4.6, c: 5.6 }} />
      <Stagger
        at={3.6}
        step={1}
        style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 14 }}
      >
        <Row
          tint={c.redTint}
          chip={
            <>
              {m.text.a}
              <V>t</V>
              <Sup>2</Sup>
            </>
          }
          text={`Gravity: half of ${m.text.g} m/s², pulling down`}
        />
        <Row
          tint={c.heroTint}
          chip={
            <>
              +{m.text.b}
              <V>t</V>
            </>
          }
          text={`Launch: ${fmt(v0)} m/s straight up`}
        />
        <Row
          tint={c.blueTint}
          chip={<>+{m.text.c}</>}
          text={`Start: ${fmt(h0)} m above the ground`}
        />
      </Stagger>
    </div>
  </ExitAt>
);

const Swap: React.FC<{ at: number; out?: number; children: React.ReactNode }> = ({
  at,
  out,
  children,
}) => (
  <Enter at={at} exitAt={out} dy={18} style={{ position: "absolute", left: 0, top: 0 }}>
    {children}
  </Enter>
);

export const LandPanel: React.FC<{ m: Model }> = ({ m }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const strike = tween(frame, [sec(14.4), sec(14.9)], [0, 1], ease.inOutSoft);
  return (
    <ExitAt at={T.peak - T.land - 0.5}>
      <div style={PANEL}>
        <Title text="When does it *land?*" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Note text="Landing means h(t) = 0" at={2.6} />
          <Model
            m={m}
            size={52}
            enter={2.9}
            lhs={false}
            hl={{ a: 6, b: 6.15, c: 6.3 }}
            rhs={
              <>
                <Op>=</Op>0
              </>
            }
          />
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <Pill color={c.ink} bg={c.redTint} at={6} size={28}>
            a = {m.text.a}
          </Pill>
          <Pill color={c.ink} bg={c.heroTint} at={6.15} size={28}>
            b = {m.text.b}
          </Pill>
          <Pill color={c.ink} bg={c.blueTint} at={6.3} size={28}>
            c = {m.text.c}
          </Pill>
        </div>
        <div style={{ position: "relative", height: 150 }}>
          <Swap at={7.2} out={9}>
            <Eq size={48} color={c.ink}>
              <V>t</V>
              <Op>=</Op>
              <Frac
                n={
                  <>
                    {MINUS}
                    <V>b</V>
                    <Op tight>±</Op>
                    <Sqrt>
                      <V>b</V>
                      <Sup>2</Sup>
                      <Op tight>{MINUS}</Op>4<V>a</V>
                      <V>c</V>
                    </Sqrt>
                  </>
                }
                d={
                  <>
                    2<V>a</V>
                  </>
                }
              />
            </Eq>
          </Swap>
          <Swap at={9.3}>
            <Eq size={46} color={c.ink}>
              <V>t</V>
              <Op>=</Op>
              <Frac
                n={
                  <>
                    {m.text.negB}
                    <Op tight>±</Op>
                    <Sqrt>{m.text.dLand}</Sqrt>
                  </>
                }
                d={m.text.twoA}
              />
              <Term at={9.9}>
                <Op>=</Op>
                <Frac
                  n={
                    <>
                      {m.text.negB}
                      <Op tight>±</Op>
                      {m.text.sqrtDLand}
                    </>
                  }
                  d={m.text.twoA}
                />
              </Term>
            </Eq>
          </Swap>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <Enter at={10.4} spring="bouncy">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 24px 14px 14px",
                borderRadius: 20,
                background: c.heroTint,
              }}
            >
              <div style={{ width: 54, height: 54 }}>
                <LottieClip
                  at={10.5}
                  file="check.json"
                  tint={c.hero}
                  style={{ width: 54, height: 54 }}
                />
              </div>
              <Eq size={44} color={c.heroDeep} weight={800}>
                <V>t</V>
                <Op>=</Op>
                {m.text.landing} s
              </Eq>
            </div>
          </Enter>
          <Enter at={14} spring="bouncy">
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                padding: "14px 24px",
                borderRadius: 20,
                background: c.panel,
                opacity: 1 - strike * 0.45,
              }}
            >
              <Eq size={44} color={c.inkSoft} weight={700}>
                <V>t</V>
                <Op>=</Op>
                {m.text.before} s
              </Eq>
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  right: 18,
                  top: "50%",
                  height: 4,
                  borderRadius: 2,
                  background: c.red,
                  transform: `scaleX(${strike})`,
                  transformOrigin: "left",
                }}
              />
            </div>
          </Enter>
        </div>
      </div>
    </ExitAt>
  );
};

export const PeakPanel: React.FC<{ m: Model }> = ({ m }) => (
  <ExitAt at={T.reach - T.peak - 0.5}>
    <div style={PANEL}>
      <Title text="How *high* does it go?" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Note text="The peak is halfway between the roots" at={2.8} />
        <Eq size={54} color={c.ink}>
          <Term at={3.1}>
            <V>t</V>
            <Op>=</Op>
            <Frac
              n={
                <>
                  {MINUS}
                  <V>b</V>
                </>
              }
              d={
                <>
                  2<V>a</V>
                </>
              }
            />
          </Term>
          <Term at={4.3}>
            <Op>=</Op>
            <Frac n={m.text.negB} d={m.text.twoA} />
          </Term>
          <Term at={5.4} hl={c.amberTint} hlAt={5.6}>
            <Op>=</Op>
            {m.text.peakT} s
          </Term>
        </Eq>
      </div>
      <Enter at={6.6} spring="bouncy" style={{ marginTop: 10 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            padding: "26px 34px",
            borderRadius: 28,
            background: c.amberTint,
            width: "fit-content",
          }}
        >
          <div
            style={{
              fontFamily: fonts.sans,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: c.amberDeep,
            }}
          >
            Maximum height
          </div>
          <Counter
            to={m.peak.y}
            decimals={2}
            suffix=" m"
            at={6.7}
            dur={1.2}
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 104,
              letterSpacing: "-0.04em",
              color: c.ink,
              lineHeight: 1,
            }}
          />
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 26, color: c.inkSoft }}>
            h({m.text.peakT}) = {m.text.peakH} m
          </div>
        </div>
      </Enter>
    </div>
  </ExitAt>
);

const stateCopy = {
  neg: { label: "D < 0", say: "misses: no real solution", color: c.red, tint: c.redTint },
  zero: { label: "D = 0", say: "touches once, at the peak", color: c.amberDeep, tint: c.amberTint },
  pos: { label: "D > 0", say: "crosses twice", color: c.heroDeep, tint: c.heroTint },
} as const;

export const ReachPanel: React.FC<{ m: Model; ledge: number }> = ({ m, ledge }) => {
  const sweepAt = T.sweep - T.reach;
  const verdict = stateCopy[dState(m.dLedge)];
  return (
    <ExitAt at={T.recap - T.reach - 0.5}>
      <div style={PANEL}>
        <Title text={`Can it reach a *${m.text.ledgeH} m* ledge?`} />
        <div style={{ position: "relative", height: 440 }}>
          <Enter
            at={0}
            exitAt={sweepAt - 0.6}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            <Note text={`Set h(t) = ${m.text.ledgeH}`} at={3.2} />
            <Model
              m={m}
              size={46}
              enter={3.4}
              lhs={false}
              rhs={
                <>
                  <Op>=</Op>
                  {m.text.ledgeH}
                </>
              }
            />
            <Eq size={46} color={c.ink}>
              <Term at={4.6}>
                {m.text.a}
                <V>t</V>
                <Sup>2</Sup>
                <Op tight>+</Op>
                {m.text.b}
                <V>t</V>
              </Term>
              <Term at={4.8} hl={c.blueTint} hlAt={5}>
                <Op tight>{m.text.ledgeCOp}</Op>
                {m.text.ledgeCAbs}
              </Term>
              <Term at={4.9}>
                <Op>=</Op>0
              </Term>
            </Eq>
            <Eq size={46} color={c.ink}>
              <Term at={5.8}>
                <V>D</V>
                <Op>=</Op>
                <V>b</V>
                <Sup>2</Sup>
                <Op tight>{MINUS}</Op>4<V>a</V>
                <V>c</V>
              </Term>
              <Term at={6.5}>
                <Op>=</Op>
                {m.text.bSq}
                <Op tight>{m.text.fourACLedgeOp}</Op>
                {m.text.fourACLedge}
              </Term>
            </Eq>
            <Eq size={46} color={c.ink}>
              <Term at={7.1} hl={verdict.tint} hlAt={7.3}>
                <V>D</V>
                <Op>=</Op>
                <span style={{ color: verdict.color, fontWeight: 800 }}>{m.text.dLedge}</span>
              </Term>
            </Eq>
            <Pill color={verdict.color} bg={verdict.tint} at={7.4} size={28}>
              {verdict.label} · {m.reaches ? "it gets there" : "no real solution"}
            </Pill>
          </Enter>
          <Enter at={sweepAt} style={{ position: "absolute", inset: 0 }}>
            <SweepReadout m={m} ledge={ledge} />
          </Enter>
        </div>
      </div>
    </ExitAt>
  );
};

const SweepReadout: React.FC<{ m: Model; ledge: number }> = ({ m, ledge }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tAbs = frame / fps + T.reach;
  const H = sweepHeight(tAbs, m, ledge);
  const D = m.q.b * m.q.b - 4 * m.q.a * (m.q.c - H);
  const state = dState(D);
  const card = (label: string, value: string, color: string) => (
    <div
      style={{
        flex: 1,
        padding: "20px 26px",
        borderRadius: 22,
        background: c.surface,
        border: `2px solid ${c.line}`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: "0.12em",
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
          fontSize: 64,
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ display: "flex", gap: 18 }}>
        {card("Line height", `${fmt(H, 2)} m`, c.ink)}
        {card(
          "Discriminant",
          state === "zero" ? "0" : (D < 0 ? MINUS : "") + fmt(Math.abs(D), 1),
          stateCopy[state].color,
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(["neg", "zero", "pos"] as const).map((k) => {
          const on = k === state;
          const s = stateCopy[k];
          return (
            <div
              key={k}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "12px 20px",
                borderRadius: 16,
                background: on ? s.tint : "transparent",
                opacity: on ? 1 : 0.42,
                fontFamily: fonts.sans,
                fontSize: 28,
                fontWeight: 700,
                color: on ? s.color : c.inkSoft,
              }}
            >
              <span style={{ width: 110, fontWeight: 800 }}>{s.label}</span>
              <span style={{ fontWeight: 600 }}>{s.say}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RecapPanel: React.FC<{ m: Model }> = ({ m }) => {
  const rows = [
    {
      k: "Roots",
      q: "When does it land?",
      a: `${m.text.landing} s`,
      color: c.heroDeep,
      tint: c.heroTint,
    },
    {
      k: "Vertex",
      q: "How high does it go?",
      a: `${m.text.peakH} m`,
      color: c.amberDeep,
      tint: c.amberTint,
    },
    {
      k: "Discriminant",
      q: `Can it reach ${m.text.ledgeH} m?`,
      a: m.reaches ? "Yes" : "No",
      color: m.reaches ? c.heroDeep : c.red,
      tint: m.reaches ? c.heroTint : c.redTint,
    },
  ];
  return (
    <div style={PANEL}>
      <Title text="One equation, *three answers.*" />
      <Stagger at={1.3} step={0.45} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {rows.map((r) => (
          <div
            key={r.k}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "20px 26px",
              borderRadius: 22,
              background: c.surface,
              border: `2px solid ${c.line}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 30, color: c.ink }}>
                {r.k}
              </div>
              <div
                style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 24, color: c.inkMute }}
              >
                {r.q}
              </div>
            </div>
            <div
              style={{
                padding: "10px 20px",
                borderRadius: 14,
                background: r.tint,
                fontFamily: fonts.sans,
                fontWeight: 800,
                fontSize: 34,
                color: r.color,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {r.a}
            </div>
          </div>
        ))}
      </Stagger>
    </div>
  );
};
