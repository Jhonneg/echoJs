# VM06 — Integrated choreography and release review

Status: **IMPLEMENTED — AWAITING OWNER REVIEW**. Final release acceptance remains pending.

VM00–VM05 are reconciled/owner-approved in CRIMSON_VISUAL_MAPPING_ROADMAP.md. This phase adds an integrated production verification runner and a release-review checklist, without changing production visuals or audio. The latest owner-approved response range and upper-detail tuning remain intact. No commit, push or deployment is implied.

## Combined mapping inventory

| Musical input | Existing visual interpretation |
| --- | --- |
| Fixed bass energy | Smooth sun-body expansion up to15% |
| Low onset | Extra5% body breath, separate softened corona, world-space valley wave |
| Low mids / high mids | Sustained selected contour light / traveling bright head and tail |
| High onset + presence/air balance | Distant glints / sparse specks and edge shimmer |
| Slow activity | Diffuse sun glow |
| Slow intensity/activity/valid brightness | Multi-second atmospheric density/warmth |
| Overall energy | Bounded forward travel, scene drive saturating at.35 calibrated energy |

The same immutable low event can feed independent sun and valley consumers without draining the stream. Valley travel supplies spatial delay; no new arbitrary timing offset is introduced. Existing lifecycle guards suppress stale/hidden replay. No tempo, instrument or song-section detection is claimed.

## Technical review evidence

`node scripts/verify-vm06.mjs` runs the built public app with generated PCM containing quiet attacks, dense attacks, sustained bass, repeated attacks, silence and mixed input. A60-second production soak observes all renderer effect families, a bounded worker/Canvas/context count and render cadence; then responsive quality views, fullscreen, pause/seek/resume, all-four-scene continuity, disconnect and mocked generated tab teardown are checked. Synthetic tab input never opens or bypasses a native picker. Production bundle exclusion checks remain in force.

- [Integrated browser results](evidence/vm06-verification.json)
- [Standard desktop](evidence/vm06-standard-desktop.png), [Low portrait](evidence/vm06-low-portrait.png)

Passed30 test files, lint/typecheck/build and integrated generated browser checks. Final run /tmp/echo-vm06-olyzHs. The60-second soak retained3604 frame intervals, p95≈16.7ms, one worker/Canvas/AudioContext and no time-domain reads; no console errors. All sun/corona/contour/wave/presence/air/atmosphere uniform families responded. Six quality/viewport captures retained. Fullscreen API enter/exit was exercised directly in headless Chromium; normal-window application controls/OS Escape remain manual pending. Existing Vite bundle warning remains (~1,226.42kB JS/341.12kB gzip). Prior milestone evidence retains authored geometry, seams, bounded chunks, event isolation, quality and atmosphere checks. No shared DSP was modified, so the full MI numerical lab matrix is not repeated. Generated fixture timings are not a full-song listening pass. Headless cadence is scheduler timing, not GPU execution time or native-device performance. Browser fullscreen support does not verify OS Escape handling.

## Owner final gate — all pending for this combined build

Use permitted music yourself; do not upload private/captured media. A simple report of observations is enough.

| Check | What to look for | Status |
| --- | --- | --- |
| Quiet intro → busy passage | Sun remains focal; stronger music yields richer light/depth and faster travel without continuous maximum chaos | Manual pending |
| Sustained bass → repeated hits | Sustained size/glow holds; new hits create discrete breath/corona/waves, with quiet/loud distinction | Manual pending |
| Mixed bright music | Mountain heads, distant glints and sparse air details remain distinguishable and do not overwhelm the sun | Manual pending |
| Pause / silence / resume | Travel stops, accents expire, atmosphere settles gently; no old-event burst on resume | Manual pending |
| Local file → permitted shared tab | Audio remains audible once, native permission flow works, no duplicate output, stop-sharing clears activity | Manual pending |
| Scene / quality / fullscreen | Source keeps playing, framing is sound at desktop/portrait/wide; native Escape and reduced motion work | Manual pending |
| Extended normal-window playback | No visible streaming seams, distracting flicker, sustained stutter or resource growth on owner hardware | Manual pending |

Only the owner can approve this final gate. Until these combined-build observations are supplied, VM06 remains IMPLEMENTED — AWAITING OWNER REVIEW after automated checks, and overall release acceptance remains pending. No further visual milestone follows automatically.
