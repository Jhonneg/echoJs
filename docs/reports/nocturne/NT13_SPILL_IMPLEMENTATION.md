# NT13 — approved Audio spill lift applied

Implemented2026-11-22 after owner **“do the lift”** approves the [matched proposal](NT13_SPILL_PROPOSAL.md). The change addresses the owner’s report that magenta follows bass but the Audio corridor feels dim compared with Manual. Live brightness re-review and remaining NT13 listening cases are still pending; NT14 is not started.

## Delivered change

Only `src/scenes/nocturne/visualState.ts` changes at runtime. A reusable `spill` record holds final normalized point-light delivery separately from emitter levels:

| Channel | Audio spill | Point full ceiling |
| --- | --- | ---: |
| Main magenta | `min(1,level*1.5)` |50 |
| Cyan windows | `min(1,level*2)` |65 |
| Small cyan details | `min(1,level*2)` |40 |
| Approved left cyan, violet, bridge and other channels | Original `level` | Original values |

Point intensity=`spill[channel]*full`. Manual uses the original level for every channel, bypassing the Audio lift. Zero stays0; each point remains capped at its original full intensity. Gain is proportional below the ceiling. Main magenta may reach its full spill ceiling earlier on strong peaks, while its emitter pulse is unchanged.

Fixture sustain/accent/final emitter levels, timing, event consumption, reduced-motion behavior, colors, approved cyan geometry/point, atmosphere, camera and materials are untouched. The existing wet reflection naturally renders the brighter associated wall/pavement influence. There is no new ambient/exposure gain, permanent light floor, global intensity input, shadow, light, render pass or DSP change. LightingDriver remains a binding/delivery component; interpretation stays in the unified visual state.

## Verification

[Preservation results](../../evidence/nocturne/nt13/spill-applied/preservation.json) compare the pre-lift snapshot `/tmp/echo-nt13-spill-baseline-pEAZdJ` against current source:

-4,200 matched frames at30/60/120 Hz preserve every channel envelope, reflection-source level, controller/history, bridge state and atmospheric value exactly.
-54 unified contract/lifecycle cases pass with the newly approved point-delivery expectations.209 matched frames exercise the main full-spill ceiling while its emitter level stays below1.
-89 other source files are byte-identical, including all audio/MI/capture, fixture controllers, LightingDriver, geometry/materials and other landscapes.
- Actual selected spill equals the approved capped gain; all other spill is unchanged. Manual stays linear and zero/reduced/stale/session/event rules remain intact.

All40 test files, lint, typecheck via build and production build pass. Existing large-bundle warning remains: JS1,239.75 kB/gzip345.11 kB. Tests updated are `nocturneVisualState.test.mjs` (delivery/cap/Manual/zero/reduced checks) and the cyan panel adapter fixture shape; panel coefficients/point×30 remain unchanged. The shared deterministic test helper now expects the approved gains.

## Browser and actual point delivery

[Applied generated-PCM demonstration](../../evidence/nocturne/nt13/spill-applied/current/generated-music-demo.mp4), [reduced demonstration](../../evidence/nocturne/nt13/spill-applied/reduced/generated-music-demo.mp4), [expected/observed results](../../evidence/nocturne/nt13/spill-applied/browser-results.json) and [normal per-render trace](../../evidence/nocturne/nt13/spill-applied/current/trace.json) retain input features, emitter levels, spill values and actual material/point properties.

The unchanged60 s generated matrix passes all28 PCM/control criteria in both motion settings. Normal3,595 per-render samples/479 captured frames; reduced3,599/480. Each actual point matches the independent capped-gain expectation and stays within original full intensity; each emitter remains level×1.3. The generated input includes bass/low-mid/high-mid/high isolation, isolated attacks, sustained energy, bass+held high mids, low-mid attacks near stationary high mids, dynamics and silence. Positive-input zero, Manual on/off at zero gain and pause-release controls pass in both modes. No successful-run runtime errors.

The approved left panel remains independent: high-mid energy controls its unchanged sustain and qualified accent; low-mid-only attacks near held high mids leave its accents0. Silence gives every fixture/spill0, with the existing slower atmospheric tail. Reduced motion suppresses sharp accents and bridge travel as before. These are generated-only measurements, not an inspection of owner music or owner artistic approval.

The built app on **http://127.0.0.1:5183/** loads without startup/network errors in an independent empty profile. [Updated production Manual image](../../evidence/nocturne/nt13/spill-applied/production/manual-all-on.png) is pixel-identical to the original NT13 startup Manual image (raw AE0). The owner must refresh the page and re-share the permitted tab to use the rebuilt version; owner playback has not been remotely inspected or captured.

Temporary verification helpers: `verify-nocturne-spill-preservation.mjs`, `verify-nocturne-spill-browser.mjs` and `compare-nocturne-spill-browser.mjs`. Historical pre-lift NT12/proposal manifests and linear-point checks retain their original meaning; use these NT13 preservation/browser checks for current delivery rather than overwriting old evidence.

## Cost and pending review

The production change adds one stable8-value record and bounded scalar work; no React frame-state updates or new GPU resources. Runtime resources remain114 geometries/6 tracked textures, with7 original points. A120-sample whole-frame run retains196 draws/25,534 triangles, unchanged from NT10, under [applied cost evidence](../../evidence/nocturne/nt13/spill-applied/current/whole-frame-cost.json); no device-FPS acceptance is inferred.

Owner next step: refresh the built app, return to Audio/Standard/100% Reactivity, re-share the permitted tab and repeat the same bass passage. Confirm whether corridor readability is improved while magenta attacks still feel right and the approved cyan stays independent. Then complete remaining NT13 cases and give the musicality decision. No additional fixture or global-lighting redesign is authorized; no agent commit/push/deploy.

Suggested focused commit after explicit authorization: `Lift Nocturne Audio wall and pavement spill`.
