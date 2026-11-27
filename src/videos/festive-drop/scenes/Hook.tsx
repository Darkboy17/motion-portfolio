// 0-2 s. NEW slams in letter by letter on eighth notes, each landing with a
// small jolt; a sparkle bursts off the W; then "The Festive Edit" settles in
// from wide tracking, over a drawn divider.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LottieClip, ease, fonts, springs, tween, useExit, useSec } from "../../../kit";
import { Motif } from "../motifs";
import { fd } from "../palette";
import { SerifLine } from "../Type";
import { EXIT, hookT } from "../timeline";

const LETTERS = ["N", "E", "W"] as const;

/** A decaying jolt after each landing, so the slams have weight. */
const jolt = (frame: number, lands: number[]) =>
  lands.reduce((sum, land) => {
    const d = frame - land;
    return d < 0 ? sum : sum + 9 * Math.exp(-d / 3.5) * Math.sin(d * 1.9);
  }, 0);

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const exit = useExit(hookT.exit, EXIT);
  const starts = hookT.letters.map((t) => sec(t));
  const shake = jolt(
    frame,
    starts.map((s) => s + 5),
  );
  const rule = tween(frame, [sec(hookT.rule), sec(hookT.rule + 0.5)], [0, 1], ease.out);
  const bud = spring({ frame: frame - sec(hookT.rule + 0.1), fps, config: springs.bouncy });

  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        transform: `translateY(${-exit * 30}px) scale(${1 + exit * 0.05})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 630,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${shake}px)`,
        }}
      >
        {LETTERS.map((ch, i) => {
          const p = spring({ frame: frame - starts[i], fps, config: springs.bouncy });
          return (
            <span
              key={ch}
              style={{
                display: "inline-block",
                fontFamily: fonts.serif,
                fontWeight: 800,
                fontSize: 350,
                lineHeight: 0.92,
                letterSpacing: "-0.035em",
                color: fd.ink,
                opacity: Math.min(p * 3, 1),
                transform: `translateY(${interpolate(p, [0, 1], [-90, 0])}px) scale(${interpolate(p, [0, 1], [2.1, 1])})`,
                transformOrigin: "50% 70%",
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>

      <div style={{ position: "absolute", left: 742, top: 540, width: 260, height: 260 }}>
        <LottieClip at={hookT.sparkle} file="sparkle.json" tint={fd.saffron} />
      </div>
      <div style={{ position: "absolute", left: 96, top: 890, width: 150, height: 150 }}>
        <LottieClip at={hookT.sparkle + 0.2} file="sparkle.json" tint={fd.saffron} />
      </div>

      <div style={{ position: "absolute", top: 1010, left: 60, right: 60 }}>
        <SerifLine
          text="The *Festive* Edit"
          at={hookT.title}
          per={0.06}
          size={124}
          weight={400}
          color={fd.ink}
          emphColor={fd.oxblood}
          trackFrom={0.28}
          track={-0.015}
          spring="smooth"
        />
      </div>

      <svg
        width={560}
        height={48}
        viewBox="0 0 560 48"
        style={{ position: "absolute", left: 260, top: 1188 }}
      >
        {rule > 0.01
          ? [-1, 1].map((dir) => (
              <line
                key={dir}
                x1={280 + dir * 34}
                x2={280 + dir * (34 + 220 * rule)}
                y1={24}
                y2={24}
                stroke={fd.saffron}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))
          : null}
        <g transform={`translate(280 24) scale(${bud}) rotate(${(1 - bud) * -60})`}>
          <Motif name="phool" size={40} color={fd.saffron} accent={fd.oxblood} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
