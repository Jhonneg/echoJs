# P05 — POC evaluation

Date: 2026-11-16. Status: automated evaluation, owner Code/Electron and owner-reported direct Brave measurements recorded; final manual playback/switching checks passed per owner; P05 approved by owner on 2026-11-16. G2 has not been approved. Later shared-tab halo timing/contrast feedback reopened perceptual acceptance; focused correction and passed owner native pulse retest are recorded below. No art assets or quality mode added.

## Measured performance

Production build served with `npm run preview` on localhost:4173. Each run excludes a 5-second warm-up, then measures at least 30 seconds of actual scene frame intervals. Average FPS is interval count divided by elapsed time; median/p95 use nearest-rank percentiles; long frames are retained. This is render-loop cadence, not GPU execution time. Changing source/settings/viewport or hiding the page invalidates the run. Test cases cover this protocol and its cancellation/cleanup behavior.

All runs: Reactivity 100%, reduced motion off. Automated and Code/Electron runs used device/render DPR 1; direct Brave used DPR 1.25. Ambient/file-ready baseline runs had no active AudioContext. Local playback runs used the generated 45-second WAV, actual analysis rate 96,000 Hz and FFT 4096. The WAV cycles 100/1000/8000 Hz and silence; it contains no recorded audio. The measurement window includes active and silent sections, while the media element remains playing.

| Evidence / scenario | Viewport | Frames / sample seconds | Average FPS | Median / p95 ms | Maximum interval ms |
|---|---|---|---|---|---|
| Automated software renderer, ambient | 1440×900 | 837 / 30.0020 | 27.90 | 35.70 / 37.70 | 41.70 |
| Automated software renderer, local file | 1440×900 | 814 / 30.0326 | 27.10 | 36.50 / 40.30 | 63.10 |
| Owner Code/Electron, ambient | 1026×579 | 2984 / 30.0022 | 99.46 | 10.10 / 12.80 | 24.60 |
| Owner Code/Electron, local file | 1026×579 | 2985 / 30.0017 | 99.49 | 10.00 / 13.00 | 22.10 |
| Owner-reported Brave, file selected / ready | 1496.8×755.2 | 3000 / 30.0000 | 100.00 | 10.10 / 12.40 | 18.30 |
| Owner-reported Brave, local file playing | 1496.8×755.2 | 3001 / 30.0078 | 100.01 | 10.10 / 12.60 | 19.10 |

Automated environment: Linux x86_64, HeadlessChrome 159.0.0.0, 12 reported logical cores, ANGLE/Vulkan SwiftShader Device (Subzero), software renderer. Host CPU observed through `lscpu`: AMD Ryzen 5 5600G. Run timestamps: 05:37:47.846 UTC (ambient), 05:39:00.925 UTC (local).

Owner environment: Arch Linux; owner supplied Ryzen 5600G and NVIDIA GTX 1660 SUPER. Result renderer: ANGLE NVIDIA GeForce GTX 1660 SUPER / OpenGL ES 3.2. The submitted user agent identifies **Code 1.144.1 / Electron 43.8.3 / Chrome 150.0.7871.250**, rather than Brave. Run timestamps: 05:37:34.903 UTC (ambient), 05:41:00.194 UTC (local). These results must not be relabeled as Brave or extrapolated to 1440×900. Prior manual audio reference was Brave 1.98.63.

Direct Brave repeat: owner supplied results in response to the request to open the page directly in Brave. User agent reports Linux / Chrome 156.0.0.0 (no Brave version exposed). Same owner CPU/GPU; viewport 1496.800048828125×755.2000122070312 CSS pixels, render/device DPR 1.25. First run, timestamp 05:43:53.853 UTC: source `local file / ready`, sample rate/FFT null; this is a file-ready baseline with no active analysis, not a fully disconnected source. Second run, 05:46:58.833 UTC: `local file / playing`, sample rate 96,000 Hz, FFT 4096. Viewport was unchanged between these runs. Fractional CSS dimensions and DPR are retained as reported rather than rounded to the reference screenshot size.

The owner hardware clears the 60 FPS guideline in both measured embedded and direct Brave viewports. Software automation is below both the 60 FPS aim and 30 FPS low-quality guideline, but does not establish a GPU hardware failure. No low-quality mode was tested or implemented. The environments differ in renderer, browser and pixel count and are not a controlled renderer comparison. Frame cadence near 100 FPS does not establish maximum GPU throughput or full-screen performance at other resolutions.

## Size and provenance

Performance measurements above used the pre-correction build snapshot: `index-JpkqR8PW.js` with `index-BEQOe1EW.css`. Exact disk bytes and Python gzip level 9 sizes:

| Artifact | Raw bytes | gzip bytes |
|---|---:|---:|
| Application JS, including rendering libraries | 1,157,123 | 314,453 |
| CSS | 2,557 | 1,009 |
| index.html | 525 | 329 |
| Permitted tone fixture HTML | 2,220 | 892 |
| Total build | 1,162,425 | 316,683 |

Compression settings differ from Vite's displayed estimate. Vite still reports its >500 KB minified chunk warning; no code splitting or warning suppression was introduced. No runtime images, textures, models, downloaded fonts or bundled audio are used. Bloom procedural source totals 14,326 bytes; generated geometry is runtime data rather than a downloaded asset. Scene art payload is below the 10 MB guideline, excluding audio, with the JS bundle accounted separately above.

Runtime/peer package license labels in installed package metadata: MIT for React 19.3.1, React DOM 19.3.1, Fiber 9.8.2, Three 0.186.0, @babel/runtime, @types/react, @types/react-reconciler, @types/webxr, base64-js, buffer, csstype, its-fine, react-use-measure, scheduler, suspend-react, use-sync-external-store and zustand; BSD-3-Clause for ieee754. This is a dependency inventory, not a redistribution audit. No repository LICENSE file was found; original project code's distribution terms remain unspecified. Reference-board art stays conceptual and is not a runtime asset. See `references/bloom/ASSET_REGISTER.md` for provenance.

## Functional, privacy and visual evidence

- Passed: tests, typecheck, lint and production build. Sampler tests verify warm-up exclusion, FPS/percentile calculations, retention of long frames, invalidation and restarting. Browser tests verify settings/resize/source invalidation, cancellation and simulated hidden-page invalidation.
- Production normal-render console: zero errors; existing Three.Clock deprecation from Fiber remains. Simulated WebGL unavailability in a separate page triggered the error-boundary fallback and preserved audio diagnostics. Intentional fault output is not classified as a normal-render regression.
- Source review found no app media recorder, media upload API, network transport, persistent storage or raw media logging. Observed production request metadata contained local static GETs and browser blob-range GETs for the generated fixture; no upload requests. No media request bodies or captured content inspected. Measurement stores only aggregate frame timing/environment in page memory.
- Existing capture/local lifecycle tests cover rejection, missing audio, native-ended events via mocks, late picker results, repeated teardown, local play rejection/error/replay and URL cleanup. Prior native tab/file manual passes are owner-reported; mocks do not prove native permissions or audible playback.
- P03a static and P03b animated composition were owner accepted; P04 was accepted as "passable" after bass/contrast tuning and 96 kHz request. Final screenshot inspected at 1440×900: `.playwright-mcp/bloom-p05-reference.png` (ignored local artifact). Existing responsive and reduced-motion checks passed. No new visual refinements were authorized for P05.
- Owner local performance results confirm actual 96 kHz processing in both Code/Electron and owner-reported direct Brave. Owner explicitly confirmed all requested final Brave checks worked correctly: audible playback, switching between shared tab and local file, no duplicate sound and no sharing left active after Disconnect. This is owner-reported manual evidence, separate from automated tests.

## Shared-tab halo correction after performance evaluation

Owner subsequently reported that halo motion felt unsynchronized with bass and quiet/loud contrast, specifically for shared-tab capture. Found a visual confound: midrange radial fragment drift expanded the apparent ring. It now slides fragments tangentially; halo/reflection scale depend only on bass. Removed the second scene bass smoothing stage (analysis 25/90 ms remains) and applied contrast exponent 1.5 to the bass transfer curve. No native capture graph, 96 kHz request or playback route changes.

Added generated 60 Hz pulses (four quiet / four loud) to the permitted HTML fixture, plus `npm run fixture -- --bass-pulses` WAV for local comparison. Automated tests passed: mid-only tone left root/reflection scale 1 and radial drift 0; loud pulse expansion exceeded quiet by >3× (observed maxima ~0.08677 versus ~0.00335). Measured generated-stream pulse peaks occurred ~119–156 ms after scheduling in software automation; this is not an audible/native tab latency measurement or proof of synchronization. Zero Reactivity, reduced-motion suppression, fixture stop/context cleanup and local pulse WAV playback passed. Tests/typecheck/lint/build passed.

Post-correction build `index-Dkthg51L.js`: JS 1,157,081 raw / 314,445 gzip-9 bytes; CSS 2,557 / 1,009; index 525 / 330; tone fixture HTML 3,649 / 1,300; total 1,163,812 / 317,084 bytes. Procedural Bloom source now 14,494 bytes; no new asset/dependency. Earlier performance rows retain their original build identity; they are not new performance measurements of this correction.

Owner confirmed "Timing and contrast look right" after the native shared-tab four-quiet/four-loud pulse test on 2026-11-16. This is a passed perceptual/manual check, separate from automation; it does not quantify capture latency or establish timing for every audio source. The mapping tracks bass energy and does not implement beat detection or compensation for unknown browser capture latency.

## Known limitations and workflow observations

- Reflection is an authored approximation; no planar-reflection render target. Bloom remains a POC composition with limited depth/detail. No new art, effects or models were added in evaluation.
- Canvas renders continuously, including reduced mode for slow glow. At very low frame cadence, the 0.05-second animation delta cap can slow phase/envelope progression. Frame measurement itself uses uncapped timestamps. Idle energy use and GPU execution time were not measured.
- Processing requests 96 kHz and falls back if unsupported. Resampling cannot add missing source detail; the higher rate is an owner preference, not a demonstrated fidelity improvement. Direct Brave frame cadence is measured above; no isolated CPU/GPU cost or energy comparison of sample rates was performed.
- Desktop Chromium behavior is the tested direction; browser-native picker and audible quality still require owner checks. No system-audio guarantee, streaming-provider support or microphone scope.
- Screenshots and synthetic checks found functional motion, but the owner initially found it almost static. Motion visibility needed owner feedback and bounded tuning. Generated tone success likewise did not settle perceived music response; bass envelope, dynamic contrast and requested sample-rate revisions followed.
- Fixed-port preview instructions address earlier stopped-server/dead-link handoffs. Project skills named by the handoff are still absent; repository docs carried the workflow.
- Numeric token use, spend and complete session effort telemetry were unavailable. No token-savings or development-time figure is claimed. Observed rework and manual feedback above are the available workflow evidence.

## Recommendation and remaining acceptance

The POC demonstrates a viable client-side audio/scene pipeline and responsive hardware rendering in the submitted Code/Electron and direct Brave viewports. Keep the accepted implementation; no lower-quality mode is needed to evaluate the submitted hardware results. The final owner playback/lifecycle confirmation is now recorded; P05 is owner approved and ready for a separate G2 go/no-go decision. Do not infer full-resolution performance, universal capture compatibility or polished production visual quality from current evidence.

Requested performance measurements and final direct Brave playback/lifecycle confirmation are recorded. The shared-tab halo timing/contrast concern passed owner pulse retest. Owner approved P05 implementation/evaluation on 2026-11-16. G2 is the owner's separate decision; no production framework changes, expanded scenes/features or publishing are authorized.

## Post-P05 approved audio feature refinement — 2026-11-16

Owner requested an audit against GLASS, then approved a bounded pipeline refinement. P05 approval and all performance rows above describe the previous pipeline; they are not re-measurements of this revision. Audit found built-in analyser smoothing already zero, but mids/treble each had 100/300 ms smoothing in both audio and scene, and bands used only their strongest FFT bin. In a 100 Hz post-FFT simulation, a 50 ms hit reached ~38% of steady mid/treble scene response and peaked ~190 ms after onset. GLASS public code uses adaptive normalization and discrete musical events; its WebGPU renderer could not start in automation, so no live visual A/B claim was made.

Implemented separate normalized level, fast, slow baseline and transient bands with independent envelopes/sensitivities, combined-energy slow atmosphere, and direct scene mappings. Preserved source adapters, graph, privacy, 96 kHz request, FFT sizes, camera/art and effect limits. No new dependencies or beat detection. ARCHITECTURE/MOTION define the current contract and parameters.

Unit/model checks passed for integrated energy, short pulses, held tones, repeated hits above a sustained floor, per-band sensitivity, quiet/loud order, timing consistency and stable reset. A 50 ms post-FFT pulse reaches >99% of its fast target with scene peaks 10–30 ms after onset in the 100 Hz model; this excludes FFT/capture/display latency.

Browser checks completed before the session interruption: generated 100 Hz input kept fast/slow ~0.249 while transient decayed to ~0, preserving slow glow. Initial halo expansion ~3.49% settled to ~1.0%; a new stronger attack produced ~10.82%. Generated local pulse WAV gave maximum quiet/loud expansion ~0.80% / 7.91% in software rendering. Zero Reactivity, reduced motion, stopped tracks, exact feature reset and 390×844 layout checks passed. Feature callback telemetry read ~27.5 Hz with render-age snapshot ~40.2 ms in SwiftShader; this is not native capture latency. Console had zero errors and the existing Clock warning.

Owner confirmed "Response and switching look right" after the requested native shared-tab/permitted-music/local-source review on 2026-11-16. This revision is accepted as a perceptual/functional result; it is not a numeric capture-latency measurement. Tests/typecheck/lint/build passed. Browser tools became unavailable after interruption; no additional browser execution is claimed after that point. No new FPS benchmark or updated hardware-performance guarantee is inferred from prior P05 results. G2 remains unapproved.


## Band-separation follow-up — 2026-11-16 (owner acceptance pending)

Approved implementation adds parallel bin-first positive spectral flux and separate bass size / mid fragment motion / localized treble emission. Existing adapters, energy features, atmosphere, rate/FFT settings, cutoffs and composition remain. Band isolation, accent comparison, ambient suppression and synthetic visual pulses are available below the scene. Native/shared-tab perceptual acceptance remains pending; G2 is unapproved.

Synthetic tests cover aggregation cancellation, attacks beneath sustained bins, L1/L2, steady/decaying signals, quiet/loud ordering, below-floor jitter, pitch-migration sensitivity, discontinuity priming, and 30/60/120 Hz cadence. Resolved ramp peaks were 0.3743/0.3514/0.3393 and response areas 0.08629/0.08326/0.08141 respectively. Scene tests cover comparison/max blending, isolation, synthetic decay, zero Reactivity and distinct fragment/highlight mappings. Typecheck, lint, build and all seven test files passed.

Headless installed Brave through local CDP (Playwright MCP unavailable) rendered scene/debug controls at 1440×900, exercised isolated pulses, played a generated local WAV with live diagnostics, verified pause flux decay/disconnect reset, and checked 390×844 overflow. Reduced-motion mid/treble pulses produced pixel-identical scene screenshots; non-default debug invalidated performance measurement. Console: zero errors, existing Three.Clock warning. Screenshots inspected in `/tmp`; no captured media inspected or saved. This is software evidence, not native sharing, audible quality, final aesthetics or hardware FPS. Build JS ~1,164 kB minified / 321 kB gzip with the existing chunk-size warning. Earlier P05 performance results apply only to their original build.


## M01 interface — 2026-11-16 (accepted)

Owner explicitly approved source/controls UI work while deferring chopped-motion refinement. Responsive source selection and status, local playback/volume, Disconnect and Reactivity now sit below Bloom; optional diagnostics/debug/performance are collapsed together. Capture and file adapters, signal processing and motion mappings were not changed by M01.

Typecheck, lint, build and all seven existing test files passed. Headless installed Brave via CDP (Playwright MCP unavailable) passed generated-file playback/pause/end/replay, volume, keyboard skip link/ranges, source teardown, Disconnect, tool disclosure and 390/320 px overflow checks. Picker pending/cancel/denial cases were simulated, not native permission checks. Invalid generated WAV error/recovery was checked; controls have 44 px minimum height and mobile branding no longer overlaps the halo. Screenshots inspected in `/tmp`. Console zero errors, existing Clock warning. JS ~1,166.71 kB minified / 322.05 kB gzip; existing chunk warning. No new FPS or independently measured audible-quality result inferred. Owner subsequently replied "everything works" to the requested interface/native tab sharing/local switching review; record this as owner-reported functional acceptance. M01 is accepted; no further audio tuning is scheduled.


## M02 fullscreen — 2026-11-16 (accepted)

Owner approved fullscreen for Bloom and the audio controls, browser-event synchronization, unsupported/rejection feedback and resize/playback checks. Fullscreen is native and keeps diagnostics outside until exit; short screens can scroll vertically. Audio processing, adapters, artistic composition and motion were not modified by M02. Active benchmarks invalidate on fullscreen transitions.

Tests (seven existing files), typecheck, lint, build and diff whitespace check passed. With Playwright MCP unavailable, headless installed Brave/CDP verified real fullscreen entry by Enter and pointer, button exit/external API exit, target/viewport/state synchronization, benchmark invalidation, responsive layouts at 390×844 / 320×844 / 844×390, and continuing generated-WAV playback on the same element. Simulated failure/unsupported states showed feedback. Screenshots inspected in `/tmp`; console zero errors, existing Clock warning. Headless Escape did not produce native exit; external API exit is not claimed as Escape verification. Owner subsequently replied "it works" to the requested normal-Brave native Escape and audible-continuity check. Record this as owner-reported functional acceptance; M02 is accepted. JS ~1,168.28 kB minified / 322.53 kB gzip with existing chunk warning; no new hardware performance claim or dependency.


## M03 graphics quality — 2026-11-16 (accepted)

Owner approved Standard/Low drawing resolution: default Standard retains DPR1..1.5, Low uses DPR0.75, with no scene/source remount or audio/motion changes. The session-only selection is available in normal/fullscreen controls. Performance JSON and displayed results include preset plus actual render DPR; changing selection invalidates an active run.

All seven test files, typecheck, lint, build and diff whitespace check passed. New performance assertions cover quality-only invalidation and subsequent result metadata. With Playwright MCP unavailable, headless Brave/CDP verified actual buffer dimensions at Standard1.5 (device DPR2) and Low0.75, stable Canvas identity across repeated changes, generated-file playback continuity on the same element, keyboard selection, fullscreen retention/switching, normal/fullscreen 390/320 px overflow and Disconnect. A genuine software-browser 5+30-second run finished with quality="low" and renderDpr=0.75; this is metadata integration evidence, not a hardware speed comparison. Screenshots inspected in `/tmp`, zero console errors, existing Clock warning. JS ~1,169.20 kB minified / 322.78 kB gzip; existing chunk warning. Owner subsequently replied "it works" to the requested normal/fullscreen quality-switching and uninterrupted-audio check. M03 is accepted as owner-reported functional verification; no performance gain, native capture or new hardware FPS claim.


## M04 accessibility and release readiness — 2026-11-16 (owner review pending)

Committed checkpoint 130a99e passed a fresh locked install, all seven test files, typecheck, lint and build in isolated `/tmp/echo-m04-checkout-6nbky35a` using Node24.11.0/npm11.6.1 and no borrowed node_modules. The candidate additionally fixes reproduced keyboard focus loss after Cancel/Disconnect and the stale Diagnostics page title. No adapter, audio, motion, art or dependency changes. Current candidate typecheck/lint/build and whitespace checks pass.

Installed headless Brave/CDP (Playwright MCP unavailable) verified keyboard skip/focus restoration, named primary controls and polite status regions, simulated denial/unsupported recovery, invalid generated WAV recovery and play/pause, fullscreen quality/focus, expanded-tool reflow at 320/390/768/1024 px, 200% root-font resize at 640px and reduced-motion pixel equality. Zero console errors; existing Clock warning. These do not constitute native permission, actual screen-reader, full accessibility conformance or hardware FPS verification. Existing M01–M03 native owner acceptance is retained separately.

Candidate JS ~1,169.43 kB minified / 322.84 kB gzip, with the existing large-chunk warning. RELEASE_CHECKLIST records supported use, privacy and all manual/known limits, including deferred chopped motion. Recommendation: proceed to planning a limited desktop-preview deployment, with owner review and publishing authorization still separate. No service, hosting or publication configured.


## Revised M05 portfolio interface — 2026-11-16 (visually accepted)

Owner approved full-screen Bloom with only ECHO/scene name over the closed landscape, all controls inside a compact chooser, and no developer-access mode. This replaces the earlier proposed separate controls/query option. No audio/adapters, feature extraction, geometry/shader or accepted default motion mapping changes; host debug/benchmark imports and UI are removed. Historical components/tests remain unmounted in source. M04 focus/title fixes are retained.

Tests (all seven files), typecheck, lint, build and diff whitespace check passed. Installed headless Brave/CDP (Playwright MCP unavailable) verified viewport coverage/no page scrolling, keyboard/close/Escape/outside chooser dismissal and focus, generated local play/pause/volume/end/replay, playback while chooser closed, stable Canvas/audio identities, Disconnect/Cancel focus, real fullscreen/quality retention, simulated denial/error recovery, no query developer mode, and 390/320 portrait plus 844×390 landscape panel bounds. 200% root-font resize at 640px and reduced-motion pixel equality passed. Desktop/mobile screenshots inspected; console zero errors, existing Clock warning. These are software/generated/simulation checks, not new native picker, audible quality, hardware FPS or owner aesthetic acceptance.

Build JS ~1,157.32 kB minified / 318.95 kB gzip, CSS ~4.28 kB / 1.55 kB gzip; existing chunk-size warning remains. Owner subsequently reported "looks great, exactly what i wanted," accepting the visual layout. This is not a new native audio-flow or screen-reader result. README and RELEASE_CHECKLIST reflect M05; earlier benchmark/layout evidence remains historical. No publishing, service or dependency added.
