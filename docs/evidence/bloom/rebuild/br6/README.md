# Bloom rebuild BR6 — glowing rivers

2026-11-26. Run `npm run build && node scripts/verify-bloom-br6.mjs`.

| Frame | Next to the reference |
|---|---|
| Left rivers close-up | [left](left-rivers-vs-reference.png) |
| Right rivers close-up | [right](right-rivers-vs-reference.png) |
| Desktop 1440×900, Standard | [comparison](desktop-vs-reference.png) · [with controls](desktop.png) |
| Desktop, Low quality | [comparison](desktop-low-vs-reference.png) |
| Wide 1920×810 / Portrait 390×844 | [wide](wide-vs-reference.png) · [portrait](portrait-vs-reference.png) |
| Water (rivers reflected) | [water close-up](water-closeup-vs-reference.png) |

Motion, scene only: [0 s](motion-0.png) · [4 s](motion-1.png) · [8 s](motion-2.png) · [reduced motion](reduced-motion.png)

## What was built, and a change of approach from the plan

The plan called for separate glowing ribbon meshes draped on one range each. In the first draft, almost all of each ribbon was hidden: the flat ribbons were cut by the sloping ground, and each range shows only a thin strip above the next nearer one. So the rivers are now **painted onto the terrain by the mountain shader**:

- Each river is a path in the reference's 16:9 screen fractions (`src/scenes/bloom/rivers.ts`), smoothed and given a gentle meander that fades at both ends.
- The mountain shader works out each fragment's screen position from its world position with the fixed camera. Whatever terrain shows there glows, so a river flows across several ranges and disappears behind ridges, as in the reference. Nothing can cut through it.
- Because the screen position comes from world position, the BR5 mirrored pass shows the rivers on the same terrain, reflected.
- The glow is a thin core with a soft halo, thin at the source and wider toward the mouth. It's dimmer on steep faces, broken up by surface detail, and softened in mist.

Rivers: pink down the left ranges, teal down the right peaks, and a fainter violet one lower right. Flow pulses loop over 11, 14 and 17 s; reduced motion holds a steady glow. Low quality keeps the pink and teal rivers.

The terrain formula was factored into shared `rangeColumn`/`rangePoint` helpers. The mesh output is unchanged, confirmed by the BR2 terrain tests.

## Tuning record

Three drafts:
1. Ribbon meshes: mostly hidden.
2. Painted on the terrain: visible, but straight like beams of light.
3. Meander, taper and valley embedding added; then the pink river's strength was raised slightly.

## Checks

- PASS: 306 unit tests, including 5 in `tests/bloomRivers.test.mjs`:
  - every river point lands on mountain (below some range's crest), not sky, and clear of the monolith;
  - rivers flow down the screen;
  - the meander stays small and vanishes at the ends;
  - colour per side, and Low keeps the two main rivers;
  - flow loops seamlessly and reduced motion holds still.

  Lint, typecheck, build and whitespace also pass.
- PASS: browser capture. 0 runtime errors, one live context, mirror alignment held (697.8 vs 698.5 px), and reduced motion shows 0% change ([capture](capture.json)).
- PASS: `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- **Cost:** triangles per frame unchanged (483k Standard, 128k Low); the rivers add shading work instead, since every mountain pixel checks the river paths in both passes. On Standard, median 16.7 ms and p95 16.8 ms, with **one 33.5 ms frame in 30 s**. That's either a one-off hiccup or the first sign of load. Low stayed at a 16.8 ms maximum. Headless timing can't confirm which; real-GPU behaviour is unverified.

## Known differences

- The reference's rivers follow the mountain valleys exactly. These follow screen paths over the terrain, so they don't bend around individual ridges.
- The pink river is still softer than the reference's.
