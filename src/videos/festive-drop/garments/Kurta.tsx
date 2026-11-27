// An A-line kurta on an invisible form: round neck with a placket, 3/4
// sleeves, side slits, and a hand block-printed border. The border is
// "stamped" one block at a time along the hem, the way it is printed.
import React from "react";
import { evolvePath } from "@remotion/paths";
import { ease, tween } from "../../../kit";
import { fd, tones } from "../palette";
import { Motif } from "../motifs";
import { BOX, mirrorX, onQuad, remap, staggerP, symPath } from "./geometry";
import type { Pt } from "./geometry";
import type { GarmentProps } from "./types";

// Hem: a parabola from corner to corner, dipping at centre front.
const HEM: [Pt, Pt, Pt] = [
  [164, 1010],
  [400, 1086],
  [636, 1010],
];

const BODY = symPath(
  [400, 74],
  [
    [
      [378, 74],
      [352, 76],
      [336, 82],
    ], // back neckline
    [
      [312, 90],
      [282, 100],
      [256, 110],
    ], // shoulder
    [
      [252, 160],
      [262, 220],
      [274, 262],
    ], // armhole, under the sleeve
    [
      [280, 320],
      [288, 380],
      [288, 430],
    ], // side to waist
    [
      [288, 500],
      [280, 560],
      [272, 608],
    ], // waist to slit
    [
      [248, 760],
      [200, 900],
      [164, 1010],
    ], // A-line flare
    [
      [242.67, 1035.33],
      [321.33, 1048],
      [400, 1048],
    ], // hem, left half
  ],
);

// The back panel, seen as a sliver through each side slit.
const BACK = symPath(
  [400, 600],
  [
    [
      [340, 600],
      [292, 602],
      [272, 608],
    ],
    [
      [244, 760],
      [190, 894],
      [148, 996],
    ],
    [
      [230, 1008],
      [320, 1014],
      [400, 1014],
    ],
  ],
);

const SLEEVE =
  "M 256 110 C 238 114 222 134 215 168 C 204 262 188 372 172 466 L 254 484 " +
  "C 260 400 270 322 276 262 C 268 214 259 160 256 110 Z";
const CUFF = "M 164 464 L 262 486";
const INSIDE =
  "M 336 82 C 352 76 378 74 400 74 C 422 74 448 76 464 82 " +
  "C 460 118 434 150 400 150 C 366 150 340 118 336 82 Z";
const NECKLINE = "M 336 82 C 340 118 366 150 400 150 C 434 150 460 118 464 82";
const PLACKET = "M 389 150 L 389 284 Q 389 296 400 297 Q 411 296 411 284 L 411 150";

// Fold shading for the left half; the right half is its mirror.
const FOLDS_SHADOW = [
  "M 300 600 C 294 740 274 880 250 1032 L 276 1040 C 290 890 302 746 300 600 Z",
  "M 356 650 C 352 790 344 910 338 1046 L 354 1048 C 356 916 358 790 356 650 Z",
  "M 276 262 C 270 322 260 400 254 484 L 237 480 C 244 400 256 330 268 280 Z",
  "M 288 470 C 286 530 280 580 272 608 C 284 570 294 520 297 470 Z",
];
const FOLDS_LIT = [
  "M 318 612 C 314 756 302 900 290 1042 L 302 1044 C 312 904 322 760 318 612 Z",
  "M 222 182 C 213 262 200 362 190 464 L 200 466 C 210 362 223 262 232 188 Z",
];

const STAMPS = 11;

export const Kurta: React.FC<GarmentProps> = ({ id, colour, bloom }) => {
  const t = tones(colour);
  const print = fd.oxblood;
  const clip = `${id}-body`;
  const sleeveClip = `${id}-sleeve`;
  const field = `${id}-field`;
  const bloomMask = `${id}-bloom`;

  // Bloom order: trims draw first, the field opens from the chest, then the
  // border is stamped left to right.
  const trim = tween(bloom, [0, 0.45], [0, 1], ease.inOutSoft);
  const fieldR = tween(bloom, [0.05, 0.75], [0, 1100], ease.out);
  const stampP = remap(bloom, 0.2, 1);
  const neck = evolvePath(trim, NECKLINE);

  const stamps = Array.from({ length: STAMPS + 2 }, (_, k) => {
    const i = k - 1;
    const s = (i + 0.5) / STAMPS;
    const at = onQuad(
      [HEM[0][0], HEM[0][1] - 40],
      [HEM[1][0], HEM[1][1] - 40],
      [HEM[2][0], HEM[2][1] - 40],
      s,
    );
    const p = staggerP(stampP, k, STAMPS + 2, 2.2);
    return { k, ...at, p };
  });

  const sleeves = (
    <>
      <path d={SLEEVE} fill={t.base} />
      <path d={SLEEVE} fill={`url(#${field})`} mask={`url(#${bloomMask})`} />
      <g clipPath={`url(#${sleeveClip})`}>
        <path
          d={CUFF}
          stroke={print}
          strokeWidth={68}
          strokeDasharray={evolvePath(trim, CUFF).strokeDasharray}
          strokeDashoffset={evolvePath(trim, CUFF).strokeDashoffset}
        />
        <path
          d="M 166 438 L 266 460"
          stroke={fd.saffron}
          strokeWidth={3}
          strokeDasharray="3 9"
          strokeLinecap="round"
          opacity={tween(trim, [0.6, 1], [0, 0.9], ease.out)}
        />
      </g>
      {FOLDS_SHADOW.slice(2, 3).map((d) => (
        <path key={d} d={d} fill={t.shadow} opacity={0.55} />
      ))}
      {FOLDS_LIT.slice(1).map((d) => (
        <path key={d} d={d} fill={t.lit} opacity={0.4} />
      ))}
      <path
        d="M 256 110 C 259 160 268 214 276 262"
        fill="none"
        stroke={t.line}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </>
  );

  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={sleeveClip}>
          <path d={SLEEVE} />
        </clipPath>
        <pattern id={field} width={64} height={64} patternUnits="userSpaceOnUse">
          {[
            [16, 16],
            [48, 48],
          ].map(([x, y]) => (
            <g key={`${x}`} transform={`translate(${x} ${y})`}>
              <Motif name="booti" size={20} color={t.lit} accent={print} />
            </g>
          ))}
        </pattern>
        <mask id={bloomMask}>
          <circle cx={BOX.cx} cy={300} r={fieldR} fill="white" />
        </mask>
      </defs>

      <path d={BACK} fill={t.deep} />
      <path d={BODY} fill={t.base} />
      <path d={BODY} fill={`url(#${field})`} mask={`url(#${bloomMask})`} opacity={0.9} />

      <g clipPath={`url(#${clip})`}>
        {[false, true].map((m) => (
          <g key={`${m}`} transform={m ? mirrorX() : undefined}>
            {FOLDS_SHADOW.slice(0, 2)
              .concat(FOLDS_SHADOW.slice(3))
              .map((d) => (
                <path key={d} d={d} fill={t.shadow} opacity={0.5} />
              ))}
            <path d={FOLDS_LIT[0]} fill={t.lit} opacity={0.4} />
          </g>
        ))}
        {stamps.map(({ k, x, y, angle, p }) =>
          p <= 0 ? null : (
            <g
              key={k}
              transform={`translate(${x} ${y}) rotate(${angle}) scale(${1.3 - 0.3 * ease.out(p)})`}
              opacity={Math.min(1, p * 3)}
            >
              <rect x={-26} y={-41} width={52} height={90} fill={print} />
              <rect x={-26} y={-35} width={52} height={3} fill={fd.saffron} opacity={0.85} />
              <rect x={-26} y={-28} width={52} height={1.5} fill={fd.saffron} opacity={0.6} />
              <g transform="translate(0 10)">
                <Motif
                  name="buta"
                  size={34}
                  color={fd.saffron}
                  accent={fd.chalk}
                  rotate={k % 2 ? 14 : -14}
                />
              </g>
              <circle cx={-24} cy={-10} r={3} fill={fd.chalk} opacity={0.85} />
              <circle cx={-24} cy={30} r={3} fill={fd.chalk} opacity={0.85} />
            </g>
          ),
        )}
      </g>

      {/* Inside the back neck, with a woven label. */}
      <path d={INSIDE} fill={t.deep} />
      <rect x={389} y={79} width={22} height={11} rx={2} fill={fd.chalk} opacity={0.9} />
      <path
        d={NECKLINE}
        fill="none"
        stroke={print}
        strokeWidth={14}
        strokeLinecap="round"
        strokeDasharray={neck.strokeDasharray}
        strokeDashoffset={neck.strokeDashoffset}
      />
      <path d={PLACKET} fill={t.base} stroke={print} strokeWidth={3} strokeLinejoin="round" />
      {[184, 222, 260].map((y, i) => (
        <circle
          key={y}
          cx={400}
          cy={y}
          r={5 * tween(trim, [0.3 + i * 0.15, 0.6 + i * 0.15], [0, 1], ease.out)}
          fill={fd.chalk}
        />
      ))}

      {sleeves}
      <g transform={mirrorX()}>{sleeves}</g>
    </g>
  );
};
