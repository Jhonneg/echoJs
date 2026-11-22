# VP03 — Depth and restrained atmosphere

Status: APPROVED — owner “looks good, lets stop for now” (2026-11-22).

Owner “continue crimson polish” authorizes next eligible VP03 after approved VP02. Production changes are confined to material.ts. No controller/audio, geometry, camera, sun/ground/streak timing or strength, quality-density, renderer pass or dependency changes. Existing pending work preserved; no VP04 implementation.

## Before → after

- Middle-distance mountain banks receive a small cool oxblood/violet fill, strongest35–55 units away, fading outside12–95 units. It is bank/upward-facing masked, leaving the near valley floor dark.
- Far banks blend toward muted violet from40–95 units (max32% blend), separating them from the nearer crimson surfaces. No geometry or uniform contour outlining added.
- Existing distant haze changes from a largely warm-red tint to a cooler muted base with restrained warmth from the same slow context. Its additional depth mix is now8% static +22% density-dependent, gated25–85 units, instead of0–18% density only.
- Existing atmospheric sky lift is localized around the horizon with a Gaussian elevation profile (.015 center/.18 spread), replacing the broad smoothstep lift. Small density/warmth color coefficients are adjusted; upper sky remains dark. The terrain's far fade uses the same atmospheric function, retaining streamed-boundary continuity.

Existing density/warmth signals,2/4s rise/release and4/6s reduced timing remain. Sun interior/rest color uses the unchanged nightColor; no fog plane obscures the disc. Ridge/ground/glint emissions are added after material/haze mixing with unchanged weights. Presence/air cell density, lifespan and controls remain sparse and unchanged. No exposure increase, volumetric system or per-frame allocations.

## Direct comparison

[Before busy context](../../evidence/crimson/vp03/vp03-before-context-0.8.png) → [after](../../evidence/crimson/vp03/vp03-after-context-0.8.png).

- [After resting context](../../evidence/crimson/vp03/vp03-after-resting.png), [quiet](../../evidence/crimson/vp03/vp03-after-context-0.2.png)
- [Upper detail](../../evidence/crimson/vp03/vp03-after-upper-details.png), [ridge head](../../evidence/crimson/vp03/vp03-after-ridge-head.png), [ground front](../../evidence/crimson/vp03/vp03-after-ground-front.png)
- [Same generated moving source before](../../evidence/crimson/vp03/vp03-before-moving-fixture-9.png) / [after](../../evidence/crimson/vp03/vp03-after-moving-fixture-9.png)
- [Before metadata](../../evidence/crimson/vp03/vp03-before-verification.json), [after metadata](../../evidence/crimson/vp03/vp03-after-verification.json), [pixel comparison](../../evidence/crimson/vp03/vp03-comparison.json), [preservation](../../evidence/crimson/vp03/vp03-preservation.json), [production lifecycle](../../evidence/crimson/vp03/vp03-public-verification.json), [cadence](../../evidence/crimson/vp03/vp03-performance.json)

Fixed comparisons use1440×810 Standard Candidate/gain1, camera[0,3.5,24], energy.2 and no initial onsets, independent context0/.2/.8. Source signals/sun scale stay fixed while context settles to within.02. “Resting context” here means zero slow-context drive with held moderate energy for an unchanged visible sun; it is not labelled actual silence. Each run also captures generated high details, a mid head and a low wave, plus Standard/Low desktop/portrait/wide views. VP00 PCM is replayed through unchanged production analysis with actual source times/pose recorded. Moving comparisons are not pixel-identical due to scheduling; no new continuous video produced for this material pass.

## Verification

Passed31 test files, lint/typecheck/build, syntax/whitespace and generated before/after/production browser checks. No console errors. Fixed camera/sun scale and slow bounded context checks pass; at most seven draws/geometries. Source hashes confirm only material.ts differs from the approved VP02 checkpoint among recorded production files. Existing Vite size warning remains (~1,227.39kB JS/341.44kB gzip).

In the matched busy-context PNGs, protected near-floor200×100 and sun-interior50×50 regions are pixel-identical (max byte difference0). Middle/far bank samples change by mean≈5.08/4.84 RGB bytes, respectively. These small region measures support localized material tuning, not automatic aesthetic acceptance. Exact crop coordinates in verification script/report preserve repeatability.

Final before/after runs /tmp/echo-vp03-before-CswS8y and /tmp/echo-vp03-after-dELLhj; production /tmp/echo-candidate-y3Bbsa; separate cadence /tmp/echo-vp03-performance-298z99. Five-second Standard/Low cadence smoke:300/301 samples,p95≈16.9/17.0ms; it is headless scheduling, not GPU time, matched overhead or native-device performance. Existing atmosphere/unit tests cover smoothness and reduced motion; production reduced/source cleanup regression passes. Full unchanged MI numerical matrix not rerun for material-only changes. Generated sources only, no private/captured input inspected or recorded; prior shader guidance reused with existing Brave/CDP fallback, phase skills/Playwright unavailable.

Owner: compare the dark near floor against mid-bank surfaces and distant silhouettes, in quiet and busy passages. Check the sun stays dominant, ridge heads/waves remain clear, upper detail stays sparse, and atmosphere changes gradually. Real-music/native picker/audibility/device approval remains manual pending. Stop before VP04; no commit/push/deploy authorized.
