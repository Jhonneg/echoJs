# APP04 — browser and lifecycle qualification

2026-11-26. **Automated Chromium checks pass. Owner manual checks pending.** Firefox and WebKit were not downloaded, at the owner's request ("approve without download"). Not committed.

- [Support matrix](SUPPORT_MATRIX.md): what works where, with PASS, NOTE or MANUAL in each cell.
- [Manual checklist](MANUAL_CHECKLIST.md): the 11 owner checks with expected results.
- [Browser assertions](capture.json): `npm run build && node scripts/verify-app04.mjs`.

## Automated results (headless Brave, generated WAV, simulated sharing)

| Check | Result |
|---|---|
| Tab hidden for 3 s while a file plays | PASS. Audio keeps playing (1.35 → 5.85 s), analysis keeps running, frames resume, no error |
| Page force-frozen via the lifecycle API | NOTE. The browser paused audio; the app showed "Playback paused" (not an error), and Play resumed. Chrome doesn't normally freeze tabs that are playing sound |
| Shared tab ends from the browser side | PASS. "Browser sharing ended…", Retry sharing offered, 0 live tracks |
| Disconnect from: tab connected, tab connecting, file ready, playing, paused, ended | PASS for all 6 |
| Reduced motion, still pixels over 1.5 s in silence | PASS Bloom (25% → 0%), Lavender Peaks (3.2% → 0%), Crimson Horizon (12.3% → 0%). NOTE Nocturne: already still in silence, so the test can't tell |
| Phone emulation (390×844, touch, mobile user agent, no sharing API) | PASS. Bloom's mouse parallax is off; the new sharing message offers a file; touch Play, Options and Pause work |
| Browser that shares video without audio (simulated Firefox/Safari) | NOTE. Tracks released; message "No audio track received… enable Share tab audio" left unchanged until confirmed in a real Firefox/Safari |

Screenshots: [after background](after-background.png) · [shared tab ended](shared-tab-ended.png) · reduced motion: [Bloom](reduced-bloom.png), [Nocturne](reduced-nocturne.png), [Lavender Peaks](reduced-lavender-peaks.png), [Crimson Horizon](reduced-crimson-horizon.png) · [phone, no tab sharing](phone-no-tab-sharing.png) · [phone, touch Options](phone-touch-options.png) · [video-only share](video-only-share.png)

## Production change

One wording fix in `src/audio/tabCapture.ts`. Before, the "no sharing available" message told everyone to "Use desktop Chrome on localhost or HTTPS", which is meaningless on a phone. Now:
- **No `getDisplayMedia`** (phones, some browsers): "This browser can’t share tab audio. Open a local audio file instead, or use desktop Chrome or Edge."
- **Insecure page:** "Tab sharing needs a secure page. Open ECHO over HTTPS (or localhost), or open a local audio file."

Covered by a new unit test. Nothing else in production changed.

## Verification

PASS: 333 unit tests, lint, typecheck, build and whitespace; `verify-app04.mjs`.

**Not run:** Firefox, WebKit/Safari, real phones, native tab sharing and hearing the audio, screen-reader speech, real slow networks and real GPU resets. These are all in the manual checklist.
