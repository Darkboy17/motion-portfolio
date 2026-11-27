// The type layer: the title, the sheet header and piece counter, the
// construction steps, the fabric swatches and the end card. Times are absolute
// seconds from the timeline, because these panels hand over to one another.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  DrawPath,
  Enter,
  Kicker,
  breathe,
  ease,
  enterStyle,
  fonts,
  palettes,
  parseWords,
  springs,
  tween,
  useExit,
  useSec,
  useSpring,
} from "../../kit";
import { FabricDefs, FABRICS, fabricUrl } from "./fabrics";
import { landingTime } from "./Garment";
import { MINI } from "./layout";
import { PIECES } from "./pieces";
import { STEPS, STITCH, SWAPS, T } from "./timeline";

const c = palettes.atelier;
const LEFT = 120;

const caps: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
};

/**
 * Editorial headline: words rise in one by one, and *emphasised* words are set
 * in Fraunces italic, optionally in the hero colour.
 */
const Headline: React.FC<{
  text: string;
  at: number;
  size: number;
  exitAt?: number;
  emphColor?: string;
  per?: number;
  style?: React.CSSProperties;
}> = ({ text, at, size, exitAt, emphColor = c.ink, per = 0.09, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const exit = useExit(exitAt, 0.3);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: Math.round(size * 0.24),
        rowGap: 0,
        fontFamily: fonts.serif,
        fontWeight: 400,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: "-0.025em",
        color: c.ink,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 16}px)`,
        ...style,
      }}
    >
      {parseWords(text).map((w, i) => {
        const p = spring({ frame: frame - sec(at + i * per), fps, config: springs.snappy });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: Math.min(p * 1.3, 1),
              transform: `translateY(${interpolate(p, [0, 1], [size * 0.42, 0])}px) rotate(${interpolate(p, [0, 1], [2, 0])}deg)`,
              transformOrigin: "left bottom",
              fontStyle: w.emph ? "italic" : "normal",
              fontWeight: w.emph ? 300 : 400,
              color: w.emph ? emphColor : undefined,
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/** A thin rule that draws from the left. */
const Rule: React.FC<{ at: number; width: number; exitAt?: number }> = ({ at, width, exitAt }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const p = tween(frame, [sec(at), sec(at + 0.6)], [0, 1], ease.inOutSoft);
  const exit = useExit(exitAt, 0.3);
  return (
    <div
      style={{ width: width * p, height: 1.5, background: c.inkSoft, opacity: 0.5 * (1 - exit) }}
    />
  );
};

// ---------------------------------------------------------------- 1. title

export const IntroPanel: React.FC = () => {
  const out = T.explode - 0.45;
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: 292,
        width: 620,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Kicker
        text="Pattern study · No. 01"
        at={T.title}
        exitAt={out}
        color={c.inkSoft}
        ruleColor={c.ink}
        size={20}
      />
      <Headline
        text="Anatomy of a *Shirt*"
        at={T.title + 0.25}
        size={128}
        exitAt={out + 0.05}
        emphColor={c.hero}
        style={{ marginTop: 30, width: 600 }}
      />
      <Enter at={1.5} exitAt={out + 0.1} dy={18} style={{ marginTop: 34 }}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontSize: 27,
            lineHeight: 1.45,
            color: c.inkSoft,
            width: 520,
          }}
        >
          A classic button-down, drawn flat, cut into its pattern and sewn back together.
        </div>
      </Enter>
      <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 16 }}>
        <Rule at={2.0} width={520} exitAt={out + 0.15} />
        <Enter at={2.2} exitAt={out + 0.15} dy={10}>
          <div style={{ ...caps, fontSize: 15, color: c.inkMute, display: "flex", gap: 34 }}>
            <span>Style 01</span>
            <span>Size M</span>
            <span>Oxford cotton</span>
          </div>
        </Enter>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 2. sheet header and counter

export const SheetHeader: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const out = T.gather;
  const legend = tween(frame, [sec(T.allowance), sec(T.allowance + 0.6)], [0, 1], ease.out);
  const legendExit = useExit(out, 0.3);
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: 96,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Kicker
        text="Pattern sheet · Size M"
        at={T.sheet}
        exitAt={out}
        color={c.inkSoft}
        ruleColor={c.ink}
        size={18}
      />
      <div style={{ position: "relative", height: 84, marginTop: 20, width: 700 }}>
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <Headline
            text="Taken *apart.*"
            at={T.sheet + 0.2}
            size={72}
            exitAt={T.measure - 0.35}
            emphColor={c.hero}
          />
        </div>
        <div style={{ position: "absolute", left: 0, top: 0 }}>
          <Headline text="Measured *to size.*" at={T.measure} size={72} exitAt={out} />
        </div>
      </div>
      <div
        style={{
          marginTop: 22,
          display: "flex",
          alignItems: "center",
          gap: 14,
          ...caps,
          fontSize: 14,
          color: c.inkSoft,
          ...enterStyle(legend, legendExit, { dx: -12, dy: 0 }),
        }}
      >
        <svg width={46} height={6}>
          <line
            x1={0}
            y1={3}
            x2={46}
            y2={3}
            stroke={c.inkSoft}
            strokeWidth={1.4}
            strokeDasharray="6 4"
          />
        </svg>
        1 cm seam allowance
      </div>
    </div>
  );
};

/** Counts pieces as they land on the sheet; each new number rolls up into place. */
export const PieceCounter: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const landings = PIECES.map(landingTime).sort((a, b) => a - b);
  const count = landings.filter((at) => t >= at).length;
  const last = count > 0 ? landings[count - 1] : T.sheet;
  const roll = spring({ frame: frame - sec(last), fps, config: springs.snappy });
  const p = useSpring(sec(T.sheet + 0.3), "smooth");
  const exit = useExit(T.gather, 0.3);
  return (
    <div
      style={{
        position: "absolute",
        right: LEFT,
        top: 84,
        display: "flex",
        alignItems: "flex-end",
        gap: 22,
        ...enterStyle(p, exit, { dy: 20 }),
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
          paddingBottom: 18,
        }}
      >
        <span style={{ ...caps, fontSize: 15, color: c.ink }}>Pieces</span>
        <span style={{ ...caps, fontSize: 13, color: c.inkMute, fontWeight: 600 }}>
          of {PIECES.length}
        </span>
      </div>
      <div
        style={{
          fontFamily: fonts.serif,
          fontWeight: 300,
          fontSize: 120,
          lineHeight: 1,
          color: c.ink,
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.03em",
          overflow: "hidden",
          height: 124,
          paddingTop: 2,
        }}
      >
        <div
          style={{
            transform: `translateY(${interpolate(roll, [0, 1], [40, 0])}px)`,
            opacity: Math.min(1, 0.3 + roll),
          }}
        >
          {String(count).padStart(2, "0")}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 3. construction

const Check: React.FC<{ progress: number }> = ({ progress }) => (
  <svg width={26} height={26} viewBox="0 0 26 26" style={{ overflow: "visible" }}>
    <DrawPath d="M 5 13.5 L 10.5 19 L 21 7.5" progress={progress} stroke={c.ink} width={2.4} />
  </svg>
);

export const ConstructionPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const at = T.gather + 0.5;
  const out = T.fabric - 0.35;
  const active = STEPS.reduce((acc, s, i) => (t >= s.at ? i : acc), -1);
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: 104,
        width: 500,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Kicker
        text={`Construction · ${STEPS.length} seams`}
        at={at}
        exitAt={out}
        color={c.inkSoft}
        ruleColor={c.ink}
        size={18}
      />
      <Headline
        text="Sewn *together.*"
        at={at + 0.15}
        size={64}
        exitAt={out}
        style={{ marginTop: 20 }}
      />
      <div style={{ marginTop: 34, display: "flex", flexDirection: "column" }}>
        {STEPS.map((s, i) => {
          const enter = spring({
            frame: frame - sec(at + 0.35 + i * 0.08),
            fps,
            config: springs.smooth,
          });
          const exit = tween(
            frame,
            [sec(out + i * 0.03), sec(out + i * 0.03 + 0.3)],
            [0, 1],
            ease.in,
          );
          const on = tween(frame, [sec(s.at), sec(s.at + 0.3)], [0, 1], ease.out);
          const done = s.at + STITCH.delay + STITCH.dur;
          const check = tween(frame, [sec(done), sec(done + 0.35)], [0, 1], ease.out);
          const isActive = i === active && t < T.complete;
          const bar = isActive ? on : 0;
          return (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                height: 48,
                borderTop: `1px solid ${c.line}`,
                ...enterStyle(enter, exit, { dx: -18, dy: 0 }),
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 30,
                  marginRight: 18,
                  background: c.hero,
                  transform: `scaleY(${bar})`,
                  borderRadius: 2,
                }}
              />
              <div style={{ width: 46, position: "relative", height: 30 }}>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    fontFamily: fonts.serif,
                    fontStyle: "italic",
                    fontSize: 24,
                    color: i <= active ? c.ink : c.inkMute,
                    opacity: 1 - check,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{ position: "absolute", left: 0, top: 2, opacity: check }}>
                  <Check progress={check} />
                </div>
              </div>
              <span
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 29,
                  color: i <= active ? c.ink : c.inkMute,
                  transform: `translateX(${bar * 6}px)`,
                  flex: 1,
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  ...caps,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: c.inkMute,
                  letterSpacing: "0.14em",
                }}
              >
                {s.note}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** Caption over the shrunken sheet the pieces are sewn from. */
export const TrayCaption: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: MINI.area.x0,
      top: MINI.area.y0 - 52,
      width: MINI.area.x1 - MINI.area.x0,
    }}
  >
    <Kicker
      text="Cut pieces"
      at={T.gather + 0.3}
      // Leaves with the last pieces in the tray.
      exitAt={STEPS[STEPS.length - 1].at + 0.4}
      color={c.inkMute}
      ruleColor={c.inkMute}
      size={14}
    />
  </div>
);

// ---------------------------------------------------------------- 4. fabric

const Swatch: React.FC<{ id: keyof typeof FABRICS; size: number; prefix: string }> = ({
  id,
  size,
  prefix,
}) => (
  <svg
    width={size}
    height={size}
    viewBox={`0 0 ${size / 1.6} ${size / 1.6}`}
    style={{ display: "block" }}
  >
    <defs>
      <FabricDefs prefix={prefix} />
    </defs>
    <rect width="100%" height="100%" fill={fabricUrl(prefix, id)} />
  </svg>
);

export const FabricPanel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;
  const at = T.fabric;
  const out = T.end - 0.4;
  const current = SWAPS.reduce((acc, s, i) => (t >= s.at ? i : acc), 0);
  const swap = SWAPS[current];
  const cardIn = spring({
    frame: frame - sec(swap.at + (current === 0 ? 0.4 : 0.05)),
    fps,
    config: springs.snappy,
  });
  const exit = useExit(out, 0.3);
  const fab = FABRICS[swap.fabric];
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: 236,
        width: 600,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Kicker
        text="Cloth · 4 of many"
        at={at + 0.1}
        exitAt={out}
        color={c.inkSoft}
        ruleColor={c.ink}
        size={18}
      />
      <Headline
        text="One pattern,"
        at={at + 0.25}
        size={64}
        exitAt={out}
        style={{ marginTop: 20 }}
      />
      <Headline text="*any cloth.*" at={at + 0.45} size={64} exitAt={out + 0.05} />
      <div
        style={{ marginTop: 46, display: "flex", gap: 30, alignItems: "center", opacity: 1 - exit }}
      >
        <div
          style={{
            width: 150,
            height: 150,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: `0 18px 40px -22px ${c.ink}`,
            outline: `1px solid ${c.line}`,
            transform: `rotate(${interpolate(cardIn, [0, 1], [-6, -2]) + breathe(frame, 120, 0.4)}deg) scale(${interpolate(cardIn, [0, 1], [0.8, 1])})`,
            opacity: Math.min(1, cardIn * 1.4),
          }}
        >
          <Swatch id={swap.fabric} size={150} prefix={`card-${current}`} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            ...enterStyle(cardIn, 0, { dy: 22 }),
          }}
        >
          <span
            style={{ ...caps, fontSize: 13, color: c.inkMute }}
          >{`0${current + 1} / 0${SWAPS.length}`}</span>
          <span
            style={{
              fontFamily: fonts.serif,
              fontStyle: "italic",
              fontWeight: 300,
              fontSize: 56,
              lineHeight: 1,
              color: c.ink,
            }}
          >
            {fab.name}
          </span>
          <span
            style={{
              ...caps,
              fontSize: 13.5,
              fontWeight: 600,
              color: c.inkSoft,
              letterSpacing: "0.14em",
            }}
          >
            {fab.spec}
          </span>
        </div>
      </div>
      <div style={{ marginTop: 48, display: "flex", gap: 14 }}>
        {SWAPS.map((s, i) => {
          const chip = spring({
            frame: frame - sec(at + 0.5 + i * 0.07),
            fps,
            config: springs.smooth,
          });
          const on = t >= s.at ? tween(frame, [sec(s.at), sec(s.at + 0.3)], [0, 1], ease.out) : 0;
          const isOn = i === current;
          return (
            <div
              key={s.fabric}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                ...enterStyle(chip, exit, { dy: 14 }),
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 4,
                  overflow: "hidden",
                  outline: `1px solid ${c.line}`,
                  transform: `translateY(${isOn ? -6 * on : 0}px)`,
                  opacity: isOn ? 1 : 0.55,
                }}
              >
                <Swatch id={s.fabric} size={64} prefix={`chip-${i}`} />
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 2,
                  background: c.hero,
                  transform: `scaleX(${isOn ? on : 0})`,
                  transformOrigin: "left",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- 5. end card

export const EndCard: React.FC = () => {
  // Real counts, read off the data.
  const lines = [`${PIECES.length} pieces.`, `${STEPS.length} seams.`, "*One shirt.*"];
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT,
        top: 300,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {lines.map((line, i) => (
        <Headline
          key={line}
          text={line}
          at={T.end + 0.1 + i * 0.4}
          size={104}
          per={0.07}
          emphColor={c.hero}
        />
      ))}
      <div style={{ marginTop: 42 }}>
        <Kicker
          text="Pattern study · No. 01"
          at={T.end + 1.4}
          color={c.inkSoft}
          ruleColor={c.ink}
          size={18}
        />
      </div>
    </div>
  );
};
