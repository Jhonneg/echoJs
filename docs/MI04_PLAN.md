# MI04 — musical context implementation plan

2026-11-20 · owner approved this scope/defaults/criteria with “proceed.” Inspected clean base `3ed0929`; MI03 lab checkpoint accepted. This follows [the original Music Intelligence roadmap](ECHO_Music_Intelligence_Roadmap.md#mi04--musical-context-without-overclaiming), then stops before G1 and scene migration. [MI04_RESULTS.md](MI04_RESULTS.md) records the implemented lab and failed activity cadence gate; defaults/criteria below remain unchanged. The proposed onset-window follow-up is separately gated.

Follow-up checkpoint: owner subsequently approved the proposed 40 ms DEV onset observation correction. [MI04_WINDOW_RESULTS.md](MI04_WINDOW_RESULTS.md) records the synthetic MI03/MI04 gates now passing, with added latency inside existing limits and remaining weak-mixture misses. This does not authorize G1 or scene/production migration.

## Architecture audit and scope

The existing DEV observer in `diagnostics.ts` receives both adapters' shared analyser FFT, actual format, monotonic timestamps and lifecycle state. It already computes calibrated broad-band RMS via `energy.ts` and accepted immutable events via `onsets.ts`. `main.ts` paints at 5 Hz; `baseline.ts` supplies native offline traces for deterministic replay at 30/60/120 updates/s. Synthetic exports, cancellation and source locks are already separate from transient live-tab diagnostics.

Add one internal context calculator after energy/onset processing in this development lab. Feed it the existing FFT, calibrated RMS, monotonic time and accepted events; reuse it in synthetic replay. Do not add another analyser, scheduler, AudioWorklet, dependency, production feature contract or capture-specific scene code. Preserve MI02 fixed calibration, the corrected MI03 detector and its known unequal-mixture misses. A missed onset also reduces activity; context cannot recover events the detector rejected.

The result is three continuous artistic controls, not loudness metering, BPM, instrument recognition or musical section classification. Production `AudioSignal`, normalization/flux, adapters, frequency boundaries and all landscapes remain unchanged. Crimson remains the future pilot after MI04 and G1 approval.

## Proposed definitions and defaults

All controls are bounded to [0, 1]. Keep raw measurements beside them in lab diagnostics so clipping and smoothing remain visible. These are initial engineering defaults for approval, not measured or pre-validated results.

| Control | Raw input and mapping | Envelope time constants |
|---|---|---|
| Intensity | `broadRms = hypot(bassRms, midrangeRms, trebleRms)` from calibrated MI02 measurements; target `min(1, broadRms / 0.5)` | 0.75 s rise, 1.5 s fall |
| Brightness | Power-weighted FFT centroid over existing 20 Hz…min(20 kHz, Nyquist) coverage: `sum(frequency * power) / sum(power)`, finite bins only; target `clamp(log2(centroidHz / 100) / log2(10000 / 100), 0, 1)` | 0.5 s rise and fall |
| Activity | Sum accepted event strengths whose peak timestamps are in `(now − 4 s, now]`; divide by 4 s, then by reference **1 strength-unit/s**, clamp to [0, 1] | 0.5 s rise, 1 s fall |

For every envelope use `value += (target − value) * (1 − exp(−delta / tau))`, selecting rise/fall by target direction. A time constant is not total settling time. Brightness is frequency emphasis, independent of intensity scaling: 100 Hz maps to 0, 1 kHz to 0.5, 10 kHz to 1 before smoothing. Use power `10^(dB / 10)`, not the production visual normalization or MI02b adaptive gain.

Below broad RMS 0.002, brightness is marked invalid and its target fades toward zero; retain raw centroid only as a nullable diagnostic. This confidence floor affects brightness only: do not gate intensity, mutate audio or erase quiet energy. Equal spectral shape at different above-floor amplitudes should give the same brightness. A zero brightness value without validity would otherwise confuse silence with a low-frequency source.

Also display accepted band-event count/s and strength-units/s before clipping. Startup always divides by the full four-second window, avoiding an inflated rate from the first event. Simultaneous low/mid/high events count separately; activity measures accepted band-event density, not instrument hits or tempo. Count each session/sequence once while it remains in the event view. Expire by event peak time, not UI paint time; report emission delay separately. Never reinterpret continuous legacy flux as events.

## State, lifecycle and privacy

Use a reusable typed numeric view with session/time, intensity/brightness/activity, raw targets/RMS/centroid/validity and count/strength rates. Keep a fixed-capacity 256-entry ring of accepted peak times/strengths and a session/sequence consumption cursor; no per-update allocations or growing history in the new calculator. A capacity breach must be reported as a failed invariant, not silently drop events. Normal MI03 per-band spacing bounds the four-second occupancy below that capacity.

Reset all context values/cursors/history on source/format/session change, stop, seek, inactive playback, nonfinite/nonpositive delta or a gap >250 ms. Reuse MI03's seek suppression and FFT-window clearing before priming context; start from zero with the first valid sample priming the clock. Reset is an explicit discontinuity; ordinary active silence decays normally. A connected silent tab remains active. Native FFT state during pause/seek must not leak stale energy back into context.

Live measurements remain transient and non-exportable. Only generated fixture aggregates enter JSON/CSV. Keep frame-rate state outside React; sample a bounded 30-second context plot at the lab's existing 5 Hz. Do not inspect/store captured media or automate native picker permissions.

## Bounded implementation

1. Add `context.ts` for calculation/state and focused independent math, event-consumption and lifecycle tests. No changes to the accepted onset algorithm or energy curves.
2. Add the view to `diagnostics.ts` after the existing energy/onset updates, plus three meters/plots, raw diagnostics and a clearly separate **Run context comparison** suite in `main.ts`. Preserve source/export locks and earlier reports.
3. Add `contextComparison.ts` with twelve labeled synthetic templates: silence; −60 peak dBFS noise; calm sustained bass drone; amplitude sweeps at 100/1000/8000 Hz (−36/−24/−12/−6 dBFS, three-second plateaus); equal-level frequency steps; equal mixture; sparse changing-note melody; busy multi-band pulses; sparse-to-busy pulse-rate steps; quiet intro → louder passage with unchanged spectrum. Keep each template ≤20 s and use deterministic generator parameters/labels, without claiming the musical descriptions are classifiers.
4. Replay each template at actual 44.1/48/96 kHz, three whole-fixture offsets 0/7/17 ms and 30/60/120 updates/s: **324 context rows**. Reuse one native 120 Hz trace per fixture/rate, keep all errors/unsupported formats and repeat the complete run. Retain prior MI01–MI03 regressions; never count missing/duplicate/incomplete rows as PASS.
5. Extend the existing browser runner, retain numeric evidence, document results/limits and stop for owner review. No production promotion or scene preview in this task.

## Proposed acceptance criteria

| Check | Required result |
|---|---|
| Bounds and continuity | Finite controls in [0, 1]; ordinary updates obey the documented exponential step bound, without overshoot or event-sized jumps. Reset is explicitly exempt. |
| Intensity contrast | Strictly increasing settled means across all four amplitude levels. Last 0.5 s of each three-second plateau within 5% of calibrated fixed target (absolute floor tolerance 0.002); −12→−6 dBFS settled difference ≥0.15. |
| Brightness meaning | Pure-tone settled centroid within max(one FFT bin, 2% of frequency) of labeled frequency; normalized brightness within 0.03 of documented mapping after ≥3 s. At the same frequency, above-floor level changes differ by ≤0.03. Equal-level frequency steps increase brightness. |
| Activity correctness | Injected labeled event streams match an independent rolling-window sum/rate oracle within 1e−9, including exact boundary expiry and duplicate views. Same event strength with higher rate increases activity; same rate with higher strength increases activity, below saturation. Accepted events are the native replay oracle; fixture ground-truth mismatches stay separately visible. |
| Drone versus busy | After the initial drone event leaves the window, raw drone activity is zero. Busy steady pulses have greater activity than sparse pulses at matched per-event strength; no BPM or instrument claims. |
| Silence/noise and decay | Clean-silence controls zero from a cleared session. −60 dBFS noise intensity ≤0.005 and brightness invalid; report any accepted noise events as failures. After a loud source becomes clean active silence, all controls ≤0.005 within 10 s of the final signal/event. |
| Cadence | On native steady labeled passages, pairwise 30/60/120 means differ by ≤0.03 for intensity/brightness and ≤0.05 for activity, measured over the same final one-second interval after settling. Retain transition curves/max differences and actual onset counts separately; do not hide transition mismatch in steady averages. |
| Lifecycle/source independence | Zeroed histories/values and distinct session after every reset; no event replay. Identical numeric input/timestamps produce identical context irrespective of source label. Generated local/capture-mock parity uses declared timing tolerances; no claim of native capture equivalence. |
| Compatibility/privacy | Prior MI03 core/stress still pass; legacy features unchanged, production assets exclude context/lab, both source paths retain existing cleanup/export behavior. No real live data in exports. |

Use direct numeric oracles for transfer curves, centroid, exponential responses and rolling sums; use native fixtures to measure FFT/cadence behavior. Do not tune parameters or widen criteria after observing results. If a core check fails, preserve the report and propose one focused correction for review. Slow attacks, changing pitches, unequal overlapping sources and the inherited MI03 release-mask limitation remain diagnostic limitations, not hidden claims of accuracy.

## Verification and stop

Run focused plus existing tests, lint, build/typecheck, whitespace check and the full synthetic browser verifier. Check generated local/live meters, pause/seek/reset, portrait sizing, JSON/CSV and cancellation, retained reports during capture mocks, all-landscape continuity and production exclusion. Playwright MCP is unavailable in this resumed session; use the existing installed-browser/CDP runner for applicable checks and report any unavailable evidence. Do not install new tools to fill that gap. Native permissions, audible behavior, owner musical usefulness and hardware performance remain separate manual checks.

Deliver `MI04_RESULTS.md` with exact manifest/settings, per-category pass/fail, raw/normalized/transition measurements, counts/timing, memory/processing measurements where actually taken, errors and limitations. Stop for owner review on calm drone, busy percussion, sparse melody, quiet-to-loud passage and silence using permitted music. G1 then requires matched-source/volume legacy-versus-candidate feature review before any Crimson migration; any preview needed for G1 receives its own bounded approval. Commit/push/deployment are not authorized.
