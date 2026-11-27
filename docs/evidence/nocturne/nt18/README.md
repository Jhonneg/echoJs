# Nocturne NT18 — cyan balance and idle focal point

2026-11-27. Run `npm run build && node scripts/verify-nocturne-nt18.mjs <scratch-dir> <output-dir> <label>`. It is the NT17 script plus a hue measurement: the share of the scene's pixels (above luma 25) that are cyan or magenta.

The owner approved NT18 on 2026-11-27. It changes two choices approved in NT13: the cyan/magenta balance and the dark resting view. The owner also chose that the gate floor shows in every mode, including Manual "All off".

## What was built

- **Brighter cyan windows** (`visualState.ts`, `effects.ts`):
  - In Audio each window's own glow is doubled (`CYAN_WINDOW_EMISSION_GAIN`), but never above 0.7 (`CYAN_WINDOW_EMISSION_CAP`). The windows skip tone mapping, so above about 0.77 the cyan clips to flat colour.
  - A level already above the cap is left as it was.
  - Their channel level, wall spill, timing, accents and source bands are unchanged, so the walls don't wash cyan.
  - Silence still leaves them dark, and Manual's levels are unchanged.
- **Review fix (owner request, 2026-11-27):**
  - The first version doubled the windows up to full. The near, upper panes clipped to (9, 255, 255), and their NT16 glow filled the mullions, so each window read as one flat slab.
  - The cap above, plus the window panes' NT16 glow at 60% (`GLOW_SOURCE_GAIN`, as for the main magenta panel), brings the grid back. The panes now sit at about (9, 213, 239), and the mullions are darker: 95 instead of 133 green.
  - A trial at 80% glow clipped again, (9, 251, 255).
  - The cost is a smaller cyan gain (see Results). The lower glow also applies in Manual.
- **Cleaner cyan** (`ArchitectureDetails.tsx`): the window panes' surface colour is black, so the magenta spill no longer tints them pink. They show only their own cyan.
- **Gate floor** (`visualState.ts`):
  - The gate's level and colour never drop below `GATE_FLOOR` = 0.08, in the gate's usual cool mix. That's about a third of its level during the generated song's drop.
  - The halo layers and the floor beam share the gate's colour, so they get the same faint floor.
  - The music raises it exactly as before. The depth light and fog are unchanged.
  - Because the gate is always slightly lit, the NT16 glow and floor-streak passes now run at idle too. The fixture haze stays at zero.
  - The floor is constant, so reduced motion needs nothing extra.
- I planned the floor for `LightingDriver.tsx` and `effects.ts`, but put it in `visualState.ts`, where the gate's colour is computed. The behaviour is the same as planned. `effects.ts` only had its comments updated.

## Results

Before (commit ac0c90c) → after (NT18 with the review fix), back-to-back runs. Luma is 0–255. Cyan and magenta are percentages of the frame's pixels:

| Moment | Frame | Floor | Gate | Cyan % | Magenta % |
|---|---|---|---|---|---|
| idle | 3.29 → 3.55 | 4.51 → 4.64 | 5.73 → 15.33 | 0.01 → 0.31 | 0 → 0 |
| idle-low | 3.28 → 3.54 | 4.51 → 4.63 | 5.72 → 15.32 | 0.01 → 0.31 | 0 → 0 |
| manual-all-on | 68.04 → 64.19 | 48.62 → 47.77 | 169.13 → 167.91 | 27.78 → 24.97 | 30.89 → 32.06 |
| intro | 6.89 → 7.3 | 5.65 → 5.78 | 12.33 → 15.92 | 1.92 → 2.08 | 2.09 → 2.21 |
| build | 9.34 → 12.19 | 7.23 → 7.33 | 18.14 → 18.58 | 3.01 → 5.89 | 2.59 → 2.77 |
| drop-hit | 10.76 → 11.8 | 7.88 → 8.45 | 20.59 → 21.03 | 2.55 → 2.42 | 5.24 → 6.53 |
| drop | 12.14 → 12.47 | 9.02 → 9.17 | 25.6 → 25.66 | 2.39 → 2.55 | 8.01 → 8.36 |
| breakdown | 5.71 → 5.89 | 5.27 → 5.29 | 13.78 → 15.8 | 1.48 → 1.61 | 1.53 → 1.53 |

- **Idle**: the gate region brightens from 5.7 to 15.3 as a soft cool opening with a halo and a faint reflection on the floor. The rest of the frame barely changes.
- **Playback**:
  - The panes themselves are much brighter. A near pane during the build reads (9, 213, 239), against (11, 71, 80) before.
  - By area, the cyan share only clearly rises in the build (3.01% → 5.89%). Intro and drop are about unchanged.
  - The first, uncapped version reached 9.59% in the build, mostly from clipped panes and their glow. That is the trade made for the visible grid.
  - Magenta is unchanged within capture timing.
- **Manual all on**: cyan area 27.8% → 25.0%, from the lower window glow. The levels are unchanged.
- **GPU** (ms per frame, median of 3, two alternated before/after pairs):

| | Before | After |
|---|---|---|
| Standard idle | 4.91, 3.48 | 3.92, 4.60 |
| Low idle | 2.78, 2.61 | 3.77, 3.68 |
| Standard with music | 3.24, 4.16 | 4.04, 4.01 |

  Low idle costs about +1 ms, because the glow and streak passes now run at idle. On Standard the cost is inside this run's noise (an earlier pair measured about +0.3 ms). With music it's unchanged within noise. These are headless measurements, not native-window certification.
- Captures: `before-*.png` and `after-*.png` for idle, idle-low, manual-all-on, intro, build, drop-hit, drop and breakdown.

## Checks

- PASS: 339 unit tests, 3 new in `tests/nocturneBalance.test.mjs`:
  - window emission gain and the cap below clipping, with spill unchanged;
  - silent windows stay dark, and Manual is unchanged;
  - the gate floor is constant in Audio and Manual "All off", with no depth light or fog change, and the music still lifts the gate.
- Four older assertions that encoded the fully dark idle now expect the gate floor, as approved: the NT16 silence test, two `nocturneVisualState` tests and the NT12 matrix silence case.
- PASS: lint, typecheck, build, whitespace, `verify-nocturne-nt18.mjs` (0 runtime errors in every run), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.

## Not tested

- The native look, real songs, and the owner's GPU, where the idle cost matters (NT23). The owner's review is the check.
