ECHO — Noctune 2.0 Visual Mapping Specification

Plan version: 1.2 · Prepared: 2026-11-22 · Status: Proposed artistic contract; partially source-checked at e627ff821e84dd0f8e781fa9b259805d4822ac39, owner review pending
Destination: docs/NOCTUNE_VISUAL_MAPPING.md · Primary plan: NOCTUNE_MASTER_ROADMAP.md

1. Creative brief

Identity: An industrial alley at night, magenta/cyan/violet practical lighting, deep shadows, mist, and wet pavement. Its architecture does not physically dance: the city plays the music through light, reflection, and atmospheric depth. Existing bounded mouse parallax is retained, but there is no autonomous forward travel or music-driven camera motion.

Keep: stable camera composition and approved interactive mouse parallax; authored mesh silhouettes; right-side magenta focal fixture; approved shorter/narrower recessed left cyan fixture beneath the bridge; original color families; legible dark resting state; reflections tied to nearby lights.

Avoid: generic equalizer bars pasted on scene; perpetual random flashes; synchronized full-scene pumping; decorative light chases without musical triggers; massive terrain or architecture deformations; sun/camera effects copied from Crimson; full-screen strobing; unnecessarily numerous dynamic point lights.

Definition of success: In a varied song, a viewer should be able to see different musical roles—low-frequency weight, sustained midrange color, rapid high-frequency detail, attacks, and longer changes in energy—without guessing that every element uses the same loudness value.

2. Available music semantics (source checked; reverify current worktree)

Available signal according to supplied audit

What it supports

Important constraint

energy.six.{subBass,bass,lowMids,highMids,presence,air}

Continuous sustained frequency-specific intensity

Names verified in src/audio/musicFeatures.ts; do not assume dB values or legacy scaling

energy.{low,mid,high,overall}

Broader energy targets

Confirm semantics in current source before weighting

energy.six.highMids, reportedly 800–2500 Hz

Existing independent cyan-panel sustain

Reported field/range; verify source before code changes

Low onset event

Brief low-frequency attack

Event is not a kick/instrument classifier

Mid onset event, reportedly broad 250–4000 Hz

Brief mid-frequency attack candidate

No six-band attribution; qualify with recent target-band energy change

High onset event

Brief upper-frequency attack

Event is not automatically a hi-hat classifier

active/fresh, session and sequence

Lifecycle, staleness and single consumption

Event timestamps reported in seconds; legacy updatedAt was milliseconds

context.{intensity,brightness,brightnessValid,activity}

Measured slow musical context already available

Respect brightnessValid; inspect context algorithms, response timing and ranges before use

MusicFeatureReader.read() returns a borrowed reused view; copy needed scalars/events into bounded scene-local history rather than storing the view reference. If further features exist in a newer checkout, use them only after documenting and validating the contract. Do not quietly synthesize nonexistent beat, BPM, vocal, drop, chorus, or instrument properties.

3. Scene response vocabulary

Each visual control is a bounded, deterministic combination of the following different kinds of response:

Sustain: energy-driven target with attack/release smoothing; captures long notes, basslines, pads, and overall tonal presence.

Accent: one-shot, event-triggered short response; uses onset strength, event de-duplication, optional qualifying band-energy history, local cooldown/overlap policy, and a controlled decay.

Travel: event-triggered short sequence across selected existing/low-cost emissive bridge segments; never a continuous decorative loop.

Atmosphere: slow, bounded movement of fog/ambient depth guided by broad calibrated energy trends; should not strobe or react at drum-hit timescale.

Secondary response: a reflection/highlight derived from the related fixture's final visual output, not a second unrelated audio input.

Default production behavior is derived entirely from MusicFeaturesV1 plus scene-local smoothing/history; manual preview intentionally overrides the same final controls. Preserve Reactivity=0 and reduced-motion semantics.

4. Proposed audio-to-visual map

This is an artistic mapping proposal, not a claim that the corresponding code already exists. NT01 confirms actual meshes/material names; NT05–NT11 implement the approved map.

Musical role

Visual target

Sustain / envelope

Event / travel

Visual priority

Deep lows / sub-bass

Local deep-magenta environmental contribution

Slow, weighty, bounded

Minimal or none

Supporting

Bass

Dominant right magenta wall fixture

Noticeable sustained bass response

Brief low-onset intensity hit; faster than sustain

Primary

Bass accents

Smaller existing magenta fixtures

Lower-gain complementary response

Selective short accents, not exact copies

Secondary

Low mids

Existing left-side architectural details

Moderate, gentle illumination

Qualified mid-onset accents as appropriate

Secondary

High mids

Recessed left cyan panel

Preserve verified sustained mapping

Preserve verified qualified onset accent

Secondary focal

Other mids

Existing cyan windows/fixtures

Distinct from panel; avoid one shared scalar

Selective mid-onset timing

Supporting

Treble / upper bands

Existing violet strips

Quick but restrained energy response

High-onset localized highlights

Detail

Qualified rhythmic events

Bridge underside segments

Dark or low baseline

Short horizontal travel with finite tail/cooldown

Signature motion

All groups' final light values

Nearby wet pavement and wall surfaces

Physical/derived reflection

Naturally follows fixture accents

Supporting realism

context.intensity, valid context.brightness, context.activity, plus energy history when warranted

Fog, far architecture, restrained ambient tint

Slow rise/fall, bounded

No drum-rate pumping

Background

The verified six-band names are subBass, bass, lowMids, highMids, presence, and air; inspect exact numeric boundaries and determine which one or combination best drives each role. Low/mid/high onset events are broad; do not equate them with independent per-band onset detections. Ensure the global/atmosphere response does not clandestinely brighten all fixtures.

5. Already-implemented left cyan fixture: preserve as baseline

The following was supplied in the earlier audit and visual-review reports; validate values in code before changing anything:

Geometry: one recessed, shorter/narrower vertical cyan fixture below the bridge, independent of the larger right magenta fixture.

Musical sustain: high-mid energy 800–2500 Hz, target approximately 0.65 × clamp(energy / 0.5) × Reactivity.

Earlier reported rise/fall: .06 s / .18 s.

Qualified accent: broad mid onset only when recent high-mid energy rise is detected (reported ≥.02 within .09 s), up to .35 × eventStrength × clamp(rise / .2) × Reactivity, decaying around .22 s.

Delivered appearance: emissive ≈1.3 × level; local point light =30 × level (distance 9, decay 2); approved cyan spill on wall and wet pavement.

A controlled review found attack accents visually subtle; a proposal to increase .35 to .6 and .22 s to .28 s was not implemented or approved. Do not silently apply it.

Controlled tests indicated high-mid sustain/attacks, bass isolation, low-mid isolation, silence decay, and mixed-band independence. Actual-song feel and hardware FPS remain distinct review items.

The migration may refactor this into the unified scene response layer only with behavior-equivalent tests and matched visual evidence. Preserve its independent material, light, and manual-preview value.

6. Behavioral specifications by system

A. Magenta: weight and impact (NT05)

The dominant fixture carries the low-end focus. Maintain the approved magenta brightness hierarchy and wall spill.

A sustained bassline should hold a meaningful but bounded glow; attacks should add separable short changes.

Smaller magenta fixtures should not just use the same final response value. They may have lower gain, differing smoothing, or selected event-driven accents.

Avoid creating multi-second max-on passages solely from normalization/clamping. Preserve silence falloff and quiet passage contrast.

B. Cyan: harmonic detail (NT06)

The new left panel keeps its verified high-mid behavior as a known-good reference.

Existing cyan windows and details should no longer be forced to illuminate in exact synchrony with every other cyan instance.

Low-mid-only events must not trigger high-mid-only accents. Use locally qualified event history rather than inventing high-mid onset fields.

Effects should remain legible when bass is absent.

C. Violet: fast, precise accents (NT08)

Existing violet strips communicate upper-frequency detail using fast but controlled visual timing.

Event-related accents should be localized and short, not a full-frame strobe.

Reduced-motion mode should suppress or soften rapid accents as appropriate.

D. Bridge: musical direction (NT07)

Add only minimal, visually integrated underside segmentation if the current model lacks segmentable strips.

One qualifying onset produces one finite travel with consistent direction; define re-triggering and overlap during fast event clusters.

Keep timing derived from real event arrival, not random clocks or a guessed tempo.

Test a quiet section, isolated onset, repeated onsets, and dense events for readability.

E. Reflections and surfaces (NT09)

Reuse the current reflective wet floor. First verify whether existing material/reflection pass already conveys music-driven luminance.

If inadequate, adjust narrow local highlight response based on the final associated fixture level.

Do not create audio-driven ocean waves or unrelated global glints on dry surfaces.

F. Atmosphere and transitions (NT10–NT11)

Use slow, independent scene-local smoothing for already-available Music Intelligence context values where valid; derive a separate energy composite only when a concrete artistic need warrants it.

Preserve low ambient visibility in silence; avoid a hard all-black scene that hides the authored composition unnecessarily.

Builds, breakdowns, and strong returns are visual responses to energy history, not claims of reliable musical-section detection.

During dense passages, prioritize contrasting fixture states over saturating every emissive and fog channel at once.

7. Initial timing principles (tuning guidance, not hardcoded acceptance)

Response class

Qualitative timing

Why

Bass attack accent

Immediate, short, impactful

Preserve kick-like punch

Bass sustained illumination

Smoother, longer

Separate bassline from hits

Midrange sustain

Smooth, readable

Express melodic/harmonic presence

Midrange qualified attack

Brief above the sustain

Distinguish attack from hold

Treble accent

Fast and restrained

Express high-frequency rhythm without strobe

Bridge travel

Finite brief motion

Convey direction, not continuous scanning

Fog and distance

Slow, understated

Reflect musical energy over phrases rather than drum hits

Use measured response curves and reference videos to choose exact numbers. Avoid requiring a universal coefficient across visually different components. Record every approved gain, floor, clamp, attack, release, cooldown, and event-qualification rule in this file after implementation.

8. Artist-facing storyboard for testing

Passage

What a listener should notice

Silence

Stable dark alley; no false attacks or residual flashes

Sustained bass only

Weighty magenta presence, little/no high-frequency cyan/violet activity

Bass attacks

Clear magenta punch distinct from underlying sustain

Sustained high mids

Cyan fixture and appropriate architecture illuminate without requiring bass

Repeated midrange attacks

Cyan accents and/or selected architectural responses without permanent maximum hold

Hi-hat-like high-frequency activity

Brief, delicate violet detail, not all lights flashing

Dense mix

Distinct systems remain readable instead of collectively reaching 100%

Breakdown

Reactive detail withdraws; atmosphere settles more gradually

Return of energy

Several distinct elements re-enter coherently

9. Review protocol and sign-off

For each substantive artistic phase:

Use a matched camera with pointer centered (so the existing mouse parallax does not vary) for the same signals before and after the change.

Provide synchronized generated audio or a time-coded feature trace and clearly label which was used.

Show separate controls for each affected visual group in an inspection/debug mode; do not expose debug UI unintentionally in production.

Verify isolation with bass-only, low-mid, high-mid, high-only, silence, mixed input; inspect event accents separately from sustained envelopes.

Obtain owner approval from live permitted real-song review at NT13; save generated demonstrations only, consistent with AGENTS.md media privacy. Unit tests and computed light intensities are not pixel/perceptual proof.

Record user approval, requested revisions, and the exact tuning values.

Performance budget: measure actual frame time/FPS rather than making a premature numerical claim. Prefer shared/batched emissive geometry, bounded event histories, and minimal additional point lights.

10. Mapping implementation ledger (complete in repository)

System

Phase

Final feature source

Final parameter values

Test evidence

Visual approval

Dominant magenta

NT05

Pending audit

Pending

Pending

Pending

Secondary magenta

NT05

Pending audit

Pending

Pending

Pending

Existing cyan

NT06

Pending audit

Pending

Pending

Pending

Recessed left cyan

Preserve during NT02–NT04

High-mid + qualified mid onset, reported

Reported in §5; verify

Prior synthetic evidence; revalidate

Prior composition approved; migration not yet reviewed

Violet accents

NT08

Pending audit

Pending

Pending

Pending

Bridge segments

NT07

Pending design

Pending

Pending

Pending

Reflections

NT09

Derived from fixtures

Pending

Pending

Pending

Fog/distance

NT10

Derived slow energy

Pending

Pending

Pending

Cross-system composition

NT11

All final outputs

Pending

Pending

Pending

Next action: NT01 audit and NT02–NT04 migration. Do not implement NT05–NT11 before migration baseline is reviewed.


NT01 reconciliation (2026-11-22): [Approved current-repository audit](reports/nocturne/NT01_MIGRATION_AUDIT.md). NT01 approved by owner; NT02 implementation authorized. The audit supplies exact runtime/UI dependencies, context semantics, material constraints and lifecycle safeguards. Historical “pending audit” descriptions above refer to the original proposal; this checkpoint supersedes them.

NT02 migration baseline: broad magenta/cyan/violet now read calibrated MI low/mid/high energy plus event accents; atmosphere reads context.intensity. Exact curves and evidence: [NT02](reports/nocturne/NT02_INTEGRATION.md). Existing batches remain intact until their artistic phase. Left cyan composition and coefficients preserved; later mapping ledger rows stay pending.
