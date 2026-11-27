# Assets and licences

Every file a video uses is listed here with where it came from and the licence that lets us use it. Add a row in the same pull request that adds the asset.

## Fonts

All three are loaded at render time through `@remotion/google-fonts` (see `src/kit/fonts.ts`).

| Font | Used for | Source | Licence |
| --- | --- | --- | --- |
| Manrope | Explainer type, labels, captions, UI | Google Fonts | SIL Open Font License 1.1 |
| Fraunces | Editorial display type in the fashion pieces | Google Fonts | SIL Open Font License 1.1 |
| JetBrains Mono | Code blocks, HUD text | Google Fonts | SIL Open Font License 1.1 |

## Sound effects

Every sound effect is a real recording. `scripts/fetch-sfx-sources.ts` downloads the originals into `sfx-sources/` (not committed), and `scripts/prepare-sfx.ts` cuts them into `public/sfx/<slot>-<take>.ogg`: each take starts on its transient, gets a short fade so no cut clicks, and is levelled to the same loudness. The slots, their takes and their mix levels are listed in `src/kit/sfx-manifest.json`. These edits (cutting, fading, levelling) are the only changes made to the recordings.

| Slots | Source | Author | Licence |
| --- | --- | --- | --- |
| `tick` `click` `select` `toggle` `confirm` `error` `glitch` `scratch` `rise` `fall` `drop` `pluck` `glass` | [Interface Sounds](https://kenney.nl/assets/interface-sounds) | Kenney | CC0 1.0 |
| `cloth` `flip` `place` `leather` `latch` `slice` | [RPG Audio](https://kenney.nl/assets/rpg-audio) | Kenney | CC0 1.0 |
| `thud` `bump` `wood` `peg` `plank` `bell` `punch` | [Impact Sounds](https://kenney.nl/assets/impact-sounds) | Kenney | CC0 1.0 |
| `laser` `hit` `boom` `thruster` `computer` | [Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds) | Kenney | CC0 1.0 |
| `chalk` | [264944 chalk-on-chalkboard.wav](https://commons.wikimedia.org/wiki/File:264944_chalk-on-chalkboard.wav) | fattirewhitey | CC0 1.0 |
| `pencil` | [Pencil scratchings.ogg](https://commons.wikimedia.org/wiki/File:Pencil_scratchings.ogg) | gypsygirl | Public domain |
| `sleigh` | [Sleigh bells.wav](https://commons.wikimedia.org/wiki/File:Sleigh_bells.wav) | The Midnite Wolf | CC0 1.0 |
| `jingle` | [Soothing jingling little bells ambience.ogg](https://commons.wikimedia.org/wiki/File:Soothing_jingling_little_bells_ambience.ogg) | stephan | Public domain |
| `typing` | [Typing - Model M 1986.ogg](https://commons.wikimedia.org/wiki/File:Typing_-_Model_M_1986.ogg) | Raymangold22 | CC0 1.0 |
| `sewing` | [WWS SewingMachine.ogg](https://commons.wikimedia.org/wiki/File:WWS_SewingMachine.ogg) | Work With Sounds / Werstas | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `loom` `clack` | [WWS Narrowshuttleloom.ogg](https://commons.wikimedia.org/wiki/File:WWS_Narrowshuttleloom.ogg) | Work With Sounds / Museum of Municipal Engineering | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `engineStart` | [WWS FSRTarpan239Dvanstarting.ogg](https://commons.wikimedia.org/wiki/File:WWS_FSRTarpan239Dvanstarting.ogg) | Work With Sounds / Museum of Municipal Engineering | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `engine` | [WWS FSRTarpan239Dvandriving.ogg](https://commons.wikimedia.org/wiki/File:WWS_FSRTarpan239Dvandriving.ogg) | Work With Sounds / Museum of Municipal Engineering | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |

The CC BY 4.0 recordings need attribution, which this table, the README and the portfolio page give.

## Music

`public/sfx/pad.wav` (the explainers' bed) and `public/sfx/pulse.wav` (the fashion pieces' 120 BPM bed) are synthesized by `scripts/make-sfx.ts` as placeholders, original work under this repository's licence. They will be replaced by licensed music; each track gets a row here with its source and licence.

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
