// A structured bandhgala over churidar, on an invisible form: stand collar,
// seven brass buttons, princess seams, welt and flap pockets, and the slubs of
// raw silk. The motif here is the finishing: buttons pop down the placket,
// pick-stitching wipes on, and a small embroidered buta blooms on the chest.
import React from "react";
import { random } from "remotion";
import { ease, tween } from "../../../kit";
import { fd, mix, tones } from "../palette";
import { Motif } from "../motifs";
import { mirrorX, popScale, remap, staggerP, symPath } from "./geometry";
import type { GarmentProps } from "./types";

const JACKET = symPath(
  [400, 122],
  [
    [
      [380, 120],
      [360, 114],
      [346, 106],
    ], // under the collar
    [
      [320, 112],
      [290, 120],
      [258, 126],
    ], // a square, structured shoulder
    [
      [254, 180],
      [262, 240],
      [280, 282],
    ], // armhole, under the sleeve
    [
      [290, 340],
      [298, 390],
      [298, 430],
    ], // side to a suppressed waist
    [
      [298, 500],
      [290, 580],
      [282, 642],
    ], // waist to hem
    [
      [316, 650],
      [366, 656],
      [400, 656],
    ], // hem, left half
  ],
);

const TROUSERS = symPath(
  [400, 630],
  [
    [
      [360, 630],
      [320, 630],
      [300, 640],
    ],
    [
      [306, 780],
      [318, 940],
      [328, 1064],
    ], // outer leg, tapering to the ankle
    [
      [346, 1068],
      [368, 1068],
      [384, 1064],
    ], // ankle
    [
      [386, 940],
      [390, 800],
      [396, 702],
    ], // inner leg
    [
      [398, 698],
      [400, 694],
      [400, 692],
    ],
  ],
);

const SLEEVE =
  "M 258 126 C 240 130 228 148 224 178 C 215 300 205 440 195 588 L 272 602 " +
  "C 274 490 280 380 284 282 C 272 236 262 180 258 126 Z";

const COLLAR =
  "M 350 76 C 362 86 380 94 393 97 Q 398 98 398 103 L 398 126 " + "C 380 124 360 116 346 106 Z";
const COLLAR_INSIDE =
  "M 350 76 C 366 66 384 62 400 62 C 416 62 434 66 450 76 " +
  "C 438 86 420 94 404 97 L 396 97 C 380 94 362 86 350 76 Z";

// Stitch and seam lines for the left half (mirrored for the right).
const SEAMS = [
  "M 288 236 C 318 266 334 330 332 420 C 330 500 328 580 328 652",
  "M 258 126 C 262 180 272 236 284 282",
];
const STITCH_LEFT = ["M 352 84 C 364 92 380 99 390 101", "M 290 636 C 320 644 364 648 392 648"];
const STITCH_CF = "M 412 134 L 412 646";

const BUTTONS = [152, 224, 296, 368, 440, 512, 584];

export const Bandhgala: React.FC<GarmentProps> = ({ id, colour, bloom }) => {
  const t = tones(colour);
  const pant = tones(fd.chalk);
  const brass = fd.saffron;
  const clip = `${id}-jacket`;
  const wipe = `${id}-wipe`;

  const seamP = tween(bloom, [0, 0.55], [0, 1], ease.inOutSoft);
  const buttonsP = remap(bloom, 0.1, 0.8);
  const butaP = remap(bloom, 0.55, 1);

  // Raw-silk slubs: short, uneven threads, seeded so every frame agrees.
  const slubs = Array.from({ length: 150 }, (_, i) => ({
    x: 210 + random(`slub-x-${i}`) * 380,
    y: 130 + random(`slub-y-${i}`) * 520,
    w: 5 + random(`slub-w-${i}`) * 13,
    o: 0.08 + random(`slub-o-${i}`) * 0.16,
  }));

  const sleeve = (
    <>
      <path d={SLEEVE} fill={t.base} />
      <path
        d="M 284 282 C 280 380 274 490 272 602 L 254 599 C 258 490 264 380 274 296 Z"
        fill={t.shadow}
        opacity={0.6}
      />
      <path
        d="M 232 190 C 224 300 216 430 208 586 L 220 588 C 228 430 236 300 242 196 Z"
        fill={t.lit}
        opacity={0.3}
      />
      <path d="M 200 552 L 274 566" stroke={t.line} strokeWidth={2.5} strokeLinecap="round" />
      {[0, 1].map((k) => (
        <circle
          key={k}
          cx={217 + k * 18}
          cy={570 + k * 3.4}
          r={4.5 * popScale(remap(buttonsP, 0.7 + k * 0.1, 0.95 + k * 0.05))}
          fill={brass}
        />
      ))}
    </>
  );

  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <path d={JACKET} />
          <path d={SLEEVE} />
          <path d={SLEEVE} transform={mirrorX()} />
        </clipPath>
        <mask id={wipe}>
          <rect x={0} y={0} width={800} height={60 + 620 * seamP} fill="white" />
        </mask>
      </defs>

      {/* Churidar, gathered at the ankle. */}
      <path d={TROUSERS} fill={pant.base} />
      {[false, true].map((m) => (
        <g key={`${m}`} transform={m ? mirrorX() : undefined}>
          <path
            d="M 396 702 C 390 800 386 940 384 1064 L 366 1066 C 370 940 378 800 388 712 Z"
            fill={pant.shadow}
            opacity={0.55}
          />
          <path
            d="M 352 700 C 352 800 356 900 358 960"
            stroke={pant.shadow}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
          {[0, 1, 2, 3, 4].map((k) => {
            const y = 968 + k * 20;
            return (
              <path
                key={k}
                d={`M ${321 + k * 1.6} ${y} C ${340} ${y + 9} ${366} ${y + 9} ${385} ${y + 1}`}
                stroke={pant.shadow}
                strokeWidth={3}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ))}

      {/* Jacket */}
      <path d={JACKET} fill={t.base} />
      <g clipPath={`url(#${clip})`}>
        {slubs.map((sl) => (
          <path
            key={`${sl.x}:${sl.y}`}
            d={`M ${sl.x} ${sl.y} l ${sl.w} 0.6`}
            stroke={t.lit}
            strokeWidth={1.6}
            strokeLinecap="round"
            opacity={sl.o}
          />
        ))}
        {[false, true].map((m) => (
          <g key={`${m}`} transform={m ? mirrorX() : undefined}>
            <path
              d="M 298 430 C 298 500 290 580 282 642 L 304 646 C 306 580 312 500 312 430 Z"
              fill={t.shadow}
              opacity={0.5}
            />
            <path
              d="M 340 330 C 344 420 342 540 340 650 L 352 652 C 354 540 356 420 352 330 Z"
              fill={t.lit}
              opacity={0.18}
            />
          </g>
        ))}
        {/* Front edge: the left front laps over the right. */}
        <path d="M 404 128 L 404 656 L 392 656 L 396 128 Z" fill={t.shadow} opacity={0.5} />
      </g>
      <path d="M 404 128 L 404 655" stroke={t.line} strokeWidth={2.5} />

      {[false, true].map((m) => (
        <g key={`${m}`} transform={m ? mirrorX() : undefined}>
          {SEAMS.map((d) => (
            <path
              key={d}
              d={d}
              stroke={t.line}
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
            />
          ))}
          {/* Flap pocket */}
          <path
            d="M 318 494 L 384 492 L 384 518 Q 351 522 318 520 Z"
            fill={t.shadow}
            opacity={0.35}
          />
          <path
            d="M 316 490 L 386 488 L 386 514 Q 351 518 316 516 Z"
            fill={t.base}
            stroke={t.line}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        </g>
      ))}
      {/* Chest welt, on the wearer's left. */}
      <path d="M 452 262 L 522 252 L 523 264 L 453 274 Z" fill={t.deep} opacity={0.7} />

      {/* Pick-stitching, wiped on from the collar down. */}
      <g mask={`url(#${wipe})`} opacity={0.85}>
        {[false, true].map((m) => (
          <g key={`${m}`} transform={m ? mirrorX() : undefined}>
            {STITCH_LEFT.map((d) => (
              <path
                key={d}
                d={d}
                stroke={t.lit}
                strokeWidth={2}
                strokeDasharray="2 6"
                fill="none"
                strokeLinecap="round"
              />
            ))}
            <path
              d="M 322 500 L 380 498"
              stroke={t.lit}
              strokeWidth={2}
              strokeDasharray="2 6"
              strokeLinecap="round"
            />
          </g>
        ))}
        <path
          d={STITCH_CF}
          stroke={t.lit}
          strokeWidth={2}
          strokeDasharray="2 6"
          strokeLinecap="round"
        />
        <path
          d="M 458 268 L 516 260"
          stroke={t.lit}
          strokeWidth={2}
          strokeDasharray="2 6"
          strokeLinecap="round"
        />
      </g>

      {/* Collar */}
      <path d={COLLAR_INSIDE} fill={t.deep} />
      <rect x={395} y={96} width={10} height={32} fill={t.deep} />
      <path d={COLLAR} fill={t.base} />
      <path d={COLLAR} fill={t.base} transform={mirrorX()} />
      <path d="M 346 106 C 360 116 380 124 398 126" stroke={t.line} strokeWidth={2.5} fill="none" />
      <path
        d="M 346 106 C 360 116 380 124 398 126"
        stroke={t.line}
        strokeWidth={2.5}
        fill="none"
        transform={mirrorX()}
      />

      {/* Buttons, popping down the placket. */}
      {BUTTONS.map((y, i) => {
        const s = popScale(staggerP(buttonsP, i, BUTTONS.length, 2));
        return s <= 0 ? null : (
          <g key={y} transform={`translate(400 ${y}) scale(${s})`}>
            <circle r={9.5} fill={brass} stroke={mix(brass, fd.ink, 0.35)} strokeWidth={2} />
            <circle cx={-3} cy={-3} r={2.6} fill={fd.chalk} opacity={0.85} />
          </g>
        );
      })}

      {/* An embroidered buta over the chest welt. */}
      <g
        transform={`translate(488 214) rotate(${-12 + 12 * ease.out(butaP)}) scale(${popScale(butaP)})`}
        opacity={butaP > 0 ? 1 : 0}
      >
        <Motif name="buta" size={34} color={brass} accent={fd.chalk} rotate={16} />
      </g>

      {sleeve}
      <g transform={mirrorX()}>{sleeve}</g>
    </g>
  );
};
