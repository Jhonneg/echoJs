ECHO — Noctune 2.0 Visual Mapping Specification

Plan version: 1.11 · Prepared: 2026-11-22 · Status: Proposed artistic contract; partially source-checked at e627ff821e84dd0f8e781fa9b259805d4822ac39, owner review pending
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

MI six.bass/subBass + fresh low onset

NT05 parameters below

NT05_MAGENTA_REVIEW.md

Implemented; owner lighting review pending

Secondary magenta

NT05

MI six.bass/subBass sustained body

NT05 parameters below

NT05_MAGENTA_REVIEW.md

Implemented; owner lighting review pending

Existing cyan

NT06

MI six.lowMids/highMids; low-mid-qualified mid event for small panels

NT06 parameters below

NT06_MIDRANGE_REVIEW.md

Implemented; owner lighting review pending

Recessed left cyan

Preserve during NT02–NT04

High-mid + qualified mid onset, reported

Reported in §5; verify

Prior synthetic evidence; revalidate

Prior composition approved; migration not yet reviewed

Violet accents

NT08

Implemented: presence/air sustain, alternating localized high accents

Technical verification passed

Owner grouped lighting/music/device review pending

Existing violet geometry and two spill lights retained

Bridge segments

NT07

Implemented: six contiguous sections, low-onset finite travel

Technical checks passed

Owner lighting/music/device review pending

Existing bridge spill reused; see NT07 parameters

Reflections

NT09

Existing reflected scene and associated point/material response retained

Matched on/off and isolated contribution checks passed

Owner environment/music/device review pending

No new shader, gain, floor light or audio uniform

Fog/distance

NT10

Implemented: slow context intensity/activity/valid brightness

Technical verification passed

Owner environment/music/device review pending

Existing fog/gate/haze only; Manual appearance unchanged

Cross-system composition

NT11

Current distinct mappings retained after staged assessment

Technical staged checks passed

Owner artistic approval required

No new global gain or shared limiter

Next action: owner artistic review of NT11 staged coordination before NT12. No additional mapping change proposed; grouped environment/music/device acceptance remains pending.


NT01 reconciliation (2026-11-22): [Approved current-repository audit](reports/nocturne/NT01_MIGRATION_AUDIT.md). NT01 approved by owner; NT02 implementation authorized. The audit supplies exact runtime/UI dependencies, context semantics, material constraints and lifecycle safeguards. Historical “pending audit” descriptions above refer to the original proposal; this checkpoint supersedes them.

NT02 migration baseline: broad magenta/cyan/violet now read calibrated MI low/mid/high energy plus event accents; atmosphere reads context.intensity. Exact curves and evidence: [NT02](reports/nocturne/NT02_INTEGRATION.md). Existing batches remain intact until their artistic phase. Left cyan composition and coefficients preserved; later mapping ledger rows stay pending.


## NT03 implemented response contract (migration baseline)

`visualState.ts` exposes distinct channel objects for magentaMain, magentaSecondary, cyanWindows, cyanDetails, cyanPanel, violet and bridge. Each contains sustainTarget, accent and final level. Reflections are derived one-for-one from final fixture levels; atmosphere supplies a separately eased level and weighted colors. These are independent addresses, not new choreography: current material batches and NT02 shared curves remain intact.

| Control | Actual parameters retained at NT03 |
| --- | --- |
| Broad low/mid/high sustained target | `.65 * clamp(energy / .5) * gain`; no additional noise floor |
| Broad event accent | Matching fresh low/mid/high event, `.3 * strength * gain`, .22 s exponential decay; no separate cooldown |
| Broad final easing | Magenta .025/.18 s, original cyan .035/.22 s, violet .02/.14 s; combined target clamped 0–1 |
| Panel sustain | HighMids 800–2500 Hz; `.65 * clamp(energy/.5) * gain`, .06/.18 s easing |
| Panel event accent | Broad mid event; recent high-mid rise ≥.02 within .09 s of attack, rise reference .2, `.35 * strength * clamp(rise/.2) * gain`, .22 s decay; max 64 scalar samples |
| Atmosphere | Context intensity; .25 s rise, .8 s active/.35 s inactive fall; magenta/cyan/violet weights .24/.85/.16, fog tint ×.018 over existing neutral baseline |
| Reduced motion | Broad final .8/1.1 s, no new broad event accents; panel sustained .8/1.1 s with sharp accents suppressed; atmosphere 1.2/1.5 s |
| Eligibility and bounds | Active feature age 0–.25 s; event emission age 0–.25 s, own session/sequence; dt capped .05 s; gain 0–1; zero gain clears audio output; Manual overrides final controls; tiny zero-target levels settle below .001 |
| Renderer delivery | All fixture materials ×1.3; existing point intensities ×level (magenta50/40, cyan65/40, panel30, violet12/12); no new passes/materials/lights |

The sustain target and one-shot accent remain separate from the final eased broad-group output; the panel additionally retains its eased sustained contribution. [NT03 evidence](reports/nocturne/NT03_VISUAL_STATE.md) verifies 6,300 exact NT02 output comparisons and matched Manual pixels. Later NT05–NT11 parameter/approval ledger entries stay pending.

NT04 visual checkpoint: [Matched before/after and generated-audio comparisons](reports/nocturne/NT04_MIGRATION_REVIEW.md) retain exact Manual appearance across both quality settings and three viewport shapes. Original narrow portrait framing is unchanged. Broad-group and haze audio brightness differ deliberately after calibrated MI migration; owner must accept that baseline before choreography. No parameter was tuned during NT04.


## NT05 implemented magenta parameters

Owner “proceed” approves NT04 and authorizes this bounded change. One existing right fixture, five secondary fixtures and the two bridge emitters now have separate material batches; authored transforms, palette and local light placements stay intact.

| Output | Sustain | Accent / lifecycle |
| --- | --- | --- |
| Main right magenta | `.5 * clamp((.8*bass + .2*subBass)/.35) * gain`; .12/.45 s rise/fall | Fresh validated low onset; `.42 * clamp(strength/.35) * gain`, 20 ms eased rise, peak through 55 ms, .2 s exponential decay, 1.2 s cutoff |
| Five secondary magenta | `.24 * clamp((.6*bass + .4*subBass)/.35) * gain`; .3/.7 s rise/fall | No event accent; deliberately weaker and slower |
| Bridge | Original NT04 broad-low curve and point intensity40 | Retained until NT07; no chase implemented |

Main Audio level ≤.92; secondary ≤.24. One pulse plus a finite scalar carried tail combine by maximum, preventing weaker overlapping attacks from notching the existing decay; no accumulated pool/cooldown/random clock. Events require own session, unconsumed sequence, positive finite strength and emission age 0–.25 s; suppressed Manual/zero/reduced events are consumed. Body eligibility uses active feature age 0–.25 s. dt≤.05 s; zero gain clears; inactive releases; session resets skip retained events; targets 0 settle below .001. Reduced motion suppresses the pulse and eases bodies with .8/1.1 s. Manual Magenta applies the same direct level to all three batches.

Materials still receive final level×1.3; existing near point uses main×50 and bridge point uses bridge×40. Reflections follow those actual fixtures. Cyan/violet/atmosphere responses and approved cyan placement/spill/reflections are untouched. [NT05 review and before/after evidence](reports/nocturne/NT05_MAGENTA_REVIEW.md). Main/secondary artistic acceptance and later lighting phases remain pending.


## NT06 implemented architectural cyan parameters

Window and small-panel batches are separated without changing the 342 existing transforms; the approved left fixture remains separate and unchanged. All Cyan Manual values still apply directly to windows/small panels and preserve the original appearance.

| Output | Sustain | Event / bounds |
| --- | --- | --- |
|336 window panes | `.18 * clamp((.7*lowMids + .3*highMids)/.35) * gain`; .35/.9 s rise/fall | No event accent; final≤.18 in Audio |
|6 small panels | `.28 * clamp(lowMids/.35) * gain`; .1/.35 s rise/fall | Broad-mid event needs low-mid rise≥.02 within .09 s of its attack; peak `.12 * clamp(strength/.35) * clamp(rise/.15) * gain`, .2 s decay; final≤.4 |

Qualifying history has 64 scalar slots, one per new feature frame, using a sample at least .06 s earlier when available; prime without an invented rise. Own session/sequence and event age 0–.25 s, active feature age 0–.25 s, dt≤.05 s; no event accumulation. Inactive clears history and releases bodies; zero/Manual clears audio values and consumes events. Reduced motion suppresses detail accents and uses .8/1.1 s body easing. Zero-target values settle below .001.

Existing window spill uses window×65, right small-panel spill detail×40, materials level×1.3. Approved left panel remains its original high-mid mapping and point×30. No global intensity enters these new fixture curves. [NT06 evidence](reports/nocturne/NT06_MIDRANGE_REVIEW.md) shows low-mid accents over stationary high mids do not retrigger the left panel. Other choreography and owner grouped lighting approval remain pending.


## NT07 implemented bridge parameters

Owner “proceed” after NT06 authorizes this phase. Replace the two shared bridge diffusers with six contiguous thirds in the same two housings; retain total footprint, palette and existing point light. Number sections0–5 from camera-left to camera-right, crossing the original central gap without adding a light there.

- Trigger: existing MI `low` onset, same session/unconsumed sequence, finite strength≥.04, emission age0–.25s and active feature age0–.25s. No energy/intensity-driven cycling or new detector. Start at the update that observes the fresh event.
- Peak per section: `.48 * clamp(strength/.35) * clamp(Reactivity)`; material receives section×1.3. Sections begin .12s apart, each with35ms eased rise, full peak through65ms, then quadratic fade to0 at320ms. Last section expires at920ms.
- One sequence only. Cooldown1.04s from start includes the920ms travel/tail plus120ms quiet interval. Ignore and consume events during this interval; no queue, restart or overlap. No retained media or feature view; six reusable scalar levels.
- Bridge channel/reflection summary is the mean of six final levels; existing bridge point receives mean×40. This restrained shared spill supports localized emissive travel without flooding both housings. Physical wet-floor reflection renders the actual section materials.
- Manual Magenta fills all six sections uniformly and preserves original point×40. Audio sustain target0. Reduced motion suppresses bridge travel completely, while other existing reduced-motion fixture glows remain. Zero gain, stale/inactive input, Manual entry and session changes cancel travel; suppressed/retained events never replay.

Only bridge output changes from NT06; all other fixture curves, global atmosphere, camera and approved cyan remain exact. [NT07 review and demonstrations](reports/nocturne/NT07_BRIDGE_REVIEW.md). Owner musical/readability and device-cost acceptance remain pending before closing the grouped lighting gate.


## NT08 implemented violet parameters

Owner “proceed” after NT07 authorizes this phase. All 12 existing violet strip transforms/colors remain intact, rebinned into right `violet` and left `violetSecondary` batches of 6 each. Existing near/far violet spill lights bind to right/left respectively; no added fixtures or lights.

| Component | Mapping | Bounds / timing |
| --- | --- | --- |
| Both sustained bodies | `.16 * clamp((.7*presence + .3*air)/.35) * gain` | 40/160 ms rise/fall; body ≤.16 |
| One bank accent | `.32 * clamp(highEvent.strength/.35) * gain` | 15 ms eased rise, peak through40 ms, quadratic fade to0 at240 ms |
| Alternation | Right first, then left on each accepted event | 400 ms start cooldown; at most one accent; drop/consume skipped events without queue/restart |
| Final delivery | Each bank = body + own accent | ≤.48 Audio; material×1.3; own existing point×12 |

Qualify existing `high` events only: own session, unconsumed sequence, finite strength≥.04, emission age0–.25 s and active feature age0–.25 s. Presence spans2500–6000 Hz and air6000–20000 Hz; broad high events span4000–20000 Hz, so presence below4000 Hz supports sustain without being claimed as a high onset. Overall intensity, bass, low mids and highMids do not enter the curve. Held energy never creates repeated accents.

Cooldown is global to the two banks: accepted attacks ≤2.5/s, alternating ≤1.25/s per bank, with a finite tail ending before the next start is allowed. This bounds visual activity but does not substitute for owner comfort review. Reduced motion suppresses accents and uses .8/1.1 s body smoothing. Zero gain/Manual clear audio body and accents; inactive/stale release body and cancel accents; new sessions reset body/alternation and skip retained events. Suppressed events never replay. Manual Violet still sets both banks uniformly. Targets0 settle below.001.

The unified update retains one MI read, borrowed only synchronously; two stable scalar arrays hold bank accents/levels. Reflections derive from each bank's actual final output, via the unchanged physical wet-floor pass. Magenta/cyan/bridge/atmosphere remain exact NT07 behavior. [NT08 report and generated demonstrations](reports/nocturne/NT08_VIOLET_REVIEW.md). Grouped NT05–NT08 owner artistic/music/device approval remains open before NT09.


## NT09 verified existing surface response — no production change

Owner “proceed” after NT08 authorizes this assessment. The existing planar wet floor already reflects delivered material/light brightness after LightingDriver's priority-1 update; its texture is the current reflected scene, not a separate audio scalar. `state.reflections` names final source levels for diagnostics/coordination; the floor does not consume them as another brightness multiplier. Existing point lights illuminate authored industrial wall materials and nearby details.

Preserve WetGround's static wetness/Fresnel mask, five-tap reflection spread and small static UV distortion; there is no audio-driven water motion. Retain wall roughness/bump maps and all existing material coefficients. No added edge highlight shader or broad reflectivity increase is justified by the NT09 measurements.

Matched fixture off/.25/.75 captures hold every other final fixture and atmosphere at0 in an isolated diagnostic copy. Both Standard/Low show proportional ordering of magenta/cyan pavement color, distinct reflection-versus-spill contributions, and local wall response. Actual uninstrumented production cyan-on/off pairs match the diagnostic images exactly. Reduced-motion static floor pairs also match exactly. [NT09 report and captures](reports/nocturne/NT09_SURFACE_REVIEW.md).

Bridge strip mirror images lie below the fixed viewport; the sampled visible floor shows their shared mean-driven spill, without a traveling head image. Distant left violet influence is much weaker than near violet, especially at Low quality. These are recorded framing/resolution limits, not reasons to invent global glints, move the camera or alter approved geometry. Preserve the current implementation pending owner environment/music review. NT10 remains separate.


## NT10 implemented slow atmosphere parameters

Owner “proceed” after NT09 authorizes this phase. Existing MI context is sufficient; no new energy composite, event detector, analyser or section recognition. `atmosphereResponse.ts` receives the same single borrowed MI frame as fixture controllers.

| Internal response | Target | Normal time constants | Reduced motion |
| --- | --- | --- | --- |
| Distant illumination `level` | `.65 * clamp(intensity) * gain` | 2 s rise /4 s fall | 4/6 s |
| Depth `density` | `clamp(activity) * clamp(intensity) * gain` | 3 s rise /5 s fall | 4/6 s |
| Signed balance `tint` | `(2*clamp(brightness)-1) * clamp(intensity) * gain`, only if valid and finite; otherwise0 | 4 s in either direction | 6 s |

Intensity is already MI's calibrated broad-RMS context with .75/1.5 s smoothing; activity is a four-second strength-weighted onset rate, not BPM. Brightness is log-normalized spectral centroid, not a mood/warmth detector. Scene-local smoothing compounds these upstream time constants intentionally; no latency claim from the scene coefficient alone.

Audio final color weights: `magenta=level*(.24-.04*tint)`, `cyan=level*(.85+.03*tint)`, `violet=level*(.16+.04*tint)`. Higher centroid makes the small balance shift toward cyan/violet, lower centroid toward magenta. Existing palette colors mix into gate emission and haze glow; existing fog color stays `baseline('#05070b') + glow*.018`. No ambient/exposure increase.

Fog near stays17 m, so near architecture remains unaffected by fog. Fog far=`74-8*density` m, bounded66–74. Activity without intensity cannot maintain density or illuminate the scene. Existing fog/gate/haze geometry/materials and floor/wall shaders are unchanged; distant geometry naturally receives the changed fog attenuation. No additional light, render pass or material.

Active feature age0–.25 s is required. Stale/inactive target0 and release slowly; zero gain/Manual clear audio envelopes immediately. New session resets history. dt≤.05 s; zero targets settle below.001 (absolute value for signed tint). Manual retains original weighted colors and fog17/74 exactly; Audio baseline remains dark with unchanged environmental fill. The old broad helper still computes a historical atmosphere value, but final Audio rendering now uses only the new controller.

[NT10 review/evidence](reports/nocturne/NT10_ATMOSPHERE_REVIEW.md) covers live generated quiet/energetic/recovery, reduced motion, independent context snapshots, actual delivery, exact Manual pixels and unchanged fixture outputs/cost. NT11 and owner environment/music/device approval remain separate.


## NT11 coordination assessment — current mappings retained

Owner “proceed” after NT10 authorizes this phase. Generated intro, bass entrance, midrange addition, dense passage, breakdown and return show distinct existing roles without a specific balance defect. No new coefficients, overlap limiter, global gain or energy-history layer is added. Per-fixture caps/timing/localization from NT05–NT08 plus the slow NT10 atmosphere remain the coordination policy.

In the assessed dense section, main magenta mean/peak≈.1595/.2314, secondary mean≈.0460, windows≈.0380, details≈.0565, approved cyan panel mean/peak≈.1115/.1840, and violet-bank peaks≈.1095. One violet bank can accent at a time; at most3 of6 bridge sections are nonzero during travel. Numeric levels are not interchangeable measures of perceptual prominence across differently sized fixtures. Existing right magenta remains the visual anchor in inspected frames.

Bass-only passage leaves the cyan panel near0; adding midrange raises cyan without forcing windows to accent. Breakdown retains only a quiet high-mid pad and fading atmosphere; the return restores layered roles. Final silence settles all fixture outputs to0 while atmosphere releases slowly. Reduced motion has no sharp accents or bridge travel. These are responses to supplied features and authored test schedule, not detected song sections.

[NT11 report and synchronized stage evidence](reports/nocturne/NT11_COORDINATION_REVIEW.md) retains observed values, actual material/point delivery and all90 unchanged source hashes. Owner artistic approval is required by NT11; it has not been inferred from automation. NT12 and real-music review remain separate.
