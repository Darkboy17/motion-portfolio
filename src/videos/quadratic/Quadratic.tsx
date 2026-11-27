// Algebra explainer: one thrown ball, one quadratic, three questions.
import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { Bed, CaptionTrack, ChapterBar, EndFade, Sfx, Stage, palettes, useSec } from "../../kit";
import { buildModel } from "./model";
import type { QuadraticProps } from "./model";
import { HookTitle, LandPanel, ModelPanel, PeakPanel, ReachPanel, RecapPanel } from "./Panels";
import { ThrowGraph } from "./ThrowGraph";
import { T, chapters, cues } from "./timeline";

export const Quadratic: React.FC<QuadraticProps> = (props) => {
  const sec = useSec();
  const m = buildModel(props);
  const span = (from: number, to: number) => ({
    from: sec(from),
    durationInFrames: sec(to - from),
  });
  return (
    <Stage grid>
      <ThrowGraph m={m} ledge={props.ledgeHeight} />
      <Sequence {...span(0, T.model)} name="Hook">
        <HookTitle />
      </Sequence>
      <Sequence {...span(T.model, T.land)} name="Model">
        <ModelPanel m={m} v0={props.launchSpeed} h0={props.startHeight} />
      </Sequence>
      <Sequence {...span(T.land, T.peak)} name="Land">
        <LandPanel m={m} />
      </Sequence>
      <Sequence {...span(T.peak, T.reach)} name="Peak">
        <PeakPanel m={m} />
      </Sequence>
      <Sequence {...span(T.reach, T.recap)} name="Reach">
        <ReachPanel m={m} ledge={props.ledgeHeight} />
      </Sequence>
      <Sequence {...span(T.recap, T.end)} name="Recap">
        <RecapPanel m={m} />
      </Sequence>
      <Sequence from={sec(T.model - 0.4)} name="Chapters">
        <AbsoluteFill>
          <ChapterBar
            topic="Algebra · Quadratic equations"
            chapters={chapters.map((ch) => ({ ...ch, at: ch.at - (T.model - 0.4) }))}
          />
        </AbsoluteFill>
      </Sequence>
      <CaptionTrack cues={cues(m)} />
      <Audio m={m} />
      <EndFade color={palettes.lab.paper} />
    </Stage>
  );
};

const Audio: React.FC<{ m: ReturnType<typeof buildModel> }> = ({ m }) => (
  <>
    <Bed name="pad" volume={0.16} />
    <Sfx at={0.35} name="whoosh" volume={0.3} />
    <Sfx at={T.launch} name="pop" volume={0.45} />
    <Sfx at={T.launch + m.landing} name="thump" volume={0.5} />
    {[0.5, 0.64, 0.78, 0.92].map((d) => (
      <Sfx key={d} at={T.model + d} name="tick" volume={0.3} />
    ))}
    {[3.6, 4.6, 5.6].map((d) => (
      <Sfx key={d} at={T.model + d} name="click" volume={0.25} />
    ))}
    <Sfx at={T.replay} name="pop" volume={0.35} />
    <Sfx at={T.replay + m.landing} name="thump" volume={0.35} />
    {[T.land, T.peak, T.reach, T.recap].map((t) => (
      <Sfx key={t} at={t + 0.1} name="swish" volume={0.3} />
    ))}
    <Sfx at={T.land + 10.4} name="chime" volume={0.4} />
    <Sfx at={T.land + 14.4} name="error" volume={0.22} />
    <Sfx at={T.peak + 6.6} name="pop" volume={0.4} />
    <Sfx at={T.reach + 7.3} name={m.reaches ? "chime" : "error"} volume={0.25} />
    <Sfx at={T.recap + 1.3} name="shimmer" volume={0.3} />
  </>
);
