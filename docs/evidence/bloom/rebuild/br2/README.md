# Bloom rebuild BR2 — full 3D mountain ranges

2026-11-26. The owner chose full 3D over painted cards or a hybrid. Sky, monolith, crystals and water are still BR1 placeholders. Run `npm run build && node scripts/verify-bloom-br2.mjs`.

| Frame | With controls | Next to the reference |
|---|---|---|
| Desktop 1440×900, Standard | [desktop](desktop.png) | [comparison](desktop-vs-reference.png) |
| Desktop, Low quality | [desktop-low](desktop-low.png) | [comparison](desktop-low-vs-reference.png) |
| Wide 1920×810 | [wide](wide.png) | [comparison](wide-vs-reference.png) |
| Portrait 390×844 | [portrait](portrait.png) | [comparison](portrait-vs-reference.png) |

## What was built

- **Terrain.** Five height-map bands, one per BR1 range (`src/scenes/bloom/ranges.ts`). Each rises from below the water to its crest. Every point stays below the camera's line of sight to its column's crest, so the silhouette is the approved BR1 outline plus craggy crest detail. Ridges run down the slopes, and sideways ruggedness turns faces steep so they show rock.
- **Shading.** Custom shader:
  - snow on flatter high ground near the crests, with snow lines rising toward nearer ranges and none on the foothills;
  - mauve rock with a key light from the upper right and a soft sky fill;
  - haze with distance, capped so distant ranges stay readable;
  - mist starting just below each crest, so peaks rise out of it and the layers separate.
- **Size.** 237,920 triangles on Standard and 59,480 on Low (half resolution on each axis; 3 instead of 5 noise octaves in the shader). Meshes are built when Bloom mounts or the quality changes, and freed on unmount.

## Tuning record

Eight drafts were compared against the reference before this result. Two real defects were found and fixed along the way:
- The custom shader wrote linear colour without converting it to sRGB, which made dark rock almost black. It now includes three.js's `colorspace_fragment`.
- Mist based on low terrain never showed, because nearer ranges hide the lower slopes of the ones behind. Debug captures (surface directions, then height/mist/light channels) showed this. Mist now starts just below each crest.

## Checks

- PASS: 289 unit tests. `tests/bloomRanges.test.mjs` adds 6:
  - every vertex is finite and the front edge sits under the water;
  - no point rises above its crest's line of sight;
  - seen from the camera, each crest stays within 0.035 of screen height of the BR1 outline;
  - crest detail is bounded;
  - triangle budgets (Standard ≤ 260k, Low ≤ 70k) and build time under 1.5 s;
  - snow lines rise toward nearer ranges.
  Lint, typecheck, build and whitespace also pass.
- PASS: browser capture. 0 runtime errors; one live WebGL context after switching through all landscapes ([capture](capture.json)).
- PASS: 24 landscape switches with audio playing. Live GPU buffers, textures, programs and framebuffers were identical before and after (41/4/3/3); audio kept playing ([measurements](measure-switching.json)). Switching back to Bloom takes about 47 ms instead of about 31 ms, because the terrain is rebuilt on each mount (headless, local).
- PASS: `verify-app02.mjs` and `verify-app03.mjs` on the new Bloom. The committed APP evidence images were restored afterwards.
- Frame timing: median 16.7 ms and p95 16.7 ms on both Standard and Low. This is the headless frame-rate cap, so it shows no frame drops here but says nothing about GPU headroom or real hardware.

## Known gaps (for later phases)

- The sky is still a flat gradient and there's no aurora, so the rock lacks the reference's green and pink light (BR3).
- A dark jagged strip runs along the water line where the nearest foothills meet the flat water (BR5 water and low mist).
- The monolith, crystals and seam are still placeholders (BR4).
