import React from "react";
import { Composition } from "remotion";
import { FPS } from "../../kit";
import { FestiveDrop, FESTIVEDROP_SECONDS } from "./FestiveDrop";

export const FestiveDropComposition: React.FC = () => (
  <Composition
    id="FestiveDrop"
    component={FestiveDrop}
    durationInFrames={FESTIVEDROP_SECONDS * FPS}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
