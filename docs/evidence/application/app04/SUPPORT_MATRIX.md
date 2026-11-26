# ECHO browser support matrix

Last updated 2026-11-26 (APP04). **PASS** = observed in an automated or owner check, with evidence. **NOTE** = observed, with a caveat. **MANUAL** = not yet observed; the "Expected" text is an expectation, not a result. Update a cell only after the check in [MANUAL_CHECKLIST.md](MANUAL_CHECKLIST.md) is done.

| Browser / device | Tab audio sharing | Local file playback | Landscapes (WebGL) | Background / return | Evidence |
|---|---|---|---|---|---|
| Brave (Chromium), Linux desktop, headless | PASS, simulated `getDisplayMedia` (connect, end, cancel, failure). Native picker and hearing the audio: MANUAL | PASS, generated WAV | PASS, all four, Standard and Low | PASS hidden tab; NOTE forced freeze pauses audio, status is accurate and Play resumes | [capture](capture.json), APP01–APP03 evidence |
| Chrome desktop, native window | MANUAL. Expected to work; tick "Share tab audio" | MANUAL | MANUAL | MANUAL | — |
| Edge desktop | MANUAL. Expected the same as Chrome (Chromium) | MANUAL | MANUAL | MANUAL | — |
| Firefox desktop | MANUAL. Expected: no tab audio. Simulated video-only result shows "No audio track received… enable Share tab audio", which may mislead Firefox users | MANUAL | MANUAL | MANUAL | [simulated](video-only-share.png) |
| Safari desktop (macOS) | MANUAL. Expected: no tab audio; same message caveat as Firefox | MANUAL | MANUAL | MANUAL | — |
| Android phone (Chrome) | PASS in Brave phone emulation: no sharing API, so "This browser can’t share tab audio. Open a local audio file instead…". Real device: MANUAL | PASS in emulation (touch Play/Pause, Options); real device MANUAL | PASS in emulation; real GPU MANUAL | MANUAL | [phone](phone-no-tab-sharing.png), [touch](phone-touch-options.png) |
| iPhone / iPad (Safari) | MANUAL. Expected: no tab sharing; same message as Android | MANUAL | MANUAL | MANUAL | — |

Applies everywhere it was checked (Brave): Disconnect works from every source state; reduced motion stops Bloom, Lavender Peaks and Crimson Horizon (Nocturne is still in silence anyway); Bloom's mouse parallax is off on touch-only devices.
