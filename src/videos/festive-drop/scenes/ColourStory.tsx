// 13-16.5 s. The colour story: four tall swatches with pinked tops rise on the
// beat, like fabric chips. Once each lands, its block print blooms and then
// drifts slowly up the cloth; the chip's label names the colour.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DrawPath, ease, fonts, springs, tween, useExit, useSec } from "../../../kit";
import type { MotifName } from "../motifs";
import { MotifPattern } from "../motifs";
import { fd, inkShadow, mix } from "../palette";
import { SerifLine } from "../Type";
import { EXIT, colourT } from "../timeline";

type Swatch = {
  name: string;
  colour: string;
  motif: MotifName;
  ink: string;
  accent: string;
  tile: number;
};

const SWATCHES: readonly Swatch[] = [
  {
    name: "Marigold",
    colour: fd.marigold,
    motif: "buta",
    ink: fd.oxblood,
    accent: fd.chalk,
    tile: 116,
  },
  {
    name: "Oxblood",
    colour: fd.oxblood,
    motif: "phool",
    ink: fd.saffron,
    accent: fd.chalk,
    tile: 108,
  },
  {
    name: "Peacock",
    colour: fd.peacock,
    motif: "jaal",
    ink: mix(fd.sand, fd.peacock, 0.25),
    accent: fd.saffron,
    tile: 92,
  },
  { name: "Ivory", colour: fd.ivory, motif: "booti", ink: fd.indigo, accent: fd.oxblood, tile: 78 },
];

const BAR = { w: 204, gap: 22, top: 560, bottom: 1404, label: 104, teeth: 9 } as const;
const LEFT = (1080 - (SWATCHES.length * BAR.w + (SWATCHES.length - 1) * BAR.gap)) / 2;

/** A swatch outline with a pinked (zigzag) top edge, as if cut with pinking shears. */
const pinked = (w: number, h: number, teeth: number) => {
  const tw = w / teeth;
  let d = `M 0 ${h} L 0 12`;
  for (let i = 0; i < teeth; i++) d += ` L ${tw * (i + 0.5)} 0 L ${tw * (i + 1)} 12`;
  return `${d} L ${w} ${h} Z`;
};

const SwatchBar: React.FC<{ s: Swatch; i: number; at: number; exitAt: number }> = ({
  s,
  i,
  at,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const h = BAR.bottom - BAR.top;
  const rise = spring({ frame: frame - sec(at), fps, config: springs.snappy });
  const bloom = spring({ frame: frame - sec(at + 0.28), fps, config: springs.smooth });
  const label = spring({
    frame: frame - sec(colourT.names + i * 0.06),
    fps,
    config: springs.smooth,
  });
  const fall = tween(
    frame,
    [sec(exitAt + i * 0.04), sec(exitAt + i * 0.04 + EXIT)],
    [0, 1],
    ease.in,
  );
  const drift = (frame / fps) * 14;
  const id = `swatch-${s.name}`;
  const printH = h - BAR.label;
  return (
    <div
      style={{
        position: "absolute",
        left: LEFT + i * (BAR.w + BAR.gap),
        top: BAR.top,
        width: BAR.w,
        height: h,
        transform: `translateY(${(1 - rise) * (h + 60) + fall * (h + 60)}px)`,
        filter: `drop-shadow(0 18px 22px ${inkShadow(0.16)})`,
      }}
    >
      <svg width={BAR.w} height={h} viewBox={`0 0 ${BAR.w} ${h}`}>
        <defs>
          <MotifPattern
            id={id}
            motif={s.motif}
            size={s.tile}
            color={s.ink}
            accent={s.accent}
            transform={`translate(${BAR.w / 2} ${printH / 2 - drift}) scale(${0.55 + 0.45 * bloom}) translate(${-BAR.w / 2} ${-printH / 2})`}
          />
          <clipPath id={`${id}-clip`}>
            <path d={pinked(BAR.w, h, BAR.teeth)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-clip)`}>
          <rect width={BAR.w} height={h} fill={s.colour} />
          <rect
            width={BAR.w}
            height={printH}
            fill={`url(#${id})`}
            opacity={Math.min(bloom * 1.4, 1)}
          />
          <rect y={printH} width={BAR.w} height={BAR.label} fill={fd.surface} />
        </g>
        <path
          d={pinked(BAR.w, h, BAR.teeth)}
          fill="none"
          stroke={mix(s.colour, fd.ink, 0.18)}
          strokeWidth={2}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: printH + 22,
          textAlign: "center",
          fontFamily: fonts.sans,
          opacity: Math.min(label * 1.5, 1),
          transform: `translateY(${(1 - label) * 10}px)`,
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: "0.16em",
            marginRight: "-0.16em",
            color: fd.ink,
          }}
        >
          {s.name.toUpperCase()}
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: 17,
            letterSpacing: "0.1em",
            marginTop: 6,
            color: fd.inkMute,
          }}
        >
          No. 0{i + 1}
        </div>
      </div>
    </div>
  );
};

export const ColourStory: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const exit = useExit(colourT.exit, EXIT);
  const shelf = tween(frame, [0, sec(0.5)], [0, 1], ease.inOutSoft);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 380, left: 60, right: 60 }}>
        <SerifLine
          text="The *colour* story"
          at={colourT.title}
          exitAt={colourT.exit}
          size={112}
          color={fd.ink}
        />
      </div>
      {/* The swatches rise out of a slot below this line. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: BAR.bottom,
          overflow: "hidden",
        }}
      >
        {SWATCHES.map((s, i) => (
          <SwatchBar key={s.name} s={s} i={i} at={colourT.bars[i]} exitAt={colourT.exit} />
        ))}
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: 1 - exit }}>
        <DrawPath
          d={`M ${LEFT - 30} ${BAR.bottom + 1} L ${1080 - LEFT + 30} ${BAR.bottom + 1}`}
          progress={shelf}
          stroke={fd.ink}
          width={3}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          top: BAR.bottom + 34,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.sans,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: "0.2em",
          color: fd.inkSoft,
          opacity:
            tween(frame, [sec(colourT.names + 0.3), sec(colourT.names + 0.7)], [0, 1], ease.out) *
            (1 - exit),
          transform: `translateY(${interpolate(tween(frame, [sec(colourT.names + 0.3), sec(colourT.names + 0.7)], [0, 1], ease.out), [0, 1], [10, 0])}px)`,
        }}
      >
        FOUR COLOURS · HAND BLOCK-PRINTED
      </div>
    </AbsoluteFill>
  );
};
