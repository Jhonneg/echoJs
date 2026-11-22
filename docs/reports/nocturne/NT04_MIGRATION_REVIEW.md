# NT04 — Migration parity and regression review

2026-11-22 — technical verification passed; **owner migration visual approval pending**. Owner “procced” authorized this phase after NT03. No production source, mapping coefficient, geometry, camera, material or shared audio-engine change was needed. All 85 `src/` files, including the uncommitted NT03 work, remain byte-identical to this task's initial snapshot.

## Owner review captures

The built production app was compared with the pre-migration source at `e627ff821e84dd0f8e781fa9b259805d4822ac39`, reconstructed in an isolated temporary tree. Camera centered; no pointer parallax during captures. Manual comparison uses magenta 100%, approved left cyan 100%, original cyan/violet 0%. Both sides use the same dependency installation. The legacy side uses a Vite development server; the current side uses the actual production build via Vite preview. Raw manifests record viewport, drawing-buffer size and audio time.

| Case | Before migration | Current production |
| --- | --- | --- |
| Desktop Standard | [Legacy](../../evidence/nocturne/nt04/legacy/manual-desktop-standard.png) | [Migrated](../../evidence/nocturne/nt04/production/manual-desktop-standard.png) |
| Wide Standard | [Legacy](../../evidence/nocturne/nt04/legacy/manual-wide-standard.png) | [Migrated](../../evidence/nocturne/nt04/production/manual-wide-standard.png) |
| Portrait Standard | [Legacy](../../evidence/nocturne/nt04/legacy/manual-portrait-standard.png) | [Migrated](../../evidence/nocturne/nt04/production/manual-portrait-standard.png) |
| Same generated audio mix | [Legacy audio mapping](../../evidence/nocturne/nt04/legacy/mixed-audio.png) | [MI audio mapping](../../evidence/nocturne/nt04/production/mixed-audio.png) |

All six Manual Standard/Low captures at 1440×810, 1920×810 and 810×1440 have **zero differing pixels**. Initial silent frames and the matched panel-off pair also have zero differing pixels. The dominant right magenta fixture, approved left cyan diffuser/spill/reflection, architecture and neutral resting contrast are preserved at the same light settings. Portrait retains the original narrower framing: the nearest right fixture is mostly beyond the edge, while the left fixture, bridge and more distant magenta fixtures remain visible. This is inherited framing, not a migration change; no camera correction was made.

Under identical generated 110/1500/8000 Hz audio at app volume 50%, the migrated broad groups and distant haze are dimmer. This is the documented NT02 behavior difference: calibrated MI energy replaces legacy soft-knee energy and its continuous transient/flux terms. MI discrete events supply finite accents; context.intensity supplies the atmospheric envelope. Panel high-mid coefficients are preserved. The generated steady mix was sampled just after 5 seconds in each run; these are matched sustained-input comparisons, not a sample-accurate beat comparison. Do not require numerical legacy parity or interpret this brightness difference as owner-approved tuning.

## Verification performed

| Check | Actual result |
| --- | --- |
| Nocturne legacy removal | Scene and driver require MusicFeatureReader; no AudioSignal/fast/transient/flux reads or legacy canvas prop in the scene subtree. Shared activity UI chooses MI freshness/energy when Nocturne is selected; adapter state still owns playback lifecycle. Utility imports from signal.ts do not read legacy data. Other scenes retain their existing pipeline. |
| Unit/regression/build | 34 test files, lint, typecheck and production build passed. Existing bundle-size warning remains (~1,231.11 kB JS/342.59 kB gzip). Build hashes retained in technical-summary.json. |
| Composition/quality matrix | Six exact Manual pixel matches plus idle and panel-off matches; no horizontal page overflow at the captured sizes. Standard and Low backing buffers match current quality settings. Inspected desktop audio before/after and portrait appearance. |
| Active scene switching | Actual generated local audio continued playing through Bloom/Lavender/Crimson/Nocturne selections; same audio element, same running AudioContext, advancing currentTime. Browser output muted, so this does not establish human audible continuity. |
| Quality switching | Nocturne Canvas identity retained; width 1440 Standard /1080 Low at 1440 CSS pixels; source kept playing. |
| Manual/Audio | Previous Manual levels retained through scene changes; preview uses the same final controls. Existing NT03 numeric/event tests cover suppression without replay. |
| Reactivity0 | Actual production audio keeps playing; reactive scene returns to the silent appearance. Upper1440×500 scene crop is pixel-identical to initial silence. |
| Reduced motion, browser | Actual emulated media preference applied. Manual before/after pointer movement screenshots are pixel-identical. A separate generated-attack run through the unchanged analysis and isolated numeric probes recorded 141 samples/140 frames: panel accent was exactly 0 throughout, with gradual sustained response and slower release. Source code was instrumented only in the temporary copy. |
| Pause/resume | Real local element paused and resumed through UI; paused upper-scene crop matches initial silence exactly. |
| Disconnect/reconnect | Disconnect paused/released the original audio element, removed its src and closed its context. Selecting/playing the generated file again created a new working element/context with only one nonclosed context. Both contexts used 96 kHz. Disconnected upper scene matches initial silence exactly. |
| Diagnostics/privacy | Production has no __mi05 or __nocturneReview hooks. Browser test wrappers observe only the generated local audio element and AudioContext lifecycle; no capture prompt or private media involved. Successful runs had no runtime/console errors. |
| Source/resources | All 85 src files unchanged during NT04; full hashes retained. Reduced-mode trace shows 105 geometries/six textures, matching NT03. No new resource/performance claim from counts. |

A first production trial stopped on serialization of a canvas returned by the test harness. Returning a scalar corrected the runner; the successful fresh run supplies the reported lifecycle results. No application defect or production change was involved.

## Evidence and reproduction

- [Pre-migration browser manifest](../../evidence/nocturne/nt04/legacy/verification.json), [production manifest](../../evidence/nocturne/nt04/production/verification.json), [pixel comparisons and unchanged-source hashes](../../evidence/nocturne/nt04/comparison.json), [technical summary/build hashes](../../evidence/nocturne/nt04/technical-summary.json).
- [Zero Reactivity](../../evidence/nocturne/nt04/production/zero-reactivity.png), [disconnected](../../evidence/nocturne/nt04/production/disconnected.png), [reconnected](../../evidence/nocturne/nt04/production/reconnected.png).
- [Reduced-motion generated demonstration](../../evidence/nocturne/nt04/reduced-signal/generated-music-demo.mp4), [reduced-motion signal/brightness trace](../../evidence/nocturne/nt04/reduced-signal/trace.json). Browser audio was muted; the video muxes generated WAV with approximate screenshot timing.
- Existing [NT03 report/normal-motion demonstration](NT03_VISUAL_STATE.md) supplies normal attack isolation and 6,300 same-input exact NT02 comparisons; unchanged-source hashes tie those algorithms to this NT04 build.

Run `npm test`, lint, typecheck and build. Reconstruct the legacy commit in an isolated tree with the existing node_modules linked, then run `ECHO_NT04_ROOT=<legacy tree> ECHO_NT04_LABEL=legacy node scripts/verify-nocturne-migration.mjs`. Run `node scripts/verify-nocturne-migration.mjs` for the current built production app. `ECHO_NT04_SOURCE_BASELINE=<task-start tree containing src/> node scripts/compare-nocturne-migration.mjs` checks captured parity and unchanged source. `ECHO_NOCTURNE_LABEL=nt04/reduced-signal ECHO_NOCTURNE_REDUCED=1 node scripts/verify-nocturne-mi.mjs` checks actual reduced-motion generated audio. Local browser ports require the normal sandbox escalation; installed Brave, ffmpeg and ImageMagick were reused.

## Approval gate

Technical evidence is ready. Owner must approve the migrated baseline's contrast and fixture balance, particularly the deliberately dimmer broad-group/atmospheric audio response, before NT05. No NT05 choreography or stronger cyan accent has been implemented. Native tab sharing/stop-sharing, real-song feel/audibility, real devices, extended playback, screen-reader use and hardware performance remain manual or later NT13/NT14 checks. Viewport emulation and generated playback do not close those gates. No commit/push/deployment. Suggested verification-only commit after authorization: `Verify Nocturne Music Intelligence migration baseline`.

Owner checkpoint (2026-11-22): owner “proceed” after this report approves the migrated baseline and authorizes NT05. This closes NT04 owner migration approval; the recorded native/device/later-phase limitations remain unchanged.
