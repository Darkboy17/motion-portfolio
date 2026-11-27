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
  SfxRun,
  Stage,
  palettes,
  useSec,
} from "../../kit";
import { GameScreen, missileFlights } from "./GameScreen";
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

// A game soundtrack: every shot and hit is a different recorded take, the code is
// typed on a real keyboard, and the missiles' hits land when the simulation says.
const Audio: React.FC = () => (
  <>
    <Bed name="pad" volume={0.2} />
    <Sfx at={0.35} name="rise" />
    {SHOTS.map((s, i) => (
      <Sfx key={s} at={s} name="laser" take={i} />
    ))}
    {SHOTS.map((s, i) => (
      <Sfx key={`hit${s}`} at={s + 0.3} name="hit" take={i + 2} gain={0.8} />
    ))}
    {[T.triangle, T.track, T.bug, T.atan2, T.uses, T.recap].map((t) => (
      <Sfx key={t} at={t + 0.05} name="fall" />
    ))}
    {/* Triangle: the legs are drawn, the steps are written */}
    <Sfx at={T.triangle + 1.2} name="pencil" take={0} />
    <SfxRun at={T.triangle + 3} name="chalk" count={2} step={0.3} />
    <SfxRun at={T.triangle + 6.6} name="chalk" count={2} step={1.7} />
    <Sfx at={T.triangle + 10.4} name="chalk" take={4} />
    <Sfx at={T.triangle + 10.9} name="confirm" />
    {/* Track: the naive line of code is typed */}
    <Sfx at={T.track + 0.7} name="select" />
    <Sfx at={T.track + 2.55} name="typing" take={0} dur={1.4} />
    <Sfx at={T.track + 5.6} name="click" />
    {/* The bug: the turret turns on itself, the ratio is struck out */}
    <Sfx at={T.bug + 3.6} name="glitch" />
    <Sfx at={T.bug + 3.65} name="error" />
    <Sfx at={T.bug + 6.4} name="select" take={1} />
    <Sfx at={T.bug + 7} name="select" take={2} />
    <Sfx at={T.bug + 7.4} name="scratch" />
    <Sfx at={T.bug + 11.5} name="chalk" take={5} />
    <Sfx at={T.bug + 12} name="error" take={1} />
    {/* atan2: the fix is typed, then the quadrants light up */}
    <Sfx at={T.atan2 + 0.95} name="typing" take={1} dur={2.35} />
    <Sfx at={T.atan2 + 3.8} name="confirm" take={1} />
    <Sfx at={T.atan2 + 4.6} name="computer" />
    <Sfx at={T.circle} name="computer" take={2} />
    {/* Uses: homing missiles launch and hit */}
    {[0.8, 1.3, 1.8, 2.3].map((d, i) => (
      <Sfx key={d} at={T.uses + d} name="select" take={i} />
    ))}
    {LAUNCHES.map((l, i) => (
      <Sfx key={l} at={l} name="thruster" take={i} />
    ))}
    {missileFlights().map((f, i) =>
      f.hitAt === null ? null : <Sfx key={`m${i}`} at={f.hitAt} name="boom" take={i} />,
    )}
    {[1.3, 1.75, 2.2].map((d, i) => (
      <Sfx key={`c${d}`} at={T.recap + d} name="select" take={i + 1} />
    ))}
    <Sfx at={T.recap + 3.2} name="glass" />
  </>
);
