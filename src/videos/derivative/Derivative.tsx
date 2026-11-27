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
  SfxRun,
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

// The van recording starts under the hook and drives with the car; equations are
// written in chalk and every line on a graph is drawn in pencil.
const Audio: React.FC = () => (
  <>
    <Bed name="pad" volume={0.2} />
    <Sfx at={0.35} name="rise" />
    <Sfx at={0.5} name="engineStart" gain={0.9} dur={T.distance - 0.6} />
    <Sfx at={T.distance + 0.2} name="pencil" take={0} />
    <SfxRun at={T.distance + 0.5} name="chalk" count={3} />
    <Sfx at={T.drive} name="engine" dur={10.2} />
    {[T.average, T.shrink, T.slide, T.rule, T.recap].map((t) => (
      <Sfx key={t} at={t + 0.05} name="fall" />
    ))}
    {/* Average: two points, the rise and run, the secant, then the sum */}
    <Sfx at={T.average + 0.8} name="chalk" take={3} />
    <Sfx at={T.average + 1} name="pluck" />
    <Sfx at={T.average + 2} name="pencil" take={1} />
    <Sfx at={T.average + 3.4} name="pencil" take={2} />
    <SfxRun at={T.average + 5} name="chalk" count={3} step={1} />
    <Sfx at={T.average + 7.2} name="click" />
    <Sfx at={T.average + 9.3} name="select" />
    {/* Shrink: a row for each gap, then the limit */}
    {GAP_TIMES.map((g, i) => (
      <Sfx key={g} at={T.shrink + g - 0.15} name="tick" take={i} />
    ))}
    <Sfx at={T.shrink + 9.4} name="confirm" />
    <Sfx at={T.shrink + 13.2} name="chalk" take={4} />
    {/* Slide: the gauge clicks in and the car drives again with the tangent */}
    <Sfx at={T.slide + 0.3} name="latch" />
    <Sfx at={T.slide + 0.9} name="pencil" take={3} />
    <Sfx at={T.slide + 0.8} name="engine" dur={10} gain={0.8} />
    {/* Rule: the formula, then three tangents */}
    <SfxRun at={T.rule + 1.4} name="chalk" count={2} step={1.1} />
    {[4.4, 7.2, 9].map((d, i) => (
      <Sfx key={d} at={T.rule + d} name="pencil" take={i + 4} />
    ))}
    {[4.4, 6.8, 9.2].map((d, i) => (
      <Sfx key={`r${d}`} at={T.rule + d} name="click" take={i} />
    ))}
    {[1.3, 1.75, 2.2].map((d, i) => (
      <Sfx key={`c${d}`} at={T.recap + d} name="select" take={i} />
    ))}
    <Sfx at={T.recap + 4.4} name="pluck" take={1} />
  </>
);
