# APP01 — reliable audio health and visible recovery

2026-11-23. **Implemented; controlled checks pass. Stop for owner visual review before APP02.** No commit/push. Approved landscapes and shared Music Intelligence algorithms are unchanged.

| State | Desktop | Portrait |
|---|---|---|
| Initial guidance | [Frame](initial-desktop.png) | [Frame](initial-portrait.png) |
| Pending / cancel | [Frame](pending-desktop.png) | [Frame](pending-portrait.png) |
| Connected / receiving | [Frame](connected-desktop.png) | [Frame](connected-portrait.png) |
| Connected / silent | [Frame](silent-desktop.png) | [Frame](silent-portrait.png) |
| Unsupported capture | [Frame](unsupported-desktop.png) | [Frame](unsupported-portrait.png) |
| Denial | [Frame](denied-desktop.png) | [Frame](denied-portrait.png) |
| Missing audio track | [Frame](missing-audio-desktop.png) | [Frame](missing-audio-portrait.png) |
| Context preparation failure | [Frame](prepare-failure-desktop.png) | [Frame](prepare-failure-portrait.png) |
| Graph attachment failure | [Frame](graph-failure-desktop.png) | [Frame](graph-failure-portrait.png) |
| Suspended audio | [Frame](suspended-desktop.png) | [Frame](suspended-portrait.png) |
| Resume rejected | [Frame](resume-rejected-desktop.png) | [Frame](resume-rejected-portrait.png) |
| Invalid generated file | [Frame](decode-error-desktop.png) | [Frame](decode-error-portrait.png) |
| File ready | [Frame](file-ready-desktop.png) | [Frame](file-ready-portrait.png) |
| Play blocked / retry | [Frame](play-blocked-desktop.png) | [Frame](play-blocked-portrait.png) |
| File playing | [Frame](file-playing-desktop.png) | [Frame](file-playing-portrait.png) |
| File paused | [Frame](file-paused-desktop.png) | [Frame](file-paused-portrait.png) |

[Very short Options popup](short-options-short.png) · [Browser assertions and scalar snapshots](capture.json) · [Source baseline](source-before.json)

## Changes and rationale

The audit found hidden errors and a false connected state after graph failure. Typed preparation/start results now reach capture/local adapters, which retain actionable reasons and release failed graphs/streams/files. `analysis.health` separates source ownership from audio processing. Resume rejection remains retryable; stale rejected promises cannot poison a replacement context. Existing boolean element-attachment and diagnostic message APIs remain compatible. No frequency calculation, MI event/session/threshold, analyser routing or landscape output changed.

One polite live region is visible above the existing toolbar, including while Options is closed. Contextual actions use the existing source controllers; the inline error does not open a native picker automatically. Healthy silence, paused playback and failure are distinct. New playback-rejection metadata enables a visible Retry Play without interpreting error-message strings. A completed recovery/cancellation restores keyboard focus. There is no modal onboarding or new scene UI.

The existing500ms status timer is reused, with React updates only when health/activity changes. Source changes render immediately using current health, avoiding a stale idle/error flash after successful startup. A ResizeObserver writes only a CSS size variable, not React state; a short-height popup guard keeps the added feedback from clipping Options. The general player/layout/accessibility/source-transaction work remains APP02.

Production changes: audio analysis orchestration, tab/local adapters, AudioControls, shell CSS; new type-only health contract and pure feedback presentation module. The lab adapter has type-only interface changes to follow the result contract. All101other existing source hashes match the pre-task manifest, including every landscape, App, rendering host and MI calculation module. The pre-existing Lavender terrain modification was preserved as part of that baseline.

## Verification

- PASS58test files. New regression cases exercise idle/prepared/running/suspended/closed health, failed construction/graph and recovery, rejected and stale resume promises, source failure routing, prepare failure without a picker, failed-track release/retry, local prepare failure and presentation distinctions. Existing production-MI/legacy parity and source lifecycle tests still pass. Updated test doubles return the newly required start result.
- PASS lint, typecheck/production build and whitespace checks. Existing large-chunk build warning remains. Final JS1298.51kB /363.42kB gzip; CSS8.33kB /2.27gzip. No dependency change, new drawing pass, GPU resource or frame-rate React loop. No new GPU/native performance claim.
- PASS actual production browser checks via installed headless Brave/CDP:33screenshots covering1440×900 and390×844 plus320×256; feedback visible/bounded; short popup bounded; contextual retries; generated-stream cleanup; cancellation and stale acquisition disposal; actual WebAudio suspension/resumption with explicit injected rejection; real browser decoding failure from generated invalid bytes; actual generated WAV Play/Pause; blocked Play retry with no duplicate element-source node; playback across all four scenes; Disconnect and completed-recovery focus; named status region in the accessibility tree. Runtime errors0; existing Clock deprecation remains.

Run `npm run build`, then `node scripts/verify-app01.mjs`. The helper serves the unchanged production build, injects test controls into the browser only and checks preserved source hashes. It never modifies scene modules or ships a diagnostic mode. Capture capability/denial/missing-track/graph faults use explicitly simulated getDisplayMedia/AudioContext behavior; native permission prompts are never bypassed or claimed tested. WAV/oscillator data is generated; no owner media is inspected, recorded or uploaded. Browser audio is muted, so audibility and native sharing remain manual. Actual screen-reader speech and broader browser/OS coverage remain manual.

Review the new feedback's placement, contrast and wording. APP02–APP05 are not started. Proposed focused commit only after explicit authorization: `fix(audio): expose analysis health and recovery feedback`.
