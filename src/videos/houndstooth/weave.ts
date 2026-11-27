// The houndstooth model. A houndstooth is a 2/2 twill woven with the same
// colour order in warp and weft: four dark threads, then four light. Every view
// in the piece (the point-paper build, the tiled field, the thread diagram and
// the swatches) is drawn from these functions, so nothing is hand-placed.
//
// Coordinates are in cells: column c runs along x (one warp thread per column),
// row r runs along y (one weft pick per row).

/** Threads per colour repeat: 4 dark + 4 light. */
export const REPEAT = 8;
/** Twill cycle: over two, under two. */
export const TWILL = 4;

/** Modulo that stays positive for negative cells (the field extends both ways). */
export const mod = (a: number, n: number) => ((a % n) + n) % n;

/** 2/2 twill: the warp is on top for two cells, under for two, one step over each row. */
export const warpUp = (r: number, c: number) => mod(c - r, TWILL) < 2;

/** Colour order of the warp ends: the first half of each repeat is dark. */
export const warpDark = (c: number) => mod(c, REPEAT) < REPEAT / 2;

/** Colour order of the weft picks: the same 4 dark / 4 light. */
export const weftDark = (r: number) => mod(r, REPEAT) < REPEAT / 2;

/** What the eye sees at a cell: the colour of whichever thread is on top. */
export const cellDark = (r: number, c: number) => (warpUp(r, c) ? warpDark(c) : weftDark(r));

/** The repeat as a matrix of booleans, `tile()[r][c]`. */
export const tile = (size = REPEAT): boolean[][] =>
  Array.from({ length: size }, (_, r) => Array.from({ length: size }, (_, c) => cellDark(r, c)));

/** Half-open cell bounds: rows r0..r1-1, columns c0..c1-1. */
export type Bounds = { r0: number; r1: number; c0: number; c1: number };

/** A horizontal run of dark cells in one row, columns c0..c1-1. */
export type Run = { r: number; c0: number; c1: number };

/** Merges each row's dark cells into runs, so a whole field is one short path. */
export const darkRuns = ({ r0, r1, c0, c1 }: Bounds): Run[] => {
  const runs: Run[] = [];
  for (let r = r0; r < r1; r++) {
    let start: number | null = null;
    for (let c = c0; c <= c1; c++) {
      const dark = c < c1 && cellDark(r, c);
      if (dark && start === null) start = c;
      if (!dark && start !== null) {
        runs.push({ r, c0: start, c1: c });
        start = null;
      }
    }
  }
  return runs;
};

/** SVG path data for a list of runs, in cell units. */
export const runsPath = (runs: Run[]) =>
  runs.map(({ r, c0, c1 }) => `M${c0} ${r}h${c1 - c0}v1h${c0 - c1}z`).join("");

/** The dark cells of one repeat as a single path, origin at its top-left corner. */
export const TILE_PATH = runsPath(darkRuns({ r0: 0, r1: REPEAT, c0: 0, c1: REPEAT }));

/**
 * Where a weft pick floats over the warp: column spans [a, b) in which the weft
 * is on top. In a 2/2 twill every float is two warps long. Spans are clipped to
 * the bounds, so a float cut by the edge comes back shorter.
 */
export const weftFloats = (r: number, c0: number, c1: number) => {
  const spans: { a: number; b: number }[] = [];
  for (let c = c0; c < c1; c++) {
    const up = !warpUp(r, c);
    const prevUp = c > c0 && !warpUp(r, c - 1);
    if (up && !prevUp) spans.push({ a: c, b: c + 1 });
    else if (up) spans[spans.length - 1].b = c + 1;
  }
  return spans;
};

/** The colour order as a string, for labels and tests: "DDDDLLLL". */
export const colourOrder = (n = REPEAT, dark: (i: number) => boolean = warpDark) =>
  Array.from({ length: n }, (_, i) => (dark(i) ? "D" : "L")).join("");

/** Fill order for the build: anti-diagonals from the top-left corner. */
export const diagonal = (r: number, c: number) => r + c;
