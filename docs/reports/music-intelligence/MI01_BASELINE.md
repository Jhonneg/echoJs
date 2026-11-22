# MI00 audit / MI01 audio diagnostics baseline

2026-11-17 · owner-approved MI01 implementation · base commit `bae0110` plus uncommitted MI01 changes. Automated evidence is ready for owner review; no MI02 authorization or feature-quality approval is inferred.

## MI00 findings

The worktree was clean at audit/start. The Nocturne checkpoint recommending a commit was superseded by `bae0110`; historical progress remains intact. The supplied roadmap is `ECHO_Music_Intelligence_Roadmap.md`, not the missing `MUSIC_INTELLIGENCE_ROADMAP.md`. Project implement-phase/code-review/session-handoff skills remain unavailable; followed AGENTS and WORKFLOW directly. Consulted Context7 Web Audio/Vite documentation during planning and validated the offline API in the reference browser.

Both adapters share one `createAnalysis` instance, retained across scene changes. Tab capture creates a media-stream source without destination routing. Local playback creates one media-element source, routed through the analyser to the destination. Existing generation guards, source switching, permission handling, URL/track/node cleanup and output volume remain unchanged.

Production requests a 96 kHz interactive context; only an unsupported-rate error retries the browser default. FFT is 4096 above 48 kHz, otherwise 2048. Analyser smoothing is zero. Broad ranges remain 20–250 / 250–4000 / 4000–20000 Hz, half-open and Nyquist-clipped. Six bands remain 20–80 / 80–250 / 250–800 / 800–2500 / 2500–6000 / 6000–20000 Hz.

Raw broad magnitudes are the square root of summed bin powers, with nonfinite/≤−80 dB bins ignored and positive dB capped at zero. No bandwidth/window calibration makes this time-domain RMS. Broad normalization is `x/(1+x)`, with `x=magnitude*sensitivity/0.1` and sensitivities 4/3/3; no AGC. Fast attack/release is 5/80, 8/100, 3/60 ms; slow is 250/800 ms. Transient derives from positive fast-minus-slow, then smooths separately. Flux uses positive per-bin magnitude increments, L2 aggregation, a leaky reservoir and output smoothing; it primes on first input and resets for inactivity or invalid/>250 ms deltas. Neither transient nor flux is a discrete onset detector. Atmosphere uses 1/2-second smoothing. Six-band output contains normalized fast energy only.

Analysis polls with requestAnimationFrame, not a fixed audio hop. Physical-time smoothing does not guarantee cadence-independent spectral observations. `isPlaying` means running/unpaused/unended for local playback, but running/nonzero bands for tab capture; connection state remains separate. Stop resets public signal objects in place. Private raw scratch previously remained stale after stop; the new diagnostic view independently zeros itself without changing production scratch behavior. Existing render-age reporting is Bloom-specific; the lab displays feature age, not capture latency.

Bloom blends broad energy and accents. Lavender uses shared intensity/spectral brightness for ridges and bass accents for the sun. Crimson uses six-band activity/energy for sun/travel and bass accents for its pulse. Nocturne uses accepted continuous smooth lighting, atmosphere and stale guards. All mappings and camera behavior are preserved. Existing unmounted diagnostics lack a full raw/RMS/fixture/export baseline. The pre-MI01 suite passed 14 test files.

## Reproduce and interpret

1. `npm run dev`, open `/audio-lab.html`. This is a separate development entry; App has no lab control or diagnostic query mode.
2. Choose a synthetic fixture and generated source rate, then Play. Live playback uses the unchanged local-file adapter. Default output volume is 0.25 and affects measured input; offline runs use fixture gain directly. Pause retains/decays legacy envelopes; Stop resets the diagnostic view, closes the live context and clears graph history.
3. Inspect RMS/dBFS, raw broad/six magnitudes, normalized values, fast/slow/transient/flux, raw flux L1/L2, atmosphere, activity, rate, feature age and context format. Select a graph band. Six-band features that do not exist are marked unavailable. UI/history samples at 5 Hz over at most 30 seconds; these display samples cannot establish 20 ms attack accuracy.
4. Run all offline baselines. Each fixture uses native OfflineAudioContext/AnalyserNode at requested 44.1/48/96 kHz with production FFT settings. A common 120 Hz snapshot timeline is replayed at 30/60/120 calls/s through existing production feature functions. Actual quantized audio timestamps determine deltas. A parity test checks harness/live orchestration.
5. Export JSON for metadata and complete aggregate measurements or CSV for broad-band peak summaries. No PCM, FFT arrays, graph histories, captured media, user filenames, automatic persistence or upload. JSON uses null for silent RMS dBFS. Cancellation/errors prevent a report from claiming completeness.
6. `npm run build`, then `node scripts/verify-audio-lab.mjs` repeats two complete sweeps, compares numeric results, exercises UI/exports/cancellation and generated playback through all scenes, and checks production artifact exclusion. Uses installed Brave/CDP because Playwright is unavailable; set `ECHO_BROWSER` for another Chromium executable. Localhost/browser execution may need sandbox authorization. Output goes to a printed temporary directory.

Fixtures use seed 0x4543484f, mono PCM, 0.5-second tonal pre-roll, 2 ms linear edges, explicit labeled starts and release tails. Noise is white at −60 peak dBFS. Tone levels are **peak** −36/−24/−12/−6 dBFS; a full sustained sine has RMS 3.0103 dB below its peak. Three-second amplitude steps are measured in their final quarter-second. Bursts last 20/50/100 ms. The corpus also includes sustain, repeated hits over sustain, an unclipped 100/1000/8000 Hz mixture and a high-only sharp attack.

Diagnostic thresholds were declared in code before measurement: active fast >0.001; accent excursion crosses `max(transient,flux)` upward through 0.1; near-saturation level ≥0.95. A matching observation window is 0–300 ms after a labeled attack. These probes are not candidate onset events, quality tolerances or musical precision/recall. Unmatched crossings can include releases/leakage. The report retains their numeric time, band and feature values to locate the stage.

## Measured baseline

[Numeric evidence](../../evidence/music-intelligence/mi01/mi01-baseline.json) contains 216 rows: 24 fixtures × 3 actual context rates × 3 update cadences. Two full sweeps within the same headless Brave/Chromium 156 Linux process matched exactly, including metadata; no failed/unavailable cases. A final fresh browser process again reproduced its own two sweeps exactly, but differed slightly from the retained process: across the eight peak groups the largest absolute difference was 0.000223 (44.1 kHz six-band highMids spill); excursion counts were unchanged in all 216 rows. See [repeatability comparison](../../evidence/music-intelligence/mi01/mi01-repeatability.json). Exact floating-point equality across fresh processes/browsers/hardware is not promised; this observed difference is not a newly approved quality tolerance. [Browser verification](../../evidence/music-intelligence/mi01/mi01-browser-verification.json) and [live lab screenshot](../../evidence/music-intelligence/mi01/mi01-lab-live.png) are retained. Screenshots show only ECHO and synthetic diagnostics.

At **48 kHz / FFT 2048 / 60 updates/s**, the final-quarter-second 100 Hz transfer curve was:

| Peak input dBFS | Raw bass mean | Normalized level mean |
|---|---:|---:|
| −36 | 0.004371 | 0.148812 |
| −24 | 0.017400 | 0.410379 |
| −12 | 0.069271 | 0.734808 |
| −6 | 0.138214 | 0.846827 |

The response is monotonic. Increasing input by 6 dB at the top roughly doubles raw magnitude but adds only 0.112 normalized level. This confirms the compressive transfer curve, not the cause of any particular musical complaint. No tested broad level reached the declared 0.95 near-saturation threshold: occupancy was 0% across all 216 cases. No claim of hard clipping or equivalent perceptual loudness follows.

Broad-band peak magnitudes for −12 dBFS tones, same format/cadence:

| Tone | Bass | Midrange | Treble |
|---|---:|---:|---:|
| 100 Hz | 0.069271 | 0.004095 | 0 |
| 1 kHz | 0 | 0.069271 | 0 |
| 8 kHz | 0 | 0 | 0.069271 |

The 100 Hz midrange peak occurs at an edge, not the sustained plateau. Its midrange level/transient peaks reach about 0.109/0.161. The six-band subBass peak is about 0.028684 while six-band bass peaks at 0.065478: finite-window energy crosses the nearby 80 Hz boundary. These are measured FFT/range effects amplified by existing normalization/envelopes, not evidence of instrument recognition. The sharp 8 kHz fixture produced no measured broad bass/midrange response in this corpus.

Silence and −60 peak dBFS noise produced zero legacy band/envelope/flux outputs. Noise RMS is nonzero; individual spectral bins fall below the current −80 dB inclusion floor. This is evidence about that fixture and floor, not a general noise-rejection guarantee.

The 5-second sustained 100 Hz tone produced its initial bass excursion at 0.517333 s and an extra bass flux excursion at **5.517333 s**, immediately after the labeled release at 5.5 s. At that extra crossing flux was 0.329091, raw flux L2 0.017225 and transient approximately 0.0000001. Positive spectral redistribution at a release can therefore excite the legacy flux path. Midrange excursions also occurred at both edges. The interior did not generate repeated crossings at this probe threshold. Repeated hits over sustain produced six matched bass crossings including the initial sustain attack, plus five midrange edge excursions. These counts describe this envelope probe, not accepted onsets.

For the 20 ms bass burst at 48 kHz:

| Requested updates/s | First excursion delay | Bass transient peak | Bass flux peak |
|---|---:|---:|---:|
| 30 | 33.33 ms | 0.778324 | 0.653695 |
| 60 | 17.33 ms | 0.780373 | 0.647785 |
| 120 | 9.33 ms | 0.782379 | 0.636175 |

The largest observed flux-peak spread across cadences was 0.137335 for **midrange spill from 100 Hz amplitude steps at 96 kHz**: 0.098105/0.235441/0.229136 at 30/60/120. Raw midrange peaks also changed (0.003263/0.009276/0.010032), locating a substantial difference upstream of reservoir smoothing: polling samples different FFT edge windows. This does not isolate every reservoir contribution or establish phase-independent bounds.

At 44.1 kHz, FFT 2048 spans 46.44 ms with 21.53 Hz bins; 48 kHz/2048 and 96 kHz/4096 span 42.67 ms with 23.44 Hz bins. The burst's 60 Hz first excursion delay was 19.55/17.33/17.33 ms respectively. Actual audio sampling, FFT window, quantized offline reads, feature updates and UI/render cadence remain distinct. No source capture-rate or end-to-end latency claim follows.

## Verification and limits

Passed: 15 test files; lint; build including typecheck; diagnostic observer enabled/disabled legacy-output parity; replay/live feature parity; deterministic PCM/WAV, silence metadata, reset and callback-failure isolation. Browser passed live generated playback/pause/reset, desktop/portrait page bounds, full baseline repeated exactly, JSON/CSV export, cancellation, one advancing synthetic player through all four landscapes, no runtime exceptions or console errors, a cancelled export marked incomplete, and absence of lab HTML/diagnostic markers in production assets. Existing large-bundle warning remains.

One offline sweep measured ~7.16 s of offline work and ~1.30 s replay/report computation in this headless process. Largest temporary FFT trace was 13,262,848 bytes; one fixture trace is retained at a time. These are lab wall times/array sizes, not CPU profiling, heap maxima, frame-rate or reference-hardware guarantees. Live synthetic input used actual 96 kHz/4096 at ~62 updates/s; the original generated WAV was 48 kHz, illustrating resampling. Output audibility was not assessed.

Manual pending: owner lab/result review. Native sharing permissions/capture, real-media musical usefulness, audible playback and reference-device performance remain separate and unchanged; synthetic results do not satisfy those gates. No production normalization, onset detector, adapters, scene mappings, camera, dependencies or backend changed. The only production-source edit is the optional development observer hook; build checks verify its implementation is eliminated.

MI01 evidence is ready, **owner acceptance pending**. Before MI02/MI03, approve quantitative working-range, wrong-band, timing/cadence and false-response tolerances using this baseline. No algorithm correction, pilot scene, commit or push is authorized by this checkpoint.

## Approved follow-up: live tab diagnostics — 2026-11-18

The owner approved adding tab capture to the development lab. This extends the initial synthetic-only input scope above; the retained MI01 measurements remain the original synthetic baseline. No energy calibration, onset detection or landscape mapping changes are included.

To test a song:

1. Run `npm run dev` (or keep the existing dev server running), open its `/audio-lab.html` page in desktop Chrome/Brave and open permitted audio in another browser tab.
2. Click **Share a tab**, select the audio tab, enable **Share tab audio**, then confirm **Share** in the native picker. The picker requests video as required by the existing adapter; ECHO does not read video frames.
3. Play the song in its original tab, then return to the lab. Inspect RMS/dBFS, raw bands, normalized/envelope/flux meters and the selected graph. Source mode is shown separately from running/playing state. Original tab sound continues; the lab adds no playback route. The fixture volume control is disabled for tab input; change the original source's volume if needed.
4. If the analysis context is suspended, click **Resume analysis**. Pause/silence in the source tab should reduce measurements while capture remains connected. **Pause** controls synthetic playback only.
5. Use **Disconnect tab**, **Stop / reset**, or the browser's native Stop sharing control. Source teardown resets the graph/diagnostic view. While the native picker is pending, **Cancel sharing** cancels ECHO's request; close the native picker too if still open. Late accepted tracks are stopped automatically.
6. **Play synthetic fixture** or **Run all offline baselines** first releases tab capture. Reconnect explicitly to return to a live tab. The live tab source is not included in offline tests or their exports.

Live measurements/history remain transient in memory, with no media recording/upload/storage or live-data export. No tab titles/URLs are collected. Synthetic JSON/CSV exports are disabled during pending/active capture and guarded in handlers; after disconnection any retained reports still contain only earlier synthetic results. User song-file diagnostics are not part of this follow-up.

Passed: 16 test files, lint, build/typecheck, diff check. Browser CDP checks use generated audio behind a **mocked getDisplayMedia**, not actual browser capture. They verify numerical tab-path meters, export lock, source switching, native-end callback behavior, denial/no-audio messages and late-stream cleanup; the existing 216-row synthetic baseline reproduced twice in-process and other MI01 integration checks passed. Production asset hash remains `index-C7O-uO6d.js`. [Follow-up browser evidence](../../evidence/music-intelligence/mi01/mi01-tab-lab-verification.json), [controls screenshot using only a generated fixture](../../evidence/music-intelligence/mi01/mi01-tab-lab-controls.png).

**Manual pending:** native picker permission/selection with Share tab audio, original source audibility, real song diagnostics, connected silence, native Stop sharing, and owner acceptance. No real/private source was captured or inspected by the agent. Stop before MI02; no commit/push or broader acceptance inferred.
