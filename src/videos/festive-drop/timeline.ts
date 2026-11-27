// Beat sheet for The Festive Edit, in seconds. The bed ("pulse") runs at
// 120 BPM, so one beat is 0.5 s (15 frames at 30 fps) and every cut lands on a
// beat. Its first two bars are hats only; the kick comes in on bar 3 (4 s),
// which is where the collection itself drops.
export const BPM = 120;
export const BEAT = 60 / BPM;

/** n beats, in seconds. Half and quarter beats are eighths and sixteenths. */
export const beats = (n: number) => n * BEAT;

/** Scene starts, in seconds from the top. */
export const T = {
  hook: 0,
  date: beats(4),
  looks: beats(8),
  lookLen: beats(6),
  colour: beats(26),
  sizes: beats(33),
  end: beats(38),
  total: beats(44),
} as const;

export const FESTIVE_SECONDS = T.total;

/** Exits are quick: a sixteenth-and-a-bit, so the next scene enters on the beat. */
export const EXIT = 0.27;

// Inside each scene, times are relative to the scene start.

/** Hook: N, E, W slam in on eighth notes, then the title settles. */
export const hookT = {
  letters: [0, beats(0.5), beats(1)],
  sparkle: beats(1.4),
  title: beats(1.75),
  rule: beats(2),
  exit: T.date - T.hook - EXIT,
} as const;

/** Date: the tiles drop on the downbeat and flip to FRIDAY, then 7 PM. */
export const dateT = {
  kicker: 0,
  tiles: beats(0.25),
  time: beats(0.75),
  note: beats(2),
  exit: T.looks - T.date - EXIT,
} as const;

/** One look, 6 beats: garment on 1, name on the "and", motif blooms on 2. */
export const lookT = {
  garment: 0,
  tag: beats(0.6),
  kicker: beats(0.25),
  name: beats(0.4),
  fabric: beats(0.85),
  dots: beats(1.1),
  bloom: beats(0.9),
  bloomLen: beats(2.2),
  exit: T.lookLen - EXIT,
} as const;

/** Colour story: the title takes the downbeat, four bars rise on the next four beats, then their names. */
export const colourT = {
  title: 0,
  bars: [beats(1), beats(2), beats(3), beats(4)],
  names: beats(5),
  exit: T.sizes - T.colour - EXIT,
} as const;

/** Sizes: the line lands, then six pills pop on sixteenths. */
export const sizesT = {
  title: 0,
  stitch: beats(1.25),
  pills: beats(1.5),
  pillStep: beats(0.25),
  exit: T.end - T.sizes - EXIT,
} as const;

/** End card: the lantern draws and lights, the wordmark rises, then a long hold. */
export const endT = {
  lantern: 0,
  light: beats(1.25),
  wordmark: beats(0.75),
  tagline: beats(1.75),
  sparkle: beats(1.5),
} as const;
