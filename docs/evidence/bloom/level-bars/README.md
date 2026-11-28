# Bloom level bars — seam and crystals

2026-11-28. Run `npm run build && node scripts/verify-bloom-level-bars.ts <scratch-dir>`. It builds a throwaway copy exposing Bloom's music outputs, plays a generated 30 s song (quiet pad 0–8 s, loud beat with hats 8–24 s, silence) through the real file adapter and analysis, pauses at 26 s, and deletes its temporary files afterwards. Screenshots are close-ups of the monolith (centre of a 1440×900 headless Brave view).

## What was built

- **Seam:** while music plays, the seam fills from the bottom with the overall level (60% loudest band + 40% average of the six bands, through the shared knee). Rise 0.03 s, fall 0.25 s. A peak cap holds 0.6 s, then falls at 0.5/s. Above the fill height the seam is a dim groove (12% strength). Bass hits still flash the lit part. When paused, silent-and-stale or at Reactivity 0, it eases back to fully lit over ~0.6 s, the approved look.
- **Crystals:** the left one rises with the bass, the right one with the highs (louder of presence and air), up to 12% of the monolith's height (about 7% of the frame), with the same envelopes. Bob and spin continue on top. At rest they sit in their approved positions.
- **Reduced motion:** slow envelopes (0.8 s / 2.5 s), no peak cap, crystal travel a third of normal.

## Results (capture.json)

| Phase | Seam fill avg (min–max) | Left crystal max | Right crystal max |
|---|---|---|---|
| Idle, before playing | 1 (fully lit) | 0 | 0 |
| Quiet pad 4–8 s | 0.11 | 0.13 | 0 |
| Loud beat 10–24 s | 0.46 (0.31–0.56) | 0.64 | 0.28 |
| Silence while playing 24.6–26 s | 0.01 | 0.03 | 0.02 |
| Paused 28.5–30 s | 0.99 | 0 | 0 |
| Reduced motion, loud 12–20 s | 0.40–0.44, no cap | 0.51 | — |

All eight checks pass; no page errors. A first version used the plain average of the six bands and reached only 0.28 with the loud beat, so it was reweighted toward the loudest band.

Screenshots: `idle.png`, `quiet-5s.png`, `loud-12s.png`, `loud-12_3s.png`, `loud-18s.png`, `drop-off-24_4s.png` (bar empty, cap still held), `paused-29s.png`, `reduced-18s.png`.

## Limits

- Generated audio only. Real songs are usually louder and denser; how high the bar sits and how much the right crystal moves need the owner's ear and eye with real music.
- When the bar is empty a short lit stub remains at the very bottom (the seam's end fade overlaps the bar's soft edge).
- GPU cost not measured (a few shader operations on the seam only).
