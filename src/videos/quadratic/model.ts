// Everything the quadratic explainer shows, computed from three inputs.
import { z } from "zod";
import {
  discriminant,
  evalQuadratic,
  fmt,
  niceTicks,
  projectile,
  signed,
  solveQuadratic,
  vertex,
} from "../../kit/math";

export const quadraticSchema = z.object({
  launchSpeed: z.number().min(11).max(19).step(0.5).describe("Upward launch speed, m/s"),
  startHeight: z.number().min(1).max(4).step(0.5).describe("Launch height, m"),
  ledgeHeight: z.number().min(6).max(30).step(0.5).describe("Ledge the ball tries to reach, m"),
});
export type QuadraticProps = z.infer<typeof quadraticSchema>;
export const quadraticDefaults: QuadraticProps = {
  launchSpeed: 15,
  startHeight: 2,
  ledgeHeight: 15,
};

export const buildModel = (p: QuadraticProps) => {
  const q = projectile(p.launchSpeed, p.startHeight);
  const [before, landing] = solveQuadratic(q);
  const peak = vertex(q);
  const ledge = { ...q, c: q.c - p.ledgeHeight };
  const dLand = discriminant(q);
  const dLedge = discriminant(ledge);
  const hTicks = niceTicks(0, Math.max(peak.y, p.ledgeHeight) * 1.12 + 0.5, 6);
  const hMax = hTicks[hTicks.length - 1];
  const tMax = Math.ceil(landing + 0.4);
  const fourAC = 4 * q.a * q.c;
  const fourACLedge = 4 * ledge.a * ledge.c;
  return {
    q,
    h: (t: number) => evalQuadratic(q, t),
    before,
    landing,
    peak,
    ledge,
    dLand,
    dLedge,
    reaches: dLedge >= 0,
    /** Height still missing at the peak, if any. */
    shortBy: p.ledgeHeight - peak.y,
    t: {
      range: [-0.7, tMax + 0.2] as [number, number],
      ticks: Array.from({ length: tMax + 1 }, (_, i) => i),
    },
    hAxis: { range: [0, hMax] as [number, number], ticks: hTicks },
    text: {
      a: signed(q.a),
      b: fmt(q.b),
      c: fmt(q.c),
      twoA: signed(2 * q.a),
      negB: signed(-q.b),
      bSq: fmt(q.b * q.b),
      fourAC: fmt(Math.abs(fourAC)),
      fourACOp: fourAC < 0 ? "+" : "−",
      dLand: fmt(dLand),
      sqrtDLand: fmt(Math.sqrt(dLand), 2),
      landing: fmt(landing, 2),
      before: signed(before, 2),
      peakT: fmt(peak.x, 2),
      peakH: fmt(peak.y, 2),
      ledgeH: fmt(p.ledgeHeight),
      ledgeC: signed(ledge.c),
      ledgeCAbs: fmt(Math.abs(ledge.c)),
      ledgeCOp: ledge.c < 0 ? "−" : "+",
      fourACLedge: fmt(Math.abs(fourACLedge)),
      fourACLedgeOp: fourACLedge < 0 ? "+" : "−",
      dLedge: signed(dLedge),
      shortBy: fmt(Math.abs(p.ledgeHeight - peak.y), 2),
      g: fmt(-2 * q.a),
    },
  };
};

export type Model = ReturnType<typeof buildModel>;
