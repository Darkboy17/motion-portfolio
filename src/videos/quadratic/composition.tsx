import React from "react";
import { Composition } from "remotion";
import { FPS } from "../../kit";
import { Quadratic } from "./Quadratic";
import { quadraticDefaults, quadraticSchema } from "./model";
import { QUADRATIC_SECONDS } from "./timeline";

export const QuadraticComposition: React.FC = () => (
  <Composition
    id="Quadratic"
    component={Quadratic}
    schema={quadraticSchema}
    defaultProps={quadraticDefaults}
    durationInFrames={QUADRATIC_SECONDS * FPS}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
