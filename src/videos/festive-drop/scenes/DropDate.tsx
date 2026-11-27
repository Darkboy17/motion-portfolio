// 2-4 s. "Drops Friday · 7 PM": the day and time arrive on a split-flap board,
// landing tile by tile in reading order.
import React from "react";
import { AbsoluteFill } from "remotion";
import { useExit } from "../../../kit";
import { fd } from "../palette";
import { FlapWord } from "../SplitFlap";
import { SerifLine, SmallCaps } from "../Type";
import { EXIT, dateT } from "../timeline";

const DAY = { w: 132, h: 184, bg: fd.oxblood, fg: fd.chalk, size: 128 };
const TIME = { ...DAY, bg: fd.ink };

export const DropDate: React.FC = () => {
  const exit = useExit(dateT.exit, EXIT);
  return (
    <AbsoluteFill
      style={{
        opacity: 1 - exit,
        transform: `translateY(${-exit * 30}px) scale(${1 + exit * 0.04})`,
      }}
    >
      <div style={{ position: "absolute", top: 560, left: 0, right: 0 }}>
        <SerifLine text="*Drops*" at={dateT.kicker} size={176} color={fd.ink} spring="smooth" />
      </div>
      <div
        style={{
          position: "absolute",
          top: 790,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <FlapWord text="FRIDAY" at={dateT.tiles} s={DAY} />
      </div>
      <div
        style={{
          position: "absolute",
          top: 1000,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <FlapWord text="7 PM" at={dateT.time} s={TIME} />
      </div>
      <div style={{ position: "absolute", top: 1262, left: 0, right: 0 }}>
        <SmallCaps text="Save the date" at={dateT.note} color={fd.inkSoft} rule={fd.saffron} />
      </div>
    </AbsoluteFill>
  );
};
