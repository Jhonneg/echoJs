# ECHO

**Your music. Another world.**

A browser-first audio visualizer that transforms permitted audio into living, atmospheric landscapes. The POC provides browser tab capture and local file playback with lifecycle diagnostics. Live level, spectrum, and band diagnostics are available; scene rendering is pending later roadmap tasks.

## Start here (human)
1. Extract these files into the root of a new ECHO repository (keep `.agents/`). Do not overwrite existing files without reviewing changes.
2. Open that folder in VS Code; initialize Git if you want version-controlled checkpoints. Open a new Codex session so repository skills can be discovered.
3. Context7 and Playwright MCP have been verified successfully; see `docs/PROGRESS.md` for evidence and `docs/WORKFLOW.md` for smoke procedures. No global config or secrets are supplied.
4. Paste the contents of `START_HERE.md` into Codex. Review its proposed plan before approving any implementation.
5. After each approved task review results, update/commit the checkpoint, then ask Codex to resume using `$implement-phase`.

## Docs
- `docs/VISION.md` — identity, user flow, MVP boundaries.
- `docs/ARCHITECTURE.md` — audio capture, lifecycle, scene separation and stack.
- `docs/ART_DIRECTION.md` — Bloom visual brief.
- `docs/MOTION.md` — signal mapping and movement constraints.
- `docs/ROADMAP.md` — ordered tasks and acceptance gates.
- `docs/PROGRESS.md` — actual current state; read this first to resume.
- `docs/DECISIONS.md` — rationale and open decisions.
- `docs/VERIFICATION.md` — automated and manual checks.
- `docs/WORKFLOW.md` — prompts, tools and token-efficiency conventions.

## Run locally

Use Node.js 24 LTS and npm (verified with Node 24.11.0 and npm 11.6.1).

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173). Click Connect to open the native sharing picker. Choose a permitted browser tab and enable Share tab audio. Video is also requested by the browser; ECHO never reads or displays it. Disconnect releases all acquired tracks. Analysis starts with capture. If the audio context is suspended, click Resume analysis. Diagnostics distinguish a connected silent input from ended sharing.

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

`build` checks TypeScript and creates `dist/`; `preview` serves that build locally. Dependencies are locked in `package-lock.json`; use `npm ls --depth=0` to inspect installed versions. P01 browser smoke passed in Playwright Chrome; owner approved P01 on 2026-11-16. Local Playwright artifacts are excluded from Git.

Reference art is conceptual, not licensed production assets.

## P02a manual capture check

1. Open `/tone-fixture.html` in a separate local Chrome tab, lower speaker volume, and start a generated tone.
2. In ECHO, click Connect, select the fixture tab, and enable Share tab audio. Confirm connected status, at least one audio track, and that the original tone remains audible without duplication.
3. Disconnect and confirm the browser sharing indicator clears. Reconnect, then stop sharing with the browser's own control; ECHO should report ended.
4. Test picker cancellation, sharing without audio, and retry. Disconnect while the picker is open, then finish or cancel that picker; any late stream must be stopped. Repeat connect/disconnect.

Record actual OS/browser and results in `docs/PROGRESS.md`. Automated tests use fake streams and do not verify native permissions or audible playback. No captured content is recorded, stored, transmitted, or inspected. The fixture synthesizes its own tone and is not a local file input adapter.

## P02b signal check

While sharing the fixture tab with audio, switch between Low (100 Hz), Mid (1000 Hz), and High (8000 Hz). The matching band and spectrum region should rise; prior bands should decay. Stop the tone: values should approach zero within a few seconds while connection stays connected. Restart the tone, then disconnect or use the browser's stop-sharing control: all diagnostics should reset. Confirm the source remains audible without duplication throughout. Report OS/Chrome version and results; generated-stream automation does not establish real tab capture.

Analysis uses FFT size 2048 and the actual context sample rate. Bands are 20–250, 250–4000, and 4000–20000 Hz, capped at Nyquist. FFT dB values convert to linear amplitude; each band uses its peak above a -80 dB floor, divided by a 0.1 amplitude reference and clamped to 0..1. This tuning preserves narrow tones and is not calibrated loudness or instrument recognition. Band attack/release is 100/300 ms; intensity uses the maximum band with 200/500 ms smoothing. `isPlaying` means active local playback, or a running tab input with signal above a small threshold; it is not proof of audible sound. Signal and spectrum buffers stay outside React state; UI telemetry updates at 5 Hz. Tab capture feeds only the analyser, with no destination connection; local playback routes its media element through the analyser to the destination exactly once; teardown cancels analysis and closes its context.

## P02c local file check

Run `npm run fixture` to generate `/tmp/echo-permitted-tones.wav` (or the OS temporary-directory path printed by the command). It contains two seconds each of 100 Hz, 1000 Hz, and 8000 Hz, followed by one second of silence; no recorded media is used.

1. Select it using Audio file. It should wait for Play, then play once with matching band responses. Test Pause, Play, volume, end, and replay.
2. Select the same file again and another supported local file. Previous playback should stop; only the current file should play. Try an unsupported file and recover by selecting the generated WAV.
3. While sharing the permitted tone tab, select a local file: sharing must stop. While playing a local file, click Connect: local playback must stop before tab capture begins. Also select a file while the native picker is pending, then finish/close that picker; a late stream must not replace the file.
4. Disconnect: local playback must stop and diagnostics reset. Repeat source switches and confirm no orphan sharing indicator or duplicate playback.

Files stay on the device using temporary object URLs; ECHO does not upload or persist file content. Each selection owns a fresh audio element, and Play/Pause/replay reuse its single media-source node. Replacement/disconnect releases the element, object URL, audio context and analyser. Report manual results and OS/browser in PROGRESS; G1 requires explicit owner sign-off after local input verification.
