# Crimson Horizon — two rendering defects fixed

2026-11-27. These turned up in an owner-requested review of Crimson Horizon against its reference image. The owner approved fixing both. Nothing else in the scene changed.

## 1. Dotted dark lines along the valley floor

- **Symptom:** two broken lines of dark pixels ran from the valley centre down to the bottom corners. They sat about 5.5 m either side of the valley's centre, where the floor turns into the mountain slopes.
- **Cause:**
  - The terrain shader (`material.ts`) computed `pow(vFeatures.z, 1.5)` in two places, for the crest highlights and the music-driven contour mask.
  - `vFeatures.z` is the bank value, exactly 0 on the valley floor. Interpolating it across the triangles at the floor's edge can produce a value a hair below zero.
  - `pow()` of a negative number is NaN on GPUs, so those pixels rendered dark, and antialiasing smeared them into dotted lines.
- **How it was found:** throwaway builds (not kept) switched shader terms off one at a time and counted pixels at least 18% darker than their 5×5 neighbourhood:

| Variant | Dots |
|---|---|
| Unchanged | 142 |
| Flat terrain colour / base shading only | 0 |
| Stepped shading, ridge lines, or bank fill removed | 142 |
| Stop after the bank terms (before the crest highlights) | 0 |
| Stop before the haze (after the crest highlights) | 142 |
| Clamp the bank value before `pow` | 0 |

  Removing the ridge lines alone didn't help, because the second `pow`, in the music-driven contour mask, still produced dots.
- **Fix:** `pow(max(vFeatures.z, 0.0), 1.5)` in both places.

## 2. Banding in the sky

- **Symptom:** the dark purple sky gradient showed visible horizontal steps.
- **Cause:** the sky shader wrote a dark, slowly changing gradient straight to 8-bit output, with no dithering.
- **Fix:** the sky material uses three.js's built-in dithering (`dithering` on the material, plus `#include <common>`, `<dithering_pars_fragment>` and `<dithering_fragment>` in the sky shader).
- **A mistake caught in testing:** the first attempt omitted `#include <common>`, where three.js defines `rand()`. The sky shader failed to compile and only the flat background colour showed. The capture harness now reports console errors, and the final build has only a pre-existing `THREE.Clock` deprecation warning.

## Results

Before = commit 9ee5930, after = this fix. Same throwaway harness: idle, reduced motion so the camera is still, 1440×900, headless Brave on this machine's GPU.

- **Floor:** dots 142 → 0. `floor-zoom-before-after.png` shows the same spot, before on top and after below.
- **Sky:** the bands are gone, leaving a smooth gradient with fine grain. Each sky pixel differs from before by at most 1 level (0–255), which is the dither itself. `sky-zoom-before-after.png` shows before on the left and after on the right, contrast-stretched.
- **Whole frame:** only 27 pixels differ by more than 2 levels, the removed dots. `before-idle.png` and `after-idle.png`.

## Checks

- PASS: 356 unit tests. The new `tests/crimsonShaderSafety.test.mjs` requires every `pow()` in the terrain shader to take a clamped or non-negative input; it would have failed on the old shader.
- PASS: lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs` (Crimson production check), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- **APP02/APP03 scope check:** these scripts fail if source files outside their own scope change. They already ignored the Bloom and Nocturne scene folders; they now also ignore `src/scenes/crimson-horizon`, as NT16 did for Nocturne.
- Not tested: other GPUs. The NaN depended on this GPU's handling of `pow()`. The clamp is correct everywhere, but the dots may never have appeared on some hardware.
