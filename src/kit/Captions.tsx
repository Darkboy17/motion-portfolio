import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { WordReveal } from "./Text";
import { fonts, palettes, type } from "./theme";

export type Cue = {
  /** Start, in seconds from the start of the composition. */
  at: number;
  /** End, in seconds. Defaults to the next cue's start. */
  to?: number;
  /** Caption text. Wrap words in *asterisks* to emphasise them. */
  text: string;
};

/** Fills in each cue's end time from the next cue, so a script only needs start times. */
export const resolveCues = (cues: Cue[], end: number): Required<Cue>[] =>
  cues.map((c, i) => ({ ...c, to: c.to ?? cues[i + 1]?.at ?? end }));

const stamp = (t: number) => {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms % 1000, 3)}`;
};

/** The same cues as a WebVTT file, for players and screen readers. */
export const cuesToVtt = (cues: Cue[], end: number) =>
  "WEBVTT\n\n" +
  resolveCues(cues, end)
    .map((c, i) => `${i + 1}\n${stamp(c.at)} --> ${stamp(c.to)}\n${c.text.replace(/\*/g, "")}\n`)
    .join("\n");

/**
 * Burned-in captions: one cue at a time, words rising in quickly, out just
 * before the next cue. In a text-first course the captions carry the narration.
 */
export const CaptionTrack: React.FC<{
  cues: Cue[];
  bottom?: number;
  maxWidth?: number;
  size?: number;
  align?: "center" | "left";
  left?: number;
}> = ({ cues, bottom = 64, maxWidth = 1360, size = type.caption, align = "center", left }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const t = frame / fps;
  const cue = resolveCues(cues, durationInFrames / fps).find((c) => t >= c.at && t < c.to);
  if (!cue) return null;
  const c = palettes.lab;
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: left ?? 0,
        right: left === undefined ? 0 : undefined,
        display: "flex",
        justifyContent: align === "center" ? "center" : "flex-start",
        pointerEvents: "none",
      }}
    >
      <WordReveal
        key={cue.at}
        text={cue.text}
        at={cue.at}
        per={0.035}
        exitAt={cue.to - 0.22}
        color={c.inkSoft}
        emphColor={c.heroDeep}
        style={{
          maxWidth,
          justifyContent: align === "center" ? "center" : "flex-start",
          fontFamily: fonts.sans,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.3,
          letterSpacing: "-0.01em",
          textAlign: align,
        }}
      />
    </div>
  );
};
