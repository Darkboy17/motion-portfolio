// Calculus explainer: a car, its distance graph, and the speedometer as a slope.
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
import { DriveGraph, HookGauge } from "./DriveGraph";
import {
  AveragePanel,
  DistancePanel,
  RecapPanel,
  RulePanel,
  ShrinkPanel,
  SlidePanel,
} from "./Panels";
import { GAP_TIMES, T, chapters, cues } from "./timeline";

export const Derivative: React.FC = () => {
  const sec = useSec();
  const span = (from: number, to: number) => ({
    from: sec(from),
    durationInFrames: sec(to - from),
  });
  return (
    <Stage grid>
      <DriveGraph />
      <Sequence {...span(0, T.distance)} name="Hook">
        <HookTitle
          kicker="Calculus · The derivative"
          headline="Your speedometer does *calculus.*"
          sub="How can a speed exist at a single instant, with no time in it?"
          exitAt={T.distance - 0.7}
          size={90}
          top={290}
        />
        <HookGauge />
      </Sequence>
      <Sequence {...span(T.distance, T.average)} name="Distance">
        <DistancePanel />
      </Sequence>
      <Sequence {...span(T.average, T.shrink)} name="Average">
        <AveragePanel />
      </Sequence>
      <Sequence {...span(T.shrink, T.slide)} name="Shrink">
        <ShrinkPanel />
      </Sequence>
      <Sequence {...span(T.slide, T.rule)} name="Slide">
        <SlidePanel />
      </Sequence>
      <Sequence {...span(T.rule, T.recap)} name="Rule">
        <RulePanel />
      </Sequence>
      <Sequence {...span(T.recap, T.end)} name="Recap">
        <RecapPanel />
      </Sequence>
      <Sequence from={sec(T.distance - 0.4)} name="Chapters">
        <AbsoluteFill>
          <ChapterBar
            topic="Calculus · The derivative"
            chapters={chapters.map((ch) => ({ ...ch, at: ch.at - (T.distance - 0.4) }))}
          />
        </AbsoluteFill>
      </Sequence>
      <CaptionTrack cues={cues} />
      <Audio />
      <EndFade color={palettes.lab.paper} />
    </Stage>
  );
};

const Audio: React.FC = () => (
  <>
    <Bed name="pad" volume={0.2} />
    <Sfx at={0.35} name="whoosh" volume={0.3} />
    <Sfx at={T.drive} name="swish" volume={0.3} />
    {[T.average, T.shrink, T.slide, T.rule, T.recap].map((t) => (
      <Sfx key={t} at={t + 0.1} name="swish" volume={0.3} />
    ))}
    <Sfx at={T.average + 1} name="pop" volume={0.35} />
    <Sfx at={T.average + 3.4} name="whoosh" volume={0.25} />
    <Sfx at={T.average + 7} name="click" volume={0.3} />
    {GAP_TIMES.map((g) => (
      <Sfx key={g} at={T.shrink + g - 0.15} name="tick" volume={0.3} />
    ))}
    <Sfx at={T.shrink + 9.4} name="chime" volume={0.4} />
    <Sfx at={T.rule + 4.4} name="click" volume={0.3} />
    <Sfx at={T.rule + 6.8} name="click" volume={0.3} />
    <Sfx at={T.rule + 9.2} name="click" volume={0.3} />
    <Sfx at={T.recap + 1.3} name="shimmer" volume={0.3} />
  </>
);
