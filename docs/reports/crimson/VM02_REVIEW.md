# VM02 — contour lighting refinement

**IMPLEMENTED — AWAITING REVIEW** · 2026-11-21

Owner accepts restored geometry and requests a clearer resting/low-mid/high-mid distinction, selected contours with soft falloff and a visible travelling head/trail independent of camera movement. This is VM02 refinement only. VM03 has not started.

## Current visual states

| State | Appearance |
|---|---|
| Resting/silence | Barely visible burgundy contour detail; dark surfaces and existing atmosphere remain. |
| Sustained low mids250–800 Hz | Selected primary contours brighten gradually into soft crimson, with a narrow soft halo. Most secondary contours remain dark. |
| High-mid transient800–2500 Hz | A noticeably brighter warm pink head travels along selected contours, followed by a short asymmetric crimson trail. Strong events are brighter than weak ones; low-mid energy is not required. |

Production changes are limited to `contours.ts` and the fragment portion of `material.ts`. Geometry, vertex transform/normals, Music Intelligence, sun/glow and camera/journey behavior remain unchanged. [Source-preservation hashes](../../evidence/crimson/vm02/vm02-verification.json) compare ten relevant files with starting checkpoint6cac427, including MI DSP, scene/sun/camera, journey and terrain/worker. No new dependency, backend, pass, actual light or geometry.

The original issue was inadequate contrast: the old resting lines were already fairly bright, and the old transient faded before much travel was visible. Resting emission is now much lower. Only authored primary contours with selection0.55–0.85 brighten; secondary activation is sparse and limited to12% weighting above0.88–0.99 selection. A derivative-scaled Gaussian halo softens illuminated edges without global bloom or a glowing wireframe. The moving head has a warmer near-white pink accent and a one-sided exponentially fading trail; its logical coordinates remain continuous at chunk edges/rebases.

Scene emissive controls now scale linearly with energy and Reactivity; the earlier sqrt/power shaping was removed from this visual controller. Existing320/750 ms low-light rise/fall remains. The streak has35 ms eased attack,120 ms initial hold and smooth release through950 ms, giving its movement time to register. The existing local high-mid rise qualifier, MI frequency boundaries and MI onset calculations are unchanged. Bass/overall/context/broad events do not drive contour lighting. Zero/stale/reset/reduced controls remain intact; reduced motion suppresses moving streaks and uses the existing slow low-light policy.

## Requested recording

[Watch the stationary-camera review MP4](../../evidence/crimson/vm02/vm02-stationary-review.mp4) — 21.1 seconds,1440×810,H.264,nominal30 fps,video only (~0.92 MB). Generated input/state labels explain each section. No private playback, capture picker, microphone, external window or native capture stream was opened/recorded.

| Generated source timeline | Section |
|---|---|
| 0–2.5 s | Resting/silence |
| 2.5–4.5 s | Quieter sustained low mids |
| 4.5–6.5 s | Stronger sustained low mids |
| 6.5–8.5 s | Smooth return to rest |
| 8.5 s | Weak high-mid transient |
| 10 s | Strong high-mid transient and fading trail |
| 12–14 s | Bass-only; contour response stays at rest |
| 15–21 s | Generated mixed musical fixture |

The fixture creates known PCM at110/469/1500 Hz and plays it through a fresh instance of the unchanged production analysis pipeline. It is a controlled musical fixture, not the owner's song. The fixture-only inspection hook pins its camera and terrain render pose to x0/y3.5/z24; production sun/camera code is unchanged. The recording copies only this generated WebGL surface into a labelled canvas, then uses MediaRecorder. Source playback is muted in the headless browser and the video has no audio track. VP9 WebM was converted with the installed FFmpeg to H.264 MP4; representative low-mid and strong-streak frames were inspected. Nominal recording fps is not proof of application/hardware frame rate.

## Verification and limits

Passed: all24 test files, lint, typecheck/build, script syntax and whitespace. Existing large-chunk warning remains (~1,219.61 kB JS/338.93 kB gzip). No MI numeric matrix rerun: MI algorithms and adapters are unchanged. [Generated stationary verification](../../evidence/crimson/vm02/vm02-verification.json), [existing contour regression](../../evidence/crimson/vm02/vm02-contour-regression.json) and [built-production regression](../../evidence/crimson/vm02/vm02-public-verification.json) are retained.

The stationary test covers silence, low-mid-only, high-mid-only weak/strong, bass-only and the mixed fixture. Camera position stays exactly0/3.5/24 in every case. Actual generated PCM produced weak/strong streak values0.169/0.548 (~3.25×). Bass-only produced no streak; low-mid-only increased contour light without a high-mid trigger. Existing sustained/no-retrigger, gain, reset/stale/reduced, source teardown/all-four-world continuity, responsive/quality and DEV exclusion checks pass. Position/normal buffers match the authored generator, with seven draw calls/seven geometries/four chunks and unchanged attribute versions. The recording fixture/MediaRecorder and stationary controls are excluded from production.

Measured positive linear-light luminance above the resting image, with the camera/position matched and visual controls isolated:

| Control energy | Low-mid illumination | High-mid head/trail |
|---|---:|---:|
| 0.1 | 23.86 | 2.41 |
| 0.3 | 71.16 | 6.42 |
| 0.6 | 140.76 | 11.62 |
| 1.0 | 227.38 | 17.12 |

These sums show increasing rendered brightness and distinguish weak/strong states; display color conversion/clipping means the final pixel ratios are not perfectly linear. At full energy, changed-pixel coverage is1.26% for sustained light and0.10% for the sampled transient head, rather than full-surface illumination. The upper sky region has zero changed pixels. At identical camera pose, two streak-head positions move the luminance centroid about293 pixels, demonstrating movement independent of camera travel. [Resting](../../evidence/crimson/vm02/vm02-resting.png), [low-mid strong](../../evidence/crimson/vm02/vm02-low-0.6.png), [weak head](../../evidence/crimson/vm02/vm02-high-0.1.png), [strong head](../../evidence/crimson/vm02/vm02-high-1.png), [head A](../../evidence/crimson/vm02/vm02-streak-head-a.png), [head B](../../evidence/crimson/vm02/vm02-streak-head-b.png) and Standard/Low desktop/portrait/wide screenshots are retained under `evidence/vm02-*.png`.

Generated renderer checks use the established NVIDIA/ANGLE headless Brave fallback; Playwright/project phase skills remain unavailable. Repository workflow followed directly. Context7's official MDN captureStream/MediaRecorder documentation was consulted for the generated-only recording. Full owner music/visual acceptance and native-device performance remain separate; automated results do not approve VM02.

Reproduce with `npm test`, lint/typecheck/build, `node scripts/verify-vm02.mjs`, `node scripts/verify-crimson-contours.mjs` and `node scripts/verify-crimson-candidate.mjs`. The VM02 runner retains a WebM in its temporary directory; the shared MP4 is an export of that generated recording. Production source, native permissions and private playback are outside this recording path.

Stop at **IMPLEMENTED — AWAITING REVIEW**. No VM03, commit, push or deployment. Suggested focused commit after authorization: `Refine VM02 contour contrast and travelling streak trails`.
