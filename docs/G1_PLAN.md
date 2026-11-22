# G1 — feature quality review plan

2026-11-20 · owner approved this bounded preparation with “aproved.” Inspected clean base `662876e`. [MI03/MI04 synthetic gates pass](MI04_WINDOW_RESULTS.md). This implements the original roadmap's [G1 stop/go review](ECHO_Music_Intelligence_Roadmap.md#g1--feature-quality-review-stopgo) before MI05's Crimson pilot. [G1_REVIEW.md](G1_REVIEW.md) records the implemented preparation, automated evidence and six owner review rows completed on 2026-11-21, with known limitations/evidence scope retained. Next is a separately approved MI05 plan.

## Audit and proposed scope

The lab already computes legacy and candidate features from one shared analyser, input gain and clock. Legacy levels/transient/flux, fixed calibrated energy, immutable onset events and slow context are available together in the existing diagnostic snapshot. They are spread over several panels sampled at 5 Hz, which is useful for inspection but insufficient for judging a short accent's apparent timing. Candidate features do not drive landscapes.

The source coordinator already reuses both production adapters. Its local path currently accepts generated fixture files and labels them `fixture`; there is no owner-selected song control in the lab. It can select/play/pause/release through `createLocalFile` without changing that adapter. Current export locking recognizes shared tabs; an actual review file must receive the same live-data protection.

Prepare one compact, development-only comparison panel and a local review-file control inside `/audio-lab.html`. Preserve all DSP, thresholds, the 40 ms window, adapters, production contracts and landscapes. No new backend/dependency, public debug route, instrument classifier, gain experiment or scene preview. G1 compares interpreted signals; MI05 separately judges actual scene behavior.

## Review interface

- **Compare / Legacy / Candidate** presentation modes. Both feature paths continue running on the same input. Mode changes must not restart playback, recreate an analyser, change gain, reset feature histories or replay old events.
- Three labeled frequency bands with paired legacy normalized levels and candidate fixed-linear energy on the same 0–1 display scale. Label the distinct curves; compare quiet/loud contrast, not numerical equality. Exclude MI02b adaptive gain and soft-knee alternatives from this candidate.
- Show legacy transient and flux as continuous accents, alongside candidate event strength/count/time. Do not turn threshold crossings into fake legacy onset events. A neutral candidate marker appears only when a new session/sequence is emitted, at its actual emission time; a fixed 200 ms display hold makes it readable. No backdating to the peak or music beat. Clear markers on source/reset, and consume hidden-mode events so returning to a mode does not flash old attacks.
- Use the existing animation callback for a small canvas/neutral indicators at frame cadence; keep reusable state outside React and avoid per-frame DOM reconstruction or growing history. Retain the slower numerical tables and detailed graphs below. The marker hold is presentation only and must not modify event strength, feature timing or a landscape mapping.
- Show candidate intensity, brightness validity and activity as slow context. Brightness/activity have no direct legacy equivalent; label that explicitly. Keep raw diagnostics available and actual format/input volume visible.

## Owner-selected local audio and privacy

Add a native local file input with explicit **Play / resume**, Pause and Stop using the existing local adapter. Use a distinct DEV coordinator mode for a review file, preserving generated-fixture behavior. Selecting a file alone does not start playback. Resume must use the same selected element/node rather than replacing it. Stop/replacement/disposal clears the selection, releases the object URL and resets both feature paths; pending tab acquisition cannot override a newer local source.

Keep the existing local volume default/slider; changing comparison mode never changes it. Disable synthetic JSON/CSV exports while either a review file or shared tab is active, even with an earlier synthetic report loaded. Live file/tab features, histories and review data cannot enter synthetic reports. No recording, PCM/FFT/media export, uploads, source-title/URL collection, automatic song catalog or persisted listening history. File playback is local through an object URL; no provider integration or capture workaround.

Automated checks use generated files/audio only. The owner selects and listens to permitted songs manually. The agent must not inspect private media, its live feature readouts, screenshots or captured content. The owner can voluntarily report concise judgments using aliases such as “Track A”; no audio upload or live diagnostic export is needed.

## Controlled owner test

Use a few short passages that together cover quiet/loud bass, sustained drone, clear rhythmic attacks with varying strength, sparse/mid/high content, quiet ambience and an active silent section. Compare both paths simultaneously first, then use the presentation modes on repeated passages if useful. Keep the same source, passage and player volume for the comparison. Neither mode gets a separate boost or normalization.

For the cross-source check, use the same permitted encoded material as a local file and in an owner-controlled player tab that supports native audio sharing. Keep explicit player gain settings and the ECHO local volume unchanged between repeats. Confirm equivalent input levels on a sustained passage using the raw RMS display; do not silently compensate with candidate gain. Matching OS listening loudness alone does not establish matching analyser input. If settings/material cannot be matched, mark source parity pending. Capture latency/resampling can differ; do not require waveform/time-sample identity or bypass sharing restrictions.

| Owner gate row | Judgment required |
|---|---|
| Dynamic contrast | Quiet bass remains visibly weaker than loud bass; the candidate preserves useful differences rather than flattening both near maximum. |
| Sustained energy | A drone retains energy without repeatedly generating new candidate attacks. |
| Band independence | Known mid/high-only examples avoid strong false bass events. Use existing isolated generated fixtures as controls; do not assume a mixed song has no bass from its instrument names. |
| Timing and strength | Rhythmic events feel timely and show believable weak/strong differences, including the added observation delay. |
| Quiet ambience and silence | Quiet music stays restrained; active silence decays without false attacks. Pause/Stop clearing is checked separately from musical decay. |
| Source parity | Equivalent local/shared material behaves similarly at matched input levels, with native permission and original audible output verified by the owner. |

Record each row as **pass / fail / manual pending**, plus a short owner note about the worst issue, browser/source type, passage alias and input volume where supplied. These are manually supplied observations, not automatic feature capture. A generic “looks good” without test conditions does not establish every row or native-device evidence.

G1 passes only when all six rows have owner evidence, representative passages show a reliable useful improvement, and known limitations—including weak attacks overlapping strong releases—are explicitly accepted or resolved. This is feature-quality approval, not final animation/scene acceptance. If a row fails, preserve the result and propose one bounded correction with its own approval. No DSP tuning during this preparation task and no silent relaxation of the existing numerical gates.

## Implementation and verification boundary

Expected changes: a small DEV review renderer/state helper if needed, lab `main.ts`/styles, the DEV source coordinator, focused generated-source/event-consumption tests, the existing browser verifier and repository checkpoints. Production adapter files and scenes remain untouched. Do not introduce seek/playlist/player features beyond existing Play/resume/Pause/Stop for this gate.

Run tests, lint, build/typecheck, whitespace checks and the full existing synthetic browser verifier. Add generated local-file selection/resume/error/cleanup tests; late pending-tab replacement; Compare/Legacy/Candidate switching with an advancing unchanged player; exactly-once markers without hidden-mode replay; reset/reduced-motion handling of neutral indicators; file/tab export locks with synthetic reports retained; responsive desktop/portrait layout; and unchanged MI03/MI04 gates and production exclusion. Use current installed-browser/CDP checks while Playwright MCP remains unavailable. Never treat generated capture mocks as native permission, real-song, audible-output or hardware validation.

Deliver the review interface plus a short owner checklist and `G1_REVIEW.md` initialized with automated evidence and manual rows pending. Stop for the owner's song review; do not mark G1 passed automatically. After G1 approval, prepare MI05's bounded stable-contract/Crimson pilot plan while preserving its accepted composition, camera, art direction and motion bounds. No scene migration, commit, push or deployment in this preparation task.
