# NT07 — finite bridge choreography

Implemented 2026-11-22 after owner “proceed” following NT06. Technical checks passed; owner musical/readability, comfort and device-performance acceptance remain pending. NT08 is not started. Earlier uncommitted NT03–NT06 work is preserved; no commit, push or deployment.

## Design and actual repository audit

NT06 had two bridge diffusers in one magentaBridge material batch, both receiving the old broad-low sustained response. The bridge point light already had its own channel; its position and full intensity40 were reusable. There were no individually addressable underside sections. NT07 therefore uses the roadmap's explicitly permitted minimal segmentation: contiguous thirds of each diffuser, with unchanged combined footprint, housings, height, depth and magenta color. No center-gap lamp, architecture replacement or camera movement.

Fresh existing MI low-onset events supply rhythmic travel. Neither bass energy nor overall intensity starts a free-running sequence. Six bounded material batches avoid shader changes; no new lights, dynamic shadows, dependencies or per-frame React state. The existing shared point follows average section brightness so the local heads remain distinct. The physical wet-floor pass continues reflecting the actual fixture materials. All non-bridge curves and atmosphere remain exact NT06 output.

## Mapping

Full parameters are canonical in [visual mapping](../../NOCTUNE_VISUAL_MAPPING.md).

- Qualify own-session, unconsumed `low` events with finite strength≥.04, emission age0–.25s and active feature age0–.25s. Start on the observing update; this is actual event arrival, without BPM or an invented clock.
- Section peak `.48 * clamp(strength/.35) * Reactivity`. Six starts spaced120ms, camera-left to camera-right across the two existing housings. Each has35ms eased rise, full through65ms, then quadratic tail to320ms. Total920ms; exact zero after expiration.
- One active sweep. Start cooldown1.04s; intervening attacks are consumed and dropped, without restarting, stacking or queuing. No sequence continues indefinitely on held energy.
- Actual material intensity=individual section×1.3. Bridge channel/reflection summary=mean section level; existing point=mean×40. The single point does not follow a separate bass sustain.
- Manual Magenta fills all six uniformly with original point mapping. Reduced motion suppresses travel entirely; other fixtures retain their existing reduced-motion illumination. Stale/inactive, zero gain, session change and Manual cancel travel. Suppressed events do not replay.

## Review evidence

All media is wholly generated test audio passed through the real unmodified local-file and Music Intelligence paths. Numeric probes exist only in an isolated temporary source copy. No captured/private media is inspected or retained.

| View | Demonstration | Screenshot |
| --- | --- | --- |
| NT06 baseline | [Before, same generated schedule](../../evidence/nocturne/nt07/before/generated-music-demo.mp4) | [Original bridge response](../../evidence/nocturne/nt07/before/isolated.jpg) |
| NT07 | [After: isolated, held, dense, mixed and silence](../../evidence/nocturne/nt07/after/generated-music-demo.mp4) | [Lit section](../../evidence/nocturne/nt07/after/isolated.jpg), [bridge off despite held bass](../../evidence/nocturne/nt07/after/held-bass.jpg), [silence](../../evidence/nocturne/nt07/after/silence.jpg) |
| Reduced motion | [Travel suppressed](../../evidence/nocturne/nt07/reduced/generated-music-demo.mp4) | [No sweep](../../evidence/nocturne/nt07/reduced/isolated.jpg) |

[Six successive cropped head positions](../../evidence/nocturne/nt07/after/travel-strip.jpg) show left-to-right travel, crossing the original center gap without illuminating it. Browser inspection confirms discrete localized emission rather than both old strips held on. Other fixture brightness differs across sampled attack phases; these demonstration stills are not exact same-time pixel-parity comparisons.

Fixed camera is asserted at(0,1.6,5). The18s fixture includes isolated110Hz attacks at1.2/2.7s, held110Hz4–7s, dense200ms attacks7–11s,1500Hz-only11–13s, weak110Hz13.2s, mixed14–16s, and final silence. Video screenshots are indexed against actual audio currentTime and muxed with the same generated WAV; effective capture cadence is roughly8–10Hz, not native video FPS or sample-accurate synchronization. Before134 samples/134 frames; after147/146; reduced153/153. No successful-run runtime errors.

## Measured feature-to-fixture delivery

[Comparison](../../evidence/nocturne/nt07/comparison.json), [after feature/material trace](../../evidence/nocturne/nt07/after/trace.json) and [before trace](../../evidence/nocturne/nt07/before/trace.json) retain raw values and events. Every sampled material equals its own section×1.3; bridge point equals channel mean×40. The approved cyan material/point still equal its own level×1.3/×30.

| Generated section | Bass energy peak | Section brightness peak | Bridge mean-level peak |
| --- | ---: | ---: | ---: |
| Isolated attacks | .2794 | .3339 | .0692 |
| Held bass, settled | .0978 | 0 | 0 |
| Dense attacks | .2795 | .3855 | .0940 |
| Mid-only, settled | ~0 | 0 | 0 |
| Weak attack | .0155 | .0970 | .0220 |
| Mixed | .3181 | .3317 | .0621 |
| Final silence | 0 | 0 | 0 |

Measured first-sweep head samples progress through sections0–5 at audio1.400,1.507,1.635,1.741,1.869,1.976s. Dense retriggers are at least1.04s apart. Weak attacks deliver a weaker head; higher sustained bass alone does not leave the bridge lit. All reduced-motion bridge values are0. Unit checks establish exact strength/gain proportionality and stable peak sampling at30/60/120Hz separately from this browser cadence.

## Preservation, cost and checks

Task-start source snapshot: `/tmp/echo-nt07-baseline-8m5Zso`, containing the actual dirty NT06 working tree, rather than HEAD. Production changes relative to that snapshot are only:

- `src/scenes/nocturne/bridge.ts`: finite controller and constants.
- `src/scenes/nocturne/visualState.ts`: single borrowed-frame update, six section outputs and final delivery.
- `src/scenes/nocturne/ArchitectureDetails.tsx`: contiguous diffuser subdivision/material groups.
- `src/scenes/nocturne/LightingDriver.tsx`: bind six materials and reuse existing bridge spill.

Tests: new `tests/nocturneBridge.test.mjs` and updated bridge expectation in `tests/nocturneVisualState.test.mjs`. Verification support: bridge generator, browser/Manual views, preservation and comparison scripts under `scripts/`; NT07 docs/evidence. Earlier files listed by git status belong to prior phases and are not claimed as NT07 edits.

Passed:

- All37 test files, lint, typecheck and build. Existing large-bundle warning remains (JS1,236.94kB, gzip344.33kB).
- Seven controller tests cover ordered finite travel, sustain/no false cycling, strength/gain,30/60/120Hz, dense drop policy, band/malformed guards, suppression/lifecycle/session/no replay, and actual adapter delivery.
- [4,200 matched frames](../../evidence/nocturne/nt07/state-parity.json): exact main/secondary magenta, cyan windows/details, approved cyan panel, violet, reflection summaries and atmosphere preservation.84 other source files byte-identical, including shared MI/audio/capture, other landscapes and NocturneScene.
- Actual six section matrices cover the two original diffuser footprints within Float32 rounding2e-7; approved cyan matrix/palette identical.
- Built-production desktop/wide/portrait at Standard/Low: six of eight matched Manual/idle/off captures are pixel-identical. Desktop-Low and Wide-Low each differ at just3 pixels, maximum RGB error3/255, from contiguous subdivision rasterization. No material/footprint change beyond the authorized subdivision. [Static captures](../../evidence/nocturne/nt07/manual/after/verification.json).
- [Paired whole-frame measurements](../../evidence/nocturne/nt07/after/whole-frame-cost.json):120 samples per version, Standard idle fixed camera. Draw calls190→194 (+2.1%); triangles25,510→25,534 (+24); geometries108→113; textures6→6. All7 point lights unchanged. Last-pass auto-reset counters83→82 were misleading for total cost: temporary `info.autoReset=false`, reset before each frame, measures both reflection and main passes as recommended by the [Three.js r186 documentation](https://github.com/mrdoob/three.js/blob/r186/docs/pages/WebGLRenderer.html). Production renderer settings are unchanged.

The small bounded draw increase is measured; no FPS/native GPU timing or owner-device performance gate is closed by headless counters. No progressive resource pool, new render pass, shadow or audio analysis cost is introduced.

## Pending owner review

Review normal-speed generated clips and permitted real music for subtle bridge readability, cooldown cadence and visual comfort with magenta/cyan. Confirm performance on the owner device. Native capture/picker/audibility and full-song musical acceptance were not verified. NT05–NT08 grouped lighting artistic approval remains open. Next task is NT08 treble/violet after owner continuation; no other phase implemented.

Suggested focused commit after explicit authorization: `Add finite onset-driven Nocturne bridge travel`.
