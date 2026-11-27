// Motion helpers: seconds-to-frames, clamped eased tweens, spring progress,
// exits and idle breathing. Everything derives from the composition's fps.
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { EasingFunction } from "remotion";
import type { CSSProperties } from "react";
import { ease, springs, timing } from "./theme";
import type { SpringName } from "./theme";

/** Returns a converter from seconds to whole frames at the current fps. */
export const useSec = () => {
  const { fps } = useVideoConfig();
  return (seconds: number) => Math.round(seconds * fps);
};

/** Clamped, eased interpolation over a frame range. */
export const tween = (
  frame: number,
  range: [number, number],
  output: [number, number],
  easing: EasingFunction = ease.out,
) =>
  interpolate(frame, range, output, {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Spring progress (0 to 1) starting at `delay` frames. */
export const useSpring = (delay = 0, preset: SpringName = "smooth") => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: springs[preset] });
};

/** Seconds-based tween relative to the current Sequence. */
export const useTween = (
  startSec: number,
  durSec: number,
  output: [number, number] = [0, 1],
  easing: EasingFunction = ease.out,
) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  return tween(frame, [sec(startSec), sec(startSec + durSec)], output, easing);
};

/**
 * Exit progress: 0 while visible, 1 once gone. Exits are quicker than entrances
 * and use the `in` curve.
 */
export const useExit = (atSec: number | undefined, durSec: number = timing.exit) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  if (atSec === undefined) return 0;
  return tween(frame, [sec(atSec), sec(atSec + durSec)], [0, 1], ease.in);
};

/** Small sine motion for anything held on screen longer than a couple of seconds. */
export const breathe = (frame: number, period = 90, amount = 1) =>
  Math.sin((frame / period) * Math.PI * 2) * amount;

/** Entrance style: opacity, rise and scale together, then an optional exit. */
export const enterStyle = (
  p: number,
  exit = 0,
  opts: { dy?: number; dx?: number; scale?: number } = {},
): CSSProperties => {
  const { dy = 28, dx = 0, scale = 0.96 } = opts;
  const s = interpolate(p, [0, 1], [scale, 1]);
  return {
    opacity: Math.min(p, 1) * (1 - exit),
    transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy - exit * 18}px) scale(${s})`,
  };
};
