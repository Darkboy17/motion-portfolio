import React from "react";
import { Composition } from "remotion";
import { FPS } from "../../kit";
import { Houndstooth, HOUNDSTOOTH_SECONDS } from "./Houndstooth";

export const HoundstoothComposition: React.FC = () => (
  <Composition
    id="Houndstooth"
    component={Houndstooth}
    durationInFrames={HOUNDSTOOTH_SECONDS * FPS}
    fps={FPS}
    width={1080}
    height={1080}
  />
);
