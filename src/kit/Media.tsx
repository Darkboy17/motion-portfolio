// Sound effects, music beds and Lottie clips. Every file referenced here is
// listed with its source and licence in ASSETS.md.
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
import manifest from "./sfx-manifest.json";

type SfxEntry = { files: string[]; durations: number[]; gain: number };
const LIBRARY = manifest as Record<keyof typeof manifest, SfxEntry>;
export type SfxName = keyof typeof manifest;
export const SFX = Object.keys(LIBRARY) as SfxName[];

/** A stable number in [0, 1) for a string, so every render picks the same take. */
const unit = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
};

/**
 * A recorded sound effect from public/sfx (see scripts/prepare-sfx.ts). Each name
 * has several takes; unless `take` is given, the take and a small level offset
 * (within 1.5 dB) come from the cue time, so repeated sounds vary the way real
 * foley does and every render is identical. `gain` scales the name's own level.
 * `dur` cuts a long take short with a quick fade. It starts 2 frames before
 * `at`, because a hit that lands with its picture feels late.
 */
export const Sfx: React.FC<{
  at: number;
  name: SfxName;
  gain?: number;
  take?: number;
  dur?: number;
}> = ({ at, name, gain = 1, take, dur }) => {
  const { fps } = useVideoConfig();
  const sec = useSec();
  const entry = LIBRARY[name];
  const n = entry.files.length;
  const i = take === undefined ? Math.floor(unit(`${name}@${at}`) * n) : ((take % n) + n) % n;
  const level = entry.gain * gain * Math.pow(10, ((unit(`${name}#${at}`) - 0.5) * 3) / 20);
  const cut = dur !== undefined && dur < entry.durations[i];
  const frames = Math.max(1, Math.ceil((cut ? (dur as number) : entry.durations[i]) * fps) + 2);
  const fade = cut ? Math.max(1, Math.min(8, Math.floor(frames / 3))) : 0;
  return (
    <Sequence
      from={Math.max(0, sec(at) - 2)}
      durationInFrames={frames}
      layout="none"
      name={`sfx:${name}`}
    >
      <Html5Audio
        src={staticFile(entry.files[i])}
        volume={(f) => (fade ? level * Math.min(1, Math.max(0, (frames - f) / fade)) : level)}
      />
    </Sequence>
  );
};

/** The same sound several times, `step` seconds apart, cycling through its takes. */
export const SfxRun: React.FC<{
  at: number;
  name: SfxName;
  count: number;
  step?: number;
  gain?: number;
}> = ({ at, name, count, step = 0.14, gain }) => (
  <>
    {Array.from({ length: count }, (_, i) => (
      <Sfx key={i} at={at + i * step} name={name} take={i} gain={gain} />
    ))}
  </>
);

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
