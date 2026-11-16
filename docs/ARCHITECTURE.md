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

L01 adds a second, static scene selected in App. App retains the audio controllers and analysis graph while the visible scene Canvas changes, so a scene switch does not disconnect or restart playback. Bloom alone consumes `AudioSignal`; Lavender Peaks is a demand-rendered procedural preview with no audio mapping. Both use the existing quality setting. Reactivity is unavailable in the Lavender Peaks view and retains its value for Bloom. Scene choice is in memory only; no scene registry or plugin framework is introduced.


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
