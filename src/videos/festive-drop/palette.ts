// The piece's colours: the atelier tokens, renamed for the festive story, plus
// the shades a flat illustration needs. No hue here is new: every value is an
// atelier token or a mix of two of them.
import { alpha, mix, palettes } from "../../kit";

const a = palettes.atelier;

export { mix };

/** The festive names for the atelier range. */
export const fd = {
  ...a,
  marigold: a.saffron,
  oxblood: a.hero,
  peacock: a.indigo,
  ivory: a.chalk,
} as const;

/** The tones a flat illustration draws one fabric with. */
export type Tones = {
  base: string;
  /** Insides: the back neck, the lining seen through a slit. */
  deep: string;
  /** Fold shadows. */
  shadow: string;
  /** Lit ridges. */
  lit: string;
  /** Seams and stitch lines. */
  line: string;
};

export const tones = (base: string): Tones => ({
  base,
  deep: mix(base, a.ink, 0.45),
  shadow: mix(base, a.ink, 0.2),
  lit: mix(base, a.chalk, 0.3),
  line: mix(base, a.ink, 0.34),
});

/** Ink at an alpha, for soft drop shadows. */
export const inkShadow = (opacity: number) => alpha(a.ink, opacity);

/** A pale wash of a colour on paper, for backdrops. */
export const wash = (c: string, k = 0.84) => mix(c, a.paper, k);
