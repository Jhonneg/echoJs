# MI04 — onset observation window results

2026-11-20 · owner approved the focused follow-up with “aproved.” **MI03 and MI04 synthetic quality gates now pass**, with the original thresholds and acceptance limits preserved. Owner musical review remains pending; no production promotion, G1 approval or landscape migration is implied. The [initial failed MI04 baseline](MI04_RESULTS.md) and its evidence remain intact.

## Correction and diagnostic evidence

The [generated pre-change candidate trace](evidence/mi04-window-before-trace.json) supports the proposed failure mechanism. At 44.1 kHz/120 updates/s, a frequency transition's early mid-band peak is rejected as falling while the new band's RMS subsequently reaches ~0.17744 within 40 ms. Pulse strengths also vary with which early peak is sampled. At 30 updates/s, the peak's preceding 50 ms can already contain elevated RMS, so merely looking forward from that peak would retain an inflated baseline.

The DEV detector now confirms the observed novelty peak, then observes up to **40 ms after that peak** before emitting. It holds the pre-rise minimum from the first sample of the rising novelty segment, using the existing 50 ms lookback there. It measures maximum calibrated band RMS against that held baseline; the strength reference remains 0.5. Falling-energy qualification uses the band's power contribution at its own observed RMS maximum. This permits a rising new dominant band while continuing to reject weak release sidebands.

Each band holds one fixed pending scalar record; no additional FFT history is retained. Qualification still uses the existing novelty/share thresholds, RMS/rise floors, spacing and rearm. Pending attacks clear on reset/inactivity/invalid time/gaps. If an irregular tick matures different bands together, fixed-size selection emits them in peak-time order, preserving chronological sequence consumption without allocating/sorting a frame collection. The immutable event records retain the observed peak time and actual later emission time; no backdating or later strength mutation.

The lab shows the 40 ms observation policy and separates the original 50 ms RMS-rise diagnostic from observed attack rise. Production normalization/flux/adapters/AudioSignal/scenes, context calculations/criteria, frequency ranges and dependencies are unchanged. The [settings comparison](evidence/mi04-window-summary.json) confirms every prior onset threshold, onset target and MI04 setting/target is unchanged; the new setting is `attackWindowSeconds: 0.04`. This owner-approved window supersedes the initial one-sample emission policy, while retaining the 100 ms peak/150 ms emission limits.

## Repeated native results

Brave/Chromium 156 completed the full matrices twice with exact in-process row/assessment agreement. [Onset aggregates](evidence/mi04-window-onsets.json), [context aggregates](evidence/mi04-window-context.json), [summary](evidence/mi04-window-summary.json), [browser verification](evidence/mi04-window-browser-verification.json) and [lab screenshot](evidence/mi04-window-context-lab.png) retain the corrected checkpoint separately from the initial failure.

| Measurement | Before window | With window |
|---|---:|---:|
| MI04 context rows | 324 | 324 |
| Failed activity cadence comparisons | 30 | **0** |
| Maximum activity cadence difference (limit 0.05) | 0.156987 | **0.007475** |
| Expanded attack labels matched | 2,265 / 2,295 | **2,295 / 2,295** |
| Expanded misses / extras | 30 / 0 | **0 / 0** |
| MI03 core attacks matched / extras | 5,157 / 0 | **5,157 / 0** |
| Separate 20 ms stress attacks matched / extras | 324 / 0 | **324 / 0** |
| Core maximum peak / emission delay | 52.857 / 85.918 ms | **52.857 / 119.206 ms** |
| Stress maximum peak / emission delay | 36.190 / 69.478 ms | **36.190 / 102.177 ms** |

All 702 MI03 core cases and 81 stress cases have zero misses, extras, wrong-band or release events. All 1,377 strength-order groups pass. Every event waits at least the 40 ms observation interval; actual emission occurs on the first eligible feature tick. The measured added decision latency remains below the unchanged 150 ms ground-truth-to-emission ceiling, but musical responsiveness still requires owner review.

All MI04 row checks, activity ordering and cadence checks pass. Maximum steady intensity/brightness cadence differences are 0.005736/0.016208, within their 0.03 limits. Native measurements from different browser processes have small numerical variation; exact repeatability is claimed only for the two runs within the final process.

## Remaining limits and verification

The [unequal-mixture recheck](evidence/mi04-window-unequal-mixtures.json) repeats the earlier diagnostic at 48 kHz with −6 dBFS 100 Hz bass and −30 dBFS 1 kHz attacks at 0/7/17 ms relative offsets, across 30/60/120 updates/s. All nine steady-bed cases match both labels. Seven of nine declining-bed cases match both; at zero offset and 60/120 updates/s, the real weak mid attack is still missed. No extras occur. These diagnostic cases remain outside the approved core manifest; passing the core does not establish universal mixed-music accuracy.

Passed: all **20 test files**, lint, build/typecheck and whitespace/local-link checks. Onset tests now cover the approved wait and preserved peak identity, held baseline with a coarse rising attack across 30/60/120, pending cancellation, chronological publication on a jittered tick, release rejection, independent bands, spacing, strength ordering and existing bounded history/reset/statistics checks. Old assertions requiring immediate one-sample emission were updated to the newly approved observation interval; quality and latency acceptance thresholds were not relaxed.

The full browser runner repeated MI01 (216), MI02a (432), MI02b (81), MI03 (783) and MI04 (324), verified both quality flags, generated local/capture-mock target checks, seek/reset/source replacement, export locks/JSON/CSV/incomplete cancellation, portrait sizing, all-landscape playback continuity and production exclusion. Production asset remains **`index-C7O-uO6d.js`**; the existing bundle-size warning remains. The direct jitter test exposed a publication-order issue during implementation; chronological fixed-size emission corrected it before the final full run. No thresholds were tuned after results.

One final onset sweep took ~31.84 s offline plus ~17.54 s replay/report; one context sweep ~34.00 s plus ~16.80 s. Largest temporary traces remain 16,228,352 and 19,668,992 bytes respectively. These include lab analysis/oracles/reporting, not isolated detector CPU, total heap, hardware FPS or end-to-end capture latency. Phase skills/Playwright MCP remain unavailable; followed the project workflow using the existing installed-browser/CDP verifier. No native picker or real/private media was inspected, recorded or exported.

**Stop for owner review.** In `/audio-lab.html`, share permitted audio and review the onset log plus **MI04 · Musical context**, especially responsiveness, quiet/loud contrast, drone versus busy passages and silence. Musical usefulness/native permissions/audibility/device performance remain manual pending. After acceptance, prepare the bounded **G1 feature-quality review** plan under the original roadmap; scenes and production defaults still need later authorization. No commit/push/deployment. Suggested checkpoint: `Stabilize lab onset strength with 40 ms observation` (preserve/include the pending MI04 implementation as appropriate).
