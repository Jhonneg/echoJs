# Portfolio preview readiness — M05

Date: 2026-11-16. Current candidate is the approved landscape-first interface; owner visual/functional review is pending. **Nothing is published.** M05 supersedes M04's control-bar/tools layout. The M04 isolated-build evidence remains historical in EVALUATION.

## Visitor experience and privacy

- Bloom fills the viewport immediately, without audio or permission prompts. Only ECHO and the Bloom scene-name toggle appear over the closed landscape.
- Click Bloom (or Tab then Space/Enter) to open the compact chooser. All source, playback, volume, Disconnect/Cancel, Reactivity, quality and fullscreen controls are inside. Closing the chooser keeps audio playing/sharing until explicitly disconnected.
- The page does not scroll. The chooser scrolls internally on short screens. Close it with its close button, Bloom, Escape or a click outside. Native fullscreen Escape is not prevented by app code.
- Diagnostics, debug and benchmarks are absent from the interface. No developer-access mode or query opt-in exists. Historical utility components remain unmounted in source.
- Reference: desktop Brave on Arch Linux. Owner previously accepted the source adapters, native fullscreen/Escape and quality behavior in M01–M03. That evidence is separate from M05's pending native/menu review. Other browsers/OS combinations and mobile native capture remain unverified.
- Tab sharing requires a supported secure context (localhost for local use; HTTPS for future hosting), explicit selection of a permitted tab and Share tab audio. Playback stays in that tab. ECHO does not read/display the browser-requested video. No arbitrary system-audio or streaming-service compatibility promise.
- Local files use the existing browser audio element. No recording, upload, media transport, analytics or preference storage added. Runtime art is procedural; no captured media is bundled.

## Verification evidence

| Check | Status | Evidence / limits |
|---|---|---|
| Tests/typecheck/lint/build | Passed | All seven existing test files and all scripts. No dependency/lockfile change. Existing large-chunk warning. |
| Full-viewport composition | Passed in software browser | Canvas matches viewport; no horizontal/vertical page overflow; closed interface contains ECHO/Bloom only. Desktop/mobile screenshots inspected. |
| Chooser access/dismissal | Passed in software browser | Native keyboard disclosure, close button, Escape, outside click and trigger focus return. Named primary controls. |
| Source/playback behavior | Passed with permitted generated fixtures | Play/pause/volume/end/replay, close/reopen without stopping playback, same Canvas/audio element, Disconnect/Cancel focus restoration. Sharing denial was simulated, not native-picker verification. |
| Fullscreen and quality | Passed in software browser | Real fullscreen enter/exit with chooser access, Low DPR0.75 and selection retention; no new audible-quality/native Escape claim. |
| Error recovery | Passed with stated simulations | Invalid generated WAV and valid-file recovery; simulated sharing denial and fullscreen rejection/unsupported capability messages stay inside chooser. |
| Reflow | Passed in software browser | 390×844, 320×844, 844×390 normal/fullscreen; panel stays within viewport and scrolls internally. 200% root-font resize at 640px also passed. |
| Reduced motion | Passed in software browser | Closed scene screenshot pixels remain unchanged over time with reduced-motion preference and no audio. Default audio/motion mapping unchanged. |
| No developer access | Passed | No tool panels mounted; `?debug=1` does not expose an alternate interface. |
| Console | Passed | Zero errors; existing Three.Clock warning. Playwright MCP unavailable; installed headless Brave via local CDP used explicitly as fallback. |
| Build size | Known limitation | JS ~1,157.32 kB minified / 318.95 kB gzip; CSS ~4.28 kB / 1.55 kB gzip. No hardware FPS improvement inferred. |

## Before publication

- Owner reviews M05's full-screen appearance and chooser flow, including ordinary-browser sharing/audio continuity and fullscreen Escape.
- Real screen-reader usability and broader browser/OS coverage remain unverified; accessibility-tree checks are not conformance certification. Responsive layout does not establish mobile capture support.
- Owner deferred chopped-motion/perceptual refinement; it is not reopened by this UI task. Existing chunk-size and Clock warnings remain.
- Committed checkpoint 130a99e passed a fresh locked install/tests/build in isolated `/tmp/echo-m04-checkout-6nbky35a` under Node24.11.0/npm11.6.1. M04/M05 changes still require a new reviewed checkpoint; this is not a clean-checkout build claim for uncommitted M05.
- Deployment target/HTTPS/static configuration and publishing require separate authorization. No service, host or deployment configured. See README for current local commands and EVALUATION for historical evidence.
