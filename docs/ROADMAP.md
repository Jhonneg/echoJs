# POC roadmap — one task at a time

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

N01 follow-up (2026-11-16): owner approved Crimson-style mouse camera with bounded lateral/vertical parallax, smooth return and reduced-motion centering. This supersedes the fixed-view requirement only for pointer interaction; no forward travel or later phase authorized.

## Music Intelligence — shared audio interpretation

See [ECHO_Music_Intelligence_Roadmap.md](ECHO_Music_Intelligence_Roadmap.md) for the owner-supplied application-wide roadmap. MI00 audit and owner-approved MI01 diagnostics/baseline are implemented with evidence in [MI01_BASELINE.md](MI01_BASELINE.md); actual review status is in PROGRESS. MI02 and later phases require separate bounded plans and approval. Preserve the legacy feature path and each landscape's accepted mappings until validated migration is authorized.

MI01 follow-up (2026-11-18): owner approved live tab capture in the separate development lab, reusing the existing adapter with transient diagnostics and synthetic-only exports. Implementation/automated evidence is ready; native sharing and owner review remain pending in PROGRESS. This does not authorize MI02 or change production audio/scene mappings.

MI02a (2026-11-18): owner approved lab-only band-energy calibration and fixed linear/soft-knee comparison with numeric tolerances. Evidence is in [MI02A_ENERGY.md](MI02A_ENERGY.md): linear meets this task's targets; soft knee misses loud-end contrast. Owner review pending; no production default, complete MI02 gate, MI03 or scene migration authorized. See PROGRESS for actual checks and remaining manual evidence.

MI02b (2026-11-18): owner approved the lab-only range/noise comparison. [MI02B_RANGE.md](MI02B_RANGE.md) records all safeguards passing but additional early control clipping and gain/history variation; fixed linear remains the recommendation. Owner review and full MI02 energy decision remain pending. No production gain/default/mapping change or MI03 implementation authorized.

MI02 lab checkpoint (2026-11-18): owner accepted MI02a and then MI02b (“it passed”). Retain fixed linear as preferred development candidate; experiment costs/failures remain documented. Next is a bounded MI03 plan with approved event criteria, not an automatic implementation or production migration. Detailed status/manual-evidence limits remain in PROGRESS.

## Animation refinement direction and MI03 proposal — 2026-11-18

Owner selected an expressive but controlled Crimson-first pilot, including bounded subtle terrain deformation and musical/playback transition refinement. [ANIMATION_REFINEMENT.md](ANIMATION_REFINEMENT.md) records the staged MI05/MI06 direction and preservation/performance bounds. This overrides the earlier tentative Nocturne pilot recommendation; other landscapes remain separate reviews. MI03/MI04 and the existing feature-quality gate still precede scene implementation.

The staged plan's first deliverable is ready: [MI03_PLAN.md](MI03_PLAN.md), a bounded lab-only onset-detector proposal and quantitative core/stress acceptance criteria. Criteria require owner approval before MI03 implementation under the Music Intelligence roadmap's measurement rules. This checkpoint contains documentation only; no scene migration, new detector, context implementation or full-roadmap authorization is inferred.

MI03 initial run (2026-11-18): owner approved the implementation criteria with “go ahead.” The lab detector is implemented; [MI03_RESULTS.md](MI03_RESULTS.md) records all labeled core attacks matched but 29 extra release-associated events, so the core gate is FAIL. Review/approve the proposed release-attribution correction before MI04 or any scene changes. The original roadmap's goals/order and frozen criteria remain unchanged.

MI03 focused correction (2026-11-18): owner approved release attribution. [MI03_CORRECTION.md](MI03_CORRECTION.md) records the unchanged synthetic core gate now passing (5,157 matches, zero extras), separate stress passing, and unequal-mixture misses retained as limits. Await owner review; next is a bounded MI04 plan, not automatic implementation or scene migration. Original roadmap order remains unchanged.

MI03 owner checkpoint (2026-11-18): owner reported “looks good”; lab checkpoint accepted for continuation. No additional specific native/song/hardware evidence was supplied. Next is a bounded MI04 plan with separate implementation approval; no production or scene migration authorized.

MI04 proposal (2026-11-20): resumed planning after pause. [MI04_PLAN.md](MI04_PLAN.md) proposes development-only intensity, brightness and onset activity with explicit defaults/criteria and 324 native context rows. Await scope/criteria approval before implementation; MI03/fixed energy/production/landscapes remain unchanged. G1 still precedes the Crimson pilot.

MI04 implementation (2026-11-20): owner approved the plan with “proceed.” [MI04_RESULTS.md](MI04_RESULTS.md) records intensity/brightness checks passing and 30 activity cadence comparisons failing, with complete repeated synthetic evidence and passing integration. Preserve the failed gate; review the separately proposed onset-window follow-up before changes. Original MI03 core/stress pass; production/landscapes remain unchanged. G1 and Crimson remain pending.

MI04 approved onset-window follow-up (2026-11-20): owner approved 40 ms observation. [MI04_WINDOW_RESULTS.md](MI04_WINDOW_RESULTS.md) records unchanged synthetic MI03/MI04 criteria passing, added emission delay inside 150 ms, all expanded labels matched and remaining diagnostic weak-mixture misses. Await owner review; next is a bounded G1 plan. No production/default/scene migration authorized; original roadmap order unchanged.
