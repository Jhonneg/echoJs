# Nocturne NT23 — performance, accessibility and lifecycle review

2026-11-27. The review of NT16–NT22 together (glow, streaked floor, haze, skyline, cyan balance and gate floor, rain, ripples, steam, flicker). The owner approved the plan, including an on-screen Brave window on this machine, then asked to finish NT23 without the on-screen numbers.

No production code changed in NT23.

## How it was run

- `node scripts/verify-nocturne-nt23.mjs lifecycle <scratch-dir> <output-dir>` builds an instrumented throwaway copy of the app in the scratch dir. The copy has a read-only probe in `LightingDriver.tsx` for renderer memory, shader programs and the NT19–NT22 effect states; the production sources are untouched.
- That copy is driven headless (1440×900, this machine's GTX 1660 SUPER through ANGLE) with the generated song, loaded through the real file input and looping.
- `… native …` runs the same copy in a real Brave window. See "On-screen measurement" below.
- Cumulative cost: `verify-nocturne-nt22.mjs` against the last commit before NT16 (`0598044`) and against now (`9ee5930`), in two alternated pairs.

## Automated results (all PASS, 0 runtime errors)

From `lifecycle-results.json`:

| Check | Result |
|---|---|
| Effects live in the drop | Rain visible, ripples running (300 frames with rings), steam drifting, magenta lit |
| Lost graphics (WebGL context lost, then restored while playing) | The "Graphics were interrupted — restoring…" status shows. After the restore the scene draws again (42 frames in 0.7 s) with rain and steam, the song keeps playing, and geometries (132) and programs (41) match before |
| Scene switching ×5 (Nocturne → Bloom → Nocturne) | One live graphics context every time; JS heap 12.4 → 14.0 MB after garbage collection; scene renders |
| Quality switching ×5 (Standard ↔ Low, same renderer) | Geometries, textures and programs exactly level: 132 / 18 / 41 after every round (the rain, steam and floor rebuild cleanly) |
| Tab switch (another tab in front for 5 s, then back) | Away: page hidden, 0 frames drawn. Back: visible, 60 animation frames a second, scene drawing, steam and flicker running, audio playing |
| Reduced motion, Standard and Low | No rain; steam frozen (scroll 1.65 both times); no new ripples or flicker over 8 s of the drop; the lights still follow the music (magenta 0.21) |
| Soak, 3 minutes looping | No errors. First and last minute both 60 fps, p95 frame 16.7–16.8 ms. GPU 5.5 ms mean, p95 6.6 / 6.5 ms. Heap 14.6 → 14.8 MB. Ripples (2,304 frames) and flicker (97 frames) both fired |

Screenshots: `lifecycle-drop.png`, `lifecycle-after-context-restore.png`, `lifecycle-reduced-motion-standard.png` and `lifecycle-reduced-motion-low.png`.

Findings while building the checks:

- **Forced freeze doesn't test resume.** The debug protocol's forced page freeze (`Page.setWebLifecycleState`) leaves a headless page `hidden` after "resume", with no animation frames at all for the whole page. That says nothing about the app, as NT13-R4 suspected, so the check uses a real tab switch instead. The freeze also pauses the audio element.
- **A measurement bug, fixed before the final run.** My first soak measured frame intervals per callback while a test frame counter kept re-registering itself, giving a false "180 fps". The final run counts callbacks sharing a frame timestamp as one frame. The NT16–NT22 scripts never had that counter, so their numbers stand.

## Cumulative cost of NT16–NT22 (headless GPU ms per frame, median of 3)

From the `cost-*-capture.json` files:

| | Before NT16 (0598044) | Now (9ee5930) |
|---|---|---|
| Standard idle | 4.15, 5.02 | 5.28, 5.10 |
| Low idle | 3.15, 3.01 | 3.87, 3.99 |
| Standard with music | 4.55, 4.35 | 4.05, 4.22 |

- Low at idle: about +0.85 ms, consistently. This is NT18's always-lit gate, which keeps the NT16 glow and streak passes running at idle.
- Standard at idle: about +0.6 ms, but noisy (one before run was 5.02).
- With music: no measurable increase.
- All runs stay far inside a 16.7 ms frame. These are headless numbers, not native-window certification.
- `roadmap-before-*.png` and `roadmap-after-*.png` (idle, drop, Manual all-on) show the whole NT16–NT22 change from the same script.

## On-screen measurement — PENDING

Two attempts at the planned real-window run on this machine didn't produce numbers:

- **First attempt:** the window opened (GTX 1660 SUPER, 1896×949 viewport after Hyprland tiling, page visible), then stalled during measurement. The 10-minute safety timeout ended it before results were written.
- **Second attempt:** the scene never drew frames; see `native-results.json`.

The likely cause is the window being off-screen or covered, which stops Brave drawing, as N06 found. The script now times out per step and reports page visibility. The owner chose to finish without it. To run it later: stay on the current workspace and leave the window visible and uncovered for about 3 minutes, then run `node scripts/verify-nocturne-nt23.mjs native <scratch-dir> docs/evidence/nocturne/nt23`.

## Owner checklist — PENDING

Record the answers in PROGRESS when done:

1. **Real songs** (permitted local files or a shared tab), in a normal Brave window at your usual size:
   - Does the rain read as light rain?
   - Do the ripples land with the kicks?
   - Does the steam drift calmly?
   - Is the far-left violet strip's rare stutter noticeable but not annoying?
   - Is the cyan/magenta balance right?
2. **Smoothness** on Standard and Low with music: any stutter or dropped frames you notice. Optionally, the on-screen measurement above.
3. **System reduced-motion setting on:** no rain, still steam, no ripples or flicker, lights still following the music.
4. **Tab switching away and back, and minimizing:** the scene resumes cleanly, with no burst of ripples or flicker.
5. **Fullscreen**, exiting with Esc: the scene and controls stay usable.

## Checks

- PASS: 355 unit tests; lint, typecheck, build, whitespace; `verify-nocturne-nt23.mjs lifecycle`; `verify-nocturne-nt22.mjs` (4 cost runs, 0 errors); `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- PENDING: the on-screen measurement and the owner checklist above.
