import React from "react";
import { Composition, Folder } from "remotion";
import { FPS } from "./kit";
import { KitGallery, KIT_GALLERY_SECONDS } from "./videos/kit/KitGallery";

export const RemotionRoot: React.FC = () => (
  <>
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
