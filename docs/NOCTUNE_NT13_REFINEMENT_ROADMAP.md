# ECHO — Noctune NT13 Refinement Roadmap

**Status:** R0–R5 refinement review complete. Owner explicitly approves all five visual criteria and reports all listed current-build real-song cases worked (2026-11-23). NT13 approved; owner explicitly skipped NT14 and NT15 on 2026-11-23.
**Scope:** Noctune visual response following its Music Intelligence migration.  
**Goal:** Turn the alley into a *living instrument*: music travels through its architecture, atmosphere, and reflections while retaining Noctune's stationary-camera, nighttime identity.  
**Reference:** Compare the user-provided NT13 Noctune and Crimson Horizon recordings and Noctune's brighter manual-preview composition. The recording comparison is a visual review, not a verified frame-aligned signal audit.

## Current execution checkpoint — 2026-11-22

Owner approved **R0 only**, one phase at a time, and selected **generated captures + live owner review**. This revises the recorded real-song method in R0/R5: generated source may be recorded; owner music stays live/text-only under repository privacy rules. Real-song parity is still required for final artistic approval; generated success does not close NT13.

[R0 audit, measurements, evidence and limitations](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r0--ground-truth-checkpoint-2026-11-22). Four55s generated Noctune/Crimson Standard/Low baselines, Manual references and held light/reflection diagnostics are ready. Noctune uses only Music Intelligence. The darkness is explained by low delivered scene levels plus weak environmental readability; Manual/Audio exposure is identical. No production tuning in R0; all90 source files match its start manifest. Owner subsequently authorized R1 with “proceed”; [R1 evidence and limits](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r1--brightness-calibration-checkpoint-2026-11-22) are ready for review. R1 adds static minimum fill and a bounded Audio display curve, with no spatial choreography. Real-song calibration/legibility remains pending; R2 requires a separate checkpoint. NT14 remains paused.

R2 subsequently authorized by owner “proceed” after the R1 report. [Spatial checkpoint/evidence](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r2--spatial-choreography-checkpoint-2026-11-22): secondary magenta echoes, qualified-mid window/detail depth sequences, high-onset bridge traversal; instancing/geometry/camera/MI retained. Automated direction/delivery checks pass; perceived movement, Low Manual-on reference discrepancy and real-song review remain documented. Stop before R3 pending checkpoint review.

R3 authorized by owner “its looking greats, lets keep going” following R2. [Environment checkpoint](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r3--environment-participation-checkpoint-2026-11-22): existing bridge-rib accents, source-coherent wet highlights, slow local depth spill and modest haze lift. One added unshadowed point; no added geometry, global exposure change or MI changes. R4 awaits separate review/continuation.

R4 authorized by “lets move” and resumed with “continue.” [R4 evidence/limits](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r4--integration-and-target-machine-checkpoint-2026-11-23): no production changes; generated isolation/lifecycle checks, actual hidden-tab return, owner native minimize/Escape confirmation and30s measurements on the selected GTX1660 SUPER. Forced CDP freeze remains an explicitly unverified extra automation case. Stop before R5 pending checkpoint review; no automatic final NT13/NT14 approval.

R5 authorized by “proceed” after R4. [Aligned comparison and owner gate](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r5--aligned-comparison-and-owner-gate-2026-11-23): fresh Standard/Low pairs, Noctune fixed camera, generated source-time alignment and Manual references. All91 production sources unchanged. Approved evidence-policy revision still applies: generated captures plus owner live/text-only real-song review. No artistic approval or NT14 continuation is inferred from technical success.

Final R5 decision (2026-11-23): owner answers **“Approve all five visual criteria”** and **“all worked”** to the current-build listening-case question. [Exact approval](evidence/nocturne/nt13-refinement/r5/owner-review.json). This closes NT13 under the revised generated-capture/live-text policy. Historical pending checkpoints below remain as the record of preparation. NT14 requires the next task continuation; no commit/push authorization is implied.

## 1. Why this follow-up exists

NT13 demonstrated much better musical reactivity than the legacy version, but visual review did not establish parity with Crimson's *expressiveness*. In normal playback, much of Noctune disappears into black, only a few wall fixtures change conspicuously, the bridge and depth remain passive, and the large wet foreground acts mostly as a dark reflection plane. Manual preview shows that the authored composition can be visually rich; its all-on state is **not** the desired constant brightness for music mode.

**Art direction:** Crimson is a landscape that moves with music. Noctune is an environment where music *moves through the architecture*. Preserve darkness and negative space; introduce readable structure and directional, meaningful light movement. Do not solve this by making all fixtures permanently bright or adding large amounts of new geometry.

## 2. Scope, guardrails, and source of truth

- The existing shared **Music Intelligence** output is the signal source. Noctune should not be reconnected to legacy `AudioSignal`. Check the actual current repository contract and implementation rather than relying on older audit reports.
- Keep the authored architecture, framing, camera behavior, material palette, magenta/cyan/violet grouping, and existing fixture design unless a specific improvement is justified by side-by-side evidence.
- Do not modify shared Music Intelligence algorithms, frequency boundaries, event detection, or other landscapes to compensate for Noctune's visual tuning. If a missing feature blocks a mapping, document it and seek approval rather than quietly adding an incompatible feature.
- Build one **scene-local visual mapping/response layer**. Distinguish: sustained band energy, discrete onsets, slow environmental state, fixture-specific spatial delays, and non-reactive minimum visibility. Avoid a new group-wide `brightness = energy` shortcut.
- Respect capture loss, inactive/stale features, session/sequence changes, zero Reactivity, pause/silence, reduced motion, scene switching, and manual preview. No ghost onsets or stale afterglow.
- Keep overhead reasonable: prefer existing instancing, emissive updates, and existing reflection/fog passes. Budget and measure any added lights or post-processing.
- Do not mark NT13 complete, start NT14, or create a commit solely because automated tests pass. Human real-song review is required.

## 3. Desired Music Intelligence-to-scene map

This is an **artistic target**, not an assertion that every item already exists. Confirm which calibrated features and onset streams are actually exposed. Qualify broad onset events with recent band energy where needed; do not claim an onset event has six-band attribution if it does not.

| Musical role | Noctune consumers | Sustained behavior | Event / movement behavior |
| --- | --- | --- | --- |
| Bass / low-frequency energy | Large magenta fixtures, warm local wall spill | Controlled red-magenta body | Low onset causes a crisp pulse and short spatial echo along neighboring fixtures |
| Low mids | Secondary architectural recesses | Gentle wall depth / fill | Minimal, slower localized response, avoiding competition with bass |
| Mids | Existing cyan windows | Smooth readable light | Qualifying mid onset activates separate panels in sequence along the alley |
| High mids | Recessed left cyan panel and adjacent details | Calibrated cyan illumination | Qualified onset creates a short, localized accent and small downstream echo |
| Treble / high onsets | Violet strips, overhead bridge details | Restrained, low resting light | Fast travelling streak across the bridge or along narrow strips |
| Overall/slow musical intensity (if available in current contract) | Gate, illuminated fog and distant wall fill | Slow scene breathing and depth readability | Broad dynamic change rather than sharp fixture flashing |
| Reflections / pavement | Existing wet floor and motivated light spill | Follow actual fixture intensity and color | Controlled moving reflected highlights linked to the corresponding source |

Each effect needs a spatially distinct purpose. Do not map a single onset to a synchronous flash of every material.

## 4. Implementation phases

### NT13-R0 — Ground-truth audit and repeatable evidence

**Tasks**

1. Read the current `AGENTS.md`, active roadmap/progress docs, Noctune Music Intelligence reader, response layer, lighting driver, fixture/material code, and existing tests. Identify superseded context files; cite the few authoritative ones in a short task note instead of loading every historical report.
2. Verify whether Noctune has **zero production dependency on legacy audio** and which Music Intelligence outputs it consumes. Record unconsumed but available features. Preserve the working integration.
3. Reproduce normal music-mode footage and manual-preview screenshots from the same viewport, camera, device scale, renderer settings, and exposure. Record actual delivered response levels and feature freshness over time.
4. Select a short user-authorized song excerpt with quiet, sustained, percussive, and dense passages. Capture a time-aligned signal trace and video for both Noctune and Crimson. Do not infer audio timing from unsynchronized captures.

**Deliverable:** An as-is map of fixture → signal → response → visible result, plus fixed-camera baseline evidence. **Exit gate:** The team can identify whether darkness is caused by low delivered response, scene illumination, exposure/tone mapping, or a combination.

### NT13-R1 — Calibrate musical brightness without losing darkness

**Tasks**

1. Separate **environmental readability** from **musical fixture intensity**. Provide a minimal, stable, cool ambient/edge/far-depth contribution so the bridge, walls, distant gate, and ground do not disappear in ordinary quiet passages. Fixture-specific reactive energy can still reach zero.
2. Tune scene-local gain/response curves using real calibrated feature distributions and user-authorized music; preserve visible quiet/moderate/loud contrast. Do not force small energy values to full intensity or clip normal peaks.
3. Review exposure, tone mapping, emission-to-light balance, bloom, and wet reflections to ensure bright fixtures illuminate surfaces, not just their own emissive rectangles.
4. Preserve manual-preview controls as a diagnostic reference; switching Manual ↔ Audio must not leave latched values or unexpectedly change camera/exposure.

**Exit gate:** Quiet music is recognizably *dim* but legible. Loud passages have obvious headroom. Silence remains moody and dark, not a black void; the manual 100% scene remains an upper-bound test rather than the everyday target.

### NT13-R2 — Spatial musical choreography

**Tasks**

1. Decouple fixture instances that currently respond in lockstep when needed. Introduce deterministic per-fixture delays and directional progression along the bridge, left/right panels, and depth of the alley.
2. Map **sustained band energy** to the underlying glow and **qualified onsets** to short pulses or travelling heads. Use separate attack/decay curves for the two layers. A travelling pattern should have a clear starting point, progression, and fade—not a simultaneous bank flash.
3. Keep a hierarchy: bass = weight and local spill; mids = architectural rhythm; treble = fast narrow motion. Avoid identical flashes on every channel.
4. Design at least one foreground-to-background or back-to-front sequence to reveal depth; retain the stationary camera.
5. Test repeated fast events and sustained loud music: no retrigger storms, indefinitely bright lamps, invisible accents, or arbitrary time-based motion that masquerades as music response.

**Exit gate:** With the camera locked, a viewer can identify moving musical events across distinct regions of the alley, even without inspecting signal diagnostics.

### NT13-R3 — Activate the otherwise unused environment

**Tasks**

1. **Bridge:** Reinforce existing structural contours with sparse traveling light, not a solid permanently luminous bar.
2. **Wet pavement:** Make the large foreground contribute via reflection-source coherence and subtle moving highlights; avoid water-like waves that conflict with the authored wet street material.
3. **Distant gate and haze:** Introduce slow, low-contrast depth breathing, optionally revealing silhouettes or atmospheric planes during fuller passages; do not overpower the primary fixtures.
4. **Dark side walls / lower corners:** Reveal selected edges, vents, recesses, or thin light catches with motivated spill. Preserve pockets of negative space and the foreground-to-background composition.
5. Check the scene with and without the open controls sidebar. Do not place important focal information behind UI overlays.

**Exit gate:** Foreground, middle ground, and background each provide a distinct music-reactive cue, and the scene retains its original industrial mood and legibility.

### NT13-R4 — Integration, restraint, and accessibility

**Tasks**

1. Tune multi-timescale behavior: fast transients (roughly tenths of a second), medium traveling sequences (fractions of a second to a second), and slow atmospheric breathing (multi-second). Treat these as initial art-direction ranges, **not hard-coded requirements**.
2. Balance dominant magenta against cyan/violet. High-mid accents must be perceivable without turning every event into a full-screen flash.
3. Test musical contrasts: bass-only, low-mid-only, high-mid sustained, separated onset attacks, treble-only, dense mix, quiet passage, silence, and abrupt disconnect. Use time-coded traces and visible expected regions.
4. Verify Reactivity = 0, reduced motion, minimized/backgrounded tab, scene switching, stale timestamps, new session IDs, quality settings, fullscreen, and manual-preview isolation.
5. Keep GPU cost within the established performance budget and measure FPS / frame time on at least one target device; log extra lights, draw calls, overdraw, and shader impact.

**Exit gate:** The added motion is musical, readable, restrained, and robust across lifecycle and accessibility modes.

### NT13-R5 — Crimson comparison and owner approval

**Method**

1. Record *both* landscapes using the same authorized song excerpt and synchronized timestamps. Use equivalent capture quality and viewport size; keep Noctune's camera fixed to judge genuine scene motion.
2. Capture Noctune in music mode, manual preview (as reference only), quiet, active, and silent states. Include a small timing plot/table showing input energy/onset → scene response → visible effect. If the soundtrack cannot be captured, say so explicitly.
3. Evaluate on five criteria below; distinguish bugs from artistic preferences.

| Criterion | Pass evidence |
| --- | --- |
| Resting visibility | Geometry and depth remain readable in normal quiet passages without flattening the darkness |
| Spatial movement | Multiple onset types produce visible *directional* motion through architecture rather than synchronous blinking |
| Music specificity | Bass, mids, high mids, and treble yield distinguishable regions and temporal behaviors; silence does not animate as if music is playing |
| Whole-scene participation | A clear cue appears in foreground (pavement), midground (fixtures/bridge), and background (gate/haze) |
| Artistic parity with Crimson | In side-by-side owner review, Noctune feels comparably responsive/expressive while remaining its own stationary lighting scene |

**Decision:** If any criterion fails, make a **bounded** tuning proposal and repeat the relevant comparison. If all pass with owner approval, close NT13 and proceed to NT14 performance review and NT15 final documentation/commit.

## 5. Verification expectations for every phase

- Run focused unit and integration tests on deterministic Music Intelligence traces, including event/session/freshness handling and no legacy fallback.
- Run lint, TypeScript checks, build, and existing relevant browser checks when available. Never report browser coverage if the browser was unavailable.
- Provide a human-reviewable fixed-camera video or representative frames after each visually material phase, including before/after under the same conditions. Automated checks alone do **not** approve aesthetics.
- Keep work small and reversible, with separate changes and phase notes. Avoid opportunistic edits to Crimson, Lavender Peaks, Bloom, or the shared audio engine.
- Record what was tested, what could not be tested, screenshots/video paths, measured performance if available, and remaining uncertainties in the existing progress structure. Do not generate redundant standalone context documents for each experiment.

## 6. Codex execution prompt

> We are continuing ECHO's Noctune roadmap following NT13 visual review. Read the existing repository instructions and active Noctune/Music Intelligence documentation, then use **this document as the targeted NT13 refinement plan**. NT13 is not artistically approved: during real music playback, Noctune is substantially darker than its manual preview; large portions of the alley remain unused; the bridge, wet floor, depth, and architecture show too little perceived motion. Crimson is the expressiveness benchmark, **not** a visual or camera-motion template.
>
> Implement **NT13-R0 through NT13-R5 in order**, preserving the authored stationary camera, scene geometry, palette, existing Music Intelligence integration, and other landscapes. Audit the current code before making assumptions about its feature contract. Do not reintroduce legacy audio or modify shared music analysis. First establish fixed-camera, time-aligned evidence and distinguish signal-level issues from rendering issues. Then calibrate readable nighttime resting light, introduce scene-local spatial light choreography, and extend motivated reactivity to the bridge, wet pavement, distant gate, and haze. Use sustained energy for continuous glow and qualified onsets for brief spatial events; avoid uniform all-fixture flashing and indiscriminate brightness. Check manual preview, silence, stale sessions, reduced motion, Reactivity = 0, and performance. After each phase, provide concise changed-file summaries, tests, capture evidence, and outstanding artistic questions. Do not mark NT13 complete or commit without owner review of an aligned real-song comparison against Crimson.

## 7. Non-goals

- Another Music Intelligence engine redesign.
- More unrelated landscapes or new large scene objects.
- A permanently full-brightness alley or global bloom increase as the only fix.
- Camera travel or aggressive camera shake.
- A large documentation restructuring during visual tuning.
- Automatic NT13 approval on test success alone.
