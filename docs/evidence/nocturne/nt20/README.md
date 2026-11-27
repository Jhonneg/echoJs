# Nocturne NT20 — puddle ripples on bass hits

2026-11-27. Run `npm run build && node scripts/verify-nocturne-nt20.mjs <scratch-dir> <output-dir> <label>`. It is the NT19 script plus a burst of six frames in the drop, starting just before a kick, since a single still easily misses a ring.

The owner approved the NT20 plan on 2026-11-27.

## What was built

- **Ripple state** (`ripples.ts`, called from `visualState.ts`):
  - A ring starts only on a bass hit that the main magenta response has already accepted (`magenta.ts`). That's a fresh low onset, gated by Reactivity, Manual and reduced motion, so the ripples land with the magenta pulse and add no new music mapping.
  - A hit at or above 35% of full strength starts 2 rings, or 3 for a strong one (60% or more), 0.09 s apart.
  - Spots come from a fixed rotation of 8 floor points.
  - A ring grows to 1 m over 1.2 s while fading. At most 6 run at once, and the oldest is replaced.
  - Rings clear in Manual, at Reactivity 0 and with reduced motion, and a hit is never replayed.
- **Floor shader** (`WetGround.tsx`, fed through `LightingDriver.tsx`):
  - Each ring bends the reflection radially around it, so the NT16 streaks wobble where it passes.
  - The ring's crest catches the colour of what it reflects, so it shows nothing on unlit water.
  - The effect is strongest in the existing puddles, at 30% on the thin wet film.
  - With no active ring the shader skips it entirely.
- **Changes during tuning** (found with throwaway builds that logged the ring state; none kept):
  - *Weak onsets crowded out the kicks.* Every accepted bass onset started rings, including the bass line's weak ones (peaks 0.007–0.07 against the kicks' 0.42). These filled the pool with near-invisible rings and pushed out each kick's rings within a fraction of a second. Hence the 35% minimum.
  - *Far rings were invisible.* The floor beyond about 15 m is seen at about 5°, so a ring there flattens to a few pixels. The spots now lie on the reflections of the four nearest wall fixtures, 4–17 m ahead, plus one on the gate's.

## Results

Mean luma (0–255), before (commit 21eeb50) → after (NT20), back-to-back runs. The rain makes no two frames identical, so small differences are capture timing:

| Moment | Frame | Floor | Gate |
|---|---|---|---|
| idle | 3.58 → 3.58 | 4.7 → 4.7 | 15.51 → 15.51 |
| idle-low | 3.55 → 3.55 | 4.66 → 4.65 | 15.37 → 15.37 |
| manual-all-on | 64.72 → 64.73 | 48.39 → 48.46 | 169.25 → 169.17 |
| manual-reduced-motion | 64.19 → 64.19 | 47.77 → 47.77 | 167.91 → 167.91 |
| drop | 13.61 → 12.82 | 9.99 → 9.6 | 27.54 → 26.2 |
| ripple-1 | 11.67 → 12.56 | 8.83 → 9.4 | 27.26 → 27.7 |
| ripple-4 | 9.08 → 13.97 | 7.44 → 10.51 | 24.84 → 26.48 |
| breakdown | 5.94 → 5.94 | 5.37 → 5.37 | 16.1 → 16.08 |

Full numbers, including the other ripple frames, are in `before-capture.json` and `after-capture.json`.

- **Ripples:**
  - `after-ripple-1.png` catches a fresh ring at the near-left spot, bending the magenta reflection streak.
  - `after-ripple-2.png` shows it fading, and later frames show faint rings farther back.
  - They are small and brief by design.
  - Rings only show where a reflection lies, so in dim passages they barely register.
- **Idle** is unchanged: there are no hits, so no rings.
- **Reduced motion:** `after-manual-reduced-motion.png` is pixel-identical to `before-manual-reduced-motion.png` (0 differing pixels).
- **GPU** (ms per frame, median of 3, two alternated before/after pairs):

| | Before | After |
|---|---|---|
| Standard idle | 5.03, 5.01 | 5.04, 3.99 |
| Low idle | 3.68, 3.80 | 3.70, 3.88 |
| Standard with music | 3.93, 4.03 | 4.25, 4.05 |

  No measurable change beyond run-to-run noise. The ring loop runs only while a ring is active. These are headless measurements, not native-window certification.

## Checks

- PASS: 347 unit tests, 4 new in `tests/nocturneRipples.test.mjs`. These drive the real visual state with bass events:
  - an accepted hit starts rings at the listed spots, in sync with the magenta accent, and other bands start none;
  - weak hits start none and don't displace a kick's rings;
  - rings expire, and the pool limit holds;
  - Manual, Reactivity 0 and reduced motion start or clear all rings, with no replay;
  - the ring growth and fade, and the fixed rotation.
- PASS: lint, typecheck, build, whitespace, `verify-nocturne-nt20.mjs` (0 runtime errors in all four runs), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.

## Not tested

- Whether the ripples feel in time with real music, and their motion in a native window. Still frames only catch moments, so the owner's review is the check.
- Real songs whose kicks are weaker than the generated song's may start fewer rings, because of the 35% minimum.
