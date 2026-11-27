// Algebra explainer: one thrown ball, one quadratic, three questions.
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
import { buildModel } from "./model";
import type { QuadraticProps } from "./model";
import { LandPanel, ModelPanel, PeakPanel, ReachPanel, RecapPanel } from "./Panels";
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
        <HookTitle
          kicker="Algebra · Quadratic equations"
          headline="Every throw draws a *parabola.*"
          sub="One equation says when it lands, how high it goes, and whether it can reach a ledge."
          exitAt={T.model - 0.7}
        />
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

// Equations are written in chalk, lines on the graph are drawn in pencil, and
// the ball is a real soft thud with a smaller second bounce.
const Audio: React.FC<{ m: ReturnType<typeof buildModel> }> = ({ m }) => (
  <>
    <Bed name="pad" volume={0.16} />
    <Sfx at={0.35} name="rise" />
    <Sfx at={T.launch} name="cloth" gain={1.2} />
    <Sfx at={T.launch + m.landing} name="thud" />
    <Sfx at={T.launch + m.landing + 0.24} name="bump" gain={0.6} />
    <Sfx at={T.model + 0.45} name="pencil" take={0} />
    <SfxRun at={T.model + 0.5} name="chalk" count={4} />
    {[3.6, 4.6, 5.6].map((d, i) => (
      <Sfx key={d} at={T.model + d} name="select" take={i} />
    ))}
    <Sfx at={T.model + 5.4} name="pencil" take={3} gain={0.7} />
    <Sfx at={T.replay} name="cloth" take={2} />
    <Sfx at={T.replay + m.landing} name="thud" take={3} gain={0.8} />
    {[T.land, T.peak, T.reach, T.recap].map((t) => (
      <Sfx key={t} at={t + 0.05} name="fall" />
    ))}
    {/* Land: write the equation, read off a, b, c, solve, keep one root and strike the other */}
    <SfxRun at={T.land + 2.9} name="chalk" count={5} />
    {[6, 6.15, 6.3].map((d, i) => (
      <Sfx key={d} at={T.land + d} name="click" take={i} />
    ))}
    <SfxRun at={T.land + 7.2} name="chalk" count={3} step={0.3} />
    <SfxRun at={T.land + 9.3} name="chalk" count={2} step={0.6} />
    <Sfx at={T.land + 10.4} name="confirm" />
    <Sfx at={T.land + 13.4} name="pencil" take={4} />
    <Sfx at={T.land + 14} name="drop" />
    <Sfx at={T.land + 14.4} name="scratch" />
    {/* Peak: the vertex formula, then guides to the top of the arc */}
    <SfxRun at={T.peak + 3.1} name="chalk" count={3} step={1.15} />
    <Sfx at={T.peak + 3} name="pencil" take={1} />
    <Sfx at={T.peak + 6.4} name="pencil" take={2} />
    <Sfx at={T.peak + 6.6} name="pluck" />
    <Sfx at={T.peak + 6.7} name="drop" take={1} />
    {/* Reach: the ledge, the equation and its discriminant, then the verdict */}
    <Sfx at={T.reach + 1} name="pencil" take={5} />
    <SfxRun at={T.reach + 3.4} name="chalk" count={3} step={0.6} />
    <SfxRun at={T.reach + 5.8} name="chalk" count={3} step={0.65} />
    <Sfx at={T.reach + 7.3} name={m.reaches ? "confirm" : "error"} />
    <Sfx at={T.reach + 7.6} name="pencil" take={0} gain={0.7} />
    <Sfx at={T.sweep + 0.6} name="rise" take={3} />
    <Sfx at={T.sweep + 2.6} name="pluck" take={1} />
    <Sfx at={T.sweep + 3.7} name="toggle" />
    {/* Recap */}
    {[1.3, 1.75, 2.2].map((d, i) => (
      <Sfx key={d} at={T.recap + d} name="select" take={i + 1} />
    ))}
    <Sfx at={T.recap + 2.2} name="pencil" take={2} gain={0.7} />
    <Sfx at={T.recap + 3.2} name="glass" />
  </>
);
