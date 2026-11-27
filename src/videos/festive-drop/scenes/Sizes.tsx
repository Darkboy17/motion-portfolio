// 16.5-19 s. "Made in small batches", then the sizes pop in on sixteenths
// over a tailor's tape.
import React from "react";
import { AbsoluteFill } from "remotion";
import { fd } from "../palette";
import { SizePills, Tape } from "../SizePills";
import { SerifLine, SmallCaps } from "../Type";
import { sizesT } from "../timeline";

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export const Sizes: React.FC = () => (
  <AbsoluteFill>
    <div style={{ position: "absolute", top: 620, left: 60, right: 60 }}>
      <SerifLine text="Made in" at={sizesT.title} exitAt={sizesT.exit} size={132} color={fd.ink} />
      <SerifLine
        text="*small batches*"
        at={sizesT.title + 0.16}
        exitAt={sizesT.exit}
        size={132}
        color={fd.ink}
        emphColor={fd.oxblood}
        style={{ marginTop: 6 }}
      />
    </div>
    <div style={{ position: "absolute", top: 1020, left: 0, right: 0 }}>
      <SmallCaps
        text="Sizes"
        at={sizesT.stitch}
        exitAt={sizesT.exit}
        size={22}
        color={fd.inkMute}
        rule={fd.saffron}
      />
    </div>
    <div style={{ position: "absolute", top: 1078, left: 0, right: 0 }}>
      <SizePills sizes={SIZES} at={sizesT.pills} step={sizesT.pillStep} exitAt={sizesT.exit} />
    </div>
    <div style={{ position: "absolute", top: 1196, left: 90 }}>
      <Tape at={sizesT.stitch} exitAt={sizesT.exit} />
    </div>
  </AbsoluteFill>
);
