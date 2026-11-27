# Crimson Horizon — foreground leading lines

2026-11-27. Item 7 of the owner-requested review against the reference image: the lower 40% of the frame read as empty. The owner approved the plan and chose option **(b)**, clear crimson lines along the fold crests at about half the mountain rims' strength.

## Constraint

The existing test "a broad quiet valley remains" requires the valley floor to stay under 1 m within 4 m of the centre. That's an approved design rule. The old folds already peaked at about 0.98 m, so the foreground couldn't get taller dunes. The change comes from the folds' shape and light.

## What changed

- **Folds** (`terrain.ts`):
  - Each fold is broader and rounder: exponent 3, down from 8, with the same 0.7 m maximum.
  - The fold pattern is stretched along the valley (`FOLD_FREQUENCY`, x 0.12 and z 0.014; before, about 0.04 and 0.035), so the crests run in long lines that converge on the sun in perspective.
  - This changes floor geometry only; the mountains are untouched.
- **Crest lines** (`material.ts`):
  - A thin antialiased crimson line wherever the fold value crosses 0 (the crest), about 1.5 px wide (`FLOOR_LINE_PIXELS`).
  - It's drawn on the valley floor only, near and middle distance (fading out 35–60 m away).
  - Strength is 0.3 at rest plus 0.15 × the sun's activity, about half the mountain rims'.
  - The music-driven valley waves and channel are unchanged on top, so there's no new music mapping.
- **Tuning:**
  - Applying the mountains' edge-on backlight to broad crests gave a soft sheen on the right foreground, not lines. The floor is seen from above, so edge-on light is weak there.
  - Drawing the crest as a screen-width line fixed that.
  - At fold frequency 0.07 only one line crossed the floor; 0.12 gives two, from left and right, as in the reference.

## Results

Before (commit 8a20325) → after, back-to-back runs with the generated song. Mean luma (0–255). The foreground rim share is the bright, strongly red share of the foreground band (y 560–740; R ≥ 60, R > 2.2 G, R > 1.3 B).

| Moment | Sky | Mountains (left) | Foreground | Foreground rim share |
|---|---|---|---|---|
| idle | 25.8 → 25.8 | 19 → 18.8 | 13.4 → 13.9 | 0.25% → 1.51% |
| idle-low | 25.8 → 25.8 | 18.6 → 17.9 | 13.8 → 13.8 | 1.50% → 1.82% |
| build | 26.3 → 26.1 | 17.8 → 15.8 | 14.2 → 13.7 | 1.15% → 0.17% |
| drop | 26.6 → 26.6 | 18 → 17.7 | 14.3 → 14.3 | 1.13% → 1.94% |
| breakdown | 26.1 → 26.1 | 22.2 → 20.9 | 13.9 → 13.8 | 0.34% → 0.40% |

- **Single frames vary a lot.** The camera keeps travelling, so each moment frames a different stretch of valley, and the before frames include music-driven floor waves.
- **Averaged over all 14 frames per side** (two runs × seven moments), the foreground rim share rises from 1.02% to 1.55%. Frames with almost none (under 0.3%) drop from 4 to 2.
- **The lines don't show everywhere.** On some stretches no fold crest falls within the floor, so the lines come and go along the journey, which suits a landscape.
- The sky, foreground brightness and darker-values targets are unchanged. Mountain brightness varies with the stretch in view.
- `after-reduced-motion.png` shows the still view with two crimson lines sweeping from left and right toward the sun's base; compare `before-reduced-motion.png`. `reference-before-after-drop.png` shows, left to right, the reference, before and after. Also included: `before-`/`after-idle.png`, `-idle-low.png` and `-drop.png`.
- **GPU** (ms per frame, median of 3, two alternated pairs): Standard idle 2.37, 2.42 → 2.40, 2.56; Low idle 1.63, 1.54 → 1.61, 1.82; Standard with music 1.63, 1.83 → 0.77, 1.94. Within noise. These are headless measurements.

## Checks

- PASS: 362 unit tests, 3 new in `tests/crimsonFolds.test.mjs`:
  - the floor stays under 1 m over 400 m of valley;
  - fold crests run mainly along the valley (the fold value changes more than 3× faster across than along);
  - folds are the same every time, and at least 40% of 10 m stretches have a crest on the floor.
  
  The existing terrain tests (quiet valley, chunk continuity, journey) pass unchanged.
- PASS: the shader-safety test (the new line uses no `pow()`), lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs`, `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Not tested: the lines' motion as the camera travels in a native window, and real songs.
