import React from "react";
import { AbsoluteFill } from "remotion";
import { Stage, fonts, palettes } from "../../kit";

export const HOUNDSTOOTH_SECONDS = 24;

/** Placeholder until the piece is built. */
export const Houndstooth: React.FC = () => (
  <Stage variant="atelier">
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.serif,
        fontSize: 80,
        color: palettes.atelier.ink,
      }}
    >
      Houndstooth
    </AbsoluteFill>
  </Stage>
);
