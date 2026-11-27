# Nocturne NT21 — vent steam

2026-11-27. Run `npm run build && node scripts/verify-nocturne-nt21.mjs <scratch-dir> <output-dir> <label>`. It is the NT20 script plus two extra frames: a second Manual all-on frame 4 s later, to show the slow motion, and a second reduced-motion frame 3 s later, which must be identical.

The owner approved the NT21 plan on 2026-11-27 and chose that the plumes **freeze** with reduced motion.

## What was built

- **Steam** (`steam.ts`, `Steam.tsx`):
  - Three plumes from existing wall vents (`ArchitectureDetails.tsx`), each beside a different light:
    - left, z −8.9, by the left cyan panel;
    - right, z −20.9, by a magenta fixture;
    - left, z −28.9, by another magenta fixture.
  - Each plume is one soft sheet, 1.1 × 2.6 m, turned to face the camera about the vertical axis.
  - Its outline is narrow at the vent and leans toward the wall there, then widens and thins as it rises, fading to nothing at the bottom, top and sides.
  - Billowing noise scrolls slowly upward through it (4 noise layers on Standard, 2 on Low).
  - The noise repeats every 64 cells, and the scroll wraps on that period, so long sessions stay smooth with no seam.
- **Lighting:**
  - Each plume takes the colour and current brightness of the nearby lights (the seven spill lights and the gate), plus a faint cool base.
  - It brightens with the music only because the lights do, so there's no new music mapping.
  - At idle the plumes are faint wisps.
- **Reduced motion:** the plumes freeze at a fixed still frame instead of disappearing.
- **Kept out of other passes:** the steam is on its own layer (5), seen only by the main camera, so it isn't in the wet-floor reflection. `Glow.tsx` hides it in the glow pass, as it does the rain and haze.
- **Shared light gathering** (`sceneLights.ts`, new): the code that collects the scene's lights for a shader moved out of `Rain.tsx` and is now used by both the rain and the steam. The rain's math and settings are unchanged.
- **Tuning:**
  - The first brightness (light gain 0.006) left the plumes invisible.
  - A 5× test showed the shape but greyed them with the base light.
  - The final setting is a base of 0.012 and a light gain of 0.02: faint in the dark, clear where lit.

## Results

Mean luma (0–255), before (commit 1858951) → after (NT21), back-to-back runs. The rain and ripples make song frames differ run to run:

| Moment | Frame | Walls | Floor | Gate |
|---|---|---|---|---|
| idle | 3.58 → 3.59 | 2.36 → 2.36 | 4.7 → 4.72 | 15.51 → 15.56 |
| idle-low | 3.55 → 3.56 | 2.36 → 2.36 | 4.66 → 4.68 | 15.37 → 15.42 |
| manual-all-on | 64.72 → 64.86 | 28.38 → 28.45 | 48.41 → 48.39 | 169.51 → 169.44 |
| manual-reduced-motion | 64.19 → 64.27 | 28.21 → 28.21 | 47.77 → 47.78 | 167.91 → 167.92 |
| build | 11.7 → 11.83 | 4.59 → 4.65 | 6.9 → 7.05 | 19.18 → 19.17 |
| drop | 13.25 → 12.79 | 5.09 → 4.92 | 9.77 → 9.47 | 26.25 → 26.1 |
| breakdown | 5.94 → 5.95 | 3.25 → 3.26 | 5.39 → 5.41 | 16.1 → 16.19 |

Full numbers are in `before-capture.json` and `after-capture.json`.

- **Looks:**
  - The steam is soft and faint by design.
  - In `after-manual-all-on.png` the near plume rises beside the cyan panel.
  - Comparing it with `after-manual-all-on-later.png` (4 s later), about 5,000 pixels differ: that's the slow drift.
  - During the song the plumes stay faint wisps by the vents.
- **Reduced motion:** `after-manual-reduced-motion.png` and `after-manual-reduced-motion-later.png` (3 s apart) are pixel-identical (0 differing pixels): the steam is frozen, and there's no rain or ripples. The frozen wisps add a little light compared with before (64.19 → 64.27).
- **GPU** (ms per frame, median of 3, two alternated before/after pairs):

| | Before | After |
|---|---|---|
| Standard idle | 4.71, 4.74 | 5.04, 4.80 |
| Low idle | 3.85, 3.77 | 3.88, 3.93 |
| Standard with music | 4.64, 3.95 | 4.30, 4.25 |

  Perhaps +0.2 ms on Standard at idle, within run-to-run noise. Low and music are unchanged within noise. These are headless measurements, not native-window certification.

## Checks

- PASS: 350 unit tests, 3 new in `tests/nocturneSteam.test.mjs`:
  - the plumes sit at existing vents, off the wall, in front of the distance fade, one per vent;
  - the outline is zero at the bottom, top and sides, dense along its leaning centreline, and straighter near the top;
  - the drift wraps continuously to the noise period, checked over 10 minutes and 5 hours;
  - reduced motion freezes the plumes at a fixed frame.
- PASS: lint, typecheck, build, whitespace, `verify-nocturne-nt21.mjs` (0 runtime errors in all four runs), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Rain refactor: the same falloff, gain and base as before, moved into `sceneLights.ts`. Rain frames can't be compared pixel for pixel because the rain animates. It looks the same in the captures, and its reduced-motion behaviour is unchanged.

## Not tested

- How the drift looks in a native window, and with real songs. Still frames only hint at motion, so the owner's review is the check.
