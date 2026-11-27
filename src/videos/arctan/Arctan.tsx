// Trigonometry explainer: how a game turret aims, why plain arctan fails on the
// left half of the screen, and how atan2 fixes it.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import {
  Bed,
  CaptionTrack,
  ChapterBar,
  EndFade,
  HookTitle,
  Sfx,
  Stage,
  palettes,
  useSec,
} from "../../kit";
import { GameScreen } from "./GameScreen";
import { Atan2Panel, BugPanel, RecapPanel, TrackPanel, TrianglePanel, UsesPanel } from "./Panels";
import { LAUNCHES, SHOTS, T, chapters, cues } from "./timeline";

export const Arctan: React.FC = () => {
  const sec = useSec();
  const span = (from: number, to: number) => ({
    from: sec(from),
    durationInFrames: sec(to - from),
  });
  return (
    <Stage grid>
      <GameScreen />
      <Sequence {...span(0, T.triangle)} name="Hook">
        <HookTitle
          kicker="Trigonometry · Arctan in games"
          headline="One function aims *every turret.*"
          sub="The game knows two positions. It needs one angle."
          exitAt={T.triangle - 0.7}
          size={92}
        />
      </Sequence>
      <Sequence {...span(T.triangle, T.track)} name="Triangle">
        <TrianglePanel />
      </Sequence>
      <Sequence {...span(T.track, T.bug)} name="Track">
        <TrackPanel />
      </Sequence>
      <Sequence {...span(T.bug, T.atan2)} name="Bug">
        <BugPanel />
      </Sequence>
      <Sequence {...span(T.atan2, T.uses)} name="atan2">
        <Atan2Panel />
      </Sequence>
      <Sequence {...span(T.uses, T.recap)} name="Uses">
        <UsesPanel />
      </Sequence>
      <Sequence {...span(T.recap, T.end)} name="Recap">
        <RecapPanel />
      </Sequence>
      <Sequence from={sec(T.triangle - 0.4)} name="Chapters">
        <AbsoluteFill>
          <ChapterBar
            topic="Trigonometry · Arctan"
            chapters={chapters.map((ch) => ({ ...ch, at: ch.at - (T.triangle - 0.4) }))}
          />
        </AbsoluteFill>
      </Sequence>
      <CaptionTrack cues={cues()} />
      <Audio />
      <EndFade color={palettes.lab.paper} />
    </Stage>
  );
};

const Audio: React.FC = () => (
  <>
    <Bed name="pad" volume={0.2} />
    <Sfx at={0.35} name="whoosh" volume={0.3} />
    {SHOTS.map((s) => (
      <Sfx key={s} at={s} name="click" volume={0.28} />
    ))}
    {SHOTS.map((s) => (
      <Sfx key={`hit${s}`} at={s + 0.3} name="pop" volume={0.22} />
    ))}
    {[T.triangle, T.track, T.bug, T.atan2, T.uses, T.recap].map((t) => (
      <Sfx key={t} at={t + 0.1} name="swish" volume={0.3} />
    ))}
    <Sfx at={T.triangle + 10.9} name="chime" volume={0.35} />
    <Sfx at={T.bug + 3.6} name="error" volume={0.25} />
    <Sfx at={T.bug + 7.4} name="error" volume={0.2} />
    <Sfx at={T.bug + 12} name="error" volume={0.2} />
    <Sfx at={T.atan2 + 3.8} name="chime" volume={0.35} />
    {LAUNCHES.map((l) => (
      <Sfx key={l} at={l} name="whoosh" volume={0.3} />
    ))}
    <Sfx at={T.recap + 1.3} name="shimmer" volume={0.3} />
  </>
);
