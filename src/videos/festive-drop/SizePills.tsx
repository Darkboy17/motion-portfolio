// Sizes: a row of pills that pop in on sixteenth notes, sitting on a tailor's
// tape that unrolls beneath them.
import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, fonts, springs, tween, useExit, useSec } from "../../kit";
import { fd, mix } from "./palette";

/** Pills pop in one after another, with a bouncy spring: scale, rise and fade together. */
export const SizePills: React.FC<{
  sizes: readonly string[];
  at: number;
  step: number;
  exitAt?: number;
}> = ({ sizes, at, step, exitAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
      {sizes.map((size, i) => {
        const p = spring({ frame: frame - sec(at + i * step), fps, config: springs.bouncy });
        const exit =
          exitAt === undefined
            ? 0
            : tween(
                frame,
                [sec(exitAt + i * 0.02), sec(exitAt + i * 0.02 + 0.22)],
                [0, 1],
                ease.in,
              );
        return (
          <div
            key={size}
            style={{
              minWidth: 116,
              padding: "16px 22px",
              borderRadius: 999,
              border: `3px solid ${fd.ink}`,
              background: fd.surface,
              fontFamily: fonts.sans,
              fontWeight: 800,
              fontSize: 40,
              letterSpacing: "0.04em",
              textAlign: "center",
              color: fd.ink,
              opacity: Math.min(p * 2, 1) * (1 - exit),
              transform: `translateY(${interpolate(p, [0, 1], [30, 0]) + exit * 16}px) scale(${interpolate(p, [0, 1], [0.4, 1]) * (1 - exit * 0.2)})`,
            }}
          >
            {size}
          </div>
        );
      })}
    </div>
  );
};

/** A tailor's tape that unrolls from the left. Ticks every 10 units, numbered every 50. */
export const Tape: React.FC<{ at: number; dur?: number; width?: number; exitAt?: number }> = ({
  at,
  dur = 0.6,
  width = 900,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const unroll = tween(frame, [sec(at), sec(at + dur)], [0, 1], ease.inOutSoft);
  const exit = useExit(exitAt);
  const h = 58;
  const ticks = Math.floor(width / 10);
  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      style={{ opacity: 1 - exit, transform: `translateY(${exit * 12}px)` }}
    >
      <defs>
        <clipPath id="tape-unroll">
          <rect x={0} y={0} width={width * unroll} height={h} />
        </clipPath>
      </defs>
      <g clipPath="url(#tape-unroll)">
        <rect x={0} y={0} width={width} height={h} rx={6} fill={mix(fd.saffron, fd.chalk, 0.35)} />
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const x = i * 10;
          const major = i % 5 === 0;
          return (
            <g key={x}>
              <line
                x1={x}
                x2={x}
                y1={0}
                y2={major ? 22 : 12}
                stroke={fd.ink}
                strokeWidth={major ? 2.4 : 1.4}
                opacity={0.8}
              />
              {major && i > 0 && i < ticks ? (
                <text
                  x={x}
                  y={44}
                  textAnchor="middle"
                  fontFamily={fonts.sans}
                  fontWeight={700}
                  fontSize={14}
                  fill={fd.inkSoft}
                >
                  {i}
                </text>
              ) : null}
            </g>
          );
        })}
      </g>
      {/* The roll itself, riding the unrolled edge. */}
      {unroll > 0 && unroll < 1 ? (
        <circle cx={width * unroll} cy={h / 2} r={h / 2 + 4} fill={mix(fd.saffron, fd.ink, 0.1)} />
      ) : null}
    </svg>
  );
};
