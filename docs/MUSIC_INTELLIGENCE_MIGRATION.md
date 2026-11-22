ECHO — Music Intelligence Migration Tracker

Version: 1.11 · Prepared: 2026-11-22 · Status: NT01 approved; NT02/NT03 implemented; NT04 approved; NT05–NT08 implemented; owner authorized NT09 continuation; NT09 existing surfaces verified; NT10 implemented; NT11 assessment ready, owner artistic approval pending; audit at e627ff821e84dd0f8e781fa9b259805d4822ac39
Destination: docs/MUSIC_INTELLIGENCE_MIGRATION.md
Current execution scope: Noctune only. Future intention: remove shared legacy analysis after every consumer has migrated.

1. Project-wide migration objective

MusicFeaturesV1 (or a deliberately versioned successor) should become the sole production musical-analysis contract for ECHO. Every landscape owns visual interpretation, not DSP or separate audio-analyser instances. The legacy AudioSignal implementation can be removed only when no production consumer remains and the application passes complete regression testing.

For the current work: migrate Noctune first, without changing the other landscapes or deleting legacy infrastructure. The full execution sequence is in NOCTUNE_MASTER_ROADMAP.md. The artistic targets are in NOCTUNE_VISUAL_MAPPING.md.

2. Reported architecture before migration

The owner-provided Noctune audit reports that createAnalysis({ musicIntelligence: true }) produces:

Legacy mutable AudioSignal: normalized fast, slow, transient, flux, six frequency bands, atmosphere, isPlaying, and millisecond updatedAt.

Music Intelligence MusicFeaturesV1: fixed-reference calibrated six-band linear energy, low/mid/high onset events, session and sequence, active/fresh state, event timestamps in seconds, and context measurements. The reader.read() scalar view is borrowed/reused between frames; only the event objects are immutable.

The existing Noctune magenta/cyan/violet groups and gate/halo/fog historically read legacy state; the approved independent left cyan fixture is a local exception that already uses Music Intelligence.

Preliminary source verification: At commit e627ff8, src/audio/musicFeatures.ts defines energy.six as subBass, bass, lowMids, highMids, presence, air, and context as intensity, brightness, brightnessValid, activity. src/App.tsx passes both analysis.signal and analysis.musicFeatures to Noctune. src/scenes/nocturne/LightingDriver.tsx delegates legacy groups to reactivity.ts and the Music Intelligence panel to cyanPanel.ts. This is a read-only snapshot; NT01 must audit the agent's current working tree and any changes since this commit.

3. Destination architecture

User-authorized audio input
└── Existing shared analysis/capture lifecycle
└── Music Intelligence feature reader
├── Noctune scene-local visual response model
│ ├── sustained fixture envelopes
│ ├── event-triggered accents/choreography
│ └── slow atmosphere/dynamics
├── Crimson visual response (future parity audit)
├── Lavender Peaks visual response (future migration)
└── Bloom / other scenes (future migration)

One source of analysis truth, multiple distinct artistic interpretations. Do not copy the old global three-group response architecture into an adapter simply to satisfy the type change.

4. Legacy-to-Music Intelligence replacement policy

Legacy dependency

Proposed migration

Warning

fast broad-band intensity

Calibrated target-band energy with scene-local fast smoothing

Not numerically interchangeable; thresholds/gains require fresh testing

slow broad-band intensity

Calibrated energy with scene-local slow smoothing

No need to recreate slow DSP in scene components

Continuous transient envelope

Qualified low/mid/high onset accents when behavior is truly event-like

Events have discrete semantics and session/sequence

Continuous flux

Onsets for attack-oriented effects; if continuous spectral change is essential, document a real feature gap

Onset is not an exact flux substitute

Legacy six normalized bands

Music Intelligence calibrated six-band energy

Verify actual frequency boundaries/field names

atmosphere

Evaluate existing context.intensity, context.activity, and context.brightness (when brightnessValid) before adding a scene-local slow energy composite

Do not use one scalar to drive all fixture brightness

isPlaying/updatedAt

Feature active/fresh state and correctly interpreted timestamps

Legacy time milliseconds; MI event time seconds per report

Legacy manual group preview

Direct preview of final scene visual controls

Must not fake or corrupt a Music Intelligence session

The Music Intelligence onset events distinguish low/mid/high, not all six energy bands. Mid onset reportedly spans 250–4000 Hz; high-mid energy spans 800–2500 Hz. Qualify broad events against recent relevant band-energy rises when a fixture needs high-mid specificity. Deduplicate by session and sequence. Do not infer individual instruments or song sections from these features alone. src/audio/musicFeatures.ts uses musicFeaturesFresh() to require active status and an age within .25 s; audit visual response against that exact gate.

5. Existing cyan fixture: protected integration

The approved recessed left cyan panel already uses the intended new contract:

high-mid calibrated energy for restrained sustain;

mid onset qualified against short high-mid rise for a one-shot accent;

independent material/light/manual response, not magenta bass;

bounded local event/history logic and zero/silence handling.

Earlier owner-supplied tests found expected high-mid-only, bass-only, low-mid-only, mixed, and silence behavior. A stronger attack coefficient was only proposed, not approved or implemented. Migration must preserve it or supply equivalent tests, delivered lighting traces, and owner-approved visual comparison.

6. Landscape and application migration inventory

The table below is a planning inventory, not proof from live source. Update the status only after code search and successful tests.

Consumer

Known/reported state

Migration status

Next action

Noctune main magenta and bridge-related existing lamps

Legacy bass fast + transient/flux per audit

Pending

NT01 inventory → NT02 migration

Noctune existing cyan windows/panels

Legacy midrange per audit

Pending

NT01 inventory → NT02 migration

Noctune violet strips

Legacy treble per audit

Pending

NT01 inventory → NT02 migration

Noctune gate, halo, fog tint

Legacy atmosphere per audit

Pending

NT01 inventory → NT02 migration

Noctune recessed left cyan fixture

MusicFeaturesV1 high-mid and qualified onset

Integrated; migration parity unverified

Preserve; NT04 regression

Crimson Horizon

Music Intelligence integration used for some documented visual effects

Full exclusivity unverified

Audit after Noctune completion

Lavender Peaks

Prior independent reactive ridges, original audio source unverified

Unverified

Audit in later project-wide pass

Bloom

Original POC; current consumer unknown

Unverified

Audit in later project-wide pass

Other scenes, UI, diagnostics, manual preview, tests

Exact dependencies unknown

Unverified

Repository-wide audit before deleting legacy

Do not mark an entire landscape migrated because one component uses Music Intelligence. A complete scene migration means zero runtime dependency on legacy signals, including indirect aggregate/environment paths.

Known source wiring at the checked commit: src/scenes/nocturne/NocturneScene.tsx types its signal prop as AudioSignal; src/scenes/nocturne/LightingDriver.tsx receives both signal and optional MI reader; src/scenes/nocturne/reactivity.ts maps magenta/cyan/violet via legacy fast/transient/flux and legacy atmosphere; src/scenes/nocturne/cyanPanel.ts reads MI separately. NocturneScene.tsx also has approved bounded mouse-camera parallax; preserve it and reduced-motion centering rather than incorrectly enforcing an entirely frozen camera.

Additional shared-host dependency: NocturneScene.tsx passes signal to LandscapeCanvas even with cameraTilt={false} and reactivity={0}. src/engine/LandscapeCanvas.tsx currently requires an AudioSignal prop because other landscapes may use its optional camera-tilt behavior. NT01/NT02 must decide how to make the Noctune path truly legacy-free without breaking shared canvas users (for example, a narrowly scoped optional signal for disabled camera tilt). This is distinct from the scene's actual music-reactive lighting logic.

7. Noctune execution order and gates

Phase

Work

Blocker/gate

NT01

Discover all legacy consumers, confirm MI contract and current code

Audit approval before mutation

NT02

Route MI data and remove Noctune legacy dependencies

Isolated integration and lifecycle tests

NT03

Introduce scene-local typed response layer

Deterministic tests, bounded state

NT04

Compare approved visual baseline, cyan panel, manual behavior

Owner migration review

NT05–NT11

Implement living-instrument visual mapping

Grouped artistic approvals

NT12–NT14

Controlled tests, synchronized real-song review, performance/accessibility

Evidence + owner sign-off

NT15

Final docs, traceability and closeout

Noctune zero-legacy proof

8. Required repository audit and evidence

Use the repository's own tools. A useful starting point is to search for the actual symbols (verify naming first):

rg -n 'AudioSignal|MusicFeaturesV1|createAnalysis|LightingDriver|atmosphere|updatedAt' src docs

Then investigate imports, adapters, runtime call paths, and tests. This regex alone is not sufficient proof of runtime dependency removal; documentation and compatibility declarations may legitimately retain references after migration.

Minimum evidence for Noctune migration:

Before/after dependency map showing the last Noctune legacy entry points removed.

Exact Music Intelligence contract/units and tested event de-duplication rules.

Target response traces for isolated bands, onsets, sustained energy, silence, and mixtures.

Verified zero-Reactivity, reduced motion, manual preview, feature freshness, new session, disconnect, and scene switching.

Matched fixed-camera screenshots and short synchronized generated-signal review.

Explicit unverified list: real-song artistic feel and hardware FPS must not be marked passing without owner/device review.

Test, lint, typecheck, build results and current known warnings.

9. Risks and required mitigations

Risk

Mitigation

Calibrated energy behaves unlike clamped legacy gain

Retune scene-local gains using controlled traces and actual visual appearance; avoid raw coefficient copying

Broad events are attributed to the wrong band

Qualify against short energy history; don't invent unavailable band-specific onset types

Event repeats after scene reopen/reconnect

Reset by session and track processed sequence

Fast visual effects become flickery/overwhelming

Bound intensity, cooldown/overlap, reduced-motion path, and visual QA

Lighting groups still move as one

Independent scene-level targets and group isolation tests

Moving code breaks original cyan visual

Preserve synthetic values and matched camera captures

Shared legacy deletion breaks other landscapes

Retain pipeline until repo-wide zero-consumer verification

Rendering cost grows

Reuse existing lighting/reflections, batch emissive details, measure GPU/FPS

10. Event and state invariants

One source capture should not duplicate audible playback or introduce another analyser merely for Noctune.

Read the current feature frame consistently; derive scene-local targets deterministically at render/update cadence.

Do not retain the reader's borrowed scalar view across frames; copy only needed values into bounded history.

Ignore stale or inactive features; do not continue generating new accents from a frozen frame.

Handle event session, sequence, and timestamp units explicitly; consume each one-shot event once per relevant session.

Silence and Reactivity=0 bring reactive outputs to the documented resting state without residual unbounded timers.

Manual preview cannot corrupt live Music Intelligence feature state.

Reduced motion disables/softens rapid sequences while preserving accessibility and overall artistic visibility.

Other scenes' behavior must remain unchanged during Noctune-only migration.

Preserve Noctune's approved pointer-controlled camera parallax while avoiding new music-driven camera travel.

11. Project-wide legacy removal: future checklist (not part of Noctune implementation)

Remove the shared legacy analysis code only after:

Noctune fully migrated and owner-approved.

Crimson Horizon audited and fully migrated (not merely partially using MI).

Lavender Peaks migrated and verified.

Bloom and every additional landscape migrated and verified.

UI controls, diagnostics, manual preview, and test fixtures migrated.

No active runtime legacy data consumers remain anywhere in the repository.

Capture lifecycle, permissions, and audio routing regression tests pass.

Real-browser and long-session tests pass across scenes.

Dead legacy types, adapters, DSP, and obsolete tests/docs are removed carefully in a separately reviewed change.

This list is intentionally not authorized for execution during Noctune's NT01–NT15 roadmap. It is a later project-wide milestone.

12. Progress log template (append per approved phase)

Date / phase / commit (if authorized):
Implementation summary:
Actual feature inputs:
Consumers removed/migrated:
Files changed:
Tests run and results:
Browser/video evidence:
Real-song review status:
Performance status:
Known risks / blockers:
Owner review decision:
Next phase:

Next action: review NT11 staged coordination before NT12. Current mappings retained; native/music/device acceptance is not inferred from generated checks.


NT01 reconciliation (2026-11-22): [Approved current-repository audit](reports/nocturne/NT01_MIGRATION_AUDIT.md). NT01 approved by owner; NT02 implementation authorized. The audit supplies exact runtime/UI dependencies, context semantics, material constraints and lifecycle safeguards. Historical “pending audit” descriptions above refer to the original proposal; this checkpoint supersedes them.


## Current execution inventory — after NT02 (2026-11-22)

The earlier inventory describes the pre-migration baseline. NT01 is approved; NT02 code and technical evidence are complete in the [integration report](reports/nocturne/NT02_INTEGRATION.md).

| Consumer | Current source | Status |
| --- | --- | --- |
| Existing magenta/bridge, cyan, violet | MI low/mid/high energy plus discrete matching events | Migrated, baseline curves measured |
| Gate, halo, fog tint | MI context.intensity, local easing | Migrated |
| Approved left cyan | MI highMids + qualified mid onset | Coefficients preserved; frame/suppression safeguards added |
| Nocturne canvas host | Disabled tilt without signal prop | Legacy scene entry removed |
| Nocturne receiving/silent feedback | MI freshness and broad energy; adapter owns lifecycle | Migrated |
| Shared analysis and other scenes | Existing mixed/legacy paths | Retained, outside Nocturne migration |

The full scene is not artistically signed off: NT03 consolidation, NT04 migration review and subsequent phases remain open. Full regression/device/music gates are not closed by NT02 browser smoke.


## NT03 checkpoint — unified scene response

Owner “procced” authorized NT03. `visualState.ts` owns the scene response, reads MI once per update and exposes named fixture channels, separate sustain/accent/final values, derived reflection-source levels and atmosphere weights. `reactivity.ts` and `cyanPanel.ts` now accept the same borrowed feature frame synchronously. LightingDriver only binds and applies final outputs. Main/secondary/bridge and original cyan outputs preserve NT02's shared curves/material batches until their artistic phases.

[NT03 verification](reports/nocturne/NT03_VISUAL_STATE.md): 34 test files, lint/typecheck/build, 6,300 exact parity frames, generated browser delivery and pixel-identical Manual captures passed. NT03 implemented; NT04 owner migration review and later artistic/music/device gates remain pending. No legacy data consumer or new analysis path was introduced.


## NT04 checkpoint — technical migration review passed

Owner “procced” authorized NT04. [Review/evidence](reports/nocturne/NT04_MIGRATION_REVIEW.md) verifies six exact Manual quality/viewport pairs against pre-migration source, idle/off recovery, active generated playback across scenes, quality changes, pause/resume, disconnect/reconnect and reduced motion. All 85 source files unchanged during this phase. Existing legacy infrastructure remains for other scenes; Nocturne still has no legacy data fallback.

The calibrated broad groups and atmosphere intentionally appear dimmer under the matched generated mix. Owner migration visual approval is pending; do not mark NT04 approved or begin NT05 yet. Native capture, real-song feel and target-device performance remain their later/manual gates.


## NT05 checkpoint — main/secondary magenta choreography

Owner “proceed” approves the NT04 migrated baseline and authorizes NT05. The unified visual state now calls a bounded magenta controller using MI six.bass/subBass and validated low onsets. Main sustained body and finite accent are separate; secondary fixtures use a lower/slower body; bridge remains the previous broad-low response. Original magenta geometry is rebinned into three material batches without transform changes. No second analyser or detector.

[NT05 evidence](reports/nocturne/NT05_MAGENTA_REVIEW.md) includes normal/reduced generated playback and actual delivered brightness. 4,200 deterministic frames prove exact cyan/violet/bridge/atmosphere preservation; 82 other source files are unchanged. NT05 implemented, appearance/musical review pending. NT06 is next; other phases and native/device gates remain as recorded.


## NT06 checkpoint — architectural midrange separation

Owner “proceed” authorizes NT06 after NT05. 336 existing windows use a slow low/high-mid energy blend; 6 small panels use low-mid energy with a locally rise-qualified broad-mid accent. Approved left cyan controller/coefficients and its independent high-mid role remain unchanged. One bounded 64-sample scalar history; no new analysis or capture path.

[NT06 verification](reports/nocturne/NT06_MIDRANGE_REVIEW.md) includes normal/reduced generated signals, actual material/point values, cyan-on matched Manual captures, exact transform preservation, 4,200 deterministic protected-output comparisons and 83 unchanged source files. NT06 implemented; appearance/musical approval and NT07/NT08 remain pending. No change to MI DSP or other landscapes.


## NT07 checkpoint — finite bridge travel

Owner “proceed” authorizes NT07 after NT06. Six contiguous sections within the two existing bridge diffusers consume only fresh qualified low onset events. One920ms sequence,1.04s start cooldown, no overlap/queue, proportional event-strength peak; reduced motion suppresses travel. Existing point light follows average delivered section brightness. Manual remains uniform. MI schema, DSP, capture and other landscapes are unchanged.

[NT07 evidence](reports/nocturne/NT07_BRIDGE_REVIEW.md) contains generated-only before/after/reduced demonstrations, actual section material/point traces, preserved footprints and protected cyan,4,200 exact non-target output frames and84 protected source comparisons. Built-production static views and whole-frame cost are measured separately. Implemented; owner grouped lighting and device/music acceptance remain open. Next is NT08 after continuation.


## NT08 checkpoint — localized violet high accents

Owner “proceed” authorizes NT08 after NT07. The same borrowed MI frame supplies presence/air energy to a restrained violet body and existing high onset events to alternating right/left accents. Twelve strip transforms are unchanged; six per material bank, each with its existing spill light. One240 ms accent,400 ms cooldown, no queue/stacking. Reduced motion keeps slow sustain only. No new onset fields, FFT or analyser.

[NT08 evidence](reports/nocturne/NT08_VIOLET_REVIEW.md) verifies independent actual material/point delivery, quiet/loud upper energy, isolated/dense high events, bass/low-mid isolation, silence and reduced motion.4,200 matched frames preserve every non-violet output and bridge section state;85 other source files are unchanged. Eight static Manual/idle/off pairs are pixel-identical; paired whole-frame counters quantify one extra material batch. NT08 implemented; grouped lighting acceptance and owner music/device checks remain pending before NT09.


## NT09 checkpoint — existing reflection/material response verified

Owner “proceed” authorizes NT09 after the NT08 lighting report. Surface assessment finds no missing audio interface: the current reflected scene already uses final fixture materials and local point lights in the same frame. No additional Music Intelligence inputs, audio uniforms or global intensity multiplier are needed. Existing wall maps receive the associated point lights.

[NT09 evidence](reports/nocturne/NT09_SURFACE_REVIEW.md) retains32 isolated contribution captures,9 uninstrumented built-production views, pixel measurements and all89 unchanged source hashes. No production implementation changed; NT09 is verified reuse, rather than an added shader. Next is NT10 after owner continuation; full-song/device/native and grouped environment acceptance remain pending.


## NT10 checkpoint — existing context drives slow atmosphere

Owner “proceed” authorizes NT10 after NT09. Intensity controls capped distant glow; activity weighted by intensity controls a modest fog-far change; finite brightness guarded by brightnessValid controls a small signed palette shift. Multi-second local envelopes respect reduced motion, freshness, gain, Manual and sessions. Existing context semantics are sufficient; no MI/DSP/capture changes.

[NT10 evidence](reports/nocturne/NT10_ATMOSPHERE_REVIEW.md) compares generated live transitions and independently controlled context at held fixtures.4,200 matched frames preserve every fixture/reflection output and bridge state;87 other source files byte-identical. Eight Manual/idle/off image pairs are exact. Only the new scene atmospheric controller, visual-state wiring and final fog delivery change; NT11 and native/music/device approval remain pending.


## NT11 checkpoint — composition assessed without new coupling

Owner “proceed” authorizes NT11 after NT10. Existing MI mappings were reviewed together using a generated seven-stage arrangement and per-render feature/response/delivery traces. No added global intensity multiplier, shared limiter, rolling-energy interpretation or DSP change was justified. Approved cyan and every existing controller remain unchanged.

[NT11 evidence](reports/nocturne/NT11_COORDINATION_REVIEW.md) records normal/reduced synchronized clips, actual material/point delivery, bounded violet/bridge overlap and90 byte-identical source files relative to task start. Technical assessment passed; owner artistic/grouped environment approval remains pending. NT12 deterministic matrix and NT13 owner-authorized live music review have not started.
