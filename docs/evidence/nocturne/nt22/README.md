# Nocturne NT22 — neon flicker

2026-11-27. Run `npm run build && node scripts/verify-nocturne-nt22.mjs <scratch-dir> <output-dir> <label>`. It is the NT21 script plus a burst of six frames at the start of the build's hi-hats.

The owner approved the NT22 plan on 2026-11-27 and chose the far-left strip.

## What was built

- **One strip with its own material** (`ArchitectureDetails.tsx`, `LightingDriver.tsx`, `visualState.ts`):
  - The far-left vertical violet strip, about 35 m ahead at z −30.3, moved from the shared `violetSecondary` material into its own `violetFlicker` material. It has the same look and the same group level.
  - Its brightness is the group's times a flicker factor that is normally exactly 1.
  - Its NT16 glow follows. The group's spill light stays steady.
- **When it flickers** (`flicker.ts`, new):
  - A stutter starts only on a treble hit that the violet response has already accepted (`violet.ts`), so there's no new music mapping.
  - The hit must reach a quarter of full strength, and the last stutter must be at least 10 s ago.
  - Never at idle, in Manual, at Reactivity 0 or with reduced motion. Switching to one of those stops a stutter at once, and a hit is never replayed.
- **Not a strobe:**
  - Three soft dips (to 20%, 50% and 25% brightness) over 0.35 s, each easing down and up over 0.09 s.
  - Never below 20%. At most three dips in any second, on one thin strip.
  - Afterwards the strip is exactly at its group level again.
- **Tuning:** a throwaway build (not kept) logged the accepted treble hits. The generated song's 35 accepted hits peaked at 0.04–0.124, so the planned half-strength minimum (0.16) never fired. A quarter strength (0.08) fires two stutters in the song, about 17 s apart.

## Results

Mean luma (0–255), before (commit dffb542) → after (NT22), back-to-back runs:

| Moment | Frame | Walls | Gate |
|---|---|---|---|
| idle | 3.59 → 3.59 | 2.36 → 2.36 | 15.55 → 15.56 |
| idle-low | 3.56 → 3.56 | 2.36 → 2.36 | 15.42 → 15.42 |
| manual-all-on | 64.86 → 64.86 | 28.48 → 28.45 | 169.3 → 169.21 |
| manual-reduced-motion | 64.27 → 64.27 | 28.21 → 28.21 | 167.92 → 167.92 |
| build | 12.07 → 12.04 | 4.66 → 4.69 | 19.08 → 18.95 |
| drop | 13.75 → 13.23 | 5.21 → 5.07 | 26.51 → 26.45 |
| breakdown | 5.95 → 6.02 | 3.23 → 3.26 | 16.15 → 16.13 |

Full numbers, including the six `flicker-*` and six `ripple-*` frames, are in `before-capture.json` and `after-capture.json`.

- **The strip split changes nothing:** `after-manual-reduced-motion.png` is pixel-identical to `before-manual-reduced-motion.png` (0 differing pixels). Nothing animates there, so any change in the strip's look would show.
- **The flicker itself is not in a capture.** Each stutter lasts 0.35 s, and screenshots take longer than that. The six `flicker-*` frames don't catch it, and the numbers above match within capture timing. Its behaviour rests on:
  - the unit tests below;
  - the logging run, which recorded two stutters during the generated song, 16.75 s apart.
- **GPU** (ms per frame, median of 3, two alternated before/after pairs):

| | Before | After |
|---|---|---|
| Standard idle | 4.83, 4.77 | 4.88, 4.12 |
| Low idle | 3.84, 4.06 | 3.97, 3.94 |
| Standard with music | 4.04, 2.25* | 3.75, 4.24 |

  *An outlier run. No measurable change: the stutter is one material's brightness. These are headless measurements, not native-window certification.

## Checks

- PASS: 355 unit tests, 5 new in `tests/nocturneFlicker.test.mjs`. These drive the real visual state with treble events:
  - a strong accepted hit starts one stutter, then the strip is exactly steady; weak hits and other bands start none;
  - stutters stay at least 10 s apart under a hit every half second;
  - nothing in Manual, at Reactivity 0 or with reduced motion; switching stops a stutter, and a hit is never replayed;
  - the pattern stays above 20%, changes gradually and has at most 3 dips a second;
  - the strip follows its group times the factor, and equals it when steady.
- PASS: lint, typecheck, build, whitespace, `verify-nocturne-nt22.mjs` (0 runtime errors in all four runs), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.

## Not tested

- How the stutter looks and feels in a native window with real music. The owner's review is the check; watch the far-left violet strip during hi-hat-heavy passages.
- Songs with very soft treble may never reach the quarter-strength minimum, so the strip stays steady.
