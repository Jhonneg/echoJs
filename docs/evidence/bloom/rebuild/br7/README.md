# Bloom rebuild BR7 — framing, Low quality and performance

2026-11-26. Run `npm run build && node scripts/verify-bloom-br7.mjs` for captures. For GPU timing, run `node scripts/measure-bloom-br7.mjs <scratch-dir> <out.json>`.

## 1. Framing that adapts to the screen shape

The camera stays in place, but its field of view and tilt now depend on the screen shape (`cameraFor` in `composition.ts`):
- **Width:** on screens narrower than about 0.89:1, the view widens just enough to keep half the reference's width visible. On wider screens it never widens, so desktop, 16:9, short laptops and ultra-wide keep the approved framing exactly (tested).
- **Horizon:** it rises only as much as the view has widened, reaching 53% from the top on a phone so open water shows above the controls.
- **Why this is safe:** the sky, aurora, rivers and reflections are tied to the world, not the camera, so they stay correct.

Captures (Standard, then Low):

| Shape | Standard | Low |
|---|---|---|
| Phone portrait 390×844 | [portrait](portrait.png) | [portrait-low](portrait-low.png) |
| Tablet portrait 768×1024 | [tablet-portrait](tablet-portrait.png) | [tablet-portrait-low](tablet-portrait-low.png) |
| Square 900×900 | [square](square.png) | [square-low](square-low.png) |
| Tablet 1024×768 | [tablet](tablet.png) | [tablet-low](tablet-low.png) |
| Desktop 1440×900 | [desktop vs reference](desktop-vs-reference.png) | [desktop-low vs reference](desktop-low-vs-reference.png) |
| Short laptop 1440×700 | [short-laptop](short-laptop.png) | [short-laptop-low](short-laptop-low.png) |
| Wide 1920×810 | [wide](wide.png) | [wide-low](wide-low.png) |

On a phone, the monolith is now about half its previous size and centred, with both auroras, both crystals, the inner ranges and open water above the controls. The outer pink and violet river sections fall outside the narrower view; that was accepted in the plan.

## 2. Low quality review

- **Fixed:** with only two curtains and simpler streaks, Low's aurora thinned to a few faint lines and the right side nearly vanished. Low now keeps all four curtains with 3 instead of 4 streak noise layers. The unused curtain-skipping branch was removed from the sky shader.
- **What Low reduces, unchanged:**
  - terrain at half resolution per axis (59k vs 238k triangles);
  - 3 terrain and stone noise layers instead of 5;
  - reflection at 0.33 resolution without multisampling, with simpler ripples;
  - two rivers instead of three;
  - drawing resolution 0.75 instead of 1–1.5.

## 3. Performance

Frame-capped timing (16.7 ms) can't show real cost, and an uncapped attempt measured only command submission (about 0.3 ms per frame), which is discarded. The final method times each full render (including the nested reflection pass) on the GPU with `EXT_disjoint_timer_query_webgl2`, in a throwaway build that exposes the scene. Headless Brave, ANGLE GL on this machine's GPU, 1440×900.

GPU ms per frame, median of three 4 s samples ([before](gpu-perf-before.json), [after 1](gpu-perf-after.json), [after 2](gpu-perf-after-2.json)):

| | Before early-out | After (run 1) | After (run 2) |
|---|---|---|---|
| Standard, full | 6.43 | 6.08 | 5.20 |
| Standard, no water/reflection | 6.21 | 5.27 | 4.20 |
| Standard, no rivers | 4.61 | 4.55 | 3.85 |
| Standard, no sky/aurora | 6.23 | 4.69 | 4.47 |
| Low, full | 5.29 | 3.63 | 2.98 |

- **What the numbers say:** they vary between runs by up to about 1.2 ms (most likely GPU clock changes), so only rough costs hold. Standard uses about 5–6.5 ms of the 16.7 ms frame budget. The rivers are the largest single cost (about 1.3–1.8 ms); the reflection (0.2–1.0 ms) and sky/aurora (0.2–1.4 ms) are smaller.
- **Change:** a river bounding-box early-out (`riverBox`) skips the river distance test for pixels far from a river. The margin is about 2.3× the glow's halo width. The still frame from before and after is **pixel-identical** (ImageMagick `compare -metric AE`: 0 of 1,296,000 pixels differ). Its saving is within run-to-run noise, so no exact figure is claimed.
- **Bloom mount** (switch from Nocturne until Bloom has drawn two frames): about 30 ms.
- **Your observation:** Bloom "runs well" on your machine (post-BR6).

## Checks

- PASS: 310 unit tests. New and updated:
  - framing at 8 screen shapes: whole monolith visible and centred, horizon placement, desktop/wide unchanged, portrait monolith 0.4–0.65 of desktop size, field of view never grows as screens get wider;
  - river boxes contain each path plus a margin wider than the glow;
  - the BR3 sky test renamed for the Low change.

  Lint, typecheck, build and whitespace also pass.
- PASS: BR7 capture at 7 shapes × 2 qualities, 0 runtime errors, reduced motion still ([capture](capture.json)).
- PASS: `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- **Housekeeping:** the session's test scripts left a temporary Brave profile in /tmp on every run, which filled /tmp's quota. You approved deleting them; the scripts now delete their own profile (and, for the GPU script, the throwaway build) on exit.
