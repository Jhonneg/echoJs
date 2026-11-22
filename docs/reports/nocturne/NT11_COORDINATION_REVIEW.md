# NT11 — whole-scene coordination assessment

Assessment prepared2026-11-22 after owner “proceed” following NT10. **Retain the current mappings: no production tuning is justified by this generated comparison.** Technical checks pass; NT11's required owner artistic approval remains pending. NT12 is not started. Earlier uncommitted NT09/NT10 work is preserved; no commit, push or deployment.

## Scope and decision

NT11 asks whether the separate lighting/atmosphere roles read as one composition through a quiet intro, bass entrance, midrange addition, dense passage, breakdown and return. Existing controllers already provide distinct caps and timings: low sustained secondary magenta, slow restrained windows, quicker cyan details, independent approved high-mid panel, alternating violet accents and finite bridge sweeps. NT10 adds a slower atmospheric layer.

The staged arrangement shows these roles without a specific balance defect. Main magenta remains the visual anchor; windows/detail/panel have different sustained levels; violet/bridge accents are localized rather than lighting every instance together. Therefore no new shared gain, limiter, energy-history layer or coefficient change is introduced. A speculative global dimmer would couple independent groups and could suppress the approved cyan panel because unrelated bands were loud.

This is an assessment of the existing composition, not a claim that all possible music is artistically validated. Owner judgment is required before closing NT11 or the grouped NT09–NT11 environment gate.

## Synchronized demonstration

| Evidence | Link |
| --- | --- |
| Current composition, fixed camera | [Normal generated demonstration](../../evidence/nocturne/nt11/current/generated-music-demo.mp4) |
| Same arrangement, reduced motion | [Reduced demonstration](../../evidence/nocturne/nt11/reduced/generated-music-demo.mp4) |
| Full staged values and delivery | [Comparison JSON](../../evidence/nocturne/nt11/comparison.json), [stage CSV](../../evidence/nocturne/nt11/stage-levels.csv), [normal trace](../../evidence/nocturne/nt11/current/trace.json) |

The55 s wholly generated arrangement uses110/450/1500/4500/8000 Hz components with deliberately staggered low/mid/high attacks. Peak generated PCM amplitude.548, without clipping. It passes through the unchanged real local-file and Music Intelligence integration. No captured/private media is inspected or recorded.

| Time | Authored test stage | Current screenshot / observed role |
| --- | --- | --- |
|0–3 s | Quiet high-mid intro | [Intro](../../evidence/nocturne/nt11/current/intro.jpg): cyan panel, very faint window support; no bass lighting |
|3–9 s | Bass entrance | [Bass](../../evidence/nocturne/nt11/current/bass.jpg): main/secondary magenta and low-event bridge; cyan panel fades |
|9–15 s | Low/high-mid addition | [Mid addition](../../evidence/nocturne/nt11/current/mid-addition.jpg): windows/details/panel join the retained bass layer |
|15–23 s | Dense mixed passage | [Dense](../../evidence/nocturne/nt11/current/dense.jpg): layered color with separate accents and dark architectural areas |
|23–29 s | Breakdown to quiet high-mid pad | [Breakdown](../../evidence/nocturne/nt11/current/breakdown.jpg): magenta/violet/bridge release; panel sustains quietly and atmosphere fades slowly |
|29–37 s | Mixed return | [Return](../../evidence/nocturne/nt11/current/return.jpg): layered roles return with genuine new input events |
|37–55 s | Silence | [Late silence](../../evidence/nocturne/nt11/current/silence.jpg): fixtures settle to0; faint environmental illumination and a small atmosphere tail remain |

These stage names describe the generated source schedule. The scene does not detect an intro, breakdown, return, chorus or beat label. No new section classifier or tempo clock exists.

Camera stays(0,1.6,5).440 composited screenshots per run are indexed by actual audio currentTime and muxed with the same generated WAV: nominal8 Hz screenshots, approximately125 ms visual sampling, not native-FPS or sample-accurate recording. Numeric probes run after final material/light/atmosphere delivery on each rendered update: normal3,299 rows, reduced3,297 rows; browser polling537/526 rows respectively. The6000-row numeric cap is not reached. Rendering/readback instrumentation is isolated and is not device-performance evidence.

## Observed coordination

Browser frame inspection shows the bright right magenta fixture balances the smaller left cyan panel without a mirrored composition. Dense passages retain large dark wall areas, with upper cyan windows and violet detail subordinate to the main fixture. The breakdown releases the magenta weight while the quiet cyan pad and slower distant glow retain continuity; the return restores the same roles without an invented scene transition.

Mean final levels over settled portions of each normal stage:

| Stage | Main magenta | Secondary | Windows | Cyan details | Left cyan panel | Right/left violet | Atmosphere |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Intro | ~0 | ~0 | .0026 | ~0 | .0230 | ~0/~0 | .0039 |
| Bass | .1545 | .0491 | .0001 | .0001 | ~0 | ~0/~0 | .0532 |
| Mid addition | .1223 | .0370 | .0280 | .0452 | .0643 | ~0/~0 | .0706 |
| Dense | .1595 | .0460 | .0380 | .0565 | .1115 | .0267/.0254 | .0940 |
| Breakdown | ~0 | .0002 | .0042 | ~0 | .0322 | ~0/~0 | .0608 |
| Return | .1597 | .0457 | .0379 | .0565 | .1116 | .0269/.0256 | .0848 |
| Late silence | 0 | 0 | 0 | 0 | 0 | 0/0 | .0028 |

Numeric levels do not represent equal perceptual prominence for differently sized fixtures. The screenshot comparison supplies that context. No group approaches its cap in the assessed dense passage: main peak.2314, secondary.0496, windows.0397, details.0565, panel.1840, violet banks.1095. Panel accent peak.0142 is small in this mix; most panel variation is sustained high-mid energy. This does not replace the earlier isolated transient review or establish that accents are perceptually sufficient in every song.

At most one violet bank has a positive accent on any recorded update. At most3 of6 bridge sections are nonzero during a sweep; no stacked six-section chase. Main magenta's low-event accent and panel's qualified high-mid accent remain separate from sustain. Windows and secondary magenta do not acquire event accents. Shared low events intentionally coordinate main magenta and bridge timing, without one consuming the other's final brightness.

In reduced motion every sharp channel accent and bridge section remains0, while slower sustained roles remain. Both runs have every fixture output exactly0 in the late-silence window. Atmosphere ends at about.00186 normal/.00652 reduced, approaching the dark baseline more slowly; this is not reported as exact atmospheric zero. Existing wet reflections follow real source lights; bridge mirror images remain outside the fixed viewport as recorded in NT09.

## Verification and preservation

Passed:

- All39 test files, lint, typecheck via build and production build. Existing bundle warning remains: JS1,239.61 kB/gzip345.07 kB; same asset hash as NT10.
- Per-render feature/response/delivery checks: every material equals its own final level×1.3 (individual bridge section where applicable), every point equals associated final level×its original full intensity. All outputs remain finite/bounded.
- Stage-role checks: quiet panel, bass isolation from panel, midrange addition, distinct dense accents, breakdown release, layered return and silence settling. This is intentionally narrower than NT12's upcoming deterministic matrix.
- Violet/bridge localized overlap, reduced suppression, atmosphere bounds and fixed camera. Both successful browser runs have no console/runtime errors. Original app scene/quality/Manual smoke and source identity checks pass after playback.
- All90 source files byte-identical to the task-start NT10 snapshot `/tmp/echo-nt11-baseline-2b1pWQ`. This comparison includes prior uncommitted NT10 implementation rather than treating HEAD as the current baseline.
- Renderer resources stay at114 geometries/6 tracked textures, with the same7 point lights. No new production code, render pass, shader or allocation is introduced. This is not a fresh hardware-FPS measurement.

Files added for NT11: `scripts/generate-nocturne-coordination-review.mjs`, `scripts/verify-nocturne-coordination.mjs`, `scripts/compare-nocturne-coordination.mjs`, this report, evidence and progress/specification notes. No production source or test file is changed by NT11. Earlier uncommitted files listed in git status belong to prior authorized phases and remain intact.

## Required owner review

Review the normal-speed clip for relative prominence, accent readability, bridge subtlety, dark contrast through the dense passage, breakdown continuity and the return. NT11 expressly requires owner artistic approval; automated traces cannot grant it. Native capture/audibility, reference-device performance and live real-song acceptance remain unverified here; NT13 owns the authorized contrasting-track review.

Stop for owner NT11/grouped environment review before NT12. No additional tuning is proposed from this generated comparison. Suggested verification-only commit after explicit authorization: `Review Nocturne staged musical coordination`.
