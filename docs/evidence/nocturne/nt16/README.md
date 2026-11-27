# Nocturne NT16 — glow, wet-floor reflections and gate haze

2026-11-26. Run `npm run build && node scripts/verify-nocturne-nt16.mjs <scratch-dir> <output-dir> <label>`. It serves the production build, captures Nocturne at idle (Standard and Low) and during a generated song (intro, build, drop, breakdown) through the real file adapter and analysis, measures brightness, and times whole frames on the GPU.

The owner reviewed Nocturne against the Industrial Crossing reference board and chose items 1, 2 and 4 of the review: glow around the lights, stronger streaked floor reflections, and gate haze.

## What was built

- **Glow** (`Glow.tsx`, `effects.ts`): the approved frame is rendered exactly as before. A second render at half size (a quarter on Low) draws only the light sources, with everything else black so walls still hide what's behind them. three.js's bloom blurs it, and the blur is added over the frame.
  - The blur favours its tightest sizes (weights 1, .55, .25, .1, .04). With three.js's defaults the big right panel washed the whole frame red.
  - With every light off the glow passes are skipped.
  - **Owner feedback:** the glare on the main right magenta panel was too high. That panel now glows at 55% (`GLOW_SOURCE_GAIN`), and its haze dropped from 0.08 to 0.05. The other lights keep their full glow.
  - The whole frame isn't routed through a bloom chain, because that would move tone mapping to the end and change how the untonemapped neon fixtures look.
- **Wet floor** (`WetGround.tsx`): bright reflections also smear into long vertical streaks (13 taps on Standard, 7 on Low; longer in puddles). They raise the floor's reflectivity where they land, and run closer to the walls than the base film. Dim reflections keep the original treatment, so the idle floor is unchanged. The streak is skipped while every light is off.
- **Haze** (`Atmosphere.tsx`, `LightingDriver.tsx`):
  - Two more gate layers in front of the existing halo, plus a beam of gate light along the floor. Both follow the gate's existing colour.
  - Soft glows at the right magenta panel, the left cyan panel and the bridge underside, each following its own fixture's level.
  - No new music mapping: everything follows levels Nocturne already computes. The haze isn't drawn while every light is off.

## Results

Before and after (mean luma 0–255; before = committed version, after = NT16, same run):

| Moment | Frame | Floor | Gate | Bridge |
|---|---|---|---|---|
| idle | 3.28 → 3.28 | 4.51 → 4.51 | 5.73 → 5.73 | 7.91 → 7.91 |
| idle-low | 3.27 → 3.27 | 4.51 → 4.51 | 5.72 → 5.72 | 7.89 → 7.89 |
| intro | 6.46 → 7.01 | 5.63 → 5.72 | 11.15 → 12.37 | 10.74 → 10.85 |
| build | 8.37 → 8.89 | 6.95 → 6.77 | 14.27 → 18.33 | 12.43 → 12.27 |
| drop-hit | 8.81 → 12.49 | 7.09 → 9.13 | 14.87 → 20.1 | 6.99 → 14.73 |
| drop | 9.44 → 12.84 | 7.72 → 9.31 | 19.61 → 27.04 | 12.2 → 14.59 |
| breakdown | 5.52 → 5.72 | 5.17 → 5.29 | 12.49 → 13.78 | 10.04 → 10.1 |

- **Idle is pixel-identical** on Standard and Low (the approved resting view is preserved).
- **GPU** (ms per frame; runs alternated before/after because this machine's timings drift about ±1 ms between runs):

| | Before | After |
|---|---|---|
| Standard idle | 4.09, 5.01 | 4.91, 4.19 |
| Low idle | 3.08, 2.95 | 3.04, 2.61 |
| Standard with music | 2.55, 3.35 | 3.31, 3.48 |

  Idle is unchanged within noise. With music the cost is about +0.4 ms on Standard. Headless measurements, not native-window certification.
- Captures: `before-*.png` and `after-*.png` for idle, idle-low, intro, build, drop-hit, drop and breakdown.
- **Known limit:** the big right magenta panel doesn't reflect on screen. Its mirror image falls about 3 m in front of the camera, below the frame. That's geometrically correct; the reference board exaggerates its streaks.

## Checks

- PASS: 333 unit tests, 5 new in `tests/nocturneEffects.test.mjs`:
  - silence leaves glow and haze at zero;
  - each haze follows its fixture;
  - glow source selection and limits;
  - streak weights;
  - haze layers.

  Lint, typecheck, build and whitespace pass.
- PASS: `verify-nocturne-nt16.mjs` (0 runtime errors), `verify-app02.mjs` and `verify-app03.mjs`. Their APP-scope check now excludes `src/scenes/nocturne`, as it already did Bloom. The committed APP evidence was restored afterwards.
- Not run: the older NT02/NT03 snapshot scripts (they compare against historical source snapshots).

## Not tested

- How it looks and feels natively, with real songs. The owner's review is the check.
- Real-song balance: the generated song is bass-heavy, which favours magenta.
