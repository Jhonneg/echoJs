# NT02 — Music Intelligence integration

Implemented 2026-11-22 after owner approval of [NT01](NT01_MIGRATION_AUDIT.md). NT02 technical checks passed; NT03 and NT04 remain pending. No artistic choreography beyond the approved migration baseline was introduced.

## Runtime changes

`App` now supplies only the existing MI reader to NocturneScene and LightingDriver. NocturneScene omits the shared canvas signal prop with `cameraTilt={false}`. LandscapeCanvas's union type still requires AudioSignal when tilt is enabled, preserving other scenes' call sites. App enables MI at analysis construction and asserts that invariant at its Nocturne call site; the scene requires a reader and has no legacy fallback.

Shared AudioControls uses MI freshness plus broad energy above .001 for Nocturne's receiving/silent feedback. File playback and tab connection state still come from the source adapters. Other scenes retain their existing status path. Diagnostics remain unmounted. Static search finds no AudioSignal type or legacy field reads in Nocturne's scene subtree. Its imports of clamp/smooth are mathematical utilities, not legacy data reads.

| Output | MI source | Migration baseline |
| --- | --- | --- |
| Magenta fixtures/bridge | energy.low, low onset | Sustain `.65 × clamp(energy/.5) × gain`, accent up to `.3 × strength × gain`, exponential accent decay .22 s; final attack/release .025/.18 s |
| Existing cyan windows/panels | energy.mid, mid onset | Same sustain/accent curve, final attack/release .035/.22 s |
| Violet strips | energy.high, high onset | Same sustain/accent curve, final attack/release .02/.14 s |
| Gate/halo/fog tint | context.intensity | Gain-scaled, extra .25 s rise/.8 s active fall/.35 s inactive fall; existing color weights and neutral floor |
| Approved left cyan panel | energy.six.highMids and rise-qualified mid onset | Existing .65 sustain/.35 accent coefficients, .06/.18 s sustain easing and .22 s accent decay preserved; emitter ×1.3, point ×30 |

Reduced motion suppresses new sharp event accents, uses .8/1.1 s group easing and 1.2/1.5 s atmosphere easing; panel retains its established gradual path. Broad outputs clamp the sustain-plus-accent sum; render delivery multipliers/materials are unchanged. The new calibrated curves deliberately do not reproduce legacy `.035` thresholds or soft-knee scaling. For moderate generated bass, magenta is correspondingly dimmer (measured max .245 in the steady section versus historical ~.481); NT04 must review this baseline before artistic tuning. No coefficient change was applied to strengthen the subtle approved panel accent.

Each response tracks session and sequence. Mount/session changes skip retained events and clear temporal state. Inactive/stale data stops new accents and releases outputs; source epoch reset clears state. Manual/reduced/zero states consume events rather than deferring them. The panel's history now records each feature frame once, primes after disabled periods without inventing a rise, and advances its cursor while zero/Manual suppresses output. No reader view is retained across updates. NT03 will consolidate these existing controllers; it has not started.

## Verification and evidence

- Passed `npm test` (33 files), lint, typecheck and production build. Existing bundle warning remains: ~1,230.13 kB /342.34 kB gzip. Focused tests cover band isolation, quiet/loud ordering, bounded sustain, finite accents, duplicates, wrong-session/future/expired events, stale/priming/inactive data, gain/manual/reduced suppression, session reset, frame de-duplication and MI activity feedback.
- `node scripts/verify-nocturne-mi.mjs` passed in headless Brave at 1440×810 Standard, using generated WAV through the normal local-file/analyser/MI pipeline. Probes were added only to an isolated temporary copy. 141 numeric samples, 140 composited frames, exact fixed camera and exact delivered cyan material/light multipliers. Zero captured console/runtime errors. [Generated demonstration](../../evidence/nocturne/nt02/generated-music-demo.mp4), [trace](../../evidence/nocturne/nt02/trace.json), [summary and protected-file hashes](../../evidence/nocturne/nt02/summary.json). Browser audio was muted; generated WAV is muxed into the video with approximate frame timing.
- Bass section: magenta max .245, left cyan ≤.000016 with accent 0. Low-mid section: existing cyan max .229, left panel ≤.000025 with accent 0. High-mid sustain: left panel mean .129; attacks: peak .434 with sampled accent up to .083. Mixed bass/high-mid and silence remain independent. Differences from prior sampled peaks reflect actual analyser/render timing; no claim of identical event samples.
- Existing audio element retained across Bloom/Lavender/Crimson/Nocturne scene selection after the generated clip; Standard/Low switching and Manual all-on→Audio recovery passed. This is source-identity smoke, not evidence of audible continuity during active scene switching or native permissions.
- Matched Manual [cyan on](../../evidence/nocturne/nt02/manual/nt02-magenta-panel-on.png) and [cyan off](../../evidence/nocturne/nt02/manual/nt02-magenta-panel-off.png) have **zero differing pixels** against the approved composition captures (ImageMagick AE). Inspected the on view and generated attack frame. Approved geometry/color/spill/reflections are preserved at that view.
- All src/audio files, all other landscape files, and Nocturne ArchitectureDetails/Atmosphere/WetGround/WallSurface are byte-identical to the task-start copy; hashes are retained in summary.json. No added lights, materials, reflection passes, shadows, postprocessing or dependencies. New bounded scalar/event bookkeeping only; no per-frame React state. No fresh GPU/FPS claim.

## Remaining gates

NT02 is implemented and technically verified. NT03 unified visual state and NT04 full parity/lifecycle review are next sequential tasks; NT04 requires owner migration approval before NT05. Real-song artistic acceptance, actual audible/native-tab sharing flows, full viewport/quality parity, accessibility/device performance and long playback remain their respective later gates. No commit/push/deployment. Proposed focused commit after authorization: `Migrate Nocturne lighting and status to Music Intelligence`.
