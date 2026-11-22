# Crimson vertex refinement — historical, reverted

Owner explicitly reverted all terrain deformation on2026-11-21. The implementation and dedicated deformation probes below were removed; retained results describe earlier builds only. Current authored terrain and independent mid-contour lighting are documented in CRIMSON_CONTOURS.md.

2026-11-21 · owner approved with “go ahead” after the bounded terrain-shader proposal. Implementation and automated checks complete; owner visual/musical review pending; no subsequent landscape or transition milestone implied.

## Implemented response

Candidate now deforms selected mountain banks in the existing vertex shader, with the owner-approved **0.32 world-unit vertical cap** (visibility adjustment after the initial0.08 version). The central corridor (|x|≤8), terrain at/above y=12, the first 8 units of camera depth and the distant skyline at/after depth 85 remain authored. Smooth fades select the intervening banks. Existing palette, terrain topology/worker, sun/glow response, pointer camera, forward journey and audio processing are preserved.

Sustained mid energy contributes50%, overall energy30% and proportional mid-onset response20% to a normalized visual drive. The approved scene-local exponent0.7 lifts moderate passages; target amplitude is `0.32 * pow(drive, 0.7) * Reactivity`. Apply Reactivity after the curve to retain linear gain; onset input is already gain-scaled, so its contribution is unscaled before building drive. A 140 ms rise /600 ms fall settles the amplitude. Two slow coherent waves (65%/35%) move the surface without sharp camera or geometric impulses. A bounded phase advances at 0.25–0.6 radians/s from slow intensity. Zero Reactivity and reduced motion clear deformation and freeze its phase; stale/paused/unavailable input freezes phase and releases amplitude to authored terrain. Legacy/no-reader stays undeformed. Existing Candidate feature/session handling remains unchanged.

`deformation.ts` supplies the field, scalar controller, chunk phase offsets and bounds padding. Each chunk stores bounded wave-origin phases computed from its logical index; the shader uses local coordinates plus those origins. Neither chunk edges nor 48-unit rendering-coordinate rebases restart the waves. The second wave uses an integer phase harmonic so the 2π phase wrap is continuous.

The shader computes the exact spatial displacement gradient, including corridor, height and camera-depth fades. Its inverse-transpose Jacobian corrects authored world normals. Chunks still translate only, as in the existing scene. Culling box/sphere are recomputed once from authored buffers and padded by0.32; repeated padding never accumulates. Frames update scalar uniforms only; no position/normal buffer uploads, geometry rebuild, new light, pass or dependency.

At task start, the pending workspace had a later sun cap edit (`0.2 + 0.1 * CandidateWeight`, with original 12% glow), superseding the older numbers in historical MI05 notes. That edit was preserved exactly. This task changes terrain only.

## Initial0.08 verification and evidence (historical)

Focused math/controller tests cover absolute bounds, masks, analytical gradient vs independent finite differences, unit normals/tangent orthogonality, chunk boundaries at negative/large indices, rendering rebases, phase wrapping, proportional energy, 30/60/120 Hz, zero/reduced/stale response, idempotent padded bounds and unchanged authored buffers. Existing tests retain accepted sun/camera/audio behavior.

The DEV generated-only harness checks actual GLSL via WebGL2 transform feedback (600 sample combinations), actual uploaded uniforms, unchanged position/normal attribute versions, padded bounds, four chunks/seven geometries/seven draw calls, profile/motion overrides and more than ten chunk lengths of travel. Generated off/on comparisons hold logical distance, sun, camera, lighting, phase and maximum amplitude constant. Standard/Low captures use 1440×810, 390×844 and 1920×810, plus pointer extremes. The harness has no file/tab input; its comparison overrides cannot affect production.

Initial focused run passed at `/tmp/echo-vertex-AwT7xw`: GPU max field error 5.77e-8, max normal error 1.11e-7, max unit-normal error 1.17e-7 and maximum sampled displacement 0.079242. GPU bounds tolerance is 0.080001; the analytical weighted-wave bound is 0.08. Eleven chunk lengths traversed without buffer updates or new resources. A fixture-only transform-feedback buffer-binding error was corrected; no production rendering threshold or shader formula was weakened.

Desktop/portrait/wide comparisons retain the accepted composition. The effect is intentionally small, even at the cap. Initial desktop comparison's upper sky crop (1440×200) and central foreground strip (12×300) were pixel-identical off/on; altered bank pixels confirm rendering changes. Owner still judges movement/musical feel on permitted music. No private playback inspected or retained.

## Initial0.08 generated results (historical)

All **24 test files**, lint, typecheck/build, script syntax and whitespace passed. Three r186 bounds documentation was consulted via Context7; Three0.186/R3F9.8.2 retained. Project phase skills were unavailable, so repository AGENTS/WORKFLOW was followed directly. Playwright unavailable; established Brave/CDP fallback used. Build is ~1,219.43 kB JS /338.99 kB gzip with the existing chunk-size warning. Full MI01–MI04 numerical matrices were not rerun for a shader-only change; no audio DSP changed.

[Final GPU/math/timing/stream evidence](../../evidence/crimson/vertex/mi05-vertex-verification.json): NVIDIA GeForce GTX1660 SUPER/ANGLE OpenGL ES3.2 on Linux x86_64, headless Chromium156. Same 600-sample errors/bounds as the initial run, no browser errors, eleven chunk lengths traveled (0.060→555.769), four chunks/seven geometries/seven draw calls and no frame buffer uploads. [Built-production regression](../../evidence/crimson/vertex/mi05-vertex-public-verification.json) passed actual generated-file Candidate response, mocked-tab/source lifecycle, all-four-landscape playback, seek/pause/resume, reduced/quality, cleanup, responsive bounds and continued DEV exclusion. No private input/native picker was inspected; audibility/native capture and real-device claims remain manual.

Three alternating paired 20 s samples per quality after 2 s warmup, at 1440×810 (Standard DPR1/Low0.75), fixed distance0/appearance, full0.08 amplitude and continuously advancing wave phase:

| Quality | Off p95, three trials (ms) | On p95, three trials (ms) | Worst positive paired increase |
|---|---|---|---|
| Standard | 17.0 /17.0 /17.5 | 17.0 /17.0 /16.9 | 0% |
| Low | 17.0 /17.0 /17.0 | 17.0 /16.9 /17.4 | 2.36% |

The ≤10% comparison criterion passes under this controlled fixture. These ~60 Hz scheduler-limited RAF measurements do not establish GPU headroom, native/windowed performance or maximum throughput. Historical measurements remain specific to their own builds. Owner artistic/musical review remains pending.

Retained comparisons: [desktop off](../../evidence/crimson/vertex/mi05-vertex-standard-desktop-off.png), [desktop on](../../evidence/crimson/vertex/mi05-vertex-standard-desktop-on.png), [portrait on](../../evidence/crimson/vertex/mi05-vertex-standard-portrait-on.png), [wide on](../../evidence/crimson/vertex/mi05-vertex-standard-wide-on.png), plus both qualities and pointer extremes in `docs/evidence/crimson/vertex/mi05-vertex-*.png`. Final desktop upper sky1440×200 and central foreground12×300 crops were pixel-identical off/on using local ImageMagick comparison; selected bank pixels differ. Desktop/portrait/wide and pointer framing inspected. [Production view](../../evidence/crimson/vertex/mi05-vertex-public-desktop.png) uses the normal generated audio response rather than maximum-amplitude fixture overrides.

## Review boundary

Use **Crimson Horizon in the main app**, play a permitted track and look for restrained bank movement during sustained mids/stronger passages, calm quiet sections and clean chunk crossings. Camera and sun behavior should feel unchanged. Developer Lab's Crimson Candidate preview also includes the vertex response; Legacy remains a comparison.

Stop here for owner visual/musical review. Do not increase the bound, migrate another landscape, implement transition work, commit, push or deploy without the applicable next authorization.

## Visibility feedback — adjustment approved

Owner reports “i can barely see it.” Current 0.08 maximum is only eight centimeters; with a representative weighted feature drive of0.1–0.3 the target is0.008–0.024 units before spatial fades. At the authored perspective/depth this often produces subpixel movement. No captured song was inspected; these are calculations from the current mapping, not measurements of the owner's input.

Propose a terrain-only visibility correction: maximum0.32 world units (4× current cap), with scene drive `pow(weightedDrive,0.7)` to give moderate passages useful movement while preserving zero and strictly increasing strength. Representative drive0.1/0.3/0.6/1 targets0.064/0.138/0.224/0.32 units before masks. Keep current mask boundaries, rise/release/phase timing, normals, waveform continuity, sun, camera and audio calculations unchanged. Expand bounds from the same new constant. Verify strict strength ordering, displacement/normal/culling/seam/cadence/lifecycle tests and matched generated screenshots/render-cost checks before owner review.

Owner approved this exact adjustment with “yes.” The0.32 cap and0.7 visual-drive curve are implemented, including culling padding from the shared cap. Existing uncommitted work is preserved. Current verification follows below; historical0.08 evidence remains unchanged.


## Stronger visibility pass — current verification

Owner approval: “yes” to0.32 cap/stronger moderate drive. Scope is terrain amplitude/response only; masks, phase/rise/release, normal field, sun/camera, audio engine and other landscapes unchanged. At drive0.1/0.3/0.6/1 (full Reactivity), targets are0.064/0.138/0.224/0.32 units before spatial fades. This is roughly4–8× the previous target over that range, with stronger input still producing larger movement and no fixed minimum displacement.

Passed: all24 test files, including explicit approved-curve values, monotonic strengths and linear half-gain output; lint/typecheck/build and whitespace. The finite-difference oracle now uses a smaller1e-5 step to retain the existing1e-6 gradient tolerance at the larger amplitude; no tolerance was relaxed. Build ~1,219.44 kB JS /339.00 kB gzip, existing chunk-size warning. Existing APIs/renderer/DSP unchanged; prior Context7 bounds guidance remains applicable without another lookup.

Built-production generated audio/source lifecycle regression passed at `/tmp/echo-candidate-sT0d2Q`; no private media or native permission prompt used. [Current GPU/stream/timing verification](../../evidence/crimson/vertex/mi05-vertex-visible-verification.json) passed:600 actual GLSL samples, max field error2.31e-7, max normal error1.14e-7 and sampled offset0.316967 below0.32. Four chunks/seven geometries/seven draw calls; eleven chunk lengths traversed without position/normal buffer updates or browser errors. Zero/reduced/stale/Legacy behavior remains correct.

NVIDIA GTX1660 SUPER/ANGLE headless, Linux/Chromium156,1440×810, Standard DPR1/Low0.75. Three alternating paired20 s samples/quality after2 s warmup, fixed pose/appearance at full0.32 amplitude with continuous phase:

| Quality | Off p95, three trials (ms) | On p95, three trials (ms) | Worst positive paired increase |
|---|---|---|---|
| Standard | 16.8 /16.9 /16.9 | 16.9 /17.0 /17.0 | 0.60% |
| Low | 17.0 /17.0 /17.0 | 16.9 /16.9 /16.9 | 0% |

The10% render-cost comparison target passes. As before, these scheduler-limited RAF intervals do not establish maximum throughput or native-device performance. Native permissions/audibility and new artistic/musical acceptance remain owner checks.

[Desktop off](../../evidence/crimson/vertex/mi05-vertex-visible-standard-desktop-off.png), [desktop on](../../evidence/crimson/vertex/mi05-vertex-visible-standard-desktop-on.png), [portrait on](../../evidence/crimson/vertex/mi05-vertex-visible-standard-portrait-on.png), [wide on](../../evidence/crimson/vertex/mi05-vertex-visible-standard-wide-on.png), both qualities and pointer extremes retained as `mi05-vertex-visible-*.png`. Static comparisons use identical pose/lighting/phase and the new maximum; selected-bank differences increase, while tested sky/central-floor crops remain pixel-identical. These maximum-amplitude comparisons demonstrate bounds/rendering, not the precise displacement of an owner's song. Owner should test the stronger natural response in main-app Crimson.

Existing0.08 evidence remains unchanged. No further scope, commit, push or deployment; stop for owner review.
