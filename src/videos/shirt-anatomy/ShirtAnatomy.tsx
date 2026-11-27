// Anatomy of a Shirt: a button-down drawn as a fashion flat, taken apart into
// its pattern pieces, measured, sewn back together and recut in four cloths.
import React from "react";
import { Bed, During, EndFade, Sfx, SfxRun, Stage, palettes } from "../../kit";
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

// Pencil for the drawing, paper for the pattern pieces, and the sewing machine
// from Work With Sounds on every seam.
const Soundtrack: React.FC = () => (
  <>
    <Bed name="pulse" volume={0.17} fadeIn={0.8} fadeOut={2} />
    <Sfx at={T.title + 0.2} name="cloth" />
    <SfxRun at={T.draw} name="pencil" count={4} step={0.6} gain={0.8} />
    <Sfx at={T.fill} name="cloth" take={1} />
    {buttonTimes.map((at, i) => (
      <Sfx key={`b${at}`} at={at} name="click" take={i} gain={0.7} />
    ))}
    <Sfx at={T.explode} name="flip" />
    <Sfx at={T.explode + 0.1} name="rise" gain={0.8} />
    {PIECES.map((p, i) => (
      <Sfx key={`l${p.id}`} at={landingTime(p)} name="place" take={i} gain={0.6} />
    ))}
    {[0, 1, 2, 3].map((i) => (
      <Sfx key={`m${i}`} at={T.measure + i * 0.75} name="pencil" take={i + 2} />
    ))}
    <Sfx at={T.allowance} name="pencil" take={5} />
    <Sfx at={T.gather + 0.1} name="flip" take={1} />
    {STEPS.map((s, i) => (
      <React.Fragment key={s.id}>
        <Sfx at={s.at} name="latch" take={i} gain={0.6} />
        <Sfx at={s.at + STITCH.delay} name="sewing" take={i} dur={STITCH.dur} />
      </React.Fragment>
    ))}
    <Sfx at={T.complete} name="thud" />
    {SWAPS.slice(1).map((s, i) => (
      <Sfx key={s.fabric} at={s.at} name="cloth" take={i + 2} />
    ))}
    <Sfx at={T.end + 0.9} name="glass" />
  </>
);
