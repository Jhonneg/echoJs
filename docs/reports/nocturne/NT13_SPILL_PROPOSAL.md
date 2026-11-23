# NT13 — Audio corridor brightness proposal

Original preview prepared2026-11-22. **Owner “do the lift” approved this candidate; it is now applied.** See [implementation and verification](NT13_SPILL_IMPLEMENTATION.md). The proposal sections below record the pre-approval comparison. Owner bass feedback: “magenta follows bass, i feel corridor in general is too dim compared to manual preview.” This confirms perceived bass tracking but requests a composition adjustment; it is not full NT13 approval. Other listening cases, cyan independence/fade observations and final musical approval remain pending.

## Finding

Manual All on, used during visibility setup, drives all original fixture levels to1, emitters to1.3 and every point to its original full intensity. Audio intentionally uses bounded independent responses: in NT11's dense generated sample, windows average about.038, main magenta.1595, details.0565 and left cyan.1115. Their point levels are therefore about2.47,7.975,2.26 and3.345 versus Manual65/50/40/30. Manual also gives the distant atmosphere its full preview colors.

This explains a substantial Audio/Manual illumination gap without requiring an analysis-engine defect. No owner media, signal history or browser playback was inspected; this reasoning uses source and existing generated evidence. It does not claim that every aspect of the owner's live darkness is measured.

## Focused candidate

Raise **Audio-only local point spill**, preserving all emitter envelopes/brightness and the approved left cyan light:

| Existing point/channel | Current | Candidate | Original full ceiling |
| --- | --- | --- | ---: |
| Main magenta spill | `level*50` | `min(1,level*1.5)*50` |50 |
| Cyan window spill | `level*65` | `min(1,level*2)*65` |65 |
| Small cyan detail spill | `level*40` | `min(1,level*2)*40` |40 |

Other points, including approved left cyan×30, violet and bridge, retain their current mapping. Manual stays exact. Each selected point still depends only on its associated final fixture level; zero remains zero. The curve is proportional until its original full ceiling. No new event, shared intensity dependence, permanent floor, light/shadow, geometry, camera, material, exposure or ambient/atmosphere increase is proposed.

This aims for more readable walls/pavement while retaining dark contrast. It does not attempt to reproduce every fixture at Manual100% regardless of musical content. On acceptance, keep the final spill interpretation in the unified visual state and update the renderer adapter/tests/docs accordingly; do not hide response logic in LightingDriver. Repeat generated dynamic/zero/reduced/Manual checks and the owner's bass passage before claiming musical approval.

## Matched preview

| View | Current | Candidate |
| --- | --- | --- |
| Bass-focused held levels | [Current](../../evidence/nocturne/nt13/spill-candidate/standard-bass-current.png) | [Proposed spill](../../evidence/nocturne/nt13/spill-candidate/standard-bass-candidate.png) |
| Dense held levels | [Current](../../evidence/nocturne/nt13/spill-candidate/standard-dense-current.png) | [Proposed spill](../../evidence/nocturne/nt13/spill-candidate/standard-dense-candidate.png) |
| Silence | [Current](../../evidence/nocturne/nt13/spill-candidate/standard-silence-current.png) | [Identical candidate](../../evidence/nocturne/nt13/spill-candidate/standard-silence-candidate.png) |

[Original Manual All on reference](../../evidence/nocturne/nt13/spill-candidate/standard-manual-all-on.png).

These are generated-scene static comparisons in a separate temporary app copy, using held levels based on NT11 bass/dense means, fixed neutral palette weights/fog74 and bridge off. They are not captures of the owner's music or a dynamic timing/performance test. Camera1440×810, neutral pose(0,1.6,5). Both Standard/Low are saved.

## Checks

[Captured values](../../evidence/nocturne/nt13/spill-candidate/verification.json) and [comparison](../../evidence/nocturne/nt13/spill-candidate/comparison.json) verify:

- All emitter intensities and atmospheric values exactly match current/candidate; approved left cyan point is unchanged.
- Only the three selected point mappings change; each stays at or below its original full ceiling. Dense example: main7.975→11.9625, windows2.47→4.94, detail2.26→4.52; left cyan3.345 unchanged.
- Fixed floor/right-wall display-RGB crops become brighter at both qualities. Standard dense crop RGB mean increases about13% on pavement and34% on the nearby right wall; these are display-pixel comparisons, not radiance or whole-corridor luminance claims.
- Both silence pairs are pixel-identical. Original Manual still delivers every emitter1.3 and each point's full intensity.
- Renderer resources remain114 geometries/6 tracked textures; no lights or passes are added in the candidate. No hardware-FPS result inferred.
- All90 production source hashes match NT12. Preview logic is injected only in a temporary copy. No owner playback debugger, media inspection or recording was used.

Added only `scripts/preview-nocturne-spill-candidate.mjs`, `scripts/compare-nocturne-spill-candidate.mjs`, generated preview evidence and documentation. Lint/documentation/whitespace checks pass. No runtime tests are claimed for a production implementation because none is applied; previous40-file suite/build remains unchanged.

## Pending choice

Owner reviews whether this modest local spill lift addresses the reported dimness, requests a stronger/different preview, or retains current lighting. Then apply an accepted scene-local mapping and repeat the bass case plus remaining NT13 listening cases. No production approval or NT13 musical acceptance is inferred from preparing these screenshots. NT14 remains unstarted.
