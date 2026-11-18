# Animation refinement — Crimson-first direction

2026-11-18 · owner selected expressive/controlled responses, Crimson Horizon as pilot, subtle terrain deformation, and musical/playback transitions. Owner subsequently requested implementation of the staged plan. This records its approved direction; it does not bypass the phase/feature-quality checkpoints or assert that new scene behavior is implemented.

## Current boundary and sequence

MI02a/MI02b lab checkpoints are accepted. Fixed linear energy is the preferred candidate; adaptive scaling remains experimental and the soft-knee contrast failure stays recorded. Production scenes still consume legacy AudioSignal. MI03's experimental lab detector now passes its synthetic core after the approved release correction; owner review and unequal-mixture limitations remain explicit (see MI03_CORRECTION.md). The initial failed baseline is retained in MI03_RESULTS.md. MI04 slow context is not implemented. Existing source adapters, art/camera choices and legacy compatibility remain intact.

The first deliverable is the [bounded MI03 plan and event-quality criteria](MI03_PLAN.md). The Music Intelligence roadmap requires quantitative tolerances to be approved before detector implementation. Then complete MI03 and MI04 separately, perform the existing feature-quality review on matched source/volume/passages, and proceed to MI05's Crimson pilot. Refinement belongs within MI05–MI06, not a parallel rewrite of every landscape. Each implementation task has its own owner checkpoint. Landscape-switching transitions are excluded.

## Shared response vocabulary

| Layer | Role |
|---|---|
| Ambient | Preserve each world's existing life and readability in silence |
| Calibrated energy | Continuous movement, illumination and material response |
| Onset identity/time/strength | Single, proportional localized accents |
| Slow intensity | Atmospheric depth and overall strength |
| Brightness/activity | Bounded distribution/density of highlights within the authored palette |

Every response reads the same feature snapshot/clock. Event session/sequence identity prevents duplicate consumption; source changes, A/B mode changes and scene mounts must not replay old events. Actual attack timestamps synchronize responses; no BPM/beat-phase, instrument or genre recognition is implied. Audio envelopes clean measurements, motion controllers add physical inertia, and atmospheric effects use slow context without another long stack of filters. No global exposure flashes, random flicker or camera kicks.

Keep a small typed candidate reader alongside AudioSignal once the feature modules are proven; do not overwrite the existing contract or recompute analysis for each scene. The exact production reader is finalized in MI05, not invented by this documentation checkpoint. Developer comparison remains outside public diagnostics/query controls, preferably in the separate lab preview with one active WebGL scene. It must preserve the playing source, journey distance and user settings while switching legacy/candidate profiles.

## Crimson pilot — two bounded passes

Preserve the burgundy ridged valley, nightshade sky, pink sun, open corridor, forward journey, restrained pointer camera, finite four-chunk stream and worker ownership.

First refine motion and shaders:

- Replace active-band counting as the main intensity proxy with validated energy/context. Refine acceleration/deceleration within existing travel limits, with gentle quiet movement and stronger sustained momentum. Onsets never kick the camera.
- Map low onsets proportionally into sun accents, initially retaining 8% sun-scale and 12% glow-scale limits. Mids drive selected ridge illumination; treble gives sparse crest highlights. Stronger events must be visibly larger than weaker ones without fixed-peak flashing.
- Use slow context for haze/distant separation while preserving foreground darkness, palette and sun hierarchy. Keep primary attacks prompt; secondary responses may settle with controlled inertia.
- Silence, pause and resume should settle naturally without terrain rewind or event replay. Preserve hard constraints for reduced motion, zero Reactivity and unavailable terrain; never travel beyond loaded geometry.

Stop for owner review before the vertex pass:

- Add coherent displacement on selected banks, maximum **0.08 world units** initially. Fade the effect out around the central corridor and distant skyline; preserve the authored mountain forms.
- Evaluate displacement in continuous logical terrain coordinates with bounded phase values so chunk edges and coordinate rebasing remain seamless.
- Update lighting normals consistently with the displacement and pad culling bounds for its maximum amplitude. See the installed Three.js r186 [geometry bounds documentation](https://github.com/mrdoob/three.js/blob/r186/docs/pages/BufferGeometry.html).
- Change uniforms, not terrain buffers, every frame. Keep the existing renderer/worker/stream; add no new render pass or dependency by default.

The current camera, sun and material baselines remain the source of truth until the pilot implementation is separately approved and reviewed. These target caps are not screenshots, aesthetic acceptance or evidence of performance.

## Subsequent landscapes

| World | Direction | Preserve |
|---|---|---|
| Bloom | More physical halo-fragment motion, proportional local accents and coordinated lake ripples/authored reflection | Calm composition, gentle ambient motion, soft palette; retain reflection approximation honestly |
| Nocturne | Layered sustained light, quick smooth onset accents, consistent light spill/reflections and slower haze | Stationary architecture, accepted tiny pointer movement, smooth lighting, brighter idle readability |
| Lavender Peaks | Better acceleration and depth-dependent inertia, sun response and restrained ridge shading | Accepted shared ridge travel/depth-speed ratios, authored silhouettes and seamless periodic looping |

Each world gets its own approved task and matched-input owner review. Do not silently restore Lavender's superseded one-band-per-ridge mapping, add forward movement to Nocturne, or turn every world into the same effect with different colors.

## Acceptance direction

Use deterministic 30/60/120 timing tests, duplicate-event/reset/source tests, seam and rebase comparisons for positions/normals, displacement-bound/culling checks and renderer integration. Compare identical synthetic timelines and matched owner-authorized song sections at equal volume/settings. Owner judges musicality, atmosphere and artistic improvement.

Browser checks use desktop 1440×810, portrait and wide views, both existing quality settings, pointer extremes, reduced motion and zero Reactivity. Keep resources bounded and frame-rate values out of React state. Initial pilot performance proposal: at most 10% additional p95 frame time on matched hardware/renderer/viewport/DPR/settings; finalize that benchmark when approving MI05. Never equate headless, mocked capture or synthetic metrics with native audibility, aesthetics or hardware proof. No real/private media recording or agent inspection; exports remain synthetic numeric summaries only.

No implementation of later phases, commit, push or deployment is authorized merely by this direction document. Next checkpoint is approval of MI03_PLAN.md's bounded implementation and numerical criteria.
