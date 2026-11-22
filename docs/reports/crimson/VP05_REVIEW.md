# VP05 — Final A/B, accessibility and release review

Status: APPROVED — owner “aproved” — 2026-11-22.

Owner “lets do it” accepts VP04 and constant walking and authorizes VP05. VP00–VP04 are approved. This is the last polish milestone; the owner has accepted the final Crimson polish gate. Existing work is preserved; no commit, push or deployment performed.

## Result and bounded cleanup fix

Accepted appearance, musical mappings and constant24-unit travel are retained. The production soak discovered a terrain GPU buffer leak: live buffers grew32→36→40→44 as chunks rolled over, despite bounded geometry counts. The initial failure is retained in [regression evidence](../../evidence/crimson/vp05/vp05-buffer-regression-before.json).

R3F9.8.2 removes JSX attribute children before deferred geometry disposal. Three r186 disposes buffers by iterating attributes still attached to the geometry. TerrainChunk now owns one memoized BufferGeometry with the same four BufferAttributes, attaches it as a primitive and explicitly disposes it on cleanup. Attributes remain attached until disposal. No terrain arrays, deformation, shaders, audio code, camera behavior or other landscapes change. This is a concrete cleanup repair within VP05, not additional visual tuning.

Version-matched guidance: [R3F primitive disposal ownership](https://github.com/pmndrs/react-three-fiber/blob/v9.8.2/docs/API/objects.mdx), [Three BufferGeometry disposal](https://github.com/mrdoob/three.js/blob/r186/docs/pages/BufferGeometry.html). Installed implementations checked in fiber/dist/events-*.esm.js removeChild and three/src/renderers/webgl/{WebGLGeometries,WebGLAttributes}.js. Four current chunks retain exact authored position/normal arrays after the fix.

## Before / after

[Side-by-side video](../../evidence/crimson/vp05/vp05-side-by-side.mp4), [baseline](../../evidence/crimson/vp05/vp05-baseline-comparison.mp4), [current](../../evidence/crimson/vp05/vp05-final-comparison.mp4), [provenance manifest](../../evidence/crimson/vp05/vp05-comparison-manifest.json).

The original VP00 commit6281d27 is reconstructed in an isolated temporary directory, using identical installed dependencies and the current DEV capture adapter. All58 baseline production files match that commit; the original VP00 fixture prefix hash matches saved provenance. Only the temporary DEV corona readout needs an optional fallback for the older scene. This is a reconstructed comparison, not an original VP00 recording.

Both use unchanged21s generated VP00 PCM through production analysis, Standard Candidate/gain1,1440×810 and fixed camera[0,3.5,24]. Saved screenshots cover rest, quiet, busy, sustained bass, repeated attacks and release. Clips compare approximately8–10s busy input with actual timestamps saved in the manifest. Camera is fixed because approved constant travel supersedes the baseline musical-speed path. FFT/event scheduling is not bit-identical between runs.

The video is2.13s,1440×406, video-only: composited browser frames sampled about5–6Hz and duplicated into a30fps container. It demonstrates appearance/propagation, not native30fps rendering or soundtrack synchronization. The export was decoded and visually inspected. Current waves read as broader traveling fronts; ridge detail and depth remain secondary to the sun. Final artistic/music judgment belongs to the owner.

Matched five-second cadence samples, with screenshot work excluded:

| Quality | Baseline p95 | Current p95 | Samples each |
| --- | --- | --- | --- |
| Standard, DPR1 |16.8ms |16.8ms |300 |
| Low, DPR.75 |16.8ms |16.8ms |300 |

Same ANGLE/NVIDIA GTX1660 SUPER headless renderer. These short scheduler-limited samples show no measured regression; they do not measure GPU headroom or certify owner-device performance.

## Verification

- Passed32 test files, lint, typecheck and production build after the cleanup fix. Existing bundle-size warning remains (~1,227.01kB JS /341.30kB gzip).
- Generated isolated110/469/1500/4000/8000Hz tones at amplitudes.04/.24 correctly dominate bass/lowMids/highMids/presence/air. Measured energy rises about6×, distinguishing soft and strong inputs. These frequencies respect existing bands; production normalization/onset boundaries remain untouched. This is a two-level comparison, not a continuous sweep. Existing curve tests cover additional levels/cadences and finite onset/sustain behavior.
- Original generated mixed fixture and production local-file adapter exercise silence, quiet/dense sections, sustained notes and repeated transients. All intended effect uniform families become active; no console errors.
- Fixed production120-second looping playback soak:120 samples, live buffers28, textures4, programs4 throughout; one worker, Canvas and AudioContext, zero time-domain reads. Frame interval p95≈16.7ms. This directly catches the previously hidden buffer leak. Longer normal-window/device playback remains manual.
- Real trusted keyboard Enter/Tab/Escape opens/closes chooser and restores trigger focus; Disconnect restores file-input focus. Named accessibility-tree controls checked. This is not a screen-reader usability certification.
- Actual app fullscreen button works via keyboard and updates aria-pressed. Standard/Low desktop1440×810, portrait390×844 and wide1920×810 views have no horizontal page overflow. Native OS Escape remains manual.
- Pause clears reactive pulse while walking continues (~12 units/.5s). Seek/resume and switching all four landscapes preserve generated player/context. Reduced motion freezes travel and suppresses pulses. Disconnect closes context.
- Generated mocked tab stream exercises adapter and native-ended callback cleanup. No native picker, browser sharing permission or captured sound/audibility claim. No private or captured media was inspected or recorded; artifacts use generated input and ECHO graphics only.
- Built distribution excludes DEV lab/fixture/recording hooks. Full unchanged MI numerical lab matrix was not repeated.

Evidence: [comparison checks](../../evidence/crimson/vp05/vp05-final-verification.json), [baseline checks](../../evidence/crimson/vp05/vp05-baseline-verification.json), [tones](../../evidence/crimson/vp05/vp05-tones-verification.json), [production integration](../../evidence/crimson/vp05/vp05-integration-verification.json), vp05-tone-*.jpg, vp05-*-fixed-*.png and vp05-{standard,low}-*.png.

Playwright/project phase skills unavailable; established Brave/CDP/FFmpeg fallback used. Context7 skill/versioned docs used for cleanup ownership. Final runs: /tmp/echo-vp05-final-fixedBj4xTo, /tmp/echo-vp05-tonesy2oBpD, /tmp/echo-vp05-integration-0ZndAt. Initial resource regression was fixed and final full run passed; an earlier keyboard-driver issue required native Enter text, not a product change.

## Owner gate — approved

The following checklist was supplied for final owner review. Owner “aproved” accepts the overall polish; this does not supply individual native/device test results.

Review permitted music at normal speed: quiet passage, strong bass entrance, midrange-dominant and bright high-frequency moments. Judge sun/ground/ridge/upper hierarchy, responsiveness, smooth settling and constant walking together. Verify native tab sharing/audibility, normal-window fullscreen/OS Escape, preferred quality and reduced-motion behavior, screen-reader use where applicable and longer owner-device playback.

VP05 is now APPROVED. All VP00–VP05 milestones are closed, with before/after evidence retained. Stop further Crimson work unless a specific bug or new request arrives. Native sharing/audibility, OS Escape, screen-reader and longer owner-device checks remain unverified where no result was reported. No next graphical milestone, commit or deployment is authorized.

Suggested focused commit after authorization: `Verify final Crimson polish and release terrain GPU buffers`.
