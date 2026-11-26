# POC roadmap — one task at a time

## Current checkpoint — Bloom 3D water visually approved (2026-11-24)

Owner approved the3°orthographic proposal. Focused water reconstruction and controlled checks now pass; [implementation/evidence](BLOOM_3D_WATER_RECONSTRUCTION.md) is visually approved by the owner (“looks good now”). Preserve this result and stop; native performance/real-song feel remain unverified. Other Bloom content, MI/other landscapes and APP01 sources are preserved; BL09 stays skipped. Water committed (`db11cb2`). APP01 owner approved 2026-11-26; APP02 owner approved; APP03 implemented, owner review pending; APP04 unstarted.

Current order is intentional: validate external audio before investing in graphics. Plan/approve each task separately; mark actual status only in PROGRESS.md. Each gate requires owner sign-off. If a required check cannot run, record a blocker; do not mark the gate passed or silently expand scope.

## P01 — Scaffold (next)
- Create a minimal Vite React TypeScript app in the existing repo without overwriting handoff files. Add npm scripts for dev/build/typecheck/lint as appropriate; no 3D or unrelated libraries. Minimal diagnostics placeholder and README run instructions.
- Acceptance: dev server responds locally; typecheck, lint and build pass; existing docs/skills intact; dependency versions recorded. Report MCP status separately. Browser smoke if available, else explicit pending. Stop.

## P02a — Browser tab permission and lifecycle
- Minimal connect/disconnect diagnostics around getDisplayMedia, explicit gesture, missing audio handling, error labels, lifecycle cleanup. No 3D. Use permitted local fixture tab.
- Acceptance: on target Chrome user selects tab with audio; stream exposes audio track; original playback remains audible; cancel/missing-audio/reconnect/native sharing-stop paths handled; all tracks ended on disconnect; no media sent/stored. Manual test pending if unavailable. Stop.

## P02b — Frequency analysis and diagnostics
- Add analyser and common AudioSignal; live level/spectrum, band values and connection state. Mock/synthetic unit tests for frequency bin mapping/normalization/silence; verify real samples from permitted tab.
- Acceptance: values bounded and responsive to low/mid/high fixture tones, fall toward zero on silence, no duplicate playback, no hot React state loop; cleanup on disconnect verified. Record actual browser evidence. Stop.

## P02c — Local file adapter
- Local file selection/play/pause/volume (local only) and analysis using same contract; source switching and resource cleanup.
- Acceptance: local supported fixture plays exactly once; diagnostics respond; pause/end/unsupported file handled; switching/repeating releases resources; no upload; unit/functional checks where feasible. Stop.

## G1 — Audio feasibility gate (before any 3D)
Owner manually validates real permitted browser tab capture with audible source, changing nonzero frequency values, silence and teardown; local file works; privacy requirements satisfied. Record browser/OS/results. If blocked, investigate within a bounded task and present alternatives (local-only demo, supported browser or separate native future direction); owner decides whether to change scope. No bypass or assumption of streaming rights. No Bloom work until owner approves G1.

## P03a — Static Bloom composition
- Add R3F/Three only now, with compatible versions. Build a restrained static scene (backdrop, mountains, ring, lake approximation, fixed camera); asset provenance recorded. No animation/audio.
- Acceptance: screenshot at reference desktop viewport reviewed by owner against approved art direction; build/typecheck/lint pass; no errors attributable to change. Stop before refinement beyond requested composition.

## P03b — Ambient motion
- Add gentle ring drift, water ripples; sparse particles/fog only if beneficial. Respect reduced motion and preserve composition. No complex shader if cheaper option adequate.
- Acceptance: visually coherent without playback; no sudden movement; no per-frame React updates; scene remains responsive; record visual review. Stop.

## P04 — Real audio integration
- Bridge independent AudioSignal to Bloom with delta-smoothing, documented mappings and one reactivity control. Keep capture UI independent; no per-frame React setState.
- Acceptance: actual permitted tab AND local file inputs visibly affect scene; individual bands demonstrated; silence/stop decays to ambient; zero reactivity leaves ambient; no duplicate sound; connection lifecycle still works. Manual checks and tests noted. Stop.

## P05 — Bounded refinement and evaluation
- Only owner-approved visual fixes; assess FPS, assets, browser errors, performance and token/rework observations. If reflection too costly choose approximation; do not expand feature scope. Optional low-quality switch if necessary to evaluate feasibility.
- Acceptance: approved static/animated reference, measured performance with environment and limitations, asset size and licenses, known bugs/tradeoffs, privacy/lifecycle evidence and a recommendation. No fabricated metrics.

## G2 — Production go/no-go
Owner reviews visual quality, actual audio responsiveness, performance, workflow and effort. If approved, plan MVP UI/quality/fullscreen/accessibility in a new roadmap revision. Additional worlds, microphone, native capture and production architecture not authorized by this POC plan.

## M01 — Source and controls interface

Owner requested moving forward on 2026-11-16 with current motion limitations deferred and explicitly approved this exact task. This is bounded interface work, not automatic production-readiness approval or authorization for all MVP work. Actual implementation/review status is in PROGRESS.

- Make choosing a shared tab or local file the primary user flow, with concise connection, waiting/silent, denied/error and ended feedback using existing adapter states.
- Group source selection, Disconnect, Reactivity and local-only playback/volume controls into a coherent responsive interface. Keep the existing Bloom composition and audio behavior.
- Put detailed signal diagnostics, visual debug and performance tools behind collapsed development details so they remain available without dominating normal use.
- Verify keyboard access, labels, narrow-screen layout, source switching and teardown, using existing automated checks and applicable browser checks. Report native/manual limitations separately.
- Boundaries: no further audio/motion tuning, new landscape, adapter rewrite, dependency, backend, account or deployment. Fullscreen and graphics quality are separate later tasks, not part of M01.
- Acceptance: both existing source flows remain reachable and understandable; controls accurately reflect source state; diagnostics remain accessible; typecheck/lint/build and relevant tests pass. Stop for owner review.

## M02 — Fullscreen controls

Owner explicitly approved this scope after M01 acceptance on 2026-11-16.

- Add Enter/Exit fullscreen for Bloom and its existing audio controls, synchronized with browser fullscreen changes, including native exit via Escape.
- Handle unsupported browsers and rejected requests clearly; preserve keyboard access and resize behavior.
- Verify layout and continuous playback across transitions. Keep audio processing, adapters, motion and quality settings unchanged; no dependency or production deployment.
- Acceptance: actual fullscreen API targets the scene/control container, state reflects browser events, controls remain reachable on narrow/short screens, checks pass, and owner confirms native Escape plus audible playback continuity. Stop for review; actual status is in PROGRESS.

## M03 — Graphics-quality control

Owner explicitly approved this exact scope on 2026-11-16. Actual implementation/review status is in PROGRESS.

- Add Standard / Low graphics-quality selection beside existing experience controls, available in normal and fullscreen views. Standard preserves the current device-pixel-ratio range 1..1.5; Low uses render DPR 0.75, deliberately trading sharpness for fewer rendered pixels even on 1× screens. Keep Standard as the default and settings in memory only.
- Change drawing resolution without remounting Canvas or restarting audio. Preserve scene geometry, palette, motion, sample rate, FFT, frame cadence and source adapters. No automatic adaptation, higher-resolution mode, new effects or dependencies.
- Include selected preset alongside actual render DPR in performance results; invalidate active measurement when selection changes. Do not infer a hardware FPS improvement from pixel-count reduction.
- Verify backing-buffer resolution, repeated switches, keyboard/mobile/fullscreen access, ongoing generated playback, unchanged source lifecycle and relevant existing checks. Record any owner hardware comparison separately.
- Acceptance: preset changes only render resolution, survives fullscreen transitions within the session, reports truthful measurement settings, and handles normal/narrow layouts without console errors. Stop for owner review.

## M04 — Accessibility and release-readiness review

M01–M03 are accepted. Owner explicitly approved this exact scope after creating checkpoint 130a99e. Actual implementation/review status is in PROGRESS.

- Review the complete existing experience for keyboard/focus access, labels/status announcements, mobile overflow and usable unsupported/error states, including fullscreen and graphics quality. Limit fixes to concrete interface defects found in these areas.
- Verify the committed source builds from an isolated checkout and run existing relevant checks plus applicable browser regression checks. Preserve source adapters, audio processing, scene composition and deferred motion behavior; do not reopen audio tuning.
- Consolidate supported-browser instructions, privacy behavior and known limitations into a concise release checklist with passed/manual-pending evidence. Do not infer hardware performance from automation.
- Boundaries: no new product feature, dependency, service, scene, hosting setup or deployment. Publishing requires a separate plan and authorization.
- Acceptance: report review findings and bounded fixes, reproducible build/check evidence, remaining manual checks and a recommendation on proceeding to deployment planning. Stop for owner review.

## M05 — Landscape-first portfolio interface

Owner approved the revised scope: no developer access, full-screen landscape, and only ECHO branding plus the scene name outside one compact chooser. This supersedes the earlier proposed standalone Add audio/fullscreen buttons and developer-mode idea. Preserve M04 fixes/evidence; deployment planning is deferred.

- Bloom fills the complete viewport immediately with ambient motion and no source/permission requirement. Preserve geometry, palette, camera/framing logic and audio/motion processing.
- Use the Bloom scene label as the compact chooser toggle. Keep source selection, local playback/volume, Disconnect/Cancel, Reactivity, Standard/Low quality and native fullscreen inside it. No permanent control bar or other landscape controls.
- Remove diagnostics, visual debug and benchmarks from the interface entirely. No developer-access mode or query opt-in. Existing verification utilities may remain unmounted in source; no new developer feature.
- Preserve privacy, source teardown, reduced motion, native fullscreen and keyboard/mobile access. Keep the page free of scrolling; allow internal chooser scrolling on short screens. Verify closing the chooser preserves playback and focus returns coherently.
- Acceptance: closed view contains the full landscape, ECHO and Bloom only; all existing end-user functionality is reachable through the chooser. Run relevant checks, report limitations and stop for owner visual/functional review. No dependency, hosting or publishing.

## L01 — Lavender Peaks static landscape

Owner approved the first new landscape as a static selectable preview, using the misty lavender mountain reference. This is one bounded task; motion, audio response and the other reference directions need separate review.

- Keep Bloom as the default and add Lavender Peaks as a second in-memory scene choice inside the existing chooser. Switching scenes must preserve audio source, playback, fullscreen and settings.
- Compose a distinct pale sky and layered mountain scene with procedural geometry/gradients. The reference JPEG remains conceptual and is not a runtime asset. No halo, lake, central prop, animation or audio mapping.
- Show the selected scene name on the closed chooser. Label Lavender Peaks as a visual preview and disable Reactivity while selected, preserving its value for Bloom.
- Acceptance: owner reviews desktop and portrait composition against the reference; scene switching, keyboard controls and audio continuity work; relevant tests, typecheck, lint and build pass. Record any unavailable browser/manual checks. Stop before reactive work.

## L02 — Lavender Peaks sideways audio layers

Owner explicitly approved this experiment after choosing front/treble, middle/mids, back/bass and continuous sideways drift.

- Group the six ridges into three pairs; use band energy for smooth rightward speed, with front/middle/back maxima 0.6/0.4/0.25 world units/s. Stop in place after silence.
- Repeat terrain seamlessly; preserve palette and fixed camera. Enable Reactivity; zero Reactivity/reduced motion freeze in place. Keep source playback independent of scene selection.
- Acceptance: isolate each band, verify timing/bounds/wrapping and responsiveness; run tests/typecheck/lint/build and available browser checks. Owner reviews actual music before tuning. No additional effects or audio processing changes.

## L03 — six frequency bands for six mountains

Owner approved six independently driven mountains after reviewing the proposed ranges. Add a parallel six-band normalized signal to the existing analyser: 20–80, 80–250, 250–800, 800–2500, 2500–6000 and 6000–20000 Hz. Assign one ridge to each, back to front. Preserve current travel speeds/smoothing, Bloom's three-band behavior and audio source lifecycle. Verify isolated FFT bands, boundaries/Nyquist, reset/silence and browser tones where available; owner reviews musical response. No instrument separation, dependency or new effect.

## L04 — shared landscape camera tilt

Owner requested a universal camera effect, then explicitly opted Lavender Peaks out. Use one LandscapeCanvas host for camera roll, enabled by default for future scenes and Bloom; Lavender Peaks stays level. Preserve Bloom's camera/halo response and verify zero/reduced-motion resets, existing tests and browser behavior where available. No audio processing, dependency or new visitor control.

## C01 — Crimson Horizon composition preview

Owner approved the dark sun valley direction, scene name Crimson Horizon, static composition first and inherited shared camera tilt.

- Add a third selectable scene with black sky, low pale pink sun, four asymmetric terrain layers and selective crimson edge/face highlights. Partially obscure the sun with distant ridges; use restrained localized glow and procedural assets only.
- Use LandscapeCanvas with default camera tilt. Keep terrain/lighting/sun static and describe Reactivity as controlling shared tilt for this preview. Preserve Bloom default and source playback across scene changes.
- Verify desktop/portrait/wide composition, tilt coverage, quality/fullscreen, zero/reduced motion and local playback continuity. Run tests/typecheck/lint/build and stop for owner visual review. No additional audio mappings or dependencies.

## C02 — true 3D Crimson Horizon with mouse camera

Owner requested solid 3D terrain and mouse-following camera movement, choosing gentle viewpoint shift/return and fidelity to the supplied reference.

- Replace flat layers with a solid triangulated valley and 3D pink sun. Preserve black/crimson art direction; add perspective, lighting and bounded camera parallax without dependencies or an explorable camera.
- Keep pointer motion local to Crimson Horizon; reset on leave/blur, ignore touch and honor reduced motion. Retain shared bass roll and audio source behavior.
- Extend LandscapeCanvas with optional projection/camera configuration while preserving other scenes' defaults. Test geometry integrity and pointer smoothing, plus desktop/portrait/wide browser rendering, controls and playback continuity. Stop for owner visual review.

## C03 — ridged 3D composition gate

Owner approved the revised terrain/material strategy with “lets go.” Preserve genuine 3D and perspective mouse movement; reject static 2.5D silhouettes. Prioritize reference identity and stop before further audio reactivity.

- Replace Gaussian mountain summation with deterministic four-octave ridged multifractal terrain, asymmetric bank envelopes, bounded domain warping and a wide quiet valley. Retain real geometry/closure and foreground/distant ridge depth.
- Use custom near-black directional shading, selected thin crimson crests and distance/sun-centered red haze. Preserve the bright pink sphere and generous negative space; adapt framing across viewports without stretching.
- Disable only Crimson Horizon's bass roll/reactivity while retaining mouse movement, quality and source continuity. Keep other landscapes unchanged; no dependency, texture or forward-travel/chunk system.
- Verify deterministic noise/height/bounds/normals/closed geometry, neutral and pointer-extreme desktop/portrait/wide renders, controls and source continuity. Owner approval of static composition is required before any next audio milestone.

## C04 — endless Crimson Horizon journey

Owner explicitly approved forward travel during music, a sun driven by the number of active frequency layers, brighter terrain and a nightshade sky. This authorizes travel/reactivity beyond C03; it does not record aesthetic acceptance of C03.

- Stream genuine 3D ridged terrain with matching boundaries, a bounded four-chunk window and local coordinate rebasing. Preserve the wide valley and mouse perspective camera.
- Music energy controls eased forward speed; pause/end/disconnect/stale input stops it. Silence dims the sun; six active-band states determine brightness. Keep the sun distant with constant size.
- Retain mouse movement while silent; reduced motion freezes camera travel/pointer. Reactivity scales travel and sun. Preserve other scenes and audio processing.
- Implemented with test/build/browser evidence in PROGRESS. Owner visual/musical review remains pending; no subsequent milestone approved.

## Nocturne — Industrial Crossing

Owner approved N01 and subsequently N02 on 2026-11-16 ("lets move" after the bounded N02 proposal). N02 approval permits progressing from the base composition. Owner subsequently approved the bounded N03 lighting/manual-controls plan; Owner approved the bounded N04 shared-reflection/puddles/haze/gate plan on 2026-11-17. Owner approved the bounded N05 existing-audio/manual-mode integration plan on 2026-11-17. Owner approved N06 verification with “go ahead” on 2026-11-17; actual results and remaining manual checks are in PROGRESS and NOCTURNE_N06.md. No later feature or deployment task is authorized.

- **N01 — Architectural blockout:** selectable stationary perspective 3D alley, building masses, crossing/railings, road and distant gate. Dim neutral review fill; desktop reference comparison and responsive/integration checks. Stop for owner composition review.
- **N02 — Geometry details and static materials:** recessed doors, windows, columns, selective pipes/cables/vents and fixture housings.
- **N03 — Independent lighting groups:** manually isolate magenta bass, cyan mids and violet treble lighting. Near-zero inactive emission/spill.
- **N04 — Reflections, atmosphere and postprocessing:** evaluate reflection techniques within existing renderer; wet asphalt/puddles track active illumination, restrained haze/bloom.
- **N05 — Audio integration:** existing feature contract/boundaries, independently smoothed light groups and overall atmospheric response; no architecture/camera movement.
- **N06 — Performance and integration:** responsive behavior, bounded resources, source continuity and target hardware evidence.

Owner's 2026-11-22 request authorizes a bounded Nocturne Music Intelligence audit and one left cyan panel integration. Audit the actual existing mappings and measured brightness first; then add an independent panel using validated high-mid energy and onset-qualified accents. Preserve the other lighting groups and shared Music Intelligence implementation. Test isolated and mixed synthetic feature cases, compare delivered fixture values, and report browser/music-review limits. This does not authorize a general Nocturne lighting redesign or the next milestone.

Owner visually approved the resulting single fixture and requested a review-only live music-reactivity check: fixed-camera generated or permitted audio, time-aligned high-mid sustain/attacks, bass/low-mid isolation, silence and magenta independence. Report findings and any scene-local mapping proposal before further implementation. No geometry, other fixture, global-lighting or Music Intelligence change is authorized by this review request.

N01 follow-up (2026-11-16): owner approved Crimson-style mouse camera with bounded lateral/vertical parallax, smooth return and reduced-motion centering. This supersedes the fixed-view requirement only for pointer interaction; no forward travel or later phase authorized.

## Music Intelligence — shared audio interpretation

See [ECHO_Music_Intelligence_Roadmap.md](ECHO_Music_Intelligence_Roadmap.md) for the owner-supplied application-wide roadmap. MI00 audit and owner-approved MI01 diagnostics/baseline are implemented with evidence in [MI01_BASELINE.md](reports/music-intelligence/MI01_BASELINE.md); actual review status is in PROGRESS. MI02 and later phases require separate bounded plans and approval. Preserve the legacy feature path and each landscape's accepted mappings until validated migration is authorized.

MI01 follow-up (2026-11-18): owner approved live tab capture in the separate development lab, reusing the existing adapter with transient diagnostics and synthetic-only exports. Implementation/automated evidence is ready; native sharing and owner review remain pending in PROGRESS. This does not authorize MI02 or change production audio/scene mappings.

MI02a (2026-11-18): owner approved lab-only band-energy calibration and fixed linear/soft-knee comparison with numeric tolerances. Evidence is in [MI02A_ENERGY.md](reports/music-intelligence/MI02A_ENERGY.md): linear meets this task's targets; soft knee misses loud-end contrast. Owner review pending; no production default, complete MI02 gate, MI03 or scene migration authorized. See PROGRESS for actual checks and remaining manual evidence.

MI02b (2026-11-18): owner approved the lab-only range/noise comparison. [MI02B_RANGE.md](reports/music-intelligence/MI02B_RANGE.md) records all safeguards passing but additional early control clipping and gain/history variation; fixed linear remains the recommendation. Owner review and full MI02 energy decision remain pending. No production gain/default/mapping change or MI03 implementation authorized.

MI02 lab checkpoint (2026-11-18): owner accepted MI02a and then MI02b (“it passed”). Retain fixed linear as preferred development candidate; experiment costs/failures remain documented. Next is a bounded MI03 plan with approved event criteria, not an automatic implementation or production migration. Detailed status/manual-evidence limits remain in PROGRESS.

## Animation refinement direction and MI03 proposal — 2026-11-18

Owner selected an expressive but controlled Crimson-first pilot, including bounded subtle terrain deformation and musical/playback transition refinement. [ANIMATION_REFINEMENT.md](ANIMATION_REFINEMENT.md) records the staged MI05/MI06 direction and preservation/performance bounds. This overrides the earlier tentative Nocturne pilot recommendation; other landscapes remain separate reviews. MI03/MI04 and the existing feature-quality gate still precede scene implementation.

The staged plan's first deliverable is ready: [MI03_PLAN.md](reports/music-intelligence/MI03_PLAN.md), a bounded lab-only onset-detector proposal and quantitative core/stress acceptance criteria. Criteria require owner approval before MI03 implementation under the Music Intelligence roadmap's measurement rules. This checkpoint contains documentation only; no scene migration, new detector, context implementation or full-roadmap authorization is inferred.

MI03 initial run (2026-11-18): owner approved the implementation criteria with “go ahead.” The lab detector is implemented; [MI03_RESULTS.md](reports/music-intelligence/MI03_RESULTS.md) records all labeled core attacks matched but 29 extra release-associated events, so the core gate is FAIL. Review/approve the proposed release-attribution correction before MI04 or any scene changes. The original roadmap's goals/order and frozen criteria remain unchanged.

MI03 focused correction (2026-11-18): owner approved release attribution. [MI03_CORRECTION.md](reports/music-intelligence/MI03_CORRECTION.md) records the unchanged synthetic core gate now passing (5,157 matches, zero extras), separate stress passing, and unequal-mixture misses retained as limits. Await owner review; next is a bounded MI04 plan, not automatic implementation or scene migration. Original roadmap order remains unchanged.

MI03 owner checkpoint (2026-11-18): owner reported “looks good”; lab checkpoint accepted for continuation. No additional specific native/song/hardware evidence was supplied. Next is a bounded MI04 plan with separate implementation approval; no production or scene migration authorized.

MI04 proposal (2026-11-20): resumed planning after pause. [MI04_PLAN.md](reports/music-intelligence/MI04_PLAN.md) proposes development-only intensity, brightness and onset activity with explicit defaults/criteria and 324 native context rows. Await scope/criteria approval before implementation; MI03/fixed energy/production/landscapes remain unchanged. G1 still precedes the Crimson pilot.

MI04 implementation (2026-11-20): owner approved the plan with “proceed.” [MI04_RESULTS.md](reports/music-intelligence/MI04_RESULTS.md) records intensity/brightness checks passing and 30 activity cadence comparisons failing, with complete repeated synthetic evidence and passing integration. Preserve the failed gate; review the separately proposed onset-window follow-up before changes. Original MI03 core/stress pass; production/landscapes remain unchanged. G1 and Crimson remain pending.

MI04 approved onset-window follow-up (2026-11-20): owner approved 40 ms observation. [MI04_WINDOW_RESULTS.md](reports/music-intelligence/MI04_WINDOW_RESULTS.md) records unchanged synthetic MI03/MI04 criteria passing, added emission delay inside 150 ms, all expanded labels matched and remaining diagnostic weak-mixture misses. Await owner review; next is a bounded G1 plan. No production/default/scene migration authorized; original roadmap order unchanged.

G1 proposal (2026-11-20): [G1_PLAN.md](reports/release/G1_PLAN.md) proposes same-input legacy/candidate review indicators and a local song control in the DEV lab, reusing existing adapters with live-file/tab export locks. Await preparation-scope approval; the original six owner-review rows remain pending. No DSP tuning, G1 acceptance or MI05/scene implementation authorized.

G1 preparation implemented (2026-11-20): owner approved the plan. [G1_REVIEW.md](reports/release/G1_REVIEW.md) records a tested comparison interface/local-file path, unchanged MI03/MI04 quality and six manual review rows pending. Await owner song/native-source review; do not treat automation as G1 acceptance or start MI05/scene changes automatically.

G1 partial owner verdict (2026-11-21): owner confirms aligned markers and a much better response than legacy. Timing accepted for reviewed material; generated drone/silence subchecks also pass. G1_REVIEW.md retains other judgments as pending; no full gate/MI05 authorization inferred.

G1 attack-strength confirmation (2026-11-21): owner confirms softer hits give lower strengths than stronger hits. Timing/strength row passes for reviewed material; remaining G1 rows stay pending in G1_REVIEW.md. No DSP or scene change authorized.

G1 band-isolation confirmation (2026-11-21): owner confirms generated Mid/High controls trigger only their intended event bands. Isolation row passes; bass-energy contrast, quiet music and equivalent-source/native-output review remain pending. No full G1/MI05 approval inferred.

G1 bass-contrast confirmation (2026-11-21): owner reports the generated bass amplitude sweep passed. Bass-contrast control row passes; quiet-music and equivalent-source/native-output judgments remain pending in G1_REVIEW.md. No full G1/MI05 authorization inferred.

G1 quiet-music confirmation (2026-11-21): owner reports restrained intensity/activity on quiet ambient music. Quiet/silence row passes for reviewed conditions; equivalent local/tab/native-output row remains pending in G1_REVIEW.md. No full gate/MI05 approval inferred.

G1 completed (2026-11-21): owner reports the final directed local/tab/native-output check passed. All six rows in G1_REVIEW.md now pass for their reviewed material/controls; known limitations and unspecified metadata remain explicit. Proceed to a bounded MI05 stable-contract/Crimson pilot proposal. Implementation, production defaults and other scene migrations still need separate approval.

MI05 proposal (2026-11-21): [MI05_PLAN.md](reports/music-intelligence/MI05_PLAN.md) proposes a shared typed reader from validated features and a DEV-only single-Canvas Crimson Legacy/Candidate pilot, with bounded first-pass mappings and explicit visual/lifecycle/performance criteria. Await plan approval before implementation. Public defaults remain Legacy; vertex and other-scene passes remain separately gated.

MI05 owner steering (2026-11-21): requested stronger sun expansion. Candidate proposal now caps sun/glow scale at 15%/20%, preserving proportional strengths and Legacy's existing 8%/12%. Revised plan remains awaiting implementation approval.

MI05 revised owner caps (2026-11-21): owner specifies 50% sun expansion and restoration of original 12% glow expansion, superseding the intermediate candidate caps. MI05_PLAN.md reflects 1.5× maximum sun scale and proportional weaker responses. Overall plan implementation remains pending approval.

MI05 implementation approved (2026-11-21): owner says “lets move” after the revised 50%/12% proposal. Stable reader, DEV-only Crimson A/B and first-pass bounded mappings are implemented; actual checks/limits in MI05_RESULTS.md and PROGRESS.md. Preserve the discovered uncommitted 40% Legacy sun cap rather than reverting it to the proposal's historical 8%. Public remains Legacy; owner review and required evidence gate progression. No vertex/other-world/MI06 authorization inferred.

MI05 owner acceptance/public application (2026-11-21): owner reports “passed, implement candidate.” Public Crimson now consumes Candidate from the shared validated DSP producer on the existing audio pipeline. Tests and generated built-production browser checks pass; see MI05_RESULTS.md/PROGRESS.md. Developer comparison remains. Other worlds, vertex refinement and later milestones remain separately gated; no commit/deployment implied.

Crimson vertex pass approved (2026-11-21): owner says “go ahead” after the bounded shader proposal. Implemented ≤0.08-unit bank deformation with logical continuity, normal correction and padded bounds; evidence/current gate in MI05_VERTEX.md and PROGRESS.md. Owner visual/musical review remains separate. No next-world/transition milestone or deployment follows automatically.

Crimson vertex verification (2026-11-21): all 24 test files and generated GPU/public regressions pass; twelve controlled paired render-cost trials stay within 10% (worst +2.36%). MI05_VERTEX.md retains bounds/normal/seam/stream/screenshot/timing evidence and limitations. Stop for owner visual/musical review; no next task automatically approved.

Vertex visibility correction approved (2026-11-21): owner reports barely visible movement and approves the concrete0.32 maximum/0.7 scene-drive curve with “yes.” Implement the terrain-only adjustment, expand bounds and verify before owner review. Initial0.08 evidence stays historical; other-scene/transition scope remains unapproved.

Stronger vertex visibility verified (2026-11-21): approved0.32 cap/0.7 visual drive implemented;24 test files and generated GPU/public input checks pass. Six paired render-cost comparisons pass the10% criterion (worst~0.60%); bounds/normals/protected masks/stream and culling checks retained in MI05_VERTEX.md/current evidence. Await owner artistic/music review; no automatic next task.

Owner replaces vertex pass (2026-11-21): explicit request restores authored terrain and adds independent low-mid gradual contours/high-mid short streaks. Implemented and verified; CRIMSON_CONTOURS.md/PROGRESS.md supersede active vertex settings. Audio engine and other-world scope unchanged. Stop for owner artistic/music review; no next milestone automatically approved.

VM02 visual refinement (2026-11-21): owner accepts geometry but requests clearer resting/low-mid/high-mid distinction, selected soft contours and visible travelling head/trail. Implemented within VM02; stationary generated PCM cases, weak/strong pixel measurements, normal production regressions and a21.1 s generated-only recording retained in VM02_REVIEW.md. Status remains **IMPLEMENTED — AWAITING REVIEW**. Do not proceed to VM03.

Owner-requested sun-halo adjustment (2026-11-21): map existing slow activity to Candidate halo emission while preserving the sun body/size, bass pulse, geometry/camera and VM02 contours. This specific request is authorized independently of the broader sun/valley milestones; do not infer VM01 completion or start VM03. Actual results/checkpoint in PROGRESS.md; prior VM02 evidence remains scoped to its recorded build.

Crimson VM03 (2026-11-21): owner-authorized valley floor implemented, awaiting owner review. CRIMSON_VISUAL_MAPPING_ROADMAP.md is source of truth; VM02 approved with stationary evidence reconciled. VM03_REVIEW.md retains checks/recording. Next VM01 only after owner review; “Continue Crimson” resumes this workflow.

VM01 (2026-11-21): owner “proceed” approves VM03 and authorizes sun/corona refinement. Implemented, awaiting owner review; see VM01_REVIEW.md and authoritative CRIMSON_VISUAL_MAPPING_ROADMAP.md. Next VM04 only after review/continuation.

VM01 compromise (2026-11-21): owner approves15% sustained plus5% transient body expansion with slightly softened corona. Implemented and verified; remains IMPLEMENTED — AWAITING OWNER REVIEW, no VM04 progression.

VM04 (2026-11-21): owner “looks good” approves VM01 compromise; “continue crimson” authorizes high-frequency atmosphere. Implemented and verified, awaiting owner review in VM04_REVIEW.md. Authoritative visual roadmap updated; no VM05 until review/continuation.

Owner-directed Crimson range refinement (2026-11-21): make sun brightness/travel maximums easier to reach via scene-only .35 energy saturation. Implemented and verified, awaiting owner review; see CRIMSON_RESPONSE_RANGE.md. VM04 remains pending; no VM05 authorization.

VM04 visibility refinement (2026-11-21): owner “make them stand out more” authorizes clearer upper accents. Implemented with brighter/wider glints/specks, longer upper-only fade and reduced speck density. Await owner review; accepted brightness/travel range preserved. No VM05 progression.

VM05 (2026-11-22): owner “no, lets move” approves VM04 and authorizes atmospheric intelligence. Implemented, awaiting owner review in VM05_REVIEW.md and authoritative visual roadmap. Multi-second slow-context depth/horizon mapping only; no VM06 progression until owner review/continuation.

VM06 (2026-11-22): owner “lets go” approves VM05 and authorizes final integration review. Generated production checks/60s soak and code checks pass; VM06 IMPLEMENTED — AWAITING OWNER REVIEW. VM06_REVIEW.md lists pending combined full-song/native/device rows. Final release gate remains open; no production changes or deployment in this phase.

Visual Polish (2026-11-22): owner declares VM roadmap complete; CRIMSON_VISUAL_POLISH_ROADMAP.md is now source of truth for remaining Crimson implementation. VP00 inventory and matched generated moving/fixed screenshot baseline implemented, awaiting owner review. VP01 ground-wave readability next only after approval. “Continue Crimson polish” resumes the next eligible milestone without a new master prompt. Rejected canvas-video exports are not accepted evidence; see VP00_BASELINE.md.

VP01 (2026-11-22): owner “lets move” approves VP00. Existing ground front refined, verified and IMPLEMENTED — AWAITING OWNER REVIEW in VP01_REVIEW.md. Next VP02 only after review/“Continue Crimson polish”; no new graphical/audio systems.

VP01 responsiveness exception (2026-11-22): owner explicitly approves combined sun expansion, modest low-event ground response and faster travel up to24units/s. Implemented and verified; CRIMSON_RESPONSIVENESS.md supplements VP01_REVIEW.md. VP01 remains awaiting owner review; no VP02 advancement.

VP01 approved (2026-11-22): owner “aproved” accepts combined ground/sun/travel tuning. Authoritative Polish Roadmap updated. VP02 remains NOT STARTED and is next eligible on “Continue Crimson polish.” No implementation/commit/deploy in approval checkpoint.

VP02 (2026-11-22): owner “continue crinmson polish” authorizes next milestone. High-mid head readability refined; low-mid/resting contours preserved. IMPLEMENTED — AWAITING OWNER REVIEW in VP02_REVIEW.md. Next VP03 only after owner continuation; approved VP01 sun/ground/travel unchanged.

VP02 approved (2026-11-22): owner “its aproved” accepts mountain streak readability. Polish Roadmap updated; VP03 depth and restrained atmosphere is next eligible on “Continue Crimson polish,” not started in this checkpoint.

VP03 (2026-11-22): owner “continue crimson polish” authorizes depth/material polish after approved VP02. Implemented and verified, awaiting owner review in VP03_REVIEW.md. Current material-only changes preserve approved responses/camera/MI. Next VP04 only after owner continuation.

Stopped (2026-11-22): owner “looks good, lets stop for now” approves VP03 and requests stopping. VP04/VP05 NOT STARTED. Resume next eligible VP04 only on “Continue Crimson polish”; accepted checkpoints/evidence in Polish Roadmap and PROGRESS.md. No commit/deployment authorized.

VP04 (2026-11-22): owner “continue” resumes balance review after approved VP03. Tests/generated production-analysis comparisons support preserving accepted tuning; no production changes. IMPLEMENTED — AWAITING OWNER REVIEW in VP04_REVIEW.md. Next VP05 final review only after owner continuation.

Constant walking override (2026-11-22): owner requests fixed speed at all times. Implemented24-unit normal-motion travel through silence/pause/zero gain/stale/disconnected input, retaining reduced/loading guards. CRIMSON_CONSTANT_TRAVEL.md and authoritative Polish Roadmap document superseded musical speed rules. Current VP04/follow-up awaits review; no VP05 progression.

VP05 (2026-11-22): owner “lets do it” accepts VP04/constant walking and authorizes final review. Automated checks, reconstructed A/B and bounded terrain GPU cleanup repair complete. IMPLEMENTED — AWAITING OWNER REVIEW in VP05_REVIEW.md. Final musical/native/device acceptance remains open; no next milestone or release approval inferred.

Crimson polish closure (2026-11-22): owner “aproved” accepts VP05. All VP00–VP05 milestones APPROVED; before/after evidence retained. No further Crimson milestone. Stop unless specific new work/bug is requested. Unverified native/device checks remain documented; no commit/deployment authorized.

Crimson requested follow-up (2026-11-22): owner approved bounded background star visibility adjustment. Existing sky emission/size coefficients updated; Standard/Low resting/active screenshots and lint/build pass. IMPLEMENTED — AWAITING OWNER REVIEW. Original polish milestones remain APPROVED; no new phase or further tuning authorized. See current PROGRESS.md checkpoint.

2026-11-22 — Owner “looks better now” approves the star visibility follow-up and requests documentation organization. Organization proposal under review; preserve all existing docs/evidence and repair references when moving files.

Documentation organization (2026-11-22): owner “yes” approves the proposed structure. Completed topic-based report/evidence moves, progress history extraction, index and reference updates. Core guides/roadmap paths retained; no application changes or new development phase.

## Noctune 2.0 — NT01–NT15

The owner supplied the [master roadmap](NOCTUNE_MASTER_ROADMAP.md), [visual mapping](NOCTUNE_VISUAL_MAPPING.md) and [migration tracker](MUSIC_INTELLIGENCE_MIGRATION.md). NT01 audit/design is approved with “Please implement the plan”; NT02 and owner-authorized NT03 are implemented; NT04 migration baseline is approved by owner “proceed”; Owner-authorized NT05–NT08 magenta/midrange/bridge/violet choreography is implemented; owner continuation authorized NT09 after the lighting report; unperformed music/device checks remain pending. Later phases follow sequentially with their required gates. Preserve the visually approved left cyan fixture and other landscapes. Actual status is in PROGRESS.md.


Noctune NT07 checkpoint (2026-11-22): finite bridge travel implemented and technically verified; [review/evidence](reports/nocturne/NT07_BRIDGE_REVIEW.md). Existing two diffusers are segmented inside their original footprints; qualified MI low events trigger bounded travel without stacking. Owner grouped lighting/music/device acceptance remains pending. NT08 is next after owner continuation; no automatic next-phase approval.


Noctune NT08 checkpoint (2026-11-22): localized violet treble response implemented and technically verified; [review/evidence](reports/nocturne/NT08_VIOLET_REVIEW.md). Existing geometry/colors are preserved in two side banks with restrained presence/air sustain and alternating finite high-event accents. Stop at the grouped NT05–NT08 owner lighting/music/device review gate. NT09 is not started.


Noctune NT09 checkpoint (2026-11-22): existing wet-pavement reflection and local material response verified; [report/evidence](reports/nocturne/NT09_SURFACE_REVIEW.md). No production modifications needed. NT10 slow atmosphere is next after owner review/continuation; no new environment phase is automatically authorized.


Noctune NT10 checkpoint (2026-11-22): owner continuation authorizes slow atmosphere; [implementation/evidence](reports/nocturne/NT10_ATMOSPHERE_REVIEW.md) uses existing MI context with multi-second bounded glow/depth/tint. Fixtures, materials, camera and Manual appearance remain intact. NT11 whole-scene coordination is next after owner review/continuation; no automatic next-phase approval.


Noctune NT11 checkpoint (2026-11-22): owner continuation authorizes staged whole-scene review; [assessment/evidence](reports/nocturne/NT11_COORDINATION_REVIEW.md). Existing mappings retained; no production edits. Technical checks passed, but NT11 explicitly requires owner artistic approval. Stop for that review before NT12; native/music/device and grouped environment acceptance remain pending.


Noctune NT12 checkpoint (2026-11-22): owner continuation after NT11 authorizes deterministic verification; [matrix/evidence](reports/nocturne/NT12_MATRIX_REVIEW.md).54 contract cases,36 MI spectral configurations and28 actual browser PCM/control criteria pass; all90 production source files unchanged. NT13 live owner-authorized real-music review is next after continuation. Do not infer musical/device/native approval from synthetic checks.


Noctune NT13 checkpoint (2026-11-22): live review prepared after owner continuation; [worksheet/pending ledger](reports/nocturne/NT13_LIVE_REVIEW.md). Await owner source/cases, live text observations and musical approval. No production changes or captured-media inspection/recording. NT13 remains open; NT14 is not authorized by preparation alone.


NT13 spill correction (2026-11-22): owner “do the lift” approves the matched proposal. [Applied/verified](reports/nocturne/NT13_SPILL_IMPLEMENTATION.md): only three Audio point gains change; emitters, approved cyan, Manual and all controllers remain intact. Rebuilt review app5183 is ready after refresh/re-share. Owner live re-review/final musical approval remains pending; NT14 unstarted.

NT13 refinement checkpoint (2026-11-22): owner requested [R0–R5 one phase at a time](NOCTUNE_NT13_REFINEMENT_ROADMAP.md) and approved R0. [Audit and generated visual evidence](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r0--ground-truth-checkpoint-2026-11-22) are ready; no production change. Generated captures plus live owner text review explicitly replace recorded owner-song evidence. R0 owner review pending, R1 not started; NT14 remains paused and NT13 is not artistically approved.

NT13-R1 checkpoint (2026-11-22): owner “proceed” after R0 authorizes brightness calibration only. [Implemented candidate/evidence](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r1--brightness-calibration-checkpoint-2026-11-22) adds constant cool minimum fill and an Audio final-level soft curve. Generated checks pass; real-song calibration and visual exit gate remain owner pending. Stop before R2; NT14 remains paused.

NT13-R2 checkpoint (2026-11-22): owner “proceed” after R1 authorizes spatial choreography only. [Implemented/evidence](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r2--spatial-choreography-checkpoint-2026-11-22): bounded bass echoes, qualified-mid window/detail depth sequences and high-onset bridge. Generated direction/delivery/lifecycle checks pass; owner perception, prior real-song/brightness gates and Low Manual-on reference discrepancy remain pending. Stop before R3; NT14 paused.

NT13-R3 checkpoint (2026-11-22): owner positive R2 visual feedback and “lets keep going” authorize environment participation. [Implemented/evidence](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r3--environment-participation-checkpoint-2026-11-22): sparse existing bridge-rib accents, source-coherent wet highlights, slow depth point/haze lift. Generated checks pass; one added unshadowed point, no geometry/camera/MI changes. Stop for R3 review before R4; final real-song/device gates remain open and NT14 paused.

NT13-R4 checkpoint (2026-11-23): owner “lets move”/“continue” authorizes integration verification. [Evidence/target measurements](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r4--integration-and-target-machine-checkpoint-2026-11-23):91 production sources unchanged,39 spectrum windows across3 modes, actual UI/background/disconnect checks and owner-native minimize/Escape pass. Selected GTX1660 SUPER measured60FPS in both qualities, p95 frame17ms; forced CDP-freeze automation remains explicitly unverified. Stop for R4 checkpoint before R5; final musical parity and NT14 remain open.

NT13-R5 checkpoint (2026-11-23): owner “proceed” authorizes final comparison preparation. [Fresh aligned evidence / five-criterion owner gate](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r5--aligned-comparison-and-owner-gate-2026-11-23): Standard/Low Noctune/Crimson pairs, common generated source time0.5–54.5s, labeled camera difference, Manual references and timing table.91 production sources unchanged; technical checks pass. Final current-build real-song observations/artistic approval remain pending. Stop here; NT13 not closed and NT14 not started.

NT13/R5 approval (2026-11-23): owner explicitly answers **“Approve all five visual criteria”** and **“all worked”** for all listed current-build music cases. [Decision/evidence](reports/nocturne/NT13_LIVE_REVIEW.md#nt13-r5--aligned-comparison-and-owner-gate-2026-11-23). NT13 review gate complete; historical pending entries above are superseded. Next is NT14 after continuation; no commit/push authorized.

Owner scope update (2026-11-23): “we skip nt 14 and 15.” NT14 and NT15 are **skipped by owner**, not marked verified/completed. NT13/R5 approval and existing implementation/evidence stand. No next Noctune phase, new technical work or commit/push is authorized by this instruction.

Direct-controls UI request (2026-11-23, separate from skipped Noctune NT14/NT15): owner authorizes top-left landscape names, removal of Reactivity/fullscreen controls and always-visible landscape/Share a tab/Open audio file actions. Implemented with remaining settings under Options and full-default visual response.41 test files/typecheck/lint/build and generated-only desktop/responsive browser checks pass; current status/evidence in PROGRESS. Native sharing picker remains a human check, not a mocked success claim. Stop after this UI task; no commit/push authorized.

Direct-controls UI approval (2026-11-23): owner “looks good” approves the completed toolbar/name/control changes. UI task complete; no additional work or commit/push authorization inferred.
