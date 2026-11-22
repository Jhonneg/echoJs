# MI05 — stable feature reader and Crimson pilot plan

2026-11-21 · scope, artistic defaults and criteria approved by owner with “lets move”; implementation/evidence in MI05_RESULTS.md. Base `662876e` plus pending G1 work, all preserved. [G1 owner review passes for reviewed conditions](../release/G1_REVIEW.md). Follow the original MI05 milestone and [Crimson-first direction](../../ANIMATION_REFINEMENT.md): implement one developer comparison pilot, stop for owner review, then separately consider the vertex pass. No implementation is included in this planning checkpoint.

## Architecture audit

`analysis.ts` owns one source/analyser and updates the legacy `AudioSignal`. Its optional DEV observer already computes validated fixed energy, 40 ms onset events and slow context from the same bins/clock. The lab source coordinator persists across presentation changes and supports generated fixtures, owner-selected local files and tab input with live-data export locks. The public App still runs legacy features without the diagnostic observer.

Crimson's `journey.ts` currently drives sun activity from active six-band count, speed from normalized six-band RMS with hysteresis, and sun pulse from strong legacy bass transient/flux. `Composition` advances logical distance once, constrains it to loaded terrain, rebases four worker-generated chunks and updates camera/mesh/material refs before rendering. Existing shader activity also drives crests/haze. There is no candidate feature reader or 3D A/B host yet.

Preserve the perspective camera/FOV 42, height/framing, pointer bounds x=1.6/y=0.85 and its 0.18 s response, forward journey, sun/glow offsets, authored geometry/normals/palette/nightshade, four 48-unit chunks, worker lifetime, rebasing, distance safety and quality DPR. No camera kicks, global exposure flashes, new render passes, model assets, services or dependencies.

## Stable reader alongside legacy

Add a small source-independent `src/audio/musicFeatures.ts` contract and publisher, with a read-only consumer interface. Version 1 carries:

| Field | Meaning |
|---|---|
| `version`, `session`, `frame` | Version 1; source/reset epoch; monotonically increasing publication ID within the epoch. |
| `updatedAtSeconds`, status/format | Existing performance clock in seconds, inactive/priming/active state, actual sample rate/FFT. No media nodes, filenames or capture details. |
| Energy | Existing fixed-linear low/mid/high and six-band controls, plus overall fixed energy from the existing broad RMS/0.5 mapping. No new gain/normalization. |
| Onsets | Read-only immutable events with the existing session/sequence/band/peak/emission/strength semantics and bounded history. |
| Context | Existing intensity, brightness/validity and activity, unchanged. |

The DEV bridge publishes from the already computed diagnostic snapshot once per analysis tick; readers do not run FFT/DSP, drain events or allocate snapshots. Keep the mutable producer separate from the scene's `read()` interface. Return a reused typed view, valid until the next publication; retain event scalars only when a consumer needs them. Move/re-export the shared event **type** if needed so shared/scene code never imports DEV diagnostics. Do not move or rewrite the validated DSP algorithms in this task.

The bridge remains in the DEV lab. It may copy normalized values/metadata but cannot create a second analyser, scheduler or parallel feature computation. Legacy `AudioSignal`, adapters, frequency boundaries and MI02–MI04 thresholds/latency targets remain unchanged. Connected active silence remains a valid fresh input even if the legacy `isPlaying` flag is false. Inactive/seek/session/format resets clear publication/event state; a >250 ms stale view cannot drive old accents or travel.

Each scene consumer owns its own session/sequence cursor. Repeated render frames cannot replay an event, and one consumer cannot steal events from another. Mounting, revealing Candidate or changing profile primes to the current event head and clears old impulse state. Source changes preserve terrain distance but clear old musical events. No raw FFT/PCM history leaves existing private DSP state.

## Developer preview and profile switching

Add an optional, lazily opened Crimson preview within `/audio-lab.html`, using the lab's existing analysis/source controls and **one mounted WebGL Canvas**. A small TSX host passes the same legacy signal and stable candidate reader into Crimson. Keep Reactivity/quality common to both profiles; do not introduce per-profile volume or feature boosts.

Use one scene instance, terrain stream and journey distance. Switching **Legacy / Candidate** changes response targets, never source, AudioContext, worker, geometry, camera or playback position. Blend continuous appearance/velocity targets over **0.5 s**, consuming hidden candidate events continuously and clearing transient state on mode changes. Do not flash a prior beat on entry. Closing the preview may unmount its owned worker/Canvas while audio continues; reopening starts a fresh scene/cursor. Profile switching while mounted must preserve journey distance.

Keep public App defaults on Legacy and expose no public comparison/query controls. Crimson may gain optional typed pilot inputs and additional shader uniforms, so its bundle bytes can change; unchanged public behavior/appearance is the gate, not the historical filename hash. The developer preview/reader bridge and live diagnostics must remain excluded from production entry paths. Do not make candidate features the visitor default in MI05.

## Proposed first-pass mappings

These are artistic defaults for approval, not pre-validated results. Apply the existing Reactivity gain equally to both profiles. Candidate effects remain bounded to the accepted sun hierarchy and palette.

| Response | Candidate mapping and initial bounds |
|---|---|
| Sustained sun appearance | Target activity `clamp(0.75 * lowEnergy + 0.25 * overallEnergy) * gain`; retain the authored dim sun/ambient baseline and existing 0.25 s rise /0.8 s fall appearance response. |
| Forward momentum | Target speed `16 * gain * overallEnergy^1.2` world units/s, bounded 0…16. Rise 0.35 s, fall 0.5 s; targets below the existing 0.005 speed stop tolerance settle to zero. No active-band-count proxy or onset-driven camera impulse. |
| Low onset | One strength-proportional sun/glow accent, shaped by one scene-local envelope (25 ms rise, 220 ms decay). Owner specified **50% maximum sun expansion** (scale up to 1.5× authored size) and restoration of the **original 12% glow expansion**, retaining existing pulse-color/alpha caps. Weaker attacks scale proportionally. Combine overlapping responses by bounded maximum, not an accumulating fixed full-strength flash. Legacy retains its existing 8%/12% scale caps. |
| Mid energy/onsets | Existing selected ridge illumination receives sustained mid contribution and proportional mid accents, with at most 15% extra contribution relative to authored highlight strength. |
| High energy/onsets | Sparse existing crest masks receive proportional high accents, at most 10% extra contribution. No random sparkle positions or new geometry. Combined extra ridge/crest contribution stays ≤25% of the authored highlight term. |
| Slow context | Intensity drives distant haze within the existing maximum 0.35 haze multiplier and foreground/depth masks. Brightness/activity redistribute the bounded highlight budget within existing primary/secondary/selected masks; secondary-ridge weighting changes at most 20% relative to its authored value. Invalid brightness uses the authored selection. No extra exposure/color wash or additional long filter stack. |

First preserve the Legacy profile's exact target/response behavior. Extract only the motion-target/integration seam needed to share one distance/speed integrator; retain legacy numerical regression tests. Compute the selected/blended travel target once per render tick and apply the existing loaded-distance clamp before advancing. Do not update two independent journeys or reset distance on A/B changes.

Candidate pulses use actual emission time and bounded scene-local scalar state/history. Preserve strength ratios, avoid fixed minimum peaks, and ease the visible transform without mutating/re-emitting feature events. Do not apply the legacy pulse envelope on top of the already shaped candidate pulse. New shader controls update uniforms on existing materials; default Legacy uniforms reproduce the existing shader result. No frame-time terrain-buffer or normal rebuilding.

## Lifecycle and motion constraints

- Source pause/Stop, stale/unavailable features, zero Reactivity and reduced motion stop travel; no rewind. Preserve the existing hard loaded-terrain boundary even during transitions or worker delays. Active musical silence smoothly removes candidate drive/accents.
- Zero Reactivity suppresses accents and preserves the authored idle appearance. Reduced motion retains centered pointer/camera behavior, freezes travel and geometric sun/glow accents, and allows only the existing slow brightness policy (at least 1.5 s response for changing appearance).
- Session/seek reset, preview mount and profile changes cannot replay retained onsets. Profile changes keep player/context/worker/mesh identity and distance; cleanup releases preview-owned resources without touching the lab's source.
- Other landscapes and their accepted mappings remain untouched. Landscape-switch transitions, vertex displacement, normal/culling changes and permanent production-default selection are excluded. The proposed **0.08 world-unit vertex pass stays separately gated** after this visual pilot review.

## Implementation boundary

Expected files: shared feature contract/publisher and tests; a DEV snapshot bridge/Crimson preview host; minimal lab UI wiring/styles; Crimson scene/controller/material changes needed for optional profile/uniform inputs; focused reader/controller/shader/lifecycle tests and browser evidence. Do not modify `terrain.ts`, noise generation, worker algorithms or camera motion to improve screenshots. Any unexpected architecture/dependency expansion requires review.

Before advanced rendering implementation, verify installed React/R3F/Three versions and consult relevant version-matched Context7 documentation. Current package declarations are React 19.3, R3F 9.8 and Three 0.186; do not upgrade them for this task.

## Proposed acceptance and verification

| Check | Required evidence |
|---|---|
| Reader/data parity | Published fields match validated lab features; once-per-analysis publication, repeated reads unchanged, two independent consumers see each event once, resets/freshness/format/units correct. No scene-side DSP or source dependence. |
| Legacy preservation | Existing Legacy controller tests remain valid; no-reader public scene defaults to Legacy. Matched baseline framing/material/source regression checks and all other landscapes remain unchanged. |
| Proportional response | Identical isolated event shapes at strengths 0.1/0.3/0.6/1 produce strictly increasing sun/accent peaks below caps. Peak responses differ ≤10% across injected 30/60/120 rendering cadences. Mid/high-only event inputs do not create low-onset sun pulses. |
| Energy/context meaning | Increasing fixed energy increases sustained response/travel; constant energy without new events cannot retrigger pulse envelopes. Context changes remain continuous and bounded; active silence/−60 dBFS noise do not cause meaningful travel or new accents. |
| Lifecycle/continuity | No event replay or duplicate distance advance; nondecreasing distance, safe worker limit, seamless rebase/chunk boundaries, preserved player/context/worker/mesh identities on A/B switches, no transform/uniform snapping during blends. Motion overrides respected. |
| Resources/performance | Same geometry, chunk cap, material ownership and render-pass/draw-call structure. No per-frame React state/terrain allocation. Target candidate p95 frame-time overhead **≤10%** against Legacy at matched hardware/renderer, input, logical camera position, viewport/DPR/quality. |
| Owner result | Same permitted track/settings visibly distinguish soft/loud events, sustain without continual pulses, calm silence and smooth transitions; owner prefers Candidate while Crimson's atmosphere remains recognizable. This remains manual. |

Run tests/lint/typecheck/build and existing generated-source audio/browser regressions, retaining MI03/MI04 gates. Add deterministic reader/event/reset/controller tests and WebGL checks of actual transforms/uniforms/resources. Capture generated-only comparisons at desktop **1440×810**, portrait **390×844** and wide **1920×810**, both quality settings, pointer extremes, reduced motion, zero Reactivity and delayed/failed terrain. Compare equivalent logical positions with a controlled generated timeline for screenshot/performance trials; normal owner A/B travel continues from its current distance.

For the proposed performance gate, use three paired 20 s samples per profile/quality after warmup, alternate order and record renderer/OS/GPU/viewport/DPR/input/position and p95 spread. Treat unsupported, software/occluded or unstable trials honestly; no hardware claim from mocks or a single screenshot. If required reliable performance/visual evidence is missing, leave that gate pending rather than declaring completion.

All automation uses generated audio. Owner-selected local/tab media and live features stay transient/non-exportable; never inspect or record private playback for benchmarks. Screenshots retained by the agent must use generated inputs. Native audibility/permission and owner artistic preference remain separate.

Deliver `MI05_RESULTS.md`, generated evidence and the developer comparison ready for owner review. Stop after this approved first pass. Do not begin vertex deformation, another landscape, MI06/MI07, production feature default changes, commit, push or deployment. Suggested planning checkpoint: `Document bounded MI05 Crimson pilot plan`.

Implementation baseline correction: existing uncommitted source already used a 40% Legacy sun cap. Preserve that owner edit rather than restoring the historical 8% cited above. Candidate remains the approved 50% sun /12% glow. See MI05_RESULTS.md for actual evidence and pending owner review.
