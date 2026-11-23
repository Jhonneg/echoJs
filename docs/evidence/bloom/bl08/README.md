# Bloom BL08 — visual polish and performance audit

2026-11-23. **Controlled audit passes; owner approved BL08.** Owner “much better now” endorses the BL07 visual direction; subsequent “proceed” authorizes BL08. This does not establish unreported native input or real-song checks. No production changes were justified: all 107 source files match the start-of-BL08 SHA256 manifest. No BL09, commit or push.

[Desktop comparison](desktop-matrix.png) · [Wide comparison](wide-matrix.png) · [Portrait comparison](portrait-matrix.png) · [Assessment](assessment.json) · [Raw browser measurements](current/capture.json)

Each board shows Standard/Low at rest and energetic calibrated input. Tests use the actual scene controllers/materials with temporary scalar probes in an isolated production build. Fixed pose, ambient clock and camera make the screenshot states reproducible. No audio or owner media is captured. Rest means musical input zero, retaining the approved intrinsic lighting.

Visual review covered fog separation, horizon, stone faces, aurora blending, wet reflections, framing and resting readability at1440×900,1920×810 and390×844. The monolith and both fragments remain inside frame; the portrait controls wrap below the scene's focal area. Low intentionally has coarser mountain silhouettes/fewer trail routes, but retains the central stone, local illumination and source-geometry reflections. No clipping, exposed closure surfaces or layout defect warranted altering the approved composition. Existing nine-view reflection evidence remains in `../bl07-perceptibility/optics/current/`.

| Configuration | Actual drawing buffer | Triangles | Unique geometry-array bytes | Median / p95 frame interval |
|---|---:|---:|---:|---:|
| Standard, device DPR1 |1440×900|6852|180372|16.7 /16.8ms|
| Standard, device DPR2, capped render DPR1.5 |2160×1350|6852|180372|16.7 /16.8ms|
| Low, device DPR2, render DPR.75 |1080×675|2308|64404|16.7 /16.8ms|

Three active two-second samples per configuration on Linux/GTX1660SUPER via headless ANGLE. Maximum frame intervals16.9/16.9/17.1ms respectively. These short vsync-limited samples include diagnostic overhead; they do not certify native GPU execution time or long-session performance. The earlier baseline run included a31.6ms outlier and was not used to certify smooth native operation.

The existing Low fallback already reduces pixel count by75% versus maximum Standard DPR, geometry bytes by64.3%, triangles by66.3%, and aurora layers from two to one. It retains required effects. Both qualities use13draws,9geometry objects,1texture and7programs. No new fallback/dependency or shader simplification is needed on the tested setup. Geometry bytes count unique CPU attribute/index arrays shared with reflected meshes, excluding driver/AA/framebuffer/program allocations and general heap. GPU per-pass/shader timings were not sampled; resolution/cadence/program counts are the available pixel-cost evidence. The timer-query extension is available, not claimed measured.

Three full quality/landscape replacement cycles restored the same resource counts. Reduced-motion clocks freeze, fragment impulses are zero and pose stabilizes. Source capture APIs/controls/MI/other landscapes were untouched; real shared-tab permissions and native input remain manual. No WebGL or runtime errors/unexpected warnings in the final run.

One existing dependency notice remains: `THREE.Clock` deprecated since r183. Installed R3F9.8.2 constructs it in `node_modules/@react-three/fiber/dist/events-e51d7528.esm.js:1207`; Three0.186 emits the notice at `node_modules/three/src/core/Clock.js:61`. [Version-matched official Clock docs](https://github.com/mrdoob/three.js/blob/r186/docs/pages/Clock.html) confirm the deprecation. This is separate from WebGL errors; no library patch, warning suppression or shared-host migration was made. The harness retains all19notices caused by repeated mounts.

The first harness incorrectly required all warnings to be absent, then exposed the known Clock notice; `first-run.json` retains that failure. Its attempted density change also left the existing Standard canvas at DPR1. Corrected evidence remounts after density changes and asserts actual DPR/drawing-buffer dimensions. A longer corrected attempt was terminated before saving; the final shorter run completed all checks. No failed test is presented as a production visual defect.

Passed56test files, lint, typecheck, build and whitespace checks. Existing large-chunk build warning remains; bundle1295.49kB /362.60kB gzip unchanged. Tools: `node scripts/verify-bloom-bl08.mjs`, then `node scripts/assess-bloom-bl08.mjs`. Project phase/visual-review skills remain unavailable; repository WORKFLOW and the established isolated browser procedure used.

Native pointer feel, shared-tab behavior, permitted real-song listening, target-window performance and artistic acceptance remain open owner gates. Review these boards before authorizing BL09's cross-landscape musical comparison.

Owner follow-up “aproved” accepts this BL08 checkpoint. Native/real-song observations are still unreported, and approval does not authorize a commit or imply GPU certification. BL09 acceptance plan is proposed in the roadmap.
