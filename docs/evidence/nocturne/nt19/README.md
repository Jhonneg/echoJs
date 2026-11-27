# Nocturne NT19 — light rain

2026-11-27. Run `npm run build && node scripts/verify-nocturne-nt19.mjs <scratch-dir> <output-dir> <label>`. It is the NT18 script plus a Manual all-on capture with reduced motion emulated.

The owner approved the NT19 plan on 2026-11-27 ("plan and approve").

## What was built

- **Rain** (`rain.ts`, `Rain.tsx`):
  - Thin falling streaks between the walls, from just behind the camera to 46 m deep, up to 11 m high.
  - 1,800 streaks on Standard and 700 on Low, each with its own speed (8–11 m/s) and length (0.5–0.9 m), in the same layout every visit.
  - A 0.7 m/s sideways drift makes the streaks lean slightly.
  - All of it is one instanced draw. The fall is computed on the GPU from a time uniform, so the CPU only copies eight light values per frame.
  - Streaks widen with distance to about one pixel, so far rain doesn't shimmer, and fade out beyond 30–52 m, roughly matching the fog.
- **Lit by the neon:**
  - Each streak sums the colour and current intensity of the seven fixture spill lights and the gate, with the same falloff as three.js point lights.
  - Rain near a lit fixture shows in its colour: magenta by the right panel, cyan by the windows, cool blue in front of the gate.
  - Rain in the dark is nearly invisible, with only a trace of cool base light.
  - The rain follows the lights, not the music, so there's no new music mapping.
  - At idle only the NT18 gate floor lights it, giving a faint drizzle in front of the gate.
- **Reduced motion:** the rain is hidden.
- **Kept out of the other passes:** the rain is on its own layer (4), which only the main camera sees. So it isn't drawn in the wet-floor reflection, and `Glow.tsx` hides it in the glow pass as it does the haze. That means no extra passes and no speckled glow.

## Results

Mean luma (0–255), before (commit f5a405d) → after (NT19), back-to-back runs:

| Moment | Frame | Walls | Floor | Gate | Bridge |
|---|---|---|---|---|---|
| idle | 3.55 → 3.58 | 2.36 → 2.36 | 4.64 → 4.7 | 15.33 → 15.5 | 7.77 → 7.82 |
| idle-low | 3.54 → 3.55 | 2.35 → 2.36 | 4.63 → 4.66 | 15.32 → 15.37 | 7.74 → 7.76 |
| manual-all-on | 64.19 → 64.72 | 28.21 → 28.46 | 47.77 → 48.31 | 167.91 → 169.36 | 106.32 → 107.37 |
| manual-reduced-motion | 64.19 → 64.19 | 28.21 → 28.21 | 47.77 → 47.77 | 167.91 → 167.91 | 106.32 → 106.32 |
| intro | 7.27 → 7.31 | 3.71 → 3.7 | 5.76 → 5.85 | 15.93 → 16.19 | 11.49 → 11.6 |
| build | 12.24 → 11.77 | 4.7 → 4.6 | 7.03 → 7.01 | 18.54 → 18.94 | 26.13 → 23.82 |
| drop-hit | 11.03 → 9.94 | 5.02 → 4.87 | 7.97 → 7.54 | 20.66 → 20.56 | 14.39 → 13.13 |
| drop | 13.13 → 13.15 | 5.11 → 5.03 | 9.74 → 9.73 | 25.9 → 26.16 | 15.81 → 15.84 |
| breakdown | 5.97 → 6.03 | 3.24 → 3.25 | 5.33 → 5.44 | 15.81 → 16.04 | 10.62 → 10.76 |

- **The rain is light:**
  - It adds about 0.03–0.5 luma to the frame where lights are on, and most in Manual all-on.
  - The build and drop-hit differences come from capture timing on flashes, not from the rain.
  - It shows clearly in front of lit fixtures and the gate: `after-drop.png`, `after-manual-all-on.png`.
- **Reduced motion:** `after-manual-reduced-motion.png` is pixel-identical to `before-manual-reduced-motion.png` (0 differing pixels), so the rain is fully hidden.
- **GPU** (ms per frame, median of 3, two alternated before/after pairs):

| | Before | After |
|---|---|---|
| Standard idle | 4.56, 4.91 | 4.89, 5.12 |
| Low idle | 3.91, 3.95 | 3.82, 3.70 |
| Standard with music | 3.93, 4.36 | 3.64, 4.08 |

  Standard idle is up about 0.25 ms, within this machine's run-to-run noise. Low and music show no measurable change. These are headless measurements, not native-window certification.
- Captures: `before-*.png` and `after-*.png` for idle, idle-low, manual-all-on, manual-reduced-motion, intro, build, drop-hit, drop and breakdown.

## Checks

- PASS: 343 unit tests, 4 new in `tests/nocturneRain.test.mjs`:
  - the layout is the same every run, with the per-quality counts;
  - streaks stay between the walls and inside the volume while falling and drifting (checked up to an hour of time);
  - each streak falls at its speed and wraps to the top;
  - the light falloff is monotonic and zero outside a light's range;
  - the rain is hidden with reduced motion.
- PASS: lint, typecheck, build, whitespace, `verify-nocturne-nt19.mjs` (0 runtime errors in all four runs), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.

## Not tested

- The rain's motion and feel in a native window, real songs, and the owner's GPU (NT23). Still frames don't show motion; the owner's review is the check.
