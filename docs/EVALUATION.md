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
