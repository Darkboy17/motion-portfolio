import React from "react";
import { Composition } from "remotion";
import { FPS } from "../../kit";
import { Arctan } from "./Arctan";
import { ARCTAN_SECONDS } from "./timeline";

export const ArctanComposition: React.FC = () => (
  <Composition
    id="Arctan"
    component={Arctan}
    durationInFrames={ARCTAN_SECONDS * FPS}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
