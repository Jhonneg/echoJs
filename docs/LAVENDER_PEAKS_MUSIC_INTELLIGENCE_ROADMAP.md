# ECHO — Lavender Peaks: Music Intelligence + Living Landscape Roadmap

**Status:** LP08/LP09 remain skipped by owner. Separately approved organic bass-corona refinement is implemented and verified with generated/browser/optical evidence (2026-11-23). Owner subsequently requests gentle independent sun size pulsation (1+.08sunPulse) alongside the existing brightness pulse; no shared MI or other-landscape changes. Stop for this refinement's visual review; no roadmap phase reactivated.
**Phases:** LP01–LP09  
**Experience:** A coordinated *living 2D mountain symphony*. The music seems to pass through the sun, mountain ridges, mist, and sky.  
**Visual reference:** The latest approved Lavender Peaks three-panel storyboard (with the **smaller** corona), and the user's animated noise-orb reference. Attach these images/video to the local coding agent when beginning visual implementation.

## 0. Executive brief

The existing Lavender Peaks landscape has six layered mountain ridges sharing one audio-driven travel signal, seamless sideways travel, a level stationary camera, a pastel lavender palette, and a sun partly hidden behind a mountain. It still consumes the **legacy `AudioSignal`** for mountain motion and the sun. Independent frequency roles are a proposed change, not existing behavior. This roadmap migrates **every Lavender Peaks audio consumer** to the existing `MusicFeaturesV1` contract and uses that signal to coordinate a more expressive, strictly **2D** environment.

This is **not** another audio-engine project. Do not modify Music Intelligence's shared extraction, normalization, onset generation, or the other landscapes. Confirm the current repository details during LP01; historical audits can be stale. Replace the **scene's consumption and visual mapping**, not the original art assets.

**Central design:** The sun has a small, organic, continuously wavering *noise corona*. Music changes its irregular perimeter and filament motion. The corona emits stylized **2D light** into the sky, nearest slopes, mountain-edge highlights, and valley mist; other ridges maintain independent musical identities. The landscape responds as one instrument, not six unrelated spectrum meters.

## 1. Non-negotiable art constraints

1. **Strictly 2D presentation.** Preserve current rendering technique (whatever the code uses); no 3D camera, volumetric engine, physically simulated lighting, depth fly-through, or new 3D scene.
2. **Preserve geometry and motion.** Keep six authored mountain profiles, their ordering, rightward repeating/seamless terrain and level framing. Owner selected continuous gentle autonomous drift during LP01 planning; this deliberately replaces audio-dependent travel. There is no current public speed control; use scene-local speed constants without restoring removed UI. Avoid replacing or significantly reshaping authored silhouettes.
3. **Pastel restraint.** Maintain muted lavender, violet, rose and soft ivory/peach. No saturated orange wireframe orb, neon lasers, exaggerated white flashes, particle storms, or visual clutter.
4. **Small corona.** At high intensity, organic wisps remain concentrated near the visible sun; do not let rays occupy a large portion of the sky. Use an adjustable, bounded maximum footprint relative to the existing sun radius. The corona remains visually behind the occluding mountain.
5. **Coordinated but independent.** Sustained features, onsets, and slow atmosphere have different jobs and timing. Reactions should reinforce each other without all layers flashing or deforming in unison.
6. **Musically honest.** Only use information present in `MusicFeaturesV1`. Do not claim instrument separation, harmony, beat tracking, or section detection where unavailable. Qualified broad onsets may use scene-local histories of specific energy bands.
7. **Lifecycle-safe.** Silence, capture disconnect, stale timestamps, new sessions, Reactivity = 0, reduced motion, fullscreen, quality settings and scene switching must not leave stale pulses or runaway animation.
8. **Scope discipline.** One authoritative roadmap and updates to existing progress/architecture docs. No proliferation of one-off context files and no unrelated scene refactors.

## 2. Proposed visual language and mapping

This table is an **art-direction proposal**. LP01 must confirm the current six-band names/ranges, the authored near-to-far ridge order, and existing mappings before finalizing assignments. Preserve established front/mid/back roles unless deliberately approved for change.

| Signal role | Primary visual consumer | Sustained treatment | Discrete event treatment |
| --- | --- | --- | --- |
| Low/bass energy | Assigned large-scale ridge layers and corona envelope | Broad, heavily smoothed silhouette breathing, slight deeper foreground shading, gentle corona expansion | Qualifying low onset briefly strengthens the corona envelope and sends a soft light echo toward nearby peaks |
| Low mids | Assigned broad middle/foreground ridge areas | Gentle interior shading and small coherent terrain movement | Rare, restrained local accent if supported |
| Mids | Assigned middle ridge layers | Fine shape breathing and contrasting lavender gradients | A short highlight begins travelling along a selected ridge contour |
| High mids | Selected distant/middle contours, corona filaments | Delicate contour illumination / irregular local corona waves | Qualified mid onset produces a localized warm corona flourish and short contour streak |
| Treble/high frequency | Farther ridges and fine corona strands | Faint fine texture and smaller highlights | Quick, isolated edge glints or thin wisps; avoid uniform strobing |
| Slow overall intensity (if actually available) | Sky wash, valley mist, depth contrast | Gradual changes in color temperature, fog opacity and apparent depth | No direct hard flash; slow recovery from energetic sections |

**Visual hierarchy:** The sun corona is a focal instrument; the closest mountain is the weight, middle mountains carry rhythmic/melodic motion, distant mountains carry fine detail, and the sky/mist provide atmosphere. The specific frequency assignment to each of the six ridges is determined from the real layer geometry and prior scene contract, not invented from an old summary.

**Time hierarchy:**

- **Fast** (roughly 0.08–0.35 s): onset highlights, small corona filament accents, sharp but low-intensity glints.
- **Medium** (roughly 0.3–1.5 s): light travelling along ridges, localized corona waves, ridge response recovery.
- **Slow** (roughly 2–8 s): mountain tint, sky temperature, valley mist, depth breathing.

These are starting ranges for artistic tuning, **not mandatory constants**; compare with real music and rendered evidence. The autonomous terrain scrolling must stay independent of audio and must not accelerate erratically in response to an onset.

## 3. Implementation phases

### LP01 — Current architecture and visual baseline

**Objective:** Understand the existing scene before deciding how to touch it.

**Tasks**

1. Read `AGENTS.md` and the active progress/roadmap instructions. Identify source files for Lavender Peaks, app-level audio passing, sun, terrain generation/looping, UI controls and tests. Do not load all historical context files indiscriminately.
2. Trace every legacy `AudioSignal` dependency and every downstream visual consumer. An earlier finding located legacy delivery in `App.tsx` via `analysis.signal`; verify against current code.
3. Inventory all six mountains: ordering, authored paths/noise parameters, movement direction, scroll speeds, repeat seams, reactive deformation, band mapping, material/gradient controls and render technique.
4. Inspect sun drawing, clipping/occlusion order, its legacy bass/transient/flux mapping and whether any glow currently illuminates mountains.
5. Verify exact current `MusicFeaturesV1` energy, onset, freshness, time units, session and sequence semantics. Contrast with Crimson/Noctune's existing scene-local readers without copying their 3D effects.
6. Capture reproducible visual baseline: no audio, controlled generated bands, internal Reactivity = 0, and a longer scrolling loop. Real authorized music is reviewed live by the owner with text observations, following the established privacy policy; never capture owner media. Log known gaps, performance and browser availability honestly.

**Deliverable:** Compact dependency diagram (`audio → scene response → ridges/sun`) and six-layer visual mapping table in existing documentation; baseline screenshots/video.  
**Exit gate:** Every audio consumer is known; all invariants and possible seam risks are identified. **No production visual changes during LP01.**

### LP02 — Full scene-level Music Intelligence migration

**Objective:** Lavender Peaks no longer needs legacy `AudioSignal` at runtime.

**Tasks**

1. Connect the same read-only Music Intelligence reader already used by migrated landscapes. Its publication is a borrowed, reused view, not a deeply immutable snapshot; copy only bounded scalar histories. Individual onset events are immutable.
2. Add or adapt a **scene-local response module** that accepts calibrated six-band energy and relevant onset events. Keep output separate from raw audio extraction.
3. Handle `active`/`fresh`, silence, session reset, event sequence de-duplication, time-unit conversion (seconds versus milliseconds), clamping and fallback to calm base animation. Avoid replaying old onsets after capture pauses or scenes switch.
4. Migrate **all six ridges and the sun** to those responses. Do not leave a hidden legacy audio path in sun pulses, terrain speed or UI reactivity.
5. Use bounded scene-local calibration based on measured feature distributions, not old legacy `.fast` assumptions or aggressive per-frame auto-normalization.
6. Maintain manual/debug preview behavior if present and avoid coupling it to active music mode.

**Exit gate:** An import/usage audit finds **zero Lavender Peaks production consumers of legacy `AudioSignal`**, while other unmigrated landscapes remain unaffected. Focused trace tests, typecheck, lint and build pass. A controlled visual smoke test confirms no regression in the static composition or looping movement.

### LP03 — Six-ridge musical behavior

**Objective:** Give each mountain layer a stable, readable musical role while retaining the authored terrain.

**Tasks**

1. Confirm or refine each ridge's assigned band and depth role. Avoid six nearly identical responses.
2. Preserve the original base path and seamless horizontal travel. Layer small smooth deformation or controlled vertical contour offset above it, with bounded displacement and stable interpolation. Deformation may be **minimal or omitted** for layers where shading communicates more cleanly.
3. Add distinct, scene-local gradient/shading response so even non-deforming ridges participate. Keep foreground darker, middle layers expressive and distant layers softly illuminated; don't flatten depth contrast.
4. Separate sustained response from onset reaction. Slow attacks should feel broad and organic; discrete accents should not make entire ridges jerk.
5. Protect tile boundaries: audio modulation must evaluate consistently at looping seams. Check long playback, high speed and quality levels.

**Exit gate:** Six bands/layers have distinguishable behavior in controlled fixtures; they remain a coherent natural mountain panorama during real music, with no jumps, gaps or chopped motion. Provide a side-by-side video of original and tuned behavior.

### LP04 — Small procedural 2D noise corona

**Most recent owner adjustment (2026-11-23):** “make the sun pulsate a bit too” supersedes the fixed-core restriction. Permit only gentle independent disk/haze scaling1+.08sunPulse. Organic corona uses unscaled coordinates and is preserved.

**Latest owner-approved refinement (2026-11-23):** Organic bass-driven perimeter supersedes the regular bass harmonics and restored core expansion. Keep fixed-size circular core plus owner-selected gentle brightness/haze pulse. Two-octave periodic value noise, separately phased/scaled3strands,80/450ms bass-target envelope and bounded650ms localized onset lobes replace the insufficiently visible deformation. Retain1.65×core hard footprint and existing corona-driven lighting. Generated measured bass.134/.267 and onset strengths up to.212 ground calibration; acceptance measures rendered silhouette at equal opacity. Existing art/geometry/camera/MI remain. See current PROGRESS and `evidence/lavender-peaks/corona-noise/`; LP08/LP09 remain skipped.

**Historical owner direction (2026-11-23; core expansion superseded by the focused organic-corona refinement above):** Restore the sun disk/haze’s original bass pulse look and timing independently via existing MI low targets/qualified attacks. This supersedes fixed-core/no-rigid-disk-scaling requirements for the disk only; approved corona remains unchanged. Verified at the LP06 checkpoint; LP07 unstarted. See current PROGRESS.

**Approved refinement (2026-11-23):** Owner “yes parove” approves the matched current/proposed corona preview. Strand radii grow15%, sustained deformation3× and local accent displacement1.8×; amplitude cap.22 and footprint cap1.65×fixed .75 core supersede the initial1.35/.11 bounds. Retain palette/opacity, band qualification, response timing, reduced-motion policy, authored terrain/camera and shared MI. This is a focused refinement at the LP06 checkpoint, not authorization to start LP07. See PROGRESS and `evidence/lavender-peaks/corona-approved/`.

**Objective:** Replace the conventional sun halo with a bounded, organic, musically expressive corona.

**Approved look**

- Pale ivory-pink core sun remains visually consistent and partly hidden by the authored mountain.
- A **small**, irregular ring of a few translucent overlapping wavy strands hugs its perimeter. Borrow the noise-orb reference's *continuously undulating edge*, **not** its 3D wireframe sphere or saturated orange material.
- Resting corona has a faint natural motion. Strong energy increases local wave amplitude, density and brightness within a defined art-directed maximum. Fine high-frequency events create isolated outward wisps/glints; do not expand the entire sun as a rigid circle.
- Use deterministic, temporally coherent noise or smooth shape functions; no per-frame randomized spikes, sudden topology changes, or visible aliasing.

**Tasks**

1. Select the lightest approach compatible with existing 2D rendering (Canvas paths, SVG filters/paths, or a small 2D shader if already appropriate). Do **not** create a new 3D scene or import another rendering stack for one effect.
2. Separate intrinsic slow noise animation, sustained music-controlled modulation, and short event-controlled local accents.
3. Ensure smooth, stable draw order: corona behind foreground mountain occluders, no rays leaking through silhouettes, no rapid flicker.
4. Provide adjustable bounds for maximum footprint, amplitude, emissive intensity, response sensitivity and reduced-motion behavior. Use small and strong previews under matched settings.

**Exit gate:** Corona is clearly organic in a fixed-camera recording, still elegant at peak energy, remains near the sun, and reacts to distinct musical cases. Human visual approval before expanding into the rest of the landscape.

### LP05 — Corona-driven 2D environmental illumination

**Objective:** Make the corona feel like an actual visual light source for the illustrated environment.

**Tasks**

1. Add a soft radial/wedge gradient wash around the sun into nearby sky, bounded and palette-consistent. No full-screen uniform exposure pumping.
2. Give directly adjacent mountain edges and slopes warm-tinted highlights computed/masked in 2D, strongest near the sun and fading with depth/placement. Preserve mountain silhouettes.
3. Let selected valley mist catch some of that illumination. Use layered alpha/color transitions rather than simulated volumetric scattering.
4. Carry some intensity into farther ridges as **delayed contour glints** rather than making all mountains instantly brighten. Keep band-independent local responses distinguishable from the shared corona light.
5. Make all lighting visualizations share a single bounded scene-local `coronaLight` or equivalent response so the sun and surrounding color/shading remain causally coherent.
6. Check every scrolling position and occlusion boundary. Light must be attached to the sun's screen/world position, not to a particular repeating mountain tile.

**Exit gate:** The sky, nearby mountain contour and at least one mist/depth layer respond consistently to the corona. A quiet versus active matched screenshot shows motivated local illumination without destroying the pastel tonal hierarchy.

### LP06 — Travelling 2D ridge illumination

**Objective:** Visualize musical events *moving through* the layered mountain terrain.

**Tasks**

1. Create thin, soft, short-lived highlight strokes bound to selected ridge silhouettes, with a bright traveling head and fading tail; use pastel ivory/rose, not neon.
2. Drive new strokes from qualified Music Intelligence onset events. Give different bands different mountain recipients, durations and directions/propagation delays.
3. Avoid synchronous global activation. Limit simultaneous traces to prevent the frame from becoming a glowing contour map.
4. Preserve smooth continuity when a traveling highlight crosses a repeating terrain seam or when a ridge moves sideways under a stroke.
5. Keep animation one-dimensional along existing curves and use the current 2D renderer; no added depth geometry.

**Exit gate:** In a fixed camera, a viewer can see light travel over a few peaks at musically meaningful times while the mountain remains structurally readable. Low-mid-only input does not accidentally fire a high-mid-specific trace.

### LP07 — Unified atmosphere and musical choreography

**Objective:** Make ridges, corona, sunlight and atmosphere feel like **one living instrument**.

**Tasks**

1. Introduce restrained, slow 2D valley mist, light temperature, sky gradient and inter-layer contrast modulation. Give the large sky area purpose without filling it with particles.
2. Tune a hierarchy for quiet/sustained/attack/dense passages using only existing features. The scene may infer *energy and onset activity*, but not musical emotion or phrase boundaries absent from the contract.
3. Coordinate a short visual causal sequence: **qualified onset → local corona/contour accent → delayed nearest ridge/mist light → smooth decay**, while each ridge retains its own band response.
4. Prevent excessive all-at-once brightness, event spam or overactive contours during busy songs. Prefer clear negative space.
5. Use three animation timescales and per-layer dynamics; test a soft acoustic passage and a busy electronic passage to avoid one-song tuning.

**Exit gate:** Musical passages look meaningfully different, the whole 2D composition participates, and there is no confusing strobing, terrain shaking or permanent maximum illumination.

**LP07 implementation checkpoint — 2026-11-23:** Slow context density/warmth use2/4s smoothing (4/6s reduced), copied during the single MI read. Existing delayed corona light/glints/mist and staggered contour pool form the causal sequence; no new event detector or timing retune. Restrained sky gradient/temperature, far valley mist and inter-layer contrast use existing materials/profile texture. Busy context reduces trace opacity by≤25%; independent band outputs unchanged. Approved corona/sun algorithms untouched. Generated actual-MI run1029samples/234frames, quiet no-change, matched exposed emitter no-change, gain/reduced/stale/session/Low checks pass. See PROGRESS and `evidence/lavender-peaks/lp07/current/`. **Owner visual approval and soft acoustic/busy electronic text listening remain pending; stop before LP08.**

### LP08 — Verification and performance checkpoint

**Status: SKIPPED BY OWNER — 2026-11-23.** Original scope below is retained for reference; its exit gate is not claimed passed.

**Objective:** Confirm reactivity, smoothness, lifecycle and performance before owner review.

**Required tests**

- Controlled band fixtures for all six energies and low/mid/high onset streams, including combined input and silent gaps.
- Distinct sustained versus transient response; rising/lower levels remain distinguishable; no unnecessary saturation.
- `active/fresh` validity, pause, disconnect, stale features, sequence de-duplication and new session reset.
- Reactivity = 0 disables music-driven changes; intrinsic base scrolling/approved resting corona behavior follows the existing product interpretation. Reduced motion significantly reduces or removes movement without making the composition unreadable.
- Continuous scrolling for several minutes at multiple speeds with no seams or discontinuous illumination.
- Scene switching, fullscreen, responsive sizes, quality levels and browser controls. Validate in a real browser when available; never claim a browser check that wasn't run.
- Run relevant unit/integration tests, lint, typecheck and build; measure FPS/frame time and inspect canvas/SVG/shader cost on a target device. Fix serious performance regressions; defer broader optimization if acceptable.

**Exit gate:** No obvious crashes, lifecycle bugs, visual seam discontinuities, severe frame-rate regressions, or lost manual controls. Record evidence and known untested conditions.

### LP09 — Real-music comparison and closeout

**Status: SKIPPED BY OWNER — 2026-11-23.** Original scope below is retained for reference; its exit gate is not claimed passed.

**Objective:** Decide whether Lavender Peaks has achieved its artistic identity without spending indefinitely on one landscape.

**Method**

1. For owner live listening, use the **same authorized song excerpt** for Lavender Peaks, Crimson and Noctune where possible; collect text observations only. For recorded comparisons, use the same generated source and match quality, viewport and source timestamps. Never record or inspect owner media.
2. Capture fixed-camera Lavender Peaks footage of generated quiet, sustained, percussive, dense and silent passages. Supply matched baseline versus final frames and a short trace of features/events → rendered responses where practical. Generated evidence does not substitute for owner musical approval.
3. Evaluate the criteria below. Compare **musical expressiveness**, not identical effect types or identical darkness/brightness. Noctune and Crimson are reference standards, not templates to clone.

| Criterion | Pass condition |
| --- | --- |
| 2D identity | No 3D camera/effects; six-layer original parallax composition survives |
| Music Intelligence migration | No Lavender Peaks production dependency on legacy audio remains |
| Layer distinction | Independent ridge responses are perceptible but gentle; no seam jumps or rhythmic geometry clipping |
| Corona | Small and organic, distinctly responds to music, remains behind mountain occluders |
| Light propagation | Corona visibly influences nearby sky/slopes/mist; contour accents travel across selected ridges |
| Whole-scene coordination | Quiet, medium and intense music produce coherent, distinguishable compositions without every element flashing together |
| Stability | Lifecycle, reduced motion, Reactivity and performance checks pass at defined baseline |
| Artistic review | Owner agrees that Lavender Peaks feels expressive alongside Crimson and Noctune while retaining its unique calm style |

**Decision:** If all criteria pass, close LP09, update the existing project status, and create a **reviewed checkpoint commit only when the owner authorizes it**. Do not start a large new polish loop; record deferred minor enhancements and move to the next landscape. If a criterion fails, propose one bounded correction with evidence and repeat only the relevant comparison.

## LP01 audit and proposed migration — 2026-11-23

### Verified current architecture

```text
App: one existing analysis instance (Music Intelligence already enabled)
  ├─ analysis.signal → LavenderPeaksScene → Composition (refs/useFrame)
  │    ├─ intensity + sixBands → one spectral-balance drive → six x offsets
  │    └─ fast.bass + transient.bass + flux.bass → sunPulse sky uniform
  └─ analysis.musicFeatures → Noctune / Crimson (not yet Lavender)
```

Source inventory: `src/scenes/lavender-peaks/LavenderPeaksScene.tsx`, `motion.ts`, `terrain.ts`, `lavender-peaks.css`; App delivery; shared `LandscapeCanvas`; `tests/lavenderMotion.test.mjs`. No Lavender manual preview or independent speed UI exists. The disabled shared camera-tilt component receives a legacy prop but never mounts, so it is not another active consumer. Remove that unnecessary prop during migration; the host already supports `cameraTilt={false}` without a signal.

The scene uses React Three Fiber/Three r186, but the presentation is flat: an orthographic camera at `[0,0,20]`, zero rotation, opaque ShapeGeometry ridge silhouettes, and a sky shader plane at z=-10. No physical lights, bloom or reflection passes. Zoom is `min(height/12,width/7)`. Standard DPR is device-limited1–1.5; Low is0.75. No per-frame React state updates. Sun center is `[1.6,1.9]`, disk edge radius0.68–0.75 world units. Terrain naturally occludes it; as ridges travel it can become more exposed or covered. Existing haze and the large static sky wash do not illuminate ridge materials.

Every ridge uses this same drive: `intensity × (0.25 + 0.75 × balance)`, where balance is the power-weighted mean of normalized six-band indices. Speed uses120ms attack/300ms release, dt capped50ms, exact exponential distance integration, and positive24-unit wrapping. Silence settles travel to zero; gain0/reduced motion freeze in place. No deformation, per-ridge threshold or transient mapping exists. Materials are static vertical color gradients. The sun uses `clamp(0.2×fast.bass + 0.8×max(transient.bass,flux.bass))`,40ms attack/220ms release, up to20% radial expansion and bounded disk/haze blend increases. It resets immediately at zero gain/reduced motion. Neither consumer checks Music Intelligence freshness or events.

| Ridge, far → near | z | Base / detail | Upper → lower gradient | Current max speed | Current band role | Proposed sustained role |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | -7 | -1.4 / .08 | #c0b5df → #ddc9ea | .15 | Shared global drive | Air6000–20000Hz: distant fine detail |
| 2 | -6 | -2.0 / .11 | #b2a4d5 → #d6b9df | .25 | Shared global drive | Presence2500–6000Hz: isolated highlights |
| 3 | -5 | -2.6 / .12 | #a795c9 → #cdb1d4 | .45 | Shared global drive | High mids800–2500Hz: delicate contour light |
| 4 | -4 | -3.2 / .14 | #9884bb → #bda2c7 | .65 | Shared global drive | Low mids250–800Hz: middle-layer shading |
| 5 | -3 | -4.1 / .16 | #8877af → #aa8fba | .90 | Shared global drive | Bass80–250Hz: broad foreground tint |
| 6 | -2 | -5.2 / .18 | #7d70a5 → #9b84ad | 1.20 | Shared global drive | Sub-bass20–80Hz: restrained foreground weight |

The old L03 low-to-high/far-to-near assignments were explicitly superseded by the shared-response refinement in `docs/MOTION.md`. New foreground-low/background-high assignments are a deliberate proposed change for this roadmap, not restoration of a current contract. The storyboard is a lighting/style reference; its smoother profiles must not replace the existing serrated authored outlines.

### Music Intelligence contract and constraints

- `MusicFeatureReader.read()` returns a borrowed reused scalar view; each event is frozen, but the view/event-array must not be retained as immutable snapshots. Copy scalar samples into fixed-capacity histories, never PCM/FFT data.
- `energy.six` is calibrated linear spectral RMS divided by0.5, clamped0–1, using Blackman-window power correction. It is not legacy sensitivity/soft-normalized fast energy. Ranges are half-open, clipped to Nyquist. `energy.low/mid/high` span20–250/250–4000/4000–20000Hz. There is no separate narrow "mids" feature between lowMids and highMids.
- `energy.overall` is the immediate overall RMS intensity target; `context.intensity` is its already-smoothed version (.75s rise/1.5s fall). Context also supplies normalized logarithmic spectral brightness with a validity flag and4s event activity. Further2–8s artistic atmosphere smoothing belongs in Lavender only.
- All contract timestamps are seconds on the performance clock. Event `timeSeconds` is detected peak time; `emittedAtSeconds` is publication time. Events have session/sequence identity, are retained up to10s/256events, and are broad low/mid/high only. They are not beats or instruments. Session reset/gaps require clearing scene histories; fresh means active status and age in[0,.25]s.
- Existing Noctune `cyanPanel.ts`/`midrange.ts` show scene-local onset qualification using64 scalar samples, approximately60ms rises near detected peak time, a .02 rise floor, and publication-age checks. Crimson `musicPilot.ts` demonstrates local envelopes, deduplication and separate atmosphere. Reuse principles without changing those scenes or copying their 3D presentation.
- No blocking engine incompatibility found. Six-band sustained roles are direct; narrow-band accents require scalar-history qualification of broad events. No BPM, pitch, harmony or section detection is available.

### LP02–LP07 design approved by owner “proceed” — 2026-11-23

1. App supplies only `analysis.musicFeatures` to Lavender. A new scene-local response module owns six sustained levels, qualified accents, corona/atmosphere values and a bounded contour pool. Geometry generation remains static. `motion.ts` retains terrain math and autonomous scrolling, with no legacy `AudioSignal` consumer. Shared math/type helpers from `signal.ts` are acceptable; legacy values are not.
2. Drift is rightward at initial scene constants `[.03,.05,.09,.13,.18,.24]` world units/s (20% of existing depth caps), independent of source/intensity/events/gain. Silence and zero gain keep drift; reduced motion freezes position. No new public slider. Normal motion stays continuously rendered even at gain0. Reduced mode may keep frame sampling for slow shading while disabling drift, corona undulation and event strokes; do not rely on a demand loop that never updates incoming audio.
3. Use each assigned calibrated band independently. Initial proportional drive is `energy/(energy+.25)` with zero mapping to zero and no per-frame normalization. LP02 measures quiet/loud response before accepting constants; LP03 uses slow bounded tint/gradient response (initial .4s attack/1.2s release, .8/1.5s reduced). Preserve foreground darkness; no silhouette deformation initially. Low and high events qualify against the recipient six-band rise just as mid events do; a held high-mid tone plus low-mid attack must not create a high-mid streak.
4. First observation of a session/re-entry seeds the sequence cursor and discards retained events. Advance the cursor even while disabled/stale; clear history/accents on invalidity/session changes. Sample histories only on distinct feature frames. Accept only matching-session, finite nonfuture events emitted within250ms, qualified near `timeSeconds`; initial qualification follows the existing .02 rise floor/60ms rise/±90ms peak window. Sustain fades naturally on silence or invalid input; gain0 clears music values immediately, leaving intrinsic drift/resting corona.
5. LP04 extends the existing sky shader, preserving sun center/core and opaque ridge occlusion. Start with three pale overlapping coherent wavy strands, a faint intrinsic rest, broad low-energy envelope and localized qualified mid/high accents. Proposed hard outer corona radius is1.35×existing .75 sun radius; use smooth falloff within that bound. Do not scale the whole disk as a rigid audio-driven circle. Owner approval locks appearance before LP05.
6. LP05 uses one bounded `coronaLight` for local sky, world-positioned slope masks and selected mist. Ridge illumination must account for scrolling transforms; the light stays at the sun while terrain repeats. LP06 allocates at most3 simultaneous contour strokes, at most1 per ridge; low→near, qualified mid→middle, qualified high→far, with alternating travel directions, bounded delays and .3–1.5s lifetimes. Avoid allocations and React updates per frame. LP07 adds slow context modulation, not hard global intensity flashes. LP04/LP07/LP09 remain explicit owner gates.

### Baseline evidence and verification

Evidence is in [LP01](evidence/lavender-peaks/lp01/). `scripts/verify-lavender-lp01.mjs` copies the current application into `/tmp`, injects scalar-only probes there, and launches a fresh local Brave/CDP profile. No Playwright tool is configured; CDP is the existing browser-check fallback. Captures use generated WAV only; explicit gain/offset fixtures are temporary-copy overrides, not claims of public controls or native capture verification. Source hashes verify that all production `src` files remain untouched.

- [Original no-audio composition](evidence/lavender-peaks/lp01/original-no-audio.png), [generated playback](evidence/lavender-peaks/lp01/generated-baseline.mp4), [generated schedule](evidence/lavender-peaks/lp01/generated-schedule.json), [signal/render trace](evidence/lavender-peaks/lp01/trace.json).
- [Math audit](evidence/lavender-peaks/lp01/math-audit.json): at fixed intensity.6, isolated sub-bass/bass/low-mid/high-mid/presence/air drive nearest-ridge speeds .180/.288/.396/.504/.612/.720. Every layer shares the same factor and depth ratios. Bass sun pulse approaches1; isolated midrange/treble give0.
- Existing41 test files, typecheck, lint and build pass. Build retains the pre-existing >500kB chunk warning. Test command `node --test tests/*.test.mjs`; build/typecheck/lint run without source rewriting. [Capture results](evidence/lavender-peaks/lp01/capture.json) and [measurement assessment](evidence/lavender-peaks/lp01/assessment.json) record1076 signal/render samples and424 generated-video frames (~63.9s). Source-time screenshot brackets reach213ms: passage alignment, not sample-accurate output recording.
- Actual generated1000Hz quiet/loud mean high-mid energy is .04240/.14132; current nearest-ridge speeds .2664/.3478 expose the legacy intensity compression. Bass-only100Hz produces high-mid energy .00000214 (negligible), while low-mid450Hz produces .00000450.100Hz also measures sub-bass .0461 alongside bass .1336 because FFT bins/window resolution cross the80Hz boundary; band isolation is not instrument isolation. At late silence MI six energies are exactly0, but legacy intensity still averages .000645 and travel .000567 units/s. Existing audio-driven travel therefore has a long small tail rather than immediate silence freeze.
- The90.36s temporary ideal maximum-drive loop yields far-to-near wrap counts0/0/1/2/3/4 with all offsets bounded. Sampled p95 frame interval17ms on reported ANGLE/NVIDIA GTX1660 SUPER at1440×810/DPR1;7 draw calls,4616 triangles,7 geometries,0 textures. This instrumented development/headless observation is a baseline, not target-device performance certification. No browser runtime exceptions.
- [Origin](evidence/lavender-peaks/lp01/wrap-origin.png) versus [whole-period](evidence/lavender-peaks/lp01/wrap-full-period.png) render positions have PSNR94.18dB (tiny rasterization differences, not byte-identical); scalar/geometry periodic checks pass. Long-loop evidence is scalar transforms plus endpoint screenshots, not a continuous seam-inspection video. [Zero gain](evidence/lavender-peaks/lp01/zero-reactivity.png) and [reduced motion](evidence/lavender-peaks/lp01/reduced-motion.png) freeze/reset assertions pass in explicitly labeled temporary-copy fixtures.
- Seam invariants: period24, x sampling1/8, periodic Gaussian copies and integer106/217 detail harmonics. Height/slope must repeat, not only mesh offsets. Geometry extends an extra period beyond viewport. New contour coordinates must wrap continuously; world-positioned lighting must not wrap with tiles. CPU checks cover all6 profiles across multiple positive/negative periods; browser wrap snapshots/extended travel complement, not replace, LP08's multi-minute/multiple-speed checks.
- Real-song owner listening, native permissions/fullscreen, artistic approval and final GPU/performance acceptance remain pending. No owner media was inspected/captured; no claim that generated data establishes musical perception. LP02 is not started.

## LP02 migration checkpoint — 2026-11-23

Owner “proceed” after LP01 authorizes migration using the documented mapping. Earlier LP01 pending-design statements describe that checkpoint; this decision supersedes them. Real-song listening remains unperformed and carried forward, not silently marked passed.

**Implemented:** App now supplies only `musicFeatures` to Lavender. `response.ts` reads the existing borrowed reader once/frame and keeps64 scalar times plus six-band energy/rise histories (6656bytes of typed storage). Ridges are assigned far→near air/presence/highMids/lowMids/bass/subBass, calibrated by `e/(e+.25)`. Their sustained values use .4s/1.2s smoothing (.8s/1.5s reduced); qualified low/mid/high events produce separate .22s accents only for rising recipient bands. Session initialization/re-entry seeds event cursors; stale/inactive/priming, disabled and reduced cases clear event/history state; wrong-session, old or future events cannot fire. Zero gain clears musical levels. No raw audio, FFT history, new analysis, frame-rate React state, or engine change.

`motion.ts` now performs only fixed rightward drift at .03/.05/.09/.13/.18/.24 units/s, wrapping24units and freezing for reduced motion. This deliberately continues through silence, invalid input and gain0. The existing sun shader is unchanged: `sunPulse` now receives restrained calibrated broad-low sustain (`.2×drive(low)`) plus qualified low accents (`.8×max(bassAccent,subBassAccent)`), with40ms/220ms smoothing. Upper-band/global intensity values do not drive it. Reduced motion suppresses sun pulse. All shaders, authored paths, colors, camera and UI are retained. Six-band ridge response values are prepared and verified, but **visible ridge shading/deformation is not added in LP02**; LP03 connects that new visual behavior. The corona remains LP04.

Canvas uses continuous frame sampling, including reduced motion, so updated music and fade/recovery cannot be stranded in an uninvalidated demand loop. Reduced motion freezes travel, removes accents/sun pulse, and keeps calm scalar sustain updates. This changes reduced-mode rendering duty versus the prior demand loop; measure the final quality/device cost in LP08 rather than claiming it is free. No new render pass, mesh, material, texture, dynamic light or dependency.

**Evidence:** [matched rest](evidence/lavender-peaks/lp02/matched-rest.png), [bass](evidence/lavender-peaks/lp02/bass.png), [mixed](evidence/lavender-peaks/lp02/mixed.png), [silence](evidence/lavender-peaks/lp02/silence.png), [generated video](evidence/lavender-peaks/lp02/generated-baseline.mp4), [assessment](evidence/lavender-peaks/lp02/assessment.json), [capture/checks](evidence/lavender-peaks/lp02/capture.json), [source-time schedule](evidence/lavender-peaks/lp02/generated-schedule.json), [feature/response/uniform trace](evidence/lavender-peaks/lp02/trace.json). Generated WAV reuses the existing deterministic matrix generator; its Nocturne filename is historical, not an owner song or a Nocturne production change. No owner audio captured or inspected.

- Fresh headless Brave/CDP in an isolated production-build copy:1074 samples,428 video frames, fixed camera. Matched rest is pixel-identical to LP01 (all1166400pixels). Whole-period wrap differs at87pixels by at most1channel value, matching LP01 rasterization roundoff. Six drift speeds stay exact through every passage. CPU cadence/periodicity tests cover1000s across all ridges; a new continuous multi-minute visual recording is deferred to LP08.
- Quiet/loud1000Hz MI means .04240/.14133 map to actual scene response means .14227/.35690. High-mid attack response peaks .18183; held high mids beside low-mid attacks produce exactly0high-mid accent. Bass/low-mid high-mid sustained means remain below .000031. Air follows a previous high-mid segment, so its residual high-mid sustain is a release tail (.08134 mean), not new high-mid energy; compare raw input with state and timing, not labels alone.
- Actual sun uniform equals the scene response every recorded frame; bass attack peak .20221. Late silence music levels are exactly0 while drift remains active. All ridge sustained/accent values are response outputs, not claims of visible LP03 material delivery. Perceptibility remains an owner/art checkpoint.
- Internal gain0 clears music while drift continues; stale override fades sun and clears history; reduced motion freezes position/suppresses pulse; Standard/Low and Noctune→Lavender re-entry retain the generated local source and reject retained attacks. These controls/overrides exist only in the temporary copy. No native tab picker, audible output, fullscreen or real-song acceptance is claimed.
-42 test files pass, including13 response scenarios and6 motion/geometry scenarios; typecheck/lint/build pass. Existing >500kB bundle warning remains. Resources remain7calls/4616triangles/7geometries/0textures at1440×810/DPR1. Minified app bundle grows approximately1.96kB (gzip .64kB) from LP01. No final hardware performance assertion.
- Compared with the LP01 source manifest, only App, Lavender scene and motion change, plus new Lavender response; the other88existing source files remain byte-identical, including the prior UI work. Audit scripts/tests/docs/evidence also change. LP01 helper now fails clearly before overwriting evidence when invoked on post-migration source; use LP02 helper for the current checkpoint.

**Next:** Stop at LP02 checkpoint; LP03 six-ridge shading is next after owner continuation. LP04/LP07/LP09 visual gates remain. No commit/push authorized.

## LP03 six-ridge visual checkpoint — 2026-11-23

Owner “proceed” authorizes connecting the validated ridge responses to their existing materials. This supersedes LP02's pending-continuation status, not its unperformed owner listening checks. No shared engine, audio source, other landscape, UI, sun shader, terrain geometry or camera change.

**Implemented visual behavior:** `shading.ts` supplies stable per-ridge palettes and weights. From far→near, bands remain air/presence/highMids/lowMids/bass/subBass. Upper-slope tint strengths are .20/.28/.44/.36/.22/.16; lower-slope darkening is0/0/0/.02/.07/.10. Existing vertical gradients are retained. Sustained tint varies gently with a24-unit horizontal harmonic, while separate event values add a soft stationary localized patch using a second integer harmonic. No travelling light or extra edge geometry yet (LP06). Shapes remain completely fixed. The closest layers have darker lower slopes and slower dynamics; the middle high-mid layer has the strongest restrained upper tint.

Sustained attack seconds are .18/.24/.35/.50/.65/.80; releases .65/.85/1.10/1.30/1.50/1.60. Reduced mode enforces at least .8s/1.5s; accents remain suppressed there. Calibrated drive and own-band event qualification are unchanged. Accent envelope remains .22s with per-layer visual weights .14/.20/.32/.24/.18/.12. Every material receives only its own sustained/accent values. Response/motion runs at negative frame priority-1, material delivery at-.5, leaving automatic rendering enabled. Memoized uniform objects plus material refs avoid render-time state updates and allocations. Version-matched Context7 R3F9.8.2 documentation supports this pattern.

**Visual evidence:** [matched LP02-original / LP03 comparison](evidence/lavender-peaks/lp03/lp02-lp03-comparison.mp4), [paired mixed frame](evidence/lavender-peaks/lp03/comparison-mixed.png), [current generated run](evidence/lavender-peaks/lp03/generated-baseline.mp4), [matched rest](evidence/lavender-peaks/lp03/matched-rest.png), [six-band pixel attribution](evidence/lavender-peaks/lp03/pixel-attribution.json), [capture/checks](evidence/lavender-peaks/lp03/capture.json), [feature→response→uniform assessment](evidence/lavender-peaks/lp03/assessment.json), [trace](evidence/lavender-peaks/lp03/trace.json). The63.8s side-by-side replays identical recorded positions, sun and response on both sides; left zeros the new shading uniforms to reproduce the original LP02 gradients. Generated source soundtrack only; the paused UI reflects replay, not live source playback.428 held-state pairs; maximum source-state mismatch42.5ms, not sample-accurate output recording.

**Actual rendered attribution:** Six controlled scene-reader bands at .15/.5, each in a new session with fixed offsets, change only the assigned visible ridge interior. Pixel masks use the actual sampled authored profiles; exclude3pixel boundaries and UI. Mean absolute RGB-channel changes from each matched original gradient:

| Ridge / band | Quiet pixel delta | Loud pixel delta | Maximum other-ridge pixel delta |
| --- | --- | --- | --- |
| 1 / air | 1.327 | 2.382 | 0 |
| 2 / presence | 2.057 | 3.628 | 0 |
| 3 / high mids | 3.838 | 6.719 | 0 |
| 4 / low mids | 2.193 | 3.847 | 0 |
| 5 / bass | 1.139 | 2.009 | 0 |
| 6 / sub-bass | 1.068 | 1.902 | 0 |

These are8bit display differences, not acoustic sensitivity or proof of human perceptibility. All-band controlled input retains far/middle/near mean display-luma groups187.62/164.48/128.52, preserving depth. Direct scene-contract fixtures test scene attribution; actual PCM playback separately validates MI delivery rather than claiming six perfect acoustic tone-isolation cases.

**Verification and limits:**

-42 test files pass (14 response scenarios,6 motion/geometry scenarios), lint/typecheck/build pass; pre-existing >500kB chunk warning remains. Helpers `verify-lavender-lp03.mjs` and `assess-lavender-lp03.mjs` are verification-only. Fresh headless Brave/CDP temporary production build records1078 live samples/428frames; no runtime or console/shader errors in the validated run. Every recorded actual material uniform equals its assigned response in the same frame.
- Generated quiet/loud high-mid energy .04239/.14129 delivers .14334/.35846 to the high-mid material. Qualified high-mid accent peaks .20867, versus exactly0when low-mid attacks occur beside held high mids. Late-silence musical levels are exactly0; autonomous drift continues. Lifecycle, gain0, reduced, quality and scene re-entry checks remain passing. Rest is pixel-identical to LP01/LP02.
- Active full-period shading wraps in Standard/Low differ at only23/17pixels of1166400, by at most1channel value, matching subpixel roundoff. CPU1000s drift/geometry/cadence checks protect all6profiles. This is not a continuous multi-minute seam-inspection recording; that final matrix stays LP08.
- Draw resources remain7calls/4616triangles/7geometries/0textures. Added only material uniform/color operations and six frame callbacks, no new passes/shadows/lights/dependencies. Bundle increases ~1.81kB minified/.60kB gzip over LP02. Additional fragment math has an unmeasured GPU cost; final hardware/performance remains LP08. Existing reduced-mode sampling policy is unchanged from LP02.
- Initial attempt failed visibly: reserved GLSL identifier `patch` prevented ridge rendering; lint also rejected JSX reading `response.current`. Corrected to `localPatch` and passing the ref itself. Stopped failed process tree; retained [failed attempt record](evidence/lavender-peaks/lp03/failed-initial/failure.json) separately. Added early console and pixel-rest checks, then captured the complete fresh validated run. The failed video is not the accepted evidence.
- Relative to LP02, only Lavender scene and response change plus new shading constants; the other90pre-existing production files, including all MI and other landscapes, remain byte-identical. No commit/push/deploy. Prior uncommitted work preserved.

**Checkpoint:** LP03 is implemented and technically verified; owner visual coherence and live real-song listening are pending. Stop here. LP04 small corona is next after continuation; no corona or environmental light expansion is implemented in this phase.

## LP04 small-corona owner gate — 2026-11-23

Owner “proceed” authorizes LP04 after the LP03 checkpoint. Other landscapes, Music Intelligence, the approved six-ridge materials/dynamics, authored profiles, rightward drift, camera and UI remain unchanged. This phase replaces only the interim sun pulse with the approved small corona; no LP05 illumination is implemented.

**Implementation:** `corona.ts` adds scalar response state, adjustable bounds and a shader function included in the existing sky material. The fixed ivory sun retains center[1.6,1.9], radius .75 and static disc/haze appearance. Three overlapping soft strands use coherent angular harmonics; intrinsic phase advances in seconds and wraps continuously every628.3185s. Shape is deterministic, not per-frame random noise. The hard footprint is1.35×sun radius (1.0125world units), faded over its outer .035units. Wave amplitude .018–.11, resting opacity .16, maximum .46, reduced rest .10; all are scene-local constants. Derivative antialiasing is evaluated before the localized branch. Zero-radius angle is guarded. Background placement behind all six opaque ridges provides natural occlusion; no extra mesh, texture, light, shadow, pass or dependency.

**Signals:** Envelope uses .65bass + .35sub-bass sustained response; detail uses .65highMids + .20presence + .15air. These already-calibrated/gain-scaled ridge responses are not rescaled a second time. Additional smoothing is .3/.9s envelope, .12/.5s detail; reduced mode uses .8/1.5s. Low, qualified high-mid and high accents remain separate, with a capped2.5×scene sensitivity. Mid/treble accents shape localized angular wisps and brightness; low accents gently strengthen the broader edge. Low mids alone retain intrinsic rest; overall intensity is not a corona driver. Retired `sunPulse`/`sunSustained` fields and rigid disk/haze pumping are removed. Session changes clear musical modulation without restarting intrinsic phase; stale/silence releases music; gain0 clears music but preserves rest; reduced mode freezes phase/shape and removes event accents while calm brightness remains responsive.

**Review evidence:** [matched rest/strong detail video](evidence/lavender-peaks/lp04/current/rest-strong-detail.mp4), [matched detail image](evidence/lavender-peaks/lp04/current/rest-strong-detail.png), [full resting view](evidence/lavender-peaks/lp04/current/rest-on.png), [full strong view](evidence/lavender-peaks/lp04/current/strong-on.png), [8s resting full-camera video](evidence/lavender-peaks/lp04/current/rest-fixed-camera.mp4), [8s strong full-camera video](evidence/lavender-peaks/lp04/current/strong-fixed-camera.mp4), [generated music demonstration](evidence/lavender-peaks/lp04/current/generated-music-demo.mp4), [source schedule](evidence/lavender-peaks/lp04/current/generated-schedule.json). Detail views are labeled crops, not camera changes. Rest/strong clips use the same temporary preview phase start (.0500/.0501s), fixed offsets0 and identical viewport/quality. Generated demonstration uses the actual integrated scene/drift and generated PCM through existing MI. No owner audio inspected, recorded or uploaded.

**Verification:** [optical assessment](evidence/lavender-peaks/lp04/current/optical-assessment.json), [signal/uniform summary](evidence/lavender-peaks/lp04/current/assessment.json), [capture/checks](evidence/lavender-peaks/lp04/current/capture.json), [full trace](evidence/lavender-peaks/lp04/current/trace.json).

-43 test files pass, including10corona scenarios,13retained ridge-response scenarios and6motion/geometry scenarios; lint/typecheck/build pass. Existing bundle warning remains. Browser helpers build an isolated production copy; probes/overrides never enter production. No shader/console/runtime errors in the final capture.1065live samples/445frames verify same-frame corona-state→sky-uniform and ridge-state→material delivery. Qualified low/mid/high accent peaks .45546/.49131/.45545; high-mid false accent beside held high mids/low-mid attacks is exactly0. Bass/low-mid high-mid rejection, exact late musical silence with continuing intrinsic rest, stale/gain0, reduced phase/terrain freeze, quality and re-entry checks pass.
-Paired actual pixels at matched state: rest changes1767pixels, strong1936; total RGB difference12194→28099 (2.30×). Observed visible radius ratios1.215/1.281 remain below the1.35bound. No changes outside the allowed raster tolerance, no mountain-interior leaks, no clipped-white pixels across Standard/Low and spectral pairs. Low-mid-only corona equals intrinsic rest exactly. Holding all other values fixed, qualified mid accent changes1655pixels (maximum14channel levels), demonstrating a separately rendered accent above its baseline; human perceptibility/elegance still requires owner review.
-Reference corona-off static composition matches the pre-corona resting scene (≤1channel tolerance). Existing resources stay7calls/4616triangles/7geometries/0textures at1440×810/DPR1, reported ANGLE GTX1660 SUPER. New scalar state/uniform work plus localized three-strand fragment math adds ~3.80kB minified/~1.16kB gzip to the app. Actual incremental GPU/power cost remains unmeasured until LP08; screenshot-run cadence is not a performance certificate.
-Preserved all91other existing production files against LP03 hashes. Production changes are Lavender scene, removal of obsolete sun fields in response, and new corona module. Updated/replaced sun tests, added corona tests and verification helpers, guarded historical LP03 helper, and updated existing docs/evidence. No commit/push/deploy. The earlier interrupted run and held-state accent-fixture correction are recorded in [attempt notes](evidence/lavender-peaks/lp04/attempt-notes.json); fresh complete evidence follows those corrections. The accent fixture had compared later ridge state by mistake; it now holds the exact original state. No scope or engine redesign was needed.

**Stop for owner approval:** Review corona footprint, organic motion, restraint at strong input and distinguishable musical accents. The roadmap requires **“Human visual approval before expanding into the rest of the landscape.”** LP05 sky/slopes/mist illumination must wait. Real-song owner listening, native audio/fullscreen and final quality/device matrix remain pending, not inferred from generated checks or continuation.

## LP05 environmental illumination checkpoint — 2026-11-23

Owner [approves LP04](evidence/lavender-peaks/lp04/owner-review.json) with “aproved” after the corona review and next-phase explanation; “continue” confirms LP05. That approves corona scale/motion, without implying real-song/native/device verification. This checkpoint adds only environmental illumination. LP06 travelling strokes are not implemented.

**One causal source:** `illumination.ts` derives bounded `coronaLight` from the unchanged approved corona: .55 envelope + .30 detail + .35 maximum accent, clamped0–1, with .12s rise/.7s fall. Inputs already include gain. Mist follows it with .45s rise/1.1s fall. Selected ridge glints use delayed positive changes of this same scalar at180/340/500ms, with .025/.22s smoothing. These are visual propagation, not another audio/onset detector. Held levels settle without ongoing glints. Histories are fixed256scalar samples; gain0/session reset clears all lighting/history, stale/reduced suppresses glints, reduced light transitions use .8/1.5s. Recovery holds the oldest known scalar as prehistory, preventing artificial glints when a steady source resumes.

**2D rendering:** Existing sky/ridge shaders perform bounded color mixes; no new meshes, lights, shadows, passes, dependencies or frame-rate React state. Sky wash is localized around[1.6,1.9], excludes the approved core/corona footprint and fades smoothly. Adjacent slope/rim warmth falls with depth and distance. Mist is painted just above selected next-ridge valleys. Delayed glints hug selected silhouettes; no travelling heads/tails yet. The two nearest ridges receive none of this shared spill and retain their own band shading. Foreground/depth hierarchy remains intact.

To anchor light to the sun rather than repeated tiles, materials use actual world x = local x + terrain offset. One shared193×6 RedFormat/FloatType nearest-filter texture stores the exact unchanged1/8-unit profiles, including their repeat endpoints. Two nearest samples interpolate the authored outline; mist samples the next ridge using its own offset. This4632byte data payload avoids extra meshes, per-frame geometry changes or float-linear-extension assumptions. The texture uploads at creation and is disposed on unmount. Approved `corona.ts`, response/shading, profiles, motion, camera, UI, MI and other landscapes are unchanged.

**Review evidence:** [matched spill-off/on image](evidence/lavender-peaks/lp05/current/spill-comparison.png), [detail crop](evidence/lavender-peaks/lp05/current/spill-detail.png), [quiet/active fixed-camera comparison](evidence/lavender-peaks/lp05/current/quiet-active-comparison.mp4), [generated-music demonstration](evidence/lavender-peaks/lp05/current/generated-music-demo.mp4). The spill-off image is a held-state LP04 reference ablation; both sides have identical approved corona, band responses, transforms and clock. Quiet/active clips use controlled source fixtures; detail crops do not change the camera. [Source schedule](evidence/lavender-peaks/lp05/current/generated-schedule.json), [trace](evidence/lavender-peaks/lp05/current/trace.json), [summary](evidence/lavender-peaks/lp05/current/assessment.json), [optical checks](evidence/lavender-peaks/lp05/current/optical-assessment.json), [browser checks](evidence/lavender-peaks/lp05/current/capture.json). No owner media recorded/inspected.

**Verification:**

-44 test files pass, including8 illumination/profile scenarios plus10 corona/13 ridge-response/6 motion scenarios; lint/typecheck/build pass. Existing large-chunk warning remains. The new held-source recovery regression failed before the prehistory correction and passed after; a complete fresh capture follows the fix. [Development notes](evidence/lavender-peaks/lp05/attempt-notes.json) retain that distinction.
-Fresh isolated production-build Brave/CDP:1046live samples/427frames. Every sky/ridge illumination uniform equals the shared response in the same frame, while individual sustained/accent uniforms retain their independent responses. Actual generated low/mid/high corona accent peaks .49119/.49141/.52992; held high mids beside low-mid attacks create0high-mid accents. Scene/quality re-entry, gain0, stale, reduced freeze/glint suppression and active period±24/mixed-offset anchoring pass. Source-time screenshots have up to235ms request brackets, not sample-accurate output capture.
-Actual component pixel changes: sky101782; adjacent-slope layer041445; mist19153 across selected layers0/1; delayed glints8684 across layers1/2/3. No off-source/global exposure, foreground changes, over-wide glints, misplaced mist or clipped-white pixels in the assessed interiors. Protected sky emitter pixels are unchanged in Standard; Low has7single-channel rounding differences only, explicitly within tolerance. Quiet adds0pixels of new spill. Active far/middle/near display-luma means188.58/164.64/128.58 retain depth.
-Recorded first low-event glint peaks occur in order at19.565/19.757/19.864source seconds; these are sampled peak observations, not exact latency guarantees. Late silence has coronaLight0, glints0 and mean mist .000043: a negligible release tail, not persistent illumination. CPU tests verify eventual exact0. The low-mid window immediately after bass still contains the prior bass/mist release; do not mislabel that carryover as low-mid-driven activation.
-Resource counts remain7calls/4616triangles/7geometries; textures0→1. Added fixed4144byte visual-history storage and4632byte texture payload; actual driver allocation/GPU time not certified. Bundle +~4.62kB minified/~1.39kB gzip over LP04. Profile lookup, extra fragment math and reduced-mode duty need final LP08 measurement; draw count alone does not prove unchanged performance.
-Production changes: Lavender scene integration plus new illumination/profile helpers. All93other existing source files match approved LP04 hashes, including corona, MI and other scenes. Updated focused tests, capture/pixel helpers and existing docs/evidence; historical LP04 capture helper now fails early on LP05 to protect approved evidence. No commit/push/deploy; existing uncommitted work preserved.

**Checkpoint:** LP05 implemented and technically verified; stop for visual/music review. Real-song coherence, native/fullscreen, continuous multi-minute/multiple-speed and final hardware matrix remain pending. LP06 travelling ridge illumination is next only after continuation; LP07/LP09 owner gates remain.

## LP06 travelling contour checkpoint — 2026-11-23

Owner “proceed” authorizes LP06 after the LP05 checkpoint. No shared MI, other-landscape, approved corona, LP05 illumination, authored profile, camera, drift or UI change. This phase adds only qualified-event travelling ridge highlights. LP07 choreography remains unstarted.

**Event contract:** The existing scene-local response retains latest accepted sequence/emission-seconds/strength scalars per narrow band, alongside its existing sustained/accent values. These are qualifications of real broad MI events using the already-validated own-band rises; no new analysis/onset system or raw media history. Traces consume each notice once and choose one dominant narrow recipient per broad event. Session/re-entry seeds cursors; stale, gain0 and reduced motion clear strokes and consume old notices. Invalid/future/>250ms-old notices are rejected. Sustained/global intensity alone cannot spawn strokes.

**Budget and appearance:** Three fixed slots globally, at most one per ridge. Busy/full-pool notices are dropped, never queued or used to restart a visible head. Simultaneous accepted starts are at least120ms apart. Strength maps proportionally through a bounded2.5×scene calibration, maximum opacity .45; a70ms attack and220ms end fade frame a bright ivory/rose head and weaker fading tail. Profiles remain static. Role defaults, far→near:

| Recipient | Direction | Nominal delay | Duration | Travel / tail (world units) |
| --- | --- | --- | --- | --- |
| Air / ridge0 | left | .18s | .85s | 5.2 / .75 |
| Presence / ridge1 | right | .18s | .95s | 5.0 / .85 |
| High mids / ridge2 | right | .10s | 1.15s | 5.6 / 1.05 |
| Low mids / ridge3 | left | .10s | 1.25s | 5.6 / 1.10 |
| Bass / ridge4 | right | 0 | 1.40s | 4.0 / 1.25 |
| Sub-bass / ridge5 | left | 0 | 1.50s | 4.5 / 1.35 |

The existing material/profile sampler draws a narrow antialiased contour mask. Head/tail distance is periodic over24units; local phase stays attached to terrain while its offset changes. No new geometry/depth, texture, light, shadow or pass. LP05's shared light stays world/sun-anchored; its stationary delayed glints and the new travelling strokes remain separate.

**Evidence:** [annotated isolated actual-PCM attacks](evidence/lavender-peaks/lp06/current/annotated-attacks-demo.mp4), [full generated-music run](evidence/lavender-peaks/lp06/current/generated-music-demo.mp4), [early/middle/late detail](evidence/lavender-peaks/lp06/current/travel-sequence.png), [controlled high-mid trace](evidence/lavender-peaks/lp06/current/high-mid-trace-on.png), [optical movement/seam report](evidence/lavender-peaks/lp06/current/optical-assessment.json), [signal/material summary](evidence/lavender-peaks/lp06/current/assessment.json), [capture/checks](evidence/lavender-peaks/lp06/current/capture.json), [source schedule](evidence/lavender-peaks/lp06/current/generated-schedule.json). The annotated short clip replays real generated100/1000/8000Hz attacks through existing MI, fixed camera and temporary frozen terrain. The full run keeps normal autonomous drift. Crops are labeled detail views, not camera edits. No owner media captured/inspected.

**Verification:**

-45test files pass, including11trace scenarios plus the existing corona/illumination/response/motion suites; lint/typecheck/build pass. Same reset accepts the first new sequence1, no sustained-only stroke, no stale/re-entry replay, bounded global/recipient counts, strength ordering and direction/lifetime checks. Existing large-chunk warning remains.
-Fresh isolated production-build Brave/CDP capture:1084live samples/461frames;17logical strokes, at most3active; actual recipients4/3/2/0 on the generated matrix. Presence/sub-bass routing is covered by six-band contract unit fixtures, not claimed as six perfect PCM isolations. Every actual trace material uniform matches its active slot in the same frame. Band sustain/accent values remain unchanged. Late silence has no traces; low-mid-only attacks beside held high mids create no high-mid-specific trace. Gain/stale/reduced/Low/re-entry and generated-source identity checks pass.
-Short actual-PCM motion capture has106frames. Low head moves -1.010→2.466world phase, mid -1.255→3.615, high2.476→-2.112 in the expected directions. Capture sampling and screenshot brackets do not establish native playback/performance or sample-accurate output recording; full-run screenshot brackets reach128ms.
-Controlled rendered light centroids move -0.531→.891→2.275world x; head mean pixel difference9.03–9.77 versus tail1.92–2.41. These are RGB differences, not physical emission or owner perceptibility approval. At a visible seam, phases11.86→11.99→-11.88 yield continuous centroids5.721→5.830→5.956, with no tile jump. Equivalent±24translations pass≤1channel difference. Own-ridge/contour/path confinement, no sky/other-ridge changes beyond rounding, Low quality and no clipped-white pixels pass.
-Optical metadata uses authoritative observed per-snapshot uniforms/positions. A reusable seam intent object initially aliased later phases in diagnostic records; render snapshots were correct. Assessment now reads those observations, future intent records are deep-copied, and the distinction is retained in [verification notes](evidence/lavender-peaks/lp06/attempt-notes.json). Low attribution excludes3px boundaries versus2px Standard to avoid antialias edge misclassification. This did not require production art changes.
-Resources remain7calls/4616triangles/7geometries/1shared texture. Fixed three-object pool, six counters, retained scalar notices and four extra uniforms/material; no frame-rate React state or new dependency. Bundle +~3.64kB minified/~1.00kB gzip over LP05. Actual incremental GPU cost stays LP08; screenshot cadence is not an FPS certificate.
-Production changes: scene integration, scalar notices in response, new traces module. All94other existing source files match LP05 hashes, including approved corona and LP05 lighting/profile helpers, MI and other scenes. Tests/helpers/existing docs/evidence updated; historical LP05 capture helper now fails early on the post-trace scene. No commit/push/deploy; existing changes preserved.

**Checkpoint:** LP06 implemented and technically verified. Stop for owner visual/music review; real-song feel, native/device and final multi-minute/multiple-speed checks remain pending. Next is LP07 unified atmosphere/choreography only after continuation, followed by its explicit owner visual gate.

## 4. Implementation process to avoid back-and-forth

- **LP01 is read-only.** After LP01, the agent proposes exact mapping and identifies architectural constraints. Then implement LP02–LP03 in small reviewable steps.
- Hold a visual review **after LP04 (small corona)** to lock corona scale and motion before adding illumination. Another review follows LP07, then LP09 is the final owner gate.
- Keep one authoritative task checklist in existing progress documentation; do not create a new context document after every subphase.
- Every phase completion reports: changed files, source signals, visible difference, automated verification, recorded visual evidence, performance impact if applicable, and anything not verified.
- If a missing Music Intelligence output would require shared-engine changes or a material shift in art direction, stop and ask rather than silently expanding scope.
- **No commits, pushes, or claims of owner approval without explicit authorization.**

## 5. Codex master handoff prompt

> We are reworking ECHO's **Lavender Peaks** into a coordinated, strictly **2D** living mountain landscape. Use the attached `LAVENDER_PEAKS_MUSIC_INTELLIGENCE_ROADMAP.md` as the implementation source of truth, and consult existing `AGENTS.md` / active progress docs. Read the current code rather than assuming historical line numbers or contracts are still accurate.
>
> The scene still consumes legacy `AudioSignal` for shared six-layer travel and sun pulse; migrate **all** Lavender Peaks consumers to the existing read-only Music Intelligence reader without modifying the shared engine or other landscapes. Its scalar view is borrowed and reused. Preserve authored six-ridge geometry, seamless rightward motion, level camera, pastel palette, 2D renderer and scene switching behavior. Apply owner-selected autonomous gentle drift with internal speed constants; no public speed control currently exists.
>
> The approved art direction is a **small, noise-orb-inspired solar corona**: delicate overlapping irregular 2D wisps close to the sun, smooth continuous intrinsic motion, musically modulated deformation, localized event accents, natural occlusion behind mountains. **Do not reproduce the 3D orange wireframe orb.** The corona should softly illuminate nearby sky, mountain edges, valley mist and selected travelling ridge contours. Ensure the illumination feels causally connected to the corona while all six mountain layers maintain independent, restrained frequency roles.
>
> Start with LP01 architecture and baseline audit. Implement LP02–LP09 in order with phase-specific tests and recorded visual evidence. Use real music for visual calibration, plus deterministic controlled traces for signal attribution. Respect stale events/sessions, Reactivity=0, reduced motion, silence, quality and looping seams. Do not overreact, strobe, deform authored geometry aggressively, or make the sky permanently bright. Request visual approval after LP04 and LP07 and before LP09 closeout. Avoid redundant context files and make no commit/push without owner permission.
>
> At each phase, give me a concise status report: actual files changed, exact feature mappings, tests passed, browser evidence, visual differences, performance concerns, and remaining unknowns. Stop for explicit approval if you need to change the shared Music Intelligence engine or the agreed 2D art direction.

