# Bloom BL07 final perceptibility refinement — owner review

Implemented within BL07 on 2026-11-23. **Controlled checks pass; owner visual/listening approval remains open. BL08 unstarted.** No commit or push. Scene footage contains only rendered pixels and annotated synthetic feature controls; no captured audio or owner media.

[Matched resting / moderate / energetic frames](matched-states.png) · [Energetic before/after](comparison-energetic.png) · [Moderate before/after](comparison-moderate.png) · [Resting before/after](comparison-resting.png)

| Demonstration | What to inspect |
|---|---|
| [Complete scene](current/complete-scene.mp4) | Rest, moderate mix, energetic mix, qualified attacks, release into quiet floating. |
| [Autonomous float and stones](current/autonomous-floating.mp4) | Ascent followed by 12 seconds of zero-energy playback; independent orbit/rotation; pause, mid-descent resume and final rest. |
| [Dedicated mouse parallax](current/mouse-parallax.mp4) | Center, horizontal/vertical extremes, corners, leave, blur, reduced motion. Fine-pointer capability is emulated only in the disposable browser build; native feel remains manual. |
| [Mountain paths](current/mountain-trails.mp4) | Low mids→rose body routes, high mids→mint body routes, presence/air→upper-detail routes; distinct traveling attacks. |
| [Aurora surface illumination](current/aurora-surfaces.mp4) | Bass/context increases affect existing mountain, stone, haze and lake materials coherently. |
| [Monolith beam](current/monolith-beam.mp4) | Restrained rest, moderate high-mid sustain, brighter short accent and local recessed stone spill. |
| [Expanding water ripples](current/water-ripples.mp4) | Two fresh low events, larger edge/radius, stationary water-foot origin beneath the moving monolith. Final taper reaches zero before the existing 3 s event timeout. |

## Audit findings and changes

The [pre-tuning audit](AUDIT.md) records root causes, original delivered values and bounded corrections. These were primarily rendering scale/contrast and path placement limits, rather than absent MI response or excessive controller smoothing. Actual calibrated inputs were inspected before tuning: linear energies .042 / .141 / .424 from the unchanged production-MI calibration in `bl06/calibration.json`. No detector, analysis algorithm, shared smoothing or source API changed.

- **Stones:** independent x/z orbital amplitudes now±.14, vertical±.15world units; rotation±.38rad, different frequencies/phases. Delayed playback rise, bounded mid-band impulses and reduced-motion suppression remain. In the12 s quiet section each stone traverses 25.20 px horizontally / 27.00 px vertically and .760 rad rotation, versus original theoretical full spans11.7 / 15.3 px and .34 rad. The monolith continues .21594 world units / 19.43 px peak-to-peak with every feature energy exactly zero. Its original float/ascent coefficients are unchanged.
- **Trails:** 10 Standard / 6 Low paths, five/three per bank, still one batch/draw. New routes occupy distinct drainage catchments rather than offsets of the same projected ridge; they sample existing rendered triangles. Low/high-mid body responses remain independent of presence/air detail responses. Existing two pulse slots per bank now identify body/detail events, selecting appropriate routes without new histories or analysis. Increased active core/halo contrast and differentiated travel persist without uniformly lighting all routes at rest. All routes descend at both qualities; small facet interpolation rises remain below.008world units per1/160path step.
- **Aurora:** strength is still .180 / .475 / .676 at the fixed rest/moderate/energetic test states. New material-owned mountain uniforms receive only **musical excess above intrinsic aurora strength** (.000 / .295 / .496), masked by exposed surface normals/height/spatial curtains. Stronger stone-face and fog response use that same final excess/color. Existing lake consumes final full strength. Sky/ambient/directional-light settings were preserved. Isolated material-only off/on comparisons produce mean absolute8-bit channel changes of 7.01 mountain / 9.65 stone / 4.89 haze / 6.87 lake in recorded regions; the separate sky region changes by exactly 0 pixels. These are rendered differences, not claims inferred only from controller values. [Diagnostic frames](current/energetic-without-mountains-fill.png), [stone](current/energetic-without-stone-fill.png), [haze](current/energetic-without-haze-fill.png), [lake](current/energetic-without-lake-fill.png).
- **Beam:** scene-local level now `1 + 1.25 × highMidSustain + 1.9 × qualifiedHighMidAccent` (previous .85/1.5 coefficients). Steady delivered levels at .141 / .424 energy are 1.549 / 1.877, versus 1.373 / 1.597; resting 1 is retained. Local stone spill widens/intensifies with active excess, so an already-white core cannot hide the response. Matched moderate high-mid baseline 1.549 versus attack 2.684 changes the beam/stone region by 37.06 mean channel levels. Bass/low-mid/presence/air isolated attacks leave beam 1. Exact final level also feeds reflected beam/wet glow.
- **Ripples:** radial travel 1.05 versus .85/s, horizontal aspect 1.5 versus 1.2; narrower antialiased edge plus soft halo, slower decay and wider depth range. At 2 s the authored horizontal radius is 3.15 world / 283.5 px versus 2.04 / 183.6 px before. A 2.1–3 s terminal taper prevents the existing 3 s controller cap from popping the enlarged edge. Origin uses the camera-projected water foot under the monolith. Ambient small rings remain.

## Files changed in this refinement

| Production file | Purpose |
|---|---|
| [BloomScene.tsx](../../../../src/scenes/bloom/BloomScene.tsx) | Surface delivery, beam/trail uniforms and ring rendering. |
| `lifecycle.ts` (removed in the 2026-11-26 Bloom rebuild; see git history before it) | Independent fragment motion bounds/frequencies. |
| `trails.ts` (removed in the 2026-11-26 Bloom rebuild; see git history before it) | Distinct routes and body/detail shader response. |
| `music.ts` (removed in the 2026-11-26 Bloom rebuild; see git history before it) | Beam coefficients and bounded pulse classification. |
| `monolith.ts` (removed in the 2026-11-26 Bloom rebuild; see git history before it) | Local stone illumination/spill; geometry constructors preserved. |
| `surface.ts` (removed in the 2026-11-26 Bloom rebuild; see git history before it) | Live mountain material uniforms and exposed-face fill. |

Supporting changes: lifecycle/trail/choreography tests, new surface binding regression, isolated capture/assessment scripts, evidence and progress/contract documentation. Pre-existing App/audio-control/other edits remain untouched in this pass.

## Verification and cost

Passed 56 test files, lint without warnings, typecheck, production build and whitespace checks. Existing large-chunk build warning remains. Added regressions cover visible orbit bounds, route separation/downhill attachment, body/detail pulse addressing and live material-uniform ownership. Existing production-MI integration, band/event/source/reduced-motion and reflection tests still pass.

The browser replay uses real scene controllers and real production shaders in disposable builds, with fixed camera/pose/ambient time and six seconds of60Hz calibrated features for matched stills. Films use real elapsed frame time and final material/mesh probes; traces accompany every MP4. [Assessment](assessment.json), [matched values](current/capture.json), [final film/timing capture](current/water-capture.json). Diagnostic switches never enter production. Matched input/camera/monolith poses are identical across the pre-task/candidate builds.101 other existing source files match pre-task SHA256 hashes, including shared MI, source controls, terrain and other landscapes; stone/fragment geometry-constructor bytes are also identical.

[Nine-view reflection comparison](optics/current/silhouette-assessment.json): zero missing/extra pixels beyond 1 px antialias tolerance, across center/extremes/corners using source-triangle CPU rasterization versus isolated GPU masks. Wet distortion is disabled only for mask verification. [Cleanup matrix](cleanup/current/capture.json): Standard/Low desktop/wide/portrait and three full quality/landscape replacement cycles restore identical 9 geometries / 1 texture / 7 programs / 13 draws. These source-geometry lake images remain stylized wet projections, not physical ray-traced reflections.

Rendering cost 13 draws remains unchanged. Standard 6532→6852 triangles (+320); Low 2148→2308 (+160). No extra geometry buffers, texture, light, render target, shadow pass or dependency. New material work is a few masked surface operations in existing draws; frame data stays outside React state. Final bundle 1295.49 kB / 362.60 kB gzip, approximately +2.67 / .73 kB versus the pre-task build.

Same Linux / GTX 1660 SUPER, ANGLE, 1440×900, DPR 1: three 5 s samples per build retain 16.7 ms median. Baseline p95 17.0–17.1 ms; final candidate 17.0 ms in all three windows, max 17.3 ms. Earlier candidate samples varied 17.1–17.8 ms p95; these vsync-limited samples do not establish GPU execution cost or native-window performance certification.

Native pointer feel, shared-tab controls, actual permitted-song listening and owner visual/musical approval remain manual gates. Existing source-control behavior was not changed in this pass. Stop here for review; no BL08 work or commit/push.
