# MI04 — musical context results

**Current checkpoint:** the owner-approved 40 ms onset-window follow-up passes the unchanged synthetic MI03/MI04 criteria. See [MI04_WINDOW_RESULTS.md](MI04_WINDOW_RESULTS.md) for corrected evidence, added decision delay and remaining weak-mixture misses. The failed initial baseline below is preserved for comparison.

2026-11-20 · owner approved [MI04_PLAN.md](MI04_PLAN.md) with “proceed.” Base `3ed0929` plus preserved pending planning documents. **The development lab is implemented; the numerical MI04 gate is FAIL.** Intensity and brightness pass their agreed criteria. Activity fails cadence consistency on the expanded onset inputs. Stop before G1, production promotion or Crimson refinement.

## Implemented scope

`context.ts` adds slow intensity from calibrated broad RMS, power-centroid brightness with confidence validity, and a four-second accepted-onset strength rate. Settings, normalization, envelope constants, event window and criteria match the approved plan; none were retuned after measurements. Session/sequence consumption prevents replay of visible old events. Fixed 256-entry time/strength rings use 4,096 typed-array bytes, plus scalar state; this is not a total heap measurement. The new calculator creates no frame-update arrays.

The existing DEV observer computes context after energy/onsets on the same FFT and monotonic clock. Context clears on source/format/session changes, seek, inactive playback, invalid time and gaps. It shares the existing seek FFT-clearing interval and primes from zero. The lab adds three meters/target plots, raw RMS/centroid/validity/count/strength rates, a separate context comparison and synthetic JSON/CSV. Plots retain at most 151 samples at 5 Hz. Live measurements remain transient and non-exportable.

No changes to production `AudioSignal`, normalization/flux, adapters, MI02 calibration, the accepted MI03 detector, landscapes, dependency graph or rendering backend. Production asset remains `index-C7O-uO6d.js`. Source labels/browser capture details are absent from the context calculator.

## Native synthetic evidence

The approved twelve templates are implemented: silence, −60 dBFS noise, drone, three amplitude sweeps, equal-level frequency steps, equal mixture, sparse melody, busy pulses, rate steps and quiet-to-loud passage. Base durations are 14–20 seconds (plus the whole-fixture phase offset). Each has offsets 0/7/17 ms, actual 44.1/48/96 kHz, and 30/60/120 updates/s from the common native 120 Hz FFT trace: **324 rows**. Both complete runs matched exactly in-process in Brave/Chromium 156.

Primary evidence: [full context aggregates and sampled curves](../../evidence/music-intelligence/mi04/mi04-context.json), [summary](../../evidence/music-intelligence/mi04/mi04-summary.json), [browser verification](../../evidence/music-intelligence/mi04/mi04-browser-verification.json), and [lab screenshot](../../evidence/music-intelligence/mi04/mi04-context-lab.png). No PCM, raw FFT arrays or real captured content is retained.

| Check | Measured result | Verdict |
|---|---|---|
| Bounds, per-update exponential continuity, ring capacity, reset | All 324 rows pass | PASS |
| Rolling activity sum/rate versus independent event-window oracle | Maximum error 0 | PASS |
| Amplitude contrast, three frequencies/four levels | Strict ordering; minimum −12→−6 contrast 0.350850, required ≥0.15; plateau criteria pass | PASS |
| Centroid, brightness mapping and level invariance | All applicable tone/step checks pass | PASS |
| Steady cadence: intensity | Maximum difference 0.005735, allowed 0.03 | PASS |
| Steady cadence: brightness | Maximum difference 0.016208, allowed 0.03 | PASS |
| Steady cadence: activity | Maximum difference 0.156987, allowed 0.05; **30 failed comparisons** | FAIL |
| Sparse→busy activity ordering | All 27 rate-step rows pass | PASS |
| Clean silence / quiet noise | Silence zero; noise intensity maximum 0.001107, brightness invalid, no noise events | PASS |
| Ten-second active-silence decay | Maximum 0.000905, allowed 0.005 | PASS |

Row checks apply to their fixture categories; silence/noise/contrast checks are not claims about unrelated templates. Native ten-second decay coverage is the drone, equal mixture and busy-pulse tails, alongside the direct unit exponential/decay tests. Other templates have shorter tails. Cadence comparisons use the same final one-second labeled interval; amplitude plateau scoring uses the final half second. Retained sampled transition maxima are 0.017413 intensity, 0.073770 brightness and 0.240770 activity. These transition diagnostics are separate from the approved steady-interval thresholds and per-update continuity bound.

The failed activity comparisons are twelve frequency-step windows, six sparse-melody windows and twelve rate-step windows. Each category has 27 rows; the amplitude, silence/noise, drone, equal-mixture, busy-pulse and quiet/loud categories have no failed cadence comparisons. The report does not average these failures away.

## Failure attribution and bounded next proposal

The context event-window oracle agrees exactly with emitted onset input. The new fixtures expose upstream count/strength dependence on analysis cadence:

- At 44.1 kHz, phase-0 frequency steps, 30/60 updates/s accept all three attacks; 120 updates/s accepts only the first. The later steady-window activity is about 0.086 at 30/60 versus about 0.0013 and 0.00002 at 120. Across the expanded corpus there are **2,295 labels, 2,265 matches, 30 misses and zero extras**; all misses are on frequency steps.
- Rate-step and sparse-melody cases can accept the same counts but give different event strengths. For phase-17 rate steps at 44.1 kHz, sparse-window activity is approximately 0.206/0.302/0.242 at 30/60/120 updates/s. This produces cadence failures without a counting error in the context ring.

MI03 still passes its approved original core/stress matrix. Its earlier strength criterion established monotonicity within a cadence, not identical strength across cadences or reliable pitch transitions. These expanded failures remain visible; neither detector behavior nor MI04's 0.05 criterion was changed to hide them. Existing unequal-mixture limitations also remain.

**Proposed separate follow-up, not implemented:** investigate one bounded onset attack-window correction in the DEV detector. Start from a **40 ms observation window after the detected novelty peak**, collecting maximum band-RMS rise and the band's contribution at that RMS maximum before qualifying/emitting one immutable event. Compare falling-energy rejection against that band-qualified measurement, rather than unconditionally rejecting a rising new band because the preceding spectrum is declining. This is a hypothesis to address both early sampled strength and missed frequency transitions, not a validated fix.

Keep existing thresholds, references, 120 ms spacing, event identity, observed peak clock, 100 ms peak/150 ms emission limits, the full MI03 core/stress and all MI04 criteria. Record actual later emission time; add no backdating. A 40 ms window adds decision delay and must earn its place against the latency checks. Reproduce the failing counts/strengths first with accepted/rejected candidate traces; if those traces contradict this hypothesis, report the evidence before substituting another algorithm. Do not add a backend/AudioWorklet, relax criteria, switch activity to unweighted counts or change production mappings. Stop after the correction's report if separately authorized.

## Verification and remaining review

Passed: **20 test files**, lint, build/typecheck and whitespace checks. Seven new focused tests cover independent exponential response, power-weighted centroid and level invariance, confidence without intensity gating, rolling-window oracle/duplicate consumption, activity ordering, exact expiry/decay, source/gap/reset/invalid input and visible capacity overflow. Existing observer tests now verify context clears on seek without changing legacy output.

The completed browser runner repeats MI01 (216), MI02a (432), MI02b (81), MI03 (783) and MI04 (324). Integration passes: generated local meters, seek/pause/Stop, raw-target parity with a generated capture mock, source replacement/native-ended callback mock, denial/missing audio/late acquisition, export locks with report retained, JSON/CSV, incomplete cancellation, portrait layout, one advancing generated player across four landscapes and production exclusion. **Runner PASS means integration/reproducibility; `contextAssessment.pass` remains false.**

Two runner issues were corrected without DSP changes: five seconds was insufficient for a browser to finalize a fully received JSON download, so the runner waits up to 30 seconds ([diagnostic evidence](../../evidence/music-intelligence/mi04/mi04-runner-download.json)); source parity now waits 350 ms for the FFT and 5 Hz paint to settle. Focused checks and the final full run pass. Source parity compares steady raw intensity/brightness targets, with tolerances 0.002/0.03. Activity/envelopes have different live timelines; identical-input/time equality is tested separately, not inferred from capture mocks. No native picker was opened. Playwright MCP was unavailable; installed-browser/CDP checks were used.

One context sweep measured ~33.80 s offline and ~16.74 s replay/oracle/report time; maximum temporary FFT trace 19,668,992 bytes. These are generated lab wall-time/array measurements, not isolated context CPU, total heap or hardware/graphics/capture latency claims. The existing build-size warning remains. Musical usefulness, native permissions, audible behavior and real-device performance remain manual pending.

To review permitted music, open `/audio-lab.html`, use **Share a tab**, then inspect **MI04 · Musical context**. No live export is available. The context gate remains failed regardless of a subjective musical preference until the numerical issue is resolved or a different criterion is explicitly reviewed and approved.

**Stop for owner review of the failure and proposed follow-up.** G1 and Crimson migration remain pending. No commit/push/deployment. Suggested checkpoint commit: `Add MI04 context diagnostics and failing cadence baseline`.
