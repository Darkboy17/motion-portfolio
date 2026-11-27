// Pattern study No. 02: how a houndstooth is made. One repeat is built on point
// paper, stepped into a field, taken apart into warp and weft, relaxed back into
// cells, recoloured on the beat, and returned to a single repeat for the loop.
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Bed, Sfx, Stage, ease, tween } from "../../kit";
import { Copy } from "./Copy";
import { T, fillAt, weave } from "./timeline";
import { World } from "./World";

export const HOUNDSTOOTH_SECONDS = T.total;

/**
 * Fades the content, not the frame, so the last frame is the bare stage and
 * the loop lands on the opening frame without a flash.
 */
const LoopFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const o = 1 - tween(frame, [T.fadeOut * fps, durationInFrames - 1], [0, 1], ease.inOutSoft);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const evenDiagonals = [0, 2, 4, 6, 8, 10, 12, 14];

// Wooden taps as the cells fill, the shuttle loom from Work With Sounds under the
// weave (one clack a pick), and cloth for each colourway.
const Soundtrack: React.FC = () => (
  <>
    <Bed name="pulse" volume={0.35} fadeIn={0.5} fadeOut={1} />
    <Sfx at={T.title} name="cloth" />
    <Sfx at={T.land} name="thud" />
    <Sfx at={T.grid} name="pencil" take={1} />
    {evenDiagonals.map((d, i) => (
      <Sfx key={d} at={fillAt(d)} name="peg" take={i} />
    ))}
    <Sfx at={T.repeat} name="pencil" take={2} gain={0.8} />
    <Sfx at={T.tile3} name="place" />
    <Sfx at={T.tile5} name="place" take={1} />
    <Sfx at={T.field} name="rise" />
    <Sfx at={T.weave} name="loom" dur={T.relaxEnd - T.weave} gain={0.8} />
    {[0, 4, 8, 12].map((col, i) => (
      <Sfx key={col} at={weave.warpAt(col)} name="peg" take={i + 1} gain={0.8} />
    ))}
    {[0, 2, 4, 6, 8, 10, 12, 14].map((row, i) => (
      <Sfx key={row} at={weave.weftAt(row)} name="clack" take={i} gain={0.7} />
    ))}
    <Sfx at={T.twill} name="pencil" take={3} />
    <Sfx at={T.relaxEnd} name="bump" />
    <Sfx at={T.colour} name="cloth" take={1} />
    <Sfx at={T.ways[0]} name="click" />
    {T.ways.slice(1).map((at, i) => (
      <Sfx key={at} at={at} name="cloth" take={i + 2} />
    ))}
    <Sfx at={T.end} name="fall" />
    <Sfx at={T.endTitle} name="glass" />
  </>
);

export const Houndstooth: React.FC = () => (
  <Stage variant="atelier">
    <LoopFade>
      <World />
      <Copy />
    </LoopFade>
    <Soundtrack />
  </Stage>
);
