// A living style sheet for the kit: every component, animating, with its name.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  Arrow,
  AngleArc,
  Axes,
  Callout,
  CodeBlock,
  Counter,
  DrawPath,
  Enter,
  Eq,
  FnPath,
  Frac,
  Gauge,
  Graph,
  Guide,
  Kicker,
  LottieClip,
  Op,
  Pill,
  Point,
  Sfx,
  Sqrt,
  Stage,
  Sup,
  V,
  WordReveal,
  fonts,
  palettes,
  tween,
  useSec,
} from "../../kit";

const c = palettes.lab;

const Tile: React.FC<{
  name: string;
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ name, at, children, style }) => (
  <Enter at={at} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
    <div
      style={{
        position: "relative",
        background: c.surface,
        border: `2px solid ${c.line}`,
        borderRadius: 24,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {children}
    </div>
    <div style={{ fontFamily: fonts.mono, fontSize: 20, color: c.inkSoft }}>
      {"<"}
      <span style={{ color: c.heroDeep, fontWeight: 700 }}>{name}</span>
      {" />"}
    </div>
  </Enter>
);

export const KIT_GALLERY_SECONDS = 14;

export const KitGallery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const speed = 52 + Math.sin(t * 0.9) * 28 + tween(frame, [0, sec(2)], [-52, 0]);
  const theta = -0.6 - 0.5 * Math.sin(t * 0.8);
  return (
    <Stage grid>
      <AbsoluteFill
        style={{ padding: "70px 96px", gap: 34, display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Kicker text="Video kit · components" color={c.heroDeep} at={0.1} />
          <WordReveal
            text="Small parts, *one system.*"
            at={0.3}
            color={c.ink}
            emphColor={c.heroDeep}
            emphFill={c.heroTint}
            style={{
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 72,
              letterSpacing: "-0.035em",
            }}
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 30 }}>
          <Tile name="Graph · FnPath" at={0.6} style={{ height: 300 }}>
            <Graph
              width={380}
              height={280}
              x={[0, 4]}
              y={[0, 14]}
              pad={{ l: 56, r: 16, t: 24, b: 50 }}
            >
              <Axes at={0.8} xTicks={[0, 1, 2, 3, 4]} yTicks={[0, 7, 14]} />
              <FnPath
                f={(x) => -4.9 * x * x + 15 * x + 2}
                from={0}
                to={3.19}
                at={1.2}
                dur={1.6}
                color={c.hero}
              />
              <Guide y={13.48} at={2.6} color={c.amber} span={[0, 4]} />
              <Point x={1.53} y={13.48} start={2.8} color={c.amber} />
            </Graph>
          </Tile>
          <Tile name="Eq · Frac · Sqrt" at={0.72} style={{ height: 300 }}>
            <Eq size={46} color={c.ink}>
              <V>t</V>
              <Op>=</Op>
              <Frac
                n={
                  <>
                    <span>{"−"}</span>
                    <V>b</V>
                    <Op tight>±</Op>
                    <Sqrt>
                      <V>b</V>
                      <Sup>2</Sup>
                      <Op tight>{"−"}</Op>4<V>a</V>
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
          </Tile>
          <Tile name="Gauge" at={0.84} style={{ height: 300 }}>
            <div style={{ transform: "scale(0.62)", marginTop: -20 }}>
              <Gauge
                value={Math.max(0, speed)}
                max={120}
                step={20}
                unit="KM/H"
                size={420}
                at={0.9}
              />
            </div>
          </Tile>
          <Tile name="AngleArc · Arrow" at={0.96} style={{ height: 300 }}>
            <svg width={380} height={280}>
              <Arrow from={{ x: 70, y: 220 }} to={{ x: 330, y: 220 }} at={1.2} color={c.inkMute} />
              <Arrow
                from={{ x: 70, y: 220 }}
                to={{ x: 70 + 230 * Math.cos(theta), y: 220 + 230 * Math.sin(theta) }}
                progress={1}
                color={c.hero}
                width={4}
              />
              <AngleArc
                center={{ x: 70, y: 220 }}
                r={90}
                from={theta}
                to={0}
                color={c.hero}
                label={`${Math.round((-theta * 180) / Math.PI)}°`}
                labelOffset={44}
              />
            </svg>
          </Tile>
          <Tile name="CodeBlock" at={1.08} style={{ height: 300, background: c.panel }}>
            <CodeBlock
              code={"const a = Math.atan2(dy, dx);\nturret.rotation = a;"}
              title="aim.ts"
              at={1.3}
              cps={30}
              size={19}
              focus={[{ line: 1, at: 4 }]}
            />
          </Tile>
          <Tile name="Callout · DrawPath" at={1.2} style={{ height: 300 }}>
            <svg width={380} height={280}>
              <DrawPath
                d="M 60 200 C 120 60, 220 60, 300 180"
                at={1.5}
                dur={1.2}
                stroke={c.ink}
                width={5}
              />
              <Callout
                anchor={{ x: 183, y: 96 }}
                label={{ x: 230, y: 50 }}
                text="vertex"
                sub="the peak"
                at={2.6}
                color={c.amber}
                textColor={c.ink}
                subColor={c.inkMute}
              />
            </svg>
          </Tile>
          <Tile name="LottieClip" at={1.32} style={{ height: 300, gap: 10 }}>
            {(["burst", "check", "sparkle", "tag"] as const).map((f, i) => (
              <div key={f} style={{ width: 84, height: 84 }}>
                <LottieClip
                  file={`${f}.json`}
                  tint={[c.hero, c.hero, c.amber, c.ink][i]}
                  loop={f === "sparkle" || f === "tag"}
                  style={{ width: 84, height: 84 }}
                />
              </div>
            ))}
          </Tile>
          <Tile
            name="Counter · Pill"
            at={1.44}
            style={{ height: 300, flexDirection: "column", gap: 20 }}
          >
            <Counter
              to={13.48}
              decimals={2}
              suffix=" m"
              at={1.8}
              dur={1.6}
              style={{
                fontFamily: fonts.sans,
                fontWeight: 800,
                fontSize: 76,
                color: c.ink,
                letterSpacing: "-0.03em",
              }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <Pill color={c.heroDeep} bg={c.heroTint} at={2.6}>
                D &gt; 0
              </Pill>
              <Pill color={c.amberDeep} bg={c.amberTint} at={2.75}>
                D = 0
              </Pill>
              <Pill color={c.red} bg={c.redTint} at={2.9}>
                D &lt; 0
              </Pill>
            </div>
          </Tile>
        </div>
      </AbsoluteFill>
      <Sfx at={0.3} name="rise" />
      {[0.6, 0.72, 0.84, 0.96, 1.08, 1.2, 1.32, 1.44].map((s, i) => (
        <Sfx key={s} at={s} name="tick" take={i} />
      ))}
      <Sfx at={1.3} name="typing" dur={1.4} gain={0.8} />
      <Sfx at={1.5} name="pencil" take={2} />
      <Sfx at={2.6} name="pluck" />
    </Stage>
  );
};
