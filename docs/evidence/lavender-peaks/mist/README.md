# Lavender Peaks — sky banding fix and layer mist

2026-11-27. From an owner-requested review of Lavender Peaks against its reference (the `h4Wq72…` misty lavender mountains image). The owner approved fixing the banding and adding mist between layers, with option **(b)**, mist like the reference.

## What changed

- **Banding** (`LavenderPeaksScene.tsx`):
  - The sky shader now uses three.js's built-in dithering (`<common>`, the dithering chunks and `dithering` on the material).
  - The ridge shader does too, because the new mist gradients showed faint steps under a contrast stretch.
  - Each pixel moves by at most 1 level.
- **Layer mist** (`atmosphere.ts`): a steady pale lavender mist lies in horizontal bands at the foot of each ridge and fades upward, slightly warmer toward the sun. The nearer ridges hide everything below their own outlines, so each farther layer dissolves into haze where the nearer ones cross it.
  - **Strength by ridge, far to near:** 0.62, 0.56, 0.48, 0.40, 0.32, and none on the frontmost ridge. That's aerial perspective.
  - **Height:** full up to 0.3 units above the ridge's base line, then fading with a 1.1-unit falloff.
  - **Helpers:** `LAYER_MIST` and `layerMist()` are the tested twin of the shader.
  - **Unchanged:** the existing music-driven valley mist stays on top, so there's no change to the music mapping. The sun, corona, ridge motion, colours and camera are untouched.
- **Tuning:** a first version measured the mist from the outline of the ridge in front. It followed the steep jagged flanks and drew tall vertical columns, so the mist is now measured from each ridge's own base line, which gives horizontal bands as in the reference.

## Results

- **Mist by layer.** A throwaway build painted each ridge a flat grey (`ridge-mask.png`), so every pixel could be assigned to its ridge at the still camera. For each ridge, the "foot band" is the 30 px just above where a nearer ridge cuts it off, and the "upper part" is more than 80 px above. Mean luma, foot / upper:

| Ridge (far → near) | Before | After |
|---|---|---|
| 1 | 194.6 / 187.8 | 218.3 / 197.5 |
| 2 | 180.1 / 172.8 | 209.9 / 186.4 |
| 3 | 169.6 / 161.5 | 202.3 / 180.7 |
| 4 | 157.3 / 145.4 | 195.3 / 165.5 |
| 5 | 138.9 / 130.4 | 178.5 / 149.2 |
| 6 (front) | 123.1 / – | 123.1 / – |

  Each layer's foot is now 20–30 brighter than its upper part (before: 7–12), so the layers separate with mist. The front ridge is unchanged.
- **Banding:** the sky's largest per-pixel change is 1 level, and its bands are gone (`sky-zoom-before-after.png`, contrast-stretched). The ridge gradients are smooth under the same stretch.
- **Images:**
  - `reference-before-after.png`: left to right, the reference, before and after.
  - `before-`/`after-still.png`: the still view.
  - `before-`/`after-idle.png` and `-drop.png`: with the generated song.
- **GPU** (ms per frame, median of 3, two alternated pairs): Standard idle 1.85, 1.90 → 2.07, 1.86; Low idle 1.04, 1.05 → 2.57, 1.22; Standard with music 1.15, 1.81 → 2.03, 0.70. Noisy this round in both versions, with no consistent change. These are headless measurements.

## Checks

- PASS: 362 unit tests. A new test in `tests/lavenderAtmosphere.test.mjs` checks that the mist is weaker on nearer ridges, zero on the front ridge, full at the base and fading upward, and that the shader applies it. Lint, typecheck, build and whitespace pass.
- PASS: the current Lavender gate, `verify-lavender-corona-noise.mjs` ("browser capture passed"), and `assess-lavender-corona-noise.mjs` ("Silhouette acceptance targets passed"). Their committed evidence was restored afterwards. `verify-lavender-lp07.mjs` refuses to run because it's historical since the corona refinement and points to the corona-noise gate.
- PASS: `verify-app02.mjs` and `verify-app03.mjs`. Their scope guard now ignores `src/scenes/lavender-peaks`, as for Bloom, Nocturne and Crimson. The committed APP evidence was restored afterwards.
- Not tested: the owner's monitor, real songs.
