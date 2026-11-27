# Pattern study No. 02: Houndstooth

1:1, 1080 × 1080, 24 s at 30 fps, `pulse` bed at 120 BPM (one beat = 0.5 s).
A fashion motion graphic that is also a small explainer: a houndstooth is a 2/2 twill
woven with a 4 dark / 4 light colour order in both warp and weft.

## One model, one camera

- `weave.ts` holds the whole pattern. For a cell at row r, column c, the warp is up when
  `(c - r) mod 4` is 0 or 1, warp ends are dark when `c mod 8 < 4`, weft picks are dark
  when `r mod 8 < 4`, and a cell shows whichever thread is on top. The point-paper build,
  the tiled field, the thread diagram, the swatch and the draft labels all read from it.
- `camera.ts` and `timeline.ts` treat every view as a framing of the same world, measured
  in cells. Zooms mix the scale in log space. A crop (`region`) and the camera are tracks
  on the beat sheet.
- Flat cells use `crispEdges`, so tiles that touch never show a seam. The framings that
  hold still put every cell edge on a whole pixel, and a unit test checks this.

## Beats (seconds)

| Time      | Beat            | Picture                                                                                                                                                                                               | Sound                        |
| --------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| 0.0–2.0   | Title           | Kicker, then "Houndstooth" letter by letter (Fraunces italic). The first dark cell drops in and lands on beat 3 with an impact ring.                                                                  | swish, thump                 |
| 2.0–4.5   | The repeat      | Point paper: chalk plate, grid lines drawn on one by one, indices. Dark cells spring in along anti-diagonals.                                                                                         | tick on every other diagonal |
| 4.5–6.0   | One repeat      | Hero outline traced round the tile, dimension line, "One repeat · 8 × 8". Hold. Masthead out at 5.5, labels at 5.75.                                                                                  | pop                          |
| 6.0–10.0  | Step and repeat | Rings of tiles slide out from under the original (3 × 3, 5 × 5, then 7 × 7), and the camera zooms out until the field fills the frame. The tag counts × 9, × 25, × 49. Hold from 8.9.                 | clicks, whoosh               |
| 10.0–11.5 | How it's woven  | Camera dives into a 16 × 16 patch and crops it to a plate. The loom wipes in and the warp ends drop, with warp colour-order chips.                                                                    | whoosh, ticks                |
| 11.5–14.0 | Weft            | Picks shoot across, alternating direction like a shuttle. Floats go over two and under two and cast shadows. Weft chips and label. At 13.0 the hero twill line is drawn. Hold.                        | soft swishes, pop            |
| 14.0–16.0 | Relax           | Threads widen and flatten into crisp cells. "The weave _is_ the pattern."                                                                                                                             | thump                        |
| 16.0–21.0 | Colourways      | Zoom back to the field. A swatch card shows Classic, then a staircase sweep along the anti-diagonal recolours the field on the beat: Oxblood (17.5), Indigo (18.5), Sage (19.5).                      | whoosh, click, swishes       |
| 21.0–24.0 | End card        | Sweep back to Classic while the field crops down to one repeat. The masthead returns (hero rule) with the spec line. Hold, then the content fades to the bare stage, which is also the opening frame. | whoosh, shimmer              |

## Hero colour

Oxblood marks one thing at a time: the repeat outline (4.5–8.3), the twill line (13.0–14.3),
the stressed _is_ (14.5–16.0), the Oxblood colourway, and the end card's kicker rule.
