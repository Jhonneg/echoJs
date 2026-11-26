# Bloom — Resonant Monolith rework roadmap

Status: **BL08 owner-approved. BL09 explicitly SKIPPED by owner; no comparison/acceptance execution. Preserve approved visuals and documented evidence limitations. No commit/push authorized.**

Original BL01 audit baseline: `origin/main` commit `0860050` (`lp04`, 2026-11-23). This is the latest **committed** public snapshot inspected for this plan. The owner's separate VS Code working tree may contain uncommitted changes; Codex must compare it before edits. No production, analysis, scene or application code was changed in this planning pass.

Local BL02 reconciliation (2026-11-23): current HEAD `a09d537`; Bloom/App/host matched the audited snapshot before this task, while later Lavender refinements and uncommitted documentation were preserved. Owner selected orthographic framing and approved the BL02 plan. BL02 now replaces only Bloom terrain and disables its legacy camera tilt; Bloom audio remains legacy until BL06. See PROGRESS for measured evidence and remaining review. Original audit rows below describe the pre-BL02 state.

## Vision and boundaries

Transform Bloom from a segmented luminous halo and flat mountain silhouettes into a cinematic, serene **3D lake landscape that behaves like a coordinated living instrument**:

- One towering, solid rectangular graphite/basalt **monolith** with a narrow luminous inset seam, slowly hovering/ascending/descending and making restrained yaw turns.
- Layered real **3D mountains** with mist and sparse luminous trails descending along believable ridges or valleys.
- Translucent lavender/cool-mint/rose **aurora curtains** that visually wash the mountains, monolith, haze and lake with coherent colored light.
- A dark reflective **lake** with monolith/aurora/trail impressions and small wave rings under the monolith.
- At most a couple of very small floating stone fragments; these are optional and subordinate. Keep the level, restrained camera, negative space, lavender/rose/indigo palette and recognizable Bloom atmosphere.

The generated concept image is an **art-direction target, not an exact browser-render requirement**. Retain enough darkness for dynamic illumination to have contrast, but keep the terrain readable without music. No forest, crowds, buildings, heavy particles, spinning arcade obstacle, or neon overload. This proposal intentionally supersedes the earlier Bloom-only flat-mountain/halo constraints in [ART_DIRECTION.md](ART_DIRECTION.md), but does not change any other landscape's approved baseline.

Architecture guardrails: use existing React Three Fiber/Three.js and shared Music Intelligence. No change to analysis algorithms or capture sources, no private/captured-media diagnostics, no speculative dependencies, no frame-rate React state, no expensive full-scene reflection or volumetric pipeline without a separate measured decision. Do not rewrite Crimson, Nocturne or Lavender Peaks. Preserve scene switching, existing audio-source lifecycle, quality and reduced-motion behavior. Create only the minimum scene-local abstractions proven necessary.

## BL01 — current-state audit (complete, documentation only)

| Area | Source finding | Consequence |
| --- | --- | --- |
| App wiring | `src/App.tsx` enables `createAnalysis({ musicIntelligence: true })`, but passes `analysis.signal` only to Bloom | Bloom is not a Music Intelligence consumer yet; App must eventually pass `analysis.musicFeatures` |
| Scene | `src/scenes/bloom/BloomScene.tsx` uses three stacked `ShapeGeometry` mountain silhouettes plus a foreground shape | Replace/reshape with true depth, normals and art-directed lighting; test viewport framing |
| Hero | Eight animated segmented torus fragments comprise `Halo` | Remove only after monolith/its composition is approved; avoid inheriting fragment motion |
| Camera | Bloom uses the shared orthographic `LandscapeCanvas` with `Framing`, plus default legacy bass camera tilt | Preserve the deliberately level view; migrate to scene-local `cameraTilt={false}` and a deliberate camera choice if perspective is needed |
| Sky | Opaque full-frame shader blends midnight/lavender/rose and one `atmosphere` scalar | Aurora needs layered spatial curves, independently animated density/opacity and coordinated scene-color output |
| Water | Shader fakes the existing *circular* halo reflection with ring distance, rotation, offsets and ripples | Must remove ring-specific logic when halo is removed; stage a new believable monolith/aurora reflection strategy |
| Response | `src/scenes/bloom/reactivity.ts` maps legacy broad `fast` + transient/flux envelopes to bass/mid/treble, atmosphere to glow | Replace with calibrated sustained energy, actual event guards and context-aware envelopes; do not transplant old coefficients blindly |
| Engine | `src/engine/LandscapeCanvas.tsx` already supports perspective or orthographic, camera overrides and disabled tilt without requiring a signal | Scene-local camera/migration should need no shared-engine redesign |
| Music Intelligence | `src/audio/musicFeatures.ts` exposes a borrowed, reused `MusicFeaturesV1` view: six-band energy; low/mid/high event list; context intensity/brightness/activity; session/frame/time/status | Read once per scene update, copy bounded scalars, consume events by session/sequence; no immutable snapshot assumption |
| Freshness | `musicFeaturesFresh` requires active status and at most 250 ms age | Inactive/stale/priming must not keep musical animation or replay old events |
| Public controls | Latest App has Reactivity fixed at `1`; the old public Reactivity control has been removed | Retain the scene's numeric gain/zero semantics in tests, but do not assume a visible Reactivity slider |

Music Intelligence energies are calibrated, bounded *linear* responses, not inferred instruments. Existing onset events are **broad low/mid/high**, with no inherent six-band attribution; qualify relevant events using a short, bounded local history of six-band rise around their attack times. `context.intensity`, `context.brightness` (when valid) and `context.activity` are continuous measured descriptors, **not** beat-grid, musical sections, chord, emotion, BPM or chorus detection. Do not present them as such.

### BL01 verification / provenance

- Inspected latest committed App/Bloom/host/Music Intelligence and existing art-direction/reference docs; worktree remained untouched during inspection.
- Current runtime footage, real-song alignment, device performance, screenshots of the *new* scene and uncommitted owner changes were **not** verified in BL01.
- Repository-specific `code-review` skill referenced in `AGENTS.md` was not installed in this workspace; the read-only inspection followed the documented boundaries instead.
- Existing [VERIFICATION.md](VERIFICATION.md) is the source for project check commands. Do not report tests or browser evidence as passed before a relevant implementation actually runs.

## Proposed music-to-visual orchestration

These are **design mappings**, not preapproved coefficients or implemented features. Validate them with generated, controlled traces before musical tuning. Avoid a universal energy multiplier that makes every object brighten in lockstep.

| Visual voice | Primary Music Intelligence source | Behavior and timescale | Shared effect |
| --- | --- | --- | --- |
| Aurora body | `context.intensity` plus low-frequency `energy.six.subBass` / `.bass` | Broad curved curtain expansion and glow with slow 0.5–2 s envelopes; restrained low-event accents | Emit one shared aurora illumination color/strength for mountain tint, mist and lake |
| Aurora hue and fine structure | `context.brightness` **only if** `brightnessValid`; high bands for delicate shimmer | Slow palette bias; subtle fine fold variation, not hard RGB flashing | Keeps every receiving surface chromatically consistent |
| Monolith vertical position | Smoothed `context.intensity` and low-band sustained energy | Slow intentional lift/settle, bounded by a fixed vertical travel range; silence returns to an authored hover | Water rings and reflection anchor follow its position |
| Monolith orientation | Slowly integrated, bounded scene-local motion with small `context.activity` influence | Gentle yaw and inertia; no endless fast beat-spinning; reduce/freeze under reduced motion | Reflected silhouette remains coherent |
| Monolith seam | `energy.six.highMids` sustained + broad-mid events *qualified* by high-mid energy rise | Sustained glow with short, visible attack accents | Seam reflection brightens in sync, independent of body position |
| Mountain trails | Independent `lowMids`, `highMids`, `presence`, `air` sustained values; compatible qualified events | Several lane groups move *downhill* at different continuous speeds; events create localized brief traveling pulses, not global flashes | Mountain local tint and water highlights are spatially tied to the active trails |
| Mountain/fog baseline | Small idle fill + shared aurora illumination + restrained `context.intensity` | Readable silhouettes in silence; builds add edge definition while retaining depth | Makes aurora feel like it lights a real environment rather than merely changing sky pixels |
| Lake surface | Consumes final scene light/hero outputs; low-band events can start **small** ripples | Gentle autonomous water motion, coherent reflections, short bounded rings | The lake acts as an optical consequence of the scene, not a second independently triggered equalizer |

**Qualifying events:** Consume `OnsetEvent` once via `(session, sequence)`. The event only describes broad `low/mid/high`. A six-band visual attack needs its corresponding measured six-band rise within an attack-time tolerance, with bounded history and guards against stale frames, skipped updates, seek/source resets, double delivery and session swaps. A bass-only event must not light high-mid trails or seam. Reduced motion suppresses rapid impulses/movement while optionally retaining calm illumination.

**Unified update:** A single scene-local controller reads borrowed features once per frame, updates event/history state and each visual voice, then delivers scalar/palette parameters to existing refs/shader uniforms. Distinct individual responses remain independently capped. Compute per-frame data outside React state; avoid allocations, subscriptions and new analyser reads in individual meshes.

## Proposed implementation phases — request approval one phase at a time

### BL02 — 3D mountains and composition gate

**Further range sculpting — implemented/verified, visual review pending (2026-11-23):** Owner requests stronger improvement after the detail pass. Offset middle/near peaks, diagonal drainage valleys and cavity/face contrast refine actual range overlap, preserving the existing scene systems and budget. Separate evidence: `docs/evidence/bloom/bl02-sculpt/`. BL03 remains unstarted.

**Remaining mountain refinement — implemented/verified, visual review pending (2026-11-23):** Owner explicitly continues mountain work: depth-band separation, matte rock-face/crest variation and visible inner portrait shoulders. Shared world geometry and existing camera/material pipeline retained; no BL03 work. Separate evidence: `docs/evidence/bloom/bl02-detail/`.

**Owner-requested ridge/shore refinement — implemented/verified, visual review pending (2026-11-23):** After reviewing BL02, owner approves improving natural ridge structure and shoreline endings first. Cubic shoulders, broad offset spurs and a shallow submerged toe refine shape within the same topology/material/camera budgets. Keep this within BL02; no BL03 authorization inferred. Separate before/after evidence is in `docs/evidence/bloom/bl02-refinement/`.

**Implemented / owner gate pending — 2026-11-23.** Two closed indexed terrain banks, static normal-based shading and depth fog; existing orthographic framing, halo and analytic lake retained. Standard64×15cells/bank,4788terrain triangles; Low32×7,1364. These near-planned grid sizes keep closures within the approved5000/1500budgets. Tapered shores sink inner closures below frame; foreground transition finishes behind the existing lake plane. No added audio mapping. Tests/build and isolated browser/resource/source-continuity checks pass; see `docs/evidence/bloom/bl02/current/`. Draws30→28, Standard total20029→24760triangles, textures1→1. Headless median16.7ms retained, with2isolated timing spikes; native performance and owner art approval remain pending. **Stop before BL03.**

- Build bounded, intentionally shaped 3D mountain banks with a central depth opening; low-poly or moderately tessellated geometry, coherent normals and fog depth, no infinite streaming by default.
- Preserve the still reflective lake, palette, horizon/monolith focus and wide vs portrait framing. Temporarily leave legacy halo where needed to assess composition without simultaneous hero replacement.
- Use static lighting and no new musical mapping in this phase. Consider limited perspective projection only if it improves depth *without* moving the approved framing; otherwise keep orthographic.
- **Gate:** owner compares desktop/wide/portrait renders against concept; mountain silhouette/depth/negative space and idle readability approved. Count geometry, draws, triangles and FPS before proceeding.

### BL03 — solid monolith and lake reflection transition

**Post-BL04 owner correction (2026-11-23):** Owner supplied `references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png` and approved stone depth/bevel/procedural surface, a physically recessed rose seam, local side lighting and exactly two subordinate suspended angular fragments. Implemented with revised authored lake images; fresh matched resting/stronger aurora comparisons and concept board in `docs/evidence/bloom/bl03-stone/current/`. Reopens monolith visual acceptance only. BL02 geometry, camera and BL04 aurora behavior/shared illumination are preserved. Stop for owner review; no BL05 or Music Intelligence changes.


**Owner beam refinement (2026-11-23):** Seam should read as emitted light. Use a bright feathered core/local pink glow in place of the dark-edged stripe, with corresponding reflected glow. Keep this in BL03; no global bloom or BL04 work.

**Implemented/verified; owner visual gate pending (2026-11-23):** Owner approves the concrete BL03 plan with “proceed.” One static rough rectangular monolith, inset-border rose seam and matching projected body/seam lake image replace the old halo. No optional fragments or new audio mapping; current mountains/camera preserved. Separate evidence: `docs/evidence/bloom/bl03/`. Stop for BL03 visual review before BL04.

- Replace the eight torus fragments with one tall solid basalt-like rectangular slab, narrow luminous seam, authored resting hover and at most two optional small fragments.
- Remove ring-specific `halo*` uniforms and circular reflection code. Introduce a controlled monolith reflection that matches the new geometry at the chosen camera angle; initially static, not yet Music Intelligence-driven.
- Keep a legible reflection and subtle concentric rings without creating a costly reflection pass by default.
- **Gate:** monolith and reflection are visually convincing at rest; center composition is not cluttered; no ghost circular ring appears in water.

### BL04 — auroras and coordinated ambient illumination

**Owner-approved implementation checkpoint (2026-11-23):**2sky shader folds (1Low), autonomous shared hue/strength/clock, matched lake impression and restrained existing key/fog/haze modulation. Monolith/beam/camera/mountains/audio preserved; no trails or MI linkage. Evidence: `docs/evidence/bloom/bl04/`. Stop for owner visual approval before BL05.

- Add 2–3 layered transparent curtains or shader folds with bounded opacity and slow *autonomous* idle movement. Prefer cheap shader/screen-space-inspired techniques; avoid full-scene volume rendering.
- Produce one coherent aurora light color/level that tints mountain-facing edges, distant haze, monolith and lake. This can be artistically approximated with shared uniforms/limited lights rather than physically accurate volumetrics.
- **Gate:** aurora is visible in sky and demonstrably influences *multiple* environmental surfaces; idle scene remains serene and not overbright; quality modes tested.

### BL05 — cascading mountain trail geometry

**Owner-approved implementation (2026-11-23):** Two batched, terrain-attached rose/mint ribbons at Standard; one at Low. Soft autonomous downhill pulse, feathered core/glow, reduced-motion freeze. Uses actual quality-specific triangle interpolation and does not alter terrain, monolith, auroras, lighting or audio. Existing water/reflections unchanged. Evidence and matched resting/stronger aurora comparisons: `docs/evidence/bloom/bl05/current/`. Hidden/zero/dim/full diagnostics exist only in isolated verification copies. Stop for visual review before planning BL06.


- Trace sparse authored/procedural downhill paths tied to terrain world positions; do not project straight diagonal 2D stripes across peaks.
- Add traveling gradients/soft pulses with limited lane counts and no expensive dynamic geometry rebuilding. Provide static/manual diagnostic levels for the visual gate; music linkage comes in BL06.
- **Gate:** viewer clearly reads downhill path and mountain depth, with trails visible but secondary to the monolith/aurora.

### BL06 — complete Bloom Music Intelligence migration

**Implemented/technically verified (2026-11-23):** App→Bloom now passes the existing MusicFeatureReader; one borrowed-frame `music.ts` controller delivers qualified six-band attacks and independently bounded sustained/ambient outputs. Final pose/light controls drive reflections and local rings/glints. Shared engine and other landscapes unchanged; historical old Bloom helper is not in its runtime import path. Existing approved geometry/aurora idle generators remain intact. Browser generated high-mid .04242/.14139 energy produces seam1.0954/1.2207; bass/low-mid false high-mid accents zero. Material-owned seam/aurora controls correct a discovered implicit uniform-sharing issue; screenshot ROI confirms distinct sustained/attack levels. Evidence: `docs/evidence/bloom/bl06/current/`. 52 test files, lint/typecheck/build and controlled browser gate pass; owner visual/real-song review and native certification remain pending. Stop before BL07.


**Local reconciliation / plan pending (2026-11-23):** App still supplies legacy `AudioSignal` to Bloom despite MI being enabled. Existing aurora/trail clocks remain autonomous; monolith/reflection pose is static. Halo removal and disabled Bloom camera tilt are already implemented, so those requirements need verification rather than shared-host changes. Preserve current approved two-lane/one-Low composition and procedural stone/fragments. Plan one borrowed-frame controller, scalar history/event guards, independent scene outputs and final-pose/light-coherent lake updates; no shared analysis/other-landscape changes. Await separate BL06 plan approval.


- Change App/Bloom input to `MusicFeatureReader`; remove Bloom's runtime `AudioSignal` dependence, old `reactivity.ts` fast/flux response, legacy halo bass motion and shared bass-camera tilt.
- Implement the unified borrowed-frame scene controller, bounded six-band sample histories, event qualification, independent attack/release envelopes and manual/test-only feature drivers.
- Route the first actual MI controls to auroras, monolith body/seam, mountain trails, environment tint and water; the visual mapping defined above is part of this same roadmap, not an unrelated future audio project.
- **Gate:** signal-to-visible-output matrices for silence, bass-only, low-mid, high-mid sustained and attacks, treble-only, mixed music, context-only, stale/priming/source-switch, gain0 and reduced motion. Confirm no residual legacy Bloom path; other landscapes unchanged.

### BL07 — whole-landscape musical choreography

**Latest focused refinement (2026-11-23):** Owner requests stronger perceptibility while preserving the working composition/lifecycle. Implemented larger independently phased stone orbits/rotation,10Standard/6Low distinct downhill paths with body/detail event routing, direct local mountain aurora fill plus stronger stone/haze response, high-mid beam spill/contrast and larger antialiased tapered ripples. [Full audit/results/films](evidence/bloom/bl07-perceptibility/README.md).56test files and controlled browser/material-pixel/camera/resource checks pass. Autonomous floating is measured throughout12seconds of zero-energy playback; dedicated pointer footage covers extremes/leave/blur/reduced motion. Owner art/music/native acceptance remains OPEN. No BL08 or commit/push.

**Consolidated owner refinement (2026-11-23), superseding earlier BL07 scope:** Playback-state-driven water-rest/ascent/autonomous hover/descent, explicit shared-tab floating pause control, independent stones and fine-pointer orthographic parallax. Preserve stone/terrain geometry. Existing analytic reflections now receive projected camera-space final poses. Stronger aurora/beam/ripples and4trails per bank (Low2) provide independent six-band activity. Current evidence: `docs/evidence/bloom/bl07-complete/`, `bl07-complete-controls/`, `bl07-complete-camera/`.54test files and controlled browser checks pass; owner aesthetics/listening and native input/hardware acceptance remain pending. Do not begin BL08.


**Implemented/verified; owner review pending (2026-11-23):** Slower context evolution, sky-leading critically damped monolith lift/yaw, lane-specific sustained travel and fresh proportional low-event rings. Existing seam sustain/qualified attacks are unchanged frame-for-frame. Motion uses the existing bounded lift/yaw; no new monolith scaling or geometry is introduced. `music.ts` is the only production change. Matched BL06/current38s generated-MI schedule, annotated fixed-camera videos, output traces and screenshots: `docs/evidence/bloom/bl07/current/`.53test files, build/lint/typecheck, delivered-light/reflection checks, band/source/reduced regressions and fresh headless cadence pass. Stop for owner review before BL08; native/real-song acceptance remains separate.


- Give environmental `context` changes a slower long-phrase feel, sustained bands distinct local movement and qualified events brief accents. Explicitly separate ambient drift, sustained envelopes and onset impulses.
- Stage musical build/quiet/attack test sequences: sky illumination leads/expands, trails carry inner rhythm, monolith responds with scale/inertia, seam emphasizes attacks, and water shows all final light responses.
- Measure and tune response/brightness ranges with fixed-camera side-by-side output and timestamps. Do **not** claim the analyser can identify chorus, tempo or instruments.
- **Gate:** multiple parts of the frame show recognizable, coordinated-but-nonidentical change. Avoid all-on/all-off, long empty darkness, overactivity and visually frozen sections.

### BL08 — visual polish and performance

**Owner-approved after controlled audit (2026-11-23):** Owner authorizes advance after endorsing the BL07 visuals. All107production sources preserved. Twelve Standard/Low resting/active frames across desktop/wide/portrait, actual DPR1/1.5/.75 drawing buffers, nine2s timing samples, three resource cleanup cycles and reduced-motion checks pass. Existing Low fallback suffices; no visual tuning justified.56test files/lint/typecheck/build pass. [Review/measurements](evidence/bloom/bl08/README.md). Known dependency Clock deprecation remains; no WebGL errors. Native/GPU/real-song acceptance is not inferred. No BL09 or commit/push.

- Tune fog layering, horizon/vertical composition, nuanced rock materials, aurora blending, reflection distortion, responsive camera framing and static readability.
- Profile geometry/draw calls, shader/pixel costs, frame times and memory at Standard/Low. Provide a shader-light/geometry-low fallback if necessary; preserve source handling, scene switching and reduced motion.
- **Gate:** desktop/wide/portrait on/off screenshots, no obvious frame drops, correct cleanup after scene switch, no WebGL warnings. Report tested hardware and any unmeasured performance separately.

### BL09 — musical acceptance and comparison with other ECHO landscapes

**SKIPPED BY OWNER (2026-11-23):** “skip this” supersedes the proposed plan below. Do not execute or request its acceptance review. Skipped checks are not passed; retain existing evidence limitations. No further production work or commit/push authorized.

**Proposed plan (2026-11-23), following owner BL08 approval:** Acceptance/evidence only; no production changes. Replay identical generated silence/bass/mid/treble/attacks/layered/slow/build-release inputs through existing analysis across Bloom/Crimson/Nocturne/Lavender at equivalent viewport/quality/source settings, retaining authored cameras/motion. Deliver a synchronized annotated scene comparison plus numeric response/frame-cadence evidence. Exercise transport/source switching, reduced motion and both qualities. Collect owner text observations for permitted local music/native controls without recording owner media. Assess the five criteria below; keep missing native/real-song evidence explicit. Report discrepancies before proposing corrective code. Phase-plan approval required before execution; no automatic commit/push.

- Capture same permitted tracks or generated, time-annotated scenes for Bloom, Crimson, Nocturne and Lavender Peaks with equivalent capture conditions.
- Review five owner-facing criteria: **(1)** whole-frame participation, **(2)** band separation, **(3)** attack clarity without strobe, **(4)** musical build/quiet storytelling, **(5)** Bloom's serene identity and visual depth.
- Verify silence, sustained bass, isolated mid/treble, short attacks, layered music, slow passages, pause/resume/source switching, reduced motion and quality. Collect screenshots/video, numeric state-to-pixel evidence where feasible and FPS measurements where available.
- **Gate:** owner approves the musical and artistic feel. Do not equate automated passing tests with aesthetic acceptance. Only then request permission for a focused commit/push; no automatic release.

## Delivery and workflow

1. Start each phase in **Codex Planning mode** by reading `AGENTS.md`, current `docs/PROGRESS.md`, this roadmap and only relevant architecture/art/verification files. Check the actual local `git status` first. The owner's uncommitted work supersedes the audited public commit where different.
2. Present a concise proposed change list, measured baseline and review artifacts before implementing that phase. Wait for owner approval; then switch to Coding mode.
3. Per phase, run scope-relevant tests plus lint/typecheck/build as feasible, report specific pass/fail/not-run/manual outcomes, preserve unrelated changes and update `docs/PROGRESS.md`. Render actual scene pixels at relevant gates.
4. No auto-commit, push, deployment or cleanup of skipped/unapproved phases. Keep each phase small enough for visual review; changes to Music Intelligence DSP or shared engine require a separate owner decision.

### Historical BL02 planning request (fulfilled; current next action is owner visual review)

> Read `AGENTS.md`, `docs/PROGRESS.md` and `docs/BLOOM_RESONANT_MONOLITH_ROADMAP.md`. This roadmap's BL01 audit was made against public commit `0860050`, so verify the exact current local working tree and any user edits first. **Plan BL02 only**: real 3D mountains, depth/fog, lake and camera framing, preserving the old halo temporarily. Show the proposed geometry/shader approach, affected files, expected performance, responsive visual verification and acceptance gate. Do not implement BL03–BL09 or modify shared Music Intelligence/other landscapes. Stop and wait for approval before coding.


## Consolidated BL07 — ten-section acceptance traceability (2026-11-23)

This matrix supersedes broad earlier completion summaries. “Implemented” does not imply owner artistic/native acceptance.

| Owner section | Implementation and evidence | Remaining acceptance |
|---|---|---|
|1 Playback monolith|Explicit source lifecycle; water rest,3–4s ascent,6s autonomous float,4–5s descent; quiet playback remains elevated; actual file pause/resume/disconnect/replacement evidence retained.|Native shared-tab floating control remains manual, using the owner-selected explicit fallback.|
|2 Suspended stones|Independent delayed hover/orbit/rotation; qualified low/high-mid impulses now added independently, bounded at.04world units and suppressed at rest/reduced motion.|Owner judges prominence/restraint.|
|3 Parallax|Existing orthographic camera, bounded±2.5°/±1.2°,250ms smoothing, leave/blur return, reduced/coarse gates; real browser pointer events under declared fine-pointer emulation.|Native pointer feel and aesthetics.|
|4 Aurora environment|Shared final aurora response drives curtains, existing directional light, stone, haze and colored lake, with restrained ambient baseline.|Owner judges rest/moderate/strong contrast.|
|5 Trails|4perbankStandard/2Low, actual terrain attachment, distinct roles/widths/phases/rates, faint idle and qualified local pulses; individual six-band browser matrix.|Owner judges density/depth.|
|6 Beam|Recessed narrow core, opening halo, adjacent stone glow; sustained high mids and qualified accents; same final beam level in water/core/stone.|Owner judges beam strength.|
|7 Water|Visible ambient/event rings; reflected body/beam/fragments now use actual shared source triangles with projected wet distortion. Nine-view GPU masks match CPU silhouettes within1px with no missing/extra pixels; no full-scene reflection pass.|Normal wet/material appearance remains artistic review.|
|8 Choreography|Slow environmental context, sustained band voices and qualified fast accents; playback float stays independent. Final annotated control-sequence movie covers buildup/attacks/quiet/descent.|Real-song musical feel requires owner listening.|
|9 Constraints|Other scenes/shared MI/approved source geometry preserved; no dependency/React hot state/RT/texture added.13draws,6532/2148triangles; repeated scene/quality replacements clean up.|Native target-window performance remains manual.|
|10 Verification/approval|55test files, lint/typecheck/build, controlled six-band matrix, actual file lifecycle, source/stale/replay/reduced tests, camera/GPU masks, measured output values, cleanup and annotated footage PASS.|**OPEN: native mouse/shared-tab behavior, real-song listening and owner visual/musical approval. BL07 is not fully accepted.**|

Final evidence: [annotated expressiveness movie](evidence/bloom/bl07-musical-review/current/expressiveness-final.mp4), [camera footage](evidence/bloom/bl07-final-gaps/current/lifecycle-and-parallax.mp4), [silhouette report](evidence/bloom/bl07-optics/current/silhouette-assessment.json), [measurements](evidence/bloom/bl07-final-gaps/assessment.json). No captured media or audio recording. Current reflection is a stylized camera-projected wet image with exact source silhouettes, not a claim of physical ray-traced optics. No BL08 or commit/push.

## Post-BL08 — owner-requested3D water reconstruction (2026-11-24)

Owner rejects the current water appearance and authorizes a focused reconstruction; this supersedes the earlier water visual freeze only. BL09 remains skipped. Approved mountains/monolith/fragments/auroras/music mappings stay fixed. [Design/camera study and proposed implementation](BLOOM_3D_WATER_RECONSTRUCTION.md) document the horizontal-view incompatibility and3°orthographic proposal. Owner approved the3°orthographic proposal. Water implementation and controlled geometry/reflection/GPU/quality/reduced-motion/cleanup checks now pass; [evidence/review](evidence/bloom/water-3d/README.md). Owner visually approved the result (“looks good now,”2026-11-24). Native performance/real-song inspection remain unverified; approval does not infer those observations. Other landscapes/shared MI/application phases are untouched; stop without starting another phase or committing.
