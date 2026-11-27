// Sound effects, music beds and Lottie clips. Every file referenced here is
// listed with its licence in ASSETS.md.
import React, { useEffect, useState } from "react";
import {
  cancelRender,
  continueRender,
  delayRender,
  Html5Audio,
  interpolate,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { Lottie } from "@remotion/lottie";
import type { LottieAnimationData } from "@remotion/lottie";
import { useSec } from "./motion";

export const SFX = [
  "whoosh",
  "swish",
  "click",
  "tick",
  "pop",
  "thump",
  "chime",
  "error",
  "shimmer",
  "type",
] as const;
export type SfxName = (typeof SFX)[number];

/** A one-shot sound. Place it 2 to 3 frames before the visual it belongs to. */
export const Sfx: React.FC<{ at: number; name: SfxName; volume?: number; rate?: number }> = ({
  at,
  name,
  volume = 0.5,
  rate = 1,
}) => {
  const sec = useSec();
  return (
    <Sequence from={Math.max(0, sec(at) - 2)} layout="none" name={`sfx:${name}`}>
      <Html5Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} playbackRate={rate} />
    </Sequence>
  );
};

/** A looping music bed with fades at both ends. */
export const Bed: React.FC<{
  name: string;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
}> = ({ name, volume = 0.22, fadeIn = 1, fadeOut = 2 }) => {
  const { durationInFrames, fps } = useVideoConfig();
  return (
    <Html5Audio
      src={staticFile(`sfx/${name}.wav`)}
      loop
      volume={(f) =>
        interpolate(
          f,
          [0, fadeIn * fps, durationInFrames - fadeOut * fps, durationInFrames],
          [0, volume, volume, 0],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          },
        )
      }
    />
  );
};

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

/** Replaces the key colour (black) in a Lottie file with the given colour; other colours stay. */
const tintLottie = (data: Json, rgb: [number, number, number]): Json => {
  if (Array.isArray(data)) return data.map((d) => tintLottie(d as Json, rgb));
  if (data && typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      if (
        k === "c" &&
        v &&
        typeof v === "object" &&
        !Array.isArray(v) &&
        Array.isArray((v as { k?: unknown }).k)
      ) {
        const arr = (v as { k: number[] }).k;
        const isKey = arr[0] + arr[1] + arr[2] < 0.02;
        out[k] = isKey ? { ...(v as object), k: [rgb[0], rgb[1], rgb[2], arr[3] ?? 1] } : v;
      } else out[k] = tintLottie(v as Json, rgb);
    }
    return out;
  }
  return data;
};

const hexToUnit = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

type LottieProps = {
  file: string;
  tint?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  playbackRate?: number;
};

/**
 * Plays a Lottie file from public/lottie, optionally recoloured to a theme
 * colour. With `at`, playback starts that many seconds into the Sequence.
 */
export const LottieClip: React.FC<LottieProps & { at?: number }> = ({ at, ...props }) => {
  const sec = useSec();
  if (at === undefined) return <LottieData {...props} />;
  return (
    <Sequence from={sec(at)} layout="none" name={`lottie:${props.file}`}>
      <LottieData {...props} />
    </Sequence>
  );
};

const LottieData: React.FC<LottieProps> = ({
  file,
  tint,
  style,
  loop = false,
  playbackRate = 1,
}) => {
  const [handle] = useState(() => delayRender(`lottie:${file}`));
  const [data, setData] = useState<LottieAnimationData | null>(null);
  useEffect(() => {
    fetch(staticFile(`lottie/${file}`))
      .then((r) => r.json())
      .then((json) => {
        setData((tint ? tintLottie(json, hexToUnit(tint)) : json) as LottieAnimationData);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [file, tint, handle]);
  if (!data) return null;
  return <Lottie animationData={data} loop={loop} playbackRate={playbackRate} style={style} />;
};
