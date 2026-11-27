// Colour helpers that derive new values from tokens, so pieces never need to
// invent a hex value for a shadow, a wash or an in-between shade.

const toRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** A token colour at a given opacity, as rgba(). */
export const alpha = (hex: string, a: number) => {
  const [r, g, b] = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

/** Mixes two #rrggbb tokens: t = 0 gives `from`, t = 1 gives `to`. Returns #rrggbb. */
export const mix = (from: string, to: string, t: number): string => {
  const p = toRgb(from);
  const q = toRgb(to);
  const k = Math.min(Math.max(t, 0), 1);
  return `#${p
    .map((v, i) =>
      Math.round(v + (q[i] - v) * k)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
};
