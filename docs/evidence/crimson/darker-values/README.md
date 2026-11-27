# Crimson Horizon — darker values

2026-11-27. Item 4 of the owner-requested review against the reference image: the terrain was brighter than the sky, so the mountains didn't read as dark silhouettes. The owner approved the plan and chose option **(a) moderate**: foreground and valley floor about 14, mountains about 18–20 (0–255 luma).

## What changed

- **Terrain shader** (`material.ts`): only the terrain's base shading is scaled down, meaning the base colour, sun-facing steps, warm fill, bank fill and bank depth tint.
  - The scale is `FLOOR_VALUE` 0.36 on the valley floor and `MOUNTAIN_VALUE` 0.32 on the mountains (linear light), blended by the bank value.
  - These are untouched: the rims, sun glow, music-driven contour lights and valley waves, the distant haze, and the far fade into the night sky.
  - The burgundy hue is unchanged, only darker.
- **Tuning** (idle, measured):
  - 0.22 for the floor gave 9, darker than the target.
  - 0.45 gave 16, too close to the mountains.
  - 0.36 gives 13.5.
  - The mountains hit about 19 with 0.32 from the start.
  - The floor factor ends up above the mountains' because the floor's base light is lower to begin with.
- **Unchanged:** the sky (the nightshade sky chosen in C04), sun, glows, rims, the music mapping, camera and terrain shape.

## Results

Mean luma (0–255) by region, before (commit 6edd60d) → after, back-to-back runs with the generated song. The rim share is the bright, strongly red share of the landscape band, as in the rim-line evidence.

| Moment | Sky | Mountains left | Mountains right | Valley floor | Foreground | Rim share |
|---|---|---|---|---|---|---|
| idle | 25.8 → 25.8 | 32.1 → 19.4 | 33.4 → 19.4 | 28.3 → 13.5 | 28.3 → 13.4 | 2.22% → 1.91% |
| idle-low | 25.8 → 25.8 | 33.9 → 18.2 | 32.6 → 20.2 | 28.3 → 13.5 | 28.4 → 13.5 | 3.36% → 2.78% |
| build | 26.3 → 26.2 | 32.5 → 17.4 | 32.7 → 20.8 | 28.4 → 13.7 | 28.4 → 13.8 | 4.51% → 3.55% |
| drop | 26.7 → 26.6 | 32.8 → 18.3 | 33.2 → 21.6 | 28.3 → 13.6 | 28.7 → 14.4 | 5.05% → 4.37% |
| breakdown | 26.2 → 26.2 | 34.1 → 21.1 | 29.9 → 15.1 | 28.3 → 13.7 | 28.4 → 13.9 | 3.08% → 2.50% |

For reference, the reference image measures sky about 5, mountains about 12 and foreground about 4.

- **Targets met** at every moment and on Low: floor and foreground about 13.5–14.4, mountains 15–22 depending on the ridge in view, sky unchanged. The mountains are now darker than the sky, so they read as silhouettes with crimson rims.
- **The rim share fell about 15–20%.** The rims are unchanged, but they now add to a darker base, so fewer rim pixels reach the measure's brightness floor (R ≥ 90). They show more contrast but are a little less bright in absolute terms. Raising the rim strength slightly would restore it, if the owner wants.
- Images: `reference-before-after-drop.png` (left to right: reference, before, after), `before-`/`after-idle.png`, `-idle-low.png`, `-drop.png` and `-reduced-motion.png`.
- **GPU** (ms per frame, median of 3, two alternated pairs): Standard idle 2.41, 2.40 → 2.58, 2.32; Low idle 2.03, 1.56 → 1.66, 1.76; Standard with music 1.93, 1.83 → 1.66, 1.82. Unchanged within noise: it's one multiply per pixel. These are headless measurements.

## Checks

- PASS: 356 unit tests (including the shader-safety test), lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs`, `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Not tested: how it looks on the owner's monitor. Darkness depends a lot on the display, and the owner once found this terrain too dark; the owner's review is the check.
