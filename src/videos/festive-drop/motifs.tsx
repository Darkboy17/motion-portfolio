// Procedural block-print motifs. Each motif is generated from a few numbers
// (a size, a petal count), so one function can print a border, a field or a
// swatch. MotifPattern repeats a motif as an SVG pattern with a half-drop,
// the way a block printer staggers the block on alternate columns.
import React from "react";

const n = (v: number) => Math.round(v * 100) / 100;
const polar = (r: number, a: number) => `${n(r * Math.cos(a))} ${n(r * Math.sin(a))}`;

/**
 * A buta (paisley), centred on its belly, `s` units wide and 1.4 s tall.
 * `k` < 1 gives an inner contour, scaled about the belly.
 */
export const butaPath = (s: number, k = 1): string => {
  const bx = 0.5;
  const by = 0.95;
  const P = (x: number, y: number) =>
    `${n((bx + (x - bx) * k - 0.5) * s)} ${n((by + (y - by) * k - 0.85) * s)}`;
  return [
    `M ${P(0.5, 1.4)}`,
    `C ${P(0.16, 1.4)} ${P(-0.02, 1.15)} ${P(0.03, 0.9)}`,
    `C ${P(0.08, 0.62)} ${P(0.24, 0.42)} ${P(0.42, 0.28)}`,
    `C ${P(0.56, 0.17)} ${P(0.72, 0.1)} ${P(0.84, 0)}`,
    `C ${P(0.86, 0.12)} ${P(0.78, 0.2)} ${P(0.76, 0.3)}`,
    `C ${P(0.74, 0.44)} ${P(1, 0.6)} ${P(0.99, 0.92)}`,
    `C ${P(0.98, 1.2)} ${P(0.8, 1.4)} ${P(0.5, 1.4)} Z`,
  ].join(" ");
};

/** A phool (flower) with `petals` teardrop petals of radius r, centred on 0,0. */
export const phoolPath = (r: number, petals = 8, rot = -Math.PI / 2): string => {
  let d = "";
  for (let i = 0; i < petals; i++) {
    const a = rot + (i / petals) * Math.PI * 2;
    const w = Math.PI / petals;
    d += `M 0 0 C ${polar(r * 0.62, a - w * 0.95)} ${polar(r * 1.04, a - w * 0.42)} ${polar(r, a)} `;
    d += `C ${polar(r * 1.04, a + w * 0.42)} ${polar(r * 0.62, a + w * 0.95)} 0 0 Z `;
  }
  return d.trim();
};

/** A ring of `count` dot centres at radius r. */
export const ringDots = (r: number, count: number, rot = 0) =>
  Array.from({ length: count }, (_, i) => {
    const a = rot + (i / count) * Math.PI * 2;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });

/** An ogee lattice (jaal) for one w x h pattern tile: two S-curves crossing. */
export const jaalPath = (w: number, h: number): string => {
  const s = (x0: number, x1: number) =>
    `M ${n(x0)} 0 C ${n(x0 + (x1 - x0) * 0.1)} ${n(h * 0.22)} ${n(x0 + (x1 - x0) * 0.5)} ${n(h * 0.28)} ${n(
      (x0 + x1) / 2,
    )} ${n(h / 2)} C ${n(x0 + (x1 - x0) * 0.5)} ${n(h * 0.72)} ${n(x0 + (x1 - x0) * 0.9)} ${n(h * 0.78)} ${n(
      x1,
    )} ${n(h)}`;
  return `${s(0, w)} ${s(w, 0)}`;
};

export type MotifName = "buta" | "phool" | "jaal" | "booti";

/** One motif, drawn at 0,0 in `color`, with an optional `accent` for its eye. */
export const Motif: React.FC<{
  name: Exclude<MotifName, "jaal">;
  size: number;
  color: string;
  accent?: string;
  rotate?: number;
}> = ({ name, size, color, accent, rotate = 0 }) => {
  if (name === "buta") {
    return (
      <g transform={`rotate(${rotate})`}>
        <path d={`${butaPath(size)} ${butaPath(size, 0.62)}`} fill={color} fillRule="evenodd" />
        <circle cx={0} cy={size * 0.12} r={size * 0.1} fill={accent ?? color} />
        <path
          d={phoolPath(size * 0.16, 5)}
          transform={`translate(0 ${-size * 0.16})`}
          fill={color}
        />
      </g>
    );
  }
  if (name === "phool") {
    return (
      <g transform={`rotate(${rotate})`}>
        <path d={phoolPath(size * 0.5, 8)} fill={color} />
        <circle r={size * 0.13} fill={accent ?? color} />
        {ringDots(size * 0.66, 8, Math.PI / 8 - Math.PI / 2).map((p) => (
          <circle key={`${p.x}:${p.y}`} cx={p.x} cy={p.y} r={size * 0.045} fill={color} />
        ))}
      </g>
    );
  }
  return (
    <g transform={`rotate(${rotate})`}>
      <path d={phoolPath(size * 0.36, 4, -Math.PI / 4)} fill={color} />
      <circle r={size * 0.08} fill={accent ?? color} />
      {ringDots(size * 0.48, 4, -Math.PI / 2).map((p) => (
        <circle key={`${p.x}:${p.y}`} cx={p.x} cy={p.y} r={size * 0.06} fill={color} />
      ))}
    </g>
  );
};

/**
 * Repeats a motif as an SVG pattern, half-dropped. Place it inside <defs> and
 * fill a shape with url(#id). `transform` drifts or scales the whole print.
 */
export const MotifPattern: React.FC<{
  id: string;
  motif: MotifName;
  /** Tile size in user units; each tile holds two motifs. */
  size: number;
  color: string;
  accent?: string;
  ground?: string;
  transform?: string;
}> = ({ id, motif, size, color, accent, ground, transform }) => {
  const w = size;
  const h = motif === "jaal" ? size * 1.5 : size;
  const m = size * 0.42;
  return (
    <pattern
      id={id}
      width={w}
      height={h}
      patternUnits="userSpaceOnUse"
      patternTransform={transform}
    >
      {ground ? <rect width={w} height={h} fill={ground} /> : null}
      {motif === "jaal" ? (
        <>
          <path d={jaalPath(w, h)} fill="none" stroke={color} strokeWidth={size * 0.035} />
          {[
            [w / 2, 0],
            [w / 2, h],
            [0, h / 2],
            [w, h / 2],
          ].map(([x, y]) => (
            <circle key={`${x}:${y}`} cx={x} cy={y} r={size * 0.05} fill={color} />
          ))}
          <g transform={`translate(${w / 2} ${h / 2})`}>
            <Motif name="booti" size={size * 0.34} color={accent ?? color} />
          </g>
          {[0, w].map((x) =>
            [0, h].map((y) => (
              <g key={`${x}:${y}`} transform={`translate(${x} ${y})`}>
                <Motif name="booti" size={size * 0.34} color={accent ?? color} />
              </g>
            )),
          )}
        </>
      ) : (
        [
          [w * 0.25, h * 0.25],
          [w * 0.75, h * 0.75],
        ].map(([x, y]) => (
          <g key={`${x}:${y}`} transform={`translate(${x} ${y})`}>
            <Motif
              name={motif}
              size={motif === "buta" ? m * 0.9 : m}
              color={color}
              accent={accent}
              rotate={motif === "buta" ? 18 : 0}
            />
          </g>
        ))
      )}
    </pattern>
  );
};
