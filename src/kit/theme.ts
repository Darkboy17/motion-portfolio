// Design tokens: the one place colours, type, easing and springs are defined.
// Components never inline a hex value or an easing curve; they read from here.
import { Easing } from "remotion";

/** Explainer palette: white space, one green hero, ink for structure. */
const lab = {
  paper: "#FAFBF9",
  surface: "#FFFFFF",
  panel: "#F2F5F2",
  line: "#DFE5E0",
  grid: "#E9EEEA",
  ink: "#0F1A14",
  inkSoft: "#46534B",
  inkMute: "#8A968E",
  hero: "#12A15A",
  heroDeep: "#0B7A43",
  heroTint: "#E2F4E9",
  amber: "#E39B17",
  amberDeep: "#A86C00",
  amberTint: "#FCF1DA",
  red: "#D9473F",
  redTint: "#FBE5E3",
  blue: "#3466D6",
  blueTint: "#E5ECFB",
} as const;

/** Fashion palette: warm paper, deep ink, an oxblood hero and a fabric range. */
const atelier = {
  paper: "#F3EDE4",
  paperDeep: "#E7DED1",
  surface: "#FBF8F3",
  line: "#D5C9B8",
  ink: "#1C1814",
  inkSoft: "#5A5047",
  inkMute: "#968A7D",
  hero: "#8A1E2C",
  heroTint: "#F1DCDC",
  // fabric range, used for colourways and swatches
  indigo: "#28385E",
  chambray: "#8AA2C2",
  saffron: "#D98E2B",
  sage: "#8E9C7C",
  sand: "#CDB79A",
  blush: "#E3B7AE",
  charcoal: "#3A3632",
  chalk: "#F7F4EE",
} as const;

export const palettes = { lab, atelier } as const;
export type LabColor = keyof typeof lab;
export type AtelierColor = keyof typeof atelier;

export const fonts = {
  /** UI, labels, explainer display. Has no italic; math variables get a synthetic oblique. */
  sans: "Manrope",
  /** Editorial display for the fashion pieces. */
  serif: "Fraunces",
  /** Code and tabular readouts. */
  mono: "JetBrains Mono",
} as const;

/** Type scale in px at 1080p. Explainers use 1920x1080, so these read at a glance. */
export const type = {
  kicker: 22,
  caption: 34,
  body: 30,
  label: 24,
  small: 20,
  h3: 44,
  h2: 64,
  h1: 96,
  hero: 132,
} as const;

/** Linear is forbidden. Entrances use `out`, moves use `inOut`, exits use `in`. */
export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  outSoft: Easing.bezier(0.22, 1, 0.36, 1),
  inOut: Easing.bezier(0.83, 0, 0.17, 1),
  inOutSoft: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
} as const;

export const springs = {
  snappy: { damping: 14, stiffness: 160, mass: 0.6 },
  smooth: { damping: 20, stiffness: 90, mass: 1 },
  bouncy: { damping: 11, stiffness: 170, mass: 0.7 },
  gentle: { damping: 30, stiffness: 70, mass: 1 },
} as const;
export type SpringName = keyof typeof springs;

/** Shared timing, in seconds. Converted to frames with `useSec`. */
export const timing = {
  stagger: 0.12,
  wordStagger: 0.08,
  enter: 0.7,
  exit: 0.35,
  hold: 0.6,
} as const;

export const FPS = 30;
