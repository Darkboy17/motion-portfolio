import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { WordReveal } from "./Text";
import { resolveCues } from "./cues";
import type { Cue } from "./cues";
import { fonts, palettes, type } from "./theme";

export type { Cue } from "./cues";
export { cuesToVtt, resolveCues } from "./cues";

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
