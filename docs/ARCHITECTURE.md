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

Separate `/audio-lab.html` supports synthetic fixtures and the owner-approved 2026-11-18 live-tab diagnostics follow-up. `createAnalysis` accepts an optional development diagnostic sink; unchanged callers retain the existing behavior and AudioSignal contract. A DEV-guarded helper reads RMS and copies numeric measurements into its own reusable view. No media buffers or graph nodes reach the lab UI. The main application never supplies a sink, and the helper/lab are excluded from production output. Five-Hz display/history snapshots remain outside React state. Offline tests use existing feature functions at measured audio timestamps; they do not replace production requestAnimationFrame scheduling or introduce a new feature contract. Reproduction, evidence and limitations: [MI01_BASELINE.md](MI01_BASELINE.md).

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
