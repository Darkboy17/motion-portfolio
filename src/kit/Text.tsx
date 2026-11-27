import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { useExit, useSec, useSpring, tween } from "./motion";
import { ease, fonts, springs, timing, type } from "./theme";

export type Word = { text: string; emph: boolean };

/**
 * Splits text into words. Words wrapped in asterisks are emphasised:
 * "Every throw draws a *parabola.*" or "*two words*".
 */
export const parseWords = (text: string): Word[] => {
  const words: Word[] = [];
  let inEmph = false;
  for (const raw of text.split(/\s+/).filter(Boolean)) {
    let t = raw;
    let emph = inEmph;
    if (t.startsWith("*")) {
      t = t.slice(1);
      emph = true;
      inEmph = true;
    }
    const close = t.match(/\*([.,;:!?)]*)$/);
    if (close) {
      t = t.slice(0, close.index) + close[1];
      inEmph = false;
    }
    words.push({ text: t, emph });
  }
  return words;
};

type WordRevealProps = {
  text: string;
  /** Start in seconds. */
  at?: number;
  /** Seconds between words. */
  per?: number;
  exitAt?: number;
  color?: string;
  emphColor?: string;
  /** Draws a tinted pill behind emphasised words, 5 frames after they land. */
  emphFill?: string;
  style?: React.CSSProperties;
  /** Horizontal gap in px between words. Never em: it resolves against the parent. */
  gap?: number;
};

/** Word-by-word rise. The workhorse for titles and captions. */
export const WordReveal: React.FC<WordRevealProps> = ({
  text,
  at = 0,
  per = timing.wordStagger,
  exitAt,
  color,
  emphColor,
  emphFill,
  style,
  gap,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sec = useSec();
  const exit = useExit(exitAt);
  const fontSize = typeof style?.fontSize === "number" ? style.fontSize : type.body;
  const wordGap = gap ?? Math.round(fontSize * 0.26);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        columnGap: wordGap,
        rowGap: Math.round(fontSize * 0.08),
        color,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 14}px)`,
        ...style,
      }}
    >
      {parseWords(text).map((w, i, all) => {
        const start = sec(at + i * per);
        // Neighbouring emphasised words share one continuous highlight.
        const joinL = i > 0 && all[i - 1].emph;
        const joinR = i < all.length - 1 && all[i + 1].emph;
        const r = fontSize * 0.18;
        const p = spring({ frame: frame - start, fps, config: springs.snappy });
        const fill = tween(frame, [start + 5, start + 16], [0, 1], ease.out);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              position: "relative",
              opacity: Math.min(p * 1.4, 1),
              transform: `translateY(${interpolate(p, [0, 1], [fontSize * 0.45, 0])}px)`,
              color: w.emph ? emphColor : undefined,
            }}
          >
            {w.emph && emphFill ? (
              <span
                style={{
                  position: "absolute",
                  left: joinL ? -wordGap / 2 - 1 : -fontSize * 0.14,
                  right: joinR ? -wordGap / 2 - 1 : -fontSize * 0.14,
                  top: "8%",
                  bottom: "2%",
                  borderRadius: `${joinL ? 0 : r}px ${joinR ? 0 : r}px ${joinR ? 0 : r}px ${joinL ? 0 : r}px`,
                  background: emphFill,
                  transform: `scaleX(${fill})`,
                  transformOrigin: "left center",
                  zIndex: -1,
                }}
              />
            ) : null}
            {w.text}
          </span>
        );
      })}
    </div>
  );
};

/** Small uppercase label with a leading rule. Sets context above a title. */
export const Kicker: React.FC<{
  text: string;
  at?: number;
  exitAt?: number;
  color: string;
  ruleColor?: string;
  size?: number;
  font?: string;
}> = ({ text, at = 0, exitAt, color, ruleColor, size = type.kicker, font = fonts.sans }) => {
  const sec = useSec();
  const p = useSpring(sec(at), "smooth");
  const exit = useExit(exitAt);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        fontFamily: font,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color,
        opacity: Math.min(p * 1.3, 1) * (1 - exit),
      }}
    >
      <span
        style={{
          width: 44 * p,
          height: 3,
          borderRadius: 2,
          background: ruleColor ?? color,
        }}
      />
      <span style={{ transform: `translateX(${(1 - p) * 16}px)` }}>{text}</span>
    </div>
  );
};
