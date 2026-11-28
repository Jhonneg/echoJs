# Nocturne industrial asset detail

**Owner correction:** the material change hid upper cyan panel faces despite unchanged transforms. Restored the original steel/frame/downpipe materials and removed the hardware-map helper. Added geometry and wall wear remain. [Restored production view](restored-manual-all-on.png). Earlier screenshots/resource counts below describe the superseded candidate.

2026-11-27. Owner approved the proposed asset-detail pass. Implementation is complete; owner visual review remains pending.

## Changes

- Doors: shutter backing, inset service-door panels, hinges, latch backplates and grips, kick plates, header seams and jamb fixings.
- Vents and utilities: folded rims, louver lips, screw heads, junction-box gaskets/lids/hinges/latches, conduit feeds/clamps and pipe saddle brackets.
- Bridge: beam flanges, bolted splice plates, railing footings and bracing in the two outer bays. The central opening and light segments remain clear.
- Ground: grilles across the existing curb drains and broken repair joints near the curbs, beneath the existing wet film.
- Materials: two shared 128×128 procedural hardware maps for color and roughness; coherent runoff and patchy seam wear added to the existing 512×512 wall maps. No downloaded assets or dependencies.

The first three facade bays receive the small hardware. Existing instanced box counts increase from 942 to 1,473 (+531, or 6,372 box triangles per geometry pass), using the same draw batches. See [counts](instance-counts.json). Every emitter's part data, including transforms, is identical to HEAD. Lighting, camera, audio, reactive effects and other landscapes are unchanged.

## Visual evidence

| View | Before | Final |
|---|---|---|
| Manual all-on, reduced motion | [Before](before-manual-reduced-motion.png) | [After](after-manual-reduced-motion.png) |
| Idle | [Before](before-idle.png) | [After](after-idle.png) |
| Idle Low | [Before](before-idle-low.png) | [After](after-idle-low.png) |

Playwright also inspected [desktop Standard](playwright-standard.png), [desktop Low](playwright-low.png), [portrait Standard](playwright-portrait-standard.png) and [portrait Low](playwright-portrait-low.png). These captures precede the final clamp of ten over-range concrete-map texels; the production `after-*` captures include that correction. The correction changes neither geometry nor resource ownership.

The nearby vents now have folded edges, the door has backing and hardware, the bridge has visible bolted joints and footings, and the curb slots have grilles. Surface wear remains subordinate to the fixtures. Portrait keeps the gate/wet lane visible and naturally crops the nearest wall details. Fine hardware is softer on Low.

The first hardware map darkened the existing materials too much (Manual wall luma 28.21 → 26.96); its base was lightened. Final Manual wall luma is 28.20; idle wall luma is 2.37 → 2.34. Whole-frame Manual luma is 64.27 → 63.49; idle is 3.59 → 3.50. These are display RGB values from the existing capture regions, not physical light measurements. Final reduced-motion frames three seconds apart are identical.

## Checks and reproduction

- PASS `npm test` (69 test files), `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check`. No new unit tests for static placement constants.
- Baseline: build unchanged HEAD, then `node scripts/verify-nocturne-nt22.mjs /tmp docs/evidence/nocturne/asset-detail before`. [Raw baseline](before-capture.json).
- Initial geometry/material candidate: the same NT22 harness completed generated audio through the real file adapter and Music Intelligence, without runtime exceptions. [Initial smoke data](initial-music-smoke.json) and [drop frame](initial-music-smoke.png) retain the darker, superseded hardware material. This is not a final-material musical review. Its GPU timings are excluded because the Playwright preview was also rendering.
- Final production: `node docs/evidence/nocturne/asset-detail/static-capture.mjs /tmp docs/evidence/nocturne/asset-detail after`. This is the static subset of the NT22 harness, with the same capture and timing code. [Final data](after-capture.json): no runtime exceptions; idle/Manual/Standard/Low/reduced-motion captures completed.
- Playwright MCP: serve the dev app on 5196, then run [playwright-check.js](playwright-check.js) with `browser_run_code_unsafe`. [Compact measured report](playwright-summary.json). Three Standard/Low cycles and three Nocturne/Lavender/Nocturne cycles retain 131 geometries, 20 textures and 45 shader programs in the reduced-motion view. Both new maps dispatch disposal on every scene exit. No invalid instance matrices and no emission on the unassigned steel hardware. Desktop backing buffers are 1440×900 / 1080×675; portrait has one canvas and no document overflow.
- [Browser warnings](playwright-console.log): no errors. Existing THREE.Clock deprecation and SwiftShader ReadPixels warnings. Production build retains its existing large-chunk warning. Playwright uses SwiftShader; it is not hardware-performance evidence.

Headless Brave/ANGLE idle GPU time (median of three 3-second samples), with the Playwright scene stopped for the final run:

| Quality | Before | Final |
|---|---:|---:|
| Standard | 4.753 ms | 4.672 ms |
| Low | 4.101 ms | 4.186 ms |

Differences are within noise; no performance improvement is claimed. Two new RGBA8 maps including mipmaps cost approximately 171 KiB, excluding driver overhead. Existing texture sizes and geometry batches are unchanged.

During verification: the initial sandboxed browser run could not bind localhost; the approved elevated run succeeded. One longer timing repeat was terminated (exit 143) before completion and is excluded. The extracted static harness first had a syntax error in its cleanup extraction; corrected and syntax-checked before the successful run. No rejected approval or unresolved test failure remains.

Context7 served current Three.js material documentation because r186 was not indexed; map channel/color-space behavior was also checked against installed Three.js 0.186.0 source. The project-specific `visual-review`/`implement-phase` skills were unavailable; `docs/WORKFLOW.md` supplied the procedure.

Not run/manual pending: final-material real-song review, native-window performance, native capture permissions/audibility, device pixel ratio 2, and owner aesthetic approval. The full historical NT23 gate is not reopened or marked passed. No commit or push.
