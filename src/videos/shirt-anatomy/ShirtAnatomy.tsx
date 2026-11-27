// Anatomy of a Shirt: a button-down drawn as a fashion flat, taken apart into
// its pattern pieces, measured, sewn back together and recut in four cloths.
import React from "react";
import { Bed, During, EndFade, Sfx, Stage, palettes } from "../../kit";
import { Garment, buttonTimes, landingTime } from "./Garment";
import {
  ConstructionPanel,
  EndCard,
  FabricPanel,
  IntroPanel,
  PieceCounter,
  SheetHeader,
  TrayCaption,
} from "./Panels";
import { PIECES } from "./pieces";
import { STEPS, STITCH, SWAPS, T } from "./timeline";

export { SHIRTANATOMY_SECONDS } from "./timeline";

export const ShirtAnatomy: React.FC = () => (
  <Stage variant="atelier">
    <Garment />
    <During from={0} to={T.explode + 0.2}>
      <IntroPanel />
    </During>
    <During from={T.sheet} to={T.gather + 0.5}>
      <SheetHeader />
      <PieceCounter />
    </During>
    <During from={T.gather + 0.4} to={T.fabric + 0.1}>
      <ConstructionPanel />
      <TrayCaption />
    </During>
    <During from={T.fabric} to={T.end}>
      <FabricPanel />
    </During>
    <During from={T.end} to={T.total}>
      <EndCard />
    </During>
    <Soundtrack />
    <EndFade color={palettes.atelier.paper} />
  </Stage>
);

/** Stitching sounds like a machine: a quick run of soft ticks while the needle moves. */
const STITCH_TICKS = 6;

const Soundtrack: React.FC = () => (
  <>
    <Bed name="pulse" volume={0.17} fadeIn={0.8} fadeOut={2} />
    <Sfx at={T.title + 0.2} name="swish" volume={0.25} />
    <Sfx at={T.draw} name="shimmer" volume={0.12} />
    <Sfx at={T.fill} name="swish" volume={0.3} />
    {buttonTimes.map((at) => (
      <Sfx key={`b${at}`} at={at} name="tick" volume={0.22} />
    ))}
    <Sfx at={T.explode} name="whoosh" volume={0.45} />
    {PIECES.map((p) => (
      <Sfx key={`l${p.id}`} at={landingTime(p)} name="click" volume={0.16} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <Sfx key={`m${i}`} at={T.measure + i * 0.75} name="tick" volume={0.3} />
    ))}
    <Sfx at={T.allowance} name="shimmer" volume={0.12} />
    <Sfx at={T.gather + 0.1} name="swish" volume={0.3} />
    {STEPS.map((s) => (
      <React.Fragment key={s.id}>
        <Sfx at={s.at} name="click" volume={0.28} />
        {Array.from({ length: STITCH_TICKS }, (_, i) => (
          <Sfx
            key={i}
            at={s.at + STITCH.delay + (i * STITCH.dur) / STITCH_TICKS}
            name="type"
            volume={0.14}
          />
        ))}
      </React.Fragment>
    ))}
    <Sfx at={T.complete} name="thump" volume={0.5} />
    {SWAPS.slice(1).map((s) => (
      <Sfx key={s.fabric} at={s.at} name="swish" volume={0.32} />
    ))}
    <Sfx at={T.end + 0.9} name="chime" volume={0.26} />
  </>
);
