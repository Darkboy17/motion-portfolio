// Equation typesetting built from spans, so every term can be animated,
// highlighted or swapped on its own. Sizes are in em of the <Eq> font size.
import React from "react";
import { useCurrentFrame } from "remotion";
import { useExit, useSec, useSpring, tween } from "./motion";
import { ease, fonts } from "./theme";

export const Eq: React.FC<{
  size?: number;
  color?: string;
  weight?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ size = 56, color, weight = 600, style, children }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      fontFamily: fonts.sans,
      fontWeight: weight,
      fontSize: size,
      color,
      whiteSpace: "nowrap",
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "-0.01em",
      lineHeight: 1.1,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A variable: oblique, as in print. */
export const V: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <span style={{ fontStyle: "italic", fontWeight: 500, padding: "0 0.04em", color }}>
    {children}
  </span>
);

export const Sup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-block",
      fontSize: "0.6em",
      transform: "translateY(-0.62em)",
      marginLeft: "0.04em",
    }}
  >
    {children}
  </span>
);

export const Sub: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-block",
      fontSize: "0.58em",
      transform: "translateY(0.42em)",
      marginLeft: "0.04em",
    }}
  >
    {children}
  </span>
);

/** An operator with breathing room on both sides. */
export const Op: React.FC<{ children: React.ReactNode; tight?: boolean }> = ({
  children,
  tight,
}) => <span style={{ margin: tight ? "0 0.12em" : "0 0.3em", fontWeight: 500 }}>{children}</span>;

export const Frac: React.FC<{
  n: React.ReactNode;
  d: React.ReactNode;
  scale?: number;
  barColor?: string;
}> = ({ n, d, scale = 0.9, barColor = "currentColor" }) => (
  <span
    style={{
      display: "inline-flex",
      flexDirection: "column",
      alignItems: "center",
      fontSize: `${scale}em`,
      margin: "0 0.18em",
      verticalAlign: "middle",
    }}
  >
    <span style={{ display: "inline-flex", alignItems: "center", padding: "0 0.18em 0.12em" }}>
      {n}
    </span>
    <span
      style={{
        alignSelf: "stretch",
        height: "0.065em",
        minHeight: 2,
        background: barColor,
        borderRadius: 2,
      }}
    />
    <span style={{ display: "inline-flex", alignItems: "center", padding: "0.12em 0.18em 0" }}>
      {d}
    </span>
  </span>
);

/** Square root with a drawn radical that stretches to its contents. */
export const Sqrt: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "stretch",
      position: "relative",
      paddingLeft: "0.72em",
      margin: "0 0.08em",
    }}
  >
    <svg
      viewBox="0 0 20 40"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "0.74em",
        height: "100%",
        overflow: "visible",
      }}
    >
      <path
        d="M1 25 L5.5 22 L11 38.5 L19.6 1.2"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderTop: "0.065em solid currentColor",
        padding: "0.3em 0.12em 0",
      }}
    >
      {children}
    </span>
  </span>
);

/**
 * A term that can enter on its own, take a tinted highlight, dim, or exit.
 * Times are seconds relative to the enclosing Sequence.
 */
export const T: React.FC<{
  at?: number;
  exitAt?: number;
  hl?: string;
  hlAt?: number;
  hlTo?: number;
  color?: string;
  dimAt?: number;
  children: React.ReactNode;
}> = ({ at, exitAt, hl, hlAt = 0, hlTo, color, dimAt, children }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const p = useSpring(at === undefined ? -1000 : sec(at), "snappy");
  const exit = useExit(exitAt);
  const hlIn = tween(frame, [sec(hlAt), sec(hlAt + 0.35)], [0, 1], ease.out);
  const hlOut =
    hlTo === undefined ? 0 : tween(frame, [sec(hlTo), sec(hlTo + 0.3)], [0, 1], ease.in);
  const hlP = hl ? hlIn * (1 - hlOut) : 0;
  const dim =
    dimAt === undefined ? 0 : tween(frame, [sec(dimAt), sec(dimAt + 0.4)], [0, 1], ease.out);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        position: "relative",
        padding: "0.02em 0.14em",
        margin: "0 -0.02em",
        borderRadius: "0.18em",
        color,
        opacity: Math.min(p * 1.3, 1) * (1 - exit) * (1 - dim * 0.65),
        transform: `translateY(${(1 - p) * 0.4}em) scale(${0.9 + 0.1 * p})`,
      }}
    >
      {hl ? (
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "0.18em",
            background: hl,
            opacity: hlP,
            transform: `scale(${0.92 + 0.08 * hlP})`,
          }}
        />
      ) : null}
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        {children}
      </span>
    </span>
  );
};
