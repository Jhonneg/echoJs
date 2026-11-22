# VP02 — Mountain streak readability

Status: APPROVED — owner “its aproved” (2026-11-22).

Owner “continue crinmson polish” resumes next eligible VP02 after approved VP01. This pass changes only contour response/shading. Approved sun/body/corona,24-unit journey, valley waves, high-frequency details, atmosphere, authored geometry, shared MI and source adapters remain intact.

## Before → after

- Low-mid sustained light remains320/750ms, linear with fixed lowMids×Reactivity, same burgundy/crimson colors and contour selection.
- High-mid qualifier/rearm remain unchanged: fixed highMids,45ms peak observation, scene-local own-rise threshold, no broad mid-event dependency or new detector.
- Scene visual strength changes from raw rise to1.15s/(s+.15): zero and full preserved, strict ordering, modest.1 rise→.46 drive. Gain remains applied afterwards; this is not MI normalization.
- Head lifetime950ms→1.25s, initial peak window120→180ms;35ms eased attack retained. Existing logical terrain phase and shared-edge continuity retained.
- Bright head core/halo weights3.8/1.1→5.2/1.6; width range.012–.045→.018–.06 phase units. Tail falls faster (.065→.04 phase decay), cuts off earlier (.22→.14), and is dimmer (core1.8→.95), distinguishing it from the head and sustained outline.

Selection and faint resting outlines are preserved. Each visible head lights only a finite portion of the selected ridge pattern; the spatial phase still repeats on the procedural terrain as before. No whole-mountain wireframe, new geometry, lights, postprocessing or per-frame allocations.

## Evidence

- [Fixed strong](evidence/vp02-stationary-strong.mp4), [fixed weak](evidence/vp02-stationary-weak.mp4), [moving strong](evidence/vp02-moving-strong.mp4)
- [Fixed head](evidence/vp02-stationary-strong-004.jpg), [moving head](evidence/vp02-moving-strong-008.jpg), [low mids](evidence/vp02-low-mids.jpg)
- [Same VP00 source replay](evidence/vp02-moving-fixture-9.jpg), [browser checks](evidence/vp02-verification.json), [production regression](evidence/vp02-public-verification.json), [preservation](evidence/vp02-preservation.json)

Clips are2s,1440×810, video-only:10Hz composited-browser frames encoded/duplicated to30fps with actual frame timing. They demonstrate head progression with a fixed camera and under approved forward travel, not native30fps capture or audio synchrony. Weak/strong inputs are.06/.22 fixed high-mid rises; moving fixture keeps energy.35 for the accepted sun/travel context but disables automatic low events. Stationary frames preserve camera[0,3.5,24]; actual phase/progress/strength/camera state are retained.

`verify-vp02.mjs` also checks low-mid sustain/high independence, bass isolation, no sustained high retrigger, zero gain/reduced/no replay, six quality/viewports, replay of unchanged VP00 generated PCM and short cadence. Passed31 test files, lint/typecheck/build, script syntax/whitespace and generated browser/production checks. Final runs /tmp/echo-vp02-cza0iD and /tmp/echo-candidate-wzbEyL. Weak/strong peak drives≈.329/.684; Standard/Low five-second samples300 frames each/p95≈16.8ms. No console errors. Inspected exported moving clip:2s,1440×810,video-only,30fps container from10Hz source captures. Source preservation limits this phase to contours.ts/material.ts among recorded production hashes. Existing Vite size warning remains (~1,226.95kB JS/341.29kB gzip). One initial browser run was interrupted(exit143) after captures/source replay; final retry saves a checkpoint before shorter cadence samples and completed successfully.

Existing unit tests cover stale/session/profile, cadence, gain, geometry/nondeforming shader and logical seam invariants. Exact old raw peak assertions now use the explicit approved scene curve; low-light checks remain unchanged. Current contour regression's fixed950ms wait is replaced with awaiting expiration, since unit checks enforce the new1.25s lifetime.

## Review limits

Owner should judge whether at least one head is readable at normal moving-camera playback speed, whether its shorter tail remains clear against low-mid light, and whether the sun stays dominant in mixed music. No private/captured input inspected; only generated fixtures used. Native sharing/audibility, real-song timing and hardware performance remain manual pending. Short headless cadence is scheduler timing, not GPU time or matched-overhead proof. VP00 recorded-canvas timing is not directly comparable. Full unchanged MI numerical matrix not rerun. Prior shader knowledge and established Brave/CDP/FFmpeg fallback reused; project phase skills/Playwright unavailable. Stop before VP03; no commit/push/deploy authorized.
