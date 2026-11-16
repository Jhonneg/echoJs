# Technical architecture — POC

## Stack and scope
React + TypeScript + Vite; Web Audio API and standard media APIs; later Three.js, React Three Fiber, Drei; postprocessing only if needed; GSAP only for justified choreography. Do not install 3D packages before rendering tasks. Motion, React Spring, Zustand, backend and other libraries are deferred until a concrete use case warrants them. Use a package manager consistent with the repo (npm by default if empty), commit lockfile if authorized, and verify compatible installed versions. Vitest is proposed for pure signal/adapter logic when needed. No dependencies pinned in this documentation-only package.

## Boundaries
- `src/audio/`: source adapters, capture lifecycle, AudioContext/AnalyserNode, signal processing; independent of UI and rendering.
- `src/engine/`: shared rendering host and scene/audio bridge; avoid speculative extensibility.
- `src/scenes/bloom/`: scene-specific assets and behavior; no direct media APIs. Future scenes may not have props/water.
- `src/components/`: diagnostics and later controls. `public/` for local licensed assets if needed; `tests/` where appropriate. Create folders only as needed.

Proposed contract (adapt naming only with rationale):
```ts
interface AudioSignal {
  bass: number; // normalized 0..1
  midrange: number;
  treble: number;
  intensity: number;
  isPlaying: boolean; // input active / local playback, not proof of audible sound
}
```
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
Use AnalyserNode FFT bins, frequency boundaries based on actual sample rate and FFT size, clamp indices to Nyquist. Proposed FFT size 2048 or 4096; measure and tune. Convert dB/bin data to bounded magnitudes consistently; define normalized band energy and overall intensity; silence should reach near zero. Document chosen method and normalization, avoid assuming FFT bytes represent linear amplitudes. Smooth with elapsed time and separate slow intensity envelope. Test synthetic signals and edge cases; use stable typed buffers, avoid per-frame allocations. Do not implement beat detection or track classification.

## Scene strategy
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
