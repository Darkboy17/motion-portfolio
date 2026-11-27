import React from "react";
import { Composition, Folder } from "remotion";
import { FPS } from "./kit";
import { KitGallery, KIT_GALLERY_SECONDS } from "./videos/kit/KitGallery";
import { QuadraticComposition } from "./videos/quadratic/composition";
import { ShirtAnatomyComposition } from "./videos/shirt-anatomy/composition";
import { HoundstoothComposition } from "./videos/houndstooth/composition";
import { FestiveDropComposition } from "./videos/festive-drop/composition";

export const RemotionRoot: React.FC = () => (
  <>
    <Folder name="Explainers">
      <QuadraticComposition />
    </Folder>
    <Folder name="Fashion">
      <ShirtAnatomyComposition />
      <HoundstoothComposition />
      <FestiveDropComposition />
    </Folder>
    <Folder name="Kit">
      <Composition
        id="KitGallery"
        component={KitGallery}
        durationInFrames={KIT_GALLERY_SECONDS * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </Folder>
  </>
);
