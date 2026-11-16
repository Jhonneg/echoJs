# Motion & reactivity — Bloom

Current prop refinement (2026-11-16, owner visual review pending): base halo size is 125%, with a raised center and matching approximate reflection. Mouse-driven movement was removed at the owner’s request. Ambient drift and the pronounced bass-driven tilt remain.

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

## Historical P04/P05 mapping (before feature refinement)

The scene consumes the stable AudioSignal, never capture APIs. Visual response targets use `gain * clamp(signal) / (1 + (gain - 1) * clamp(signal)) * Reactivity`, gain 12 for bass and 6 for other responses; this gain does not change audio volume or analysis normalization. Bass response now uses the analyser 25/90 ms envelope directly, with contrast exponent 1.5 applied to the gain-12 soft-knee value; there is no second scene bass temporal filter; other scene bands use 100 ms attack / 300 ms release; atmospheric glow uses 1.5 s attack / 2 s release, after the analyser's own smoothing. Frame delta is capped for pause/background recovery.

- Bass: halo scale 1..1.20, distortion multiplier 1..3.5, ripple contribution 0.16..0.54.
- Midrange: tangential fragment displacement 0..0.12 world units; body emissive intensity gains up to 0.65. Halo/reflection size is controlled only by bass.
- Treble: reflection/highlight contribution rises smoothly, without adding particles.
- Sustained intensity: adds up to 0.55 body emission plus a restrained horizon/lake glow; no exposure or camera changes.

Reactivity zero resets reactive response exactly; ambient remains. Silence/disconnect releases naturally. Reduced motion freezes drift/water phase and removes reactive geometric/highlight changes, retaining only slow glow. Continuous rendering supports that glow; no frame-rate data enters React state. The initial P04 bounds were accepted as passable; subsequent P05 shared-tab sync/contrast correction passed owner native pulse retest, not instrument recognition or calibrated loudness.

P04 bass correction followed owner feedback that response was weak. The soft knee removes the previous scene clipping at ~0.39 normalized input; quicker bass envelopes and stronger geometric/water mapping improve short-hit visibility. Owner later accepted the tuned result as passable; detailed per-source results remain unreported.

Quiet/loud contrast correction: removed square-root lifting, which emphasized low levels. Linear-magnitude soft-knee targets keep quieter inputs subdued; the wider halo bound preserves ordinary bass visibility and leaves more room for loud hits. Sample rate, analysis normalization, fast bass timing and audible volume are unchanged.

P05 correction: midrange radial drift previously made non-bass content look like a size pulse; tangential drift removes that confound. Bass follows the existing analysis envelope directly and uses `pow(12*b/(1+11*b), 1.5) * Reactivity`, with b clamped to 0..1. This expands quiet/loud contrast; it does not detect beats, classify instruments or compensate unknown native capture latency. Owner confirmed native shared-tab pulse timing/contrast looked right on 2026-11-16; this is perceptual validation, not a numeric latency measurement.

## Current approved feature refinement — 2026-11-16

The audio layer now owns all response envelopes. Raw band magnitudes and normalization are specified in ARCHITECTURE. The following initial per-band constants live in `src/audio/features.ts`:

| Feature | Bass attack/release | Mid attack/release | Treble attack/release |
|---|---|---|---|
| Fast energy | 5 / 80 ms | 8 / 100 ms | 3 / 60 ms |
| Slow baseline | 250 / 800 ms | 250 / 800 ms | 250 / 800 ms |
| Transient accent | 3 / 80 ms | 3 / 70 ms | 2 / 50 ms |

Transient target uses positive difference d = max(0, fast - slow), emphasized as `2*d/(1+d)`. A held tone keeps fast/slow energy and loses its transient accent. This is energy-change emphasis, not kick recognition, tempo prediction or beat tracking. Atmosphere uses combined band magnitude, fixed sensitivity 3 / reference 0.1, and a single 1 s attack / 2 s release envelope.

Bloom maps features directly, with no second interpolation stage: bass response = 20% fast + 80% transient; mids = 25% fast + 75% transient; treble = 10% fast + 90% transient; glow = atmosphere. The global Reactivity slider scales reactive amplitudes only. Existing movement/material bounds, fixed camera, palette, tangential mid drift and reflection alignment are retained. Ambient phases remain independent of sound. Reduced motion freezes ambient phases and suppresses reactive geometry/highlights while retaining slow glow.

The current FFT window is still ~42.7 ms at 96k/4096. This refinement does not remove native capture delay or guarantee GLASS-like event recognition. Owner accepted the feature refinement after reporting "Response and switching look right" on 2026-11-16; earlier P05 performance measurements still apply only to their original build.

Feature envelopes use actual elapsed audio-update time. The renderer caps only ambient phase advancement after stalls; reactive envelopes are no longer additionally slowed by that scene delta cap. Feature updates remain frame-cadence limited, with timing exposed for diagnosis.

## Approved band-separation refinement — 2026-11-16 (manual acceptance pending)

Default accent = `max(energy transient, flux)` per band, preserving the accepted energy response without adding duplicate attacks. Original fast/accent weights remain bass 20/80%, mid 25/75%, treble 10/90%. Debug compares energy-only and flux-only accents; the modest fast-energy contribution remains in both. Atmosphere is unchanged.

- Bass retains global halo scale 1..1.20 and existing water response.
- Mids displace fragments tangentially with alternating direction and authored weights (0.6/0.8/1), bounded at 0.12 world units, plus local midpoint rotation up to ±0.045 radians (~2.6°). Different fragment motions share a common mid envelope; no separate instruments are identified. Mids no longer brighten every body.
- Treble adds up to 0.65 body emission only to fragments 0/3/6, retaining existing water highlights. No exposure changes, flash triggers or extra geometry. Slow glow still affects all bodies.
- Reduced motion suppresses reactive geometry/highlights and freezes ambient phase, retaining only slow glow. Reactivity zero removes all reactive amplitude.

A collapsed panel below Bloom isolates All/Bass/Mids/Treble in the scene bridge, optionally suppresses ambient motion/glow, and supplies a 120 ms exponential synthetic visual pulse without touching audio features. Synthetic mode is labeled in the scene; diagnostics continue unchanged. Reset restores defaults. Non-default visual debug invalidates performance runs; reset before benchmarking. These tools establish visual isolation, not source separation or native capture latency.

## Bass motion comparison — 2026-11-16 (manual acceptance pending)

An internal Vite build setting compares `off`, `halo`, `camera`, and `both` (default) without adding visitor motion controls. Rising bass response gives a damped rotational impulse, followed by a brief opposite swing and decay; held bass does not create a continuous shake. The halo variant adds at most ±24° to its authored rotation and rotates the approximate reflection mask with it. The camera variant rolls the entire composition by at most ±1°. `both` drives separate halo and camera springs from the same bass rise in the same scene, with camera roll opposite the halo's world rotation so both move in the same screen direction. Halo damping is 8/s versus the camera’s existing 16/s, retaining a more visible opposite swing while keeping camera timing unchanged. Reduced motion and zero Reactivity reset this added motion. Audio features, existing bass scale/ripples, and mid/treble mapping are unchanged. Owner comparison with permitted music is pending.

## Lavender Peaks L02 — sideways depth groups

The owner approved continuous rightward travel: back two ridges follow fast bass energy, middle two follow fast midrange, front two follow fast treble. Maximum speeds at full energy/Reactivity are 0.5, 0.8 and 1.2 world units/s respectively (doubled at owner request after the first L02 preview). Speed approaches the target with 120 ms acceleration and 300 ms deceleration; silence stops at the current offset. Delta is capped at 50 ms after stalls. Speed integration uses elapsed time; offsets wrap over periodic 40-unit terrain. No beat detection, camera movement, lighting or ambient motion is added.

Reactivity scales travel speed. Zero Reactivity and reduced motion stop it immediately without resetting position. Each scene mount starts at the original position. Periodic ridge heights/detail and geometry spanning beyond the viewport hide offset wrapping. Owner review with permitted music remains required.

## Lavender Peaks L03 — one band per mountain

Supersedes L02's paired mappings. From farthest to nearest: sub-bass (20–80 Hz), bass (80–250), low mids (250–800), high mids (800–2500), presence (2500–6000), air (6000–20000). Each ridge consumes only its own `sixBands` energy. Maximum speeds are 0.5/0.5/0.8/0.8/1.2/1.2 world units/s, retaining the faster L02 limits. Rightward travel, 120/300 ms speed smoothing, periodic terrain and freeze-in-place for zero Reactivity/reduced motion remain. The scene now has six motion states and transforms; no extra terrain or effect is added. Review with permitted music remains pending.

Terrain continuity fix (2026-11-16): owner found flat shelves as authored peaks scrolled away. Every 40-unit period now includes eight varied lower continuation peaks, smoothly combined with the authored profile. This preserves mountain contours throughout travel; fine serrations alone do not count as terrain variation. Motion and audio mappings remain unchanged.

Shared camera roll refinement (2026-11-16): camera spring and ±1° bass roll now belong to LandscapeCanvas, enabled by default for Bloom and future landscapes using that host. Lavender Peaks explicitly disables camera tilt following the owner's correction, so its camera stays level while its six ridges travel. The camera uses the original Bloom 20% fast + 80% max(transient, flux) bass mapping, existing 16/s damping and reset-on-disable behavior; Bloom's halo retains its independent 8/s spring. The Vite camera comparison variants apply through the shared host.

Authored-pattern repeat correction (2026-11-16): supersedes the continuation-hill fill above. Owner wants the recognizable initial mountain sequence to return indefinitely. Repeat the authored six ridge profiles over a tighter 24-unit period, removing the separate generated filler hills. Both geometry sampling and motion offset wrapping use that period. Each ridge loops independently according to its own audio energy; different band histories need not restore the entire composition simultaneously. Palette, six mappings, speed limits and level camera remain unchanged.

Lavender Peaks sun (2026-11-16): a fixed faint disc is drawn in the sky shader behind all six ridges. It has no independent animation or audio response; the far mountain’s existing sub-bass travel reveals it. Terrain looping covers it again naturally.

Depth-speed refinement (2026-11-16): owner requested slower distant layers. Speed limits now rise strictly from back to front: 0.15/0.25/0.45/0.65/0.9/1.2 world units/s. Each layer still responds independently to its own band; this is the depth ordering at equal energy, not a guarantee of observed ordering when band energies differ.
