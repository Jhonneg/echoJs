# Crimson Horizon — sun glow

2026-11-27. Item 3 of the owner-requested review against the reference image: at idle the sun was a dull disc, barely brighter than the ground. The owner approved the plan and chose option **(b)**, a brighter idle sun.

## What changed

- **Idle sun** (`CrimsonHorizonScene.tsx`, sun shader): at rest the sun is 20% of the way from the sky colour to full sun, up from 5.5%. It still brightens to full with the music exactly as before. This revises the faint idle sun approved in C04.
- **Sky halo** (glow shader): a soft dark-red halo just outside the disc, fading out over about 7 units. At rest its strength is 0.08, plus 0.12 × the existing sun activity, so it grows with the music.
- **Valley-base glow** (`material.ts`, terrain shader): far slopes seen just around the sun's base catch a hot magenta light.
  - Its shape is a wide, flat ellipse in view direction around the base point.
  - Its strength is 0.12 at rest, plus 0.5 × the sun's activity.
  - It is masked to terrain 45–85 m away, so the foreground never gets it.
  - It's applied after the terrain's fade into the night sky, which would otherwise hide it on slopes about 100 m away.
- **Tuning:** a first pass (halo 0.05, base glow 0.05) was too timid in the captures, so both were raised once.
- No change to the music mapping (bass pulse, corona ring, band-count brightening), camera, terrain or palette.

## Results

Mean luma (0–255), before (commit 0497078) → after, back-to-back runs with the generated song:

| Moment | Frame | Sky | Sun region | Ground |
|---|---|---|---|---|
| idle | 28.69 → 30.08 | 25.37 → 25.4 | 39.36 → 56 | 30.71 → 30.71 |
| idle-low | 28.72 → 30.08 | 25.36 → 25.39 | 39.48 → 56.12 | 30.69 → 30.69 |
| intro | 30.45 → 31.33 | 25.51 → 25.54 | 60.21 → 69.5 | 30.93 → 30.93 |
| build | 30.94 → 31.72 | 25.86 → 25.91 | 66.01 → 74.83 | 31.05 → 30.9 |
| drop-hit | 32.49 → 33.15 | 25.91 → 25.97 | 81.32 → 87.2 | 30.83 → 30.83 |
| drop | 33.65 → 34.44 | 26.1 → 26.31 | 91.82 → 97.06 | 30.96 → 30.96 |
| breakdown | 29.84 → 30.92 | 25.73 → 25.78 | 51.02 → 63.56 | 30.91 → 30.91 |

- **At rest** the sun region rises from 39 to 56. It is now clearly the focal point, while the ground and the sky away from the sun are unchanged.
- **With music** the sun still brightens well above its resting level (up to 97 in the drop), and the halo becomes a soft pink glow around the disc.
- `reference-before-after-drop.png` shows, left to right, the reference, before and after during the drop. Also included: `before-` and `after-idle.png`, `-drop.png` and `-reduced-motion.png`.
- **GPU** (ms per frame, median of 3, two alternated pairs):

| | Before | After |
|---|---|---|
| Standard idle | 2.42, 2.28 | 2.31, 2.33 |
| Low idle | 3.22, 1.65 | 1.52, 3.77 |
| Standard with music | 1.70, 1.72 | 1.88, 1.81 |

  Within this machine's run-to-run noise, perhaps +0.1 ms with music. These are headless measurements.

## Checks

- PASS: 356 unit tests, including the shader-safety test: the new terrain term adds no unguarded `pow()`. Lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs`, `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Reduced motion needs nothing new: the additions are static or follow existing levels. `after-reduced-motion.png` shows the still view.
- Not tested: native look, real songs.
