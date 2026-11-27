import React from "react";
import { Composition } from "remotion";
import { FPS } from "../../kit";
import { Derivative } from "./Derivative";
import { DERIVATIVE_SECONDS } from "./timeline";

export const DerivativeComposition: React.FC = () => (
  <Composition
    id="Derivative"
    component={Derivative}
    durationInFrames={DERIVATIVE_SECONDS * FPS}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
