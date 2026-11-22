# VP01 — Ground-wave readability

Status: APPROVED — owner “aproved” (2026-11-22). **Current follow-up:** [owner-approved combined responsiveness tuning](CRIMSON_RESPONSIVENESS.md). The initial shape-pass values/evidence below remain historical where superseded.

Owner “lets move” approves VP00 and authorizes VP01; later explicit “yes” expands this checkpoint to sun/travel responsiveness as documented above. Existing low-onset pool and terrain shader are refined; no new graphical system, geometry, detector, analyser or musical event is introduced. Authored terrain/occlusion, production camera, MI, source adapters, sun, contours, upper accents and atmosphere remain unchanged.

## Before → after

| Property | VP00 baseline | VP01 |
| --- | --- | --- |
| Origin ahead of logical camera at event |48 units |72 units |
| World travel speed |26 units/s |30 units/s |
| Expiration |3.5s |4.2s |
| Longitudinal head width |.65+1.4×strength |.85+2×strength |
| Tail length |2+4×strength |1.5+3×strength |
| Active footprint |Narrow.18-unit channel/.55 halo |Finite soft curved front spanning a selected part of the valley floor |
| Fade |Earlier loss of light approaching viewer |Slower strength-dependent release retains approaching head |
| Rest/sustained glow |Faint original channel |Identical resting/sustained channel |

The existing four-slot pool, once-only cursor, fresh-event guard and oldest replacement remain. Dense attacks can replace old waves before their full lifetime; no additional events are synthesized. Strength remains proportional in emission, extent, width and decay. Reactivity scales amplitude. Reduced motion/zero gain/stale/session/profile controls consume/clear events without replay; the faint resting channel remains. Low quality uses existing reduced drawing resolution without extra passes or particle systems.

The new curved footprint is calculated on the existing terrain fragment, masked to the valley floor. It does not create a detached plane or deform geometry. Sun remains the composition's primary light in mixed-input review; stationary event-isolation views deliberately have no sustained sun energy.

## Evidence

- [Moving strong event](../../evidence/crimson/vp01/vp01-moving-strong.mp4), [fixed strong](../../evidence/crimson/vp01/vp01-stationary-strong.mp4), [fixed weak](../../evidence/crimson/vp01/vp01-stationary-weak.mp4)
- [Moving front](../../evidence/crimson/vp01/vp01-moving-strong-016.jpg), [fixed weak](../../evidence/crimson/vp01/vp01-stationary-weak-012.jpg), [fixed strong](../../evidence/crimson/vp01/vp01-stationary-strong-012.jpg)
- [VP00 busy before](../../evidence/crimson/vp00/vp00-moving-9.png), [same source after](../../evidence/crimson/vp01/vp01-moving-fixture-9.jpg)
- [Browser evidence](../../evidence/crimson/vp01/vp01-verification.json), [production regression](../../evidence/crimson/vp01/vp01-public-verification.json)

Three short clips use browser-composited screenshots, not the VP00 canvas-readback path with missing scene elements. Captures target10Hz; frame timestamps determine concat durations and FFmpeg duplicates to30fps for compatibility. This is a low-temporal-resolution motion proof, not native30fps footage or an audio recording. Inspecting exported frames verifies that the full scene is present. Source is DEV-generated controls only; no private/captured content or native permissions are involved.

The matched VP00 generated21s PCM is also replayed through unchanged production analysis for requested1/4/9/14/17.3/20s screenshots at1440×810 Standard Candidate/gain1. Actual audio time/distance/pose are retained. As recorded in VP00, moving-camera positions vary with frame scheduling, so this comparison is not pixel-identical A/B. Fixed event-isolation clips demonstrate world-space progression and weak/strong contrast independently of camera motion.

## Checks and limits

Tests cover once-only low events, sustain/no retrigger, other-band isolation, strength ordering, logical seams/rebasing, pool/reset/gain/stale/reduced and new origin/speed/foreground/expiry bounds. Browser checks compare bright-pixel coverage above20% grayscale in the same600×300 ground ROI for weak/strong events, plus actual pool uploads, zero/stale/reduced and six quality/viewports. Whole-ROI mean initially diluted the small wave against dark ground; the final metric measures local bright coverage with an unchanged threshold, not overall exposure. Screenshots must still be judged visually.

Production regression covers generated file/mocked generated tab source cleanup, scene switching, reduced/quality and DEV exclusion. Passed30 test files, lint/typecheck/build and whitespace. Final browser run /tmp/echo-vp01-zYX0mo; production /tmp/echo-candidate-rJaM80. Above-threshold ground fractions were0.00134444 weak/0.00598889 strong (≈4.45×). Both quality cadence samples600 frames/p95≈16.9ms. No console errors. Exported clips verified1440×810,3s, video-only,30fps container with10Hz source frames. [Source preservation](../../evidence/crimson/vp01/vp01-preservation.json) confirms only terrain material/valley controller differ among the51 VP00 production hashes. Existing Vite warning remains (~1,226.78kB JS/341.22kB gzip). No full MI matrix rerun for ground-only tuning. Existing shader guidance and Brave/CDP/FFmpeg fallback reused; phase skills/Playwright unavailable.

Short Standard/Low cadence samples are headless scheduling, not measured GPU time. VP00 cadence included canvas recording; VP01 cadence excludes composited capture, so they are not a matched overhead comparison. Resource/pass bounds remain unchanged; real-device frame-time/no-regression and normal-window music judgment remain manual pending. No native picker/audibility claim. Owner reviews whether strong waves are clear but subordinate to the sun, quiet waves remain restrained, and the foreground stays dark between attacks. Stop before VP02.
