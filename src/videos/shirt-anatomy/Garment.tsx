// The garment layer, on screen for the whole piece. Every piece moves through
// the same track of poses: assembled in the flat, laid out on the sheet,
// shrunk into the corner, then sewn back into the shirt. Each move is a spring
// between two layouts, so nothing here is hand-keyed per piece.
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DrawPath, breathe, ease, palettes, springs, tween, useSec } from "../../kit";
import type { SpringName } from "../../kit";
import { UNITS_PER_CM, lerp, lerpPoly, polyD } from "./geometry";
import type { Pt } from "./geometry";
import { FabricDefs, fabricUrl } from "./fabrics";
import { DIMS, FRAME, MINI, SHEET, SHEET_BOUNDS, SHEET_POS, SHIRT } from "./layout";
import {
  Button,
  Dimension,
  DrillHole,
  GrainLine,
  Notch,
  PieceLabel,
  StitchPath,
  labelGap,
} from "./marks";
import { PIECES } from "./pieces";
import type { Piece, PieceId } from "./pieces";
import { STEPS, STITCH, SWAPS, T, WIPE, stepAt } from "./timeline";
import type { FabricId } from "./timeline";

const c = palettes.atelier;
const ID = "shirt";
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

type Pose = { x: number; y: number; rotate: number; scale: number };
const lerpPose = (a: Pose, b: Pose, t: number): Pose => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  rotate: lerp(a.rotate, b.rotate, t),
  scale: lerp(a.scale, b.scale, t),
});
const transformOf = (p: Pose) => `translate(${p.x} ${p.y}) rotate(${p.rotate}) scale(${p.scale})`;

/** Buttons in the order they pop: collar stand, down the placket, collar points, cuffs. */
const BUTTON_ORDER: { piece: PieceId; index: number }[] = [
  { piece: "stand", index: 0 },
  ...Array.from({ length: 7 }, (_, index) => ({ piece: "frontR" as PieceId, index })),
  { piece: "collar", index: 0 },
  { piece: "collar", index: 1 },
  { piece: "cuffL", index: 0 },
  { piece: "cuffR", index: 0 },
];
export const BUTTON_STEP = 0.14;
export const buttonTimes = BUTTON_ORDER.map((_, i) => T.buttons + i * BUTTON_STEP);

/** Pieces in the order they leave the sheet within their step. */
const stepOffset = (p: Piece) => {
  const same = PIECES.filter((q) => q.step === p.step);
  return same.indexOf(p) * 0.1;
};

/** When each piece lands on the sheet, for the counter and its marks. */
export const LANDING = 1;
export const landingTime = (p: Piece) => T.explode + p.explodeDelay + LANDING;

/** Which fabric is on the shirt, and the one wiping across it during a swap. */
const fabricAt = (t: number) => {
  let base: FabricId = "oxford";
  let next: FabricId | null = null;
  let wipe = 0;
  for (const swap of SWAPS.slice(1)) {
    if (t >= swap.at + WIPE) base = swap.fabric;
    else if (t >= swap.at) {
      next = swap.fabric;
      wipe = tween(t, [swap.at, swap.at + WIPE], [0, 1], ease.inOutSoft);
    }
  }
  return { base, next, wipe };
};

export const Garment: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const t = frame / fps;

  const springAt = (startSec: number, preset: SpringName) =>
    spring({ frame: frame - sec(startSec), fps, config: springs[preset] });
  const exitAt = (startSec: number, dur = 0.3) =>
    tween(frame, [sec(startSec), sec(startSec + dur)], [0, 1], ease.in);

  // The whole flat floats a little while it's held.
  const float: Pt = { x: 0, y: breathe(frame, 150, 3) };

  const assembled = (p: Piece): Pose => ({
    x: SHIRT.x + p.pose.x * SHIRT.scale + float.x,
    y: SHIRT.y + p.pose.y * SHIRT.scale + float.y,
    rotate: p.pose.rotate,
    scale: SHIRT.scale,
  });

  const fill = tween(frame, [sec(T.fill), sec(T.fill + 0.9)], [0, 1], ease.inOutSoft);
  const fabric = fabricAt(t);
  const preExplode = t < T.explode;
  const gridIn = tween(frame, [sec(T.explode + 0.4), sec(T.explode + 1.2)], [0, 1], ease.out);
  const gridOut = exitAt(T.gather, 0.4);

  const states = PIECES.map((p, i) => {
    const sheetDrift = t < T.gather ? breathe(frame + i * 23, 130, 1.6) : 0;
    const A = assembled(p);
    const S: Pose = {
      ...SHEET_POS[p.id],
      y: SHEET_POS[p.id].y + sheetDrift,
      rotate: 0,
      scale: SHEET.scale,
    };
    // The first step's pieces fly home straight from the sheet; the rest wait in the tray.
    const first = p.step === STEPS[0].id;
    const mini = MINI.map(SHEET_POS[p.id]);
    const M: Pose = first
      ? S
      : { x: mini.x, y: mini.y, rotate: 0, scale: SHEET.scale * MINI.scale };

    const p1 = springAt(T.explode + p.explodeDelay, "smooth");
    const p2 = springAt(T.gather + 0.15 + i * 0.02, "smooth");
    const p3 = springAt(stepAt(p.step) + stepOffset(p), "snappy");

    // Chain the three moves; each spring takes over where the last one left off.
    let pose = A;
    pose = lerpPose(pose, S, p1);
    pose = {
      ...pose,
      x: pose.x + (M.x - S.x) * p2,
      y: pose.y + (M.y - S.y) * p2,
      scale: pose.scale + (M.scale - S.scale) * p2,
    };
    pose = {
      x: pose.x + (A.x - M.x) * p3,
      y: pose.y + (A.y - M.y) * p3,
      rotate: pose.rotate + (A.rotate - 0) * p3,
      scale: pose.scale + (A.scale - M.scale) * p3,
    };
    // Each flight bows upwards a little, as if the piece were lifted off the table.
    // The flight home stays low, so it never crosses the step list.
    const lift = Math.max(
      Math.sin(Math.PI * clamp01(p1)) * (1 - clamp01(p2)),
      Math.sin(Math.PI * clamp01(p3)) * 0.3,
    );
    pose = { ...pose, y: pose.y - lift * 36, scale: pose.scale * (1 + lift * 0.04) };

    const morph = clamp01(clamp01(p1) - clamp01(p3));
    return { p, pose, morph, lift, index: i };
  });

  const landed = (p: Piece) => landingTime(p);
  const marksOut = exitAt(T.gather);

  return (
    <svg
      width={FRAME.width}
      height={FRAME.height}
      viewBox={`0 0 ${FRAME.width} ${FRAME.height}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <defs>
        <FabricDefs prefix={ID} />
        <filter id={`${ID}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <linearGradient
          id={`${ID}-fillgrad`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          x2={0}
          y1={lerp(SHIRT.top - 80, SHIRT.bottom + 80, fill) - 60}
          y2={lerp(SHIRT.top - 80, SHIRT.bottom + 80, fill) + 60}
        >
          <stop offset={0} stopColor="white" />
          <stop offset={1} stopColor="black" />
        </linearGradient>
        <mask
          id={`${ID}-fillwipe`}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={FRAME.width}
          height={FRAME.height}
        >
          <rect width={FRAME.width} height={FRAME.height} fill={`url(#${ID}-fillgrad)`} />
        </mask>
        {/* The new cloth sweeps across on a slight bias, with a narrow soft edge. */}
        <linearGradient
          id={`${ID}-swapgrad`}
          gradientUnits="userSpaceOnUse"
          x1={lerp(SHIRT.left - 160, SHIRT.right + 160, fabric.wipe) - 16}
          x2={lerp(SHIRT.left - 160, SHIRT.right + 160, fabric.wipe) + 16}
          y1={0}
          y2={0}
          gradientTransform={`rotate(-14 ${lerp(SHIRT.left - 160, SHIRT.right + 160, fabric.wipe)} ${(SHIRT.top + SHIRT.bottom) / 2})`}
        >
          <stop offset={0} stopColor="white" />
          <stop offset={1} stopColor="black" />
        </linearGradient>
        <mask
          id={`${ID}-swap`}
          maskUnits="userSpaceOnUse"
          x={0}
          y={0}
          width={FRAME.width}
          height={FRAME.height}
        >
          <rect width={FRAME.width} height={FRAME.height} fill={`url(#${ID}-swapgrad)`} />
        </mask>
        {/* Until the fill lands, a piece's lines are masked by the pieces above it. */}
        {preExplode
          ? states.map(({ p }) => (
              <mask
                key={p.id}
                id={`${ID}-occl-${p.id}`}
                maskUnits="userSpaceOnUse"
                x={0}
                y={0}
                width={FRAME.width}
                height={FRAME.height}
              >
                <rect width={FRAME.width} height={FRAME.height} fill="white" />
                {states
                  .filter((o) => o.p.z > p.z && !o.p.hidden)
                  .map((o) => (
                    <path
                      key={o.p.id}
                      d={o.p.morphs ? polyD(o.p.flatPoly) : o.p.flatD}
                      transform={transformOf(o.pose)}
                      fill="black"
                      // A thin white rim keeps shared edges whole under the mask.
                      stroke="white"
                      strokeWidth={2.4}
                    />
                  ))}
              </mask>
            ))
          : null}
        <pattern
          id={`${ID}-grid`}
          patternUnits="userSpaceOnUse"
          width={40 * SHEET.scale}
          height={40 * SHEET.scale}
          x={SHEET_BOUNDS.x0}
          y={SHEET_BOUNDS.y1}
        >
          <path
            d={`M ${40 * SHEET.scale} 0 L 0 0 0 ${40 * SHEET.scale}`}
            fill="none"
            stroke={c.line}
            strokeWidth={1}
          />
        </pattern>
        <radialGradient id={`${ID}-gridfade`} cx="50%" cy="58%" r="62%">
          <stop offset="55%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <mask id={`${ID}-gridmask`}>
          <rect width={FRAME.width} height={FRAME.height} fill={`url(#${ID}-gridfade)`} />
        </mask>
      </defs>

      {/* Cutting-mat grid, 5 cm squares, under the sheet. */}
      {gridIn > 0 && gridOut < 1 ? (
        <rect
          width={FRAME.width}
          height={FRAME.height}
          fill={`url(#${ID}-grid)`}
          mask={`url(#${ID}-gridmask)`}
          opacity={0.75 * gridIn * (1 - gridOut)}
        />
      ) : null}

      {states.map((s) => (
        <PieceView
          key={s.p.id}
          s={s}
          t={t}
          frame={frame}
          sec={sec}
          fill={fill}
          fabric={fabric}
          occluded={preExplode}
          springAt={springAt}
          exitAt={exitAt}
          landedAt={landed(s.p)}
          marksOut={marksOut}
        />
      ))}
    </svg>
  );
};

type PieceViewProps = {
  s: { p: Piece; pose: Pose; morph: number; lift: number; index: number };
  t: number;
  frame: number;
  sec: (s: number) => number;
  fill: number;
  fabric: { base: FabricId; next: FabricId | null; wipe: number };
  occluded: boolean;
  springAt: (startSec: number, preset: SpringName) => number;
  exitAt: (startSec: number, dur?: number) => number;
  landedAt: number;
  marksOut: number;
};

const PieceView: React.FC<PieceViewProps> = ({
  s,
  t,
  frame,
  sec,
  fill,
  fabric,
  occluded,
  springAt,
  exitAt,
  landedAt,
  marksOut,
}) => {
  const { p, pose, morph, lift } = s;
  if (p.hidden && t < T.explode) return null;

  const px = 1 / pose.scale;
  const poly = p.morphs ? lerpPoly(p.flatPoly, p.patternPoly, morph) : null;
  const d = poly ? polyD(poly) : p.flatD;
  const shift = p.fillShift;
  const fillD = poly
    ? polyD(poly.map((q) => ({ x: q.x + shift.x, y: q.y + shift.y })))
    : p.flatFillD;
  const transform = transformOf(pose);
  const draw = p.hidden
    ? 1
    : tween(
        frame,
        [sec(T.draw + p.draw.at), sec(T.draw + p.draw.at + p.draw.dur)],
        [0, 1],
        ease.inOutSoft,
      );
  const detailDraw = p.hidden
    ? 1
    : tween(
        frame,
        [sec(T.draw + p.draw.at + p.draw.dur * 0.7), sec(T.draw + p.draw.at + p.draw.dur + 0.4)],
        [0, 1],
        ease.inOutSoft,
      );
  const flatOnly = clamp01(1 - morph * 4);

  // Pattern marks arrive once the piece has landed, and leave before the sheet shrinks.
  const marksIn = springAt(landedAt, "smooth");
  const grain = tween(frame, [sec(landedAt + 0.15), sec(landedAt + 0.75)], [0, 1], ease.inOutSoft);
  const notch = tween(frame, [sec(landedAt + 0.35), sec(landedAt + 0.65)], [0, 1], ease.out);
  const marks = (v: number) => v * (1 - marksOut);
  const allowanceAt = T.allowance + s.index * 0.12;
  const allowance = tween(
    frame,
    [sec(allowanceAt), sec(allowanceAt + 0.7)],
    [0, 1],
    ease.inOutSoft,
  );

  const shadowOpacity = 0.1 * fill + 0.1 * lift;
  const shadowDrop = 4 + lift * 16;

  const fillPath = (fab: FabricId) => (
    <g transform={`translate(${-shift.x} ${-shift.y})`}>
      <path d={fillD} fill={fabricUrl(ID, fab)} />
    </g>
  );

  return (
    <g>
      {fill > 0 ? (
        <g transform={`translate(0 ${shadowDrop}) ${transform}`} opacity={shadowOpacity}>
          <path d={d} fill={c.ink} filter={`url(#${ID}-soft)`} />
        </g>
      ) : null}
      {fill > 0 ? (
        <g mask={fill < 1 ? `url(#${ID}-fillwipe)` : undefined}>
          <g transform={transform}>{fillPath(fabric.base)}</g>
        </g>
      ) : null}
      {fabric.next ? (
        <g mask={`url(#${ID}-swap)`}>
          <g transform={transform}>{fillPath(fabric.next)}</g>
        </g>
      ) : null}
      <g mask={occluded ? `url(#${ID}-occl-${p.id})` : undefined}>
        <g transform={transform}>
          {p.details.map((det, i) => {
            const vis = det.phase === "flat" ? flatOnly : 1;
            if (vis <= 0) return null;
            if (det.kind === "shade") {
              return <path key={i} d={det.d} fill={c.ink} opacity={0.11 * fill * vis} />;
            }
            if (det.kind === "tag") {
              return (
                <path
                  key={i}
                  d={det.d}
                  fill={c.surface}
                  stroke={c.inkMute}
                  strokeWidth={1 * px}
                  opacity={fill * vis}
                />
              );
            }
            return (
              <g key={i} opacity={vis}>
                <DrawPath d={det.d} progress={detailDraw} stroke={c.ink} width={1.3 * px} />
              </g>
            );
          })}
          <DrawPath d={d} progress={draw} stroke={c.ink} width={2.2 * px} />

          {p.stitches.map((st, i) => {
            const at = stepAt(st.step) + STITCH.delay;
            const prog = tween(frame, [sec(at), sec(at + STITCH.dur)], [0, 1], ease.inOutSoft);
            return (
              <StitchPath
                key={i}
                d={st.d}
                length={st.length}
                progress={prog * flatOnly}
                px={px}
                opacity={flatOnly}
              />
            );
          })}

          {/* Pattern marks */}
          {t >= landedAt && t < T.gather + 0.4 ? (
            <g>
              <path
                d={p.seamAllowanceD}
                fill="none"
                stroke={c.inkSoft}
                strokeWidth={1.1 * px}
                strokeDasharray={`${6 * px} ${4 * px}`}
                opacity={marks(allowance) * 0.9}
                style={{ display: allowance > 0 ? undefined : "none" }}
              />
              <GrainLine
                from={p.grain.from}
                to={p.grain.to}
                progress={marks(grain)}
                px={px}
                gap={labelGap(p.label.size, p.no, p.name, p.cut)}
              />
              {p.notches.map((n, i) => (
                <Notch
                  key={i}
                  outline={p.pattern}
                  seg={n.seg}
                  t={n.t}
                  count={n.count}
                  progress={marks(notch)}
                  px={px}
                />
              ))}
              {p.drills.map((q, i) => (
                <DrillHole key={i} at={q} progress={marks(notch)} px={px} />
              ))}
              <PieceLabel
                at={p.label.at}
                no={p.no}
                name={p.name}
                cut={p.cut}
                size={p.label.size}
                progress={marks(marksIn)}
                px={px}
              />
              {DIMS.map((dim, i) =>
                dim.piece === p.id ? (
                  <Dimension
                    key={dim.label}
                    from={dim.from}
                    to={dim.to}
                    offset={dim.offset}
                    label={dim.label}
                    value={Math.round(
                      Math.hypot(dim.to.x - dim.from.x, dim.to.y - dim.from.y) / UNITS_PER_CM,
                    )}
                    unit="cm"
                    progress={tween(
                      frame,
                      [sec(T.measure + i * 0.75), sec(T.measure + i * 0.75 + 1.1)],
                      [0, 1],
                      ease.out,
                    )}
                    exit={marksOut}
                    px={px}
                  />
                ) : null,
              )}
            </g>
          ) : null}

          {p.buttons.map((b, i) => {
            const order = BUTTON_ORDER.findIndex((o) => o.piece === p.id && o.index === i);
            const popIn = springAt(T.buttons + order * BUTTON_STEP, "bouncy");
            const out = exitAt(T.explode - 0.3, 0.2);
            const back = springAt(T.complete - 0.45 + order * 0.05, "bouncy");
            const v = t < T.explode ? popIn * (1 - out) : back;
            return <Button key={i} at={b} progress={v} px={px} />;
          })}
        </g>
      </g>
    </g>
  );
};
