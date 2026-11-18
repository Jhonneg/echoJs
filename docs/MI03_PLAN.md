# MI03 — discrete onset events: implementation proposal

2026-11-18 · owner authorized the scope/criteria with “go ahead” after reviewing their distinction from the original roadmap · inspected base `bbdee7b`. The initial lab implementation and its failed numerical gate are recorded in [MI03_RESULTS.md](MI03_RESULTS.md); no scene changes have been made. This is the first deliverable of the owner-approved [animation refinement direction](ANIMATION_REFINEMENT.md), with Crimson as the future pilot. It supplies a reviewable detector scope and tolerances before implementation, as required by ECHO_Music_Intelligence_Roadmap.md.

## Audit and bounded scope

Both adapters already feed one AnalyserNode and the legacy signal. The DEV-only diagnostic observer receives that same FFT after legacy processing, measured RMS, actual format, time and activity. Reuse this hook; do not introduce another analyser, scheduler, AudioWorklet, backend, framework or dependency.

The current transient/flux outputs are continuous accents without event IDs or peak selection. The MI01 48 kHz/60 Hz sustained-tone fixture shows an unwanted bass flux excursion at 5.517333 s after release at 5.5 s (flux 0.329091). A 100 Hz attack also spills into midrange. Existing raw L1/L2 diagnostics are useful comparators, not finished onset events. See the retained MI01 evidence; do not alter those legacy formulas to hide the baseline.

Implement one development-only detector in the audio lab, operating on uncompressed per-bin measurements and MI02a's calibrated RMS. Compare it with legacy transient and flux on identical input. Fixed linear energy remains unchanged; do not feed MI02b's adaptive gain into novelty or strength. No scenes consume the new events in this task, and no MusicFeatures production API is installed yet.

The general feature → novelty → peak-picking structure follows [AudioLabs onset detection](https://www.audiolabs-erlangen.de/resources/MIR/FMP/C6/C6S1_OnsetDetection.html). Positive spectral differences are an established novelty input, but mixed/polyphonic events remain difficult; ECHO's thresholds/gates below are proposed engineering defaults, not accuracy claims from that source. See [spectral novelty](https://www.audiolabs-erlangen.de/resources/MIR/FMP/C6/C6S1_NoveltySpectral.html).

## Approved initial detector defaults

Preserve the existing broad frequency ranges and actual-rate bin indexing. For each valid update:

1. Convert finite frequency dB bins to linear magnitude, preserving dynamic contrast. Compute positive per-bin differences **before** aggregation; aggregate their L2 magnitude separately for low/mid/high and apply the same one-sided/window scale used for candidate RMS. Do not use saturated visual envelopes or the legacy leaky reservoir as event novelty.
2. Keep a bounded timestamped scalar history per band over the preceding **1 second** (maximum 512 samples per band). Adaptive threshold is prior-window median plus **3 median absolute deviations**, with an absolute novelty floor of **0.0005 calibrated magnitude units**. Exclude the current candidate sample from its threshold history. Use reusable scratch/history storage.
3. Confirm a local maximum with **one following feature sample**. Require band RMS ≥**0.002**, positive signed band RMS rise ≥**0.0005** over the preceding **50 ms**, and band novelty-power share ≥**5%** of the corresponding multi-band attack window. Use the candidate/confirmation pair's maximum per-band novelty for this share so early spill is compared with the same attack rather than an unrelated frame.
4. Reject a candidate if total broad RMS is clearly falling: decline exceeding **max(0.002, 5% of the preceding 50 ms maximum)**. This targets the measured release response; report masked/overlapping-attack limitations rather than claiming universal release/onset separation.
5. Apply a **120 ms per-band minimum spacing** and rearm only after novelty drops below 60% of the candidate's trigger threshold. Other bands remain independent; simultaneous multi-band attacks may emit one event per band.
6. Event strength is `clamp(positive calibrated band-RMS rise over 50 ms / 0.5, 0, 1)`, using the saved candidate's measurement. Keep raw rise/novelty in synthetic diagnostics for interpreting failures. No instrument names, BPM or beat lock.

Tie history and spacing to monotonic elapsed time, not frame counts. Live events use the performance clock in seconds; deterministic replay injects the native trace clock and declares that clock origin in its metadata. Neither is claimed as end-to-end capture latency. Record observed peak time and emission time separately; do not backdate an event to fixture ground truth or subtract an assumed latency to make scores pass. Measure strength differences across cadences rather than promising identical peaks from different FFT polling schedules.

Reset on stop, source/format change, seek, inactive playback, invalid/nonpositive delta or >250 ms gap. Prime the first spectrum after reset without an artificial event. A connected silent tab remains an active input with zero measurements; do not mistake its legacy isPlaying flag for disconnection. Generated local pause resets; resume primes afresh. Detect local playback seeks with a DEV-only seeking listener owned by the existing diagnostic hook; detach it with that hook on stop/source replacement. Only the diagnostic detector/view resets on seek; do not change legacy AudioSignal behavior or either adapter implementation. Source session identity changes when priming a new/reset timeline so no old event can collide with a new sequence.

## Development interfaces and privacy

Add only internal, typed detector settings/state, debug measurements and immutable event snapshots:

`{ session, sequence, band: 'low' | 'mid' | 'high', timeSeconds, emittedAtSeconds, strength }`

Sequence increases once per emitted event within its session. The lab keeps at most 256 numeric events from the latest 10 seconds; rendering compares session/sequence and never replays an event because it remains visible across multiple frames. Do not queue suppressed events for delayed emission. Settings are code defaults for this initial run, not a public tuning panel.

Keep FFT history private and transient; only the preceding spectrum and bounded scalar measurements are needed. No PCM/FFT/video buffers or source graph nodes reach the UI. Display novelty/threshold, calibrated rise, legacy accents, event band/strength/age and aggregate counts at the existing low UI rate. On capture/seek/disconnect reset UI history and consumption cursor. A synthetic replay harness uses the same detector implementation as live diagnostics.

Allow local aggregate JSON/CSV export only for deterministic generated fixtures. Live-tab event histories, times, measurements, titles/URLs and captured media must not enter reports, screenshots or automated inspection. Reuse the existing capture/export/source controls and existing permission workflow. No provider workarounds. Automated browser verification uses generated local audio or a clearly labeled generated capture mock; native picker/audibility remain owner checks.

## Approved acceptance criteria

These are task-specific synthetic criteria, not universal musical accuracy promises. Targets remain fixed after approval; report failures and propose a bounded correction instead of relaxing them.

| Case | Required result |
|---|---|
| Clean silence and continuous −60 peak dBFS white noise | Zero events in every band |
| Isolated 100/1000/8000 Hz sustained tone at −36/−24/−12/−6 peak dBFS | Exactly one event in its labeled band after silent pre-roll; no retriggers or release events |
| Isolated 50/100 ms attacks, all above frequencies/levels | Exactly one matched event per attack; no duplicates or wrong-band events |
| Repeated attacks at 250/500 ms spacing, including over a quieter sustained carrier | Every labeled attack matched once in its own band; no additional events |
| Simultaneous equal-level low/mid/high attacks | One matched event per labeled band |
| Strength for identical attack shape, increasing input level | Strictly increasing across the four levels for each rate/cadence/phase condition |
| Matched event timing | Peak timestamp within 0…100 ms after ground truth; emission no later than 150 ms after ground truth |
| Source, seek, pause, format or gap reset | No synthetic reset/priming event; cleared histories and distinct session identity; no event replay |
| Legacy/production compatibility | Existing AudioSignal outputs unchanged; detector/lab excluded from production assets |

Required matrix: actual 44.1/48/96 kHz where supported; 30/60/120 updates/s from a common native 120 Hz timeline; full-fixture start offsets **0/7/17 ms** to avoid testing only frame-aligned events. Apply phase offsets to the entire fixture so relative carrier/hit phase is preserved. Retain the existing shared analysis and input timing model.

Use a separate core fixture manifest with explicit labels: silence/noise; isolated sustained and 50/100 ms bursts at the four levels/three frequencies; repeated attacks at −24/−12/−6 dBFS over a −36 dBFS sustained carrier with relative phases aligned; isolated repeated hits at all four levels; simultaneous equal-level mixtures; high-only sharp attacks; releases; and lifecycle/seek/gap cases. Match chronologically one-to-one per band to the closest eligible unmatched label in the inclusive [ground-truth time, ground-truth time +100 ms] window; record emission lag separately. Extra unmatched or wrong-band events remain false positives, not silently reassigned.

**20 ms attacks are a separate stress set**, measured at every rate/cadence/offset with expected/matched/missed/extra counts and strength/timing distributions. They are not hidden in the core pass rate. Their render-polling/FFT limits must be reported before owner decides whether fixed-hop processing is warranted; no automatic AudioWorklet branch. Slow attacks, pitch/vibrato, unequal overlapping mixtures and noisier passages are diagnostic limitations, not claimed instrument recognition. Do not use an overall percentage to hide a failing core category.

## Deliverables, verification and stop

Deliver the lab detector/graphs/events, reproducible synthetic core/stress report, legacy comparison, actual rate/FFT/cadence metadata, event precision/recall/counts and peak/emission delay distributions by category. Include rejected-candidate reasons to trace release/leakage suppression. The same event cannot be counted twice or consumed twice.

Run existing plus focused math/lifecycle/strength/cadence tests, lint, typecheck/build and whitespace checks. Browser tests verify generated events, honest PASS/FAIL/incomplete reporting, bounded storage, source/seek/reset/late capture, synthetic-only exports while reports remain loaded, no production code inclusion and no regressions in other landscapes. Use Playwright where operational. Repeat native synthetic measurements and document browser variation; no captured real media is inspected, recorded or uploaded.

Stop for owner review after the MI03 report. If a core category fails, leave it failed and identify its stage; propose one focused correction rather than widening scope, changing acceptance thresholds or introducing a new backend. MI04, scene changes, numerical-target changes and deployment/commit/push require their own authorization.

## Implementation checkpoint — 2026-11-18

The initial implementation preserves these numeric defaults/criteria. DEV seek handling additionally waits for one actual FFT window after seek/seeked and primes afresh, avoiding pre/post-seek waveform mixing; legacy signal/adapters remain unchanged. See MI03_RESULTS.md: every labeled core attack was matched, but 29 extra release-associated mid events fail the zero-extra criteria. The separate stress set passed. No automatic correction, target change, MI04 or scene integration is inferred; the report proposes one bounded release-attribution correction for separate approval.
Current correction checkpoint (2026-11-18): owner approved the focused release-attribution correction. The existing confirmation's falling-energy test now also rejects candidates whose saved peak band-power share is below the existing 5% bound. Numeric defaults/criteria and lookahead remain unchanged. See MI03_CORRECTION.md: synthetic core now PASS, unequal-mixture limits explicit, owner review pending. Earlier initial-run failure evidence remains preserved in MI03_RESULTS.md.
