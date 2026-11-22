# VP00 — Baseline and comparative capture

Status: IMPLEMENTED — AWAITING OWNER REVIEW.

Owner closes the original VM roadmap and selects CRIMSON_VISUAL_POLISH_ROADMAP.md as the remaining implementation plan. Start checkpoint:6281d27 (`crinsmom complete`), clean repository. VP00 changes only DEV capture tooling and documentation; production rendering, camera, shared Music Intelligence, adapters and authored geometry are unchanged. VP01 has not started.

## Current mapping inventory

| Effect | Actual signal and current bounds |
| --- | --- |
| Sun brightness | .75 low + .25 overall energy, scene saturation at.35, then Reactivity; journey250ms rise/800ms release,1.5s reduced |
| Sun body/corona | Fixed six.bass180/650ms envelope ×15% plus low-onset envelope ×5%;20% combined. Onset25ms attack, peak through59ms,220ms decay,2s expiration. Corona softens up to20% with body expansion and follows perspective-adjusted radius |
| Diffuse glow | Existing slow activity,120/450ms scene rise/release;1.5s reduced; original12% onset plane scale |
| Ground | Existing immutable low event, one launch per new event; four-slot oldest replacement. Origin logical camera distance+48;26 units/s toward foreground,3.5s expiry,80ms rise. Strength controls brightness, head width.65–2.05 units and tail2–6 units; strength-dependent lifetime decay. Narrow.18-unit channel plus.55-unit halo, selected by valley mask. Sustained six.bass only maintains faint glow |
| Mountain contours | Fixed lowMids250–800Hz,320/750ms sustained selected light. HighMids800–2500Hz scene-local rise qualification (45ms observation), not shared mid onset; selected950ms traveling head,35ms attack/120ms initial hold, fading asymmetric trail |
| High detail | Existing high events, weighted by current six.presence/air balance.25ms attack/100ms plateau/380ms decay,1.8s expiry; Standard1%/Low0.45% sky speck cells, selected distant glints, sun-edge shimmer. No particle simulation |
| Atmosphere | Density=.65 slow intensity+.35 activity; warmth=valid brightness×intensity, gain-scaled.2/4s rise/release or4/6s reduced. Horizon tint,≤18% extra distant haze, matching far sky fade |
| Travel |16×gain×clamp(overall/.35)^1.2 target;350/500ms rise/release, stop on silence/zero/reduced, clamp to loaded stream window. Production camera route unchanged |

All mappings use existing shared reader semantics; public Candidate is default, Legacy remains developer comparison. Feature freshness250ms; independent event cursors prime on profile/session change, hidden events consumed without replay. Gain follows scene mapping, not player volume. Moving accents are suppressed by reduced motion; slow context settles gently. Four-chunk target window (briefly three during worker refill), reusable materials, at most seven draws/geometries at baseline. No shared frequency changes or additional analyser.

## Comparable capture protocol

Source `vp00-48k-21s-v1` is generated48kHz mono PCM in src/dev/mi05/vp00Review.ts, through unchanged production createAnalysis.1440×810, DPR1, Standard, Candidate, Reactivity1, fresh page per run. Pointer centered. Identical source timeline for both clips:

- 0–2s rest;2–7s quiet mixed attacks;7–13s stronger mixed attacks;13–16s sustained bass;16–19s repeated bass attacks;19–21s release silence.
- Mixed frequencies110/469/1500/4000/8000Hz; mixed amplitudes.035/.13, bass-only.32. Respect actual FFT overlap. These are generated comparison inputs, not claimed instrument separation or a real-song listening pass.

Screenshots requested at1/4/9/14/17.3/20s; browser JSON retains actual audio timestamps, camera pose, logical distance, signals/uniforms and resource state. Browser screenshot sequences are the accepted baseline. Generated video export was attempted but rejected after inspection: canvas-to-video intermittently omitted scene elements despite correct browser screenshots. No clips are published as accepted evidence. The21s fixture includes release, not a claim that all multi-second atmosphere tails finish by21s.

- [Moving quiet](../../evidence/crimson/vp00/vp00-moving-4.png), [moving busy](../../evidence/crimson/vp00/vp00-moving-9.png)
- [Fixed quiet](../../evidence/crimson/vp00/vp00-stationary-4.png), [fixed busy](../../evidence/crimson/vp00/vp00-stationary-9.png)
- [Baseline metadata](../../evidence/crimson/vp00/vp00-verification.json), [production lifecycle](../../evidence/crimson/vp00/vp00-public-verification.json), [production source hashes](../../evidence/crimson/vp00/vp00-source-baseline.json)

## Per-effect observations and polish bounds

Sun remains visually dominant; do not change its disc or expand global exposure in VP01. Ground waves are visible as narrow pink heads/soft spots during busy input but do not yet clearly span the dark foreground; inspect origin, local contrast, width, travel and tail first in VP01. Selected mountain lighting is clearer in the fixed comparison, while the moving view makes a ridge streak harder to distinguish from travel—VP02 remains separately gated. High details stay sparse and can be missed at small size; no added objects requested. Slow atmosphere keeps the palette coherent; depth tuning belongs to VP03. These observations are visual judgments about generated captures, not diagnoses of the owner's song or MI signal quality.

## Verification and limitations

Run tests/lint/typecheck/build, `node scripts/verify-vp00.mjs` and built-production `verify-crimson-candidate.mjs`. Inspected browser frames and exported video frames; exports did not faithfully reproduce all scene elements, so only screenshots/metadata are accepted. This is a capture limitation, not evidence of a production rendering defect. An early cadence-capture attempt was interrupted (exit143). A retry caught an overly strict constant-seven assertion during normal3-chunk worker refill; final checks retain each sample and enforce3–4 chunks/6–7 geometries/≤7 draws, with one worker. Production streaming behavior is unchanged. Cadence is measured during WebGL-to-canvas recording, including encoding overhead, and is not a new hardware/no-overhead guarantee. VP01 comparisons must use the same capture workload.

Fixed camera is a pre-existing DEV inspector override at[0,3.5,24], not a production-camera edit. Moving journey is driven by real-time analysed PCM with frame scheduling; terrain pose is not bit-identical across runs. Record actual time/distance and use fixed captures for precise spatial comparisons. Do not present moving-vs-fixed as the same camera pose or a before/after polish result. Later A/B must retain source version, viewport, quality, gain, capture timing and actual pose; use matched fixed frames if movement differs.

Native picker/audibility, exact musical synchronization, normal-window hardware performance and real-music owner judgment remain manual pending. The full unchanged MI matrix is not repeated. No private/captured source content is used. Future normal-speed motion comparison still needs reliable browser recording or owner review; VP00 meets the permitted screenshot-baseline option. Project phase skills/Playwright are unavailable; established Brave/CDP/FFmpeg fallback and prior rendering guidance are reused. Next eligible phase is VP01 only after owner VP00 review, via “Continue Crimson polish.” No commit or deployment authorized.
