# APP03 — startup, switching and rendering recovery

2026-11-26. **Implemented; controlled checks pass. Owner loading/recovery review pending.** Not committed.

## Screenshots

| What | Frame |
|---|---|
| Nocturne loading (request held): Bloom stays, select shows the choice | [Desktop](loading-held.png) |
| Nocturne failed to load: Retry / Stay on Bloom, audio playing | [Desktop](load-failed.png) |
| Graphics context lost, restoring | [Desktop](graphics-restoring.png) |
| Context restored automatically | [Bloom](graphics-restored.png) · [Crimson Horizon](restored-crimson-horizon.png) · [Lavender Peaks](restored-lavender-peaks.png) |
| Context not restored: Restart offered after the wait | [Desktop](graphics-stuck.png) |
| After Restart landscape | [Desktop](graphics-restarted.png) |

[Browser assertions](capture.json) · [Baseline measurements](measure-baseline.json) · [After measurements](measure-after.json)

## Changes

- **On-demand landscapes.** Bloom, the first landscape, stays in the main bundle. Nocturne, Lavender Peaks and Crimson Horizon are separate chunks. They're preloaded when the browser is idle, but only after a landscape has actually drawn a frame: the shared canvas host reports its first frame (`afterFirstDraw`). Choosing a landscape that hasn't loaded yet keeps the current one on screen, shows "Loading …", and announces it politely. The most recent choice wins. A failed load shows **Retry** or **Stay on …** and is announced as an alert.
- **App-level boundary.** `LandscapeBoundary` wraps the active landscape, outside each scene's own boundary. If a landscape crashes, it offers **Restart landscape**, which remounts the landscape and its canvas. Audio and the analysis reader live above it, so they keep running.
- **Rendering health.** `LandscapeCanvas` (the shared host) listens for WebGL context loss and restoration and reports them to a small store (`src/engine/renderHealth.ts`). The store changes only on a loss or a restore, never per frame. The shell shows "Graphics were interrupted — restoring…". If the context hasn't come back after 4 seconds, it offers **Restart landscape**. No scene files changed.

## Measurements (headless Brave/ANGLE, local preview, 1440×900)

| | Baseline (APP02) | After |
|---|---|---|
| Initial transfer, cache off | 365.8 kB | 341.5 kB (−6.7%) |
| Main JS on disk | 1,301.9 kB | 1,219.5 kB; landscape chunks 24.8–34.9 kB |
| Page start → Bloom canvas ready + 2 frames (median of 3) | 98 ms | 98 ms |
| First switch to each landscape | 29–42 ms | 27–30 ms (already preloaded) |
| Later switches (median) | 29–31 ms | 29–31 ms |
| Live WebGL contexts after 24 switches | 1 | 1 |
| Live buffers/textures/programs/framebuffers before → after 24 switches | 30/6/10/4 → same | 30/6/10/4 → same |
| Quality Low/Standard ×2 on each landscape | 1 live context throughout | same |
| Generated file during 24 switches | kept playing | kept playing |
| Analysis session resets during 24 switches | 1 | 1 |
| Frame-time p95, three 10 s windows per landscape | 16.7–16.8 ms | 16.7–16.8 ms |

Bloom's true first WebGL draw in this environment was about 620–640 ms after page start. Landscape chunks were requested about 60 ms after that.

**Finding (unchanged, out of scope):** fast repeated switching triggered one analysis session reset in both runs. The shared music analysis deliberately resets after a main-thread gap of more than 250 ms, so music-driven motion restarts briefly after a slow switch. The longest frame captured during the measured switches was 17 ms, so the stall happens somewhere these samples didn't catch. Changing the analysis is outside APP03.

## Verification

- PASS: 332 unit tests (new: render-health store), lint, typecheck, build (the large-chunk warning remains, now for the smaller main bundle) and whitespace.
- PASS: `npm run build && node scripts/verify-app03.mjs`. Chunk delays and failures are simulated with CDP request interception; context loss with `WEBGL_lose_context`. It covers preloading only after the first draw, the loading message, failure with Retry and with Stay, the most recent choice winning, automatic restore on three landscapes, Restart after the wait, audio continuing throughout, and scene files unchanged since APP02. Only expected errors appear (failed chunk fetch, context loss), plus the existing `THREE.Clock` warning.
- PASS: `node scripts/verify-app02.mjs` rerun against the combined code.
- `node scripts/measure-app03.mjs <label>` produced both measurement files.

## Limits (manual / not run)

- Real GPU resets, driver crashes, real network failures and slow connections were not reproduced. Timings are from a local server, so on-demand loading matters most on networks these numbers don't cover.
- The landscape crash boundary wasn't triggered in the browser, because doing so needs a fault injected into scene code, which is out of scope. Its fallback reuses the same Restart path that was tested.
- Native-window performance and other browsers are left for APP04.
