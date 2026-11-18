# MI03 — initial onset detector results

**Current checkpoint:** the owner-approved release-attribution correction now passes the unchanged synthetic core gate. See [MI03_CORRECTION.md](MI03_CORRECTION.md) for corrected evidence, unequal-mixture limitations and pending owner review. The initial failed baseline below is preserved unchanged for comparison.

2026-11-18 · owner authorized MI03 scope/criteria with “go ahead” after clarifying that the original Music Intelligence sequence is unchanged. Base `bbdee7b` plus pending design documentation and MI03 changes. **Implementation is available in the development lab; the numerical core gate FAILS.** No MI04/scene migration or production promotion.

## Implemented scope

The lab now shows per-band novelty/adaptive thresholds/RMS rise/rejection decisions, immutable onset events with session/sequence/peak/emission/strength, event ages, and a selected-band novelty graph. The display samples at 5 Hz; events persist between display frames in a maximum 256-event/10-second history, with the latest 32 rows shown. Live clocks are performance seconds, not song position or end-to-end capture time.

The detector follows the approved initial defaults in [MI03_PLAN.md](MI03_PLAN.md): positive per-bin L2 novelty with calibrated window scale; a timestamped one-second median +3 MAD threshold and 0.0005 floor; one-sample local-peak confirmation; calibrated RMS/rise/novelty-share and falling-energy guards; 120 ms per-band spacing and hysteresis; strength derived from unsaturated RMS rise. It uses fixed candidate measurements, never MI02b adaptive gain. Scalar histories reuse fixed storage and sorted novelty arrays; median/MAD does not allocate FFT histories or sort buffers each tick. Settings and criteria were **not retuned after results**.

The existing DEV observer receives the same analyser FFT after legacy processing, with no additional analyser/clock/backend. The new event types are internal to the lab; `AudioSignal`, adapters, frequency boundaries, legacy normalization/flux and all landscapes remain unchanged. Production output remains `index-C7O-uO6d.js`; detector/lab markers are absent from production assets. No dependency was added.

Stop/source/format/inactivity/gap resets clear histories and give a distinct session identity. DEV-only local-element seeking/seeked listeners reset diagnostics, are removed on release and leave legacy features untouched. The detector waits for one actual FFT window after seek and primes without fabricating an attack; observer activity also excludes the local seeking interval. This handles old/new waveform mixing during a seek without changing playback or legacy seek behavior.

All capture/source/export restrictions remain: native sharing is user initiated; automated capture checks use generated audio behind an explicit mock; no real/private source is inspected, recorded or uploaded. Live event histories/measurements are never included in exports. Only generated synthetic numeric summaries may be saved.

## Synthetic evidence

The manifest packs amplitude levels into labeled sequences to avoid redundant native contexts while retaining the approved checks:

- 26 core templates: silence/noise; 100/1000/8000 Hz sustained and 50/100 ms attacks at −36/−24/−12/−6 peak dBFS; isolated repeated attacks at 250/500 ms spacing; repeated attacks over a quieter same-band carrier; equal-level multi-band mixture; high-only sharp attack; and sustained-release baseline.
- Three separate 20 ms stress templates, one per frequency with all four amplitude levels.
- Whole-fixture offsets 0/7/17 ms preserve relative carrier/hit phase.
- 87 offset fixtures × actual 44.1/48/96 kHz × 30/60/120 updates/s = **783 cases: 702 core +81 stress**.

Native 120 Hz offline FFT timelines are replayed through the same detector used by live diagnostics. Matching is one-to-one per band in the approved 0…100 ms peak window; emission delay is reported separately. Extra/unmatched events never become successful matches by widening windows or changing labels. Strength ordering is checked for identical labeled attack shapes. Legacy transient/flux crossings are recorded as envelope excursions, not passed off as discrete musical events.

[Full synthetic aggregates](evidence/mi03-onsets.json) and [browser verification](evidence/mi03-browser-verification.json) retain the initial results. Two complete native sweeps in Brave/Chromium 156 matched exactly in-process. Cross-browser equality is not assumed. No PCM, FFT buffers or captured media are retained.

| Criterion | Observed | Status |
|---|---:|---|
| All core labeled attacks matched | 5,157 /5,157 | Pass |
| Extra core events | **29** | **Fail: target zero** |
| Wrong-band events within matching windows | **28** | **Fail: target zero** |
| Unmatched events near labeled releases | **29** | **Fail: target zero** |
| Clean silence/noise events | 0 | Pass |
| Isolated sustained-tone events | 324 /324, no extras | Pass |
| Matched peak delay maximum | 52.857 ms ≤100 ms | Pass |
| Matched emission delay maximum | 85.918 ms ≤150 ms | Pass |
| Strength ordering | 1,377 groups, zero failures | Pass |
| Identity/reset, stable histories/legacy parity | Passed targeted checks | Pass |
| 20 ms stress (separate diagnostic) | 324 /324, zero extras | Reported; does not override core failure |

Delay statistics refer to matched events; any unmatched late/wrong event remains an extra and fails its core category. In this initial run all 29 extras are mid-band events on 100 Hz bass fixtures. Twenty-eight fall inside another band's attack matching window; the remaining one occurs after that window. The near-release classification is a timing attribution, not instrument recognition.

Eight of the 702 core cases fail counts: 100 Hz burst-50 and 250 ms over-bed cases at 44.1 kHz/60 Hz/7 ms offset; and burst-50, burst-100, isolated-repeat 250/500 ms and over-bed 250/500 ms cases at 48 kHz/60 Hz/7 ms offset. No labeled attacks were missed. Precise case IDs, extra event times, strengths and rejection counts remain in the evidence. Do not hide those failures behind a high aggregate percentage or the clean stress result.

## Failure-stage diagnosis and next bounded correction

The approved guard evaluates falling total energy at the **candidate peak**, while confirming that peak one sample later. At a short bass release, spectral sidebands can rise before the windowed total has fallen enough to trigger that guard. Pairwise novelty share can then admit a mid-band event belonging to the release.

A [read-only Chromium 159 reproduction](evidence/mi03-failure-trace.json) of the 48 kHz/60 Hz, 50 ms bass/7 ms-offset fixture independently reproduced false mid events. For the −12 dBFS burst starting at 1.507 s and ending at 1.557 s:

- True low event: peak 1.533333 s, emission 1.552 s.
- False mid event: peak **1.568 s**, emission **1.584 s**.
- Total estimated broad RMS was 0.177617 at 1.552 s, 0.175048 at the false peak (only ~1.45% lower, within the approved 5% tolerance), then **0.057257 at confirmation**.
- At the false peak, mid RMS was 0.005185 versus total 0.175048: about **0.088% of total power**. Yet its short candidate/confirmation novelty share passed the initial guard.

This identifies release-window attribution, not missed sensitivity or insufficient latency, as the focused next problem. No detector correction was applied to the accepted first-run settings.

**Proposed next task, pending approval:** add one release-attribution rejection at confirmation: reject a candidate when (a) the existing falling-total-energy test is true at confirmation and (b) the candidate band's saved peak contributes less than the existing 5% power-share bound to total broad power at that peak. Retain the same one-sample lookahead, spacing, strength mapping, numerical acceptance targets and complete core/stress matrix. This uses the confirmation already being awaited and adds no latency or backend. Verify that real isolated/equal-mixture attacks remain matched; report weak new attacks masked by a falling dominant band as a limitation with additional diagnostic mixtures. This is a hypothesis, not a claimed or implemented fix. If it loses legitimate core attacks, leave that failure visible and stop for review.

## Verification and limits

Passed: 19 test files, lint, build including typecheck, production-exclusion and browser integration checks. New tests cover median/MAD versus an independent calculation and time expiry, immutable events/strength ordering on valid synthetic FFT values, band independence, spacing without delayed replay, release/noise rejection basics, bounded history/IDs, reset/priming/gap/invalid input, manifest/matching, and DEV seek listeners clearing diagnostics without changing legacy output or lingering after stop.

The browser runner completed repeated MI01 (216), MI02a (432), MI02b (81) and MI03 (783) matrices, synthetic JSON/CSV, honest core FAIL/incomplete states, generated local seek/reset, capture-mock source/export locks with the MI03 report retained, all-landscape generated playback and absence of detector/lab assets from production. Runner completion means integration/reproducibility passed; it **does not mean the onset core passed**. A narrow-screen overflow caused by longer fixture names was fixed by constraining lab labels/selects. Detector parameters stayed unchanged.

Playwright Chromium 159 verified the generated local event log and captured the independent failing trace; no native picker/private source was opened. A single generated −36 dBFS 1 kHz onset was displayed with immutable session/sequence, separate peak/emission clocks and strength ~0.01949. Seek/reset checks in the runner kept sequence/history cleared without changing the legacy signal. Native tab permissions, real-song quality, audible source behavior, aesthetics and hardware performance remain owner/manual evidence, not mock-derived facts.

One MI03 sweep measured ~31.27 s offline analysis and ~17.45 s replay/report wall time, with largest temporary FFT trace 16,228,352 bytes. Private detector typed storage is bounded (86,016 bytes at FFT 4096, excluding ordinary JS objects/events and existing analyser buffers). These are lab-run/array figures, not total heap, CPU/GPU profiling or end-to-end capture latency. Known soft/overlapping/pitch-changing music limitations remain explicit.

**Stop:** the initial detector is reviewable in `/audio-lab.html` under **MI03 · Onset events**, but its core gate remains FAIL. Do not advance to MI04/Crimson integration or promote the API. Review/authorize the proposed release-attribution correction separately. No threshold waiver, commit, push or deployment. Suggested checkpoint: `Add experimental MI03 onset diagnostics and failing baseline`.
