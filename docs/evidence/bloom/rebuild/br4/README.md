# Bloom rebuild BR4 — monolith and crystals

2026-11-26. The water is still a BR1 placeholder. Run `npm run build && node scripts/verify-bloom-br4.mjs`.

| Frame | With controls | Next to the reference |
|---|---|---|
| Monolith close-up | — | [close-up](closeup-vs-reference.png) |
| Desktop 1440×900, Standard | [desktop](desktop.png) | [comparison](desktop-vs-reference.png) |
| Desktop, Low quality | [desktop-low](desktop-low.png) | [comparison](desktop-low-vs-reference.png) |
| Wide 1920×810 | [wide](wide.png) | [comparison](wide-vs-reference.png) |
| Portrait 390×844 | [portrait](portrait.png) | [comparison](portrait-vs-reference.png) |

Motion, scene only: [0 s](motion-0.png) · [4 s](motion-1.png) · [8 s](motion-2.png) · [reduced motion](reduced-motion.png)

## What was built

- **Slab** (`src/scenes/bloom/monolith.ts`): a bevelled 3D slab (three.js `RoundedBoxGeometry` add-on, bundled with the installed `three`; no new dependency). It's turned −0.39 rad so the right side face shows at about a fifth of its visible width, as in the reference. The front is narrowed so the total screen width stays at the approved 9%.
- **Stone shader:**
  - matte grey-violet stone with a fine grain;
  - sparse thin cracks, plus a long diagonal crack on the right face;
  - worn, slightly lighter edges;
  - a key light from the right, which lights the side face mauve-pink;
  - green and pink aurora light from the shared BR3 state.
- **Seam:** drawn in the shader, with derivative antialiasing for smooth edges (fixing the dashed BR1 strip), a tight glow on the stone, and faded ends. It sits at 44% across the front face.
- **Crystals:** flat-lit faceted octahedra in teal-grey, with a faint aurora rim.
- **Motion:**
  - The monolith rises and falls by up to 1% of its height every 9 s, with a slight sway over 23 s.
  - The crystals bob up to 0.05 units and turn slowly.
  - Reduced motion returns the exact approved rest pose. No music yet (BR8).
- **Low quality:** 3 instead of 5 noise layers in the stone.

## Tuning record

Three drafts, compared mainly through the close-up:
1. The side face was a dark sliver, the stone too dark with blotchy marble-like veins, and the seam glow too wide.
2. The slab was turned further, the stone made lighter and matte with sparse thin cracks, and the glow tightened.
3. The front fill light was raised.

## Checks

- PASS: 298 unit tests, including 5 in `tests/bloomMonolith.test.mjs`:
  - hover stays within 1% and keeps the base above the water;
  - reduced motion and a bad clock return the rest pose;
  - crystals' bob stays within bounds;
  - seam placement;
  - the side face is 15–30% of the visible width.

  The BR1 framing test now checks the turned slab (top, bottom and total width against the reference). Lint, typecheck, build and whitespace also pass.
- PASS: browser capture. 0 runtime errors, one live WebGL context after switching all landscapes; reduced motion shows 0% change over 3 s ([capture](capture.json)).
- PASS: `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Frame timing: median 16.7 ms and p95 ≤ 16.8 ms on Standard and Low. That's the headless frame-rate cap, not native GPU evidence.

## Known differences

- The front face is still a little darker than the reference's mid grey-violet.
- There's no glow or reflection where the monolith meets the water, and no ripples under it (BR5).
