# Technical architecture — POC

## Stack and scope
React + TypeScript + Vite; Web Audio API and standard media APIs; later Three.js, React Three Fiber, Drei; postprocessing only if needed; GSAP only for justified choreography. Do not install 3D packages before rendering tasks. Motion, React Spring, Zustand, backend and other libraries are deferred until a concrete use case warrants them. Use a package manager consistent with the repo (npm by default if empty), commit lockfile if authorized, and verify compatible installed versions. Vitest is proposed for pure signal/adapter logic when needed. No dependencies pinned in this documentation-only package.

## Boundaries
- `src/audio/`: source adapters, capture lifecycle, AudioContext/AnalyserNode, signal processing; independent of UI and rendering.
- `src/engine/`: shared rendering host and scene/audio bridge; avoid speculative extensibility.
- `src/scenes/bloom/`: scene-specific assets and behavior; no direct media APIs. Future scenes may not have props/water.
- `src/components/`: diagnostics and later controls. `public/` for local licensed assets if needed; `tests/` where appropriate. Create folders only as needed.

Current contract (extended in the approved audio-response refinement):
```ts
type BandValues = { bass: number; midrange: number; treble: number };
interface AudioSignal {
  bass: number; midrange: number; treble: number; // aliases of fast bands
  intensity: number; // alias of slow atmosphere
  isPlaying: boolean; // input activity / local playback; not proof of audibility
  levels: BandValues;
  fast: BandValues;
  slow: BandValues;
  transient: BandValues;
  flux: BandValues; // independently calibrated positive spectral-change accent
  sixBands: { subBass: number; bass: number; lowMids: number; highMids: number; presence: number; air: number };
  atmosphere: number;
  updatedAt: number; // performance clock, last feature computation
  updateHz: number; // feature callback cadence, 1-second window
}
```
Audio magnitude/envelope values are normalized to 0..1; timing/cadence fields are metadata. Keep the top-level signal and nested band objects stable; mutate/reset in place. Frame-rate values remain outside React state. Diagnostic snapshots copy nested values only at 5 Hz. A separate render-time callback updates signal-age telemetry without exposing capture objects to scenes.

Expose current signal through a stable ref or imperative getter; use low-rate UI telemetry rather than a state setter per frame. Track connection and permission states separately. Keep native resources out of serializable UI state. Use one active adapter and one active analysis graph. No media content persistence. Start with simple interfaces only as required by the two sources; no plugin framework.

## Tab capture (highest risk)
- Target desktop Chromium browsers, first Chrome on user's Linux machine. Use `navigator.mediaDevices.getDisplayMedia({video: true, audio: true})` invoked directly from a user click, in a secure context (localhost or HTTPS). Browser support varies; permission is interactive and cannot be silently reused. Optional capture hints are not guarantees; avoid relying on them.
- Request the browser tab via the native picker, with share-audio enabled. Video is a required part of this API request, even though ECHO never needs video pixels. Never render, read frames, record or send the video; retain the track only as needed for capture lifecycle, then stop it. Do not claim capture is audio-only at permission level.
- Check the returned audio track(s); if none, stop ALL acquired tracks immediately, show instructions and allow retry. Handle cancellation/denial, unsupported APIs, invalid state and other failures without leaking resources.
- Create/resume AudioContext as appropriate for user gestures/autoplay; use MediaStreamAudioSourceNode → analyser for tab input, with no audible output route (avoid duplicated sound; verify analyser data on target browser). Do not intentionally suppress source playback; if origin audio stops or no samples arrive, show actionable troubleshooting. No attempt to bypass protected media or policy restrictions.
- Disconnect on user action, browser sharing ended (listen to relevant track `ended` events), source replacement, unmount and stale async results. Remove listeners, stop all tracks, disconnect nodes, release/close context when no longer owned, cancel pending loops and reset signals. Ensure repeated connect/disconnect is safe and rapid switching cannot leave an orphan stream. Distinguish silence from missing audio tracks.
- No uploads, analytics of captured sound, MediaRecorder, WebRTC transport, video previews, raw signal logs or storing captured bytes. A browser-native capture indicator may be visible; do not hide it. Test against a local permitted fixture, not an arbitrary commercial streaming service.

## Local input
Use user-selected file with object URL and HTMLAudioElement, media element source → analyser → destination for audible playback exactly once. Handle play/pause/end, invalid format, source switching, object URL revocation and cleanup. A MediaElementAudioSourceNode must not be repeatedly created for the same element. Do not silently reuse a closed AudioContext. Test file permissions and autoplay. No upload. Allow local browser-supported formats (MP3/WAV examples; actual support varies).

## Signal processing
Use AnalyserNode FFT bins, frequency boundaries based on actual sample rate and FFT size, clamp indices to Nyquist. Current owner-requested processing target is 96 kHz with interactive latency; fall back to device default only when that rate is unsupported and report actual rate/fallback. Use FFT 4096 above 48 kHz and 2048 at/below 48 kHz; 96k/4096 preserves the bin spacing/window duration of 48k/2048. Source/capture rate may differ and require resampling; this setting does not imply additional source detail. Convert dB bins to power and integrate each band, then take its square root (L2 spectral magnitude, not calibrated acoustic RMS). Ignore bins at/below -80 dB; preserve unclamped band magnitude until feature normalization. With magnitude m, reference r and sensitivity s, normalized level is `(m*s/r)/(1+m*s/r)`. Fixed per-band references are 0.1, sensitivities bass 4 / mid 3 / treble 3. These are initial visual calibration settings, not rolling AGC or musical labels. `src/audio/features.ts` owns independently timed fast, slow-baseline and positive-change envelopes plus overall atmosphere. See MOTION for timing/mappings. Overall atmosphere uses combined band magnitude rather than the maximum band. Silence should approach zero; teardown resets all objects in place. Feature computation remains requestAnimationFrame-driven, and diagnostics distinguish its cadence from the audio sample rate. Signal age is time since feature computation, not end-to-end capture latency. Test synthetic signals and edge cases; use stable typed buffers, avoid per-frame allocations. Do not implement beat detection or track classification.

### Parallel spectral flux — approved separation refinement, 2026-11-16

`src/audio/flux.ts` computes positive linear-magnitude bin differences before aggregation. Both L1 and L2 raw summaries exist internally for synthetic comparison; the visual path uses L2, reducing linear dependence on the number of rising bins. L2 still depends on spectral distribution. Existing integrated energy, normalization, fast/slow/transient and atmosphere are unchanged. Current bass/mid/treble cutoffs remain 250 Hz / 4 kHz.

Flux accumulates positive L2 increments in a leaky reservoir, `r = r*exp(-dt/release) + increment`, normalizes with `r/(reference+r)`, and applies its own attack/release envelope. Bass/mid/treble references: 0.035/0.03/0.018; attack: 3/3/2 ms; release (reservoir and envelope): 80/70/50 ms. These are provisional visual calibration constants. This avoids direct frame-count gain, but sampled transients and overlapping FFT windows remain cadence-dependent. Resolved synthetic ramp peaks differed ~10% across 30–120 Hz; no native latency improvement is claimed.

One previous magnitude spectrum and scratch changes are overwritten each update; nothing is logged, persisted or transmitted. Source teardown clears history and signal in place. Pause/suspension and gaps >250 ms invalidate history; the next active sample primes without a fabricated attack. Silence decays normally. Pitch migration, vibrato and above-floor noise may excite flux; no beat classifier or adaptive normalization. Diagnostics copy flux at the existing 5 Hz cadence. Visual debug never changes audible playback or live features.

## Scene strategy

L01 added a second scene selected in App. App retains audio controllers and analysis while the visible Canvas changes. L02 passes the shared AudioSignal and Reactivity to Lavender Peaks: its six ridges form back/bass, middle/midrange and front/treble groups. Their periodic terrain moves horizontally using ref-held offsets and speeds, without React frame updates or capture APIs. It renders continuously for live response, switching to demand rendering at zero Reactivity or reduced motion. Both scenes share quality and reactivity settings; scene choice remains in memory only. Reentering Lavender Peaks starts at the authored position.


Current visitor UI (M05, with later local-player refinement) supersedes the M01–M03 layout notes below: App renders one full-viewport experience containing Bloom and a native details/summary chooser, toggled by the Bloom scene label. ECHO is the only other visible landscape label before a local file is selected. AudioControls owns disclosure dismissal/focus; source selection and scene/fullscreen settings remain in the chooser, while a selected local file exposes Play/Pause/Replay and volume in a compact on-scene player. Page overflow is disabled while the panel has bounded internal scrolling. Root adapters and ordinary settings retain their existing lifetimes; closing the chooser does not stop playback. Native fullscreen targets this same container. No developer/query access is implemented.

Diagnostics/debug/performance UI and PerformanceProbe are no longer mounted/imported by the visitor host. Historical utility components/tests remain in source; they are not an alternative interface. Bloom always uses the accepted default combined feature mapping and ambient behavior. The earlier benchmark metadata/invalidations describe historical tooling, not a public feature of M05.

M01 UI arrangement: App owns Reactivity, volume and visual-debug settings (ordinary UI state, not frame-rate data). Bloom receives settings as props and still consumes only the independent signal for audio response. `AudioControls` presents existing adapter callbacks and samples only activity/suspension status at 2 Hz; it does not own or change capture. `BloomDebugControls`, SignalDiagnostics and PerformancePanel sit inside one collapsed development disclosure; their existing feature/motion semantics remain. Existing adapter initialization, teardown and source switching stay in App.

M02: `FullscreenControls` requests fullscreen on App's experience container through a ref, from a user gesture. Browser `fullscreenchange` events own the toggle state; rejected promises and `fullscreenerror` provide status feedback, with listener cleanup on unmount. Fullscreen CSS shares viewport height between Bloom and its control bar, allowing vertical scroll on short screens. Diagnostics live outside that container and are accessed after exit. No source or audio-context recreation is involved. Fullscreen transitions invalidate active performance runs even when viewport dimensions do not change. No prefixed fallback, keyboard interception or new dependency.

M03: App holds a session-only `GraphicsQuality` setting, defined with stable DPR values in `src/engine/quality.ts`. Standard keeps Canvas DPR range [1, 1.5]; Low uses numeric DPR 0.75. Fiber updates drawing resolution on the existing Canvas; scene geometry, camera/framing logic, shaders, antialiasing, animation scheduling and audio remain unchanged. No automatic adaptation or persistence. Selected quality and actual renderer DPR are recorded separately in performance results; selection invalidates an active run immediately, and renderer environment updates also invalidate changed measurements. Pixel-count savings are not hardware FPS guarantees.
One active Canvas, fixed authored camera with optional restrained drift, layered sky and distant mountains, simple 3D halo, reflective plane (approximation acceptable), sparse terrain/particles/fog. Reuse assets and scene primitives only when useful. Reflection choices: cheap mirrored/reflected artwork and geometry first, real planar reflection only if justified. Use limited DPR, optional effects, lightweight textures; avoid complex physics/volumetric simulations. React Three Fiber `useFrame` can mutate mesh/material refs using delta; no React state updates in the hot path. Avoid resource creation per frame; release textures/geometries/render targets when owned/unmounted.

## Targets (not guarantees)
Aim for 60 FPS on a documented reference desktop, low-quality mode near/above 30 FPS, and <10 MB scene assets excluding audio. Record hardware, browser, viewport, DPR, settings and sample duration. No backend dependencies. Exact graphics presets and production architecture decided after POC.

## References
- https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia
- https://developer.mozilla.org/en-US/docs/Web/API/Screen_Capture_API
- https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode
- https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createMediaElementSource
- https://r3f.docs.pmnd.rs/advanced/pitfalls
Consult official/version-matched documentation during implementation. These are reference starting points, not tested claims about the user's machine.

### L03 — six independent frequency energies

`AudioSignal.sixBands` is a stable normalized energy object with subBass/bass/lowMids/highMids/presence/air keys. The same analyser bins feed six half-open ranges: 20–80, 80–250, 250–800, 800–2500, 2500–6000 and 6000–20000 Hz, clipped to Nyquist. `sixBands.ts` precomputes ranges once per input and independently normalizes L2 magnitudes using reference 0.1 and sensitivities 4/4/3/3/4/5. Attack/release values in ms are 5/80, 5/80, 8/100, 8/100, 3/60 and 3/60. These fixed visual calibrations are provisional; there is no AGC or instrument separation. Pause/suspension feeds silence and decays; teardown/source replacement resets all six values in place.

Lavender Peaks L03 uses one ridge per band instead of L02 pairs. Existing three-band energy, flux and Bloom mappings remain intact. FFT size/sample rate/output routing and source adapters are unchanged; finite FFT resolution may spread actual tone energy across adjacent bands, especially near boundaries.

### Shared landscape camera host

All scene Canvases now use `src/engine/LandscapeCanvas.tsx`, which installs the shared bass-driven camera roll by default. Future landscapes use this host to inherit quality, the authored orthographic camera defaults and tilt. A scene can opt out with `cameraTilt={false}`; Lavender Peaks explicitly opts out at the owner's request. Bloom retains the original ±1° camera roll and its independent halo movement. Generic spring math now lives in `src/engine/bassMotion.ts`; the internal comparison variant also lives in engine. Reduced motion, zero Reactivity and disabled camera variants reset the camera/spring. Scenes must not also write camera roll. No audio source or frame-rate React state is introduced.

### C01 — Crimson Horizon

SceneId adds `crimson-horizon` and App selects its independent scene component through the existing chooser. It shares LandscapeCanvas, quality, signal and Reactivity; only the common camera effect consumes audio. Four authored terrain silhouettes and face polygons are declarative Shape geometries; the background shader draws sun and localized glow. No image assets, render targets, frame-rate React updates or scene-specific audio processing. Terrain and sky coverage extend beyond the camera view for bounded roll. Reduced motion/zero Reactivity use demand rendering; artwork stays static.

### C02 — full 3D Crimson Horizon and pointer viewpoint

Crimson Horizon now uses a perspective camera, solid procedural terrain and an emissive shader sphere for the sun. Terrain data is created once per scene mount, with explicit position/normal/color buffers and closed sides/base; declarative geometry/material ownership handles teardown. Static face colors and lighting provide crimson accents without textures or shadow maps.

LandscapeCanvas adds optional `projection` (`orthographic` default, `perspective` for Crimson Horizon) and `camera` props using Fiber's camera type. Other scenes retain previous defaults. A scene-local CameraView updates position/lookAt at frame priority −1; shared camera roll runs afterward. Only this scene handles mouse position. Viewpoint target and smoothing state live in refs, with no frame-rate React updates. Mouse leave/window blur reset the target, touch is ignored, and reduced motion restores the centered camera. Reactivity scales bass roll, not pointer movement; this scene renders continuously for pointer smoothing even at zero Reactivity, using demand rendering only for reduced motion. No capture or analysis changes.

Crimson Horizon visual refinement: terrain now uses continuous height-derived vertex normals/colors instead of flat face shading, with 64×80 top grid cells plus closed side/base triangles (~11,104 terrain triangles). Broad outer ridges and foreground folds add relief. No frame-time geometry work, postprocessing or dependency is added.

### C03 — ridged terrain and custom stylized material

Crimson Horizon now uses original seeded gradient noise and four feedback-weighted ridged multifractal octaves. A quiet valley mask, independent left/right seeds, bounded coordinate warping, broad elevation/depth envelopes and foreground/distant ridge shaping control composition. All height/mask/normal samples use logical world coordinates. The first milestone uses one closed 96×96-cell terrain region (~19,584 triangles); there is no forward travel or chunk lifecycle. Future chunks would require matching boundary geometry, masks and normals, not simply modulo resets.

Geometry emits normals and a vec4 `terrainFeatures` attribute: primary ridge signal, secondary ridge signal, bank mask and highlight selection. Custom ShaderMaterial replaces physical lighting/materials: limited dark directional bands, screen-antialiased selected crimson crests, quiet foreground fold accents and world/distance-based haze. No runtime noise generation or geometry mutation occurs in the frame loop. Terrain stays a real surface with side/base closure; sun remains spherical. Camera height/framing now starts at (0,3.5,24), looking toward (0,4.2,−35), with existing local pointer smoothing. Shared bass camera tilt is opted out only for Crimson Horizon; Reactivity is temporarily disabled for that preview, retaining its value for other scenes.

### C04 — streamed 3D terrain and journey state

C04 replaces the finite C03 region with 48-unit chunks across a 128-unit width (128×64 cells, 16,384 triangles each). A dedicated module worker generates original ridged terrain from logical world coordinates and transfers position/normal/feature/fold typed arrays only. Adjacent chunks share sampled boundary heights, normals and masks; longitudinal caps are omitted. Floor folds vary along the journey instead of fading after the initial view.

`terrainStream.ts` owns one worker and a four-chunk window (current−1 through current+2), rejects stale replies and terminates on failure/unmount. The frame loop reads its safe distance limit and stops before terrain ends, beyond the shader's 108-unit haze cutoff. A loading status or recoverable Retry landscape action handles delays/errors. Declarative geometry ownership releases retired GPU resources. No audio/media data enters the worker.

`journey.ts` keeps band hysteresis, smoothed speed/brightness and logical distance outside React state. `Composition` rebases camera/chunk render coordinates each 48 units, preserving logical sampling without growing GPU coordinates. Sun/glow/sky track forward position and shader uniforms update imperatively. React updates occur for chunk arrivals, window changes and status transitions, not each frame. The camera-relative sky and terrain distance fade share the same nightshade shader color. Custom charcoal/crimson shading remains nonphysical; activity modulates sun and selected illumination. Reduced motion retains rendering for slow brightness changes. Other landscapes and source/analysis contracts are unchanged.

Lavender Peaks shared-response refinement (2026-11-16): ridge motion reads existing overall `AudioSignal.intensity` rather than `sixBands`; six transforms retain their depth speed multipliers and identical smoothing. No analyser change: six-band analysis remains available to Crimson Horizon. Sun pulse still uses its existing bass features.

Lavender high/low refinement: shared ridge drive now multiplies overall intensity by a power-weighted six-band brightness factor (0.25–1). Every mountain receives the same factor; no individual spectral assignment returns. Existing normalized analysis is reused without changes.

## Nocturne N03 lighting preview

App holds an in-memory NocturneLighting value (magenta/cyan/violet, each 0–1) independently of audio Reactivity. Nocturne-only chooser controls change it, with All off/All on presets; switching scenes retains the values. The existing instanced surface batches use independent emissive materials, paired with six local point lights. Other scene/render/audio contracts remain unchanged. Manual preview levels are not audio features; N05 will separately integrate the existing audio contract.

## Nocturne N04 reflection and atmosphere

WetGround uses Three r186’s existing WebGL Reflector addon with one shared planar render target and a custom transparent wet-surface shader. Reflection updates through the scene render, so the actual emissive surfaces, light spill, gate and camera determine the reflected image. Static world-space noise masks uneven puddles and weak wet film; five texture samples soften the view. No new dependency/backend/composer.

The reflection texture uses CSS viewport size × 0.7 (Standard) or × 0.4 (Low), capped at 1024/512 per dimension with a 128 minimum and MSAA disabled. Quality/resize updates the existing target without remounting Canvas; Low still incurs the extra scene geometry pass. Allocate scene/target resources in layout effects and explicitly remove/dispose the target, material and geometry on cleanup, including StrictMode.

Atmosphere attaches scene Fog and adds an emissive gate plus a local additive halo. Manual lighting levels supply a weighted active-color sum; cyan is strongest, with no colored gate/halo contribution at all-off. N05 will separately map existing overall audio intensity; N04 does not change the signal contract or band boundaries.

## Nocturne N05 audio lighting bridge

App keeps a persistent in-memory Audio/Manual mode (Audio default) beside the retained manual levels. Reactivity is enabled for Nocturne Audio and disabled for Manual. No source/analysis contract changes. reactivity.ts updates a scene-local mutable response using existing fast bands, accents, atmosphere and updatedAt/isPlaying lifecycle state.

LightingDriver binds emitter materials, six spill lights, gate material, halo uniform and Fog once per mount. Its negative-priority useFrame callback updates those objects before the camera/main render and planar reflection, with no per-frame React state or geometry changes. Atmosphere now mounts stable dark objects; the driver supplies a fixed cyan-weighted atmospheric color scaled by overall energy in Audio, or the previous isolated color mix in Manual. All-zero output retains faint neutral base architecture.

## MI01 development observability

Separate `/audio-lab.html` supports synthetic fixtures and the owner-approved 2026-11-18 live-tab diagnostics follow-up. `createAnalysis` accepts an optional development diagnostic sink; unchanged callers retain the existing behavior and AudioSignal contract. A DEV-guarded helper reads RMS and copies numeric measurements into its own reusable view. No media buffers or graph nodes reach the lab UI. The main application never supplies a sink, and the helper/lab are excluded from production output. Five-Hz display/history snapshots remain outside React state. Offline tests use existing feature functions at measured audio timestamps; they do not replace production requestAnimationFrame scheduling or introduce a new feature contract. Reproduction, evidence and limitations: [MI01_BASELINE.md](reports/music-intelligence/MI01_BASELINE.md).

The lab source coordinator reuses the existing local-file and tab-capture adapters without altering them. Source changes stop the previous adapter before starting another, preserving native user activation and the existing late-request guards. Tab capture has no destination output. Live numeric diagnostics/history remain in memory and are reset across source teardown; tab/pending capture disables exports at both UI and handler level. Exports contain only separately generated synthetic baseline aggregates. No user-file diagnostic input, capture-content persistence, video inspection, provider integration or production diagnostic entry is introduced.

## MI02a development energy comparison

The DEV-only diagnostic view includes separate reusable estimated RMS/linear/soft-knee values for broad/six bands. A cached meter uses actual rate/FFT ranges, integrates one-sided bin power and compensates the specified Blackman window; it is a stationary RMS estimate, not transient/perceptual loudness. Both curves have fixed reference RMS 0.5, no adaptive gain/history and no writes to AudioSignal. Reset clears candidate storage in place; rate/FFT changes rebuild cached ranges. The lab can display these estimates from live tab input without exporting it; the separate synthetic suite exports only generated aggregate evidence. No candidate is consumed by landscapes or bundled into production. Formula, working range and measured acceptance: MI02A_ENERGY.md.

## MI02b development range experiment

The diagnostic observer owns a separate adaptive-scaling instance/view. It reads measured full time-domain RMS, uses a single bounded elapsed-time gain and applies that gain only to copies of MI02a band estimates for comparison. A 2 s startup hold and −50 dBFS eligibility floor prevent immediate/noise amplification; the floor changes gain target, not signal energy. Inactivity/discontinuity/source/format resets clear gain/history; controls/plots reset without changing the stable AudioSignal contract. No state flows back into audio nodes or landscapes. New long synthetic range/noise fixtures and aggregate reports are a separate dev suite; live export remains locked and production output unchanged. Parameters, limits and outcomes: MI02B_RANGE.md.

## MI03 development onset events

The existing DEV diagnostic observer privately computes per-band positive spectral novelty and a bounded timestamped robust threshold history from the same analyser FFT. Immutable events carry session/sequence, low/mid/high band, observed peak and emission clocks, and strength derived from unsaturated calibrated rise. At most 256 events from 10 seconds remain in the live numeric view; no spectra/media leave it. Reset/inactivity/format/gap and DEV local seeking/seeked clear the detector without changing legacy AudioSignal/adapters. Seek suppresses detector priming until a full FFT window clears old content. Production callers remain unchanged and detector code is eliminated from production assets. Synthetic comparison uses the same implementation; exports never include live histories. The first core gate fails release attribution; see MI03_RESULTS.md. No production MusicFeatures API or scene event consumer is installed yet.
MI04 development context (2026-11-20): the existing diagnostic observer feeds shared FFT/calibrated RMS/accepted events to context.ts. Its reused numeric view holds slow intensity/brightness/activity and raw validity/rates; a fixed 256-entry timestamp/strength ring deduplicates session/sequence and expires after four seconds. No production AudioSignal/scene/capture contract is promoted. The initial numerical activity cadence gate fails; MI04_RESULTS.md retains evidence and the separately gated follow-up.
MI04 approved onset follow-up (2026-11-20): DEV-only onsets retain a pre-rise baseline and one pending scalar observation per band for 40 ms after the novelty peak. They qualify maximum RMS/contribution before immutable emission and publish simultaneously matured bands in peak-time order. Actual emission clocks include the wait; original 100/150 ms targets remain. No added FFT history, backend or production contract. Synthetic MI03/MI04 now pass; owner/G1 review remains pending (MI04_WINDOW_RESULTS.md).
G1 DEV review (2026-11-20): the lab renderer reads the existing shared snapshot at frame cadence, retaining only fixed band counts/last-event display state and a session/sequence cursor. Presentation switches never restart audio or alter gain/features. The DEV source coordinator adds `file` alongside generated `fixture` and `tab`, reusing unchanged adapters; file/tab modes block synthetic exports. No new production interface/scene/backend is introduced. G1_REVIEW.md holds manual approval status.

MI05 pilot: `audio/musicFeatures.ts` defines a source-independent versioned readonly borrowed view and separate producer capability. The DEV lab bridge publishes validated fixed energy/onset/context scalars once per existing observer tick; no DSP moves into scenes. Each Crimson consumer primes a session/sequence cursor, consumes hidden events and rejects >250 ms stale input. Optional pilot props select bounded target blending inside one journey integrator, preserving terrain ownership/distance. Public App supplies no reader and remains Legacy. The lazy lab preview and generated-only verification harness are absent from production entry paths; optional scene/controller/uniform code may remain in the shared production bundle. See MI05_RESULTS.md for the preserved uncommitted 40% Legacy sun baseline and current evidence limits.

MI05 accepted rollout (2026-11-21) supersedes the pilot-only boundary above: App creates one analysis with `musicIntelligence: true`. `audio/music/{energy,onsets,context}.ts` now holds the unchanged validated algorithms; DEV paths re-export them. `audio/music/analysis.ts` publishes the versioned reader from the existing FFT/clock, with source/seek/stop/format/gap lifecycle. Public Crimson consumes Candidate; other worlds retain AudioSignal mappings. DEV lab observer/public feature producer are separate entry configurations, each computing the shared algorithms once in its current path. No additional analyser/time-domain read/audio scheduler, public diagnostic UI or adaptive experiment. Lab and synthetic harness stay outside production; validated DSP is intentionally included now.

Crimson vertex pass (2026-11-21): Candidate's controller adds a bounded scalar terrain amplitude/phase; existing chunk materials receive those plus bounded logical wave-origin phases derived once from their indices. `deformation.ts` contains the ≤0.08 vertical field, its exact gradient/Jacobian normal correction and once-per-chunk bounds padding. Render-frame work changes uniforms only, preserving terrain/normal buffers, worker, stream/rebase and draw-call/pass ownership. Corridor/near/high/distant masks protect composition. No changes to audio features or other scene mappings. Detailed checks and owner review status are in MI05_VERTEX.md.

Owner-approved vertex visibility correction (2026-11-21) raises Crimson's shared displacement/bounds cap from0.08 to0.32 and curves scene drive with exponent0.7 before linear Reactivity. Logical coordinates, shader/normal formulas, masked regions, worker/stream and render passes are unchanged. Old0.08 timing/screenshots remain historical; current evidence is in MI05_VERTEX.md.

Crimson contour replacement (2026-11-21) supersedes the vertex notes above: owner reverted all terrain deformation. `contours.ts` now reads only fixed six-band lowMids/highMids for gradual illumination/brief travelling heads; own-high-mid scene qualification never alters the audio/onset engine. Positions/normals/culling are authored again. Logical per-chunk contour origins keep streaks continuous; fragment emission is independent of sun activity and added after haze. Other accepted sun/travel/atmosphere mappings and worlds remain unchanged. See CRIMSON_CONTOURS.md/current evidence; old deformation docs/results are historical only.

VM02 refinement (2026-11-21): production work is confined to scene-local contour emission/controller parameters and fragment masks/halos/head/trail; no vertex/normal, MI, sun/camera/journey or worker changes. Generated-only `src/dev/mi05/vm02Review.ts` creates known PCM for the unchanged analysis pipeline and records only its own labelled canvas surface. Fixture inspection can pin the test pose; production camera code remains untouched. Recording/stationary controls and MediaRecorder are excluded from production. VM02_REVIEW.md contains preservation hashes, pixel coverage/brightness, stationary tests and recording; state remains IMPLEMENTED — AWAITING REVIEW.

Owner-requested halo follow-up (2026-11-21): `musicPilot.glowActivity` maps existing context.activity into the dedicated glow material uniform, smoothly blended with Legacy halo drive through the existing profile weight. No new feature, source, analyser, shader pass or geometry. The sun-body and contour channels remain separate; public sun/camera transforms and pending owner scale edits are preserved. VM02's earlier preservation hashes/recording describe their original build; this explicit follow-up changes halo emission only.

Current Crimson travel override (2026-11-22): the single journey integrator advances at fixed24 units/second independently of shared music features/Reactivity. Reduced-motion and loaded-window guards still freeze safely. Scene audio reader continues driving visual mappings; no source/DSP contract change. See CRIMSON_CONSTANT_TRAVEL.md.

Crimson terrain resource ownership (VP05,2026-11-22): TerrainChunk memoizes a BufferGeometry with the original position/normal/feature/fold attributes, attaches it as a primitive and explicitly disposes it on cleanup. Keep attributes attached until disposal: R3F JSX attribute removal before deferred geometry cleanup otherwise prevents Three releasing their GPU buffers. No authored geometry/rendering/DSP change. Production rolling-chunk verification counts actual live GPU buffers in addition to geometry counts.

## Nocturne NT02 — Music Intelligence only

Supersedes the historical N05 legacy bridge above for Nocturne. App passes the existing MusicFeatureReader into NocturneScene/LightingDriver; the scene no longer accepts AudioSignal. `reactivity.ts` consumes calibrated broad energy, discrete matching onset events and context intensity. `cyanPanel.ts` retains the independent high-mid curve/qualified event and now samples scalar history once per feature frame. Both consume suppressed events during Manual/zero/reduced states; sessions skip retained events. Numeric visual state stays outside React.

LandscapeCanvas requires signal only for enabled camera tilt; Nocturne uses its explicitly disabled branch without a legacy prop. Shared audio controls use MI freshness/energy for Nocturne receiving/silent feedback while adapter states retain connection/playback ownership. Other landscapes and shared analysis remain intact. [Exact mappings and NT02 evidence](reports/nocturne/NT02_INTEGRATION.md); NT03/NT04 remain pending.

## Nocturne NT03 — unified visual state

LightingDriver owns one NocturneVisualState. Its update reads the MusicFeatureReader once, synchronously gives the borrowed view to broad/panel controllers, and publishes reusable named fixture envelopes (sustain target, event accent, final level), derived reflection-source values and final atmosphere color weights. Controllers retain only bounded numeric history and temporal cursors. The renderer adapter writes final emissive/point values and the driver copies colors to the existing gate/halo/fog; no component interprets feature bands or preview mode.

Logical main/secondary magenta, original cyan and bridge outputs preserve the NT02 curves and existing material batching. Later artistic phases own material separation/choreography. [NT03 contract and evidence](reports/nocturne/NT03_VISUAL_STATE.md). No shared analysis, camera, geometry, capture or quality change.

## Nocturne NT05 — independent magenta material groups

The unified visual update passes its borrowed MI frame to magenta.ts. Bass/subBass sustain two separate body envelopes; fresh low onsets drive one finite main pulse with a scalar carried tail that prevents overlap notches. No detector, FFT or event-history pool is added. Main/secondary/bridge emitters are separate material batches with identical original instance transforms. Existing near spill binds to main and bridge spill retains its old broad response. Other channels, atmospheric weights and the physical planar reflection path are unchanged. [NT05 parameters/evidence](reports/nocturne/NT05_MAGENTA_REVIEW.md).

## Nocturne NT06 — independent architectural cyan

The same borrowed MI frame updates midrange.ts: a low/high-mid window envelope and a quicker low-mid small-panel body/qualified event accent. Its 64-slot scalar low-mid history does not read raw media. Approved cyanPanel.ts and magenta.ts remain unchanged. The original cyan batch is split into 336 windows and 6 small panels with identical instance transforms/material properties; final window/small-panel outputs bind to the existing 65/40 point lights. No shared audio contract, source, camera or reflection-pass change. [NT06 mapping/evidence](reports/nocturne/NT06_MIDRANGE_REVIEW.md).


## Nocturne NT07 — finite bridge sections

The single borrowed MI frame also updates bridge.ts: one bounded low-onset sequence over six reusable scalar section levels, no continuous phase or event queue. Contiguous thirds retain the two existing bridge diffuser footprints; six materials provide localized brightness with the existing point light driven by their mean. Manual fills sections uniformly; reduced/stale/zero/session guards suppress travel without replay. No additional lights, shadows, React state or shared analysis. [Parameters/evidence](reports/nocturne/NT07_BRIDGE_REVIEW.md).


## Nocturne NT08 — localized violet banks

The unified borrowed-frame update also calls violet.ts. Existing presence/air supply a restrained shared body; accepted high events alternate between two bounded bank envelopes with a400 ms global cooldown. The twelve unchanged strips are six right/six left instances in two materials; existing near/far points bind to their own final bank levels. Manual sets both uniformly, reduced motion keeps only slow sustain, and suppressed events are consumed without replay. No MI, geometry, camera, global atmosphere, reflection pass or other fixture-controller changes. [NT08 evidence](reports/nocturne/NT08_VIOLET_REVIEW.md).


## Nocturne NT09 — existing surfaces retained

Surface verification confirms the existing Reflector renders the scene after final fixture material/point values are applied at priority-1. `state.reflections` is derived source metadata, not another shader multiplier. Wetness/Fresnel/spread/UV breakup remain static; the floor has no audio/time uniforms. Existing roughness/bump wall materials receive the existing local point lights. Isolated on/off, reflection-disabled and spill-disabled diagnostics establish local contributions at both qualities; four actual built-production cyan/off images match diagnostics exactly. All production source is unchanged. [NT09 assessment](reports/nocturne/NT09_SURFACE_REVIEW.md).


## Nocturne NT10 — slow context atmosphere

The single borrowed feature frame also updates atmosphereResponse.ts. Existing intensity controls capped glow, intensity-weighted activity controls density, and valid spectral brightness controls a small signed palette balance. Final state supplies gate/haze weights plus fogNear17 and fogFar66–74; LightingDriver delivers those existing parameters before reflection/render. Multi-second envelopes are bounded, slower under reduced motion, released when inactive/stale, reset on sessions and cleared by zero/Manual. Manual weights/fog remain exact. Broad helper atmosphere is retained internally but no longer drives Audio rendering. All fixture outputs, geometry, floor/wall materials and shared DSP stay unchanged. [NT10 parameters/evidence](reports/nocturne/NT10_ATMOSPHERE_REVIEW.md).


## Nocturne NT11 — existing coordination policy retained

Staged whole-scene assessment retains existing per-controller caps, localized accents and independent sustained envelopes, with NT10's slow context atmosphere. No scene-wide limiter or extra shared energy multiplier is added; material/point delivery remains exactly from associated final outputs. All90 source files match task-start NT10. [NT11 review](reports/nocturne/NT11_COORDINATION_REVIEW.md) separates technical delivery evidence from required owner artistic approval.


## Nocturne NT12 — verified analysis/scene contract

Three evidence layers now verify the existing interface: explicit MusicFeatures inputs for deterministic response/lifecycle guards; prescribed synthetic spectra through unchanged createMusicAnalysis for calibrated band routing; generated PCM through the actual browser analyser for delivered material/point values and original UI controls. No production code changed. One borrowed feature read per scene update and no mutation are checked by the unified matrix. [Expected/observed NT12 report](reports/nocturne/NT12_MATRIX_REVIEW.md) separates these proofs from native/audio-device/real-song acceptance.


## Nocturne NT13 — separate final point spill

Owner-approved Audio readability correction adds a stable spill record to the unified visual state. Derive bounded final point values from each fixture's own level (main1.5, windows/details2, others1; Manual1), then the renderer adapter multiplies by original point full intensity. Emission/reflection-source levels and all controllers stay unchanged. No response logic moves into LightingDriver; no new light/pass/material or audio dependency. [Applied verification](reports/nocturne/NT13_SPILL_IMPLEMENTATION.md).

## Public controls update — 2026-11-23

Owner's direct-controls request supersedes the earlier M05 layout: each scene shows its own name at the top left; a shared bottom toolbar exposes `#scene-select`, Share a tab and Open audio file outside `details.audio-chooser`. The summary is now Options, containing status, disconnect/cancel, quality and Nocturne's existing Audio/Manual preview. Local player/volume remains outside the panel. The toolbar/player wrap together on smaller viewports; open mobile Options temporarily hides the player as before. Pointer dismissal leaves focus on the clicked action; Escape/Close restore Options focus, disconnect restores the external source control.

App no longer mounts FullscreenControls or owns adjustable Reactivity state: scene inputs retain the existing constant1 default. The historical fullscreen utility and scene Reactivity contracts remain in source; no shared analysis/render response rewrite. Source adapters and source lifetime stay unchanged across scene/quality selection. Scene edits are label text only, plus updated Bloom fallback copy; geometry/cameras/materials are unchanged. Lavender's light-background Options color rule now targets the new wrapper.


## Lavender Peaks LP01 audit — 2026-11-23

The current runtime remains legacy: App passes `analysis.signal`; all six ridge offsets consume the same overall-intensity × six-band spectral-balance drive, with depth speed limits .15/.25/.45/.65/.9/1.2. Sun pulse alone consumes broad bass fast/transient/flux. The current shared-response refinements supersede historical L02/L03 independent mappings above. Ridge geometry and gradients are static; the level orthographic R3F scene uses seven opaque shader meshes, not physical lighting. Shared camera tilt is disabled.

The [Lavender roadmap audit](LAVENDER_PEAKS_MUSIC_INTELLIGENCE_ROADMAP.md#lp01-audit-and-proposed-migration--2026-11-23) documents the complete inventory, baseline and proposed reader-only migration. Music Intelligence is already enabled centrally, but not consumed by Lavender. `MusicFeatureReader.read()` returns a borrowed reused view, not an immutable snapshot; histories must copy bounded scalars. The host already accepts no AudioSignal with `cameraTilt={false}`, so no shared-host change is required. Proposed independent shading/qualified contour accents and autonomous drift are not implemented or approved through this audit. All91 production source hashes are unchanged.


## Lavender Peaks LP02 — reader-only integration (2026-11-23)

Owner continuation approves the LP01 design. This supersedes the current-runtime legacy description above: App passes only `musicFeatures`; `response.ts` owns bounded six-band scalar histories, independent sustained levels and qualified broad onset accents with session/freshness/sequence guards. No `AudioSignal` reaches Lavender or its disabled camera tilt. Fixed autonomous drift replaces all audio-driven speeds; silence/gain0 retain movement, reduced motion freezes it. Existing sun shader receives calibrated low sustain plus qualified low attacks. The original gradients/geometry/camera remain unchanged; visible ridge shading is LP03, procedural corona LP04.

Continuous frame sampling (including reduced mode) allows incoming scalar response/fades without a new invalidation scheduler. Reduced mode suppresses travel/accents/sun pulse, retaining calm sustained values. History storage is6656typed bytes, no per-frame React state or new renderer resources. The [LP02 checkpoint](LAVENDER_PEAKS_MUSIC_INTELLIGENCE_ROADMAP.md#lp02-migration-checkpoint--2026-11-23) distinguishes verified numeric response from future visible ridge delivery and pending hardware/music acceptance. Other landscapes and shared analysis are unchanged.


## Lavender Peaks LP03 — independent ridge shading (2026-11-23)

Owner continuation authorizes LP03. Each existing ridge material now receives only its assigned scene response's `sustained`/`accent` uniforms. Stable memoized uniforms/material refs are updated in frame callbacks: response/motion at priority-1, material delivery at-.5, automatic rendering retained. Context7 R3F9.8.2 objects/hooks documentation confirms ref uniform mutation and negative callback ordering. No frame-rate React state, new geometries, lights, passes, textures or engine changes.

`shading.ts` defines per-layer pastel tint/upper strength, restrained lower-slope weighting, stationary accent masks and attack/release settings. Upper tint follows the existing vertical gradient plus a smooth24-unit periodic horizontal variation; the brief accent is a bounded soft patch with a different integer harmonic. All spatial fields repeat with authored terrain. Geometry and normals remain static; no travelling contour or corona is added early. Foreground responses are slower and retain darker lower slopes. Zero musical values restore the exact base gradient. The LP03 checkpoint in the authoritative Lavender roadmap contains rendered attribution and review status; owner music/visual approval is separate from controlled tests.


## Lavender Peaks LP04 — bounded 2D corona (2026-11-23)

The existing sky ShaderMaterial now draws the pale fixed-size sun plus three coherent wavy strands. `corona.ts` owns adjustable bounds and a separate scene-local state: integrated intrinsic phase, smoothed low-band envelope, high-mid/upper-band detail, and low/qualified-high-mid/high accents from existing ridge responses. No new analyzer, media access, geometry, lights, passes, textures or frame-rate React state. The obsolete intermediate sunPulse/sunSustained path is removed from response.ts; ridge qualification/shading/dynamics remain intact.

Core radius and sun center remain .75/[1.6,1.9]; strand influence is clipped/faded within1.65×core radius after the owner-approved corona refinement (initial LP04 bound1.35). Strand base radii are1.15×initial placement; musical wave deformation3× and localized accent displacement1.8×, capped at.22 wave amplitude. Core, opacity and response timing are unchanged. Existing static sky wash/haze stays unchanged; rigid musical scaling and haze pumping are removed. Antialiasing uses fwidth before the localized branch (Three r186 official shader example checked through Context7). Opaque ridge meshes naturally occlude the sky effect. Harmonic edge functions are deterministic/angle-periodic; all phase coefficients are hundredths, allowing a continuous628.3185s intrinsic-clock wrap. Zero gain retains intrinsic rest, stale input releases modulation, sessions clear old modulation without resetting phase, reduced motion freezes phase/shape and suppresses event accents while brightness may follow calm smoothing. Environmental illumination stays LP05.


## Lavender Peaks LP05 — shared corona illumination (2026-11-23)

Owner approves LP04 (“aproved”) and continues LP05. `illumination.ts` derives one bounded coronaLight from the approved corona envelope/detail/accents; it never reads audio or creates new MI events. Sky wash, nearby slope/rim tint, painted valley mist and delayed stationary contour glints share that response. Glints visualize delayed positive changes of the shared light (180/340/500ms), not instrument/beat claims or travelling heads. Unknown prehistory holds the oldest known level so stale recovery cannot manufacture a rise. Histories are bounded256scalar samples; reduced/stale disables glints; gain0/session reset clears source/history state.

World-space masks use local fragment x plus each ridge's actual transform, anchoring the source at the existing sun. A single shared193×6 R32F nearest-filter DataTexture stores the unchanged1/8-unit authored height samples including the repeated endpoint (4632bytes). Two nearest fetches interpolate each silhouette exactly; no float-linear extension or per-frame texture upload is needed. Mist samples the next ridge's transformed profile to remain in visible valleys. Existing geometry remains unchanged. The texture is disposed on unmount. Only first4ridges accept spill; the2nearest retain their independent dark band shading. Sky wash excludes the approved corona/core footprint; corona.ts is unchanged. Existing7draw calls remain; texture count increases0→1.


## Lavender Peaks LP06 — qualified travelling contour traces (2026-11-23)

Owner continuation authorizes LP06. Existing ridge qualification now retains only three additional scalar notice fields per band: latest accepted sequence, emission time in seconds, and gain-scaled strength. No MI/publication contract or analysis changes; no borrowed event/view references retained. `traces.ts` consumes those notices once, chooses the strongest qualified narrow recipient per broad event, and maintains a fixed3object pool with at most1trace/ridge. Busy/full-pool events are consumed and dropped rather than queued or restarting visible strokes. Starts are staggered by at least120ms; role-specific delays/durations/directions remain bounded.

Each existing material receives head phase, opacity, direction and tail length. The shader reuses the LP05 profile texture; a narrow Gaussian around the authored contour bounds the pastel head/fading tail. Periodic local x prevents discontinuities when either terrain offsets or stroke phases wrap. Stroke placement starts in world coordinates, then stays attached to the moving authored terrain; it is distinct from LP05's sun-anchored environmental light. No new geometry/material/texture/light/pass or per-frame React state. Lifetimes use the same performance-second clock as MI notices; stale/gain0/reduced/session/re-entry guards discard old notices. Approved corona and LP05 illumination source remain byte-identical.


### Owner-requested sun pulse restoration — 2026-11-23

The sun disk/haze now independently uses `sunPulse.ts`: clamped .2×max(bass,subBass target)+.8×max(qualified low accents), smoothed40ms/220ms. Targets already contain gain; freshness releases, gain0/reduced clears, session changes reset. No second MI read or legacy audio consumer. Original disk radius/brightness/haze equations restored. Corona receives the unscaled sun distance and remains unchanged; environmental lighting still derives solely from existing corona state. This supersedes earlier fixed-disk requirements only.


## Lavender Peaks LP07 — slow atmosphere (2026-11-23)

`updateLavenderResponse` copies intensity/activity/brightness/validity scalars during its one borrowed MI read; no publication is retained or second read added. New `atmosphere.ts` owns two bounded smoothed scalars: density=(.65×drive(intensity)+.35×activity)×gain, warmth=drive(intensity)×validBrightness×gain, where drive(x)=x/(x+.25). Attack/release2/4s, reduced4/6s; stale/inactive releases, session/gain0 clears. Context has no event/phase/phrase role.

Same negative-priority driver updates atmosphere; existing sky and six ridge materials receive its values at-.5 before render. Sky blends are excluded around the emitter; far softness/valley bands and near lower-slope contrast are restrained. Far3ridges reuse the existing profile texture with2additional nearest samples; no new geometry/passes/textures/lights. Existing band uniforms and corona/sun/illumination/traces modules remain unchanged. Trace opacity alone scales by1-.25density for busy context, after existing bounded event/slot logic. Existing short/medium/slow dynamics remain separate. No new context-driven motion or per-frame React state.


## Lavender focused organic-corona refinement — 2026-11-23

`corona.ts` now derives bass envelope from existing gain-scaled ridge targets, not their sustained slow envelopes: clamp((.65bassTarget+.35subBassTarget)/.45), smoothed80/450ms. Existing high-mid/upper detail mapping remains. Deterministic2D periodic value noise uses quintic interpolation,2angular octaves/strand and3different strand scales/seeds/amplitudes. Temporal lattice period256 and angular advection.2rad/s join the existing628.3185s clock wrap. The noise hash is a fixed lattice field, never per-frame randomness. Analytic angular slope adjusts line width using pre-branch radial fwidth; no derivative call inside the localized branch.

Bass/sub-bass qualified notices are consumed once in sequence order, with duplicate broad-low notices merged by maximum strength. Strength/reference.22 controls650ms lobes sweeping1.4rad over the upper arc;40ms attack, quadratic decay. Fixed3slots, oldest replaced when full. Session/gain/stale/reduced seed cursors and clear accents; age guard rejects old/future notices. Six floats update the existing sky material's vec2[3] uniform without frame-rate allocations. Pulses sum through a bounded soft limiter.

Wave amplitude begins at.018+.202envelope+.045detail, capped.22. Radial offsets compress smoothly between core+.025 and outer limit-.045; no strand-center scaling. The1.65×.75 hard influence limit remains. Existing envelope/detail/lobe fields feed unchanged LP05 illumination code and delayed history. Core distance is now unscaled; existing sunPulse controls only disk/haze brightness. Ridge motion/geometry, atmospheric mappings and other landscapes are unchanged.


Owner sun adjustment (2026-11-23): sun disk/haze radius now scales by1+.08sunPulse for a gentle independent bass pulse. This supersedes the fixed-size core from the focused noise refinement. Existing sun brightness/timing remain; corona still uses unscaled sunDistance and its procedural mapping is unchanged.


Owner visibility adjustment (2026-11-23): sun disk/haze size is now1+.24sunPulse, replacing the preceding gentle.08coefficient. All pulse timing/brightness and procedural corona mappings remain unchanged.


## Bloom BL02 — static bounded 3D mountain banks (2026-11-23)

`scenes/bloom/mountains.ts` constructs two indexed closed solids across x±20/z−8…2 using authored silhouette cross-sections, smooth depth interpolation, broad fixed folds and tapered inner shores. Bottoms close at y−12. Standard64×15/Low32×7cells per bank yield4788/1364terrain triangles including walls/bottom fans. Normals and color attributes are computed once; matte MeshStandardMaterial uses existing lights. Scene fog #81769E at22…31camera-distance adds depth; halo is nearer than fog start, and custom sky/water shaders remain unaffected.

Bloom memoizes geometry by side/quality, attaches it as a primitive and explicitly disposes it on replacement/unmount. No per-frame terrain changes, shadows, textures/assets, extra render passes or frame-rate React state. Shared host/camera projection/zoom stay unchanged; only Bloom sets cameraTilt=false. Public props, AudioSignal response, hero and lake shaders remain; MI migration is BL06. Other landscapes and shared analysis are untouched.


Bloom BL02 shape refinement (2026-11-23): authored profile knots now join through monotone cubic Hermite tangents; broad fixed spurs and a small depth-dependent warp separate connected shoulders. The shoreline has two stages: buried inner closure to shallow submerged toe, then a gradual rise to the mountain body. Foreground toe descends behind the existing water plane. These calculations run during geometry creation only; mesh topology, LOD, materials, static lighting, fog, camera and all audio mappings remain unchanged.


Bloom BL02 remaining mountain refinements (2026-11-23): static depth color transitions hold a cooler distant band before blending to darker middle/foreground. Broad baked face tones follow computed normals, low-frequency position variation and bounded convex-crest tint; existing matte MeshStandardMaterial and lights remain unchanged. Inner shoulder height features and one authored right crest provide readable landforms within portrait x±3.4 using identical world geometry at every aspect ratio. No camera/resize-dependent terrain, textures, new uniforms, shader pass or per-frame color work; existing buffers/topology/LOD/disposal stay intact.


Bloom BL02 stronger range sculpting (2026-11-23): middle and near authored profiles now place crests away from distant peaks for real overlap. A bounded diagonal drainage field subtracts up to.42world units from selected middle slopes; baked face/cavity tones emphasize connected relief. The distant-to-middle vertex color transition happens earlier in depth. All calculations remain geometry-creation work; topology, shaders/materials, rendering resources and frame updates are unchanged.


## Bloom BL03 — static monolith and authored lake image (2026-11-23)

`monolith.ts` owns the resting pose/dimensions/seam and computes yawed orthographic x bounds, visible front/side boundary, seam x and vertically mirrored/compressed lake extents relative to waterY−.02. The scene renders one rough nonmetallic body box, dark seam border and narrow pastel seam (3draws). No motion/controller/geometry updates on the hero yet.

Water consumes this same projection as fixed uniforms; its analytic body silhouette and seam reflection fade with depth, receive mild time-driven horizontal distortion and surface breakup, plus tiny ellipses under the projection anchor. No render target, shadow or extra reflection geometry. Ring uniforms/equations, torus geometry, fragment pivots, bass-motion imports and frame mutations are removed from BloomScene. Existing legacy response still drives only sky/base water pending BL06. Camera/mountain geometry/lighting are preserved. Reduced motion freezes water phase; quality/source changes preserve static hero and source identity.


BL03 beam refinement (2026-11-23): the former black border plane now renders a.34world-wide local additive falloff at the seam. The narrow core uses the same shader with a sharper luminous center; both planes feather vertically and have depthWrite=false with normal depth testing. Bounds/pose unchanged, still3hero draws. Corresponding analytic reflection glow widens gently. No fullscreen bloom, render target, real light or runtime state is added.


## Bloom BL04 — shared autonomous aurora (2026-11-23)

`aurora.ts` owns one bounded autonomous time/strength/hue state and reusable world-space curtain field. Shader fold count is2Standard/1Low via uniforms, in existing sky/water materials; no new geometry/passes/textures. Mint/rose ribbons have coherent low-frequency base motion and soft fine folds. The lake reuses mirrored/compressed world coordinates and the same clock/color/strength, behind the monolith reflection.

Existing scene driver updates shared color/strength once per frame, mutates sky/water uniforms, tints the existing directional key (+bounded intensity) for mountain/monolith surfaces and slightly tints fog/horizon haze. No new lights/shadows or React state. Reduced motion freezes the shared clock/hue/strength; invalid/stalled deltas are bounded and harmonic rates join the628.3185s phase wrap. This subsystem never reads audio, events or context; prior legacy sky/base-water response remains pending BL06.

### Bloom BL03 stone correction (post-BL04)

Scene-local `monolith.ts` generates the closed bevel/groove solid and two low-poly fragments once. One shared rough standard stone material retains built-in lighting/fog, with procedural static variation/normal relief and bounded local side/seam emission through the WebGL material compile hook. Its aurora uniforms reference existing shared light color/strength; it neither owns nor alters the BL04 clock/key/fog driver. The luminous core is physically behind stone lips. Explicit cleanup releases authored geometries/material; no frame-rate React state or new passes/lights. The existing water shader approximates beveled body, core and subordinate fragment impressions; camera/terrain/aurora fields remain unchanged.

### Bloom BL05 trails

Scene-local `trails.ts` barycentrically samples upward-facing triangles from the existing quality-specific bank geometries. `Mountains` owns both bank resources and a single batched ribbon geometry, releasing them on quality replacement/unmount. Standard has two 80-segment routes, Low one 40-segment route; no terrain vertices/materials change. Custom static lane/UV attributes drive pastel core/glow and a bounded autonomous 8s traveling pulse through one additive depth-tested shader. A material ref receives time outside React state; reduced motion freezes it. BL05 adds no audio-reader, shared illumination, lake reflection or capture coupling; those music mappings remain BL06.

### Bloom BL06 — current audio/render contract

App supplies `analysis.musicFeatures` to Bloom. `music.ts` reads MusicFeaturesV1 exactly once per frame, copies six-band energies/context and keeps only fixed-size scalar histories plus bounded lane pulses. `musicFeaturesFresh` gates musical response; `(session, sequence)` and attack-time six-band rises qualify broad low/mid/high events. Sources, seeks, rollback, timing gaps, disabled gain, priming and stale input cannot replay old attacks. Intrinsic aurora/water/trail clocks remain independent of playback; reduced motion freezes them and hero motion, suppressing impulses while permitting slow sustained light. The scene imports signal.ts only for numeric helpers/band names, never AudioSignal. Historical `reactivity.ts`/unused BloomDebugControls are not in the runtime Bloom import chain.

The controller exposes final aurora/light, pose/seam, trail level/phase/shimmer/pulses, ring and reusable reflection projection outputs. One Composition driver writes existing group/material refs and shader uniforms; no frame-rate React state. Stone shader controls are material-owned properties (explicit refs), preventing stale cloned uniform links. Dynamic monolithProjection fills an existing object from final y/yaw. Terrain and stone/fragment geometry generators, camera, source handlers, other scenes and shared MI stay unchanged. No additional draw, texture, geometry, light or render target.

### Bloom BL07 — choreography refinement

Only the scene-local music controller changes. Four persistent motion scalars (lift/yaw and velocities) feed an exact critically damped analytic step with existing bounds. It follows independently from the slower environmental envelopes and faster band/attack controls. No new render resources, frame allocations, analysis reads or React state. Existing material refs and reusable final-pose projection remain the sole delivered output path to the hero and lake. Lane speeds preserve autonomous base travel while giving low/high mids distinct musical rates. One primary low ring uses the latest qualified event's strength/age, merging compatible sub-band qualifications within that event only. All borrowed-view, bounded-history, freshness/session and reduced-motion safeguards remain.
