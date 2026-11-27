# Lavender Peaks — softer sun glow at rest and static grain

2026-11-27. Items 6 and 7 from the owner-requested review of Lavender Peaks against its reference (the misty lavender mountains image). The owner approved both and chose static grain. In the reference, the light around the sun fades out with no ring, and the whole image has a faint mottled texture. Lavender's sun had a thin defined ring of resting corona strands, and its surfaces were perfectly clean.

## What changed

- **Sun glow at rest** (`corona.ts`, `LavenderPeaksScene.tsx`):
  - **Resting strands:** wider (`restingSoftness` 0.05) and fainter (`restingDim`, 45 % of their approved strength), with a longer outer fade (0.12, before 0.035). The ring reads as a soft halo.
  - **Music:** activity (bass envelope, detail and onsets, ×4) quickly removes both, so the approved crisp, full-strength strands return. The approved music-time values (`restingOpacity` 0.16, `maximumOpacity` 0.46) are unchanged.
  - **Sun:** its haze is wider (1.65, before 1.1; strength 0.06, before 0.055), and its disc edge is a little softer (0.65–0.78, before 0.68–0.75). Its size, position, brightness and pulse are unchanged.
- **Grain** (`grain.ts`, new, used by the sky and ridge shaders):
  - **What it is:** a faint, static, screen-fixed mottle of at most ±1.8 output levels (0–255), added after the colour-space conversion and before dithering. It's 75 % soft 6-pixel blotches and 25 % fine per-pixel grain, centred on zero, so overall brightness doesn't change.
  - **Not on the sun:** it's kept off the sun disc.
  - **Cost:** no time input, no extra pass.

## Tuning

- **Wider strands alone** made the ring broader and brighter, so it was more visible. Its resting strength was lowered until its contrast matched the old ring, spread much wider.
- **The longer outer fade** removed a faint outer boundary.
- **The grain's blotches** were enlarged from 3 to 6 pixels to match the reference's mottle.
- **The first version restored the crisp strands only gradually** with activity, and the Lavender assessment then failed its onset-bulge check (`onset.length>=5`). Softening is now cleared at about a quarter of full activity, and the music-time strength is back to its approved value. The assessment then passed twice in a row.
- **One failed run is unexplained:** the run just after that fix also failed the same check, and I didn't inspect that capture. The next two full runs captured 8 and 9 onset frames (all with the bulge present) and passed.

## Results

- **Glow profile:** brightness straight above the sun (green channel, 2-pixel steps from the disc edge upward), measured as the ring's rise over the dip between disc and ring.
  - **Before:** a +2.6 bump about 4 pixels wide, a thin line.
  - **After:** a +1.9 bump spread over about 16 pixels, a gradual halo.
- **Grain:** mean fine-texture deviation in a flat sky patch (difference from a 6-pixel blur) is 0.48 levels after, 0.21 before (dithering only), and 0.43 in the reference.
- **Images:**
  - `sun-before-after.png`: sun close-up, before (left) and after (right).
  - `grain-reference-before-after-stretched.png`: flat sky, contrast-stretched; left to right, the reference, before and after.
  - `before-still.png` / `after-still.png`: the still view.
  - `music-moderate.png` / `music-strong.png`: with the generated song, from the Lavender browser check. The crisp strands are back.

## Checks

- PASS: 369 unit tests. `tests/lavenderSoftening.test.mjs` (2 new tests) checks:
  - the grain is at most 2 levels, centred, mostly blotches, screen-fixed and static;
  - the approved music-time corona values are unchanged;
  - the softening and dimming apply at rest and fade out with activity.

  Lint, typecheck, build and whitespace pass.
- `verify-lavender-corona-noise.mjs` with `assess-lavender-corona-noise.mjs`:
  - FAIL with the first, gradual version.
  - FAIL once, unexplained, just after the fix.
  - PASS twice with the final code ("Silhouette acceptance targets passed", all five shape targets met).

  Committed evidence was restored afterwards.
- PASS: `verify-app02.mjs` and `verify-app03.mjs` on the final code. Committed evidence was restored afterwards.
- Not tested: static grain while the ridges travel (only stills were checked), the owner's monitor, real songs, portrait framing, devices with pixel ratio 2 (the grain's blotches would be half the size), GPU time.
