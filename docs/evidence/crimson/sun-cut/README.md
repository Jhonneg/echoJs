# Crimson Horizon — the flat cut under the sun

2026-11-27. Item 6 of the owner-requested review against the reference image. The owner approved the plan and chose option **(b)**, coverage like the reference: peaks covering about 20–30% of the visible disc, with a V where the valley opens.

## Cause

- The sun stays 88 m ahead of the camera, and its disc dips below ground level.
- The valley floor in front of it, about 80 m away, is flat and mostly faded into the sky colour, so it cut the disc with a straight line.
- The terrain streams past while the sun stays put, so the terrain can't hold permanent peaks in front of the sun.

## What changed

- **`ridgeline.ts` (new):** the ridge profile and geometry helpers, with no three.js.
  - Seventeen peaks, defined where they appear against the sun's disc, joined by straight segments like the faceted mountains.
  - The outline is projected from the camera onto a plane 75 m ahead, in front of the sun sphere (its front is at 78.8 m).
  - `discCoverage()` measures how much of the currently visible disc, above the far floor's line, the outline covers: **25.1%**.
  - The highest point under the disc is 5.69, below the sun's centre at 6, so the top half stays clear.
  - The ends drop low and extend well beyond the disc, where they tuck behind the side mountains.
- **`CrimsonHorizonScene.tsx`:** a `Ridge` mesh (one strip, 75 m ahead, travelling with the camera like the sun) with its own small shader:
  - a dark base matched to the far mountains beside the sun (sampled from the darker-values build);
  - a thin crimson backlit rim on the outline;
  - the magenta sun-base glow near the centre.
  - Both glows follow the sun's existing activity, so there's no new music mapping. It is static, so reduced motion needs nothing.
- **Unchanged:** the sun, glows, terrain rims, darker values, music mapping and camera.

## Results

Before (commit fab9072) → after, back-to-back runs with the generated song. Mean luma (0–255):

| Moment | Sky | Sun region | Mountains (left) | Foreground |
|---|---|---|---|---|
| idle | 25.8 → 25.8 | 55.7 → 50.8 | 19 → 19.4 | 13.3 → 13.4 |
| idle-low | 25.8 → 25.8 | 55.6 → 50.7 | 18.2 → 18.2 | 13.3 → 13.5 |
| build | 26.2 → 26.3 | 74.3 → 67.6 | 17 → 17.5 | 14 → 13.8 |
| drop | 26.6 → 26.6 | 94.9 → 87.1 | 18.7 → 18.2 | 14.3 → 14.3 |
| breakdown | 26.2 → 26.2 | 63.6 → 57.5 | 20.3 → 21.1 | 14 → 13.9 |

- The sun region's mean drops about 9% because the ridge now covers part of the disc, as intended. Everything else is unchanged.
- `sun-base-zoom-before-after.png` shows the still view, before on top and after below: the straight cut is replaced by overlapping peaks with a V and crimson rims.
- `reference-before-after-drop.png` shows, left to right, the reference, before and after.
- Also included: `before-`/`after-idle.png`, `-idle-low.png`, `-drop.png` and `-reduced-motion.png`.
- **Side effect:** the stacked glow bands under the sun in the drop (review item 9) are partly hidden behind the ridge now. One band remains at the floor line.
- **GPU** (ms per frame, median of 3, two alternated pairs): Standard idle 2.28, 1.35 → 2.36, 1.29; Low idle 1.54, 1.51 → 1.49, 1.60; Standard with music 1.88, 0.93 → 1.12, 1.89. Within noise: one extra small mesh. These are headless measurements.

## Checks

- PASS: 359 unit tests, 3 new in `tests/crimsonRidgeline.test.mjs`:
  - coverage stays within 20–30%, the top half stays clear, there's a V at the centre and peaks overlap both sides;
  - the ridge sits in front of the sun sphere, with low, wide ends;
  - the strip is closed and the same every time, with the bottom below the floor and every peak kept sharp.
- The new ridge shader has no `pow()`, so the shader-safety test doesn't apply to it.
- PASS: lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs`, `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Not tested:
  - the look in a native window with mouse parallax. The ridge (75 m) and the sun (88 m) are both far away, so their relative shift is small; the owner's review is the check;
  - real songs.
