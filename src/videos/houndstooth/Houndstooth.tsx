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

const Soundtrack: React.FC = () => (
  <>
    <Bed name="pulse" volume={0.35} fadeIn={0.5} fadeOut={1} />
    <Sfx at={T.title} name="swish" volume={0.22} />
    <Sfx at={T.land} name="thump" volume={0.5} />
    <Sfx at={T.grid} name="swish" volume={0.18} />
    {evenDiagonals.map((d) => (
      <Sfx key={d} at={fillAt(d)} name="tick" volume={0.32} />
    ))}
    <Sfx at={T.repeat} name="pop" volume={0.35} />
    <Sfx at={T.tile3} name="click" volume={0.35} />
    <Sfx at={T.tile5} name="click" volume={0.35} />
    <Sfx at={T.field} name="whoosh" volume={0.4} />
    <Sfx at={T.weave} name="whoosh" volume={0.3} rate={0.85} />
    {[0, 4, 8, 12].map((col) => (
      <Sfx key={col} at={weave.warpAt(col)} name="tick" volume={0.22} />
    ))}
    {[0, 2, 4, 6, 8, 10, 12, 14].map((row) => (
      <Sfx key={row} at={weave.weftAt(row)} name="swish" volume={0.12} rate={1.2} />
    ))}
    <Sfx at={T.twill} name="pop" volume={0.3} />
    <Sfx at={T.relaxEnd} name="thump" volume={0.28} />
    <Sfx at={T.colour} name="whoosh" volume={0.32} />
    <Sfx at={T.ways[0]} name="click" volume={0.3} />
    {T.ways.slice(1).map((at) => (
      <Sfx key={at} at={at} name="swish" volume={0.36} />
    ))}
    <Sfx at={T.end} name="whoosh" volume={0.3} />
    <Sfx at={T.endTitle} name="shimmer" volume={0.35} />
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
