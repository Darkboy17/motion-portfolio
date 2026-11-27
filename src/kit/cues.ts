// Caption cues as plain data. No React here, so Node scripts can import it.

export type Cue = {
  /** Start, in seconds from the start of the composition. */
  at: number;
  /** End, in seconds. Defaults to the next cue's start. */
  to?: number;
  /** Caption text. Wrap words in *asterisks* to emphasise them. */
  text: string;
};

/** Fills in each cue's end time from the next cue, so a script only needs start times. */
export const resolveCues = (cues: Cue[], end: number): Required<Cue>[] =>
  cues.map((c, i) => ({ ...c, to: c.to ?? cues[i + 1]?.at ?? end }));

const stamp = (t: number) => {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms % 1000, 3)}`;
};

/** The same cues as a WebVTT file, for players and screen readers. */
export const cuesToVtt = (cues: Cue[], end: number) =>
  "WEBVTT\n\n" +
  resolveCues(cues, end)
    .map((c, i) => `${i + 1}\n${stamp(c.at)} --> ${stamp(c.to)}\n${c.text.replace(/\*/g, "")}\n`)
    .join("\n");
