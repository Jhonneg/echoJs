# NT10 — slow context atmosphere and depth

Implemented 2026-11-22 after owner “proceed” following NT09. Technical verification passed; owner environment/music/device acceptance remains pending. NT11 is not started. No commit, push or deployment; prior uncommitted NT09 documentation/evidence/scripts remain intact.

## Audit and design

The NT09 baseline already used MI intensity for distant gate/haze/fog color, with250/800 ms local smoothing and350 ms inactive release. Fog distances stayed17/74 m; activity and brightness were unused. This made the atmosphere respond much faster than a phrase-scale layer.

Existing MI context is sufficient. Intensity is calibrated broad RMS normalized at.5, with upstream750/1500 ms smoothing. Activity is a four-second strength-weighted onset rate with500/1000 ms smoothing, not BPM. Brightness is a500 ms smoothed, logarithmically normalized spectral centroid; brightnessValid guards low-power/invalid measurements. No extra energy history, detector, analyser or unsupported song-section labels are needed.

A new bounded scene controller slows these context measurements into distant illumination, depth and subtle palette balance. Existing fixtures, materials, gate/haze geometry, camera, environmental fill and exposure remain intact. Existing linear Fog supports near/far changes directly; [Three.js r186 Fog documentation](https://github.com/mrdoob/three.js/blob/r186/docs/pages/Fog.html) was checked through Context7. No new shader, render pass or light.

## Mapping

Canonical parameters are in [visual mapping](../../NOCTUNE_VISUAL_MAPPING.md).

| Response | Target | Normal | Reduced |
| --- | --- | --- | --- |
| Illumination level | `.65 * intensity * gain` | 2 s rise /4 s release | 4/6 s |
| Density | `activity * intensity * gain` | 3/5 s | 4/6 s |
| Signed tint | `(2*brightness-1)*intensity*gain` when valid and finite, otherwise0 | 4 s either direction | 6 s |

All inputs/gain clamp to0–1. Final weights are magenta=`level*(.24-.04*tint)`, cyan=`level*(.85+.03*tint)`, violet=`level*(.16+.04*tint)`. Higher spectral centroid shifts slightly toward cyan/violet, lower toward magenta; this is a visual mapping, not an inferred mood.

The existing palette mix feeds gate emission and haze glow. Fog color remains `#05070b + glow*.018`; near remains17 m, far=`74-8*density`, bounded66–74 m. Activity cannot sustain dense fog in silence because intensity gates it. Near objects stay outside the fog range; distant geometry naturally changes attenuation. No fixture output is multiplied by context or global exposure.

Fresh active age0–.25 s is required. Stale/inactive target0 with slow release; zero gain/Manual clear audio envelopes immediately; sessions reset. dt≤50 ms, without catch-up. Zero targets settle below.001, including absolute signed tint. These scene time constants compound upstream context smoothing deliberately. Manual retains the original color weights and fog17/74 exactly. The old broad helper still computes its historical atmosphere internally, but final Audio rendering uses only the new controller.

## Review evidence

All sound is wholly generated through the real unmodified local-file/MI paths. Temporary probes and controlled-context overrides exist only in isolated app copies. No private/captured media is inspected or persisted.

| Evidence | Link |
| --- | --- |
| NT09 baseline, same generated schedule | [Before demonstration](../../evidence/nocturne/nt10/before/generated-music-demo.mp4) |
| NT10 live transitions | [After demonstration](../../evidence/nocturne/nt10/after/generated-music-demo.mp4) |
| Reduced motion | [Slower transition demonstration](../../evidence/nocturne/nt10/reduced/generated-music-demo.mp4) |
| Normal stages | [Quiet](../../evidence/nocturne/nt10/after/quiet.jpg), [energetic](../../evidence/nocturne/nt10/after/energetic.jpg), [recovery](../../evidence/nocturne/nt10/after/recovery.jpg), [late silence](../../evidence/nocturne/nt10/after/silence.jpg) |
| Held fixtures, controlled context | [Quiet](../../evidence/nocturne/nt10/after/context-quiet.png), [high spectrum](../../evidence/nocturne/nt10/after/context-high-spectrum.png), [dense](../../evidence/nocturne/nt10/after/context-dense.png), [maximum](../../evidence/nocturne/nt10/after/context-maximum.png) |

The45 s generated schedule has silence0–2 s, quiet mixed110/450/1500/8000 Hz2–10 s, stronger mixed content with repeated attacks10–20 s, and silence20–45 s. Camera stays(0,1.6,5). Screenshots sampled roughly2.5/s are indexed by audio currentTime and muxed with the same generated WAV. This is approximate400 ms visual sampling, suitable for slow atmosphere; it is not native-FPS or sample-accurate recording. Before952 numeric samples/113 frames; after949/113; reduced1003/113. Successful runs have no runtime errors. Browser playback was muted; physical audibility/native capture was not tested.

Inspection shows the alley keeps its dark industrial contrast. The new distant glow rises/releases more slowly and reaches a lower level than baseline; near cyan/magenta detail retains its hierarchy. In this generated fixture the activity-driven distance change is modest, about half a metre. Full-bound controlled snapshots exercise stronger depth and tint separately rather than exaggerating the real MI measurements.

## Measured delivery

[Comparison](../../evidence/nocturne/nt10/comparison.json), [after trace](../../evidence/nocturne/nt10/after/trace.json) and [controlled context](../../evidence/nocturne/nt10/after/controlled-context.json) retain inputs, response, actual gate/haze RGB, fog color/range and fixture material/point delivery.

| Stage | MI intensity mean | MI activity mean | New glow mean | New fog far mean |
| --- | ---: | ---: | ---: | ---: |
| Quiet7–9 s | .0353 | .0024 | .0210 | 73.998 m |
| Energetic17–19 s | .1934 | .4045 | .1215 | 73.475 m |
| Recovery26–28 s | .00187 | .00368 | .0338 | 73.818 m |
| Late silence43–44.8 s | ~0 | ~0 | .00051 | 73.994 m |

Baseline energetic glow is.1942 with fixed far74; new glow is.1215. The longer tail is intentional. Reduced late-silence glow is.00290, approaching the unchanged dark baseline more slowly. Live MI context decays asymptotically while active, so these traces are not claimed to have exact zero. Unit tests with zero/inactive targets verify settling and reset behavior.

Controlled static snapshots hold every fixture output at the same level, changing only synthetic context. Each snapshot settles the production controller using7200 offline1/60 s updates; these are static isolation checks, not live transition evidence.

- At intensity.6 and activity0, low/high spectral brightness gives the same illumination.39 and fog far74; tint changes−.48→+.48. Invalid brightness returns tint0.
- At the same intensity/brightness, activity0→1 changes far74→69.2 m while illumination and all fixture material/point values stay identical.
- Maximum context1/1/1 caps illumination at.65 and far at66 m. The composited gate remains locally visible without washing out near architecture; the measured near fixture crop remains pixel-identical.
- Quiet controlled before/after images match exactly. A sampled30×200 near-magenta crop matches before/after in every controlled case, independently of the fixture output assertions.

An initial maximum screenshot disagreed with its recorded material color. Allowing600 ms for browser compositing produced the expected visible gate, and the comparator now additionally measures its rendered40×40 blue-channel crop against quiet. No production code adjustment was involved in this capture correction. Owner comfort/appearance judgment remains separate from pixel assertions.

## Preservation, files and checks

Task-start snapshot `/tmp/echo-nt10-baseline-7hBQbH` contains actual NT09 source. Only three production files differ:

- `src/scenes/nocturne/atmosphereResponse.ts`: new bounded context controller.
- `src/scenes/nocturne/visualState.ts`: controller wiring and final color/fog outputs.
- `src/scenes/nocturne/LightingDriver.tsx`: deliver final near/far to the existing Fog.

Added `tests/nocturneAtmosphere.test.mjs`; updated Manual/atmosphere expectations in `tests/nocturneVisualState.test.mjs`. Verification support is the generated-atmosphere fixture, browser/views, preservation and comparison scripts under `scripts/`, plus NT10 evidence and documentation. No geometry, floor/wall shader, fixture controller, shared DSP/capture or other landscape changes.

Passed:

- All39 test files, lint, typecheck and build; existing large-bundle warning remains (JS1,239.61 kB/gzip345.07 kB).
- Six controller cases cover slow capped rise/release, activity gating, valid/invalid/NaN brightness, short spikes, gain/reduced behavior, freshness/inactive/session/Manual/zero and30/60/120 Hz agreement.
- [4,200 matched frames](../../evidence/nocturne/nt10/state-parity.json): all fixture channels/reflection summaries and complete bridge state exactly preserved; Manual atmospheric weights/fog17/74 preserved.87 other source files are byte-identical.
- Actual gate and haze RGB match the palette-weighted response, and actual fog equals baseline+.018×glow. Point/material deliveries remain exactly tied to fixture outputs. No foreground material gain or independent surface multiplier.
- Eight baseline/built-current Manual/idle/off views are pixel-identical, including desktop/wide/portrait Standard/Low. [Built-production capture metadata](../../evidence/nocturne/nt10/manual/after/verification.json).
- Paired whole-frame reflection+main counters,120 samples per version: draws196→196, triangles25,534 unchanged, geometries114 and textures6 unchanged; all7 point lights retained. Only scalar math/assignments are added, with no frame-rate React state, additional light, material or pass. This is not a hardware-FPS acceptance claim.

Next action: owner reviews slow transitions and permitted real songs/device performance, then authorizes NT11 whole-scene coordination. NT10 does not label choruses/drops or tune fixture prominence. Grouped NT09–NT11 environment artistic approval remains open. Suggested focused commit after authorization: `Add slow context-driven Nocturne atmosphere`.
