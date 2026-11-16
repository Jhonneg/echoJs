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
