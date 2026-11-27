# Crimson Horizon — crimson rim lines

2026-11-27. Item 5 of the owner-requested review against the reference image. The owner approved the plan.

## Why the old lines were faint

- The public build always uses the music-driven line style (`musicWeight` = 1).
- In that style the resting crest lines are drawn at about 12% of their old strength, and light up only on mid-range sound.
- They are also one-pixel hairlines (width from `fwidth`), so they break up.

## What changed

`material.ts`, terrain shader:

- **A backlit rim term.** It lights mountain surfaces where they turn edge-on to the camera while facing the sun, which sits behind the ranges.
  - Because it comes from the surface's own shape, it draws continuous, smooth edges along every crest and outline, not hairlines.
  - The formula is `pow(max(1 − n·v, 0), RIM_POWER) × sunward × mask × (RIM_REST + activity × RIM_ACTIVE)`, in crimson (0.85, 0.02, 0.1).
- **Where it applies:** mountains only (the bank value fades it in from 0.15 to 0.6), so the valley floor stays dark. It fades out 100–130 m away.
- **When it's drawn:** after the terrain's fade into the night sky, so the distant ridge outlines keep their rims.
- **Strength:** steady at rest, a little stronger when the sun is lit by the music.
- **Tuning:** power 5 with a resting strength of 0.35 spread a crimson sheen over whole slopes. The final setting is power 10, resting strength 0.6, and 0.3 more with the sun's activity: thinner edges with similar peak brightness. `before-reduced-motion.png` is the frame before the change and `after-reduced-motion.png` the final setting, both still.
- The existing music-driven contour lights, travelling streaks and glints are unchanged on top, so the music mapping doesn't change.

## Results

Before (commit 855eec1) → after, back-to-back runs with the generated song.

Rim pixels, the share of the landscape band (y 200–700) that is bright and strongly red (R ≥ 90, R > 2.2 G, R > 1.3 B):

| Moment | Before | After |
|---|---|---|
| idle | 1.00% | 2.21% |
| build | 1.79% | 4.31% |
| drop | 2.80% | 4.45% |
| breakdown | 1.46% | 2.99% |

Mean luma (0–255):

| Moment | Frame | Sky | Sun region | Ground |
|---|---|---|---|---|
| idle | 30.08 → 30.37 | 25.4 → 25.4 | 56 → 56.22 | 30.71 → 30.72 |
| idle-low | 30.08 → 30.61 | 25.39 → 25.39 | 56.12 → 56.4 | 30.69 → 30.83 |
| build | 31.75 → 32.35 | 25.92 → 25.97 | 74.8 → 75.24 | 30.9 → 30.9 |
| drop | 34.14 → 34.64 | 26.24 → 26.18 | 93.37 → 94.85 | 30.96 → 31.09 |
| breakdown | 30.95 → 31.28 | 25.8 → 25.81 | 63.69 → 63.91 | 30.91 → 30.92 |

The drop-hit row (93.23 → 104.01 in the sun region) reflects when a bass pulse happened to be captured. Full numbers are in the run JSON, which isn't kept.

- The rim share roughly doubles at every moment, while the sky and ground stay within 0.2, so the rims stay on the mountains.
- `reference-before-after-drop.png` shows, left to right, the reference, before and after. Also included: `before-` and `after-idle.png` and `-drop.png`.
- **The main remaining difference from the reference** is the overall value: its terrain is near-black, so its rims stand out more. That's review item 4, the owner's call.
- **GPU** (ms per frame, median of 3, two alternated pairs):

| | Before | After |
|---|---|---|
| Standard idle | 2.13, 2.21 | 2.34, 2.38 |
| Low idle | 1.36, 1.74 | 1.62, 1.55 |
| Standard with music | 1.08, 1.15 | 1.69, 1.58 |

  About +0.2 ms at idle on Standard. With music, about +0.5 ms in these runs, though earlier Crimson runs of the unchanged scene ranged from 1.3 to 1.9 ms, so part of that is noise. Every figure stays far below a 16.7 ms frame. These are headless measurements.

## Checks

- PASS: 356 unit tests; the shader-safety test covers the new `pow()`, which takes `max(…, 0)`. Lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs`, `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Reduced motion needs nothing new: the rim is static apart from the existing sun activity.
- Not tested: native look, real songs.
