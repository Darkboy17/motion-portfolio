import React from "react";
import { Composition } from "remotion";
import { FPS } from "../../kit";
import { ShirtAnatomy, SHIRTANATOMY_SECONDS } from "./ShirtAnatomy";

export const ShirtAnatomyComposition: React.FC = () => (
  <Composition
    id="ShirtAnatomy"
    component={ShirtAnatomy}
    durationInFrames={SHIRTANATOMY_SECONDS * FPS}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
