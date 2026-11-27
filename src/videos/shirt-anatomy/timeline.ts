// Beat sheet for Anatomy of a Shirt, in seconds. The bed runs at 120 BPM, so
// one beat is 0.5 s and every section starts on a beat. Every animation keys
// off these values, so retiming a section moves everything in it.

export const BEAT = 0.5;

export const T = {
  /** Kicker and title. */
  title: 0.15,
  /** The flat starts drawing on, stroke by stroke. */
  draw: 0.3,
  /** Fabric wipes into the drawing. */
  fill: 3,
  /** Buttons pop down the placket. */
  buttons: 3.5,
  /** Title leaves; the pieces lift off and glide into the pattern sheet. */
  explode: 6.5,
  /** Sheet header and piece counter. */
  sheet: 7,
  /** Dimension lines draw onto the pieces. */
  measure: 10.5,
  /** Dashed 1 cm seam allowances. */
  allowance: 13.5,
  /** Annotations leave and the sheet shrinks into the corner. */
  gather: 16.5,
  /** First construction step; one every three beats after it. */
  assemble: 17,
  /** Last seam done: buttons return and the shirt lands. */
  complete: 26,
  /** Fabric swaps, one every three beats. */
  fabric: 27,
  /** End card. */
  end: 33,
  total: 36,
} as const;

export const SHIRTANATOMY_SECONDS = T.total;

/** Seconds per construction step: the pieces fly home, the seam is sewn, a beat of stillness. */
export const STEP_EVERY = 1.5;

export type StepId = "yoke" | "shoulders" | "sleeves" | "sides" | "collar" | "cuffs";

/** Construction order. Each step flies its pieces home, then sews its seams. */
export const STEPS: { id: StepId; name: string; note: string; at: number }[] = [
  { id: "yoke", name: "Yoke", note: "Yoke to back" },
  { id: "shoulders", name: "Shoulders", note: "Fronts to yoke" },
  { id: "sleeves", name: "Sleeves", note: "Set into the armholes" },
  { id: "sides", name: "Side seams", note: "Underarm to hem" },
  { id: "collar", name: "Collar", note: "Stand, then collar" },
  { id: "cuffs", name: "Cuffs", note: "Pleated onto the sleeve" },
].map((s, i) => ({ ...s, id: s.id as StepId, at: T.assemble + i * STEP_EVERY }));

export const stepAt = (id: StepId) => STEPS.find((s) => s.id === id)?.at ?? T.assemble;

/** Seconds after a step starts: its pieces land, then the stitching runs. */
export const STITCH = { delay: 0.5, dur: 0.6 } as const;

export type FabricId = "oxford" | "chambray" | "bengal" | "gingham";

/** Fabric changes, three beats apart. Oxford is on the shirt from the fill onwards. */
export const SWAPS: { fabric: FabricId; at: number }[] = [
  { fabric: "oxford", at: T.fabric },
  { fabric: "chambray", at: 28.5 },
  { fabric: "bengal", at: 30 },
  { fabric: "gingham", at: 31.5 },
];

/** How long a fabric wipe takes to cross the shirt. */
export const WIPE = 0.5;
