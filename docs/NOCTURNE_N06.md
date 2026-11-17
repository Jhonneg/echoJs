# Nocturne N06 verification — 2026-11-17

Automated integration and hardware-accelerated headless checks passed on the accepted Nocturne baseline. Owner reviewed the reported results with “good” on 2026-11-17; no application changes were needed. This is not production-release or native capture approval.

Tested the working tree based on `d1fc88a`, including the pending Nocturne additions and refinements. This is not a clean committed-checkout claim. Production application artifact: `index-CRhKQ403.js`, 1,201,642 bytes, SHA-256 `5cafbd10c672cdd9882a679531c57ede46f43fd882e91657a9aae5663df586ea`. Existing large-chunk warning remains.

## Performance evidence

- Hardware: AMD Ryzen 5 5600G (12 logical CPUs), NVIDIA GeForce GTX 1660 SUPER, driver 615.78.08; Linux 7.2.11-arch1-1 / Wayland.
- Browser: installed Brave 156.1.98.63, Chromium 156.0.8078.80. The valid runs used hardware-accelerated **headless** mode, confirmed through browser-process GPU diagnostics: ANGLE / NVIDIA / OpenGL ES 3.2. Brave sometimes masks the page-visible renderer string.
- Test-process switches: `--headless --enable-gpu --use-angle=gl --mute-audio --no-sandbox --disable-dev-shm-usage`, isolated `/tmp` profile. No global browser/desktop settings changed. GPU switch guidance consulted in [Chromium's frame-rate test documentation](https://www.chromium.org/developers/testing/frame-rate-test/); renderer identity was verified empirically.
- Viewport 1440×810, device DPR 1, Audio mode, Reactivity 100%, reduced motion off. Standard drawing buffer 1440×810; Low 1080×607.
- Per run: 5 seconds warm-up, then a 30-second sampling window (29.98–30.00 seconds between sampled frame endpoints). Browser animation-frame cadence sampled externally; no diagnostic UI or per-frame React state added. These are not GPU execution-time measurements.
- Playback: generated local 110/1000/8000 Hz mixed tones, looped. Actual AudioContext 96,000 Hz / FFT 4096, matching the existing engine's high-sample-rate configuration. Browser output muted; analyser data remained active. No captured or copyrighted media used.

| Quality | Source | Frames | FPS | p50 ms | p95 ms | Max ms |
|---|---|---:|---:|---:|---:|---:|
| Standard | Idle | 1799 | 60.00 | 16.7 | 18.3 | 22.4 |
| Low | Idle | 1800 | 60.00 | 16.7 | 17.5 | 19.5 |
| Standard | Generated audio | 1799 | 60.00 | 16.7 | 17.7 | 27.6 |
| Low | Generated audio | 1800 | 60.00 | 16.7 | 17.4 | 20.0 |

During Standard/Low playback, signal age p95 was 20.8/20.0 ms and maximum 30.2/22.5 ms. Neither run had frames over the 250 ms stale-input threshold. Both quality modes reached the headless scheduler's ~60 fps cadence; this does not establish a maximum GPU frame rate or quantify a Low-mode speedup.

[Raw measurements](evidence/nocturne-n06-performance.json) are retained in the repository. Temporary runner: `/tmp/echo-n06-perf-headless.mjs`.

### Excluded trials

Default headless Brave used SwiftShader software rendering, consistent with the earlier N05 full-resolution stale-input limitation. A normal window successfully used NVIDIA acceleration, but the compositor stopped delivering animation frames when the window was occluded. Its long timing runs were incomplete and excluded. Short diagnostic probes do not establish windowed performance. Timing collection was changed to a nonblocking external sampler; only the four complete runs above are reported.

## Integration checks

| Check | Status and evidence |
|---|---|
| Automated checks | **Passed:** 14 test files, lint, build including TypeScript, `git diff --check`; Node 24.11.0 / npm 11.6.1. |
| Responsive controls | **Passed:** 1440×810, 1798×686, 390×844, 320×844, 844×390, plus 200% root font at 640×800. Page/panel bounds and horizontal overflow checks passed; internal scrolling reached fullscreen controls. These are desktop-browser viewport emulations. |
| Quality / DPR | **Passed:** at device DPR 2, Standard capped render DPR at 1.5 (2160 px buffer width); Low used 0.75 (1080 px). Canvas identity retained. |
| Keyboard / accessible labels | **Passed:** native summary Enter opens chooser, Escape closes and restores focus; manual range arrow adjustment; accessible Magenta slider name confirmed through browser accessibility tree. Initial keyboard harness needed the Enter character event. Screen-reader usability remains manual. |
| Reduced motion / touch | **Passed:** identical frames under reduced motion despite mouse/touch input. Separate normal-motion touch check also retained identical frames. |
| Playback / scene switching | **Passed:** generated local player identity and active playback retained through 12 switches across all four scenes, and fullscreen transitions. Manual/Audio behavior and values retained. |
| Selected GPU resources | **Passed:** each Nocturne visit had one reflection target and four shared wall maps; zero remained after exit, stable through three complete scene cycles. Crimson owned one worker only while selected. This is selected-resource evidence, not a full heap/VRAM audit. |
| Fullscreen | **Passed:** actual Enter/Exit UI, fullscreen element and button state, with source continuity. Native OS Escape still requires human verification. |
| Context recovery | **Passed, simulated:** `WEBGL_lose_context` loss/restoration completed, with restored frame byte-identical to the prior static Manual view. |
| File lifecycle / recovery | **Passed:** actual generated WAV end/replay, Disconnect focus restoration and closed AudioContexts, malformed generated WAV error and valid-file recovery. |
| Runtime | **Passed:** zero runtime/shader errors in completed integration runs. Expected context-loss diagnostics were induced only by that test. |
| Privacy boundary | **Source-reviewed:** scene uses the existing feature contract; no new media recording/upload/storage paths. No native sharing prompt bypass or captured-content inspection. |

Temporary integration evidence: `/tmp/echo-n06-integration.mjs`, `/tmp/echo-n06-integration.json`, `/tmp/echo-n06-touch.mjs`, and screenshots `/tmp/echo-n06-integration-*.png`. Inspected the restored scene and narrow chooser; accepted artwork and response were retained. No app benchmark panel, dependency, deployment, commit or push added.

## Owner / release checks still pending

- Automated/headless results are owner reviewed. Remaining native/manual checks below are pending; do not infer production-release approval from test completion.
- Windowed presentation cadence and audible playback in the owner's normal browser session. The accepted musical/visual response from N05 remains recorded separately.
- Native tab-picker/share-audio/stop-sharing flow, native fullscreen Escape, actual screen-reader use and real mobile devices. Existing earlier evidence remains historical; none was newly established by these tests.

Recommended next action: owner review, then a separately authorized focused Git checkpoint of Nocturne. Keep the owner-added music-intelligence roadmap separate. No further scene tuning is proposed from these results.
