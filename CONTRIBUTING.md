# Working in this repo

## Set up

```bash
npm ci
npm run dev          # Remotion Studio: every composition, with editable props
```

Node 22 and ffmpeg (for `npm run render`) are the only other requirements. Remotion downloads its own headless Chrome on first render.

## How a piece is laid out

Each video lives in `src/videos/<slug>/` and owns everything specific to it:

- `timeline.ts`: the beat sheet, in seconds. Every animation, caption and sound keys off it, so retiming a beat is a one-line change.
- `model.ts`: the maths or data behind the piece, as pure functions with unit tests next to them (`*.test.ts`).
- Scene components, and a `composition.tsx` that registers the piece with Remotion.

`src/entries/<slug>.tsx` registers one piece on its own. Render with it while you work, so you only bundle what you are changing:

```bash
npx remotion still src/entries/quadratic.tsx Quadratic out/check/q.png --frame=600
```

Shared components go in `src/kit/` once a second piece needs them, not before.

## Rules every piece follows

- Colours, type, easing and springs come from `src/kit/theme.ts`. No hex values or easing curves inline.
- Every tween is eased and clamped (`tween()` does both). Nothing moves linearly except physics: a falling ball moves with time, not with a curve.
- Entrances animate two or three properties and are staggered; exits are quicker than entrances.
- Times are written in seconds and converted with `useSec()`, so nothing depends on a hard-coded frame rate.
- Text stays inside the safe area: 96 px side margins at 1080p, and the middle 75% of the height for 9:16.

## Commits and pull requests

- One piece, or one kit change, per pull request. Fill in the template, including stills.
- Commit messages follow Conventional Commits: `feat(kit): …`, `feat(explainer): …`, `fix(quadratic): …`, `refactor: …`, `chore: …`. The subject says what changed; the body says why.
- Before opening a PR: `npm run lint`, `npm test`, and a look at rendered stills for every beat you touched.
- New assets get a row in `ASSETS.md` in the same PR.

## Rendering deliverables

```bash
npm run render                  # all pieces: masters, web encodes, posters, captions
npm run render -- arctan        # one piece
npm run stills                  # one poster still per piece (what CI runs)
```

Outputs go to `out/`, which is not committed.
