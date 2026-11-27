// A flared lehenga with a cropped choli, on an invisible form. The skirt is
// not drawn by hand: it is a flared cone with fluted folds, so the twirl as it
// lands, the flutes, the zari border and every mirror all follow one surface.
import React from "react";
import { evolvePath } from "@remotion/paths";
import { ease, tween } from "../../../kit";
import { fd, mix, tones } from "../palette";
import { mirrorX, popScale, remap, smoothPath, symPath } from "./geometry";
import type { Pt } from "./geometry";
import type { GarmentProps } from "./types";

// Skirt cone: waist ring to hem ring, with the ring's depth growing toward the
// hem because we look down on it slightly.
const SK = {
  cx: 400,
  y0: 404,
  y1: 990,
  hw0: 98,
  hw1: 338,
  d0: 12,
  d1: 42,
  flutes: 22,
  /** How far each flute's hem bulges toward us. */
  amp: 28,
  /** Where the zari border starts, as a fraction of the skirt's length. */
  border: 0.86,
  gota: 0.81,
} as const;

const TAU = Math.PI * 2;
const FLUTE = TAU / SK.flutes;

type Surface = { flare: number; phase: number };

const hwAt = (t: number, s: Surface) =>
  SK.hw0 + (SK.hw1 - SK.hw0) * s.flare * (1 - Math.pow(1 - t, 1.45));
const yAt = (t: number) => SK.y0 + (SK.y1 - SK.y0) * t;
const dAt = (t: number) => SK.d0 + (SK.d1 - SK.d0) * t;

/** Where a point of fabric sits on screen: t down the skirt, th around it (pi/2 is centre front). */
const at = (t: number, th: number, s: Surface, f = -1): Pt => {
  // f is the point's place across its flute (0..1); the flute bulges toward us at the hem.
  const bulge = f < 0 ? 0 : SK.amp * t * t * Math.sin(Math.PI * f) * (0.45 + 0.55 * Math.sin(th));
  return [SK.cx + hwAt(t, s) * Math.cos(th), yAt(t) + dAt(t) * Math.sin(th) + bulge];
};

/** Fold valleys that face us, plus the two silhouette edges. */
const boundaries = (s: Surface) => {
  const out: { th: number; fold: boolean }[] = [{ th: 0, fold: false }];
  const first = Math.ceil((0 - s.phase) / FLUTE);
  for (let j = first; ; j++) {
    const th = s.phase + j * FLUTE;
    if (th >= Math.PI) break;
    if (th > 0.0001) out.push({ th, fold: true });
  }
  out.push({ th: Math.PI, fold: false });
  return out;
};

/** Fraction across the flute at angle th, for the bulge. */
const fluteF = (th: number, s: Surface) => {
  const k = (th - s.phase) / FLUTE;
  return k - Math.floor(k);
};

const T_SAMPLES = [0, 0.15, 0.32, 0.5, 0.68, 0.84, 1];

/**
 * The skirt's whole silhouette, filled dark: it shows between flutes at the
 * hem as the inside of the folds, so its hem sits halfway down each flute.
 */
const insidePath = (s: Surface) => {
  const steps = 40;
  const ring = (t: number, inside: boolean) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const th = (Math.PI * i) / steps;
      const [x, y] = at(t, th, s);
      return [x, y + (inside ? SK.amp * 0.45 * (0.45 + 0.55 * Math.sin(th)) : 0)] as Pt;
    });
  // Waist ring right to left, down the left edge, hem back to the right, up the right edge.
  const leftDown = T_SAMPLES.map((t) => at(t, Math.PI, s, fluteF(Math.PI, s)));
  const rightUp = T_SAMPLES.map((t) => at(t, 0, s, fluteF(0, s))).reverse();
  return `${smoothPath(ring(0, false))} ${smoothPath(leftDown, false)} ${smoothPath(
    ring(1, true).reverse(),
    false,
  )} ${smoothPath(rightUp, false)} Z`;
};

/** One flute panel between two angles, from t0 to t1, as a closed path. */
const panelPath = (a: number, b: number, t0: number, t1: number, s: Surface) => {
  const ts = T_SAMPLES.filter((t) => t > t0 && t < t1);
  const down = [t0, ...ts, t1].map((t) => at(t, a, s, fluteF(a, s)));
  const up = [t1, ...ts.slice().reverse(), t0].map((t) => at(t, b, s, fluteF(b, s)));
  const arc = (t: number, from: number, to: number) => {
    const steps = Math.max(3, Math.ceil((Math.abs(to - from) / FLUTE) * 8));
    return Array.from({ length: steps + 1 }, (_, i) => {
      const th = from + ((to - from) * i) / steps;
      return at(t, th, s, fluteF(th, s));
    });
  };
  const hem = arc(t1, a, b);
  const top = arc(t0, b, a);
  return `${smoothPath(down)} ${smoothPath(hem, false)} ${smoothPath(up, false)} ${smoothPath(top, false)} Z`;
};

// Choli: a cropped blouse with elbow sleeves and a sweetheart neck.
const CHOLI = symPath(
  [400, 92],
  [
    [
      [380, 92],
      [360, 94],
      [346, 98],
    ],
    [
      [322, 106],
      [298, 116],
      [276, 124],
    ],
    [
      [270, 160],
      [276, 196],
      [288, 220],
    ],
    [
      [292, 252],
      [294, 290],
      [296, 326],
    ],
    [
      [330, 336],
      [372, 342],
      [400, 342],
    ],
  ],
);
const CHOLI_HEM = "M 296 326 C 330 336 372 342 400 342 C 428 342 470 336 504 326";
const SLEEVE =
  "M 276 124 C 258 128 246 146 242 172 C 238 220 236 262 234 298 L 298 310 " +
  "C 298 282 296 250 290 222 C 284 190 278 158 276 124 Z";
const CUFF = "M 228 296 L 304 312";
const INSIDE =
  "M 346 98 C 360 94 380 92 400 92 C 420 92 440 94 454 98 " +
  "C 452 150 428 190 400 190 C 372 190 348 150 346 98 Z";
const NECKLINE = "M 346 98 C 348 150 372 190 400 190 C 428 190 452 150 454 98";

/** A small mirror, foreshortened by how far round the skirt it sits. */
const Mirror: React.FC<{ x: number; y: number; r: number; squash: number; p: number }> = ({
  x,
  y,
  r,
  squash,
  p,
}) => {
  const s = popScale(p);
  if (s <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * squash} ${s})`}>
      <circle r={r} fill={fd.saffron} />
      <circle r={r * 0.64} fill={mix(fd.chalk, fd.chambray, 0.3)} />
      <circle cx={-r * 0.2} cy={-r * 0.22} r={r * 0.22} fill={fd.surface} />
    </g>
  );
};

/** A four-point glint for mirrors catching the light. */
const glint = (r: number) =>
  `M 0 ${-r} C ${r * 0.12} ${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${r} 0 ` +
  `C ${r * 0.12} ${r * 0.12} ${r * 0.12} ${r * 0.12} 0 ${r} ` +
  `C ${-r * 0.12} ${r * 0.12} ${-r * 0.12} ${r * 0.12} ${-r} 0 ` +
  `C ${-r * 0.12} ${-r * 0.12} ${-r * 0.12} ${-r * 0.12} 0 ${-r} Z`;

export const Lehenga: React.FC<GarmentProps> = ({ id, colour, settle, bloom, idle }) => {
  const t = tones(colour);
  const gold = fd.saffron;
  // The skirt opens and turns as it lands, then sways a little.
  const s: Surface = {
    flare: 0.8 + 0.2 * settle,
    phase: (1 - settle) * 1.1 + Math.sin(idle * 1.6) * 0.035,
  };
  const bounds = boundaries(s);
  const panels = bounds.slice(0, -1).map((b, i) => ({ a: b.th, b: bounds[i + 1].th, i }));
  // Light comes from the upper left, so flutes facing left are brighter.
  const light = (th: number) => Math.cos(th - 2.3);
  const toneAt = (base: string, th: number, half: 0 | 1) => {
    const l = light(th) + (half ? 0.35 : -0.35);
    return l >= 0 ? mix(base, fd.chalk, 0.13 * l) : mix(base, fd.ink, -0.2 * l);
  };

  const trim = tween(bloom, [0, 0.4], [0, 1], ease.inOutSoft);
  const borderP = remap(bloom, 0.05, 0.55);
  const mirrorsP = remap(bloom, 0.15, 1);

  // Mirror work: rows of mirrors on the crests, half-dropped row to row.
  const rows = [0.15, 0.3, 0.45, 0.6, 0.73];
  const mirrors = rows.flatMap((rt, r) => {
    const out: {
      key: string;
      x: number;
      y: number;
      r: number;
      squash: number;
      p: number;
      th: number;
    }[] = [];
    const first = Math.ceil((0.18 - s.phase) / FLUTE) - 1;
    for (let j = first; ; j++) {
      const th = s.phase + (j + 0.5 + (r % 2) * 0.5) * FLUTE;
      if (th > Math.PI - 0.18) break;
      if (th < 0.18) continue;
      const [x, y] = at(rt, th, s, fluteF(th, s));
      const delay = rt * 0.55 + Math.abs(th - Math.PI / 2) * 0.12;
      out.push({
        key: `${r}:${j}`,
        x,
        y,
        r: 5 + rt * 6,
        squash: Math.max(0.25, Math.sin(th)),
        p: remap(mirrorsP, delay, delay + 0.3),
        th,
      });
    }
    return out;
  });
  const borderMirrors = panels
    .filter(({ a, b }) => b - a > FLUTE * 0.45)
    .map(({ a, b, i }) => {
      const th = (a + b) / 2;
      const [x, y] = at((SK.border + 1) / 2 + 0.01, th, s, 0.5);
      const delay = Math.abs(th - Math.PI / 2) * 0.25;
      return {
        key: `b${i}`,
        x,
        y,
        th,
        squash: Math.max(0.25, Math.sin(th)),
        p: remap(borderP, delay, delay + 0.4),
      };
    });
  // A glint sweeps across the mirrors once they are all in.
  const sweep = tween(idle, [1.05, 1.75], [Math.PI + 0.4, -0.4], ease.inOutSoft);

  const sleeve = (
    <>
      <path d={SLEEVE} fill={t.base} />
      <path
        d="M 290 222 C 296 250 298 282 298 312 L 282 309 C 284 280 284 250 280 226 Z"
        fill={t.shadow}
        opacity={0.6}
      />
      <path
        d={CUFF}
        stroke={gold}
        strokeWidth={22}
        strokeDasharray={evolvePath(trim, CUFF).strokeDasharray}
        strokeDashoffset={evolvePath(trim, CUFF).strokeDashoffset}
        clipPath={`url(#${id}-sleeve)`}
      />
      <path
        d="M 276 124 C 278 158 284 190 290 222"
        fill="none"
        stroke={t.line}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </>
  );

  // Latkans: tassels on the drawstring at the left hip, swinging after the drop.
  const swing = (1 - settle) * 16 + Math.sin(idle * 2.4) * 3.5;
  const hip = at(0, Math.PI * 0.86, s);

  return (
    <g>
      <defs>
        <clipPath id={`${id}-sleeve`}>
          <path d={SLEEVE} />
        </clipPath>
      </defs>

      {/* Skirt: a dark underlay so the panel seams read as folds, then the flutes. */}
      <path d={insidePath(s)} fill={t.deep} />
      {panels.map(({ a, b, i }) => {
        const m = (a + b) / 2;
        return (
          <g key={`p${i}`}>
            <path d={panelPath(a, m, 0, 1, s)} fill={toneAt(t.base, m, 0)} />
            <path d={panelPath(m, b, 0, 1, s)} fill={toneAt(t.base, m, 1)} />
          </g>
        );
      })}
      {/* Zari border: laid from the gota line down to the hem, centre front first. */}
      {panels.map(({ a, b, i }) => {
        const m = (a + b) / 2;
        const delay = Math.abs(m - Math.PI / 2) * 0.22;
        const p = ease.out(remap(borderP, delay, delay + 0.4));
        if (p <= 0) return null;
        const t1 = SK.border + (1 - SK.border) * p;
        return (
          <g key={`z${i}`}>
            <path d={panelPath(a, m, SK.border, t1, s)} fill={toneAt(gold, m, 0)} />
            <path d={panelPath(m, b, SK.border, t1, s)} fill={toneAt(gold, m, 1)} />
          </g>
        );
      })}
      {/* Gota: a fine line above the border, drawn on with the trims. */}
      {panels.map(({ a, b, i }) => {
        const pts = Array.from({ length: 7 }, (_, k) => {
          const th = a + ((b - a) * k) / 6;
          return at(SK.gota, th, s, fluteF(th, s));
        });
        return (
          <path
            key={`g${i}`}
            d={smoothPath(pts)}
            fill="none"
            stroke={gold}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={tween(
              trim,
              [0.3 + (i / panels.length) * 0.5, 0.5 + (i / panels.length) * 0.5],
              [0, 1],
              ease.out,
            )}
          />
        );
      })}
      {borderMirrors.map((m) => (
        <Mirror key={m.key} x={m.x} y={m.y} r={11} squash={m.squash} p={m.p} />
      ))}
      {mirrors.map((m) => (
        <Mirror key={m.key} x={m.x} y={m.y} r={m.r} squash={m.squash} p={m.p} />
      ))}
      {mirrors.map((m) => {
        const g = Math.max(0, 1 - Math.abs(m.th - sweep) / 0.22);
        return g > 0.02 ? (
          <path
            key={`gl${m.key}`}
            d={glint(m.r * 2.6 * g)}
            transform={`translate(${m.x} ${m.y})`}
            fill={fd.surface}
            opacity={g}
          />
        ) : null;
      })}

      {/* Waistband, with the inside back showing above it. */}
      <path
        d={`${smoothPath(Array.from({ length: 13 }, (_, k) => at(0, Math.PI - (Math.PI * k) / 12, s)).map(([x, y]) => [x, y - 24] as Pt))} ${smoothPath(
          Array.from({ length: 13 }, (_, k) => at(0, (Math.PI * k) / 12, s)).map(
            ([x, y]) => [x, y - 24 - 2 * (y - SK.y0)] as Pt,
          ),
          false,
        )} Z`}
        fill={t.deep}
      />
      <path
        d={`${smoothPath(Array.from({ length: 13 }, (_, k) => at(0, Math.PI - (Math.PI * k) / 12, s)).map(([x, y]) => [x, y - 24] as Pt))} ${smoothPath(
          Array.from({ length: 13 }, (_, k) => at(0, (Math.PI * k) / 12, s)).map(
            ([x, y]) => [x, y + 2] as Pt,
          ),
          false,
        )} Z`}
        fill={gold}
      />
      {Array.from({ length: 9 }, (_, k) => {
        const th = Math.PI * (0.1 + (0.8 * k) / 8);
        const [x, y] = at(0, th, s);
        return (
          <Mirror
            key={`w${th}`}
            x={x}
            y={y - 11}
            r={6}
            squash={Math.max(0.3, Math.sin(th))}
            p={remap(trim, 0.2 + k * 0.06, 0.5 + k * 0.06)}
          />
        );
      })}

      {/* Latkans */}
      <g transform={`translate(${hip[0]} ${hip[1]}) rotate(${swing})`}>
        {[
          { dx: -6, len: 150 },
          { dx: 8, len: 190 },
        ].map(({ dx, len }) => (
          <g key={len}>
            <path
              d={`M 0 0 C ${dx} ${len * 0.4} ${dx} ${len * 0.7} ${dx} ${len}`}
              stroke={gold}
              strokeWidth={3}
              fill="none"
            />
            <circle cx={dx} cy={len - 8} r={6} fill={fd.chalk} />
            <path
              d={`M ${dx - 9} ${len} L ${dx + 9} ${len} L ${dx + 5} ${len + 34} L ${dx - 5} ${len + 34} Z`}
              fill={gold}
            />
            <path
              d={`M ${dx} ${len + 4} L ${dx} ${len + 32}`}
              stroke={mix(gold, fd.ink, 0.3)}
              strokeWidth={2}
            />
          </g>
        ))}
      </g>

      {/* Choli */}
      <path d={CHOLI} fill={t.base} />
      <path
        d="M 296 326 C 292 300 290 262 288 236 C 300 270 306 300 312 330 Z"
        fill={t.shadow}
        opacity={0.5}
      />
      <path
        d="M 504 326 C 508 300 510 262 512 236 C 500 270 494 300 488 330 Z"
        fill={t.shadow}
        opacity={0.5}
      />
      <path
        d="M 352 337 C 352 318 354 296 358 272 M 448 337 C 448 318 446 296 442 272"
        stroke={t.line}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
      />
      <path d={INSIDE} fill={t.deep} />
      {[CHOLI_HEM, NECKLINE].map((d) => {
        const e = evolvePath(trim, d);
        return (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={gold}
            strokeWidth={13}
            strokeLinecap="round"
            strokeDasharray={e.strokeDasharray}
            strokeDashoffset={e.strokeDashoffset}
          />
        );
      })}
      {sleeve}
      <g transform={mirrorX()}>{sleeve}</g>
    </g>
  );
};
