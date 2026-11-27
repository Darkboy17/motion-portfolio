// 19-22 s. The end card: a rangoli opens behind the lantern, the lantern draws
// itself and lights, the wordmark rises, and then everything holds still
// except the flame, until the frame fades to paper.
import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LottieClip, ease, springs, tween, useSec } from "../../../kit";
import { Lantern } from "../Lantern";
import { Motif, ringDots } from "../motifs";
import { fd, mix } from "../palette";
import { SerifLine, SmallCaps } from "../Type";
import { endT } from "../timeline";

const LANTERN = { w: 200, top: 480 } as const;
const GLOW_Y = LANTERN.top + (176 / 340) * ((LANTERN.w / 200) * 340);

/** A rangoli: rings of petals, butas and dots, generated from counts and radii. */
const Rangoli: React.FC<{ p: number; spin: number }> = ({ p, spin }) => {
  const c = mix(fd.sand, fd.paper, 0.15);
  const ring = (k: number) => Math.min(Math.max(p * 4 - k, 0), 1);
  return (
    <svg width={760} height={760} viewBox="-380 -380 760 760" style={{ overflow: "visible" }}>
      <g transform={`rotate(${spin}) scale(${0.75 + 0.25 * p})`} opacity={0.75}>
        <g opacity={ring(0)}>
          <Motif name="phool" size={150} color={c} />
        </g>
        <g opacity={ring(1)}>
          {ringDots(170, 12, -Math.PI / 2).map((d, i) => (
            <g
              key={`b${d.x}:${d.y}`}
              transform={`translate(${d.x} ${d.y}) rotate(${(i / 12) * 360 + 90})`}
            >
              <Motif name="buta" size={44} color={c} />
            </g>
          ))}
        </g>
        <g opacity={ring(2)}>
          {ringDots(238, 36).map((d) => (
            <circle key={`d${d.x}:${d.y}`} cx={d.x} cy={d.y} r={5} fill={c} />
          ))}
        </g>
        <g opacity={ring(3)}>
          {ringDots(300, 24, Math.PI / 24).map((d, i) => (
            <g
              key={`p${d.x}:${d.y}`}
              transform={`translate(${d.x} ${d.y}) rotate(${(i / 24) * 360 + 7.5})`}
            >
              <Motif name="booti" size={40} color={c} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
};

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const idle = frame / fps;
  const draw = tween(frame, [sec(endT.lantern), sec(endT.lantern + 1)], [0, 1], ease.inOutSoft);
  const light = tween(frame, [sec(endT.light), sec(endT.light + 0.6)], [0, 1], ease.out);
  const flicker = Math.sin(frame * 0.71) * 0.5 + Math.sin(frame * 1.37 + 1) * 0.5;
  const open = spring({ frame: frame - sec(endT.lantern + 0.1), fps, config: springs.gentle });
  const sway = Math.sin(idle * 1.5) * 1.6;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 540 - 380, top: GLOW_Y - 380 }}>
        <Rangoli p={open} spin={idle * 5} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 540 - LANTERN.w / 2,
          top: LANTERN.top,
          transform: `rotate(${sway}deg)`,
          transformOrigin: "50% 0%",
        }}
      >
        <Lantern draw={draw} light={light} flicker={flicker} width={LANTERN.w} stroke={5} />
      </div>
      <div style={{ position: "absolute", left: 610, top: 440, width: 210, height: 210 }}>
        <LottieClip at={endT.sparkle} file="sparkle.json" tint={fd.saffron} />
      </div>
      <div style={{ position: "absolute", left: 300, top: 700, width: 130, height: 130 }}>
        <LottieClip at={endT.sparkle + 0.3} file="sparkle.json" tint={fd.saffron} />
      </div>
      <div style={{ position: "absolute", top: 890, left: 40, right: 40 }}>
        <SerifLine
          text="Loom *&* Lantern"
          at={endT.wordmark}
          per={0.08}
          size={116}
          color={fd.ink}
          emphColor={fd.oxblood}
          trackFrom={0.16}
          track={-0.02}
          spring="smooth"
        />
      </div>
      <div style={{ position: "absolute", top: 1064, left: 0, right: 0 }}>
        <SmallCaps
          text="The Festive Edit · Friday 7 PM"
          at={endT.tagline}
          size={26}
          color={fd.inkSoft}
          rule={fd.saffron}
        />
      </div>
    </AbsoluteFill>
  );
};
