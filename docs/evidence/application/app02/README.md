# APP02 — controls, accessibility and source switching

2026-11-26. **Implemented; controlled checks pass. Owner flow/visual review pending.** Not committed.

## Screenshots

| What | Frame |
|---|---|
| Unplayable file while a tab is connected: the tab stays connected | [Desktop](tab-kept-after-bad-file.png) |
| Unplayable file while a file plays: the file keeps playing | [Desktop](file-kept-after-bad-file.png) |
| Share from a file, then Cancel: same file reloaded at its position | [Desktop](file-restored-after-cancel.png) |
| Share from a file, sharing denied: file reloaded, reason kept | [Desktop](file-restored-after-denial.png) |
| Play/Pause inside Options on a narrow screen | [390×844](narrow-options-playback.png) |
| Help text per landscape | [Bloom](help-bloom.png) · [Lavender Peaks](help-lavender-peaks.png) · [Nocturne](help-nocturne.png) · [Crimson Horizon](help-crimson-horizon.png) |
| 200% text, Options open | [1440×900](text-200-1440x900.png) · [390×844](text-200-390x844.png) · [320×568](text-200-320x568.png) · [320×568 closed](text-200-closed-320x568.png) |

[Browser assertions, keyboard order and help text](capture.json)

## Changes

- **Source switching.** `tabCapture.connect()` now reports `connected`, `failed`, `cancelled` or `skipped`. `localFile` can report the loaded file and position (`snapshot`), reload it at that position (`select(file, resume)`), and check whether the browser can open a file (`probeAudioFile`) using a throwaway element that is never played or analysed. App uses these to keep the current source until the new one works. Cancel restores the file immediately, because ECHO can't close the browser's picker. A request token stops a slow earlier request from overriding a later one.
- **Playback with Options open.** At 740px or narrower the floating player is still hidden while Options is open. A Play/Pause button inside Options now covers that case. On wider screens it doesn't appear, so there's no duplicate.
- **Help text.** Bloom now has help text. Lavender Peaks' text is rewritten to match the six ridges, each driven by its own frequency band. Nocturne's text now mentions the bridge.
- **Fallback text.** All four landscapes use the same accurate messages when WebGL is missing or rendering stops. These strings are the only change in the scene files.
- **Announcements.** Two always-mounted screen-reader regions: `role=status` for routine updates and `role=alert` for failures. The visible status line is no longer a live region, so nothing is read twice.
- **Large text.** On narrow screens the toolbar wraps Options onto its own row instead of squeezing the landscape name. When there's too little room above the controls, Options is pinned to the top of the screen, the same as the existing short-window rule.

## Verification

- PASS: 331 unit tests, including new tests for connect outcomes, snapshot/resume, the file probe (accept, reject, timeout, cleanup) and the switch notice.
- PASS: lint, typecheck, production build (the existing large-chunk warning remains) and whitespace.
- PASS: `npm run build && node scripts/verify-app02.mjs`. This runs the production build in headless Brave with a generated WAV and simulated `getDisplayMedia`. It covers every switching case above, the late-stream release, Play/Pause in Options at 390px and its absence at 1440px, help text on all four landscapes, Tab-key order, 200% text at three sizes with no horizontal overflow and the controls on-screen, old wording gone from the bundle, and changes limited to the planned files and fallback lines. Runtime errors: 0. The existing `THREE.Clock` deprecation warning still appears.

## Limits (manual / not run)

- The native tab picker, whether the sound is actually heard, and real screen-reader speech were not tested. Announcements were checked as DOM/ARIA state only.
- "200% text" was emulated by setting the root font size, not by browser zoom or OS text scaling.
- The 320×568 case at 200% text is narrower than the usual accessibility target. There, Options covers the toolbar until it's closed.
- Other browsers, operating systems and real devices are left for APP04.
