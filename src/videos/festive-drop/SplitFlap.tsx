// A split-flap board, as on an old station departures board. Each tile flips
// through a few seeded letters before landing on its own; the top flap falls
// away to show the next letter's top half, then the next bottom half swings
// down over the old one.
import React from "react";
import { random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { ease, fonts, springs, tween, useSec } from "../../kit";
import { fd, inkShadow, mix } from "./palette";

const GLYPHS = "ABCDEFGHJKLMNOPRSTUVWXYZ0123456789";

type TileStyle = { w: number; h: number; bg: string; fg: string; size: number };

const Half: React.FC<{
  ch: string;
  top: boolean;
  rotate?: number;
  s: TileStyle;
}> = ({ ch, top, rotate = 0, s }) => {
  const r = s.w * 0.1;
  // A flap darkens as it turns edge-on to us.
  const shade = Math.abs(Math.sin((rotate * Math.PI) / 180)) * 0.45;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        width: s.w,
        height: s.h / 2,
        top: top ? 0 : s.h / 2,
        overflow: "hidden",
        background: top ? mix(s.bg, fd.chalk, 0.07) : s.bg,
        borderRadius: top ? `${r}px ${r}px 0 0` : `0 0 ${r}px ${r}px`,
        transformOrigin: top ? "50% 100%" : "50% 0%",
        transform: `rotateX(${rotate}deg)`,
        backfaceVisibility: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          width: s.w,
          height: s.h,
          top: top ? 0 : -s.h / 2,
          lineHeight: `${s.h}px`,
          textAlign: "center",
          fontFamily: fonts.serif,
          fontWeight: 600,
          fontSize: s.size,
          color: s.fg,
        }}
      >
        {ch}
      </div>
      {shade > 0.01 ? (
        <div style={{ position: "absolute", inset: 0, background: fd.ink, opacity: shade }} />
      ) : null}
    </div>
  );
};

/** One tile. It drops in at `at` and lands on `char` after `flips` flips. */
export const FlapTile: React.FC<{
  char: string;
  seed: string;
  at: number;
  flips: number;
  /** Seconds per flip. */
  flipDur?: number;
  s: TileStyle;
}> = ({ char, seed, at, flips, flipDur = 0.1, s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const start = sec(at);
  const per = Math.max(2, sec(flipDur));
  const seq = Array.from(
    { length: flips },
    (_, k) => GLYPHS[Math.floor(random(`${seed}-${k}`) * GLYPHS.length)],
  ).concat(char);
  const local = frame - start;
  const n = Math.min(Math.max(Math.floor(local / per), 0), flips);
  const flipping = local >= 0 && n < flips;
  const phase = flipping ? (local - n * per) / per : 0;
  const cur = seq[n];
  const next = seq[Math.min(n + 1, flips)];
  const topRot = flipping ? tween(phase, [0, 0.5], [0, -90], ease.in) : 0;
  const botRot = flipping ? tween(phase, [0.5, 1], [90, 0], ease.out) : 90;
  const drop = spring({ frame: frame - start + 3, fps, config: springs.snappy });
  const landed = local >= flips * per;
  const settle = landed
    ? spring({ frame: frame - start - flips * per, fps, config: springs.bouncy })
    : 0;
  if (frame < start - 3) return <div style={{ width: s.w, height: s.h }} />;
  return (
    <div
      style={{
        position: "relative",
        width: s.w,
        height: s.h,
        perspective: 640,
        opacity: Math.min(drop * 1.5, 1),
        transform: `translateY(${(1 - drop) * -46 + (landed ? (1 - settle) * 5 : 0)}px) scale(${0.9 + 0.1 * drop})`,
        filter: `drop-shadow(0 14px 18px ${inkShadow(0.18)})`,
      }}
    >
      <Half ch={flipping ? next : cur} top s={s} />
      <Half ch={cur} top={false} s={s} />
      {flipping && phase < 0.5 ? <Half ch={cur} top rotate={topRot} s={s} /> : null}
      {flipping && phase >= 0.5 ? <Half ch={next} top={false} rotate={botRot} s={s} /> : null}
      {/* The hinge: a dark seam with a pin at each end. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: s.h / 2 - 1.5,
          height: 3,
          background: mix(s.bg, fd.ink, 0.55),
        }}
      />
      {[0, 1].map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            top: s.h / 2 - 7,
            [side ? "right" : "left"]: -3,
            width: 6,
            height: 14,
            borderRadius: 3,
            background: mix(s.bg, fd.ink, 0.4),
          }}
        />
      ))}
    </div>
  );
};

/** A word of tiles, staggered left to right so they land in reading order. */
export const FlapWord: React.FC<{
  text: string;
  at: number;
  step?: number;
  baseFlips?: number;
  gap?: number;
  s: TileStyle;
}> = ({ text, at, step = 0.05, baseFlips = 3, gap = 12, s }) => (
  <div style={{ display: "flex", gap }}>
    {text
      .split("")
      .map((ch, i) =>
        ch === " " ? (
          <div key={`sp-${i}`} style={{ width: s.w * 0.5 }} />
        ) : (
          <FlapTile
            key={`${ch}-${i}`}
            char={ch}
            seed={`${text}-${i}`}
            at={at + i * step}
            flips={baseFlips + Math.round(i * 0.5)}
            s={s}
          />
        ),
      )}
  </div>
);

/** When each tile of a word lands, in seconds, for syncing ticks. */
export const flapLandings = (text: string, at: number, step = 0.05, baseFlips = 3, flipDur = 0.1) =>
  text
    .split("")
    .map((ch, i) =>
      ch === " " ? null : at + i * step + (baseFlips + Math.round(i * 0.5)) * flipDur,
    )
    .filter((v): v is number => v !== null);
