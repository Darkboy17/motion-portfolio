// Four shirting cloths as SVG patterns, drawn in code. Tiles are in shirt
// units, so the weave rotates and scales with each piece: stripes follow the
// grain down a sleeve and along a collar, as they would on a cut shirt.
import React from "react";
import { palettes } from "../../kit";
import type { FabricId } from "./timeline";

const c = palettes.atelier;

export const FABRICS: Record<FabricId, { name: string; spec: string }> = {
  oxford: { name: "Oxford", spec: "Basket weave · white" },
  chambray: { name: "Chambray", spec: "Indigo warp · white weft" },
  bengal: { name: "Bengal stripe", spec: "Even stripe · yarn-dyed" },
  gingham: { name: "Gingham", spec: "Two-colour check" },
};

export const fabricUrl = (prefix: string, id: FabricId) => `url(#${prefix}-${id})`;

const thread = { strokeLinecap: "round" as const, fill: "none" };

/** Pattern definitions. Render once inside each <svg> that uses them. */
export const FabricDefs: React.FC<{ prefix: string }> = ({ prefix }) => (
  <>
    {/* Oxford: pairs of yarns alternating direction, a 2x2 basket. */}
    <pattern id={`${prefix}-oxford`} patternUnits="userSpaceOnUse" width={8} height={8}>
      <rect width={8} height={8} fill={c.chalk} />
      <path
        d="M0.6 1.4 H3.4 M0.6 2.8 H3.4 M5.2 0.6 V3.4 M6.6 0.6 V3.4 M1.2 4.6 V7.4 M2.6 4.6 V7.4 M4.6 5.4 H7.4 M4.6 6.8 H7.4"
        stroke={c.inkSoft}
        strokeOpacity={0.13}
        strokeWidth={0.8}
        {...thread}
      />
    </pattern>
    {/* Chambray: indigo warp, white weft, a soft heather. */}
    <pattern id={`${prefix}-chambray`} patternUnits="userSpaceOnUse" width={6} height={6}>
      <rect width={6} height={6} fill={c.chambray} />
      <path
        d="M0 1.5 H6 M0 4.5 H6"
        stroke={c.chalk}
        strokeOpacity={0.2}
        strokeWidth={0.9}
        {...thread}
      />
      <path
        d="M1.5 0 V6 M4.5 0 V6"
        stroke={c.indigo}
        strokeOpacity={0.16}
        strokeWidth={0.9}
        {...thread}
      />
      <path d="M0 6 L6 0" stroke={c.indigo} strokeOpacity={0.08} strokeWidth={0.6} {...thread} />
    </pattern>
    {/* Bengal stripe: bold stripes of equal width, coloured and white. */}
    <pattern id={`${prefix}-bengal`} patternUnits="userSpaceOnUse" width={14} height={14}>
      <rect width={14} height={14} fill={c.chalk} />
      <rect x={0} width={7} height={14} fill={c.saffron} fillOpacity={0.78} />
      <path d="M7.6 0 V14 M13.4 0 V14" stroke={c.saffron} strokeOpacity={0.25} strokeWidth={0.5} />
    </pattern>
    {/* Gingham: the same stripe both ways; where they cross, the colour doubles. */}
    <pattern id={`${prefix}-gingham`} patternUnits="userSpaceOnUse" width={14} height={14}>
      <rect width={14} height={14} fill={c.chalk} />
      <rect x={0} width={7} height={14} fill={c.indigo} fillOpacity={0.42} />
      <rect y={0} width={14} height={7} fill={c.indigo} fillOpacity={0.42} />
    </pattern>
  </>
);
