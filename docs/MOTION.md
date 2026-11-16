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

## P04 implemented mapping (2026-11-16)

The scene consumes the stable AudioSignal, never capture APIs. Visual response targets use `gain * clamp(signal) / (1 + (gain - 1) * clamp(signal)) * Reactivity`, gain 12 for bass and 6 for other responses; this gain does not change audio volume or analysis normalization. Bass response now uses the analyser 25/90 ms envelope directly, with contrast exponent 1.5 applied to the gain-12 soft-knee value; there is no second scene bass temporal filter; other scene bands use 100 ms attack / 300 ms release; atmospheric glow uses 1.5 s attack / 2 s release, after the analyser's own smoothing. Frame delta is capped for pause/background recovery.

- Bass: halo scale 1..1.20, distortion multiplier 1..3.5, ripple contribution 0.16..0.54.
- Midrange: tangential fragment displacement 0..0.12 world units; body emissive intensity gains up to 0.65. Halo/reflection size is controlled only by bass.
- Treble: reflection/highlight contribution rises smoothly, without adding particles.
- Sustained intensity: adds up to 0.55 body emission plus a restrained horizon/lake glow; no exposure or camera changes.

Reactivity zero resets reactive response exactly; ambient remains. Silence/disconnect releases naturally. Reduced motion freezes drift/water phase and removes reactive geometric/highlight changes, retaining only slow glow. Continuous rendering supports that glow; no frame-rate data enters React state. The initial P04 bounds were accepted as passable; subsequent P05 shared-tab sync/contrast correction passed owner native pulse retest, not instrument recognition or calibrated loudness.

P04 bass correction followed owner feedback that response was weak. The soft knee removes the previous scene clipping at ~0.39 normalized input; quicker bass envelopes and stronger geometric/water mapping improve short-hit visibility. Owner later accepted the tuned result as passable; detailed per-source results remain unreported.

Quiet/loud contrast correction: removed square-root lifting, which emphasized low levels. Linear-magnitude soft-knee targets keep quieter inputs subdued; the wider halo bound preserves ordinary bass visibility and leaves more room for loud hits. Sample rate, analysis normalization, fast bass timing and audible volume are unchanged.

P05 correction: midrange radial drift previously made non-bass content look like a size pulse; tangential drift removes that confound. Bass follows the existing analysis envelope directly and uses `pow(12*b/(1+11*b), 1.5) * Reactivity`, with b clamped to 0..1. This expands quiet/loud contrast; it does not detect beats, classify instruments or compensate unknown native capture latency. Owner confirmed native shared-tab pulse timing/contrast looked right on 2026-11-16; this is perceptual validation, not a numeric latency measurement.
