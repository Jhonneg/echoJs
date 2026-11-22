# MI02a — development energy comparison

2026-11-18 · owner-approved lab-only comparison and numerical targets · base `c417b8d` plus working MI02a changes. Owner accepted the lab checkpoint for continuation (see dated feedback below); no production switch or overall MI02/feature-quality approval.

## Scope and use

Open the development server's `/audio-lab.html` and scroll to **MI02a · Energy comparison**. Live synthetic playback and owner-selected shared-tab diagnostics show estimated band RMS, legacy values, fixed linear values and soft-knee values for three broad bands and six sub-bands. The second graph compares normalized controls for the selected graph band. Broad legacy values are unsmoothed normalized levels; six-band legacy values are fast envelopes. Candidates are instantaneous windowed estimates, so their attack shapes are not equivalent to those existing envelopes.

**Run energy comparison** disconnects live input and measures the synthetic corpus; it does not analyse or export the shared song. **Run all offline baselines** retains the MI01 legacy corpus/report. Only one suite/source is active. Cancellation/errors produce an incomplete report, never an acceptance result. Synthetic JSON includes the full assessment; synthetic CSV includes steady-tone calibration/transfer rows. Pending/active sharing disables both exports, with handler guards. There is no live-source export, recording, upload, title/URL collection or video inspection. UI histories remain bounded to 30 seconds/151 samples at 5 Hz. Native sharing and real-song review remain manual.

The audio adapters, `AudioSignal`, frequency boundaries, legacy normalization/envelopes/flux, analysis scheduling and every landscape remain unchanged. No automatic gain, noise gate, new onset detector, candidate envelopes, production contract, dependency or backend was added. Production output retains `index-C7O-uO6d.js`; diagnostics/energy code is absent from its assets. The phase skill remains unavailable; followed AGENTS/WORKFLOW and consulted Context7 for the Web Audio transform specification.

## Measurement and fixed candidates

The [Web Audio specification](https://webaudio.github.io/web-audio-api/#fft-windowing-and-smoothing-over-time) defines AnalyserNode's periodic Blackman window and 1/N-scaled DFT. Its mean squared window is `0.42² + (0.5² + 0.08²)/2 = 0.3046`. For each unchanged band, integrate positive-frequency bin powers and compensate:

`estimated RMS = sqrt(sum(2 × 10^(binDb/10)) / 0.3046)`

DC, if included, has weight 1 rather than 2. Nonfinite bins are ignored. Unlike the legacy path, this development estimate does not reject finite bins at −80 dB or clip positive-bin dB. It sums integrated power rather than dividing by bin count: a wider band containing more independent signal should contain more energy. Nyquist-clipped half-open ranges reuse `binRange`.

This is a **stationary-signal, window-corrected RMS estimate**, not exact unwindowed RMS during a transient, acoustic loudness, LUFS, an instrument classifier or an onset detector. Some energy crosses neighbouring bands at finite FFT resolution. Full time-domain window RMS remains separately measured and displayed. The FFT window remains 46.44 ms at 44.1 kHz/2048 and 42.67 ms at 48 kHz/2048 or 96 kHz/4096.

Both fixed candidates use **reference RMS 0.5**, chosen before measurements to leave room above the approved −6 dBFS sine test:

- Linear: `min(1, rms/0.5)`.
- Soft knee: `rms/(0.5+rms)`.

They share the same measured RMS and have no history-dependent gain or per-band sensitivity boosts. Linear saturates once RMS reaches 0.5 (about −3 dBFS peak for a sustained sine); validation here covers −36…−6 peak dBFS, not all possible music levels. This limitation needs owner evaluation before any future selection. Silence/noise measurements provide no reason to add automatic gain or a speculative gate in this task.

## Approved targets and corpus

Targets were approved before implementation and were not changed after seeing results:

| Check | Target |
|---|---|
| Steady-tone RMS calibration | Within ±1 dB of known sine RMS |
| Transfer curve | Strictly increasing at −36/−24/−12/−6 peak dBFS |
| Loud-end contrast | At least 0.15 normalized difference, −12 → −6 dBFS |
| Clean silence | Exact zero candidate output |
| −60 peak dBFS white noise | Candidate output ≤0.005 |
| Bounds/lifecycle | Finite 0…1 controls; reset and source/export behaviour preserved |

The synthetic energy corpus has 48 fixtures: all 24 MI01 fixtures plus four amplitudes at each of 47/141/469/1500/4000/10000 Hz to cover six-band centres. Each actual 44.1/48/96 kHz context produces a common 120 Hz native FFT timeline, replayed at 30/60/120 calls/s: **432 rows**. Actual quantized audio times drive the unchanged legacy replay. Reference steady RMS is `10^(peakDbfs/20)/sqrt(2)`. Calibration and transfer comparisons average the final quarter-second of each isolated sustained tone, excluding its last 5 ms. Noise/silence and bounds are checked across the whole trace, not just that interval.

Nine tone frequencies × three rates × three cadences yield 81 amplitude groups per curve. Both broad and six-band values are checked when the tone lies within that band. The 4 kHz calibration tone sits exactly at the broad mid/treble boundary; each broad region physically contains only part of its windowed energy. Its six-band presence estimate is checked against full-tone RMS; neither partial broad region is falsely expected to equal the entire tone. The report retains the partial broad values and boundary flag. Existing boundary/mixed/edge fixtures remain observations; no frequency boundaries were moved to improve results.

## Results

Primary [synthetic aggregate data](../../evidence/music-intelligence/mi02a/mi02a-energy.json) was measured in Brave/Chromium 156 headless on Linux. Two sweeps matched exactly within that process; all 432 rows were available and finite. This is local repeatability, not a promise of bit equality across processes/browsers. [Final browser regressions](../../evidence/music-intelligence/mi02a/mi02a-browser-verification.json) record repeated measurements, synthetic capture mocks, report privacy and production exclusion. No PCM or FFT arrays are retained.

| Target | Linear | Soft knee |
|---|---:|---:|
| Maximum RMS calibration error (shared measurement) | 0.494768 dB — pass | 0.494768 dB — pass |
| Monotonic/bounded | Pass | Pass |
| Largest noise control | 0.001039 — pass | 0.001038 — pass |
| Silence | 0 — pass | 0 — pass |
| Smallest loud-end contrast | 0.333975 — pass | **0.149779 — fail** |

Worst calibration error and contrast are in six-band bass for a 100 Hz tone at 48 kHz/120 calls/s. Energy also appears in the neighbouring subBass range due to the finite window, reducing the bass-only RMS estimate. Maximum broad calibration error away from a boundary was 0.027360 dB. The soft knee's failure is small but real against the approved test: **0.149779 < 0.15**. No rounding waiver, reference retuning, threshold change or promotion was applied. It remains visible as FAIL in the lab.

Example: 100 Hz, 48 kHz/2048, 60 calls/s, broad bass steady mean:

| Peak input dBFS | Estimated RMS | Legacy level | Linear | Soft knee |
|---|---:|---:|---:|---:|
| −36 | 0.011200 | 0.148819 | 0.022400 | 0.021910 |
| −24 | 0.044589 | 0.410392 | 0.089178 | 0.081876 |
| −12 | 0.177512 | 0.734818 | 0.355023 | 0.262005 |
| −6 | 0.354182 | 0.846834 | 0.708364 | 0.414645 |

Both candidates are quieter in absolute control value than the legacy curve while retaining more loud-end separation. That alone does not prove better artistic response. Changing mappings or boosting scene gain to compensate would invalidate this task's boundary. The [synthetic meter screenshot](../../evidence/music-intelligence/mi02a/mi02a-energy-table.png) demonstrates the table; its columns are band, estimated RMS, legacy value, linear, soft knee, and its input includes the fixture volume attenuation.

An independent [Playwright Chromium 159 run](../../evidence/music-intelligence/mi02a/mi02a-playwright.json) completed all 432 rows and displayed the correct verdicts: calibration error 0.489603 dB, linear minimum contrast 0.334174, soft minimum contrast 0.149810. Both versions agree on pass/fail. These differences are retained, not treated as exact cross-browser equality or a basis for weakening the threshold.

## Verification and checkpoint

Passed: 17 test files, lint, build including typecheck and whitespace check. Tests cover the specified window correction against an analytical bin-centred sine spectrum, distributed power, invalid bins/silence, fixed monotonic curves, approved contrast for an ideal signal, steady comparison, default legacy-output parity, stable reset storage and rebuilding ranges when the actual rate changes. Existing source/scene regressions remain intact.

The repeatable CDP runner checks the 216-row MI01 corpus and 432-row energy corpus twice in-process, synthetic JSON/CSV, incomplete cancellation, shared-tab-path generated audio through a **mocked capture API**, export lock while an energy report is retained, source switching/reset/denial/no-audio/late acquisition, all-landscape generated playback and unchanged production assets. A fixed 200 ms pause/reset assertion exposed a UI-snapshot timing race during final rerun; it now waits for the actual paused/reset display state, without changing application/DSP timing. Playwright also verified nine comparison rows, two graph canvases, no page overflow and honest PASS/FAIL messaging. No native picker was opened/bypassed and no private source was inspected.

Offline wall times and trace-array sizes are retained in the JSON as lab-run metadata, not CPU profiling, hardware performance or end-to-end latency evidence. Owner review of live-song diagnostics, real source audibility/permission behaviour and artistic usefulness remain pending. The full MI02 energy phase and later feature-quality/pilot gates remain unapproved.

**Recommendation:** retain linear as the only candidate meeting this task's numeric targets and review it in the lab with matched source volume. Keep the soft knee's failure recorded. Do not select either as a production default. Owner review should precede any separately scoped remaining MI02 work or curve retuning; onset work/scene migration stays later. No commit or push; suggested commit: `Add MI02a lab energy calibration comparison`.

## Owner checkpoint — 2026-11-18

After running the test, the owner reported “looks like it passed.” Accept MI02a's lab result for continuation and retain linear as the development candidate. Soft knee remains a failed candidate against the unchanged contrast threshold; neither curve becomes a production default. The owner supplied no test-mode/source/browser/track/volume or detailed silence/audibility observations, so this feedback does not add specific native-capture, musical-quality or hardware evidence. Remaining MI02 work and subsequent gates still require bounded plans and approval. Recommended next is a lab-only fixed-reference versus bounded slow-adaptation/noise review; no next implementation, commit or push authorized here.
