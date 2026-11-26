# Bloom rebuild roadmap — Resonant Monolith

Started 2026-11-26. The owner asked to scrap the previous Bloom scene and rebuild it from the Resonant Monolith reference (`references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png`). It's built visuals first, one phase at a time, each stopping for owner visual review. This roadmap supersedes [BLOOM_RESONANT_MONOLITH_ROADMAP.md](BLOOM_RESONANT_MONOLITH_ROADMAP.md) and [BLOOM_3D_WATER_RECONSTRUCTION.md](BLOOM_3D_WATER_RECONSTRUCTION.md) for current work. Those documents, the old code and the old evidence stay in git history and aren't edited.

**Boundaries:**
- Original procedural geometry and GLSL only. The reference image is never loaded at runtime (its provenance is unrecorded).
- The shared app stays: shell, audio analysis, `LandscapeCanvas`, controls, and APP01–APP04 loading and recovery.
- `BloomScene` keeps its existing props, so App doesn't change.
- No new dependencies without approval.

## Reference vs previous scene (why rebuild)

| Reference | Previous scene |
|---|---|
| Tall, jagged, snow-capped ranges in 4–5 layers fading into luminous mist across the full width, with a valley behind the monolith | Two smooth, lumpy banks and an empty centre horizon |
| Vertical aurora curtains: green on the left, violet and pink on the right | A horizontal wavy band |
| Glowing pink and cyan rivers in the valleys | Thin lines |
| A monolith filling about 57% of the frame height, cracked stone, hovering just above concentric ripples | Shorter and waxy |
| Saturated lavender, pink and teal light, with colourful streaked reflections | Greyer palette, dull water |

Measured from the reference (1672×941):

| Element | Position |
|---|---|
| Horizon | 66.1% from the top |
| Monolith | top 6.4%, bottom 62.7%, centred, 9% of frame width |
| Left crystal | (43%, 36.7%) |
| Right crystal | (57.4%, 50.7%) |
| Big left peak | about 16% from the top |
| Right peaks | about 28% from the top |
| Centre valley | about 53–58% from the top |

## Phases

| Phase | Content | Status |
|---|---|---|
| BR1 | Clean slate + composition blockout: flat placeholders positioned from the measurements, fixed perspective camera, framing maths in `src/scenes/bloom/composition.ts` | Owner approved 2026-11-26 |
| BR2 | Mountain ranges as full 3D terrain (owner's choice): ridged layers, snow by height and slope, rock shading, haze with distance, mist between layers | Owner approved 2026-11-26 ([evidence](evidence/bloom/rebuild/br2/README.md)) |
| BR3 | Sky + aurora curtains (green left, pink and violet right), slow ambient motion, colour spill onto snow and mist | Owner approved 2026-11-26 ([evidence](evidence/bloom/rebuild/br3/README.md)) |
| BR4 | Monolith + two crystals: cracked stone, bright seam, gentle ambient hover | Owner approved 2026-11-26 ([evidence](evidence/bloom/rebuild/br4/README.md)) |
| BR5 | Water: calm lake, coloured streaked reflections, ripples under the monolith, low mist | Owner approved 2026-11-26 ([evidence](evidence/bloom/rebuild/br5/README.md)) |
| BR6 | Glowing valley rivers with slow flow (painted on the terrain by the mountain shader; see evidence for the change from ribbons) | Committed at owner request 2026-11-26 ([evidence](evidence/bloom/rebuild/br6/README.md)) |
| BR7 | Quality (Standard/Low), portrait and wide framing, reduced motion, performance | Not started |
| BR8 | Music mapping (planned separately) | Not started |

## BR1 notes

- **Camera:** perspective, 40° vertical field of view, 0.3 units above the water, pitched up about 6.7° so the horizon lands at 66.1%. The vertical field of view is fixed, so the monolith keeps its size relative to screen height at every aspect ratio. Wide screens show more mountains; portrait shows less width, so the monolith dominates there (to revisit in BR7).
- **Everything is placed from screen fractions** of a 16:9 frame (`heightForScreen`, `xForScreen`), so later phases keep the reference framing when they replace placeholders.
- **Removed:** every previous Bloom module, its 10 test files, the old legacy-signal `reactivity.ts` with its test, and the unused `BloomDebugControls`. `tests/cameraTilt.test.mjs` now computes its expected bass mix directly.
- [Evidence](evidence/bloom/rebuild/br1/README.md).
