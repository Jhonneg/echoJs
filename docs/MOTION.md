# Motion & reactivity — Bloom

Three layers: (1) ambient motion independent of playback, (2) real-time response to audio, (3) slow atmospheric evolution from a sustained energy envelope. Do not make the entire scene jump on every beat.

| Signal | Primary | Secondary |
|---|---|---|
| Bass (~20–250 Hz) | Lake ripples | Halo gentle scale/emission pulse |
| Midrange (~250–4000 Hz) | Relative halo fragment drift | Emissive intensity |
| Treble (~4000–20000 Hz, capped at Nyquist) | Sparse particle shimmer | Surface highlights |
| Sustained level | Atmospheric glow | Subtle tint/temperature |
| Silence/disconnect/pause | Decay reactive effects | Ambient motion continues |

These frequency bands are initial tuning values, not fixed perceptual standards; no implied instrument/vocal recognition. Signal normalized to 0..1; per-frame properties lerp/damp with delta; use fast attack and slower release for reactive motion, longer envelope for atmosphere. Proposed starting constants: attack ~100 ms, release ~300 ms, atmospheric envelope ~1–3 s; tune by listening. Reactivity control scales reactive amplitude, not audio volume. At zero intensity ambient remains. Clamp scale, emission and exposure; no strobing, aggressive camera shake, rapid flashes or sudden large color changes. Respect reduced-motion preference: limit drift and reactive movement, retain gentle static/low-motion presentation.

Dormant, awake and radiant are conceptual points on a continuous spectrum, not mandatory discrete state machines. Test silence, low/mid/high bands separately with permitted fixtures, then actual music. Do not equate simulated signals with real audio validation. Future scenes choose their own mapping using the shared signal contract.
