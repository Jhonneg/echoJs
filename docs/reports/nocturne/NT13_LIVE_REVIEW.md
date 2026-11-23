# NT13 — live owner music review

**Latest decision — 2026-11-23: NT13/R5 approved.** Owner approves all five visual criteria and reports all listed current-build real-song cases worked. [Exact owner responses](../../evidence/nocturne/nt13-refinement/r5/owner-review.json). Earlier pending/brightness entries below are historical checkpoints. NT14 is next, not started.

Prepared2026-11-22 after owner “continue” following NT12. **In progress: the permitted-tab source and bass case are selected; bass tracking is reported as following the music, but the owner finds Audio too dim versus Manual; the owner-approved focused spill lift is applied; live re-review and remaining cases/approval are pending.** No musical result is recorded below until the owner supplies it. NT14 is not started. No production change, agent commit, push or deployment.

The [master roadmap, NT13](../../NOCTUNE_MASTER_ROADMAP.md) requires: “Gate: owner approves real-song feel.” Synthetic correctness from [NT12](NT12_MATRIX_REVIEW.md) cannot close that gate. Repository [AGENTS.md](../../../AGENTS.md) also says: “never record, upload, transmit, persist or inspect captured media content.” Real-song playback/review therefore stays with the owner; the agent collects text observations only.

## Review setup

Current review app: [http://127.0.0.1:5183/](http://127.0.0.1:5183/) (built production preview). The initial development address was127.0.0.1:5173; the owner reported a blank page, then confirmed “it opened now” after the separate built address was provided. This is a local development process, not a deployment. If a later session has stopped it, start the repository's existing dev script again; no publishing is required.

1. Select **Nocturne · Preview**, **Audio** lighting, **Standard** quality, **100% Reactivity**. Keep the same browser, viewport and comfortable playback level across cases. Move the pointer out of the scene and let the camera settle to center.
2. Use your own permitted local audio file through **Open audio file**, or a permitted tab through **Share a tab**. For tab playback, make the normal browser selection yourself and enable tab audio if available. Do not use a capture workaround. Confirm the original audio is audible once; the agent cannot verify that remotely.
3. Listen to a representative excerpt for each case below, roughly30–60 seconds where useful. After a quiet/loud transition, allow the slow atmosphere to respond; it intentionally lags individual attacks. Observe the actual scene at normal speed.
4. Pause or stop after a passage and observe fixture fade versus the slower atmosphere tail. Existing environmental fill should keep the alley readable. No recording, screenshots, audio upload, exported live feature history or private filename is needed.
5. Send text observations only. Anonymous case labels are sufficient; optionally include track title and passage times. If useful, repeat a problematic passage under reduced motion or Low quality and label those settings separately; do not compare different settings as if they were the same run.

The agent will not attach a browser debugger, inspect owner playback, collect media or run screenshot/video capture during this live review. Existing generated-only demonstrations remain available below.

## Listening cases

One track may cover several cases. These are listening situations, not genre classification. The owner selected a permitted browser tab and a bass-focused case. Other cases/excerpts remain pending.

| Case | Required character | Source / optional label and times | Live result |
| --- | --- | --- | --- |
| A | Bass/percussion-heavy | Owner label: “bass”; permitted browser tab; excerpt times unspecified | Historical: magenta follows bass; corridor too dim before refinement. R5: owner includes current bass-heavy case in “all worked” |
| B | Midrange-dense | Owner current-build review; no passage label supplied | R5: included in “all worked”; no issue reported |
| C | Sustained ambient | Owner current-build review; no passage label supplied | R5: included in “all worked”; no issue reported |
| D | Light/percussive | Owner current-build review; no passage label supplied | R5: included in “all worked”; no issue reported |
| E | Dynamic quiet → loud → quiet | Owner current-build review; no passage label supplied | R5: included in “all worked”; no issue reported |

For each case, report what you actually noticed:

- **Roles:** Do magenta weight, cyan midrange/panel and violet detail look musically distinct? Does the right magenta remain the focal fixture without overpowering the approved left cyan panel?
- **Attacks versus sustain:** Are brief accents distinguishable above held light levels? Does held sound avoid unrelated repeated flashes? Is the bridge purposeful and readable rather than a constant scanner?
- **Dense passages:** Are dark architectural areas and local differences retained? Does any group dominate, become continuously bright or pulse with unrelated content?
- **Quiet/recovery:** Do fixtures fade naturally and does the slower distant atmosphere recover without washing out the alley or making it unreadable?
- **Overall feel:** Purposeful / mixed / disconnected, with a concrete passage or symptom. Report visual discomfort if encountered; that is an owner observation, not something automated tests can certify.

A text-only reply can use this format:

```text
Environment: browser / viewport / quality / Reactivity / reduced motion
Source: local file or permitted tab; original audio audible once: yes/no/not checked
A — label/times: roles; accents; dense contrast; fade; overall feel
B — ...
C — ...
D — ...
E — ...
Issues: case + passage + what the light did versus what you heard
Decision: approve / request visual adjustments / more review needed
```

## Existing generated evidence

[NT11 staged coordination](../../evidence/nocturne/nt11/current/generated-music-demo.mp4) and [NT12 controlled matrix](../../evidence/nocturne/nt12/current/generated-music-demo.mp4) already provide synchronized generated soundtrack/fixed-camera comparisons. These recordings contain generated media only and remain technical references, not substituted real-song observations.

## Page-access issue during preparation

Owner initially reported “i cant see anything,” clarified as “the page is blank.” A static HTTP check returned200. An independent empty browser profile loaded the development app/canvas with no startup/network errors; a separate built preview on5183 also rendered Nocturne with Manual All on. [Generated-scene startup screenshot](../../evidence/nocturne/nt13/startup/manual-all-on.png) and [fresh-profile metadata](../../evidence/nocturne/nt13/startup/fresh-profile.json) contain no owner media. The owner then confirmed “it opened now.”

Root cause of the owner's blank page is unconfirmed; do not claim a cache or source-code fix. No production change was made. This was an app-only startup check in a separate profile, not debugging/capturing owner playback or a real-song result. Owner browser/address details were not supplied. Guided return to Audio mode; subsequent owner bass observations are recorded below.

## Findings and approval ledger

- Owner source preference: permitted browser tab (owner response2026-11-22).
- Authorized listening cases/excerpts: case A, owner label “bass,” selected; excerpt times and B–E pending.
- Owner case A: “magenta follows bass, i feel corridor in general is too dim compared to manual preview.” Record successful perceived bass tracking and a brightness concern; do not infer cyan independence, fades or full musical approval. B–E pending.
- Page access: owner confirms it opens now; native capture and original audibility still pending confirmation.
- Musicality/artistic decision: pending owner.
- Device-performance acceptance: pending; it is not certified by this worksheet or the previous headless counters.
- Applied revision: owner “do the lift” approved the [bounded Audio-only spill lift](NT13_SPILL_IMPLEMENTATION.md); generated checks pass, live brightness re-review pending. Preserve emitter responses, approved left cyan, atmosphere and Manual.

If a visual issue is reported, first trace it to the relevant existing scene mapping and propose a small visual adjustment with a repeatable passage. Do not redesign all groups, alter the approved cyan geometry, modify MI/DSP, or invent a classifier. Analysis changes require an actual measured feature defect; none has been reported in NT13.

## Preparation verification and next step

The local servers started successfully and all90 source hashes still match the NT12 manifest. Only documentation and startup evidence are changed for this preparation. Prior NT12 checks remain40 test files/lint/typecheck/build passed; they are not claimed as new NT13 listening evidence. Documentation links/whitespace are checked; code/browser/media checks are not rerun for this documentation-only step.

Next required input: refresh the rebuilt app on5183, re-share the permitted tab and repeat bass listening with the applied spill lift. Then complete remaining contrasting cases and owner artistic decision. Keep NT13 open until these exist. Do not start NT14 solely because the review worksheet is ready.

## NT13-R0 — ground-truth checkpoint, 2026-11-22

**Status: technical audit/evidence ready; owner checkpoint review pending. R1 and NT14 are not started.** Owner approved R0 after the refinement roadmap and selected **generated captures + live owner review**. This explicitly revises the roadmap's recorded real-song method: no owner media is inspected or persisted. Real-song feel/parity stays live and text-only with the owner. The earlier spill lift remains untouched. All90 production source hashes match the R0 start manifest, including uncommitted work. The project-named phase skills were unavailable locally; the documented `WORKFLOW.md` cycle was used.

Source audit: [current as-is fixture map](../../NOCTUNE_VISUAL_MAPPING.md#nt13-r0-current-worktree-audit--2026-11-22). Noctune already consumes Music Intelligence exclusively; zero legacy signal consumption. The shared Canvas still supports other legacy scenes; math imports are not an audio fallback. All six bands, three broad onset streams and slow context have consumers. No new analysis interface is required to proceed with scene-local calibration. Historical pre-migration assertions earlier in the migration document are not current facts.

### Repeatable evidence

| Run | Generated video | Feature/render rows | Screenshot frames |
| --- | --- | --- | --- |
| Noctune Standard | [Video](../../evidence/nocturne/nt13-refinement/r0/nocturne/standard/baseline/generated-baseline.mp4) |3300|439|
| Noctune Low | [Video](../../evidence/nocturne/nt13-refinement/r0/nocturne/low/baseline/generated-baseline.mp4) |3285|435|
| Crimson Standard | [Video](../../evidence/nocturne/nt13-refinement/r0/crimson-horizon/standard/baseline/generated-baseline.mp4) |3296|439|
| Crimson Low | [Video](../../evidence/nocturne/nt13-refinement/r0/crimson-horizon/low/baseline/generated-baseline.mp4) |3289|429|

[Quiet / dense / Manual comparison, left to right](../../evidence/nocturne/nt13-refinement/r0/nocturne-comparison.jpg). Full Standard [Manual on](../../evidence/nocturne/nt13-refinement/r0/nocturne/standard/baseline/manual-all-on.png) and [off](../../evidence/nocturne/nt13-refinement/r0/nocturne/standard/baseline/manual-all-off.png). Each run directory includes `trace.json`, representative stills and `capture.json`; Noctune diagnostics directories contain held quiet/dense normal, emitters-only (points disabled), no-reflection (wet floor hidden) and environment-only frames with delivered-property snapshots. [Measurements](../../evidence/nocturne/nt13-refinement/r0/measurements.json), [schedule/attack times](../../evidence/nocturne/nt13-refinement/r0/generated-schedule.json), [source manifest](../../evidence/nocturne/nt13-refinement/r0/source-manifest.json).

Input: the existing55s NT11 generated arrangement,48kHz mono16-bit, identical WAV SHA256 across all4 runs. The browser AudioContext actually ran96kHz/4096 FFT; report runtime rather than assume source rate equals analyser rate. Player50%, Reactivity1, normal motion. Time0–3 quiet1500Hz;3–9 bass110Hz;9–15 adds450/1500Hz;15–23 mixed staggered low/mid/high attacks;23–29 quiet high-mid breakdown;29–37 layered return;37–55 silence. Source has no low-mid-only passage: earlier NT12 isolation tests cover that case, not these videos.

Setup:1440×810 CSS, deviceScale1; Standard drawing1440×810/dpr1, Low1080×607/dpr.75. All runs measured ACESFilmic toneMapping4, exposure1, sRGB, shadows disabled; ANGLE/NVIDIA GTX1660 SUPER. Noctune position `[0,1.6,5]` is asserted every sample, with neutral authored look direction. Crimson retains authored travel/rebasing and its poses are logged; the world cameras and journey origins are not matched. Crimson camera motion is a comparison confound, not evidence of Noctune spatial responsiveness.

Capture uses Brave CDP, since Playwright was unavailable. Requested8Hz JPEG screenshots are encoded with their measured duration; soundtrack is the generated source WAV offset to the first screenshot midpoint, not recorded browser audio output. Screenshot brackets average84–99ms across runs; maximum214ms. Thus the videos are passage-aligned demonstrations, not sample-accurate onset measurements. Per-render consumed-feature timestamps and delivered properties establish numeric timing. Active-feature ages stayed17–139ms, within the250ms freshness budget. The two landscapes are separate runs of identical input, not simultaneous feature-identical recordings. Initial attempts failed because of a temporary probe syntax error; they produced no valid baseline and were replaced after repair. Production was unaffected.

### Findings: darkness and response

The issue combines **low delivered response and weak environmental readability**. There is no measured Manual/Audio exposure or camera-mode change. On this generated source, energy calibration yields modest values; existing scene gains then drive only a small fraction of Manual output. Broad musical intensity does not multiply all fixtures. It only drives slow atmosphere, so high overall intensity cannot directly latch the cyan panel on. Sustained magenta/body mappings can legitimately hold illuminated panels through bass passages, then fade together when bass disappears. Most secondary panels share one body/material. Shared band control and static architecture explain synchronous-looking illumination more directly than a single global master signal.

Standard mean levels (0–1), averaged within steady passage windows, not claimed as representative of every real song:

| Passage | Bass / high-mid energy | Main magenta | Cyan windows | Left cyan | Atmosphere |
| --- | --- | --- | --- | --- | --- |
| Quiet0.7–2.5s |0 / .0177|0|.0026|.0230|.0039|
| Bass5–8.8s |.1034 / 0|.1549|.0001|0|.0534|
| Mixed16–22.8s |.0926 / .0727|.1590|.0381|.1115|.0941|
| Breakdown26–28.8s |0 / .0247|0|.0042|.0322|.0607|
| Late silence52–54.7s |0 / 0|0|0|0|.0028|

Dense mean actual points: main11.92/50, bridge.425/40, windows4.95/65, details4.53/40, left3.34/30, violet.32/12 and.30/12. The prior1.5×/2× spill lift is present. Every logged emitter equals its own final channel×1.3 (bridge uses individual sections), and every point equals its own spill×original full intensity. Manual All on reaches1.3 emitter and full points with the same exposure. No unexplained attenuation in the final adapter was found.

**Accents:** attacks are mapped, not absent. In dense Standard, left cyan accent peaks at.0142 additive channel units—roughly1.4 percentage points—against its sustained body. Its formula multiplies broad mid strength by qualified high-mid rise, so small valid candidates produce small accents. Representative images show restrained cyan changes;8Hz video is insufficient to certify brief-accent perceptibility. This is a concrete R1/R4 calibration candidate, not evidence that MI failed. Bass interval left output is zero after settling; late silence all fixture channels are exactly zero while slow atmosphere retains a small natural tail. Low-mid-only isolation is not established by the mixed source.

**Smoothing/thresholds:** sustained channels do not use a hard global brightness gate. There is extra scene smoothing (.06/.18 panel; .35/.9 windows; .3/.7 secondary magenta) on already smoothed band energy, with slower reduced-motion envelopes. Event qualification≥.02 target-band rise and violet/bridge strength≥.04 exclude weak events; deliberate cooldowns omit some fast attacks. Windows/secondary magenta have no event layer. These are bounded design choices, not a measured stuck smoothing state. Low/zero steady input delivers low/zero final levels as designed.

**Lighting versus reflection:** in held dense Standard, fixed left-wall display-weighted RGB mean drops.0870→.0091 with all points disabled; right wall.0605→.0056, floor.0249→.0157. Emissive sources remain on. Existing point spill clearly works, but most surfaces depend on relatively low local point output plus very dark material/environment response. Quiet floor.0159 and environment-only floor.0148 remain close. Manual floor.0978/bridge.1551 are much brighter than dense.0249/.0327 under identical exposure. These are fixed display-sRGB crop statistics, not physical luminance or perceptual approval.

Hiding the wet reflective floor changes dense floor crop.0249→.0267; it exposes the underlying ground, so a brighter average does **not** imply a broken reflection. Colored reflection detail is visible in normal frames; reflections cannot substitute for architecture illumination. No bloom is present. Emissive fixture/gate materials bypass tone mapping while standard wall materials use the renderer path, affecting balance even though exposure is constant. The fog/gate respond slowly, but fixed environmental lighting and bridge silhouette do not receive spatial musical progression. Window panels remain lockstep; violet alternates banks; bridge moves on low onsets only. The small bridge strips contribute little to broad foreground readability. No R1–R3 visual redesign is implemented here.

### Verification, boundaries and next checkpoint

Passed: all40 test files, lint, typecheck, production build (existing large-chunk warning), four generated browser captures, both quality diagnostic sets, freshness/delivery/source hash assertions and measurement script. Browser runs report no runtime/console errors. Captures were visually inspected as generated app scenes. No media from the owner's permitted tab was accessed.

No added production lights, geometry, shaders, dependencies or per-frame state. Headless Noctune reports196 whole-frame draw calls including planar reflection,114 geometries,6 textures; Crimson6–7 calls/geometries,0 textures. Mean instrumented frame interval~16.7ms; capture/probe/other concurrent runs affect it. These are diagnostic counters, not target-device FPS/GPU-time approval. NT14 remains paused.

R0 files: `scripts/verify-nocturne-r0.mjs`, `scripts/compare-nocturne-r0.mjs`, generated evidence directory, and updates to existing mapping/migration/roadmap/progress/verification/decision/live-review docs. No production change or commit. Suggested focused commit, only if authorized: `Audit Noctune NT13 response and capture R0 baselines`.

**Pending owner checkpoint:** review the baseline comparison and confirm the diagnosis before R1. R1 should evaluate minimal stable environmental readability and bounded scene-local response calibration against these same baselines, preserving headroom and zero fixture output. Do not globally raise exposure or use Manual All on as normal music brightness. Real-song distributions, accent perception, final artistic parity and target-device acceptance remain manual pending. Stop here; no R1 or NT14 authorization is inferred from automated success.

## NT13-R1 — brightness calibration checkpoint, 2026-11-22

**Implemented — owner visual/live review pending.** Owner “proceed” after R0 authorizes this phase only. No R2 choreography, NT14 continuation, commit or deployment. The previous R0 diagnosis remains available above; this section records the current candidate.

Changes: `NocturneScene.tsx` adds a static cool ambient light (#708a9e, intensity.35), independent of input, Reactivity and reduced motion. This supplies a restrained visibility floor in Audio, silence and Manual. It is intentionally a scene-wide minimum fill rather than a global exposure increase; small surface/Manual appearance changes are expected. Existing hemisphere/directional intensities, seven local points, geometry, fixtures, colors, materials, fog and camera are unchanged. Context7 Three r186 documentation confirmed AmbientLight's uniform non-shadow illumination. There are no new dependencies, shadows or postprocessing.

`visualState.ts` applies the monotonic soft curve `f(x)=2x/(1+x)` to final Audio fixture levels, after the existing band-specific bodies/accents. It preserves0 and1, has no positive floor, approaches2× gain for small signals, and leaves headroom as signals grow (.1→.182, .5→.667). Bridge sections are individually calibrated and the shared bridge spill remains their mean. Existing Audio spill gains1.5× main/2× windows/details remain. Manual bypasses the curve and still delivers original controls/full point outputs. `sustainTarget` and `accent` diagnostic fields remain **raw controller values**; `level`, reflection-source values, bridge sections, spill, materials and points are calibrated final delivery. A displayed accent increment is `f(body+accent)−f(body)`, not the raw accent field. Scene envelopes/event qualification/timing are unchanged.

This is a bounded calibration from R0's actual generated MI distributions. It is **not** claimed to be tuned against an observed set of real songs; that part of the R1 exit gate remains with the owner under the approved live/text-only evidence policy. The curve is intentionally nonlinear, so exact3× input does not imply3× display output. Ordering, small-signal proportionality, independence, zero, headroom and lifecycle behavior are tested instead. No shared analysis gain or threshold is changed.

### Visual evidence and measurements

[Before/after comparison](../../evidence/nocturne/nt13-refinement/r1/before-after.jpg): R0 left, R1 right; quiet, dense and late silence rows. Full images and Manual on/off are in each baseline directory.

- [Standard generated video](../../evidence/nocturne/nt13-refinement/r1/nocturne/standard/baseline/generated-baseline.mp4):3304 consumed/render samples,439 screenshots.
- [Low generated video](../../evidence/nocturne/nt13-refinement/r1/nocturne/low/baseline/generated-baseline.mp4):3289 samples,439 screenshots.
- [Reduced-motion generated video](../../evidence/nocturne/nt13-refinement/r1/nocturne/standard-reduced/baseline/generated-baseline.mp4):3286 samples,436 screenshots.
- [Measurements/source preservation](../../evidence/nocturne/nt13-refinement/r1/measurements.json). Every capture contains `trace.json` plus metadata and snapshots. Additional `audio-after-manual.png` and `paused-after-audio.png` verify controls return to real band-driven response then fade to zero.

Viewport, neutral Noctune camera, source WAV, player50%, Reactivity1, exposure1/ACES4/sRGB and quality settings match R0; reduced motion is explicitly labeled. Generated soundtrack is source-muxed, not captured output; the R0 screenshot-bracket/timing and headless-performance limitations apply. Browser CDP is used because Playwright was unavailable. Production source preservation: only `NocturneScene.tsx` and `visualState.ts` differ from the R0 manifest;88 other source files, including MI, fixture geometry, materials and other landscapes, match exactly.

Mapping-only comparison, replaying the **same saved R0 scalar outputs** through the R1 curve to remove run scheduling differences:

| Dense16–22.8s mean | R0 | R1 calibrated |
| --- | --- | --- |
| Main magenta |.1590|.2730|
| Secondary magenta |.0459|.0878|
| Cyan windows |.0381|.0734|
| Cyan details |.0566|.1071|
| Left cyan |.1115|.1995|
| Violet right / left |.0266 / .0251|.0508 / .0480|
| Bridge section mean |.0106|.0199|

The fresh Standard run closely matches that replay (main.2739, left cyan.1990). Quiet left cyan rises.0230→.0449; overall intensity still cannot drive it. Late silence52–54.7s has exactly zero final levels for all groups in all three runs. Dense floor display-weighted crop mean rises.0243→.0346, bridge.0319→.0481, right wall.0570→.0885; colored spill and reflections remain visible without clipped full-white fixtures. Quiet floor.0160→.0177 and bridge.0148→.0180; late-silence bridge.0137→.0157. The resting lift is modest and retains very dark pockets. These display-sRGB metrics are not perceptual/luminance approval; the scene may still be too dark for the owner or their display. Gate/haze response is unchanged.

Bass-only5–8.8s: normal/Low cyan-panel peaks remain below.0001 final level (less than.01%), with tiny FFT leakage; no qualified high-mid accent. Reduced motion retains the intentionally slower tail from the preceding high-mid intro (peak.0074, under.74%, decaying), with negligible sustained target and no accent. The initial exact-zero bass assertion was too strict for measured leakage and reduced decay; it was replaced by explicit target/accent and weak-output bounds. Late true silence still asserts exact zero. This is not an analysis-engine modification. Existing deterministic low-mid-only isolation and lifecycle tests pass under the new final curve.

### Verification and checkpoint

Passed: all40 test files, including54 deterministic contract/matrix cases at30/60/120Hz; lint, typecheck and build (existing large-chunk warning). Added a focused final-calibration regression and updated the matrix's old exact linear-display assumption. All3 generated browser runs report no runtime errors and pass final emitter/point delivery, bridge-mean, fixed-camera/exposure, band isolation bounds, late silence, reduced suppression and Manual→Audio/pause checks. The comparison script checks unchanged source boundaries and identical WAV hashes. Generated screenshots were inspected.

Resource counters stay196 whole-frame draw calls,114 geometries,6 textures across Standard/Low/reduced. The added ambient light needs no distance calculation/shadow pass;7 dynamic point lights remain. No new per-frame React state, meshes, textures or reflection passes are introduced. Resource equality is not a measured GPU-time guarantee or target-device approval. The existing `reduce` call computes six bridge values each frame, outside React state.

Files for R1:2 production files above, `tests/nocturneVisualState.test.mjs`, `scripts/nocturne-response-matrix.mjs`, extended `scripts/verify-nocturne-r0.mjs` with `ECHO_NOCTURNE_REFINEMENT_PHASE=r1`/reduced capture support, new `scripts/compare-nocturne-r1.mjs`, generated R1 evidence and existing documentation updates. Prior uncommitted work preserved. Local built review app http://127.0.0.1:5183/ serves the R1 build; refresh before reviewing.

**Next required owner checkpoint:** review quiet/silence readability and quiet-to-dense headroom in the comparison/video, then live permitted music using text observations only. Real-song calibration, accent perception and artistic approval remain pending; no private music was inspected/recorded. R2 is not started. Suggested focused commit only if authorized: `Calibrate Noctune musical brightness and resting visibility`.

## NT13-R2 — spatial choreography checkpoint, 2026-11-22

**Implemented — owner visual review pending.** Owner “proceed” after R1 authorizes R2 only. R1's static fill/display curve remain; previous real-song brightness/legibility review is not silently marked passed. R3 environment work and NT14 are not started. No commit/push/deployment.

### Implemented roles and spatial behavior

- **Bass:** main right magenta keeps its existing sustained body/low accent. A qualifying low onset starts a separate finite echo through5 existing secondary panels, ordered by depth z=-13,-18,-29,-34,-44. Delay.1s from acceptance, .18s between panels, .3s pulse tail; raw peak≤.16. Each panel keeps its original bass/sub-bass sustain underneath.
- **Midrange:** existing336 windows retain their sustained low/high-mid body but now have5 depth groups, covering both facades. A broad mid event must have recent low-mid or high-mid rise≥.02 in the existing scene histories. Window heads start.14s apart, .28s tails, raw peak≤.20. A related detail echo traverses6 existing panels at z=0,-10,-15,-26,-31,-41, starting.1s later, .12s between panels, .24s tails, raw peak≤.14. High-mid-only echoes skip the nearest detail at z=0 and start downstream of the approved panel at z=-7.3. The approved left panel's own response is unchanged; low-mid-only attacks still do not accent it.
- **Treble:** the existing6-section bridge now accepts **high**, rather than low, onsets (strength≥.04). It retains its finite .12s step/.32s tail/.92s total sequence and original magenta color. Existing narrow violet accents still alternate banks; they are not redesigned here.

Spatial peaks scale with event strength, qualified rise and Reactivity; R1 calibration follows body+accent per fixture. Each role has one finite sequence and a cooldown through its duration plus.12s. Events during cooldown are consumed, not restarted/queued. No clock-driven animation appears without an accepted event. Session, stale/inactive, Manual, zero Reactivity and reduced motion cancel/consume sequences. Reduced motion retains sustained bodies without spatial/transient motion. Histories are borrowed from the existing midrange/panel controllers; there is no new audio analysis or invented six-band onset stream.

### Rendering and boundaries

`spatial.ts` owns the three bounded event sequences with stable typed arrays. `visualState.ts` composes/calibrates per-fixture values and derives channel means for existing spill. Raw controller targets remain separate from delivered levels. Secondary/window/detail `channels.*.accent` now records the mean spatial accent; the old detail controller's immediate accent remains available internally for qualification diagnostics but no longer flashes all detail panels together.

`ArchitectureDetails.tsx` adds a scalar `InstancedBufferAttribute` to the existing5 secondary/336 window/6 detail instances, preserving every authored transform, mesh and finish. An `onBeforeCompile` extension multiplies standard emission by that per-instance level; it uses an explicit shared program cache key. Three r186 documentation was consulted for this WebGL-specific path. No WebGPU/dependency migration. The driver binds attributes once and the adapter updates their347 floats outside React state. These batches retain material emissiveIntensity1.3, with actual emitted strength `1.3 × instance attribute`; other materials retain scalar delivery. **A constant1.3 material property does not mean those instances are always illuminated.** Manual/zero/silence attribute values are explicitly verified.

Group point lights remain at existing positions and consume final group means. Point spill does not physically travel with each instance; the visual progression comes from source emission and its real planar reflection. This avoids new lights/draw calls, while R3 can separately assess environmental participation. No atmosphere/fog/pavement shader/camera changes, new geometry, material-color changes, shadows or postprocessing. The authored layout/material definitions and cable geometry were checked against a hash-verified R1 temporary source copy.

### Evidence and observed results

[Spatial sequence frames](../../evidence/nocturne/nt13-refinement/r2/spatial-sequences.jpg): rows show magenta depth echo, cyan window depth sequence and bridge traversal; columns show early/middle/late selected stages. Full-resolution step images, including all6 detail stages, are retained alongside [measurements/peak times](../../evidence/nocturne/nt13-refinement/r2/measurements.json). [R1/R2 dense comparison](../../evidence/nocturne/nt13-refinement/r2/before-after.jpg).

| Generated fixed-camera run | Samples / screenshot frames | Video |
| --- | --- | --- |
| Standard |3291 /439|[Video](../../evidence/nocturne/nt13-refinement/r2/nocturne/standard/baseline/generated-baseline.mp4)|
| Low |3285 /439|[Video](../../evidence/nocturne/nt13-refinement/r2/nocturne/low/baseline/generated-baseline.mp4)|
| Reduced motion |3281 /436|[Video](../../evidence/nocturne/nt13-refinement/r2/nocturne/standard-reduced/baseline/generated-baseline.mp4)|

Same generated55s NT11 WAV and original schedule as R0/R1, same camera/viewport/quality/player/Reactivity/exposure. Source-muxed soundtrack and requested8Hz screenshots have the previously documented timing limitations; screenshots are nearest-frame selections, not exact peak instants. Capture metadata includes measured brackets. Agent inspected only generated app images. No private owner media/native picker interaction.

Actual per-render peak times above each group's common sustained baseline (Standard):

| Sequence | Ordered peak times, seconds | Minimum per-instance increment |
| --- | --- | --- |
| Secondary magenta |3.224,3.416,3.608,3.757,3.949|.176|
| Cyan windows depth groups |9.112,9.240,9.389,9.539,9.688|.102|
| Cyan details |9.219,9.325,9.453,9.581,9.688,9.816|.070|
| Bridge sections |15.341,15.469,15.576,15.704,15.811,15.939|.235|

The adapter's actual float32 buffers match the final instance arrays within1e-7; scalar emitters and points match their final outputs. Geometry indices are bounded and map existing instances to depth groups. Bass-only passages cannot trigger the bridge, and the left panel remains independent. All3 runs have exactly zero fixture/instance outputs in late silence. Reduced motion has uniform sustained values within each group, zero spatial accents and zero bridge traversal. Manual on/off and return to Audio/pause pass actual-output checks. Fixtures do not remain lit solely because overall intensity is high.

**Visual limits:** Near-to-far differences and the short bridge head are visible in the selected generated frames, but distant panels become small in the authored framing; this does not certify unaided perceived direction or real-song feel. The scene stays intentionally dark. Owner reviews whether the sequence strength/readability is sufficient before R3; no automatic artistic approval follows numeric peak order.

**Manual reference discrepancy:** Standard Manual on/off and Low Manual off are pixel-identical to R1. Low Manual on differs from the older R1 image in secondary/bridge/violet emitters, despite both snapshots recording full material/point values and identical camera/exposure. R2's current buffers and visible full-on emission agree; the older Low reference lacks some emission. Cause is unconfirmed. The amplified [difference image](../../evidence/nocturne/nt13-refinement/r2/low-manual-difference.png) and comparison metric are retained. Do not claim pixel parity across all quality/state combinations or call this an analysis/geometry fix. This remains a review limitation, not grounds for unrelated renderer changes.

### Verification / next action

Passed:41 test files, including the new spatial cases at30/60/120Hz and existing54 contract/matrix cases; lint/typecheck/build (existing large-chunk warning). New tests check ordered single-event peaks, no queue/retrigger storms, target-band qualification/downstream echoes, held-energy/no false sequence, lifecycle consumption, bounded per-instance adapter output, Manual and zero. Existing bridge tests now explicitly validate high events and reject low/mid. Matrix detail-accent checks now distinguish immediate raw qualification from delayed per-instance delivery. An initial exact Manual-value failure from averaging identical decimal values was fixed by preserving the original Manual scalar rather than relaxing equality.

All3 generated browser captures and the R2 comparison pass delivery, finite bounds, channel means, fixed camera/exposure, role isolation, silence, reduced suppression, Manual/Audio and pause checks. Resource counters remain196 whole-frame calls including reflection,114 geometries,6 textures and7 points. Added cost:347 float attributes (~1.4KB updated per frame), one scalar varying/multiply for three existing material batches and bounded scene-local sequence loops. No target-device GPU timing/FPS or final performance approval is inferred.

Changed versus R1: `ArchitectureDetails.tsx`, `LightingDriver.tsx`, `visualState.ts`, `bridge.ts`; new `spatial.ts`. The other86 original source files—including MI, Noctune scene/fill, approved panel, main magenta, materials, wet floor and other landscapes—match R1. All91 current source hashes match the R2 capture manifest. Added `tests/nocturneSpatial.test.mjs` and `scripts/compare-nocturne-r2.mjs`; updated bridge/visual-state tests, response matrix, shared capture harness, existing docs and generated R2 evidence. Prior uncommitted work preserved.

**Stop at R2.** Review spatial movement and strength using the fixed-camera video/frames, then owner live music/text observations. R1 quiet/readability and real-song gates remain pending; R3 and NT14 are not authorized by automated results. Suggested focused commit only if authorized: `Choreograph Noctune light events through existing fixtures`.

## NT13-R3 — environment participation checkpoint, 2026-11-22

**Implemented — awaiting owner visual review.** Owner “its looking greats, lets keep going” gives positive R2 visual feedback and authorizes R3. This is not inferred approval of the still-incomplete real-song case matrix, artistic parity or device performance. R4 and NT14 remain unstarted/paused.

### Changes and signal delivery

- **Bridge structure:**9 existing underside ribs now carry sparse magenta emission from the corresponding existing bridge section. The original meshes/transforms and steel base color/roughness/metalness remain. A197-float attribute is added to the existing steel batch; only9 entries map to a section, all others use sentinel255 and remain exactly zero-emissive. Each rib receives `.16 × final bridge section`, material intensity1.3, through the existing R2 shader extension. Steel retains tone mapping. Thus the actual emitted contribution is `.208 × section`; there is no separate clock, retrigger path or solid always-on bar. Reduced motion/late silence produce zero rib output. Manual full gives a restrained static diagnostic contour.
- **Pavement:** keep the same planar reflection, wet masks,5 texture taps, Fresnel and static surface irregularity. Add `max(reflected−.055,0)×.2` to the existing `.9×reflected` color, before the same alpha/color pipeline. Only bright reflected components get extra contrast; highlights move because actual reflected source emissions move. No independent audio uniform, colored painted reflection, extra pass, time-varying UVs or water waves.
- **Depth/walls:** one unshadowed cool point at `[0,2.8,-42]`, color#6e879c, distance22/decay2, reaches selected far-wall/curb/gate surfaces while retaining dark foreground corners. Audio intensity is `18 × existing slow atmosphere level`; that level already follows `.65 × context.intensity × Reactivity` with normal2/4s or reduced4/6s smoothing. It does not receive sharp onset events or control any fixture. Manual uses `.65 × max(magenta,cyan,violet)` as the normalized preview level; Manual off is zero. Session/zero/silence behavior follows the existing atmosphere contract, including its natural tail.
- **Haze:** existing gate-haze coefficient.22→.28, with the same slow colored context/fog/gate response and the same plane/material. No new geometry, global exposure increase, static ambient change or fixture response tuning.

The five production files are `ArchitectureDetails.tsx`, `Atmosphere.tsx`, `LightingDriver.tsx`, `WetGround.tsx`, `visualState.ts`. All86 other R2 source files match exactly, including shared MI, scene/camera, approved cyan fixture, R1 fill, magenta/midrange/high-mid/violet/bridge/spatial controllers and wall materials. All91 current source hashes match the capture manifest. The attribute adapter now handles a scaled bridge source and unused-instance sentinel as well as existing spatial channels. Non-bridge steel has no added emission.

### Evidence and observations

[Environment checkpoint frames](../../evidence/nocturne/nt13-refinement/r3/environment-checkpoint.jpg): R2/R3 active passage, selected R3 contour accent and late silence. [Bridge contour frame](../../evidence/nocturne/nt13-refinement/r3/bridge-contour-peak.jpg) is the nearest requested screenshot to a measured contour peak, not a sample-accurate peak image.

| Generated fixed-camera run | Per-render rows / frames | Video |
| --- | --- | --- |
| Standard |3285 /439|[Video](../../evidence/nocturne/nt13-refinement/r3/nocturne/standard/baseline/generated-baseline.mp4)|
| Low |3293 /439|[Video](../../evidence/nocturne/nt13-refinement/r3/nocturne/low/baseline/generated-baseline.mp4)|
| Reduced motion |3294 /437|[Video](../../evidence/nocturne/nt13-refinement/r3/nocturne/standard-reduced/baseline/generated-baseline.mp4)|

[Measured delivery/source preservation](../../evidence/nocturne/nt13-refinement/r3/measurements.json). Each directory includes traces, Manual on/off, Audio-after-Manual, pause, and open-control images. [Audio controls open](../../evidence/nocturne/nt13-refinement/r3/nocturne/standard/baseline/audio-controls-open.png); [Manual controls open](../../evidence/nocturne/nt13-refinement/r3/nocturne/standard/baseline/manual-controls-open.png).

The source WAV/schedule,1440×810 CSS/deviceScale1, centered camera, player50%, Reactivity1, exposure1/ACES4/sRGB and quality settings match R2. Reduced motion is separately labeled. Same source-muxed soundtrack and8Hz screenshot-bracket limitations apply; no owner media or native capture picker was accessed. Brave CDP is the available fallback; do not label it Playwright.

Observed/delivered:

- Standard depth point peaks1.849, Low1.843, reduced1.756, versus the theoretical maximum11.7. Late52–54.7s mean is.050 normal/.152 reduced, reflecting the intentionally slower context tail; fixtures and rib attributes are exactly zero. This is a faint environmental fade, not a latched fixture or free-running onset. Manual on reaches11.7, off0, without changing exposure/camera.
-9 rib mappings are verified, with a normal peak attribute.03767 (material-scaled emission~.049). Reduced rib peak is exactly0. Actual float32 buffers match their final source sections×.16 within1e-7. All existing emitter/point delivery checks continue to pass.
- Descriptive dense still crop means (display-weighted sRGB): floor.0329→.0367, bridge.0458→.0503, selected far wall.0388→.0407, gate.1296→.1417. These are separate-run nearest-frame comparisons, so transient scheduling also contributes; they are not isolated causal or physical luminance measurements. Quiet/late-silence changes are very small. The intended effect is subtle rather than a broad brightness jump.
- Standard Manual All off is pixel-identical to R2. New environmental controls therefore preserve the established resting appearance. Manual All on intentionally changes environment/reflection appearance; no all-on pixel-identity claim is made. The older R1 Low Manual-on reference discrepancy stays documented, not silently resolved by this phase.
- At the tested desktop viewport, open controls occupy the left foreground while the approved cyan panel, central bridge/gate and primary wet-floor cues remain visible. No cue was moved behind UI. Portrait/fullscreen/accessibility breadth belongs to R4; this desktop image is not proof of those modes.

Generated images retain the approved hierarchy: dominant magenta, localized cyan, restrained bridge accents, real colored reflection and a faint far-depth cue. Much of the wall/foreground remains deliberately dark. The owner still judges whether foreground/midground/background participation is sufficiently perceptible in normal playback; automated delivery alone cannot approve the R3 visual exit gate.

### Verification / cost / next checkpoint

Passed41 test files, lint/typecheck/build (existing large-chunk warning); Standard/Low/reduced browser captures and R3 comparison/source-hash checks. Added meaningful tests for slow-context-only depth response, Manual/zero/session behavior, scaled contour delivery and exactly-zero non-selected steel. Existing54 matrix cases and spatial/lifecycle regressions pass. No new test file or analysis system.

Counts remain196 whole-frame draw calls including reflection,114 geometries,6 textures. Point lights increase7→8; the additional light has no shadow map. Extra shader cost is one local point-light contribution, one scalar steel attribute/varying and a few highlight arithmetic operations; no additional texture sample/material/mesh/reflection pass. The197 floats add~788B of attribute delivery per frame. Concurrent instrumented headless runs averaged~16.7ms frame intervals, which do not establish target-device GPU/FPS acceptance; NT14 remains paused.

Verification files: existing `tests/nocturneVisualState.test.mjs` and `scripts/verify-nocturne-r0.mjs` extended for environment buffers and open/closed controls; new `scripts/compare-nocturne-r3.mjs`, generated evidence and existing docs updated. Production changes are limited to the five files above. Prior uncommitted changes preserved. No commit/push/deploy.

**Stop for R3 review.** The local preview at http://127.0.0.1:5183/ serves the rebuilt phase after refresh. R4 integration/restraint/accessibility is next only after owner continuation. Final real-song/artistic parity and device performance remain pending. Suggested focused commit only if authorized: `Extend Noctune music response into bridge and depth`.

## NT13-R4 — integration and target-machine checkpoint, 2026-11-23

**Technical verification ready — visual checkpoint review pending.** Owner “lets move” authorizes R4; later “continue” resumes it. All91 production source files match the R3 manifest. No appearance/controller/analysis changes were needed: preserve the approved R1–R3 composition and mappings. R5/final real-song parity and NT14 remain separate gates; no commit/push/deployment.

### Signal specificity, timescales and restraint

[Signal checkpoint frames](../../evidence/nocturne/nt13-refinement/r4/signal-checkpoint.jpg) and [assessment](../../evidence/nocturne/nt13-refinement/r4/assessment.json). A generated65s matrix extends the existing NT12 source opt-in:0–2 silence,2–5 bass100Hz,5–8 low-mid450Hz,8–11 quiet1000Hz,11–14 loud1000Hz,14–17 treble8000Hz,17–19 release,19–28 separated low/mid/high attacks,28–33 bass near held1000Hz,33–38 low-mid attacks near held1000Hz,38–44 quiet/loud dynamics,44–49 dense four-frequency sustain,49–65 silence. The original generator's default60s output is preserved; refinement mode uses a separate generated WAV/schedule.

| Generated run | Validated per-render rows / frames | Video |
| --- | --- | --- |
| Standard |3893 /519|[Video](../../evidence/nocturne/nt13-refinement/r4/nocturne/standard/baseline/generated-baseline.mp4)|
| Low |3893 /519|[Video](../../evidence/nocturne/nt13-refinement/r4/nocturne/low/baseline/generated-baseline.mp4)|
| Reduced motion |3896 /508|[Video](../../evidence/nocturne/nt13-refinement/r4/nocturne/standard-reduced/baseline/generated-baseline.mp4)|

Same1440×810/deviceScale1, fixed Noctune camera, player50%, Reactivity1 and actual96kHz/4096 analysis; each capture records actual quality/DPR, exposure1/ACES4/sRGB. Instrumented isolated **production builds** exclude dev-server behavior. Videos mux generated source audio, not captured browser output. Requested8Hz screenshots retain timing brackets; images are not exact transient-peak or sample-accurate sound-output measurements. Agent inspected only generated input/app scenes.

Standard measured case means/peaks:

| Case | High-mid energy | Final left-cyan level | Accent result |
| --- | --- | --- | --- |
| Quiet sustained1000Hz |.0424 mean|.1045 mean|0 after settling|
| Loud sustained1000Hz |.1413 mean|.3104 mean|0 after settling|
| Separated1000Hz attacks |.0210 interval mean|.1112 interval mean|Raw peak.0742; final additive increment up to.1050|
| Low-mid attacks near held1000Hz |.0706 mean|.1682 mean|0 high-mid accents|
| Bass-only / low-mid-only |Only tiny FFT leakage|Peak<.001|0 high-mid accents|
| Late silence62–64.7s |0|0|All fixture/instance outputs exactly0|

Loud input remains clearly stronger without a hard full-brightness plateau. The maximum final fixture level in the entire generated normal/Low matrix is.6474/.6487, leaving headroom; reduced maximum.3059. The attack increment is calculated as `f(body+accent)−f(body)`, respecting the existing nonlinear R1 curve, not equating raw accent to actual brightness. A.105 final increment gives.1365 added panel material intensity and3.15 added point intensity at its own30 full scale. Actual emitter/attribute/point delivery is independently checked. The video provides the corresponding scene; owner perception is not certified by these numbers.

Reduced motion suppresses all transient/spatial accents while preserving ordered sustained response (quiet/loud panel means.0911/.2848). Normal main/secondary low response, mid depth sequences, narrow high bridge/violet response and slow context remain distinct. Bass-only/low attacks cannot trigger the bridge. Held high mids remain stable during bass/low-mid activity. Sustained dense sound does not generate a free-running chase; finite sequences expire. Existing tenths-of-second accents, roughly one-second travel and multi-second atmosphere provide the requested timescale separation without retuning approved appearance.

### UI, lifecycle and accessibility evidence

Replacement integration runs are in each quality directory's **`controls/capture.json`** with screenshots. They contain16 records each: positive real generated input; zero Reactivity; Manual at zero gain; actual seek/new MI session; explicit synthetic stale reader; explicit new-session retained-event/context-only reader; scene switching; quality changes retaining the same Canvas/audio; dynamic reduced motion; portrait390×844; wide1920×810; actual headless fullscreen API; real hidden-tab return; abrupt file disconnect; file reconnect; forced-freeze diagnostic.

Passed actual-output checks: zero kills fixture/depth output; Manual still works at zero gain; Audio return uses fresh band response; stale/retained events do not replay; context-only input cannot activate fixtures; source/audio identity survives scene/quality/fullscreen changes; portrait controls fit without page overflow; actual second-page activation sets document visibility **hidden**, and returning restores rendering/analysis. Abrupt Disconnect releases the generated element/src, publishes inactive MI and clears fixtures/depth; selecting the generated source again yields a fresh working session. Reduced motion removes bridge/rib travel and accents. Source picker/permissions and owner captured media were not automated or inspected.

[Portrait controls](../../evidence/nocturne/nt13-refinement/r4/nocturne/standard/controls/portrait-controls-open.png), [wide controls](../../evidence/nocturne/nt13-refinement/r4/nocturne/standard/controls/wide-controls-open.png), [zero Reactivity](../../evidence/nocturne/nt13-refinement/r4/nocturne/standard/controls/zero-reactivity.png), [reduced motion](../../evidence/nocturne/nt13-refinement/r4/nocturne/standard/controls/dynamic-reduced-motion.png), [disconnect](../../evidence/nocturne/nt13-refinement/r4/nocturne/standard/controls/abrupt-generated-file-disconnect.png).

**Owner native-window evidence:** owner explicitly selected this Linux/GTX1660 SUPER as the target and answered **“Both work normally”** to playback/lighting recovery after minimizing/restoring and native fullscreen Escape. [Exact question/response](../../evidence/nocturne/nt13-refinement/r4/owner-review.json). This is text observation, not remote inspection; browser/version and musical excerpts were not supplied. It closes the physical minimize/Escape observation for this checkpoint without claiming all musical listening cases passed.

**Retained automation limitation:** forced `Page.setWebLifecycleState(frozen→active)` in the headless harness did not restart requestAnimationFrame even after bring-to-front; its stale sample is explicitly marked **not passed**. Do not treat that artificial case as a successful freeze test or infer that normal owner restoration fails. Actual background-tab and owner-native restoration pass. The forced-freeze cause remains unconfirmed and no production workaround was introduced.

**Earlier harness failures:** baseline directories retain failed post-capture control attempts. The65s video/feature traces were complete and are independently validated by `compare-nocturne-r4.mjs`; successful replacement controls are stored separately rather than relabeling the old attempt as wholly passed. Fixes were limited to test setup: explicitly mark synthetic active inputs, wait for current post-seek data, use the real Play/controller resume path and keep a positive test passage available during startup. Failed forced-freeze recovery was isolated from required Disconnect checks. No production bug/analysis fix is claimed from these harness corrections. Brave CDP remains the available automation fallback, not Playwright.

### Owner-selected target performance

[Results](../../evidence/nocturne/nt13-refinement/r4/performance/results.json) and per-quality raw timing rows. Target: Linux7.2.11-arch1-1, AMD Ryzen5 5600G CPU, ANGLE/**NVIDIA GTX1660 SUPER** hardware renderer; headless Brave/Chrome156,1440×810 CSS, Standard DPR1 / Low.75. Separate instrumented production copy, generated input,5s warmup then30s sample per quality, no screenshots or concurrent agent capture runs. Other desktop activity is uncontrolled; owner native-window review may overlap. This is measured target hardware, not a headed-owner-window performance guarantee.

GPU timing uses supported `EXT_disjoint_timer_query_webgl2` around the outer renderer call, including nested planar reflection; availability/disjoint handling follows the installed Three r186 implementation. It measures renderer GPU execution, not compositor/monitor presentation or audible latency. Frame cadence and CPU render-submit times are separate. Warmup is excluded; outliers are retained.

| Metric | Standard | Low |
| --- | --- | --- |
| Sample duration / frames |30.002s /1800|30.001s /1800|
| Mean scene cadence |60.0FPS|60.0FPS|
| p95 / max frame interval |17.0 /17.4ms|17.0 /17.2ms|
| Mean / p95 GPU render |4.43 /5.38ms|3.53 /5.53ms|
| p95 CPU render submit |3.0ms|2.8ms|
| Frames>33.3ms / disjoint queries |0 /0|0 /0|

Low's mean GPU time is lower, but p95 is not uniformly lower; this single sequential pair is not a statistically isolated speedup claim. Both are frame-paced near60Hz. Existing project performance targets are guidelines, so these measurements establish the selected-device baseline rather than inventing a new hard acceptance threshold. No performance tuning was indicated by these samples.

Input validation verifies841 samples in known sustained signal windows per quality have active, nonzero MI. The fixture deliberately includes silent attack gaps:1195/1194 of1800 frames have positive overall energy. An initial benchmark wrongly required70% positive frames and was rejected; its failure metadata is retained in `initial-invalid-validation.json`, and no timing from it is accepted. The replacement uses the actual sustained schedule, not a loosened analysis threshold.

Resources stay196 whole-frame draw calls,114 geometries,6 textures,8 points; no R4 added lights, shaders, overdraw or passes. Existing cost includes one planar-reflection pass/5 floor texture taps, additive haze,8 unshadowed point contributions and544 brightness floats from R2/R3. A direct pixel-overdraw heatmap or isolated per-shader GPU delta was not measured; counts/topology and total GPU timings are reported instead. NT14 remains a separate later review.

### Files, verification and next checkpoint

Passed41 test files, lint/typecheck/build (existing bundle warning),39 spectrum-window assessments across3 modes, current actual UI/output checks in3 replacement control sets, source-hash preservation and two30s target performance samples. Forced CDP freeze remains separately flagged; owner native observations are not mislabeled automated. No production change, dependency, camera adjustment or new analysis.

Verification work: extend `generate-nocturne-matrix-review.mjs` opt-in source and shared `verify-nocturne-r0.mjs`; `nocturne-r4-controls.mjs`, `compare-nocturne-r4.mjs`, `verify-nocturne-r4-performance.mjs`; generated R4 evidence and existing docs. Temporary instrumentation stays outside production sources. Prior user work preserved; no agent commit/push/deploy. Suggested verification commit only if authorized: `Verify Noctune integration and target GPU performance`.

**Stop for the R4 checkpoint.** Next is R5's aligned Crimson comparison and owner musical/artistic decision, using the approved generated-capture plus live/text-only owner-song policy. Do not close NT13 or start NT14 on this technical evidence alone.

## NT13-R5 — aligned comparison and owner gate, 2026-11-23

**Owner approved — R5/NT13 review gate complete (2026-11-23).** Owner “proceed” after R4 authorizes this phase. No production changes or further visual tuning; all91 source hashes match R3/R4, including MI, approved scene geometry/camera, fixture mappings and Crimson. No commit/push/deployment. Owner explicitly approves all five criteria and reports all listed current-build real-song cases worked. NT14 is next, not started.

### Reviewable comparisons

- [Standard source-aligned comparison](../../evidence/nocturne/nt13-refinement/r5/standard-comparison.mp4).
- [Low source-aligned comparison](../../evidence/nocturne/nt13-refinement/r5/low-comparison.mp4).
- [Quiet / dense / silent paired frames](../../evidence/nocturne/nt13-refinement/r5/paired-states.jpg); [encoded-video inspection frame](../../evidence/nocturne/nt13-refinement/r5/paired-video-frame.jpg).
- Noctune Standard [Manual All on](../../evidence/nocturne/nt13-refinement/r5/nocturne/standard/baseline/manual-all-on.png) and [Manual All off](../../evidence/nocturne/nt13-refinement/r5/nocturne/standard/baseline/manual-all-off.png). Low and full-resolution individual videos/stills/trace/capture metadata are in each scene/quality baseline directory.
- [Comparison measurements / stage values](../../evidence/nocturne/nt13-refinement/r5/comparison.json), [generated source schedule](../../evidence/nocturne/nt13-refinement/r5/generated-schedule.json), [source manifest](../../evidence/nocturne/nt13-refinement/r5/source-manifest.json).

Every individual run uses the same55s generated NT11 arrangement and WAV SHA256,1440×810 CSS/deviceScale1, player50%, Reactivity1, normal motion. Standard DPR1/Low.75, exposure1/ACES4/sRGB/shadows off are asserted. Instrumentation lives in isolated production builds. Captures: Noctune Standard3305 rows, Crimson Standard3296; Noctune Low3294, Crimson Low3296;439 screenshots each. Actual96kHz/4096 analysis is logged. Runtime/console errors are empty.

Paired videos trim both individual timelines to **source time0.500–54.500s**, reset their presentation clocks, then combine them with one generated WAV soundtrack offset by0.500s. Each is54s,1440×466, with camera labels, elapsed time and source-phase legend. The same source time—not a guessed visual match—defines alignment. Sound is generated-source muxing, not recorded browser output. Requested8Hz screenshots and measured request brackets (up to213ms across runs), plus25fps composite resampling, prevent sample-accurate onset/perceptual claims. Individual raw traces retain actual consumed feature/output timestamps.

Noctune camera position **and quaternion** are fixed for every consumed sample. Crimson retains authored travel/rebasing, with poses recorded; its journey phase is not synchronized across quality runs. Those camera effects contribute expressiveness and are not mistaken for music-driven architectural motion. Shared exposure does not make scene-specific shader/material tone mapping or raw response units photometrically equivalent. The comparison is an owner art-direction review, not a luminance or equal-camera-motion benchmark.

### Input → response → visible result

Representative Standard steady-window means, with event roles confirmed in the existing exact delivery/spatial/R4 isolation checks. Times refer to the source schedule; short-event envelopes should be watched in the video, not inferred from a single still.

| Source time / musical role | Existing MI input | Noctune final output | Visible role |
| --- | --- | --- | --- |
| Quiet0.7–2.5s |High mids.0177|Left cyan.0449 / point1.347; main magenta effectively0|Restrained local cyan and stable dark architecture; no decorative travel|
| Bass5–8.8s |Bass.1035 + low events|Main magenta.2678; left point~.001 from negligible leakage|Dominant magenta weight/attacks and secondary near→far echoes; cyan does not follow bass|
| Mids11–14.8s |Low mids.0566 / high mids.0495|Left cyan.1209 / point3.626; window/detail bodies and qualified sequences on attacks|Architectural cyan distinct from continuing bass response|
| Dense16–22.8s |Bass.0926 / high mids.0729; staggered low/mid/high events|Main.2739, left cyan.2004 / point6.012, depth point1.699|Multiple spatial roles, sparse bridge/rib heads, real colored reflections and slow background depth|
| Breakdown26–28.8s |High mids.0247; low energy absent|Left cyan.0623; main~.0001, depth1.096 with intentional slow context tail|Localized sustained light with the larger bass fixture fading away|
| Late silence52–54.7s |All six energies0|All fixture/instance outputs0; depth point~.051|No spatial events or fixture latch; faint static visibility and slow environmental recovery|

Crimson's same dense source produces body mean.3048, low accent mean.1288, mid.0273, high.0486, glowActivity.3531, with Candidate weight1. These are **Crimson-specific controls**, not comparable light-brightness units. Its visible cues remain central sun/glow, contours/valley response, narrow details and authored camera travel. Noctune's cues remain source lights, architecture, wet reflections and depth; neither scene was changed to mimic the other.

### Five-criterion assessment

| Criterion | Evidence / technical finding | Owner gate |
| --- | --- | --- |
| Resting visibility |Quiet and Manual-off references retain bridge/door/curb silhouettes, with substantial negative space. Shared exposure stays fixed; minimum fill does not depend on song intensity.|Owner approved quiet visibility; Manual All on remains an upper bound.|
| Spatial movement |R2 ordered per-instance peaks plus fresh fixed-camera video show bass depth echoes, mid depth progression and high bridge/rib traversal. Bodies stay separate from finite accents.|Owner approved directional movement and perceptual clarity.|
| Music specificity |R4 isolated bands, quiet/loud/attacks and near-band tests pass; fresh R5 actual material/attribute/point delivery matches outputs. Silence clears every fixture.|Owner approved music specificity and reports all listed current-build listening cases worked.|
| Whole-scene participation |Foreground real wet reflections, midground fixtures/bridge/contours and background gate/haze/local depth spill appear in active captures and recede during silence.|Owner approved foreground/depth participation and restraint.|
| Artistic parity with Crimson |Same-source/time-aligned Standard/Low pairs expose both expressive behaviors while retaining their identities and explicit camera difference.|Owner explicitly approved expressive parity with Crimson; this is an artistic decision, not a numerical brightness claim.|

No new implementation defect is established by these captures. There is no evidence-based reason to change the approved geometry, camera, MI or every fixture group. If owner identifies a specific failed criterion/passage, make a bounded scene-local proposal and repeat the relevant comparison; do not tune speculatively before that observation.

### Owner review / final decision ledger

The owner-approved evidence method is **generated captures plus live owner review**. This intentionally replaces the roadmap's recorded real-song method under repository privacy rules. Keep permitted-tab music on the owner's device: the agent does not attach a debugger, capture audio/video, inspect private media or persist a live feature history. The owner may compare scenes live and provide anonymous passage labels/text observations.

Existing historical case A says magenta follows bass but the corridor was too dark before subsequent revisions. Later positive R2 appearance feedback and R4 native minimize/Escape confirmation are recorded separately. They were not used to infer final approval. The owner subsequently answered the explicit current-build case question covering bass-heavy, midrange-dense, sustained ambient, light/percussive and quiet-to-loud with **“all worked.”** Detailed passage labels/timestamps were not supplied or required. No owner media was accessed.

Decision status: **owner-approved; R5 and NT13 review gate complete.** Exact visual reply: **“Approve all five visual criteria.”** Exact reply to the five current-build listening cases: **“all worked.”** [Approval record](../../evidence/nocturne/nt13-refinement/r5/owner-review.json). This approval is explicit owner evidence, not inferred from “proceed” or automated tests.

### Verification / boundaries

Passed41 test files, lint/typecheck/build (existing bundle warning), all4 fresh production-copy captures, identical source/settings checks, fixed Noctune pose, actual scalar/float32-buffer/point/depth delivery, exact late fixture silence and Manual reference checks. Encoded Standard comparison was inspected; stream metadata confirms video+audio and54s duration. Source hash assertions preserve all91 files and the production bundle remains `index-DsoqOwhx.js`. No new production cost; R4's selected-target performance results remain the applicable measurements, not the8Hz capture cadence.

Files: existing `scripts/verify-nocturne-r0.mjs` extended for R5 production captures; new `scripts/compare-nocturne-r5.mjs`; generated R5 evidence and existing progress/roadmap/verification/decision/report docs. Prior uncommitted work preserved. No dependency, production modification, commit, push or deployment. Suggested evidence commit only if authorized: `Prepare aligned Noctune and Crimson final review`.

**Stop at the approved R5 checkpoint.** NT13 is complete on explicit owner approval. NT14 performance/accessibility/lifecycle review is the next task after continuation; R4 measurements may be reused as relevant prior evidence, not automatic NT14 completion. No commit/push is authorized by this artistic approval.

Subsequent owner scope decision (2026-11-23): **“we skip nt 14 and 15.”** NT13/R5 remains approved. NT14/NT15 are skipped, not marked passed; existing evidence/limitations remain. No further phase or commit is queued. This supersedes the earlier “NT14 next” handoff language above.
