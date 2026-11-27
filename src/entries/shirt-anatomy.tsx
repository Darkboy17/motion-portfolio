// Entry for rendering this piece on its own: npx remotion still src/entries/shirt-anatomy.tsx ShirtAnatomy ...
import { registerRoot } from "remotion";
import { ShirtAnatomyComposition } from "../videos/shirt-anatomy/composition";

registerRoot(() => <ShirtAnatomyComposition />);
