import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { enterStyle, tween, useExit, useSec, useSpring } from "./motion";
import { ease, timing } from "./theme";
import type { SpringName } from "./theme";

type EnterProps = {
  /** Entrance time in seconds, relative to the enclosing Sequence. */
  at?: number;
  /** Exit time in seconds. Omit to stay on screen. */
  exitAt?: number;
  dy?: number;
  dx?: number;
  scale?: number;
  spring?: SpringName;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/** The workhorse entrance: opacity, rise and scale together, with an optional exit. */
export const Enter: React.FC<EnterProps> = ({
  at = 0,
  exitAt,
  dy,
  dx,
  scale,
  spring = "smooth",
  style,
  children,
}) => {
  const sec = useSec();
  const p = useSpring(sec(at), spring);
  const exit = useExit(exitAt);
  return <div style={{ ...enterStyle(p, exit, { dy, dx, scale }), ...style }}>{children}</div>;
};

/** Staggers its children's entrances by `step` seconds. */
export const Stagger: React.FC<{
  at?: number;
  step?: number;
  exitAt?: number;
  dy?: number;
  dx?: number;
  spring?: SpringName;
  style?: React.CSSProperties;
  itemStyle?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ at = 0, step = timing.stagger, exitAt, dy, dx, spring, style, itemStyle, children }) => (
  <div style={style}>
    {React.Children.toArray(children).map((child, i) => (
      <Enter
        key={i}
        at={at + i * step}
        exitAt={exitAt === undefined ? undefined : exitAt + i * step * 0.4}
        dy={dy}
        dx={dx}
        spring={spring}
        style={itemStyle}
      >
        {child}
      </Enter>
    ))}
  </div>
);

/** Fades and lifts a whole block out at `at` seconds. Wrap scenes in it. */
export const ExitAt: React.FC<{
  at?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ at, children, style }) => {
  const exit = useExit(at);
  return (
    <div style={{ opacity: 1 - exit, transform: `translateY(${-exit * 24}px)`, ...style }}>
      {children}
    </div>
  );
};

/** Mounts its children only between two times (seconds), so idle layers cost nothing. */
export const During: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({
  from,
  to,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return t >= from && t < to ? <>{children}</> : null;
};

/** Fades the whole frame to paper over the last `seconds` of the composition. */
export const EndFade: React.FC<{ color: string; seconds?: number }> = ({
  color,
  seconds = 0.8,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const o = tween(
    frame,
    [durationInFrames - seconds * fps, durationInFrames - 1],
    [0, 1],
    ease.inOutSoft,
  );
  return <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} />;
};
