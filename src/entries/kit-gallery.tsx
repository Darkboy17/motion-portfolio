// Entry for rendering the kit gallery on its own: npx remotion still src/entries/kit-gallery.tsx KitGallery ...
import { Composition, registerRoot } from "remotion";
import { FPS } from "../kit";
import { KIT_GALLERY_SECONDS, KitGallery } from "../videos/kit/KitGallery";

registerRoot(() => (
  <Composition
    id="KitGallery"
    component={KitGallery}
    durationInFrames={KIT_GALLERY_SECONDS * FPS}
    fps={FPS}
    width={1920}
    height={1080}
  />
));
