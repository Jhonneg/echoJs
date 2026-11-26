# Bloom rebuild BR1 — composition blockout

2026-11-26. Flat placeholders, judged on layout only. Run `npm run build && node scripts/verify-bloom-br1.mjs`.

| Frame | With controls | Next to the reference |
|---|---|---|
| Desktop 1440×900 | [desktop](desktop.png) | [comparison](desktop-vs-reference.png) |
| Wide 1920×810 | [wide](wide.png) | [comparison](wide-vs-reference.png) |
| Portrait 390×844 | [portrait](portrait.png) | [comparison](portrait-vs-reference.png) |

In the comparisons, the reference is scaled to the same height and centre-cropped. It's read from disk only to make this evidence; ECHO doesn't load it.

## Checks

- PASS: 283 unit tests. They include 5 new framing tests in `tests/bloomComposition.test.mjs`: monolith fully visible and centred at all three aspects; top, bottom and width within tolerance of the reference; horizon at 66.1%; base above the horizon; ranges ordered by depth with a central valley; crystal placement. Lint, typecheck, build and whitespace also pass.
- PASS: browser capture. 0 runtime errors, one live WebGL context after switching Nocturne → Lavender Peaks → Crimson Horizon → Bloom ([capture](capture.json)).
- PASS: `verify-app02.mjs` and `verify-app03.mjs` rerun with the new Bloom, including loss and restore of the graphics context. Their scope checks now exclude Bloom files. The committed APP02/APP03 evidence images were restored afterwards rather than overwritten.

## For review

- Monolith size, position and hover gap; horizon height; crystal positions; mountain massing (high left peak, right peaks, central valley).
- Known blockout limitations: smooth silhouettes, a flat-coloured front face, and a thin seam strip that aliases into a dashed line. BR2–BR4 replace all of these.
- Portrait: the monolith fills a lot of the frame and the controls cover the water. To be addressed in BR7.
