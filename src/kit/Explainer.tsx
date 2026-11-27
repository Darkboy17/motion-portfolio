// Layout pieces shared by the 16:9 explainers: the left-hand text column,
// chapter titles, notes, the opening title and the recap rows.
import React from "react";
import { Enter, ExitAt, Stagger } from "./Enter";
import { Kicker, WordReveal } from "./Text";
import { fonts, palettes } from "./theme";

const c = palettes.lab;

/** The left-hand column. Content stacks with a fixed gap. */
export const PanelColumn: React.FC<{
  exitAt?: number;
  gap?: number;
  top?: number;
  width?: number;
  children: React.ReactNode;
}> = ({ exitAt, gap = 30, top = 196, width = 660, children }) => (
  <ExitAt at={exitAt}>
    <div
      style={{
        position: "absolute",
        left: 96,
        top,
        width,
        display: "flex",
        flexDirection: "column",
        gap,
      }}
    >
      {children}
    </div>
  </ExitAt>
);

export const titleStyle: React.CSSProperties = {
  fontFamily: fonts.sans,
  fontWeight: 800,
  fontSize: 62,
  letterSpacing: "-0.035em",
  lineHeight: 1.05,
};

/** A chapter title. Wrap one word in *asterisks* to highlight it. */
export const PanelTitle: React.FC<{ text: string; at?: number; size?: number }> = ({
  text,
  at = 0.15,
  size,
}) => (
  <WordReveal
    text={text}
    at={at}
    color={c.ink}
    emphColor={c.heroDeep}
    emphFill={c.heroTint}
    style={{ ...titleStyle, fontSize: size ?? titleStyle.fontSize }}
  />
);

/** A small uppercase label above a formula or a group. */
export const PanelNote: React.FC<{ text: string; at: number; color?: string }> = ({
  text,
  at,
  color = c.inkMute,
}) => (
  <Enter at={at} dy={14}>
    <div
      style={{
        fontFamily: fonts.sans,
        fontWeight: 700,
        fontSize: 22,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
      }}
    >
      {text}
    </div>
  </Enter>
);

/** The opening title: kicker, a large headline and one supporting line. */
export const HookTitle: React.FC<{
  kicker: string;
  headline: string;
  sub: string;
  exitAt: number;
  top?: number;
  width?: number;
  size?: number;
}> = ({ kicker, headline, sub, exitAt, top = 300, width = 660, size = 100 }) => (
  <ExitAt at={exitAt}>
    <div
      style={{
        position: "absolute",
        left: 96,
        top,
        width,
        display: "flex",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <Kicker text={kicker} color={c.heroDeep} at={0.15} />
      <WordReveal
        text={headline}
        at={0.35}
        color={c.ink}
        emphColor={c.heroDeep}
        emphFill={c.heroTint}
        style={{ ...titleStyle, fontSize: size }}
      />
      <Enter at={1.5}>
        <div
          style={{
            fontFamily: fonts.sans,
            fontWeight: 500,
            fontSize: 30,
            lineHeight: 1.4,
            color: c.inkSoft,
            maxWidth: 620,
          }}
        >
          {sub}
        </div>
      </Enter>
    </div>
  </ExitAt>
);

export type RecapRow = { k: string; q: string; a: React.ReactNode; color: string; tint: string };

/** The closing summary: one card per idea, each with its answer on the right. */
export const RecapRows: React.FC<{ rows: RecapRow[]; at?: number }> = ({ rows, at = 1.3 }) => (
  <Stagger at={at} step={0.45} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {rows.map((r) => (
      <div
        key={r.k}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "20px 26px",
          borderRadius: 22,
          background: c.surface,
          border: `2px solid ${c.line}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontFamily: fonts.sans, fontWeight: 800, fontSize: 30, color: c.ink }}>
            {r.k}
          </div>
          <div style={{ fontFamily: fonts.sans, fontWeight: 600, fontSize: 24, color: c.inkMute }}>
            {r.q}
          </div>
        </div>
        <div
          style={{
            padding: "10px 20px",
            borderRadius: 14,
            background: r.tint,
            fontFamily: fonts.sans,
            fontWeight: 800,
            fontSize: 32,
            color: r.color,
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {r.a}
        </div>
      </div>
    ))}
  </Stagger>
);
