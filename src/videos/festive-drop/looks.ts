// The collection, as data. A look is a name, a fabric line, its colourways and
// a garment drawing; the carousel renders whatever is in this list.
import { Bandhgala } from "./garments/Bandhgala";
import { Kurta } from "./garments/Kurta";
import { Lehenga } from "./garments/Lehenga";
import type { GarmentComponent } from "./garments/types";
import { fd, wash } from "./palette";

export type Look = {
  id: string;
  /** Fraunces line; the garment type sits in *italic*. */
  name: string;
  fabric: string;
  colour: string;
  colourways: readonly string[];
  Garment: GarmentComponent;
  /** "drop" falls in on a spring; "wipe" is revealed top to bottom, crisp. */
  enter: "drop" | "wipe";
  /** Degrees of pendulum swing as it lands: soft fabrics swing more. */
  swing: number;
  /** Where the swing tag hangs from, in garment units (800 x 1100). */
  tag: { x: number; y: number };
  /** Width of the floor shadow, in garment units. */
  hem: number;
  /** The arch's wash behind this look. */
  backdrop: string;
  /** The colour the paper's corner wash turns to for this look. */
  glow: string;
};

export const LOOKS: readonly Look[] = [
  {
    id: "genda",
    name: "Genda *kurta*",
    fabric: "Hand block-printed cotton",
    colour: fd.marigold,
    colourways: [fd.marigold, fd.chalk, fd.sage],
    Garment: Kurta,
    enter: "drop",
    swing: 5,
    tag: { x: 588, y: 476 },
    hem: 470,
    backdrop: wash(fd.marigold, 0.8),
    glow: fd.saffron,
  },
  {
    id: "noor",
    name: "Noor *lehenga*",
    fabric: "Chanderi silk · mirror work",
    colour: fd.oxblood,
    colourways: [fd.oxblood, fd.peacock, fd.marigold],
    Garment: Lehenga,
    enter: "drop",
    swing: 2,
    tag: { x: 490, y: 400 },
    hem: 690,
    backdrop: wash(fd.oxblood, 0.84),
    glow: fd.blush,
  },
  {
    id: "mehtab",
    name: "Mehtab *bandhgala*",
    fabric: "Raw silk · hand-finished",
    colour: fd.peacock,
    colourways: [fd.peacock, fd.chalk, fd.charcoal],
    Garment: Bandhgala,
    enter: "wipe",
    swing: 0,
    tag: { x: 566, y: 595 },
    hem: 200,
    backdrop: wash(fd.chambray, 0.6),
    glow: fd.chambray,
  },
];
