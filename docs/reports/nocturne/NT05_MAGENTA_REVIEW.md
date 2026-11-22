# NT05 — Magenta low-frequency choreography

2026-11-22 — implemented, owner lighting review pending. Owner “proceed” after the NT04 report approves the migrated baseline and authorizes NT05. This phase changes only the main/secondary magenta response and their material grouping. The bridge keeps its NT04 response until NT07. No analysis-engine, source adapter, camera, authored shape/transform, cyan/violet response or atmosphere change.

## Review evidence

- Fixed-camera generated-audio demonstrations: [before NT05](../../evidence/nocturne/nt05/before/generated-music-demo.mp4) · [after NT05](../../evidence/nocturne/nt05/after/generated-music-demo.mp4).
- Main accent frames: [before](../../evidence/nocturne/nt05/before/attacks.jpg) · [after](../../evidence/nocturne/nt05/after/attacks.jpg). Quieter/louder held bass: [quiet](../../evidence/nocturne/nt05/after/quiet.jpg) · [loud](../../evidence/nocturne/nt05/after/loud.jpg).
- [Signal schedule](../../evidence/nocturne/nt05/after/signal-sections.json), [measured feature/fixture trace](../../evidence/nocturne/nt05/after/trace.json), [comparison and geometry evidence](../../evidence/nocturne/nt05/comparison.json).

The 17-second generated WAV contains silence, quiet/loud 110 Hz sustain, four short bass attacks over a quiet bassline, held 47 Hz sub-bass, mid/high-only controls and silence. It runs through the normal local-file player/analyser/MI reader, at app volume 50%, centered 1440×810 Standard. Baseline source was copied from the current NT04 working tree, including previous uncommitted work. Numeric probes exist only in isolated temporary copies. Each run retained 145 samples/144 composited frames; generated WAV is muxed into the video with approximate screenshot timing. Separate runs sample different analyser/event phases, so their individual peak frames are illustrative rather than exact event-time pairs.

## Implemented response

The near-right diffuser is its own existing-shape material batch (one instance). Five remaining wall diffusers share a second batch. The two bridge diffusers share a third batch with their original curve. All eight transforms, sizes, magenta color and material finish remain identical; verified by comparing actual instance matrices and Manual pixels. The existing near point light still uses full intensity 50 and the bridge point light40. No additional light or shadow is added.

`magenta.ts` owns the new scene-local numeric response; `visualState.ts` calls it with the same single borrowed MI feature view and publishes main/secondary levels. `ArchitectureDetails.tsx` separates batches without moving geometry; LightingDriver binds their existing material targets. These are the only four production files changed in this phase. Cyan, violet, bridge response and atmosphere remain exact NT04 values under the same input.

| Control | Exact parameters |
| --- | --- |
| Main sustain target | `.5 × clamp((.8 × six.bass + .2 × six.subBass) / .35) × Reactivity`; rise .12 s, fall .45 s |
| Secondary sustain target | `.24 × clamp((.6 × six.bass + .4 × six.subBass) / .35) × Reactivity`; rise .3 s, fall .7 s; no event accent |
| Main onset peak | Existing validated `low` event, positive finite strength, current session, unconsumed sequence, emission age 0–.25 s; peak `.42 × clamp(strength/.35)` |
| Accent envelope | Ease in 20 ms; full peak through 55 ms; exponential .2 s decay, finite cutoff 1.2 s; multiply by Reactivity |
| Overlap | One fresh pulse plus a scalar carried tail; take their maximum so weak retriggers cannot notch the existing decay. Both expire within1.2 s of their own start; no random timer, separate detector or accumulated pulse pool. |
| Main final | Eased sustain + accent, bounded 0–.92 for Audio (sustain ≤.5, accent ≤.42). Secondary sustain ≤.24. No sustained energy alone reaches full illumination. |
| Silence/freshness | Active feature age 0–.25 s; stale/inactive disables new accents and releases sustain. Session changes clear state and skip retained events. Zero gain clears immediately; zero targets settle below .001. |
| Reduced motion | No sharp accent; main/secondary sustain .8/1.1 s. Manual uses the retained Magenta preview value on all three batches; suppressed events are consumed without replay. |

Energy bands are bass 80–250 Hz and sub-bass 20–80 Hz, not instrument separation. The low event itself is a validated broad 20–250 Hz attack; the scene adds lifecycle/strength guards and a visual envelope, not a new audio detector. Bridge remains the broad-low NT04 response; no directional chase or extra geometry is introduced before NT07.

## Measured results

| Generated section | Main mean after | Secondary mean after | Observation |
| --- | ---: | ---: | --- |
| Quiet held bass | .051 | .018 | Dark but nonzero glow |
| Loud held bass | .203 | .073 | Roughly four times quiet mean; secondary remains subordinate |
| Bass with attacks | .256 mean; .553 sampled peak | .054 | Strong localized main accents; distant fixtures no longer copy every peak |
| Sub-bass section | .058 | .043 | Restrained low-frequency support; samples include the onset tail |
| Final silence | 0 | 0 | Exact reactive magenta off |

At the strongest sampled accent addition, MI bass was .293, sub-bass .067, recent low-event strength ~.254; main sustained body was .248 and accent .305, yielding level .553 and actual near point intensity 27.65. The strongest sampled accent is ~55% of that final level, compared with a baseline sampled accent peak .076. This makes the event contribution more legible without filling all magenta fixtures simultaneously. Interpretation of musical feel remains for the owner; these are generated signals.

## Checks and tradeoffs

- Passed 35 test files, lint, typecheck and production build. Existing chunk warning remains (~1,233.23kB JS/343.19kB gzip).
- Unit tests cover proportional sustain/strength, sub-bass, absence of mid/high triggers, one-shot expiry, dense repeated bounds, duplicate/suppressed events, zero/Manual/reduced/stale/session states, silence and 30/60/120 Hz behavior.
- [4,200-frame NT04 comparison](../../evidence/nocturne/nt05/state-parity.json) proves cyan, violet, bridge and atmosphere outputs exactly unchanged across normal, mixed, reduced, Manual, gain and lifecycle cases; 82 other production source files are byte-identical to the task snapshot. Only the four authorized files differ.
- Actual renderer delivery matches material ×1.3, main point ×50 and bridge point ×40 in every recorded after sample. Actual instance transforms match all eight original magenta instances; batches change 8→1/5/2.
- [Six Manual viewport/quality captures](../../evidence/nocturne/nt05/manual/after/verification.json), idle and panel-off images have zero differing pixels against NT04. This protects the authored composition/color/spill/reflections at the same lighting settings. Inspected attack before/after, held bass and matched Manual views.
- [Reduced-motion generated run](../../evidence/nocturne/nt05/reduced/generated-music-demo.mp4) passed with 145 samples/144 frames and main accent exactly 0 throughout. [Summary](../../evidence/nocturne/nt05/reduced-summary.json).
- Normal/reduced browser runs completed without runtime errors. Existing source identity, quality and Manual/Audio smoke retained. No native capture/audibility or device-performance claim.
- Splitting the material batch adds two unit-box geometries/materials: observed renderer geometry count 105→107 and call counter 80→82 at the fixed view; textures stay 6 and point lights stay 7. Existing reflection adds its normal scene pass. These counters are not a measured GPU-time/FPS comparison. All generated material properties and instance counts remain bounded.

The subdued distant fixtures and softer sub-bass main contribution are deliberate artistic changes; a stronger focal accent trades simultaneous alley-wide brightness for clearer hierarchy. Context7's version-matched [Three r186 InstancedMesh documentation](https://github.com/mrdoob/three.js/blob/r186/docs/pages/InstancedMesh.html) confirms the same-material batching constraint; no new dependency/API was introduced. Project phase skills remain unavailable, so WORKFLOW.md was followed.

NT05 stops here with owner appearance/musical review pending. NT06 is the next bounded task; final grouped NT05–NT08 lighting approval remains open. No commit/push/deploy. Suggested focused commit, only after authorization: `Separate Nocturne magenta bass sustain and focal accents`.
