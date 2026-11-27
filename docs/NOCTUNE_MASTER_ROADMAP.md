ECHO — Noctune 2.0: Living Instrument Master Roadmap

Plan version: 1.13.2 · Prepared: 2026-11-22 · Status: NT01 approved; NT02/NT03 implemented; NT04 approved; NT05–NT08 implemented; owner authorized NT09 continuation; NT09 existing surfaces verified; NT10 implemented; NT11 continuation accepted; NT12 deterministic verification passed; NT13/R5 owner-approved 2026-11-23 after refinement and live review; NT14/NT15 skipped by owner 2026-11-23; current-worktree audit at e627ff821e84dd0f8e781fa9b259805d4822ac39
Target repository: https://github.com/Jhonneg/echoJs · Destination: docs/NOCTUNE_MASTER_ROADMAP.md

This is the canonical plan for Noctune's Music Intelligence migration and visual mapping. It supersedes the earlier partial NT/NM suggestions. The phase IDs NT01–NT15 below are the only IDs to use going forward.

0. Purpose and non-negotiables

Make Noctune a living instrument: distinct frequency regions, onsets, musical density, and quieter passages should have different, legible effects on its industrial architecture, lighting, wet pavement, and atmosphere. The scene must feel musically responsive without copying Crimson Horizon's camera movement or sun deformation.

Preserve: authored alley geometry; stable camera framing and existing bounded mouse parallax (with reduced-motion centering; no automatic music-driven forward travel); moody dark industrial aesthetic; dominant right magenta fixture; approved narrow, recessed left cyan fixture; violet accents; wet-concrete look; existing source capture and scene switching. Preserve other landscapes while Noctune is migrated.

Architecture: MusicFeaturesV1 is the canonical audio-analysis source for Noctune. Do not add or retain Noctune fallbacks to legacy AudioSignal. The shared legacy pipeline remains elsewhere until all consumers are migrated. Do not create an FFT/analyser or modify Music Intelligence DSP to implement a visual effect. If a contract gap is verified, report it and propose a versioned extension separately.

Reality check: Current source defines calibrated energy.six.{subBass,bass,lowMids,highMids,presence,air}, broad energy.{low,mid,high,overall}, and context.{intensity,brightness,brightnessValid,activity} plus low/mid/high onset events. The MusicFeatureReader.read() result is a borrowed, reused scalar view, not a deep-frozen snapshot; onset event values are immutable. Copy any scalar/history needed across frames. Broad-mid onsets do not identify a specific six-band source. Qualify with scene-local energy history where appropriate. Do not claim instrument isolation, beat-grid tracking, genre detection, or song-section recognition.

Source-of-truth hierarchy: repository AGENTS.md, docs/ROADMAP.md, docs/PROGRESS.md, and code > tested feature contract > existing Noctune audit and evidence > this proposed plan. Record conflicts instead of silently guessing. A read-only clone was inspected at the commit above; NT01 must still inspect the agent's current working tree, including uncommitted files. Repository rules authorize one approved task at a time; this roadmap is not blanket authorization to implement NT02–NT15.

1. Baseline and current evidence

The supplied reports indicate:

createAnalysis({ musicIntelligence: true }) currently exposes two parallel outputs from one analyser: a mutable legacy AudioSignal and a separate Music Intelligence reader.

Existing magenta/cyan/violet groups and gate/halo/fog have historically consumed the legacy signal via App / LightingDriver.

The additional left cyan fixture already consumes MusicFeaturesV1 high-mid energy (800–2500 Hz) and a mid onset qualified by recent high-mid rise.

The added cyan fixture has a separate emissive material, point light, response, and manual-preview control; it does not depend on magenta bass brightness.

Controlled generated-audio review reported: sustained 1500 Hz panel ~.130; high-mid attack example .406 peak; bass-only panel near zero while magenta responded; low-mid-only no panel accent; silence decayed; mixed bands remained independent. Those are reported controlled measurements, not a substitute for real-song review.

Read-only source confirmation at e627ff8: src/App.tsx passes both signal={analysis.signal} and musicFeatures={analysis.musicFeatures} into Noctune. src/scenes/nocturne/LightingDriver.tsx reads legacy via updateNocturneResponse and Music Intelligence via updateCyanPanelResponse. src/scenes/nocturne/reactivity.ts has legacy magenta/cyan/violet/atmosphere logic; src/scenes/nocturne/cyanPanel.ts has the independent new logic.

NocturneScene.tsx also passes the legacy signal into shared LandscapeCanvas despite cameraTilt={false} and reactivity={0}. This is a type/host dependency to resolve carefully during migration; don't break other landscapes that still use the shared camera tilt.

The current MusicFeaturesV1 type also exposes measured context intensity, brightness, brightness validity, and activity. Audit whether these are suitable direct inputs for NT10/NT11 before deriving redundant approximations from energy bands.

Read and validate these reported paths if they exist in the checkout:

docs/reports/nocturne/NOCTURNE_CYAN_AUDIT.md

docs/reports/nocturne/NOCTURNE_CYAN_VISUAL_REVIEW.md

docs/reports/nocturne/NOCTURNE_CYAN_MUSIC_REVIEW.md

src/scenes/nocturne/NocturneScene.tsx

src/scenes/nocturne/ArchitectureDetails.tsx

src/components/AudioControls.tsx

src/scenes/nocturne/LightingDriver.tsx, reactivity.ts, cyanPanel.ts, lighting.ts

src/audio/musicFeatures.ts, src/audio/music/analysis.ts, src/App.tsx

The current tests, scene adapters, and any additional consumers discovered by NT01.

The listed paths and feature type were observed at the cited commit; NT01 must confirm them in the agent's working tree and check any later changes. The supplied review numbers remain historical evidence, not new measurements.

2. Workflow, ownership, and gates

NT01 is audit-only. Produce a dependency graph and a migration plan without production changes; ask for approval before NT02.

Implement phases in order; update this roadmap and docs/MUSIC_INTELLIGENCE_MIGRATION.md after each completed phase.

A phase is Implemented only with code and tests. It is Approved only after its stated owner review. Never conflate passing tests with a successful visual or musical result.

For aesthetic phases NT05–NT11, capture fixed-camera evidence and request review at natural grouped checkpoints (lighting NT05–NT08; environment NT09–NT11). Do not request approval for every tiny refactor.

At each checkpoint report: changed files, input-to-output mapping, tests, screenshot/video path, perceptual tradeoffs, FPS/GPU observations when measured, risks, and next phase.

Keep changes scoped: do not change other landscapes, capture permissions, streaming integrations, or unrelated UI.

No automatic commits unless the owner requests them. Preserve uncommitted user changes.

3. End-to-end phases

NT01 — Complete legacy dependency audit

Objective: Inventory every Noctune code path and UI path that reads AudioSignal or its derived state.

Tasks

Trace audio capture → analysis output → App → LightingDriver → scene components and manual preview.

Inventory fast, slow, transient, flux, atmosphere, isPlaying, updatedAt, six legacy bands, and any additional discovered inputs.

Map every consumer to a visually meaningful output: emissive meshes, point lights, bridge, gate/halo, fog, controls, diagnostics.

Identify which consumers already use MusicFeaturesV1, particularly the approved cyan panel.

Confirm current Music Intelligence fields, context validity, units (event time in seconds versus legacy millisecond timestamps), borrowed-reader lifetime, frame/sample freshness semantics, and event session/sequence; check for changes since the cited snapshot.

Propose replacements without assuming one-to-one numerical equivalence. Identify missing features and performance risks.

Evidence: a table of each current input, actual source location, consuming element, replacement, scene-local derivation, and tests required. Gate: owner approves inventory; no production code changes yet.

NT02 — Full Music Intelligence integration

Objective: Supply Noctune entirely from one MusicFeaturesV1 reader without disturbing other scenes.

Tasks

Route existing Music Intelligence data into Noctune (the current App.tsx already passes both readers); do not create parallel analyses or duplicate audio playback.

Remove Noctune's live dependency on legacy AudioSignal, including indirect global atmosphere or diagnostics if they influence this scene.

Preserve the existing independently driven cyan panel and its event-qualification logic, or equivalently refactor it with parity tests.

Handle fresh/inactive data, disconnection, new sessions, monotonically increasing event sequences, one-shot onset consumption, and zero Reactivity.

Maintain manual preview and reduced-motion behavior.

Gate: Noctune's runtime response graph consumes only Music Intelligence and scene-local state; legacy pipeline remains for other scenes.

NT03 — Unified scene-local visual response layer

Objective: Keep audio semantics out of component render code.

Tasks

Create a typed, testable NoctuneVisualState (name illustrative): independent levels for main magenta, secondary magenta, cyan groups, violet, bridge accents, reflection accents, and atmosphere.

Separate sustained energy envelopes, onset-triggered one-shot accents, and long-term atmosphere. Give each a documented gain, floor/threshold, clamp, attack, release, and reduced-motion behavior as applicable.

Use seconds consistently for frame delta and event timing (LightingDriver currently uses performance.now() in milliseconds for legacy and now / 1000 for MI); reset temporal history on session changes and inactivity. Do not retain the borrowed reader view across frames.

Bound ring buffers/history; guarantee deterministic behavior with synthetic traces.

Manual preview must drive the same final visual outputs without pretending to be Music Intelligence.

Gate: Pure or isolated logic tests can exercise every visual output without running WebGL; no stale event replay or uncontrolled full-brightness saturation.

NT04 — Migration parity and regression review

Objective: Establish a safe baseline before artistic remapping.

Tasks

Compare approved composition and fixture appearance under matched camera, resolution, and synthetic signal cases.

Verify original right magenta remains the focal point, recessed left cyan retains its verified spill and wet-floor response, and darkness/contrast remain intact.

Test silence, mixed bands, manual preview, scene switching, reconnect, Reactivity 0, reduced motion.

Document deliberate signal-behavior differences from the legacy pipeline; don't force numerical parity with incompatible normalizations.

Gate — Migration milestone: no active Noctune legacy consumers; build/tests/browser smoke passed; owner reviews migration baseline. Stop visual work until approved.

NT05 — Magenta low-frequency choreography

Objective: Distinguish a sustained bassline from a kick-like low onset.

Mapping: lower calibrated energy sustains a deep magenta environmental contribution; qualified low onset adds a brief, weighty accent to the dominant right fixture; secondary magenta elements may carry a complementary, weaker pattern instead of copying one scalar.

Design guardrails: no excessive flash, no permanently maxed fixture, no unrelated camera response, retain dominant-magenta hierarchy. Gate: bass-only, quiet/loud sustained, and low-onset traces produce distinguishable visual behavior.

NT06 — Midrange architectural choreography

Objective: Make midrange music legible independently of bass.

Mapping: low-mid and high-mid calibrated energies drive selected existing architectural cyan details with differentiated smoothing; preserve the approved left panel's 800–2500 Hz sustained response and qualified onset. Do not let low-mid-only events trigger the high-mid panel.

Gate: high-mid sustained, low-mid-only, qualifying mid onset, and bass+mid mixes show correct independence without making the whole alley uniformly cyan.

NT07 — Reactive bridge choreography

Objective: Give the stationary environment directional musical movement.

Mapping: short scene-local sequences along subtle bridge-understructure emissive segments, triggered by qualified onset events. Define direction, duration, cooldown, overlap policy, and brief fading tails. Prefer emissive geometry and existing lights; don't add many dynamic point lights.

Gate: recognizable event-triggered travel, no constant cycling, no runaway stacked sequences, no significant performance regression.

NT08 — Treble, violet, and small-scale accents

Objective: Make high-frequency activity perceptible with a distinct visual voice.

Mapping: high-frequency energy supports restrained violet response; qualifying high onset drives fast, localized accents. Keep sharper/faster than magenta and cyan, but respect flicker comfort and reduced-motion preferences.

Gate: high-only signals visibly differ from bass/mid signals; dense high-frequency passages don't become a full-frame strobe.

NT09 — Wet-surface and material response

Objective: Let the physical environment reflect its lighting choreography.

Tasks: strengthen already-associated wet-pavement highlights and architectural edge details from their own fixture output, not a disconnected global audio scalar. Inspect whether the existing reflection pass already reproduces the needed response before adding shader complexity.

Gate: matched on/off captures demonstrate credible local light influence; no implausible giant ripples or overblown postprocessing.

NT10 — Slow atmosphere and depth dynamics

Objective: Give quiet, building, and energetic passages different spatial character.

Mapping: first evaluate the existing MusicFeaturesV1.context.intensity, context.activity, and context.brightness (guarded by brightnessValid) as inputs to slow, bounded fog illumination, distant visibility, and subtle color balance. Use calibrated energy trends only where a distinct scene-local response is justified. Maintain a stable dark resting state and avoid rapid full-scene exposure pumping.

Gate: quiet/energetic/return-to-quiet test sequences remain recognizably Noctune and never wash out the alley.

NT11 — Whole-scene musical coordination

Objective: Make distinct outputs read as one composition.

Tasks: tune relative prominence, overlap limits, and contrast. A dense chorus may involve many groups, but not all must hit maximum. Use rolling energy changes conservatively to create larger-scale visual transitions; don't label them as detected chorus/drop/beat without supported features.

Gate: qualitative comparison of quiet intro, bass entrance, midrange addition, dense passage, breakdown, and return with synchronized evidence. Owner artistic approval required.

NT12 — Deterministic feature and response tests

Objective: Prove the mapping with controlled input.

Test matrix: silence; 100 Hz / 1 kHz / 8 kHz sustained tones (subject to actual band boundaries); isolated low/mid/high attacks; sustained energy without repeat attacks; bass+high-mid mix; low-mid-only attack near stationary high-mid energy; rising/falling dynamics; stale features; duplicate events; session switch; manual, zero Reactivity, reduced motion.

Evidence: time-aligned feature trace, response targets, final light/material values, expected/actual pass criteria. Gate: all intended mappings pass and no unrelated lighting activation.

NT13 — Real-music artistic review

Objective: Verify perceived musicality, not just synthetic correctness.

Test material: owner-authorized contrasting tracks: bass/percussion-heavy, midrange-dense, sustained ambient, light/percussive, and dynamic quiet-to-loud material. These are listening cases, not purported genre classifiers.

Evidence: generated synchronized audio/video and fixed-camera comparisons, plus live owner-authorized real-song observations and owner notes. Do not record, persist or inspect captured media; real-song review is live only under AGENTS.md. Ask whether bass/mid/treble have visibly distinct roles; attacks differ from sustained energy; silence settles; dense sections remain legible; choreography feels purposeful rather than random.

Gate: owner approves real-song feel; if not, tune visual response first and return only to analysis changes when a measured feature defect is demonstrated.

NT14 — Performance, accessibility, and lifecycle

Status: **Skipped by owner, 2026-11-23.** Requirements below are retained for reference; this phase is not marked passed.

Objective: Keep the experience viable in production.

Tasks: compare baseline/final FPS and frame time at each quality level on relevant hardware; monitor draw calls, point-light/shadow cost, reflection/postprocess cost, and resource disposal. Verify fullscreen, reduced motion, zero Reactivity, quality switching, disconnect/reconnect, scene swaps, and multi-minute playback.

Gate: no unacceptable regression relative to the documented baseline; manual device performance remains marked pending until measured.

NT15 — Closeout and handoff

Status: **Skipped by owner, 2026-11-23.** Requirements below are retained for reference; no closeout/commit authorization is implied.

Objective: Leave trustworthy documentation and an auditable state.

Tasks: update NOCTUNE_VISUAL_MAPPING.md, MUSIC_INTELLIGENCE_MIGRATION.md, and project progress docs; include exact parameters, actual code paths, test commands/results, visual evidence, owner approvals, unresolved issues, and a concise change summary.

Gate — Complete: Noctune uses Music Intelligence exclusively; all authorized visual mapping features are implemented and approved; technical, real-song, and performance checks are accurately distinguished. Do not remove shared legacy infrastructure yet.

4. Cross-phase acceptance matrix

Concern

Required evidence

Failure symptom

Music Intelligence exclusivity

Static dependency audit plus runtime signal trace

Noctune still reads AudioSignal or global legacy atmosphere

Event correctness

Session/sequence/timestamp tests

Retriggering old hits or attacks after disconnect

Musical independence

Isolated tones, onset cases, mixed inputs

All fixture groups rise together to overall loudness

Contrast

Quiet/loud side-by-side video

Sustained max brightness or near-total blackouts unrelated to music

Visual composition

Fixed-camera matched frames

Dominant right fixture or cyan left balance unintentionally changed

Physical plausibility

Wet-floor and wall-spill comparisons

Light reflection detached from source fixture

Accessibility

Reduced-motion and reactivity tests

Uncontrolled strobe, motion despite opt-out

Performance

Measured before/after FPS and GPU cost

Excessive new lights/postprocess cost

Human musicality

Synchronized real music and owner review

Tests pass but scene still feels static or arbitrary

5. Stop conditions and change control

Stop and report if a required Music Intelligence feature is missing or its units/semantics differ materially from this document. Propose a contract change separately; do not quietly reintroduce legacy analysis.

Stop before modifying authorized capture behavior, other landscapes, or unrelated application infrastructure.

Stop and ask for artistic direction if an effect would fundamentally alter the approved composition, add persistent conspicuous geometry, or introduce camera motion.

Avoid claiming a pass for browser pixels, real-song synchronization, or hardware performance based only on tests or generated traces.

Before commits, review git status, preserve unrelated work, and obtain the owner's normal commit instruction.

6. Completion ledger (update in repo)

Phase

Initial status

Required review

NT01

Approved; current-repository audit linked below

Technical/design approval

NT02

Implemented; technical checks passed; see NT02 report

Code/tests

NT03

Implemented; exact NT02 parity and technical checks passed

Code/tests

NT04

Approved by owner “proceed” after NT04 review

Migration visual approval

NT05

Implemented; technical verification passed; lighting review pending

Grouped lighting artistic approval

NT06

Implemented; technical verification passed; lighting review pending

Grouped lighting artistic approval

NT07

Implemented; technical checks passed; owner music/device review pending

Grouped lighting artistic approval

NT08

Implemented; technical checks passed; grouped owner music/lighting/device review pending

Grouped lighting artistic approval

NT09

Verified existing surface response; no production modification needed

Grouped environment artistic approval

NT10

Implemented; technical verification passed; owner environment review pending

Grouped environment artistic approval

NT11

Technical coordination assessment passed; mappings retained; owner artistic approval pending

Grouped environment artistic approval

NT12

Verified:54 contract cases,36 spectral configurations,28 PCM/control criteria; production unchanged

Test evidence

NT13

Complete: owner approves all five R5 visual criteria and reports all five current-build listening cases worked (2026-11-23)

Owner musical approval

NT14

Skipped by owner, 2026-11-23; not marked verified

Hardware/performance approval

NT15

Skipped by owner, 2026-11-23

Final handoff

Current disposition (2026-11-23): NT13/R5 owner gate is complete. Owner explicitly skipped NT14 and NT15; no further phase is queued and no commit is authorized.

NT01 reconciliation (2026-11-22): [Approved current-repository audit](reports/nocturne/NT01_MIGRATION_AUDIT.md). NT01 approved by owner; NT02 implementation authorized. The audit supplies exact runtime/UI dependencies, context semantics, material constraints and lifecycle safeguards. Historical “pending audit” descriptions above refer to the original proposal; this checkpoint supersedes them.

NT02 checkpoint: [Integration report and exact baseline curves](reports/nocturne/NT02_INTEGRATION.md). All Nocturne scene and activity feedback consumers now use MI. Geometry/material grouping remains unchanged; NT03/NT04 and subsequent artistic phases are pending.

NT03 checkpoint: owner “procced” authorizes the unified visual state. [Implementation and evidence](reports/nocturne/NT03_VISUAL_STATE.md) show one feature read, named output channels and exact NT02 final-value parity; no artistic curve or geometry change. NT04 remains pending.

NT04 checkpoint: [Production migration review](reports/nocturne/NT04_MIGRATION_REVIEW.md) passed technical checks and matched Manual visual comparisons; source untouched. Actual generated-audio brightness differences are documented. Owner migration visual approval remains pending; NT05 is not authorized.

NT05 checkpoint: owner “proceed” accepts NT04 and authorizes NT05. [Magenta response implementation/evidence](reports/nocturne/NT05_MAGENTA_REVIEW.md) separates main, secondary and unchanged bridge material batches. No shape/camera/DSP or other response change. NT05 implemented; owner lighting acceptance and NT06–NT08 remain pending.

NT06 checkpoint: owner “proceed” after NT05 authorizes this midrange phase. [Implementation/evidence](reports/nocturne/NT06_MIDRANGE_REVIEW.md) separates windows/detail panels, preserves the approved high-mid fixture exactly and verifies existing geometry through matched Manual pixels. NT06 implemented; lighting acceptance and NT07/NT08 remain pending.


NT07 checkpoint: owner “proceed” after NT06 authorizes bounded bridge choreography. [Implementation/evidence](reports/nocturne/NT07_BRIDGE_REVIEW.md) segments only the two existing diffusers into six contiguous thirds and drives finite left-to-right travel from qualified low onsets. Existing bridge spill uses mean section brightness; no added point lights or shared analysis changes. Technical verification passed; owner lighting/music/device acceptance and NT08 remain pending.


NT08 checkpoint: owner “proceed” after NT07 authorizes bounded treble detail. [Violet implementation/evidence](reports/nocturne/NT08_VIOLET_REVIEW.md) separates existing strips into two side batches, with restrained presence/air sustain and alternating finite high-event accents. No transforms, point-light inventory, global atmosphere or shared audio changes. Technical checks passed; grouped NT05–NT08 owner lighting/music/device review is now the next gate. NT09 is not started.


NT09 checkpoint: owner “proceed” after NT08 authorizes surface assessment. [Verification/evidence](reports/nocturne/NT09_SURFACE_REVIEW.md) shows the existing live planar reflection and associated point/material response already deliver credible local magenta/cyan influence at both qualities. Existing shader/materials retained; no production changes. All89 source files remain byte-identical to task-start f0485eb. Record weak/fixed-viewport reflection limits without synthetic floor effects. NT10 is next after review; native/music/device and grouped environment approval remain pending.


NT10 checkpoint: owner “proceed” after NT09 authorizes slow atmosphere/depth. [Implementation/evidence](reports/nocturne/NT10_ATMOSPHERE_REVIEW.md) uses existing intensity, activity weighted by intensity, and valid brightness for bounded multi-second glow, fog-far and palette response. No fixture, geometry, material, camera or MI change. Manual remains pixel-identical; actual fixture outputs and resource counts preserved. Technical verification passed; NT11 is next after review and grouped environment/music/device acceptance remains pending.


NT11 checkpoint: owner “proceed” after NT10 authorizes whole-scene coordination review. [Staged synchronized assessment](reports/nocturne/NT11_COORDINATION_REVIEW.md) covers quiet intro, bass entrance, mid addition, dense passage, breakdown, return and silence. Existing mappings maintain distinct roles and bounded local overlap; no concrete tuning defect found, so no production changes. All90 source files preserved. Technical assessment passed; owner NT11 artistic/grouped environment approval remains pending before NT12.


NT12 checkpoint: owner “proceed” accepts continuation after the NT11 review and authorizes deterministic verification; “continue” resumes this same phase. [Matrix/evidence](reports/nocturne/NT12_MATRIX_REVIEW.md) passes54 contract cases,36 processor configurations and28 browser PCM/control criteria. All90 source files unchanged; no analysis or scene tuning required. NT12 technical gate passed. NT13 needs owner-authorized live music and owner artistic notes; no real-song/device/native acceptance inferred.


NT13 checkpoint: owner “continue” after NT12 authorizes preparation for live musical review. [Owner worksheet and pending ledger](reports/nocturne/NT13_LIVE_REVIEW.md) covers the five contrasting listening cases and actual artistic decision. Local app is available; all production source preserved. No real-song playback was inspected or recorded, no owner results inferred, and NT13 remains open pending cases/observations/approval. NT14 is not started.


NT13 brightness feedback: owner reports bass tracking but dim Audio corridor versus Manual. [Matched local spill proposal](reports/nocturne/NT13_SPILL_PROPOSAL.md) is ready in a temporary copy; no production changes. Owner choice and live re-review precede further tuning/NT14. Preserve approved cyan and independent fixture response; no DSP/global-exposure adjustment proposed.


NT13 applied checkpoint: owner “do the lift” approves the [Audio spill correction](reports/nocturne/NT13_SPILL_IMPLEMENTATION.md). Main magenta point1.5×, window/detail points2×, bounded by original full intensity; Manual unchanged. Final spill is a separate unified-state output; emitters/approved cyan/other points/atmosphere/timing and all89 other source files remain unchanged. Generated checks pass; live owner re-review still required. NT14 is not started.

NT13 refinement follow-up (2026-11-22): owner requested the [R0–R5 refinement roadmap](NOCTUNE_NT13_REFINEMENT_ROADMAP.md) one phase at a time. R0–R4 technical/refinement evidence and owner-authorized R5 aligned comparisons are ready; [latest owner gate](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r5--aligned-comparison-and-owner-gate-2026-11-23) records explicit approval of all five criteria and all listed current-build listening cases. R4/R5 change no production source. NT13 is approved; NT14 is next, not automatically started.

NT16 (2026-11-26): after an owner review against the Industrial Crossing board, the owner approved glow around the lights, streaked wet-floor reflections and gate/fixture haze. Implemented; owner review pending. [Evidence](evidence/nocturne/nt16/README.md). Remaining review items (cyan balance, distant towers, neon strips and bridge, idle focal point) are not planned.
