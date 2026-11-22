# NT03 — Unified Nocturne visual state

Implemented 2026-11-22 after owner “procced” authorized NT03 following the NT02 report. Task-start source was `f16ea5948d97a42a63b0c77e770c7f187955d4d7`. NT03 is technically verified; NT04 migration parity/owner review remains pending. Project phase skills and Playwright are unavailable; followed WORKFLOW.md and the existing local CDP fallback.

## Response boundary

`visualState.ts` provides typed `NocturneVisualState`, creation/update functions and a plain-object delivery adapter. `updateNocturneVisualState` reads the existing MusicFeatureReader exactly once per scene update, passes that borrowed view synchronously to the broad-band and panel controllers, and retains only numeric state. Internal controller update functions now accept `MusicFeaturesV1` instead of independently reading a reader. No shared MI contract or analysis code changed.

The state exposes separately addressable channels: `magentaMain`, `magentaSecondary`, `cyanWindows`, `cyanDetails`, `cyanPanel`, `violet`, and `bridge`. Each has a sustained energy target, a separate one-shot accent and a final level. Broad-group final easing still operates on the combined target; the cyan panel retains its own eased sustained contribution. The broad and panel controller objects remain owned by this one state so their tested baseline algorithms can be preserved without duplication.

Existing magenta, secondary and bridge mappings still share NT02's broad-low curve; original cyan windows/details share its broad-mid curve. These are distinct output objects with identical baseline values, not newly independent choreography. Existing emissive geometry remains batched; material separation belongs to NT05–NT08. Bridge and existing cyan-panel spill lights bind to their named output channels without changing their full intensities. No extra emissive segments or lights were added.

`reflections` contains derived source-fixture levels, not independently audio-driven floor effects. The existing planar reflector renders the actual fixture/material changes. There is no new reflection shader input or pass. Atmosphere exposes its final level and weighted magenta/cyan/violet contributions; mode-dependent weighting now belongs to visual state rather than component render logic.

`LightingDriver` binds scene targets, updates the unified state using seconds, applies final emissive/point-light values, and copies atmosphere colors to gate/halo/fog before the main/reflection render. It performs no band interpretation or manual/audio mixing. All frame-rate state remains outside React.

## Preserved mappings and lifecycle

All artistic coefficients remain the [NT02 baseline](NT02_INTEGRATION.md). Broad sustain is `.65 × clamp(energy/.5) × gain`; accents peak at `.3 × strength × gain`, decay in .22 s and use existing per-group final easing. Panel sustain/accent coefficients remain .65/.35, rise qualifier .02 within .09 s of event attack, .2 rise reference, .06/.18 s sustained easing and .22 s accent decay. Panel material is level ×1.3 and its point light is level ×30. No proposed accent-strength increase was applied.

Manual preview uses the same final outputs and derived reflection levels without modifying MI state. Valid manual values reproduce NT02 exactly; panel override is now clamped consistently with the other three groups. Suppressed events are consumed during Manual, zero gain and reduced motion; source sessions skip retained events. Panel history is bounded at 64 scalar samples and recorded once per feature frame. Inactivity/staleness clears its sample count/frame marker and stops new accents while existing illumination releases. The pure tests exercise each output and delivery without WebGL.

## Evidence

| Check | Result |
| --- | --- |
| Automated checks | `npm test` passed 34 files; lint, typecheck and production build passed. Existing bundle warning: ~1,231.11 kB JS /342.59 kB gzip. |
| Deterministic NT02 comparison | `ECHO_NT02_BASELINE=/tmp/echo-nt03-baseline-YErZro node scripts/verify-nocturne-state.mjs`: 6,300 frames at 30/60/120 Hz, **zero difference** in all final fixture/reflection values and atmosphere weights. Panel sustained/accent values also match exactly. |
| Scenario coverage | Sustained bands, mixed events, silence, Manual, zero/partial gain, reduced motion, stale/priming/inactive data and session resets. Unified tests verify one borrowed read, stable output/history storage, independent channel objects, pure delivery values, no feature mutation and no suppressed event replay. |
| Source preservation | 41 audio/other-scene/geometry/App/canvas files compared byte-identical to task-start source; hashes in [state parity evidence](../../evidence/nocturne/nt03/state-parity.json). |
| Generated browser | `node scripts/verify-nocturne-mi.mjs`: 141 numeric samples and 140 composited fixed-camera frames through normal local-file analysis, exact panel emitter/point delivery, band isolation, scene-selection source identity, Standard/Low and Manual/Audio smoke, zero runtime errors. Probes live only in an isolated temporary copy. |
| Approved composition | Matched Manual on/off images have **zero differing pixels** against NT02. Inspected cyan-on and generated attack views. Approved color, geometry, spill and pavement reflection are preserved at 1440×810 Standard. |
| Resource observation | Both NT02 and NT03 traces report 105 geometries and six textures. No lights, shadows, textures or render passes added. This is a resource-count observation, not an FPS/GPU-time measurement. |

- [Generated audio demonstration](../../evidence/nocturne/nt03/generated-music-demo.mp4), [numeric trace](../../evidence/nocturne/nt03/trace.json), [browser summary](../../evidence/nocturne/nt03/browser-summary.json).
- [Manual cyan on](../../evidence/nocturne/nt03/manual/nt03-magenta-panel-on.png), [Manual cyan off](../../evidence/nocturne/nt03/manual/nt03-magenta-panel-off.png), [generated attack frame](../../evidence/nocturne/nt03/attacks.jpg).

The generated run measured panel mean ~.129 during high-mid sustain, near-zero panel output during bass and low-mid input, zero low-mid accent, and transient panel peak ~.425. Independent live runs sample different analyser/event phases; exact numerical preservation is established by the deterministic same-input comparator, not by comparing video peak timestamps. Browser audio was muted; generated WAV is muxed into the demonstration with approximate frame alignment.

## Next gate

NT03 stops here. NT04 must perform the complete migration baseline review, including responsive/quality views, lifecycle/source switching during playback, zero/reduced/manual behavior and owner visual approval before NT05. Real-song feel, native capture/audibility and device performance remain manual/later gates. No commit/push/deployment. Suggested focused commit after authorization: `Unify Nocturne scene visual response state`.
