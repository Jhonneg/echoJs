# Nocturne NT17 — skyline and treble layer

2026-11-27. Run `npm run build && node scripts/verify-nocturne-nt17.mjs <scratch-dir> <output-dir> <label>`. It is the NT16 script with two additions: a Manual preview capture with every light group on, and the sky strip above the bridge (`sky`) among the measured regions.

NT17 is the first phase of [the NT17–NT23 roadmap](../../../NOCTUNE_NT17_ROADMAP.md), approved by the owner on 2026-11-27.

## What was built

- **Distant skyline** (`skyline.ts`, `Skyline.tsx`):
  - Six tower blocks beyond the back wall (z −62 to −88, 27–46 m tall). From the camera the sky shows only in a strip about 140 px wide above the bridge. The four middle towers are staggered there with gaps, so they read as silhouettes against the glow.
  - 18% of window cells are lit, chosen by a fixed hash, so they're the same on every visit. They use dim cool white, sodium and cyan tints.
  - A faint violet-blue glow behind the towers fades upward.
  - The towers stand past the fog's far end (74 m), so they're drawn without fog in authored dim colours.
  - Everything is static, so the skyline looks the same at idle and with music.
  - Windows and towers aren't glow sources. In the NT16 glow pass they draw black and only hide what is behind them.
- **Violet strips** (`ArchitectureDetails.tsx`):
  - Each vertical strip is 5 m long (was 3.05 m) and wider (9 cm, was 4.5 cm), on a matching steel channel.
  - One 1.35 m angled accent per fixture bay (three per side), at 8.35 m between the window rows. There, the far accents show below the bridge and the nearer ones above it.
  - Accents join the existing `violet` and `violetSecondary` groups, so the NT13 treble response drives them unchanged: the same levels and the same alternating-side flashes.
- **Magenta bridge tubes** (`ArchitectureDetails.tsx`):
  - The two diffusers under the bridge are 2.6 m each (were 1.15 m), still split into thirds.
  - A thin tube along the bridge's front edge is split into the same six sections.
  - The high-note bridge travel effect keeps its timing and its left-to-right order. It now covers most of the bridge.
- No change to the camera, parallax, the two main fixtures, colours, spill, the music mapping or the NT16 effects.

## Results

Mean luma (0–255), before (commit 426d92f) → after (NT17). Same script, back-to-back runs:

| Moment | Frame | Walls | Floor | Gate | Bridge | Sky |
|---|---|---|---|---|---|---|
| idle | 3.28 → 3.29 | 2.36 → 2.36 | 4.51 → 4.51 | 5.73 → 5.73 | 7.91 → 7.76 | 4.71 → 5.16 |
| idle-low | 3.27 → 3.28 | 2.35 → 2.36 | 4.51 → 4.51 | 5.72 → 5.72 | 7.89 → 7.73 | 4.69 → 5.14 |
| manual-all-on | 66.08 → 68.04 | 28.82 → 29.32 | 48.26 → 48.62 | 168.99 → 169.12 | 107.29 → 118.35 | 87.18 → 90.53 |
| intro | 6.91 → 6.9 | 3.68 → 3.67 | 5.67 → 5.65 | 12.33 → 12.36 | 10.8 → 10.68 | 5.87 → 6.32 |
| build | 8.82 → 8.91 | 4.54 → 4.56 | 6.75 → 6.73 | 18.33 → 18.41 | 12.31 → 12.26 | 6.31 → 6.77 |
| drop-hit | 12.67 → 15.84 | 5.2 → 6.43 | 9.28 → 11.63 | 20.18 → 21.39 | 14.94 → 17.55 | 7.11 → 8.6 |
| drop | 12.76 → 12.35 | 4.81 → 4.77 | 9.26 → 9.11 | 27 → 25.63 | 14.57 → 14.45 | 6.96 → 7.41 |
| breakdown | 5.72 → 5.65 | 3.24 → 3.22 | 5.28 → 5.25 | 13.77 → 13.77 | 10.1 → 9.95 | 5.68 → 6.13 |

- **Idle** gains the skyline (sky strip 4.71 → 5.16). The rest of the frame is unchanged except the bridge region (7.91 → 7.76). That region now has the dark tower silhouettes and the longer diffuser housings behind the railing. This was the only planned change to the resting view.
- **Manual, all on**: the bridge region brightens most (107 → 118) from the longer tubes.
- **With music**, single moments vary with when a flash happens to land. For example, drop-hit is brighter with NT17 and drop slightly dimmer, because the song is the same but the capture moment isn't frame-exact. In the drop-hit frame the longer bridge tubes and the strips light.
- **GPU** (ms per frame, median of 3; two before/after pairs alternated, since this machine drifts by up to about 1 ms between runs):

| | Before | After |
|---|---|---|
| Standard idle | 4.35, 4.07 | 4.33, 4.29 |
| Low idle | 3.25, 2.73 | 3.21, 2.96 |
| Standard with music | 3.68, 3.68 | 3.68, 4.07 |

  No cost is measurable beyond run-to-run noise. The skyline adds 8 draw calls and no per-frame work. These are headless measurements, not native-window certification.
- Captures: `before-*.png` and `after-*.png` for idle, idle-low, manual-all-on, intro, build, drop-hit, drop and breakdown.

## Checks

- PASS: 336 unit tests, 3 new in `tests/nocturneSkyline.test.mjs`:
  - the layout is the same every run, and the lit share stays within its bounds;
  - the towers stand beyond the back wall and inside the camera's far plane, with the glow behind them;
  - every lit window sits on its tower's face, below the roof.

  Lint, typecheck, build and whitespace pass.
- PASS: `verify-nocturne-nt17.mjs` (0 runtime errors in all four runs), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Not unit-tested: the violet and bridge geometry lives in the `ArchitectureDetails.tsx` component, so it is checked by the captures only.

## Not tested

- The native look, real songs, and the owner's GPU (NT23). The owner's review is the check.
- The generated song is bass-heavy, so the violet treble layer shows only briefly in the song captures. `after-manual-all-on.png` shows it at full level.
