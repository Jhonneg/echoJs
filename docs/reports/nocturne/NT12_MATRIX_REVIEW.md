# NT12 — deterministic feature and response matrix

Verified2026-11-22 after owner “proceed” following NT11; later “continue” resumes this phase. **54 contract cases,36 spectral configurations and28 browser PCM/control criteria pass.** No production or Music Intelligence changes are required. NT13 live real-music review has not started.

## Evidence layers

| Layer | Inputs and purpose | Result |
| --- | --- | --- |
| Scene contract | Explicit MusicFeatures, deterministic timestamps/events,30/60/120 Hz; response/lifecycle rules and final adapter delivery |54 cases passed |
| Production MI processor | Prescribed single-bin spectra,100/450/1000/8000 Hz,44.1/48/96 kHz ×30/60/120 Hz |36 configurations passed |
| Browser analyser and UI | Generated PCM through original local-file/analyser/MI paths; normal/reduced fixture delivery and original controls |28 criteria passed |

These layers have different meanings. Synthetic spectra are not a browser FFT recording; explicit feature inputs test scene interpretation rather than engine quality. Browser PCM establishes the actual measured features and delivered renderer properties, with real leakage and temporal release. None grants real-song artistic or native/device acceptance.

[Deterministic expected/observed results](../../evidence/nocturne/nt12/deterministic-results.json), [contract trace](../../evidence/nocturne/nt12/contract-trace.json), [processor trace](../../evidence/nocturne/nt12/spectral-trace.json) and [browser expected/observed results](../../evidence/nocturne/nt12/browser-results.json) retain the data.

## Deterministic matrix

At each cadence,18 contract cases cover:

- Silence; bass, low-mid, high-mid and air sustained roles, with no invented repeated accents or bridge travel.
- Isolated fresh low/mid/high attacks, above sustain and finite.
- Low-mid-only attack near held high mids: cyan details accent, approved left panel accent0.
- Bass+held high-mid: magenta accents while left-panel sustain stays independent and stable.
- Quiet/loud/falling high-mid strength: ordered response and3× settled brightness for3× feature strength.
- Duplicate events: retained repeated event list produces the same outputs/bridge state as a control whose consumed list is removed.
- Stale, inactive, session switch, Manual, zero Reactivity and reduced motion: expected reset/release/preview behavior, consumed suppressed events and no replay on return. Inactive is restored active before the replay assertion.

Every update also verifies one borrowed read, no feature mutation, finite bounded channels, individual material intensity=own final level×1.3, and each point=associated final channel×original full intensity. Bridge emitters use individual section values rather than the mean summary.

The processor layer supplies calibrated spectral power to the unchanged `createMusicAnalysis`. Four frequencies ×three sample-rate/FFT layouts ×three cadences verify correct band roles, prescribed normalized quiet/loud energies.1/.3, real shared onset events for isolated attacks and no repeated onsets during stationary energy. At96 kHz FFT4096 is used; other rates use2048. Nearest-bin frequency is recorded explicitly. These are ideal single-bin inputs, not a claim that finite-window PCM has zero spectral spread.

1000 Hz belongs to highMids800–2500 Hz and broad mid, so it supports cyan panel/windows, not low-mid detail accents.450 Hz is added to test the lowMids250–800 Hz path and local rise qualification.100 Hz supports bass/sub-bass lighting;8000 Hz is air/broad high.

## Actual browser PCM and controls

| Evidence | Link |
| --- | --- |
| Normal60 s matrix, synchronized generated soundtrack | [Demonstration](../../evidence/nocturne/nt12/current/generated-music-demo.mp4) |
| Same source, reduced motion | [Reduced demonstration](../../evidence/nocturne/nt12/reduced/generated-music-demo.mp4) |
| Normal per-render input/target/accent/final/material/point trace | [Trace](../../evidence/nocturne/nt12/current/trace.json) |
| Positive-input zero / Manual / pause, normal | [Control values](../../evidence/nocturne/nt12/current/controls.json) |
| Same controls under reduced motion | [Reduced control values](../../evidence/nocturne/nt12/reduced/controls.json) |

Schedule: silence0–2 s;100 Hz sustain2–5;450 Hz5–8; quiet1000 Hz8–11; louder1000 Hz11–14;8000 Hz14–17; release17–19; isolated100/1000/8000 Hz attacks19–28; bass+held1000 Hz28–33;450 Hz attacks near held1000 Hz33–38; rising/falling1000 Hz38–44; silence44–60.

Both runs retain480 composited screenshots at nominal8 Hz, indexed by actual audio currentTime and muxed with the same generated WAV. Approximate125 ms visual sampling is not native-FPS or sample-accurate recording. Per-render scalar samples:3,607 normal/3,599 reduced; polling584/587. The6000-row cap is not reached. Camera stays(0,1.6,5). Numeric renderer-property delivery is checked on every sampled rendered update; screenshots separately show the visual result. These values are not photometric luminance measurements.

The browser uses its existing50% player volume. The video soundtrack is the generated source WAV, not captured browser output. Physical audibility/volume matching and native picker/capture are not verified. No private/captured media is inspected, recorded or retained.

## Input feature versus final fixture values

Normal-run settled means, with the original material/point coefficients:

| Input section | Measured feature | Final fixture level | Corresponding material / point |
| --- | ---: | ---: | --- |
|100 Hz | bass.13358, subBass.04615 | main magenta.16585 | ×1.3 /×50 |
|450 Hz | lowMids.14133 | small cyan details.11306 | ×1.3 /×40 |
|Quiet1000 Hz | highMids.04240 | approved left panel.05512 | ~.07165 /1.6535 |
|Loud1000 Hz | highMids.14133 | approved left panel.18372 | ~.23884 /5.5117 |
|8000 Hz | air.14132 | violet body.01938 | ×1.3 /×12 |
|Bass+held1000 Hz | highMids.07066 | left panel.09186, accent0 | ~.11942 /2.7559 |

Quiet/loud high-mid feature and panel brightness both scale approximately3.33×. Isolated low/mid/high accent peaks are.25439 main magenta,.07420 left panel and.19382 right violet respectively; all expire. Actual final pulse peaks include their sustained component and are recorded separately.

The critical qualification case passes: during450 Hz attacks near held1000 Hz, small-panel accent peak.05239 and final peak.15270, while the left panel holds mean.09187 with accent0. Bass attacks near held high mids likewise leave panel accents0 while magenta accents. Rising/falling normal panel means move about.07478→.16651→.05304; reduced motion follows more slowly, about.06998→.15452→.09346.

[Bass-only still](../../evidence/nocturne/nt12/current/bass100.jpg), [loud1000 Hz panel](../../evidence/nocturne/nt12/current/loud1000.jpg), [qualification case](../../evidence/nocturne/nt12/current/lowmid-near-highmid.jpg) and [late silence](../../evidence/nocturne/nt12/current/silence.jpg) provide visual examples. Browser inspection confirms the corresponding magenta/cyan roles and retained dark architecture.

All reduced-motion sharp accents and bridge section values are0. Both runs have every fixture exactly0 in the final silence window; atmosphere retains its expected slow tail (last level≈.00171 normal/.00541 reduced).

## Leakage, tails and pass criteria

Browser assertions use settled windows and explicit criteria rather than requiring mathematical zero everywhere.100 Hz has Blackman-window power in nearby subBass bins; both belong to intended low lighting. Far-band leakage is tiny: bass-only panel mean≈.0000029, and450 Hz panel≈.0000059, with no panel accents. Unrelated settled levels in specified normal isolation windows must stay below.001.

A group illuminated in the preceding section can remain briefly visible while releasing, especially in reduced motion. Quiet1000 Hz follows450 Hz, so cyan details can still have a small fading residual; this is not a new low-mid attack. High-only follows loud high mids, and the slower reduced panel tail is likewise expected. No fresh unrelated accents are accepted in those settled sections. Exact zero is required for silence and zero-gain cases, not for finite-window leakage or every transition frame.

The separate control runs verify zero Reactivity while highMid energy remains>.1: all actual emitters, points and atmospheric level become0. Manual all-on at zero gain gives every emitter1.3 and every original point its full intensity; Manual off gives0. Returning to Audio/re-enabled gain restores the panel, and pausing then lets all fixture levels settle0. These original UI tests pass in both motion settings.

## Preservation, files and checks

All90 production source hashes match the original NT12 task-start manifest. The workspace now has checkpoint `6693170` (“started nt12”), containing the first contract tests/processor artifacts. After continuation the original temporary directory was unavailable; a replacement `/tmp/echo-nt12-baseline-OxRkB1` was created only after all90 current hashes matched the original saved manifest. No production or DSP bytes changed across the continuation. No agent commit/push/deployment was made.

NT12 files comprise:

- `scripts/nocturne-response-matrix.mjs`, `scripts/verify-nocturne-matrix.mjs` and `tests/nocturneMatrix.test.mjs`: shared deterministic contract test/artifact runner plus processor/source preservation.
- `scripts/generate-nocturne-matrix-review.mjs`, `scripts/verify-nocturne-matrix-browser.mjs`, `scripts/compare-nocturne-matrix-browser.mjs`: generated PCM, actual browser probes/controls and expected/observed evaluation.
- NT12 evidence, this report and progress/roadmap/mapping/migration/architecture/decisions/verification notes.

Passed all40 test files, lint, typecheck via production build and build; existing bundle warning remains (JS1,239.61 kB/gzip345.07 kB, unchanged asset hash). All54 contract cases,36 spectral configurations and28 PCM/control criteria pass. Both main browser runs and both control runs report no runtime errors. Renderer resources remain114 geometries/6 tracked textures;7 existing points and all scene/fixture/material/camera code remain unchanged. No production cost is introduced; hardware performance is not newly certified.

## Next gate

NT12's deterministic/generated technical gate passes. Stop before NT13, which requires live owner-authorized contrasting music and owner notes about perceived musicality. Do not record/persist/inspect captured media; generated clips do not replace that live review. Native capture/audibility, device performance and owner musical acceptance remain pending.

Suggested focused verification commit after authorization: `Verify Nocturne feature-to-fixture response matrix`.
