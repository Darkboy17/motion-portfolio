// A jharokha: the pointed, ogee-topped window arch of Rajasthani palaces.
// It frames each look like a shop window, and its wash takes the look's colour.
import React from "react";
import { symPath } from "./garments/geometry";

/** An ogee arch, centred on cx, `w` half-wide, from its apex down to its sill. */
export const archPath = (cx: number, w: number, top: number, springY: number, bottom: number) => {
  const h = springY - top;
  const side = (bottom - springY) / 3;
  return symPath(
    [cx, top],
    [
      [
        [cx, top + h * 0.12],
        [cx - w * 0.1, top + h * 0.24],
        [cx - w * 0.3, top + h * 0.35],
      ],
      [
        [cx - w * 0.74, top + h * 0.52],
        [cx - w, top + h * 0.7],
        [cx - w, springY],
      ],
      [
        [cx - w, springY + side],
        [cx - w, bottom - side],
        [cx - w, bottom],
      ],
      [
        [cx - w * 0.66, bottom],
        [cx - w * 0.33, bottom],
        [cx, bottom],
      ],
    ],
    cx,
  );
};

export const ARCH = { cx: 540, w: 386, top: 318, spring: 640, bottom: 1352 } as const;

export const Arch: React.FC<{
  fill: string;
  line: string;
  /** Wipe-in from the sill up, 0 to 1. */
  reveal: number;
  opacity?: number;
}> = ({ fill, line, reveal, opacity = 1 }) => {
  const { cx, w, top, spring, bottom } = ARCH;
  const outer = archPath(cx, w, top, spring, bottom);
  const inner = archPath(cx, w - 22, top + 30, spring + 14, bottom - 22);
  const clipTop = bottom - (bottom - top + 40) * reveal;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity }}>
      <defs>
        <clipPath id="arch-reveal">
          <rect x={0} y={clipTop} width={1080} height={1920} />
        </clipPath>
      </defs>
      <g clipPath="url(#arch-reveal)">
        <path d={outer} fill={fill} />
        <path d={inner} fill="none" stroke={line} strokeWidth={2.5} />
        <circle cx={cx} cy={top - 16} r={7} fill={line} />
        <path d={`M ${cx} ${top - 9} L ${cx} ${top}`} stroke={line} strokeWidth={2.5} />
        <path
          d={`M ${cx - w - 34} ${bottom} L ${cx + w + 34} ${bottom}`}
          stroke={line}
          strokeWidth={2.5}
        />
      </g>
    </svg>
  );
};
