# Crimson Horizon — mountain layers

2026-11-27. Item 8 of the owner-requested review against the reference image: the mountains read as one band per side rather than 3–4 distinct ranges. The owner approved the plan and chose option **(b) pronounced**: near ranges about 13, middle about 18, far about 23 (0–255 luma; the sky is 26).

## Measuring by distance

Screenshots don't carry distance, so a throwaway build (not kept) painted every mountain pixel by distance band at the still camera: near under 30 m red, middle 30–60 m green, far 60–100 m blue, floor black. That's `distance-bands-mask.png`. With reduced motion the journey stands still, so every build frames the same view, and that mask measures the real frames band by band.

Baseline (commit d442c95): **near 15.9, middle 17.9, far 23.1.**

## Deviation from the plan

The plan was to haze the farther ranges lighter after the darkening step. The measurement showed the middle and far ranges were already at target: the terrain's existing fade toward the night sky lightens them. What was missing was a darker near layer, since near and middle were only 2 apart. So instead the nearest mountains are darkened, fading out between 20 and 40 m. This meets the chosen targets with less change, and the far ridge in front of the sun needed no colour update.

## What changed

`material.ts`, terrain shader, after the darkening step: mountain colour is multiplied by `NEAR_LAYER_VALUE` (0.64, linear) under 20 m, easing to 1 by 40 m. It applies to mountains only (bank value), and leaves the rims, glows, red sun haze, music lights and night fade alone.

## Results

Per distance band, at the still camera (reduced motion), mean luma:

| Band | Before | After | Target (b) |
|---|---|---|---|
| Near (under 30 m) | 15.9 | 12.8 | about 13 |
| Middle (30–60 m) | 17.9 | 17.7 | about 18 |
| Far (60–100 m) | 23.1 | 23.1 | about 23 |

The steps between layers are now about 5 each (before: 2 and 5). Nearer ridges stand out as dark silhouettes against the range behind, and the crimson rims outline each layer. See `mountains-before-after.png` (before on top, after below) and `reference-before-after.png` (left to right: reference, before, after).

With the generated song, mean luma before (commit d442c95) → after:

| Moment | Sky | Sun region | Foreground band |
|---|---|---|---|
| idle | 25.8 → 25.8 | 50.8 → 50.8 | 13.7 → 13.2 |
| idle-low | 25.8 → 25.8 | 50.7 → 50.7 | 13.8 → 13.2 |
| build | 26.2 → 26.1 | 67.7 → 67.7 | 13.7 → 13.3 |
| drop | 26.6 → 26.6 | 83.4 → 84.8 | 14.3 → 13.7 |
| breakdown | 26.1 → 26 | 57.5 → 57.4 | 13.8 → 13.4 |

- The sky and sun are unchanged. The foreground band dips about 0.5 because the feet of the near mountains fall inside it.
- Also included: `before-`/`after-idle.png`, `-drop.png` and `-reduced-motion.png`.
- **GPU:** this round's headless timings were unusually noisy for both versions, 0.6–2.4 ms per frame: Standard idle 2.37, 0.84 → 0.84, 1.33; Low idle 0.83, 0.62 → 0.65, 1.13; music 0.63, 1.13 → 1.76, 0.64. The change is one multiply per pixel, so no measurable cost is expected or claimed.

## Checks

- PASS: 362 unit tests (including the shader-safety test), lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs`, `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Not tested: how it looks on the owner's monitor while travelling, and real songs.
