# Bloom rebuild BR5 — reflective water

2026-11-26. Run `npm run build && node scripts/verify-bloom-br5.mjs`.

| Frame | With controls | Next to the reference |
|---|---|---|
| Water close-up (monolith reflection, rings) | — | [close-up](water-closeup-vs-reference.png) |
| Desktop 1440×900, Standard | [desktop](desktop.png) | [comparison](desktop-vs-reference.png) |
| Desktop, Low quality | [desktop-low](desktop-low.png) | [comparison](desktop-low-vs-reference.png) |
| Wide 1920×810 | [wide](wide.png) | [comparison](wide-vs-reference.png) |
| Portrait 390×844 | [portrait](portrait.png) | [comparison](portrait-vs-reference.png) |

Motion, scene only: [0 s](motion-0.png) · [4 s](motion-1.png) · [8 s](motion-2.png) · [reduced motion](reduced-motion.png)

## What was built

- **Reflection:** three.js's bundled `Reflector` add-on renders the scene from a camera mirrored below the water into a texture (no new dependency). The BR3 sky dome already mirrors correctly for that camera.
- **Water shader** (`src/scenes/bloom/water.ts`):
  - **Ripples:** spaced by 1/distance, so they come out evenly spaced on screen. They displace the reflection mostly vertically, which streaks it, and sideways enough to zigzag the seam's reflection. They fade with distance, leaving the far water glassy.
  - **Rings:** concentric and centred under the monolith, with a soft glow where the seam's light meets the water.
  - **Colour:** a darker foreground and more reflection at grazing angles; the reflection is darkened overall but keeps its highlights; luminous mist along the horizon also blends the old dark shoreline strip away.
- **Motion:** three wave loops (13, 21 and 34 s) and an 8 s ring loop, all seamless. Reduced motion holds a fixed pose. No music yet (BR8).
- **Quality:** Standard reflects at half the drawing-buffer size with 4× multisampling. Low reflects at 0.33 without multisampling and with simpler ripples.

## Tuning record

Four drafts, compared mainly through the water close-up:
1. Reflections too crisp and bright, a noisy horizon band, a straight seam reflection, and rings that barely showed.
2. Darker and softer; far water calmed; sideways zigzag added.
3. Ripples spaced evenly on screen (1/distance); misty horizon; brighter rings.
4. Ripple spacing doubled; reflection highlights preserved.

## Checks

- PASS: 301 unit tests, including 3 in `tests/bloomWater.test.mjs`: rings centred under the monolith; seamless, slow loops; reduced motion holds still; reflection resolution per quality level. Lint, typecheck, build and whitespace also pass.
- PASS: mirror alignment. The seam's mean x is 697.8 px above the horizon and 698.4 px in the reflection (1440 px frame).
- PASS: browser capture. 0 runtime errors, one live WebGL context after switching landscapes; reduced motion shows 0% change ([capture](capture.json)).
- PASS: 24 landscape switches with audio playing. Live buffers, textures, programs and framebuffers were identical before and after (37/5/9/5), including the reflection target, and audio kept playing ([measurements](measure-switching.json)).
- PASS: `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- **Cost:** about 483k triangles in 18 draw calls per frame on Standard (the scene is drawn twice), and about 128k on Low. Frame timing is median 16.7 ms on both, but that's the headless frame-rate cap, so it can't show whether real GPUs keep up. If they don't, the cheapest option is to leave the farthest ranges out of the reflection, or lower its resolution.

## Known differences

- The reflected seam is thinner and dimmer than the reference's broad glowing zigzag.
- Reflected snowy peaks read brighter than the reference's muted ones.
- The rings are subtle compared with the reference.
