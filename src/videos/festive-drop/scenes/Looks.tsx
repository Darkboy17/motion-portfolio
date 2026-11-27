// 4-13 s. The carousel: three looks, six beats each, framed by one arch whose
// wash changes colour on every cut. A look drops (or wipes) in on the beat,
// its name lands on the "and", and its motif blooms on beat 2.
import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { LottieClip, ease, springs, tween, useExit, useSec } from "../../../kit";
import { ARCH, Arch } from "../Arch";
import { BOX } from "../garments/geometry";
import type { Look } from "../looks";
import { LOOKS } from "../looks";
import { fd, mix } from "../palette";
import { SerifLine, SmallCaps } from "../Type";
import { EXIT, T, lookT } from "../timeline";

/** Where garments sit on screen: an 800 x 1100 drawing scaled into the arch. */
const G = { left: 200, top: 400, w: 680 } as const;
const SCALE = G.w / BOX.w;
const TAG = 220;
/** A kraft-paper swing tag. */
const KRAFT = mix(fd.sand, fd.ink, 0.14);

const ColourDots: React.FC<{ colours: readonly string[]; at: number; exitAt: number }> = ({
  colours,
  at,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const exit = useExit(exitAt);
  return (
    <div style={{ display: "flex", gap: 20, justifyContent: "center", opacity: 1 - exit }}>
      {colours.map((c, i) => {
        const p = spring({ frame: frame - sec(at + i * 0.08), fps, config: springs.bouncy });
        return (
          <div
            key={c}
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              background: c,
              border: `2px solid ${mix(c, fd.ink, 0.25)}`,
              boxShadow: i === 0 ? `0 0 0 5px ${fd.paper}, 0 0 0 7.5px ${fd.ink}` : undefined,
              opacity: Math.min(p * 2, 1),
              transform: `translateY(${(1 - p) * 14}px) scale(${interpolate(p, [0, 1], [0.3, 1])})`,
            }}
          />
        );
      })}
    </div>
  );
};

const LookCard: React.FC<{ look: Look; index: number }> = ({ look, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const { Garment } = look;
  const drop = look.enter === "drop";
  const land = spring({ frame, fps, config: drop ? springs.bouncy : springs.smooth });
  // A slower, looser spring for what happens after landing: swing, twirl, flare.
  const settle = spring({ frame: frame - 2, fps, config: { damping: 7, stiffness: 55, mass: 1 } });
  const wipe = tween(frame, [0, sec(0.45)], [0, 1], ease.inOutSoft);
  const bloom = tween(
    frame,
    [sec(lookT.bloom), sec(lookT.bloom + lookT.bloomLen)],
    [0, 1],
    ease.inOutSoft,
  );
  const exit = useExit(lookT.exit, EXIT);
  const idle = frame / fps;
  const tagP = spring({ frame: frame - sec(lookT.tag), fps, config: springs.snappy });

  // Once in, the garment floats a few pixels, as if on a breath of air.
  const float = Math.sin(idle * 2.1) * 3.5 * Math.min(land, 1);
  const y =
    (drop ? interpolate(land, [0, 1], [-170, 0]) : interpolate(wipe, [0, 1], [24, 0])) + float;
  const swing = (1 - settle) * -look.swing + Math.sin(idle * 1.8) * look.swing * 0.08;
  const h = BOX.h * SCALE;

  return (
    <AbsoluteFill>
      {/* Floor shadow: it tightens and darkens as the garment lands. */}
      <div
        style={{
          position: "absolute",
          left: ARCH.cx - (look.hem * SCALE) / 2,
          top: ARCH.bottom - 26,
          width: look.hem * SCALE,
          height: 30,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${fd.ink}33, transparent)`,
          opacity: (drop ? land : wipe) * (1 - exit),
          transform: `scaleX(${0.7 + 0.3 * Math.min(land, 1)})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: G.left,
          top: G.top,
          width: G.w,
          height: h,
          opacity: (drop ? Math.min(land * 1.7, 1) : 1) * (1 - exit),
          transform: `translateY(${y + exit * 40}px) rotate(${swing}deg) scale(${1 - exit * 0.04})`,
          transformOrigin: `50% ${(90 / BOX.h) * 100}%`,
          clipPath: drop ? undefined : `inset(0 0 ${(1 - wipe) * 100}% 0)`,
        }}
      >
        <svg
          width={G.w}
          height={h}
          viewBox={`0 0 ${BOX.w} ${BOX.h}`}
          style={{ overflow: "visible" }}
        >
          <Garment
            id={`look-${look.id}`}
            colour={look.colour}
            settle={settle}
            bloom={bloom}
            idle={idle}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            left: look.tag.x * SCALE - TAG / 2,
            top: look.tag.y * SCALE - TAG * 0.1,
            width: TAG,
            height: TAG,
            opacity: Math.min(tagP * 2, 1),
            transform: `scale(${interpolate(tagP, [0, 1], [0.6, 1])})`,
            transformOrigin: "50% 10%",
          }}
        >
          <LottieClip at={lookT.tag} file="tag.json" tint={KRAFT} />
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: ARCH.bottom + 30,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <SmallCaps
          text={`Look 0${index + 1} / 0${LOOKS.length}`}
          at={lookT.kicker}
          exitAt={lookT.exit}
          size={22}
          color={fd.inkMute}
        />
        <SerifLine
          text={look.name}
          at={lookT.name}
          exitAt={lookT.exit}
          size={96}
          color={fd.ink}
          style={{ marginTop: -4 }}
        />
        <SmallCaps
          text={look.fabric}
          at={lookT.fabric}
          exitAt={lookT.exit}
          size={24}
          color={fd.inkSoft}
        />
        <div style={{ marginTop: 10 }}>
          <ColourDots colours={look.colourways} at={lookT.dots} exitAt={lookT.exit} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** The arch wash follows the current look, crossfading across each cut. */
const archColour = (frame: number, sec: (s: number) => number) =>
  LOOKS.reduce((c, look, k) => {
    if (k === 0) return look.backdrop;
    const cut = k * T.lookLen;
    const p = tween(frame, [sec(cut - 0.12), sec(cut + 0.24)], [0, 1], ease.inOutSoft);
    return mix(c, look.backdrop, p);
  }, "");

export const Looks: React.FC = () => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const reveal = tween(frame, [0, sec(0.5)], [0, 1], ease.inOutSoft);
  const end = LOOKS.length * T.lookLen;
  const out = tween(frame, [sec(end - EXIT), sec(end)], [0, 1], ease.in);
  const fill = archColour(frame, sec);
  return (
    <AbsoluteFill>
      <Arch fill={fill} line={mix(fill, fd.ink, 0.28)} reveal={reveal} opacity={1 - out} />
      {LOOKS.map((look, i) => (
        <Sequence
          key={look.id}
          from={sec(i * T.lookLen)}
          durationInFrames={sec(T.lookLen)}
          name={`Look: ${look.id}`}
        >
          <LookCard look={look} index={i} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
