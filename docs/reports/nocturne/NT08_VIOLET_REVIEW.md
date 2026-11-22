# NT08 — localized violet treble response

Implemented 2026-11-22 after owner “proceed” following NT07. Technical checks passed. Grouped NT05–NT08 owner lighting/music/comfort and device-performance review remains pending; NT09 has not started. No commit, push or deployment. Earlier uncommitted work is preserved.

## Audit and design

NT07 still drove all 12 violet strip instances through one material, one old broad-high response and two point lights sharing the same final brightness. It supported treble isolation but could not localize an accent. Existing geometry already provided six right-side and six left-side instances, including vertical and low horizontal strips. The near violet point belongs on the right and the far point on the left.

NT08 rebins these instances into two material groups without changing any transform, color, size, housing or light placement. Existing presence/air energy supplies restrained sustain; fresh qualified high events accent alternating sides. No new fixtures, dependencies, render passes, dynamic shadows, shared audio calculations or React frame-state updates.

During browser inspection, strip alternation worked but the far point still followed the right bank because of a name mismatch. Corrected the exact `violet-far-spill` binding and reran normal/reduced evidence. Final verification requires exactly one point per bank and checks each delivered intensity; the superseded runs are not the evidence linked below.

## Implemented mapping

Canonical coefficients are in [visual mapping](../../NOCTUNE_VISUAL_MAPPING.md).

| Component | Mapping | Timing / bounds |
| --- | --- | --- |
| Sustained body, both sides | `.16 * clamp((.7*presence + .3*air)/.35) * gain` | 40 ms rise /160 ms release; ≤.16 |
| Accepted high event | `.32 * clamp(strength/.35) * gain` | 15 ms eased rise; peak through40 ms; quadratic fade to0 at240 ms |
| Localization | Alternate right then left, only on accepted events | Global400 ms start cooldown; one pulse, no queue/restart/stack |
| Actual output | Body + own bank accent | ≤.48 Audio; material×1.3, own point×12 |

Only existing MI `high` events qualify: own session/unconsumed sequence, finite strength≥.04, event emission age0–.25 s, active feature age0–.25 s. Presence covers2500–6000 Hz and air6000–20000 Hz; broad high onsets cover4000–20000 Hz. Presence below4000 Hz can support sustain without being claimed as a high onset. There is no per-instrument or tempo interpretation.

Held upper energy does not retrigger accents. Cooldown limits accepted attacks to≤2.5/s overall and≤1.25/s per alternating bank; each finite pulse expires before another can start. This is a bounded visual policy, not a claim of medical flicker safety or owner comfort acceptance.

Reduced motion removes rapid accents and uses800/1100 ms sustain rise/fall. Zero Reactivity/Manual clear audio values; stale/inactive cancel accents and release body. Session changes reset body/alternation and skip retained events. Suppressed events are consumed without replay. Manual Violet applies its original direct value uniformly to both banks. Zero targets settle below.001. Overall intensity and other fixture brightness do not enter the new curve.

## Browser demonstration and inspection

All media is wholly generated permitted test audio through the real local-file and unchanged Music Intelligence paths. Numeric instrumentation is inserted only into an isolated temporary app copy. No captured/private media is inspected, recorded or retained.

| Version | Fixed-camera generated demonstration | Stills |
| --- | --- | --- |
| NT07 baseline | [Before](../../evidence/nocturne/nt08/before/generated-music-demo.mp4) | [Old shared accent](../../evidence/nocturne/nt08/before/attacks.jpg) |
| NT08 | [After](../../evidence/nocturne/nt08/after/generated-music-demo.mp4) | [Right accent](../../evidence/nocturne/nt08/after/side-0.jpg), [left accent](../../evidence/nocturne/nt08/after/side-1.jpg), [held upper energy](../../evidence/nocturne/nt08/after/loud-high.jpg), [silence](../../evidence/nocturne/nt08/after/silence.jpg) |
| Reduced motion | [Slow sustain, no accents](../../evidence/nocturne/nt08/reduced/generated-music-demo.mp4) | [Reduced high section](../../evidence/nocturne/nt08/reduced/attacks.jpg) |

Inspection shows violet upper-wall/low-rail detail and corresponding local spill switching sides; it does not illuminate all strips with the same accent. Bass/mid sections retain magenta/cyan roles without violet accents. The distant left bank is naturally subtler in the fixed perspective; real-song readability remains an owner review item. Static architecture and reflection path remain intact.

The20 s generated schedule covers silence0–1 s, bass110 Hz1–3 s, low-mid450 Hz3–5 s, quiet4500 Hz5–7 s, louder4500 Hz7–9 s, isolated8000 Hz attacks9.2/10.2 s, dense100 ms high attacks11–14 s, sustained12000 Hz14–16 s, mixed bass/mid/high attacks16–18 s, and final silence18–20 s.

Camera is asserted at(0,1.6,5). Composited screenshots are indexed by audio currentTime and muxed with the same generated WAV: roughly8–10 captured samples/s, approximate time alignment rather than sample-accurate or native-FPS recording. Before171 samples/170 frames, after170/169, reduced170/170. Successful runs report no runtime errors. The browser was muted; physical audibility/native capture was not verified.

## Actual feature and brightness comparison

[Comparison JSON](../../evidence/nocturne/nt08/comparison.json), [after trace](../../evidence/nocturne/nt08/after/trace.json), [before trace](../../evidence/nocturne/nt08/before/trace.json) and [reduced trace](../../evidence/nocturne/nt08/reduced/trace.json) retain timestamps, MI values/events, actual materials and actual point intensities.

| Generated section | Presence / air peak | Right / left mean final level | Accent peak |
| --- | --- | --- | ---: |
| Bass only | ~.0000035 / .0000069 | ~.0000020 / .0000020 | 0 |
| Low-mid only | ~.0000029 / .0000065 | ~.0000018 / .0000018 | 0 |
| Quiet presence | .0424 / ~0 | .0136 / .0136 | 0 |
| Loud presence | .1413 / ~0 | .0452 / .0452 | 0 |
| Isolated high attacks | ~0 / .1166 | .0191 / .0126 | .1855 |
| Dense high attacks | ~0 / .2108 | .0346 / .0351 | .1740 |
| Sustained air, settled | ~0 / .1060 | .0145 / .0145 | 0 |
| Mixed | ~0 / .0113 | .0140 / .0122 | .1315 |
| Final silence | 0 / 0 | 0 / 0 | 0 |

Quiet/loud presence energy and settled body both increase approximately3.33×. Bass/low-mid FFT leakage is numerically nonzero but produces only negligible sustained glow and no accents; it is not reported as exact mathematical zero. Silence settles to exact zero normally. Reduced trace has no sharp accents and retains the slower fade, including a small tail near19 s.

Every sampled final material equals its own bank level×1.3; the near and far point intensities equal right and left level×12 respectively. No sample has two positive bank accents. Twelve accepted events across the full fixture alternate sides with starts at least400 ms apart; skipped dense events do not produce a backlog. Six accepted accents occur during the dense section, rather than one accent per100 ms input burst. Unit checks separately establish proportional event strength/gain and stable peak sampling at30/60/120 Hz.

## Files, preservation and rendering cost

Task-start snapshot `/tmp/echo-nt08-baseline-rIE4fQ` contains the actual dirty NT07 source tree, rather than HEAD. Production changes relative to it are only:

- `src/scenes/nocturne/violet.ts`: bounded body/two-bank high-event controller.
- `src/scenes/nocturne/visualState.ts`: one borrowed-frame update, violet bank channels and reflection summaries.
- `src/scenes/nocturne/ArchitectureDetails.tsx`: original12 transforms regrouped6/6.
- `src/scenes/nocturne/LightingDriver.tsx`: bind left material and its existing point light independently.

Added `tests/nocturneViolet.test.mjs`; updated `tests/nocturneVisualState.test.mjs` for bank outputs, sustain and independent delivery. Added violet generator/browser/views/preservation/comparison scripts under `scripts/`, NT08 report/evidence and progress/spec updates. Other files already dirty from earlier phases are preserved and are not claimed as NT08 edits.

Passed:

- All38 test files, lint, typecheck and build. Existing bundle-size warning remains: JS1,238.61 kB/gzip344.72 kB.
- Seven controller cases cover proportional presence/air, finite alternating accents, strength/gain/cadence, dense bounds, non-high/malformed isolation, lifecycle/session/suppression/no replay and reduced/zero behavior. Visual-state integration verifies one bank's event reaches its own material/point and leaves other fixture channels dark.
- [4,200 matched frames](../../evidence/nocturne/nt08/state-parity.json): exact main/secondary magenta, cyan windows/details, approved cyan panel, bridge channel and every bridge section state, reflection summaries and atmosphere.85 protected source files byte-identical, including shared MI/DSP/capture, other scenes, approved panel controller, magenta/midrange/bridge controllers and NocturneScene.
- All12 violet transforms and colors exactly preserved; approved cyan matrix/palette exact. Eight static Manual/idle/off image pairs are pixel-identical, including desktop/wide/portrait Standard/Low with Violet on. [Built-production views](../../evidence/nocturne/nt08/manual/after/verification.json).
- Normal/reduced generated browser checks, actual independent delivery, source identity across scene changes, quality changes and Manual preview pass.
- Whole-frame reflection+main counters:120 samples per version, Standard fixed idle camera, temporary manual info reset before each frame. Draws194→196 (+1.03%), triangles25,534 unchanged, geometries113→114, textures6 unchanged. All7 point lights unchanged. [Before cost](../../evidence/nocturne/nt08/before/whole-frame-cost.json), [after cost](../../evidence/nocturne/nt08/after/whole-frame-cost.json). This is the bounded cost of one extra material batch, without another render pass; headless frame deltas are not device-performance acceptance.

## Review gate and next action

Review the normal-speed clips and permitted real music for upper-band readability, relative violet restraint, side-to-side cadence and visual comfort alongside NT05 magenta, NT06 cyan and NT07 bridge. Confirm owner-device performance; native picker/capture, physical audibility and full-song acceptance remain manual pending. No automated screenshot or signal assertion grants artistic approval.

Stop at grouped NT05–NT08 owner lighting review. NT09 wet-surface/material assessment follows only after owner continuation; no environment/global-lighting tuning is included here.

Suggested focused commit after explicit authorization: `Localize Nocturne violet high-frequency accents`.
