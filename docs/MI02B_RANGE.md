# MI02b — range and noise experiment

2026-11-18 · approved lab-only scope and safeguards · base `c417b8d` plus pending MI02a/MI02b work. Owner accepted the lab checkpoint (see feedback below); no production default, feature-quality or MI03 implementation approval inferred.

## Use and boundaries

Open `/audio-lab.html` and scroll to **MI02b · Range and noise comparison**. It displays fixed linear values beside the experimental adaptive values for the same three broad/six sub-bands. There is one shared gain, a gain/history readout and a selected-band graph (fixed orange, adaptive cyan, shared gain divided by two violet). MI02a's linear/soft-knee measurements and its failed soft-knee result are preserved.

For a live song, use the existing Share a tab workflow; no live values are exported. For generated playback, select one of the nine `range-*` fixtures. Set **Fixture output volume to 1** when reproducing the nominal input levels: the default 0.25 attenuates a −36 peak dBFS sine to below the adaptation floor. This is expected source-volume behavior, not a gate or a broken adaptive control. The original audio is never amplified by this experiment; only diagnostic visual-control values change.

**Run range/noise comparison** stops the current source and generates a separate synthetic report. Existing MI01 and MI02a buttons still run their own corpora. Each new suite replaces the displayed/exportable synthetic result; incomplete/cancelled runs are labeled incomplete. JSON contains assessments and aggregate metrics, CSV one row per fixture/rate/cadence. Capturing/pending tabs disable both exports and handler guards; source replacement, late requests, native-ended callbacks and pagehide retain existing adapter cleanup. No captured audio/video, FFT arrays, live histories, titles or URLs are persisted/exported. Thirty-second/151-sample UI histories remain in memory.

Production normalization, frequency ranges, AudioSignal, adapters, scene mappings, onset/flux and playback routing are unchanged. No dependency/backend/rendering change. The production artifact remains `index-C7O-uO6d.js`, with no adaptive/range code bundled. Existing large-bundle warning remains. Named project phase/handoff skills are still unavailable; followed AGENTS/WORKFLOW. This task uses the already-verified Web Audio measurements and plain elapsed-time math, with no new platform API.

## Candidate specified before measurement

Both paths consume MI02a's unchanged stationary-window band RMS estimates and fixed linear transfer (`min(1, rms / 0.5)`). The experiment multiplies RMS by one shared gain before that transfer; it does not independently boost inactive bands or change calibration.

| Parameter | Value |
|---|---:|
| Gain bounds / reset | 1…2× / 1× |
| Startup hold | 2 seconds per active source/session |
| Gain rise time constant | 5 seconds |
| Gain reduction time constant | 300 ms |
| Adaptation floor | −50 dBFS time-domain RMS |
| Target broadband RMS | 0.25 |
| Broadband RMS tracker attack / release | 300 ms / 5 seconds |

A broadband time-domain RMS tracker determines desired gain `clamp(0.25 / slowRms, 1, 2)`. Below the floor or during startup hold, desired gain is 1. The gain approaches its desired value with the stated elapsed-time constants. These are exponential constants (about 63% of a change in one constant), not deadlines for exact settling. No increase is allowed below the floor, but a previously boosted source decays back toward unity. The input signal is **not gated**: quiet energy remains measurable.

Source stop/inactivity, invalid input/time or >250 ms feature gaps reset gain/history. Actual source changes also reset candidate values/plots; actual rate/FFT changes rebuild ranges and restart the adaptive state. Connected silent tabs remain connected and let gain decay; pausing local generated playback resets the inactive adaptive session. Default app callers have no diagnostic observer and perform none of this work.

## Approved safeguards and measurement definitions

| Safeguard | Result |
|---|---|
| Clean silence output exactly zero | Pass |
| −60 peak dBFS noise control ≤0.005 | Pass: maximum 0.001822 |
| Gain 1…2×, initial 2 seconds at 1× | Pass: observed maximum 1.996683× |
| No gain increases below −50 dBFS RMS | Pass |
| Quiet output never beyond 2× fixed | Pass: maximum ratio 1.959179 |
| No additional loud-step clipping after 1 second | Pass: zero seconds |
| Reset gain/history/controls | Pass |
| Accepted fixed MI02a results preserved | Pass |

Silence/noise checks start only after a whole FFT window plus one 128-frame render quantum has cleared the previous labeled section. Otherwise the analyser still contains the old tone. Section averages include those boundary windows; a nonzero full-section silence average is a prior-signal FFT tail, not sustained silent activation. Additional clipping means a **normalized control** reaches 1 where its corresponding fixed control is below 1; this is not recorded/audio waveform clipping or audible distortion.

Pumping and cadence were measurements, not additional post-result acceptance thresholds. Per-hit gain dip compares maximum gain in the 150 ms before a labeled synthetic hit with minimum gain in the following 250 ms. It is a diagnostic proxy, not musical event detection or proof of audible pumping.

## Corpus and results

Nine deterministic 33-second fixtures cover clean silence; −60 dBFS white noise; quiet intro → loud passage → silence at 100/1000/8000 Hz; loud → quiet → loud; a sustained tone; 54 repeated loud hits over a quiet bed; and noise → quiet tone → noise. Quiet tones are −36 peak dBFS, loud tones/hits −6, sustained tone −24. Existing fixtures/seed remain unchanged; optional piecewise-noise intervals are used only by the new fixture definitions.

Native analyser timelines at actual 44.1/48/96 kHz are replayed at 30/60/120 calls/s: **81 cases**, twice exactly in one Brave/Chromium 156 headless process. [Numeric synthetic aggregates](evidence/mi02b-range.json), [complete browser verification](evidence/mi02b-browser-verification.json). All approved safeguards passed; no failures were hidden or thresholds retuned.

Passing safeguards does **not** demonstrate that adaptation is preferable:

- The adaptive path introduced up to **0.449887 seconds of extra control clipping**, all within the allowed first second of a loud step. Fixed control clipping was zero. The grace-period safeguard allows this, but it remains a real cost.
- The repeated-hit fixture produced up to **0.053004× gain reduction** around a hit. At 48 kHz, total extra clipping across the hit fixture was 0.098667/0.085333/0.077333 seconds at 30/60/120 calls/s, with gain-dip proxy 0.053004/0.049031/0.045137×. Cadence changes what the RMS windows observe; this is not a universal pumping bound.
- At 48 kHz/60 calls/s, the 1 kHz intro's mean fixed/adaptive quiet control was 0.022375/0.036059. After the loud step, the mean was 0.706458/0.733787 and extra initial clipping lasted 0.434667 s. Quiet content was lifted even though it was intentionally quiet.
- History matters: the reverse loud/quiet/loud fixture's quiet section had mean gain 1.472861× versus 1.610573× for the intro case. Identical quiet levels therefore map differently after different passages.
- Low noise by itself kept gain at exactly 1×. Noise after a boosted quiet passage stayed below the approved ceiling while gain returned toward 1×. Clean silent output was exactly zero once the prior FFT window cleared.

The primary sweep used ~16.27 s offline analysis and ~4.33 s replay/report wall time. Largest temporary FFT array trace was 32,432,128 bytes, one fixture at a time; this is not total heap/CPU/GPU profiling or target-device performance evidence. Full synthetic evidence is local. These numbers do not establish native capture permissions, audible playback, musical taste or source equivalence.

## Verification and checkpoint

Passed: 18 test files, lint, build/typecheck, diff whitespace check. New unit coverage verifies physical-time hold/rise/reduction at 30/60/120, no gain increase from noise, non-gated quiet input, a shared gain without mutating fixed values, stable view reset, invalid/discontinuous/inactive resets, actual observer reset, deterministic piecewise noise, reject-empty/duplicate reports, and fair early-versus-post-grace clipping accounting. Existing legacy/energy/source/scene tests remain intact.

The CDP browser runner repeated 216 MI01, 432 MI02a and 81 MI02b cases, checked synthetic JSON/CSV and incomplete cancellation, retained the **range report** while testing mocked capture/export restrictions, source cleanup and production exclusion, and verified unchanged generated playback through all landscapes. Its capture API is mocked with generated audio; no native picker is opened or bypassed. UI/synthetic source tests do not claim real-tab permission or audible-output validation.

[Playwright Chromium 159](evidence/mi02b-playwright.json) separately showed nine range rows, three plots, nine generated range choices and no page overflow. At fixture volume 1 the actual generated 1 kHz intro showed gain 1.3000× and midrange fixed/adaptive 0.02242/0.02914; Pause returned gain/target to 1×, slow RMS/session time to zero. [Screenshot](evidence/mi02b-range-table.png) shows generated input only (later in that same quiet passage). The owner still needs to review live-song diagnostics and usefulness; no private captured media was inspected by the agent.

**Recommendation:** retain fixed linear scaling as the preferred candidate. Bounded adaptation passes the agreed safeguards but introduces history-dependent quiet boosts, initial saturation and gain movement. Do not promote it, add a gate, retune to conceal costs or change any landscape in this checkpoint. Owner review can decide whether MI02's energy choices are ready to close; MI03 onset detection still requires its own bounded plan/approval. No commit or push; suggested focused commit: `Add MI02b lab range and noise comparison`.

## Owner checkpoint — 2026-11-18

Owner reported “it passed” after the MI02b testing instructions. Accept the lab checkpoint for continuation and retain fixed linear as the preferred development candidate. Keep all adaptive costs and the MI02a soft-knee failure visible; this feedback does not promote adaptive scaling or a production default. No test-mode/source/browser/track details were supplied, so no additional native/audibility/hardware/musical evidence is asserted. Next is a separately approved MI03 onset-event plan/criteria; no implementation, scene migration, commit or push authorized here.
