# Assets and licences

Every file a video uses is listed here with where it came from and the licence that lets us use it. Add a row in the same pull request that adds the asset.

## Fonts

All three are loaded at render time through `@remotion/google-fonts` (see `src/kit/fonts.ts`).

| Font | Used for | Source | Licence |
| --- | --- | --- | --- |
| Manrope | Explainer type, labels, captions, UI | Google Fonts | SIL Open Font License 1.1 |
| Fraunces | Editorial display type in the fashion pieces | Google Fonts | SIL Open Font License 1.1 |
| JetBrains Mono | Code blocks, HUD text | Google Fonts | SIL Open Font License 1.1 |

## Sound

Every sound is synthesized by `scripts/make-sfx.ts` from seeded noise and oscillators. Nothing is sampled or downloaded, so all of it is original work under this repository's licence. Run `npm run assets` to rebuild them.

| File | What it is |
| --- | --- |
| `public/sfx/whoosh.wav`, `swish.wav` | Band-passed noise sweeps for transitions |
| `public/sfx/click.wav`, `tick.wav`, `type.wav`, `pop.wav` | Short UI hits |
| `public/sfx/thump.wav` | A low impact (the ball landing) |
| `public/sfx/chime.wav`, `shimmer.wav` | Bell partials through a small reverb, for correct answers and reveals |
| `public/sfx/error.wav` | Two soft low tones, for the bugs and wrong answers |
| `public/sfx/pad.wav` | A 24-second seamless chord pad, the explainers' music bed |
| `public/sfx/pulse.wav` | A 120 BPM beat (15 frames a beat at 30 fps), the fashion pieces' music bed |

## Lottie

Written by hand as Bodymovin JSON by `scripts/make-lottie.ts`: original work under this repository's licence. The key colour (black) is recoloured at render time by `LottieClip`'s `tint`.

| File | What it is | Used in |
| --- | --- | --- |
| `public/lottie/burst.json` | Hit spark: rays, a ring and a core | Arctan (bullet and missile hits) |
| `public/lottie/check.json` | A circle and tick that draw on | Quadratic, Derivative |
| `public/lottie/sparkle.json` | Three four-point stars twinkling in turn | Festive Drop |
| `public/lottie/tag.json` | A swing tag settling on its string | Festive Drop |

## Illustration

Every garment, pattern, vehicle, turret and diagram is drawn as SVG in code inside its piece's folder. There are no photographs and no third-party illustrations.

## Stock (Envato Elements, LottieFiles, others)

None used so far. When a stock item is added, record it here with all of the following:

| File | Item | Source URL | Licence | Licence proof | Added |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

"Licence proof" is the path to the licence certificate (for example `licenses/envato-<item-id>.pdf`) or a link to the item's licence page saved on the day it was downloaded.
