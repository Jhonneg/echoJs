# Verification matrix

Run only checks relevant to changed code; baseline typecheck/lint/build once scripts exist. Tests are evidence, not promises. Use `passed`, `failed`, `not run`, `manual pending`, with command or observation. Never claim mock tests demonstrate real capture. Use temporary fixtures that contain no copyrighted or private content; generated simple tones are enough for diagnostics.

| Area | Automated where practical | Required human / target-browser checks |
|---|---|---|
| Scaffold | typecheck, lint, build | dev server opens; diagnostic UI visible |
| Audio math | synthetic FFT/tones, ranges, Nyquist, silence, clamping | live bands respond to known tones |
| Capture lifecycle | mock rejection/no tracks/ended/stale requests, repeated teardown | native picker, share audio, denial/cancel, missing track, native stop, original sound continues |
| Local audio | state and cleanup tests | file plays once, pause/end, switch inputs, unsupported format |
| Privacy | inspect code/network paths for no media upload/recording | capture indicator clears, tracks stop; check network for media traffic |
| Scene | build, basic browser interaction/console checks | approved composition, motion, real audio response, no flash |
| Performance | measured resource sizes, FPS diagnostics if added | actual reference hardware, viewport/DPR, settings, frame rate, responsiveness |

Record manual evidence in PROGRESS.md (OS/browser, source fixture, actual result). Do not record captured audio/video; screenshots only of ECHO's own scene or diagnostics with owner permission, no private tab content. Browser automation cannot be assumed to handle real native sharing picker or GPU fidelity. If Playwright unavailable, report it, use manual target-browser tests where required, do not mislabel fallbacks. No gate approval without required checks or explicit owner-approved revised scope.

## Minimal manual G1 procedure
1. Open ECHO on localhost/HTTPS and a separately served permitted test tone/music page in Chrome. Start sound.
2. Connect via user gesture, choose the source tab and enable audio sharing. Confirm source remains audible, no echo/duplicate and nonzero live bands matching fixture.
3. Pause/mute source and observe decay (connection remains distinct from silence); resume. Stop sharing via browser and confirm UI resets and tracks end. Reconnect and disconnect in ECHO; test cancel/missing audio and retry. Verify no raw media network/storage.
4. Select local fixture, play/pause/end and switch sources. Confirm no orphan streams or duplicate output. Report actual results; seek owner G1 sign-off.

## Visual gate

Current M05 review: the closed page must show only the full-viewport landscape, ECHO and the Bloom chooser trigger, with no page scrolling. Use Tab/Space/Enter to open Bloom; test close-button, Escape and outside-click dismissal. Test Share/File/Disconnect, local Play/Pause/Replay/volume, Reactivity, quality and fullscreen inside the chooser. Closing must keep playback running; Cancel/Disconnect should restore source-control focus. On portrait/short landscape screens, chooser bounds must stay within the viewport and scroll internally. Confirm query parameters expose no developer tools. Earlier diagnostic/benchmark procedures below are historical; those panels are no longer in the interface.

M04 focus regression: use the keyboard to activate Share a tab, then Cancel sharing while pending. Focus should return to Share a tab. Select a generated file, then Disconnect; focus should return to Open audio file, also in fullscreen. The browser title should identify ECHO as an audio visualizer. Verify named native controls/polite status regions in the accessibility tree; actual screen-reader usability remains a separate manual check. See RELEASE_CHECKLIST for the current review evidence and supported-use limits.
Use agreed composition at reference desktop viewport (e.g. 1440×900, record actual), compare to art direction and available reference. Check focal hierarchy, reflective water, negative space, palette, motion restraint, sparse details and relevant resize/reduced-motion behavior. Capture only authorized ECHO UI screenshots; human approves beauty. For performance record browser, OS, GPU if known, viewport, DPR, settings, sampling interval and actual FPS/asset bytes. Targets are guidelines until hardware baseline exists.

## P05 performance procedure

M03 quality review: compare Standard and Low with permitted audio playing in normal and fullscreen views. Low should look softer; switching should retain playback and the selected preset across fullscreen transitions. Repeated switches must retain the same Canvas/source. Check keyboard and narrow-screen access. Performance results must include both preset and actual render DPR, and selection changes must invalidate active runs. Compare hardware performance only with the same viewport/source/settings and separately recorded environment; automated buffer-size or software-browser checks are not a hardware speed claim.

M02 fullscreen review: while permitted audio plays, enter fullscreen, confirm Bloom and the audio bar remain usable, then exit with the button and with native Escape. Repeat/resizing must not restart playback or duplicate sound; confirm the button follows browser state. Diagnostics are reached after exit. Browser mocks of denial/unsupported APIs do not establish native fullscreen support; headless Escape handling may require a manual normal-browser check. Any fullscreen transition invalidates an active performance run.

Use a production build (`npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`). At the agreed viewport, disconnect audio and use Performance measurement. Start returns to the scene; keep the page visible for 5 seconds warm-up plus 30 seconds sampling. Return to the results below diagnostics and copy the result block.

Repeat during local playback using `npm run fixture -- --long` and the printed 45-second generated WAV. Start playback before measurement. Do not pause, change source/reactivity/reduced-motion, resize, or hide the page during a run; these invalidate it. Keep the scene in view. Add physical CPU/GPU model if known and note any visual or audible problem. Do not send recorded media.

The reported FPS is sampled scene-frame cadence, not GPU execution time or a hardware guarantee. Long frame intervals are retained; warm-up is excluded. Renderer strings may identify software rendering, and privacy settings can hide GPU details. Automated/headless results must be labeled separately from owner Brave results. No G2 sign-off with required evidence missing.
