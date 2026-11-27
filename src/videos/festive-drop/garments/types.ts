import type React from "react";

/** What every garment drawing is driven by. All of it is plain progress. */
export type GarmentProps = {
  /** Unique prefix for this drawing's SVG ids. */
  id: string;
  /** The garment's fabric colour; trims and prints are fixed per design. */
  colour: string;
  /** Settle after the drop: a spring from 0 to 1 that may overshoot. */
  settle: number;
  /** Motif progress, 0 to 1: prints stamp, mirrors bloom, seams draw on. */
  bloom: number;
  /** Seconds since the garment landed, for idle motion. */
  idle: number;
};

export type GarmentComponent = React.FC<GarmentProps>;
