// A code card with light syntax colouring, a typing reveal and line focus.
import React from "react";
import { useCurrentFrame } from "remotion";
import { enterStyle, useExit, useSec, useSpring, tween } from "./motion";
import { ease, fonts, palettes } from "./theme";

type Kind = "kw" | "fn" | "str" | "num" | "com" | "punc" | "prop" | "id" | "ws";
export type Token = { kind: Kind; text: string };

const KEYWORDS = new Set([
  "const",
  "let",
  "var",
  "function",
  "return",
  "if",
  "else",
  "new",
  "import",
  "from",
  "export",
  "type",
  "interface",
  "for",
  "of",
  "while",
  "true",
  "false",
  "null",
  "undefined",
]);

const RULES: [Kind, RegExp][] = [
  ["com", /^\/\/[^\n]*/],
  ["str", /^("[^"]*"|'[^']*'|`[^`]*`)/],
  ["num", /^\d+(\.\d+)?/],
  ["ws", /^\s+/],
  ["id", /^[A-Za-z_$][\w$]*/],
  ["punc", /^[^\sA-Za-z_$\d]/],
];

/** A deliberately small TypeScript tokenizer: enough for slides, not a parser. */
export const tokenize = (line: string): Token[] => {
  const out: Token[] = [];
  let rest = line;
  while (rest.length) {
    for (const [kind, re] of RULES) {
      const m = rest.match(re);
      if (!m) continue;
      let k: Kind = kind;
      const text = m[0];
      if (kind === "id") {
        const after = rest.slice(text.length);
        const prev = out.filter((t) => t.kind !== "ws").at(-1);
        if (KEYWORDS.has(text)) k = "kw";
        else if (after.startsWith("(")) k = "fn";
        else if (prev?.text === ".") k = "prop";
      }
      out.push({ kind: k, text });
      rest = rest.slice(text.length);
      break;
    }
  }
  return out;
};

const c = palettes.lab;
const colors: Record<Kind, string> = {
  kw: c.blue,
  fn: c.heroDeep,
  str: c.amberDeep,
  num: c.amberDeep,
  com: c.inkMute,
  punc: c.inkSoft,
  prop: c.ink,
  id: c.ink,
  ws: c.ink,
};

export const CodeBlock: React.FC<{
  code: string;
  title?: string;
  at?: number;
  exitAt?: number;
  /** Characters per second for the typing reveal. 0 shows everything at once. */
  cps?: number;
  /** Focus a line (1-based) between two times; other lines dim. */
  focus?: { line: number; at: number; to?: number }[];
  size?: number;
  width?: number;
}> = ({ code, title, at = 0, exitAt, cps = 60, focus = [], size = 30, width }) => {
  const frame = useCurrentFrame();
  const sec = useSec();
  const p = useSpring(sec(at), "smooth");
  const exit = useExit(exitAt);
  const lines = code.replace(/\n$/, "").split("\n");
  const typed = cps <= 0 ? Infinity : Math.max(0, (frame - sec(at + 0.35)) / sec(1)) * cps;
  const t = frame / sec(1);
  const active = focus.filter((f) => t >= f.at && (f.to === undefined || t < f.to));
  const focusP = (line: number) => {
    const f = focus.find((x) => x.line === line && t >= x.at && (x.to === undefined || t < x.to));
    return f ? tween(frame, [sec(f.at), sec(f.at + 0.3)], [0, 1], ease.out) : 0;
  };
  let budget = typed;
  return (
    <div
      style={{
        ...enterStyle(p, exit, { dy: 30, scale: 0.97 }),
        width,
        background: c.surface,
        border: `2px solid ${c.line}`,
        borderRadius: 22,
        boxShadow: "0 30px 60px -30px rgba(15,26,20,0.25)",
        overflow: "hidden",
      }}
    >
      {title ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 24px",
            borderBottom: `2px solid ${c.line}`,
            background: c.panel,
            fontFamily: fonts.mono,
            fontSize: size * 0.68,
            color: c.inkSoft,
          }}
        >
          {[c.red, c.amber, c.hero].map((dot) => (
            <span
              key={dot}
              style={{ width: 13, height: 13, borderRadius: 7, background: dot, opacity: 0.8 }}
            />
          ))}
          <span style={{ marginLeft: 10 }}>{title}</span>
        </div>
      ) : null}
      <div
        style={{
          padding: "24px 30px 26px 16px",
          fontFamily: fonts.mono,
          fontSize: size,
          lineHeight: 1.6,
        }}
      >
        {lines.map((line, i) => {
          const n = i + 1;
          const fp = focusP(n);
          const dim = active.length && !active.some((f) => f.line === n) ? 0.35 : 1;
          let lineBudget = budget;
          budget -= line.length + 1;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                position: "relative",
                borderRadius: 10,
                opacity: dim,
                background: fp ? `rgba(18,161,90,${0.1 * fp})` : undefined,
                whiteSpace: "pre",
              }}
            >
              <span
                style={{
                  width: 44,
                  textAlign: "right",
                  paddingRight: 22,
                  color: c.inkMute,
                  opacity: 0.6,
                  flexShrink: 0,
                }}
              >
                {n}
              </span>
              <span>
                {tokenize(line).map((tok, j) => {
                  if (lineBudget <= 0) return null;
                  const shown = tok.text.slice(0, Math.max(0, Math.floor(lineBudget)));
                  lineBudget -= tok.text.length;
                  return (
                    <span
                      key={j}
                      style={{
                        color: colors[tok.kind],
                        fontWeight: tok.kind === "kw" || tok.kind === "fn" ? 700 : 400,
                        fontStyle: tok.kind === "com" ? "italic" : undefined,
                      }}
                    >
                      {shown}
                    </span>
                  );
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
