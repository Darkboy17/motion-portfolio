// The words, scene by scene. All times are absolute seconds from the beat sheet.
import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { Enter, Kicker, WordReveal, breathe, fonts, palettes } from "../../kit";
import { Swatch } from "./Swatch";
import { COLOURWAYS, PLATE, T, WEAVE_PLATE } from "./timeline";
import { Caps, LetterReveal, Roll, Tag } from "./Type";
import { REPEAT } from "./weave";

const c = palettes.atelier;
const MARGIN = 72;
const TITLE_SIZE = 132;

const serif: React.CSSProperties = {
  fontFamily: fonts.serif,
  fontStyle: "italic",
  fontWeight: 400,
  color: c.ink,
  letterSpacing: "-0.015em",
};

/** Mounts its children only between two times, so off-screen copy costs nothing. */
const During: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({
  from,
  to,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return t >= from && t < to ? <>{children}</> : null;
};

/** A slow float for type that holds on screen for more than a couple of seconds. */
const Breathing: React.FC<{ style: React.CSSProperties; children: React.ReactNode }> = ({
  style,
  children,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ ...style, transform: `translateY(${breathe(frame, 140, 1.5)}px)` }}>
      {children}
    </div>
  );
};

/** Kicker and title, shared by the opening and the end card so the loop lines up. */
const Masthead: React.FC<{ at: number; exitAt?: number; rule: string }> = ({
  at,
  exitAt,
  rule,
}) => {
  return (
    <Breathing
      style={{
        position: "absolute",
        left: MARGIN,
        top: 84,
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}
    >
      <Kicker
        text="Pattern study · No. 02"
        at={at}
        exitAt={exitAt}
        color={c.inkSoft}
        ruleColor={rule}
        size={19}
      />
      <LetterReveal
        text="Houndstooth"
        at={at + 0.15}
        exitAt={exitAt}
        size={TITLE_SIZE}
        style={serif}
      />
    </Breathing>
  );
};

/** A centred caption under the plate, where the dimension line sits. */
const UnderPlate: React.FC<{ at: number; exitAt: number; children: React.ReactNode }> = ({
  at,
  exitAt,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: PLATE.y + PLATE.h + 52,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <Enter at={at} exitAt={exitAt} dy={12}>
      {children}
    </Enter>
  </div>
);

const repeats = (n: number) => `× ${n * n}`;

export const Copy: React.FC = () => (
  <>
    <During from={0} to={T.tile3 + 0.3}>
      <Masthead at={T.kicker} exitAt={T.mastheadOut} rule={c.ink} />
      <UnderPlate at={T.repeat + 0.3} exitAt={T.labelsOut}>
        <Caps color={c.ink}>
          One repeat · {REPEAT} × {REPEAT}
        </Caps>
      </UnderPlate>
    </During>

    <During from={T.tile3} to={T.weave + 0.4}>
      <Tag at={T.tile3 + 0.25} exitAt={T.weave - 0.3} style={{ left: MARGIN, bottom: MARGIN }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <Caps size={16} color={c.inkSoft}>
            Step & repeat
          </Caps>
          <Roll
            height={40}
            style={{ width: 82 }}
            items={[3, 5, 7].map((n, i) => ({
              at: [T.tile3, T.tile5, T.field][i] + 0.25,
              node: <div style={{ ...serif, fontSize: 36, lineHeight: 1.1 }}>{repeats(n)}</div>,
            }))}
          />
        </div>
      </Tag>
    </During>

    <During from={T.weave} to={T.colour + 0.4}>
      <Breathing style={{ position: "absolute", left: MARGIN, top: 76 }}>
        <LetterReveal
          text="How it’s woven"
          at={T.heading}
          exitAt={T.weaveOut}
          per={0.025}
          size={64}
          style={serif}
        />
      </Breathing>
      <div
        style={{
          position: "absolute",
          left: WEAVE_PLATE.x,
          top: WEAVE_PLATE.y + WEAVE_PLATE.h + 30,
        }}
      >
        <Enter at={T.twill + 0.2} exitAt={T.relax} dy={12}>
          <Caps color={c.ink}>2/2 twill · over two, under two, one step a pick</Caps>
        </Enter>
      </div>
      <div
        style={{
          position: "absolute",
          left: WEAVE_PLATE.x,
          top: WEAVE_PLATE.y + WEAVE_PLATE.h + 22,
        }}
      >
        <WordReveal
          text="The weave *is* the pattern."
          at={T.moral}
          exitAt={T.weaveOut}
          color={c.ink}
          emphColor={c.hero}
          style={{ ...serif, fontSize: 40 }}
        />
      </div>
    </During>

    <During from={T.ways[0]} to={T.colourOut + 0.4}>
      <Swatch
        ways={COLOURWAYS}
        times={T.ways}
        at={T.ways[0]}
        exitAt={T.colourOut}
        style={{ left: MARGIN, bottom: MARGIN }}
      />
    </During>

    <During from={T.end} to={T.total}>
      <Masthead at={T.endTitle - 0.15} rule={c.hero} />
      <UnderPlate at={T.endTitle + 0.5} exitAt={T.total + 1}>
        <Caps color={c.inkSoft}>2/2 twill · 4 dark, 4 light · warp and weft</Caps>
      </UnderPlate>
    </During>
  </>
);
