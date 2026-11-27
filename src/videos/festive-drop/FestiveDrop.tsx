import React from "react";
import { AbsoluteFill } from "remotion";
import { Stage, fonts, palettes } from "../../kit";

export const FESTIVEDROP_SECONDS = 22;

/** Placeholder until the piece is built. */
export const FestiveDrop: React.FC = () => (
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
      FestiveDrop
    </AbsoluteFill>
  </Stage>
);
