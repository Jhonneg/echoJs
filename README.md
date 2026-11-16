# ECHO

**Your music. Another world.**

A browser-first audio visualizer that transforms permitted audio into living, atmospheric landscapes. The POC provides browser tab capture and local file playback with lifecycle diagnostics. Live level, spectrum, and band diagnostics are available; Bloom has subtle ambient halo and lake motion, available for visual review.

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

Analysis requests 96 kHz processing, with FFT size 4096 above 48 kHz or 2048 at/below 48 kHz; bin mapping uses the actual context sample rate. Unsupported 96 kHz requests fall back to the browser default with a visible notice. Bands are 20–250, 250–4000, and 4000–20000 Hz, capped at Nyquist. Band power is integrated into spectral magnitudes, then normalized with fixed per-band reference/sensitivity settings. Independent fast, slow-baseline and transient features drive movement; combined energy drives slow atmosphere. See `docs/ARCHITECTURE.md` and `docs/MOTION.md` for the current normalization, envelopes and mappings. `isPlaying` means active local playback, or a running tab input with signal above a small threshold; it is not proof of audible sound. Signal and spectrum buffers stay outside React state; UI telemetry updates at 5 Hz. Tab capture feeds only the analyser, with no destination connection; local playback routes its media element through the analyser to the destination exactly once; teardown cancels analysis and closes its context.

## P02c local file check

Run `npm run fixture` to generate `/tmp/echo-permitted-tones.wav` (or the OS temporary-directory path printed by the command). It contains two seconds each of 100 Hz, 1000 Hz, and 8000 Hz, followed by one second of silence; no recorded media is used.

1. Select it using Audio file. It should wait for Play, then play once with matching band responses. Test Pause, Play, volume, end, and replay.
2. Select the same file again and another supported local file. Previous playback should stop; only the current file should play. Try an unsupported file and recover by selecting the generated WAV.
3. While sharing the permitted tone tab, select a local file: sharing must stop. While playing a local file, click Connect: local playback must stop before tab capture begins. Also select a file while the native picker is pending, then finish/close that picker; a late stream must not replace the file.
4. Disconnect: local playback must stop and diagnostics reset. Repeat source switches and confirm no orphan sharing indicator or duplicate playback.

Files stay on the device using temporary object URLs; ECHO does not upload or persist file content. Each selection owns a fresh audio element, and Play/Pause/replay reuse its single media-source node. Replacement/disconnect releases the element, object URL, audio context and analyser. Report manual results and OS/browser in PROGRESS; G1 requires explicit owner sign-off after local input verification.

## P03a static Bloom review

The opening viewport shows a procedural twilight lake, layered mountains and a fragmented halo. Use Audio diagnostics ↓ or scroll to access the existing source controls. Bloom retains ambient halo drift and water ripples, with audio-reactive scale, fragments, highlights and slow glow. G1 was approved after manual audio verification on Arch Linux / Brave 1.98.63.

The fixed camera and lake reflection are authored approximations. All visual geometry/shaders are local code; no reference-board image is used at runtime. Desktop review viewport: 1440×900. P03a static composition was accepted. P03b ambient motion was accepted after visibility tuning. Owner accepted the tuned P04 audio integration as passable; P05 evaluation is next, pending separate approval.

## P03b ambient motion review

With no playback, watch the halo and reflection for a few seconds (a full drift cycle takes about 13–16 seconds): drift should stay small, water should move gently, and the camera should stay fixed. Enable your system/browser reduced-motion preference: geometry and water phases freeze; P04 permits only slow audio glow. Disable it: motion resumes gently. Also check resize and audio diagnostics below the scene. Report visual acceptance or specific corrections; browser automation does not approve aesthetics or hardware performance.

If the preview server has stopped, run this in a terminal and leave it open:

```sh
npm run dev -- --host 127.0.0.1 --port 5176 --strictPort
```

Open http://127.0.0.1:5176/.

## P04 audio-reactive review

Use both the permitted shared tone tab and `npm run fixture` WAV. Low tones should raise ripple strength and gently enlarge the halo; mids should slide fragments along the ring without a size pulse; highs should brighten water highlights. Sustained sound gradually raises atmospheric glow. Pause/stop/disconnect should settle to ambient. Set the top-right Reactivity slider to zero: audio effects disappear and ambient motion remains; the slider never changes audio volume. Reduced motion suppresses geometry/water movement and allows only slow glow. Confirm source playback remains audible exactly once and source switching/cleanup still works. Report actual results on your OS/browser; generated-stream automation does not verify native capture or audible quality.

P04 bass tuning now uses faster attack/release and a stronger halo/ripple response. Scene gain has a soft knee to preserve differences between stronger signals. If response still feels wrong, compare the bass diagnostic against the scene and report whether you used the permitted shared tab, local file, or both.

Quiet/loud contrast tuning uses linear-magnitude soft-knee scene gain instead of lifting quiet levels with a square root. Ordinary bass hits retain visible movement and louder hits have a wider halo range. Increasing sample/update rate would address timing or frequency detail, rather than amplitude contrast.

Higher-rate processing: reload ECHO and reconnect/reselect audio to create the new context. Audio diagnostics show **Analysis sample rate** and **FFT size**; supported 96 kHz should show 96,000 Hz / 4096. This does not force source recording/tab capture to 96 kHz, add missing source detail, or raise animation/telemetry update rates. Verify playback and responsiveness on your browser; hardware performance at this rate has not been measured.

## P05 performance evaluation

Use the production preview for comparable measurements:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
npm run fixture -- --long
```

Open http://127.0.0.1:4173/. Below audio diagnostics, use **Measure performance** once with audio disconnected and once while playing the generated `/tmp/echo-permitted-tones-long.wav` (45 seconds). Starting returns to the scene. Keep the page visible with source/settings/viewport unchanged for 35 seconds, then return to the result block and copy it. Include CPU/GPU model if known. No result or media is uploaded or automatically persisted.

Frame cadence results include actual browser/renderer, viewport/DPR, source, sample rate, build mode and frame-time percentiles. They are not GPU execution timings. See `docs/EVALUATION.md` for measured evidence, limitations and the POC recommendation. Target-device Brave measurements remain separate from headless automation.

## Shared-tab bass timing check

Refresh ECHO and open `/tone-fixture.html` in a separate tab. Choose **Bass pulses — four quiet, four loud**, start the tone, and share that tab with audio. Four quiet 60 Hz pulses followed by four loud pulses repeat. Watch the halo: quiet pulses should make little size change, loud ones should expand it, and mid-only steady tone should not make a size pulse. Report whether the halo is late, early or appropriately timed. Do not record or upload captured media.

For a local comparison, `npm run fixture -- --bass-pulses` generates `/tmp/echo-permitted-bass-pulses.wav`. A native shared-tab delay cannot be ruled out by generated-stream automation. The scene tracks bass energy, not detected musical beats; sustained bass can hold the halo expanded.

## Fast/transient signal refinement review

Reload the page and reconnect/reselect your permitted source. Audio diagnostics now show **Level / Fast / Slow / Transient**, feature updates per second, and signal age at rendering. The update rate is a main-thread frame callback rate, not the 96 kHz audio sample rate. Signal age is not native capture latency.

Compare quiet/loud bass pulses, a held tone, and permitted music through both local playback and a shared tab. Attacks should accent existing scene motion promptly. Holding a tone should keep its level/fast energy while Transient settles near zero; glow should evolve slowly. Quiet/loud differences, silence decay, zero Reactivity, reduced motion and source switching still need owner confirmation for this revision. No captured media should be recorded or uploaded. Earlier tuning notes describe historical revisions; the current feature contract/mapping is in ARCHITECTURE and MOTION.
