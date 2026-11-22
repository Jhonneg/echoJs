# ECHO — Crimson Horizon Visual Polish Roadmap

**Project:** [Jhonneg/echoJs](https://github.com/Jhonneg/echoJs)  
**Suggested repository path:** `docs/CRIMSON_VISUAL_POLISH_ROADMAP.md`  
**Phase:** Post–Visual Mapping polish (VP)  
**Initial status:** VP00–VP05 not started; reconcile against repository progress before acting.  
**Next work:** VP00 baseline, followed by **VP01 ground-wave readability**.

## 1. Purpose and current state

Crimson Horizon's full VM00–VM06 visual mapping roadmap has been implemented according to the owner. This document is **not** a new feature roadmap. It is one final, bounded visual-quality pass meant to improve the *readability, hierarchy, motion and musical coherence* of effects already present.

In the owner's approximately 35-second moving-camera review recording (November 2026):

- The original low-poly mountains, dark crimson/violet palette, forward camera journey and large pink sun remain recognizable.
- The sun shows a clearly visible quiet-to-bright range and a restrained halo; the composition is cohesive.
- Mountain highlights and streaks are difficult to read at normal playback speed.
- Valley-floor energy effects appear very subtle; much of the foreground looks uniformly dark.
- High-frequency details and atmospheric depth are understated. More objects are **not** the answer.

These are **visual observations, not verified audio-signal diagnoses**. Actual waveform-to-effect synchronization and band isolation must be checked against diagnostics/fixtures in the repository. Do not infer a broken Music Intelligence engine from the recording alone.

### Artistic target

The canyon should feel like one atmospheric instrument: light originates, travels through existing geometry, and fades. Quiet music remains beautiful. Powerful passages reveal more of the landscape without making it look like an equalizer, wireframe or fireworks display.

### Non-goals and constraints

- Do not rebuild/rewrite Music Intelligence or add a second analyser.
- Do not redesign terrain, deform authored mountains, replace the sun, or change the production camera route.
- Do not introduce unrelated UI, landscapes, libraries or heavy post-processing packages.
- Do not brighten everything globally to compensate for weak local effects.
- Do not add arbitrary constant animations and describe them as music-reactive.
- Do not bypass reduced-motion, quality tiers, audio-source adapters or cleanup.
- Preserve unrelated/uncommitted changes, and do not commit or deploy without owner approval.

## 2. Operating model for Codex

1. Read `AGENTS.md`, this document, `docs/CRIMSON_VISUAL_MAPPING_ROADMAP.md`, relevant progress documentation, the actual scene/audio signal modules, tests and current `git status`.
2. Confirm what is already implemented. Repository code and verified progress override assumptions in this plan.
3. Work on **only the next eligible VP milestone** in a coding turn.
4. Start with a small, visible proof-of-concept; tune using the existing diagnostics, synthetic fixtures and real music. Do not spend large amounts of tokens on uncontrolled visual rewrites.
5. Run relevant typecheck/lint/tests/build/browser checks; verify capture/source lifecycle isn't affected.
6. Review moving-camera footage **and** fixed-camera or repeatable fixture evidence when feasible.
7. Update roadmap/progress statuses and report exact evidence paths that really exist. Do not invent a stationary demonstration, screenshots, audio tests, or visual approval.
8. Stop at `IMPLEMENTED — AWAITING OWNER REVIEW`. Advance only after explicit owner approval, using the prompt **“Continue Crimson polish.”**

Use statuses `NOT STARTED`, `IN PROGRESS`, `IMPLEMENTED — AWAITING OWNER REVIEW`, `APPROVED`, and `BLOCKED`. Automated tests do **not** constitute artistic approval.

## 3. Polish milestones

### VP00 — Baseline and comparative capture

**Status:** NOT STARTED.  
**Goal:** Make later adjustments objectively comparable and protect finished VM work.

**Tasks**

- Inventory current sun, mountain, ground, particle and atmosphere mappings and their audio features.
- Check existing scene-level clamps, envelope interpolation, gain/sensitivity, event lifespan, and visual bounds; do not change the engine.
- Capture the current moving-camera experience on a repeatable local fixture or authorized track, including a quiet and busy segment.
- If possible, use a debug-only stationary camera or deterministic camera path for isolated effect comparison; do not alter the production camera.
- Record screenshots and/or clips at matching timestamps, same window size, graphics quality, camera state and audio source. Note limitations if exact A/B isn't possible.

**Gate:** There is a reliable baseline and clear per-effect observations. Do not repeat every test in later phases if unchanged.

### VP01 — Ground-wave readability **← FIRST VISUAL CHANGE**

**Status:** NOT STARTED.  
**Goal:** Make the existing low-frequency wave visibly propagate through the canyon without dominating the scene.

**Tasks**

- Inspect the existing VM03 event model, wave origin, world-space movement, perspective, emissive/shader behavior, lifetime and occlusion.
- **Refine** the existing effect; do not add unrelated ripple systems or duplicate onset events.
- Ensure a fresh low-frequency onset produces a recognizable leading wavefront with a short, fading tail or faint terrain channel.
- Waves should originate near the distant valley/horizon and traverse visibly toward the foreground in world space. They may widen in apparent size naturally with perspective.
- Calibrate local brightness/contrast and duration so waves remain legible at normal playback speed, including against dark ground. Do not simply increase full-screen exposure.
- Make quiet and loud attacks visibly different. Sustained bass may maintain a very faint glow but must not endlessly spawn waves.
- Keep a bounded number of active events with predictable reset, cleanup, reduced-motion fallback and quality-scaling.

**Acceptance checks**

- A 1–3 second visual clip clearly shows a traveling wave rather than a stationary flash at the horizon.
- Wave is visible under production camera motion, not glued to the viewport or detached from terrain.
- Soft event = subtle wave; loud event = visibly stronger wave; sustained note = no repeated retrigger.
- Ground remains aesthetically dark during silence; no apparent clipping, intersection or depth artifacts.
- No regression in frame time or capture cleanup.

**Stop for owner review before VP02.**

### VP02 — Mountain streak readability

**Status:** NOT STARTED.  
**Goal:** Make existing midrange illumination and traveling heads distinguishable without creating neon wireframes.

**Tasks**

- Preserve selected ridge geometry and darker resting contours approved in VM02.
- Low-mid sustained energy should create soft, stable contour illumination.
- High-mid onset events should produce a **clearly moving head** across a finite section of terrain with a short fading trail.
- Tune head contrast, travel distance, duration, falloff and selective path coverage—not global brightness.
- Ensure the moving camera cannot be mistaken for the only movement. Verify with fixed camera or matching camera-path comparison.
- Retain restrained palette (burgundy resting light, stronger crimson/pink-red attack accents) and depth-aware occlusion.
- Avoid always-on uniform outlines, excessive sparkle, z-fighting, and constant retriggers.

**Acceptance checks**

- Low-mid-only input reveals contours; high-mid transients produce separable travel; bass-only does not strongly activate midrange effects.
- At least one ridge streak is readable at normal moving-camera playback speed without dominating the sun.
- Silence and reduced motion produce a coherent resting state.
- No unnecessary per-frame allocations or geometry rebuilds.

**Stop for owner review before VP03.**

### VP03 — Depth and restrained atmosphere

**Status:** NOT STARTED.  
**Goal:** Improve near/mid/far separation while preserving the minimalist color scheme.

**Tasks**

- Use subtle differences in existing fog, haze, material tone or illumination to separate foreground valley, midground mountains and distant horizon.
- Preserve the sun as the visual anchor. Keep terrain dark and recognizable during silence.
- Use existing *slow* musical context to shape sustained atmosphere where already mapped; no rapid sky flicker or broad exposure pumping.
- Check that presence/air glints remain sparse but perceptible during appropriate inputs, without becoming an always-on starfield.
- Prefer tuning existing materials, fog and effect bounds over new geometry and costly volumetrics.

**Acceptance checks**

- Near, mid and far regions are readable without sacrificing darkness.
- Quiet/busy passage differences are perceptible but gradual.
- High-frequency details are present when appropriate and unobtrusive otherwise.
- Sun/contour/wave visibility does not regress across quality tiers.

**Stop for owner review before VP04.**

### VP04 — Sun proportionality and cross-effect balance

**Status:** NOT STARTED.  
**Goal:** Make the completed environment read as one composition, not competing independent effects.

**Tasks**

- Check existing sun body response, corona and halo against calibrated sustained bass, fresh onset strength, and slow context.
- Avoid a visually binary dim/bright switch if proportionality is lost. Preserve the beautiful large pink disc and its restrained bright state.
- Balance effect hierarchy: sun dominant, mountains/ground secondary, particles and haze tertiary.
- Compare a new bass attack that drives both sun and ground: effects may complement each other with natural delay/propagation but must not feel duplicated or excessively synchronized.
- Verify mixed-band passages do not keep all elements at maximum brightness or obscure the focal point.

**Acceptance checks**

- Soft vs loud bass and sustained vs new bass attacks remain distinguishable.
- One musical event can create a coherent visible response across sun and terrain without excessive flash.
- Quiet/dense contrast is artistic, controlled and free from frequent clipping or flicker.

**Stop for owner review before VP05.**

### VP05 — Final A/B, accessibility and release review

**Status:** NOT STARTED.  
**Goal:** Determine whether the polish is genuinely finished, then stop.

**Checks**

- Side-by-side before/after footage at comparable audio timestamps and camera conditions.
- Silence; ~100 Hz bass; ~400 Hz low mids; ~1.2 kHz high mids; ~4 kHz presence; ~8 kHz air; repeated transients; sustained notes; soft/loud level sweeps; mixed music. Respect actual band overlap.
- Real-music review across quiet passage, strong bass entrance, midrange-dominant moment and bright high-frequency passage.
- Reduced motion; quality levels; fullscreen/resizing; tab/local input behavior; scene switching; long-playback cleanup.
- Test, typecheck, lint, build, browser console and frame-time comparison to VP00.
- Log unverified manual checks plainly, then request explicit owner approval.

**Final gate:** Owner says the whole scene feels musically coherent, visually polished and sufficiently responsive **without** needing more effects. Mark VP05 `APPROVED`. Archive before/after evidence and stop further Crimson changes unless a specific bug or new owner request arrives.

## 4. Evidence and quality rules

| Evidence | Purpose |
| --- | --- |
| Fixed-camera synthetic fixture | Isolate an effect from dolly motion |
| Moving-camera fixture | Confirm perspective and actual scene readability |
| Same song and timestamp before/after | Avoid confusing song variation with visual tuning |
| Quiet vs loud matched input | Detect excessive clamping/gain or binary output |
| Sustained vs new transient | Detect erroneous retriggering |
| Real-music owner review | Judge whether animation feels musical and emotionally effective |
| Browser/performance checks | Catch regressions before approval |

Do not claim precise band-to-effect synchronization from ordinary moving-camera video alone if audio diagnostics are unavailable. Treat a missing screenshot/video file as a missing artifact, not as verified evidence. Do not require a demo just because an old report mentioned one.

## 5. Reporting template for each milestone

```text
CRIMSON VISUAL POLISH — VPxx
Status: IMPLEMENTED — AWAITING OWNER REVIEW

Before/after visual difference:
- ...

Existing musical signals used:
- ...

Files changed:
- ...

Verified:
- Unit/lifecycle tests:
- Typecheck/lint/build:
- Browser/console:
- Synthetic input behavior:
- Existing evidence paths (only if verified):
- Frame-time/reduced-motion checks:

Still pending:
- ...

Updated documentation:
- ...

Next milestone after approval:
- ...
```

## 6. One-line resume rule

When the owner says **“Continue Crimson polish”**, read this roadmap and project progress, identify the next owner-approved checkpoint, implement **only the next eligible VP phase**, verify, update progress, and stop for owner review. Do not ask for another master prompt or re-open the completed visual mapping roadmap. A user turn is still required to start each next milestone; no unattended background implementation is implied.

