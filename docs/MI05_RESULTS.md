# MI05 — stable reader and Crimson pilot

Current status: owner reports “passed” and explicitly authorized Candidate rollout. Public Crimson now uses Candidate; the Legacy-only boundary below describes the earlier pilot checkpoint. See the rollout addendum at the end.

2026-11-21 · implementation authorized by the owner's “lets move” after the revised 50% sun /12% glow plan. First-pass developer comparison implemented; owner artistic acceptance pending. No vertex pass, other landscape migration or public Candidate default.

## What is available

Open `/audio-lab.html`, choose the same permitted source used for G1, then **MI05 · Crimson pilot → Open Crimson preview**. Its independent **Crimson response** selector compares Legacy with Candidate. The G1 selector above still controls only the neutral diagnostic chart. Share one volume, Reactivity and quality setting when comparing; switching preserves the source, AudioContext, Canvas, worker and logical journey. Closing releases the preview worker/Canvas while audio continues.

The public App still omits the pilot input and runs Legacy. Candidate publication is DEV-only, from the existing observer once per analysis tick. `src/audio/musicFeatures.ts` provides a version-1 borrowed readonly scalar view; consumers own their event cursor. No extra FFT, analyser, audio scheduler, frequency-boundary, normalization or detector changes. Only the immutable onset type moved to the shared contract; validated DSP remains in the lab.

Candidate uses fixed low/overall energy for sustained sun, overall energy for travel, proportional low events for sun/glow, bounded mid/high ridge contributions and slow context for haze/selection. It preserves framing, palette, terrain buffers, pointer motion, four worker chunks, rebasing, safe travel and existing shader passes. No vertex/normal rewriting. Travel advances once per rendered frame.

## Baseline discrepancy resolved by preserving user work

The proposal described historical Legacy sun/glow caps of 8%/12%. At implementation start, an existing uncommitted owner edit had already changed sun expansion to **40%**. This edit is preserved: current Legacy remains 40%/12%; Candidate reaches the requested **50%/12%**. No unrelated user change was reverted. This is a correction to the plan's baseline assumption, not a public default migration.

The pulse has a 25 ms eased rise, a 34 ms peak interval to preserve strength at 30 Hz and a 220 ms exponential release, ending after two seconds. The peak interval is an implementation detail needed for the approved ≤10% cadence criterion. Old events are discarded on profile/session changes; a scalar outgoing tail fades on A/B switches to avoid a transform discontinuity. Reduced motion clears geometric pulses and keeps appearance responses at least 1.5 s. Zero Reactivity, pause, stale/inactive/priming input stop drive; active silent input remains a valid fresh source.

## Verification

- Unit/controller checks: reader parity/reused reads/frame/session/format, independent consumers, hidden-event consumption/no replay, 0.1/0.3/0.6/1 strength ordering, low/mid/high isolation, 30/60/120 Hz pulse peaks within 10%, monotonic energy, constant-energy no-retrigger, loaded-distance clamp, profile continuity, zero/partial gain, stale/priming/inactive/reduced-motion behavior. Existing Legacy journey/stream/camera tests retained.
- Browser: `scripts/verify-mi05.mjs` uses only generated input. Actual lab source/context/Canvas/worker identities survive A/B; closing releases worker while generated playback continues. Actual WebGL PerspectiveCamera, four chunks, seven geometries/seven draw calls/no textures, same meshes on A/B, bounded uniforms, zero/stale/reduced-motion/pointer behavior and delayed/failed-worker paths verified.
- Generated screenshots: matched logical distance 0 at 1440×810, 390×844 and 1920×810 in both Standard/Low, both profiles. Desktop comparison inspected for retained valley/sun hierarchy, silhouettes and palette; screenshots are evidence of framing, not owner aesthetic approval. Source signal, not microphone/tab/private media, is synthetic.
- Tests, lint, typecheck/build: see final checkpoint. The existing Vite >500 kB chunk warning remains. Production exclusion checks distinguish allowed shared scene/controller code from forbidden DEV diagnostics, bridge, controls and harness; historical bundle hashes are not used as a behavior test.

## Render timing and retained evidence

[Generated browser measurements](evidence/mi05-browser-verification.json) include twelve 20 s trials, three alternating Legacy/Candidate pairs per quality, each after 2 s warmup. Linux x86_64, headless Brave/Chromium 156, ANGLE NVIDIA GeForce GTX 1660 SUPER/OpenGL ES 3.2, 1440×810; Standard DPR 1 and Low DPR 0.75. Same injected scalar fixture and logical distance 0; no captured media. Numeric audio regressions also ran in another browser, so this was not an isolated machine-load benchmark.

| Quality | Legacy p95, three trials (ms) | Candidate p95, three trials (ms) | ≤10% paired overhead |
|---|---|---|---|
| Standard | 16.9 /17.0 /17.0 | 16.9 /16.9 /17.0 | Pass |
| Low | 17.0 /16.9 /16.8 | 17.0 /16.9 /16.8 | Pass |

Each sample contains ~1,200 frame intervals. These scheduler-limited ~60 Hz RAF intervals establish the stated comparison under this controlled render-cost fixture, not spare GPU capacity, maximum throughput or full-song/device performance. The fixture holds overall/legacy-six drive at zero to match camera position, while low/mid/high/context energy is 0.3 and proportional events repeat every 0.8 s; it is an injected contract exercise rather than a calibrated audio waveform.

The separate high-energy journey crossed eleven chunk lengths (13.78→574.91 world units), keeping ≤4 chunks/7 geometries/one worker. Measured actual sun/glow peaks were exactly 1.50/1.12. Initial default headless software rendering did not settle a transition in the test's fixed wait; that timing assumption was corrected to await the transition, and the final run used the project's established GPU flags. No renderer or production timing threshold was changed to make the harness pass.

Retained comparisons: [desktop Legacy](evidence/mi05-standard-desktop-legacy.png), [desktop Candidate](evidence/mi05-standard-desktop-candidate.png), [portrait Candidate](evidence/mi05-standard-portrait-candidate.png), [wide Candidate](evidence/mi05-standard-wide-candidate.png); all twelve Standard/Low/profile images are in `docs/evidence/mi05-*.png`. Desktop, portrait and wide Candidate frames were inspected. Screenshots share position and sustained inputs; periodic onset phase is not locked, so static image differences alone are not a pulse-strength measurement.

[Generated audio regression evidence](evidence/mi05-audio-regression.json): MI01 216, MI02a 432, MI02b 81, MI03 783 and MI04 324 rows repeated exactly; MI03/MI04 quality flags true, browser errors empty, production exclusion and generated source/export/mock-capture/all-landscape continuity checks passed. Initial runner terminated externally (143) after repeated MI01–MI03 and the first complete MI04 report. Optional `ECHO_AUDIO_LAB_RESUME` validates exactly two complete generated numeric reports per earlier task before resuming MI04/integration; it never resumes live media. Final run completed at `/tmp/echo-mi01-DK7VHU`, using earlier generated reports from `/tmp/echo-mi01-dqRRQb`.

Final checks passed: all 22 test files, lint, typecheck/build and whitespace. Project phase skills were unavailable; AGENTS/WORKFLOW followed directly. Context7 R3F v9.8.2 ref/uniform documentation consulted; installed React 19.3.1 and Three 0.186.0 retained. No new dependencies. Native capture/audibility, device behavior and same-song artistic preference remain owner checks, not inferred from the generated harness.

## Owner review

Compare soft versus strong attacks, sustained passages without continual sun pulses, quiet/silent passages and transitions using the same permitted song/settings. Check that momentum follows sustained intensity and the atmosphere still feels like Crimson. Select Legacy/Candidate while playback continues; no need to restart the song. The requested 50% sun growth is a maximum proportional to event strength, not a fixed expansion for every hit.

Stop here for review. Vertex displacement (initial proposal 0.08 world units), other landscapes, MI06/MI07 and public rollout remain separately gated. No commit/push/deployment. Suggested focused commit after review: `Add stable music feature reader and Crimson lab pilot` (pending G1 work should be reviewed alongside, not discarded).


## Owner acceptance and public rollout — 2026-11-21

Owner said **“passed, implement candidate.”** The reviewed artistic response is accepted for the owner's tested conditions, and public Crimson now uses Candidate. This supersedes the pilot-only/public-Legacy boundary above; it does not authorize vertex deformation or another landscape.

The validated fixed-energy/onset/context algorithms moved unchanged into `src/audio/music/`, with compatibility re-exports for the lab. The public analysis publishes `musicFeatures` from the existing analyser bins/clock and handles source/seek/stop/format/gap resets. Existing adapters/legacy AudioSignal and other landscape mappings are preserved. No extra analyser, audio scheduler, production time-domain samples, adaptive experiment, diagnostic/export UI or new dependency. The developer lab keeps its A/B preview and existing observer path.

Verification: 23 test files, lint/typecheck/build and whitespace pass. Production-vs-lab feature parity is exact over 3,600 generated ticks at 44.1/48/96 kHz; legacy output is unchanged with Candidate enabled. [Unchanged DSP body hashes](evidence/mi05-dsp-promotion.json) document relocation without tuning. [Built-production browser checks](evidence/mi05-public-candidate-verification.json) pass generated WAV and mocked-tab response/lifecycle, all-four-scene playback continuity, reduced motion, quality, desktop/portrait bounds and exclusion of lab/diagnostic code. Actual uploaded shader controls confirm Candidate, rather than inferring it from a label. No native capture/picker/audibility claim from the mock. [Public desktop](evidence/mi05-public-candidate-desktop.png) and [portrait](evidence/mi05-public-candidate-portrait.png) frames retained.

Build is ~1,216.47 kB JS /337.80 kB gzip with the existing size warning. No new hardware/full-song performance claim; earlier timing numbers remain tied to their original fixture/build. No commit/push/deployment. Stop before the separately gated vertex pass or other worlds.
