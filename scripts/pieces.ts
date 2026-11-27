// Every piece the scripts render, with its poster frame and, for the explainers,
// the caption cues that are burned into the video.
import type { Cue } from "../src/kit/cues";
import { buildModel, quadraticDefaults } from "../src/videos/quadratic/model";
import { cues as quadraticCues, QUADRATIC_SECONDS } from "../src/videos/quadratic/timeline";
import { cues as derivativeCues, DERIVATIVE_SECONDS } from "../src/videos/derivative/timeline";
import { cues as arctanCues, ARCTAN_SECONDS } from "../src/videos/arctan/timeline";

export type Piece = {
  slug: string;
  id: string;
  /** Seconds into the piece for the poster frame. */
  poster: number;
  captions?: { cues: Cue[]; end: number };
};

export const PIECES: Piece[] = [
  {
    slug: "quadratic",
    id: "Quadratic",
    poster: 62.6,
    captions: { cues: quadraticCues(buildModel(quadraticDefaults)), end: QUADRATIC_SECONDS },
  },
  {
    slug: "derivative",
    id: "Derivative",
    poster: 53.4,
    captions: { cues: derivativeCues, end: DERIVATIVE_SECONDS },
  },
  {
    slug: "arctan",
    id: "Arctan",
    poster: 41,
    captions: { cues: arctanCues(), end: ARCTAN_SECONDS },
  },
  { slug: "shirt-anatomy", id: "ShirtAnatomy", poster: 13.6 },
  { slug: "houndstooth", id: "Houndstooth", poster: 14 },
  { slug: "festive-drop", id: "FestiveDrop", poster: 9.2 },
  { slug: "kit-gallery", id: "KitGallery", poster: 10 },
];
