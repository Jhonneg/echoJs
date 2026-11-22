# MI03 — release-attribution correction

Owner checkpoint: subsequently accepted the lab result with “looks good.” Specific test conditions were not supplied; manual-evidence limits below remain. Next is a bounded MI04 plan, with implementation awaiting separate approval.

2026-11-18 · owner approved the focused correction with “aprove.” **The unchanged synthetic core gate now passes.** This is a development-lab checkpoint for owner review, not production promotion or MI04 approval. The [initial failed baseline](MI03_RESULTS.md) and its evidence remain preserved.

The detector saves total RMS alongside each candidate. At the existing one-sample confirmation, it rejects a candidate if total energy is falling under the existing decline test and the candidate band's peak power contributes less than the existing 5% bound to total broad power. This extends release attribution to the confirmation already awaited; it adds no lookahead or event latency. Dominant decaying attacks and weak attacks over a steady bed remain eligible. Rejections use the existing `falling` debug counter.

Only `src/dev/audioLab/onsets.ts` and its focused unit test changed in this correction. Numeric settings, labels, core/stress manifests, matching windows, strength mapping, spacing, normalization, novelty calculations and acceptance criteria remain unchanged. Production audio/adapters/landscapes and all pre-existing uncommitted work are preserved; no new dependency/backend or scene mapping was added. Project phase skills remain unavailable; followed AGENTS/WORKFLOW.

## Numerical evidence

The complete native matrix ran twice in Brave/Chromium 156: 87 offset fixtures × three actual sample rates × three cadences = 783 cases. Rows and assessments repeated exactly in-process.

| Measurement | Initial core | Corrected core | Corrected 20 ms stress |
|---|---:|---:|---:|
| Cases | 702 | 702 | 81 |
| Expected / matched attacks | 5,157 / 5,157 | 5,157 / 5,157 | 324 / 324 |
| Missed attacks | 0 | 0 | 0 |
| Extra events | 29 | 0 | 0 |
| Wrong-band / release extras | 28 / 29 | 0 / 0 | 0 / 0 |
| Maximum peak delay | 52.857 ms | 52.857 ms | 36.190 ms |
| Maximum emission delay | 85.918 ms | 85.918 ms | 69.478 ms |

All core categories pass, including silence/noise, sustained tones, 50/100 ms bursts, repeats, over-bed repeats, equal mixtures and releases. All 1,377 strength-order groups pass; event identity and reset checks pass. No target was widened or waived.

Primary evidence: [corrected synthetic aggregates](../../evidence/music-intelligence/mi03/mi03-correction-onsets.json), [full browser verification](../../evidence/music-intelligence/mi03/mi03-correction-browser-verification.json), [baseline comparison](../../evidence/music-intelligence/mi03/mi03-correction-comparison.json), and [independent Chromium 159 reproduction/mixtures](../../evidence/music-intelligence/mi03/mi03-correction-playwright.json). The independent previously failing 48 kHz/60 Hz/7 ms bass-burst case now matches all four low-band attacks with zero extras and two mid-band falling rejections.

Compared with the earlier separate native browser process, every matched peak/emission timestamp is unchanged; legacy excursion counts, detector settings and targets are identical. Strength values show a small cross-process difference (maximum absolute 0.000006015, relative 0.000009351). This is measured native-run variation, not an assertion of its cause or cross-process bit identity. Each corrected repetition agreed exactly within its process.

## Known unequal-mixture limit

Additional diagnostic-only native probes keep the approved core manifest untouched. At 48 kHz, a −6 dBFS 100 Hz tone starts at 0.5 s and ends at either 1.0 s (declining) or 1.4 s (steady). A −30 dBFS 1 kHz attack starts at 1.0/1.007/1.017 s and lasts 200 ms; existing default 2 ms edges apply. At 30/60/120 updates/s, all nine steady-bed cases match both labels. Eight of nine declining-bed cases miss the real weak mid attack; one matches it. No extras occur. These misses remain visible in the independent evidence, outside the synthetic core verdict.

Magnitude-only falling-energy attribution can suppress a genuine weak attack overlapping a dominant band's release. This probe establishes current behavior, not how many misses are newly caused by the correction versus the existing candidate-time guard. Slow attacks, unequal overlapping sources, changing pitch and real music remain quality limitations. A passing core matrix does not establish universal song accuracy; no additional tuning is authorized here.

## Verification and checkpoint

Passed: all 19 test files, lint, build/typecheck and whitespace check. The focused regression checks weak release leakage, preserved dominant decays, preserved weak attacks on a steady bed and unchanged one-sample emission delay. The full browser runner repeated MI01 (216), MI02a (432), MI02b (81) and MI03 (783), exports/cancellation, generated seek/reset, capture-mock source/export locks, responsive controls, all-landscape playback continuity and production exclusion. Production asset remains `index-C7O-uO6d.js`; the existing bundle-size warning remains.

Playwright independently exercised the numerical reproduction/mixtures and generated local event log/Stop reset. One automation attempt selected a phase-7 option unavailable in the live picker (only phase-0 variants are listed), causing a harness-driven invalid selection error; repeating with a valid displayed option succeeded. No app change was needed. Native picker permissions, real-song/audible behavior, aesthetics and hardware performance remain manual pending. Only generated synthetic numeric aggregates are retained; no real captured source was inspected or exported.

One corrected sweep took ~33.72 s offline plus ~18.47 s replay/report; maximum temporary trace was 16,228,352 bytes. These are lab wall-time/array measurements, not hardware or end-to-end latency claims.

**Stop for owner review.** Test the lab's MI03 event bands/strengths on permitted music and review these limits. After acceptance, the next deliverable is a bounded MI04 plan under the original Music Intelligence roadmap. No MI04 implementation, production promotion, scene refinement, commit or push is authorized. Suggested checkpoint commit: `Fix MI03 release attribution and retain baseline evidence` (includes the pending initial MI03 work).
