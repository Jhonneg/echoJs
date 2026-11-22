# ECHO — Crimson Horizon Visual Mapping Roadmap

**Completion checkpoint (2026-11-22):** Owner explicitly declares the original Visual Mapping Roadmap complete and starts final Visual Polish. VM00–VM06 are closed by owner direction. All remaining Crimson implementation is governed by [CRIMSON_VISUAL_POLISH_ROADMAP.md](CRIMSON_VISUAL_POLISH_ROADMAP.md). Earlier missing native/audio/device observations remain historical verification limits; completion does not invent those observations.

**Purpose:** Completed reference for Crimson Horizon's music-reactive visual mapping. The Visual Polish Roadmap now governs remaining work; do not restart VM development.

**Project:** [Jhonneg/echoJs](https://github.com/Jhonneg/echoJs)

**Current checkpoint (2026-11-21):** Music Intelligence is implemented. VM02 is **APPROVED** per the owner checkpoint supplied with this roadmap and explicit authorization to proceed to VM03. Its stationary demonstration is verified: [VM02 review](reports/crimson/VM02_REVIEW.md), [21.1-second recording](evidence/crimson/vm02/vm02-stationary-review.mp4), [measurements](evidence/crimson/vm02/vm02-verification.json). This supersedes the original undocumented-demo assumption. VM03 is **APPROVED** by owner “proceed”; [review and evidence](reports/crimson/VM03_REVIEW.md). VM01 is **APPROVED** by owner “looks good” ([review](reports/crimson/VM01_REVIEW.md)); VM04 is **APPROVED** by owner “no, lets move” ([review](reports/crimson/VM04_REVIEW.md)); VM05 is **APPROVED** by owner “lets go” ([review](reports/crimson/VM05_REVIEW.md)); VM06 is **APPROVED / CLOSED** by explicit owner completion declaration ([historical review limits](reports/crimson/VM06_REVIEW.md)); the activity halo remains preserved.

> Repository contents and the current signal contract are authoritative. Reconcile this roadmap against the actual code before editing; do not overwrite newer verified status.

## 1. Creative brief and invariants

Crimson Horizon is a stylized, minimalist, atmospheric 3D journey through a dark crimson canyon toward a large pink sun. Its mountains are authored geometry. A forward-moving camera establishes continuous travel. The sun has an existing bass response. The aim is to make the **whole environment interpret music** while retaining an expressive resting composition during silence.

Keep these invariants:

- Preserve the authored mountain geometry, terrain identity, sun composition, existing camera route, source adapters, and Music Intelligence implementation.
- Avoid whole-mountain wireframe lighting, excessive bloom, random fireworks, aggressive terrain deformation, and constant decorative effects masquerading as audio reactivity.
- Distinguish **continuous energy** (holds a visual state), **new transients/onsets** (trigger one-shot events), and **slow musical context** (changes atmosphere gradually).
- Maintain proportional response: quiet and loud input must not look identical. Silence must return the effect to a stable resting state.
- Prefer restrained, readable visual hierarchy: sun first; mountains and ground second; glints and haze last.
- Respect reduced motion, quality settings, and supported browsers. No per-frame React state updates, avoid render-loop allocations, and reuse scene resources.

## 2. Source-of-truth rules for Codex

Before any phase, inspect `AGENTS.md`, `README.md`, `docs/PROGRESS.md` (if present), this roadmap, the relevant scene and signal modules, and existing tests. Check `git status` and preserve unrelated/user modifications. Inspect the actual Music Intelligence API; feature names in this roadmap describe intent, not guaranteed identifiers. Do not create a second analyser, bypass calibrated signals, or change audio capture without separate authorization.

If a planned signal is absent, record the gap and use the closest *already implemented, verified* signal only if semantically appropriate. If that materially changes the requested behavior, stop for owner direction.

Owner-directed response-range refinement: Crimson sun brightness and travel drive saturate at0.35 existing calibrated energy, preserving maximum brightness1/top speed16, original envelopes and Reactivity scaling. This is scene-local artistic mapping, not shared audio normalization; owner accepted this brightness/speed adjustment with “now its better”; VM04 remains pending review.

Each phase owns its scene mappings. Never let one generic `intensity` value unintentionally drive every effect.

## 3. Signal-to-visual contract

| Signal family | Intended visual role | Temporal behavior |
| --- | --- | --- |
| Sub-bass energy | Subtle ground/horizon weight | Slow, small, continuous |
| Bass energy | Sun body enlargement | Continuous, proportional |
| Bass onsets / positive transients | Corona accents and valley wave events | One event per attack, decaying |
| Low-mid energy | Select mountain contour illumination | Continuous, sustained |
| High-mid energy/onsets | Bright moving heads and fading ridge trails | Short, directional |
| Presence | Small, localized distant glints | Brief, intermittent |
| Air/treble | Fine shimmer and sparse particles | Fast, delicate |
| Slow intensity/activity/brightness | Fog, sky, haze, environment tone | Slow and bounded |

These are frequency *features*, not guaranteed instrument separation, beat prediction, or song-section recognition. Do not infer a kick/snare/chorus classifier without one in the engine.

## 4. Milestones and acceptance gates

### VM00 — Integration audit / baseline

**Status:** Reconciled. Shared MusicFeatureReader energy/six bands, immutable onset events and slow context feed the Candidate controller; Legacy remains a comparison. Gain, freshness, profile/session resets and bounded envelopes are scene-local. Existing sun/halo/journey and VM02 baselines are documented in MI05_RESULTS.md, CRIMSON_CONTOURS.md, VM02_REVIEW.md and PROGRESS.md. DEV-only stationary inspection does not change production camera behavior.

1. Identify the exact signal interface Crimson consumes and any legacy mapping paths.
2. Inventory scene-level gain, clamping, envelopes, and redundant smoothing.
3. Note existing sun and camera behavior, visual baselines, tests, and visual fixtures.
4. Confirm how to test with an optional stationary camera without changing production travel.
5. Record completed checks in project progress docs.

**Gate:** Evidence-backed mapping inventory exists. Do not repeat a completed audit every turn; check only what changed.

### VM02 — Mountain contour lighting

**Status:** APPROVED by owner checkpoint; stationary evidence linked above. Preserve this implementation unless a concrete bug or regression appears.

- Low mids gradually reveal selective soft crimson contours.
- High-mid events send a visibly traveling bright head with a short fading trail along terrain-anchored ridgelines.
- Bass does not directly drive these effects.
- Authored geometry is unchanged; resting contours remain dark rather than looking like a wireframe.

**Verified:** Stationary silence, isolated low/high mids, bass-only and generated mixed input are retained in VM02_REVIEW.md.

### VM03 — Reactive Valley Floor

**Status:** APPROVED by owner “proceed” (2026-11-21). See [VM03_REVIEW.md](reports/crimson/VM03_REVIEW.md).

**Goal:** Make the large dark foreground participate through light propagation while keeping the canyon minimal.

**Design:**

- Faint ground channels or narrow, terrain-hugging emissive paths visible at rest only when compositionally useful.
- Each distinct low-frequency onset launches a wavefront in world space, ideally moving along the valley toward the camera. Energy determines brightness/width/decay, not an all-or-nothing trigger.
- A short fading tail suggests propagation. Sustained bass may raise a restrained ambient ground glow but must not spawn repeated waves.
- Waves respect terrain perspective, surface occlusion, camera travel and fade. Keep a bounded event pool with expiration and cleanup.
- Start with one controlled channel/wave. Extend only after it looks correct. Favor shading/illumination over vertex displacement.

**Gate:** In quiet/loud transient fixtures, weak and strong events differ; new attacks are discrete; sustained bass does not retrigger; no wave appears stuck to screen/camera; silence resets; zero obvious geometry gaps, depth artifacts, or high frame-time cost. Owner reviews the moving-camera recording.

### VM01 — Sun and corona refinement

**Status:** APPROVED — owner “looks good” after combined sun/corona refinement. See [VM01_REVIEW.md](reports/crimson/VM01_REVIEW.md).

- Sustained bass controls a restrained, proportional body expansion (15% cap); owner-approved VM01 refinement adds a brief onset expansion up to5% (20% combined), with corona brightness gently reduced during expansion.
- Bass onset strength drives a separate corona flash or thin outward halo; one event per attack.
- Sub-bass may subtly affect a slower secondary luminance/distortion accent.
- Avoid uniform maximum expansion on soft and loud bass, clipping, and persistent full-brightness bloom.
- Match sun and ground-wave energy without doubling the same pulse so aggressively that the image becomes overwhelming.

**Gate:** Quiet/loud bass contrast; sustained-vs-new-attack distinction; controlled silence recovery; attractive resting sun; no unwanted scene/camera changes.

### VM04 — High-frequency atmosphere

**Status:** APPROVED — owner “no, lets move” (2026-11-22). See [VM04_REVIEW.md](reports/crimson/VM04_REVIEW.md).

- Presence: occasional small flashes/glints on distant peaks or near the horizon.
- Air/treble: sparse fine atmospheric particles and subtle sun-edge shimmer.
- Keep particles lightweight and reusable (instancing or buffered geometry where appropriate), quality-scaled, short-lived, and rare in silence.
- No strong bass-driven particle bursts or permanent starfield unless the owner approves a new art direction.

**Gate:** High-frequency fixtures yield distinct, restrained response; bass-only input does not strongly trigger upper-band effects; no distractingly constant flashes; performance and reduced-motion bounds pass.

### VM05 — Atmospheric intelligence

**Status:** APPROVED — owner “lets go” (2026-11-22). See [VM05_REVIEW.md](reports/crimson/VM05_REVIEW.md).

- Slowly modulate distant fog, horizon haze, sky warmth/brightness, and mountain depth contrast using verified slow musical context, not per-hit events.
- Quiet music is spacious and subdued; dense passages feel richer and more luminous; silence retains a beautiful baseline.
- Maintain the purple/oxblood/pink palette and hierarchy; avoid exposure pumping, flashing sky, overly uniform haze, or obscured sun.

**Gate:** Smooth, bounded quiet-to-dense contrast; no whole-scene flicker; stable performance; reduced-motion compliant.

### VM06 — Integrated choreography and release review

**Status:** APPROVED / CLOSED by owner declaration of completed VM roadmap (2026-11-22). Automated integration passed; historical native/audio/device verification limits remain documented in [VM06_REVIEW.md](reports/crimson/VM06_REVIEW.md).

Combine only approved effects with a shared visual hierarchy. A strong bass attack can briefly expand sun corona and produce a delayed ground wave; midrange activity reveals/selectively lights ridges; high-frequency detail adds sparse micro-accents; slow musical context changes atmospheric depth. Avoid physically implausible or distracting cross-coupling solely for spectacle.

**Gate:** Full-song listening review (quiet intro, busy passage, sustained bass, repeated hits, mixed frequency, silence), source switching, scene switching, fullscreen, quality tiers, reduced motion, tab/local input, cleanup, build, lint, typecheck, tests, browser console, and extended playback. Document limitations separately. The **owner** decides final artistic approval.

## 5. Recommended execution order

1. Reconcile VM00 only as necessary; retain verified previous findings.
2. Preserve VM02 as approved; retain its verified stationary evidence.
3. **VM03** — valley floor (next owner review).
4. **VM01** — sun/corona refinement (rebalance with ground waves).
5. **VM04** — high-frequency details.
6. **VM05** — slow atmosphere.
7. **VM06** — integrated choreography and release checks.

Phase numbers identify their original roadmap topics; the sequence above deliberately prioritizes new independent terrain response before sun polish.

## 6. Verification matrix (every phase)

| Input | Expected purpose |
| --- | --- |
| Silence | Stable resting appearance, no leftover events |
| ~100 Hz tone | Low-frequency path, not arbitrary upper-band lighting |
| ~400 Hz tone | Low-mid contour illumination |
| ~1.2 kHz tone/pulses | High-mid traveling accents |
| ~4 kHz tone/pulses | Presence accents, once implemented |
| ~8 kHz tone/pulses | Air/treble accents, once implemented |
| Quiet and loud levels of same fixture | Proportional dynamic range |
| Short attack, sustained tone, repeated attacks | Distinguish energy holds from event triggers |
| Real music | Artistic integration and whether the reaction actually feels musical |

Respect real filter overlap: a tone is not a promise of absolutely zero neighboring band energy. Use the actual engine's fixtures and band definitions. A numeric/automated pass is not proof of acceptable aesthetics.

For each phase, compare stationary and traveling camera when feasible. Playwright or integrated browser preview can verify UI, console, rendering and screenshots, but cannot replace owner listening and watching real music. **Never claim a local video exists unless it was actually produced and verified at that path.**

## 7. Required Codex operating workflow

**One milestone per implementation turn.** Do not implement the whole roadmap at once. At the start of a turn:

1. Read `AGENTS.md`, the roadmap, progress docs, and relevant code.
2. Check latest owner approval and determine the next eligible phase.
3. State the precise phase goal and scoped files briefly.
4. Implement the smallest coherent visual slice, then run relevant automated tests.
5. Verify in browser, capturing a short recording or screenshots *where tooling actually works*.
6. Update roadmap/progress status with evidence and known limitations.
7. Report outcome, changed files, tested behavior, visual observations, manual pending checks, and next phase.
8. Stop at **IMPLEMENTED — AWAITING OWNER REVIEW**. Do not silently advance into another phase.

**Statuses:** `NOT STARTED` → `IN PROGRESS` → `IMPLEMENTED — AWAITING OWNER REVIEW` → `APPROVED`, or `BLOCKED`. Never self-approve visual quality. Only the owner's explicit approval can move the milestone to `APPROVED`.

**Clarification threshold:** Do not ask the owner for routine implementation decisions that follow this roadmap; choose a conservative default, record it, and proceed. Ask only for significant visual-direction choices, destructive changes, missing authority, incompatible engine contracts, or other decisions that materially change scope.

**Commits:** Do not commit, push, or deploy without owner approval. Preserve unrelated uncommitted changes.

**Documentation:** Keep this roadmap and `docs/PROGRESS.md` in sync. If useful, add a short pointer in `AGENTS.md`; never dump all these instructions into `AGENTS.md` or duplicate project context endlessly.

## 8. Mandatory phase report template

```text
CRIMSON VISUAL MAPPING — VMxx
Status: IMPLEMENTED — AWAITING OWNER REVIEW

Implemented:
- ...

Audio signals consumed:
- ...

Files modified:
- ...

Verification:
- Tests / typecheck / lint / build:
- Browser / console:
- Synthetic fixtures:
- Visual evidence (exact existing paths):
- Real music / audible capture (verified or manual pending):

Design tradeoffs and limitations:
- ...

Documentation updated:
- ...

Next milestone after owner approval:
- ...
```

## 9. Simple resume command for future sessions

Historical VM resume rule (superseded by **"Continue Crimson polish"** in the Visual Polish Roadmap): when the owner says **"Continue Crimson"**, Codex should read this file and progress docs, identify the latest owner-approved phase, and proceed **only** with the next eligible milestone. The owner should not have to re-explain the plan or request a new master prompt. Every milestone still requires an explicit review/continue turn; Codex does not autonomously run in the background.

