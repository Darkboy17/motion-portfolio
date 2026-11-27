import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { palettes } from "./theme";

type Variant = "lab" | "atelier";

const noise = (seed: number) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' seed='${seed}'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`;

/** Layer 1: paper with two slow-drifting colour washes and an optional dot grid. */
const Background: React.FC<{ variant: Variant; grid: boolean; tint?: string }> = ({
  variant,
  grid,
  tint,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const c = palettes[variant];
  const wash = tint ?? (variant === "lab" ? palettes.lab.hero : palettes.atelier.blush);
  const d1 = Math.sin(frame / 80) * 60;
  const d2 = Math.cos(frame / 95) * 50;
  const size = Math.max(width, height);
  return (
    <AbsoluteFill style={{ background: c.paper, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: size * 0.9,
          height: size * 0.9,
          borderRadius: "50%",
          left: -size * 0.3 + d1,
          top: -size * 0.45,
          background: `radial-gradient(circle, ${wash}${variant === "lab" ? "14" : "40"}, transparent 64%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: "50%",
          right: -size * 0.28 - d2,
          bottom: -size * 0.42,
          background: `radial-gradient(circle, ${
            variant === "lab" ? palettes.lab.blue + "0E" : palettes.atelier.sand + "55"
          }, transparent 62%)`,
        }}
      />
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(${palettes.lab.line} 1.4px, transparent 1.6px)`,
            backgroundSize: "40px 40px",
            backgroundPosition: "20px 20px",
            opacity: 0.55,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/** Layer 4: a gentle grade that ties the frame together. */
const Grade: React.FC<{ variant: Variant }> = ({ variant }) => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        variant === "lab"
          ? "linear-gradient(180deg, rgba(255,255,255,0.0), rgba(15,26,20,0.025))"
          : "linear-gradient(180deg, rgba(60,30,10,0.03), transparent 30%, transparent 70%, rgba(40,20,10,0.08))",
    }}
  />
);

/** Layer 5: moving film grain and a soft vignette. */
const Texture: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundImage: noise(3),
          backgroundSize: "240px",
          backgroundPosition: `${(frame * 7) % 240}px ${(frame * 13) % 240}px`,
          opacity: variant === "lab" ? 0.035 : 0.075,
          mixBlendMode: "multiply",
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: `radial-gradient(ellipse at center, transparent 58%, ${
            variant === "lab" ? "rgba(15,26,20,0.07)" : "rgba(40,22,10,0.18)"
          } 100%)`,
        }}
      />
    </>
  );
};

/**
 * Every scene sits on a Stage: background, content, grade, grain and vignette,
 * in that order. Content goes in as children.
 */
export const Stage: React.FC<{
  variant?: Variant;
  grid?: boolean;
  tint?: string;
  children: React.ReactNode;
}> = ({ variant = "lab", grid = false, tint, children }) => (
  <AbsoluteFill>
    <Background variant={variant} grid={grid} tint={tint} />
    <AbsoluteFill>{children}</AbsoluteFill>
    <Grade variant={variant} />
    <Texture variant={variant} />
  </AbsoluteFill>
);
