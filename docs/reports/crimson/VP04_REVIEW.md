# VP04 — Sun proportionality and cross-effect balance

Status: APPROVED — owner “lets do it” (2026-11-22). **Later owner follow-up:** [constant walking speed](CRIMSON_CONSTANT_TRAVEL.md) supersedes the travel behavior of the balance capture below; visual/audio balance settings are retained.

Owner “continue” resumes VP04 after the saved approved VP03 checkpoint. Start3306d66 (`implemented sun fix`), clean repository. This phase adds balance tests, a generated browser review and documentation. **No production tuning was needed:** comparisons support retaining the accepted sun,24-unit journey, ground, contour and depth settings. All84 tracked source/dependency files match the starting commit; same production bundle index-B0HXZNXv.js.

## Proportionality and timing

Controlled Candidate/gain1 comparisons hold energy and camera still, disable automatic events, and then add one low onset. Existing scene curves are measured, not changed:

| Measured energy / onset strength | Sustained body scale | Body scale during attack | Corona drive during attack |
| --- | --- | --- | --- |
|.03 |1.0129 |1.0205 |.1496 |
|.1 |1.0429 |1.0629 |.3749 |
|.3 |1.1286 |1.1646 |.6015 |

Quiet/strong inputs have intermediate states rather than a binary body response. Saturation above the approved scene thresholds remains intentional. Unit sweeps at30/60/120Hz verify ordering and finite expiry; a full-energy/full-onset case reaches the approved1.20 maximum without overshoot. Sustained bass holds only body state; one onset launches exactly one wave.

The sun's short accent peaks early. At≈1.3s the unit trajectory has sun pulse<.01 but an active ground wave still traveling. No artificial extra delay, beat detector, second analyser or event duplication is added. The existing world-space propagation supplies temporal separation.

## Mixed source and hierarchy

The unchanged VP00 generated21s PCM runs through production analysis: rest, quiet mixed attacks, busy attacks, sustained bass, repeated attacks, release. Quiet/busy section peak sun activity≈.146/.545 and peak body scale≈1.026/1.083. Sustained-bass late-window pulse stays below.05 (peak≈.0124) while body remains expanded. This is a generated diagnostic sequence, not a full-song listening review.

No sampled frame has sun/body/pulse/mid light/streak/presence/air/atmosphere simultaneously≥.95. Dynamic effect maxima remain distinct: contour light≈.132, streak≈.629, upper accents≈.116 and atmosphere density≈.526. Full sun/body is reached during strong bass sustain as intended. These values show independent bounded controls in this fixture, not a universal guarantee for every song.

Inspected mixed screenshots retain the dominant pink sun, secondary selected ridges/ground, and sparse tertiary details. The existing large disc and palette stay intact. No new exposure or brightness clamp is introduced merely to force an aesthetic change; owner decides whether flashes, clipped highlights and combined prominence feel controlled at normal playback speed. Numeric bounds alone do not approve appearance.

## Evidence

- [Quiet sustained](../../evidence/crimson/vp04/vp04-sustain-0.03.jpg), [strong sustained](../../evidence/crimson/vp04/vp04-sustain-0.3.jpg), [strong attack](../../evidence/crimson/vp04/vp04-attack-0.3.jpg)
- [One attack across sun and ground](../../evidence/crimson/vp04/vp04-one-event.mp4)
- [Quiet mixed](../../evidence/crimson/vp04/vp04-mixed-4.jpg), [busy mixed](../../evidence/crimson/vp04/vp04-mixed-9.jpg), [sustained bass](../../evidence/crimson/vp04/vp04-mixed-14.jpg)
- [Browser measurements](../../evidence/crimson/vp04/vp04-verification.json), [summary](../../evidence/crimson/vp04/vp04-summary.json), [production lifecycle](../../evidence/crimson/vp04/vp04-public-verification.json), [source preservation](../../evidence/crimson/vp04/vp04-preservation.json)

Clip is2s/1440×810/video-only:10Hz browser-composited screenshots encoded to30fps using actual sample durations (duplicated frames, not native30fps capture). Export inspected; full scene present. Six Standard/Low desktop/portrait/wide views captured. Actual camera, feature-derived controls and source timestamps are in browser evidence. No private/captured source or soundtrack was inspected; all input generated.

## Verification and remaining owner review

Passed32 test files, lint/typecheck/build, script syntax/whitespace, balance browser and production source/scene lifecycle regression. No console errors. Resource bounds remain≤7 draws/geometries, no production changes. Final runs /tmp/echo-vp04-z5Yl5x and /tmp/echo-candidate-TFHlTg. Existing bundle-size warning unchanged (~1,227.39kB JS/341.44kB gzip).

No new performance benchmark is required for test/documentation-only changes; prior VP03 five-second cadence≈16.9/17.0ms remains historical evidence for the identical production bundle, not a fresh hardware or matched-overhead result. Shared DSP unchanged; full MI numeric lab matrix not repeated. Existing shader/tool guidance reused; phase skills/Playwright unavailable, established Brave/CDP/FFmpeg fallback used.

Owner: compare soft versus loud bass, sustained versus new attacks, and mixed passages using permitted music. Does the sun stay primary while waves arrive naturally through the ground, with readable ridge heads and unobtrusive sky detail? Does quiet/dense contrast avoid constant maximum output or distracting flash? Real-song synchronization/aesthetics, native picker/audibility and normal-window device performance remain manual pending. Stop for owner review before VP05 final A/B/accessibility/release checks. No commit/push/deploy authorized.
