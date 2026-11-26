# Bloom rebuild BR3 — sky dome and aurora

2026-11-26. Monolith, crystals and water are still BR1 placeholders. Run `npm run build && node scripts/verify-bloom-br3.mjs`.

| Frame | With controls | Next to the reference |
|---|---|---|
| Desktop 1440×900, Standard | [desktop](desktop.png) | [comparison](desktop-vs-reference.png) |
| Desktop, Low quality | [desktop-low](desktop-low.png) | [comparison](desktop-low-vs-reference.png) |
| Wide 1920×810 | [wide](wide.png) | [comparison](wide-vs-reference.png) |
| Portrait 390×844 | [portrait](portrait.png) | [comparison](portrait-vs-reference.png) |

Motion, scene only: [0 s](motion-0.png) · [4 s](motion-1.png) · [8 s](motion-2.png) · [reduced motion](reduced-motion.png)

## What was built

- **Sky dome** (`src/scenes/bloom/sky.ts`): a sphere around the camera, replacing the flat BR1 card. Deep blue-violet at the top, lavender in the middle, pink-lavender at the horizon (pinker on the right). Its shader works from the view direction and mirrors directions below the horizon, so BR5's reflections can reuse it.
- **Aurora curtains,** in the same 16:9 screen fractions as the BR1 layout:
  - two green curtains on the left: a main one sweeping toward the centre and a fainter, higher one;
  - violet just right of the monolith and pink on the far right;
  - the sky directly behind the monolith left darker.

  Each curtain has a bright lower edge with S-shaped folds, an upward fade, and fine slanted streaks over softer ribbons with darker gaps between them.
- **Light on the mountains:** a subtle green tint on the left and pink on the right, strongest on snow and mist. It shares the sky's slow breathing (brightness 0.85–1).
- **Motion:** each curtain cycles slowly (periods of 29–53 s) and loops seamlessly. With reduced motion on, it holds a fixed pose. No music response yet (BR8).
- **Low quality:** one curtain per side and 2 instead of 4 streak noise layers.

## Tuning record

Three drafts compared against the reference:
1. Mountain tint too strong; curtains looked like a comb of vertical stripes.
2. Tint halved; folds and slanted streaks added.
3. Brightness concentrated into ribbons with deeper gaps.

A first motion check showed the streaks reshuffling within seconds. The drift was reduced to about a third.

## Checks

- PASS: 293 unit tests, including 4 in `tests/bloomSky.test.mjs`: curtains stay clear of the monolith; colour sides; one curtain per side on Low; periods of 20–60 s with seamless loops; reduced motion holds a still pose; breathing stays in range. Lint, typecheck, build and whitespace also pass.
- PASS: browser capture. 0 runtime errors, one live WebGL context after switching all landscapes ([capture](capture.json)).
  - Motion: about 31% of pixels in the top 60% of the frame change over 4 s. Small colour shifts count, so this doesn't measure speed.
  - Reduced motion: 0% change over 3 s.
- PASS: `verify-app02.mjs` and `verify-app03.mjs` on the new Bloom. The committed APP evidence was restored afterwards.
- Frame timing: median 16.7 ms and p95 16.7–16.8 ms on Standard and Low. That's the headless frame-rate cap, not native GPU evidence.

## For review

- **Motion pace.** With 29–53 s cycles, the curtains visibly reshape over 8 s; compare the motion frames. If you want it calmer, the periods can be lengthened (for example to 60–120 s).
- **Known gaps:** placeholder monolith (BR4); flat water and the dark strip at the water line (BR5).
