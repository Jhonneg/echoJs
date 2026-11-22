# Crimson — independent mid contour lighting

Current status: **VM02 — IMPLEMENTED — AWAITING REVIEW**. The owner requested refinement of the baseline described below. [VM02_REVIEW.md](VM02_REVIEW.md) records the current resting/low-mid/high-mid states, fading trail, stationary-camera tests and generated recording. Earlier measurements/settings below are historical.

2026-11-21 · owner explicitly requests reverting terrain deformation and replacing it with low-mid illumination/high-mid streaks, independent of bass. Implemented; owner artistic/musical review pending.

## Current behavior

Authored terrain positions and normals are restored. No vertex displacement, deformation amplitude/phase, Jacobian normal correction or expanded culling bounds remain. Removed only the superseded deformation module and dedicated probes/tests; its historical documentation/evidence is retained. Existing terrain generator/worker, perspective framing, forward journey, sun/glow, pointer camera and other landscapes are preserved, including pending owner edits.

Use the existing fixed six-band controls without changing audio processing or frequency boundaries:

| Input | Response |
|---|---|
| Low mids250–800 Hz | Gradual contour illumination: normalized visual target `sqrt(lowMids) * Reactivity`,320 ms rise/750 ms fall. Faint authored contour/fold baseline remains in silence. |
| High mids800–2500 Hz | Brief travelling highlights constrained to the existing contours, independent of low-mid illumination. Stronger rises produce stronger streaks; a held tone does not continually retrigger. |
| Bass/overall/broad events/treble | Do not drive the new contour controller. Existing sun, travel and atmosphere mappings remain as previously accepted. |

Candidate contour emission is added after atmospheric mixing, with no sun-activity/overall-intensity multiplier or context-dependent selection. At matched geometry/position, the controller is driven solely by the two mid bands. Atmosphere and journey still follow their existing overall controls; visual changes caused by travelling to a different location are not band leakage.

High-mid streaks use a small **scene-local lighting rise qualifier**, not the shared onset-event detector: compare high-mid energy with its own120 ms follower; require a0.025 rise/high>0.03, observe45 ms to collect peak, and rearm below0.008 rise with160 ms spacing. The strength is the positive own-band rise raised to0.7, with Reactivity applied linearly each frame. Existing MusicFeature onset events/thresholds are untouched and not used to trigger streaks. Sustained highs settle and cannot continuously flash; unrelated bass/low-mid events cannot launch a streak over held high mids.

A streak has a25 ms eased attack and expires after550 ms, with its head moving along a diagonal logical-coordinate field masked to authored primary/secondary contour lines. The shader adds localized warm pink/crimson emission, with no random positions, bloom, new geometry/light/pass or full-screen exposure. Bounded per-chunk origins keep the pattern continuous across edges and coordinate rebases. One active head is retained; no delayed-event queue or accumulated full-brightness flash.

Mount/profile/session resets prime current high energy and clear old streak state. Pause/stale/inactive/zero gain clear moving streaks; low illumination releases smoothly (zero Reactivity clears it). Reduced motion suppresses travelling streaks and uses at least1.5 s low-light response. Updating gain during a streak scales its current light immediately rather than retaining the old gain. Data stays outside React state.

## Verification

Passed: all24 test files, lint, typecheck/build, script syntax and whitespace. Replaced deformation-specific tests with meaningful contour isolation/gradual rise/strength/cadence/sustain/no-retrigger/reset/gain/reduced checks, plus logical seams and restored vertex shader/normals. A controller regression varies bass/overall/context/broad events/treble while holding the two mid bands fixed and requires identical contour outputs. Audio DSP and adapters were unchanged; full MI01–MI04 native matrices were not rerun.

[Generated renderer evidence](evidence/crimson-contours-verification.json): actual worker-produced positions/normals match `createTerrainChunk` exactly before/after streaming; actual material has no deformation code. Bass-only gives zero new contour drive, low mids gradually rise, high mids advance/expire and remain off under sustain. Zero/reduced/stale controls pass. At least11 chunk lengths traversed with four chunks/seven geometries/seven draw calls, unchanged attribute versions and no browser errors.

Standard/Low desktop1440×810, portrait390×844 and wide1920×810 captures retain isolated idle, low-mid illumination and two high-mid head positions. [Low mids](evidence/crimson-contours-standard-desktop-low-mids.png), [high-mid head A](evidence/crimson-contours-standard-desktop-high-mids-a.png), [head B](evidence/crimson-contours-standard-desktop-high-mids-b.png), [idle](evidence/crimson-contours-standard-desktop-off.png); all24 frames retained under `crimson-contours-*.png`. Desktop isolation frames were inspected; owner judges artistic quality/musical feel separately. Fixed visual controls in screenshots isolate the shader effect; temporal behavior is checked with natural generated band steps.

Render-cadence smoke:10 s/600 frames per quality at1440×810 on NVIDIA GTX1660 SUPER/ANGLE headless, Standard DPR1/Low0.75. p95 Standard16.8 ms/Low16.9 ms. These are bounded-resource/cadence observations, not a matched historical overhead comparison, native device performance gate or GPU-headroom claim. Earlier deformation benchmarks describe removed code and do not approve this new appearance.

[Built-production regression](evidence/crimson-contours-public-verification.json) passes generated WAV with bass/469/1500/8000 Hz components and explicitly mocked tab input, actual uniform uploads, player/context continuity across all four landscapes, pause/seek/resume, gain/motion/quality controls, disconnect/ended cleanup, responsive layout and continued DEV exclusion. No private playback or native picker was inspected; native audibility/capture remain separate owner evidence. Build~1,218.19 kB JS/338.41 kB gzip with the existing size warning. Context7 Three r186 GLSL varying examples consulted; existing renderer retained. Phase skills unavailable; AGENTS/WORKFLOW followed directly using the established Brave/CDP fallback.

## Owner review

Refresh the main app and select **Crimson Horizon**. With permitted music, check that low-mid passages gradually reveal contours, high-mid attacks send brief light along them, and bass hits alone do not trigger that lighting. Terrain stays authored; sun and camera retain accepted behavior. Refresh also gives existing DEV hot-reload sessions a fresh controller shape after removing deformation.

Stop here for review. No further landscape/milestone, commit, push or deployment authorized. Suggested focused commit after authorization: `Restore Crimson terrain and separate mid contour lighting`.
