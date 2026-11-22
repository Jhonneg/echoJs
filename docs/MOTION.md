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

## Crimson Horizon C01 — composition preview

The sun, sky, terrain and crimson highlights are static. LandscapeCanvas provides the existing shared bass-driven ±1° roll; Reactivity scales that shared response. Zero Reactivity/reduced motion reset the camera and leave the static composition. No scrolling terrain or scene-specific music response is introduced in C01.

## Crimson Horizon C02 — mouse viewpoint in a 3D valley

Owner approved gentle viewpoint shift rather than orbit/exploration, retaining the reference's graphic dark/crimson look. Camera starts at (0, 5.5, 20), looks toward (0, 3.2, −35) and follows normalized mouse position with maximum offsets ±1.6 horizontally and ±0.85 vertically. Use exponential 180 ms smoothing and a 50 ms resumed-frame delta cap. Leave/blur smoothly return the target to center; touch has no effect. Reduced motion centers the camera and removes pointer/bass movement. The existing ±1° shared bass roll is layered after the position/lookAt update; zero Reactivity removes bass roll while pointer movement remains. Terrain and sun have no new audio mappings.

Lavender Peaks bass-sun pulse (2026-11-16): owner requested the sun pulsate with bass. Use the existing broad bass features (20% fast energy + 80% max(transient, flux)), scaled by Reactivity, with a 40 ms attack and 220 ms release in the sky uniform. Pulse expands the disc/haze up to 20%, increases disc blend from 0.38 to at most 0.46 and haze strength from 0.055 to 0.075. Reduced motion and zero Reactivity immediately reset the pulse. The sun center stays fixed behind the terrain; mountain depth occlusion remains natural. This supersedes the earlier static-sun behavior; no audio processing change.

## Crimson Horizon C03 — visual gate before audio

Keep the perspective mouse camera and its ±1.6/±0.85 offsets, 180 ms smoothing, leave/blur return and reduced-motion behavior. Neutral viewpoint moves to (0,3.5,24), aimed at (0,4.2,−35) for a lower, wider composition. Crimson Horizon opts out of shared bass roll and disables its Reactivity control during visual review; other landscapes retain their current audio/motion behavior. Terrain, sun, haze and ridge shader contain no animation/audio response. Continuous forward travel is deferred; one stationary terrain region is used for approval.

## Crimson Horizon C04 — endless forward travel

C04 supersedes the C03 motion pause. The existing six normalized band levels drive two separate responses: their RMS energy sets forward speed (0.4–16 world units/s at full Reactivity while bands are active, with an energy exponent of 1.7 to separate quiet walking from fast travel), and their active count sets sun brightness (count/6). Bands activate at 0.12 and release below 0.08 after 150 ms, preventing threshold flicker. Speed eases with 350 ms attack/200 ms release; sun brightness uses 250 ms attack/800 ms release. Silence eases travel to rest; pause/end/disconnect or signal age above 250 ms stops travel immediately. No elapsed-time catch-up occurs.

The sun keeps its size and stays 88 units ahead of the forward camera position. Idle brightness is barely visible; no disc scale pulse or camera roll is added. Mouse offsets/return remain available while silent, independently of Reactivity. Zero Reactivity stops forward movement and dims the sun. Reduced motion freezes forward and pointer movement while allowing sun brightness to change over 1.5 s. Leaving/reentering the scene resets the journey; pause retains its distance. A delayed terrain chunk stops travel before exposed bounds and resumes when ready.

## Lavender Peaks — shared mountain response (2026-11-16)

Owner replaced the individual frequency mappings with one shared music response. Every mountain now consumes the existing overall `signal.intensity`, so all layers accelerate and decelerate together. Keep speed limits from back to front at 0.15/0.25/0.45/0.65/0.9/1.2 world units/s, preserving the depth hierarchy at every shared input level. Keep 120/300 ms smoothing, rightward 24-unit looping and freeze-in-place on zero Reactivity/reduced motion. This supersedes L03's frequency-to-ridge assignment and independent band histories. The separately requested bass-pulsing sun remains unchanged.

Lavender high/low speed refinement (2026-11-16): all mountains share a frequency-balance factor as well as overall intensity. Compute a power-weighted mean of the existing six normalized band indices (0 at sub-bass, 1 at air); scale shared intensity by 0.25 + 0.75 × balance. Low-frequency passages therefore travel at one-quarter the high-frequency speed at equal intensity. Mixed audio blends continuously, using existing 120/300 ms speed smoothing. This estimates spectral brightness, not musical pitch or note recognition. No band is assigned to an individual mountain; depth limits and bass sun remain unchanged. Silence/zero/reduced-motion behavior remains.

Crimson strong-bass sun pulse (2026-11-16): owner requested pulsation when strong bass plays. Use existing broad fast bass above 0.5, remapped to 0–1, multiplied by max(bass transient, bass flux) and Reactivity. Smooth with 40 ms attack/220 ms release. This produces an onset-driven expansion up to 8%, glow expansion up to 12%, disc brightness lift up to 20% and bounded glow lift; sustained bass settles without an artificial oscillation. Preserve active-band-count base brightness, fixed sun center/horizon distance and the faint idle disc. Pause/stale input releases pulse; zero Reactivity/reduced motion clears it immediately. This supersedes C04's constant-size restriction only for the requested bass pulse.

Crimson travel-speed increase (2026-11-16): owner requested faster movement. Double the full energy-speed curve to 0.4 + 15.6 × RMS-energy^1.7, up to 16 world units/s at full Reactivity. Preserve the slow/fast ratio, smoothing, loaded-terrain limit and all sun/pointer behavior.

## Nocturne — mouse camera (2026-11-16)

Reuse Crimson's existing pure view-motion helper: ±1.6 m horizontal and ±0.85 m vertical offsets, exponential 180 ms response and 50 ms delta cap. Start at (0,1.6,5), keep Z fixed, and look toward (0, 1.6 + tan(0.055) × 57, −52) to retain neutral framing. Leave/blur reset targets, touch is ignored, reduced motion immediately centers the view. No bass roll or forward travel; Reactivity remains disabled. Continuous rendering replaces N01 demand rendering to support smoothing.

Nocturne parallax reduction (2026-11-16): owner found the full Crimson offsets excessive in the narrow alley. Scale Nocturne camera displacement to 25% (±0.4 m horizontal, ±0.2125 m vertical), retaining the 180 ms smoothing, fixed forward position, neutral target and reduced-motion/return behavior. This supersedes the full-range Nocturne offsets above; Crimson stays unchanged.

## Nocturne N05 — audio-driven lighting (2026-11-17)

Audio mode is the default. Reuse broad fast bass/midrange/treble for magenta fixtures+bridge, cyan windows+panels and violet strips respectively. Remap each fast level above a 0.035 noise floor with exponent 1.35, blend 70% level with 30% max(transient, flux) while energy is present, then multiply by Reactivity. Keep the audio analyser ranges unchanged (20–250, 250–4000, 4000–20000 Hz). Independent attack/release times are 45/220, 65/280 and 35/180 ms. Existing slow atmosphere drives gate/haze through 250/800 ms smoothing (350 ms release when inactive).

Pause/end/disconnect, invalid timestamps or signal age above 250 ms target zero; values below 0.001 snap to zero only while decaying to zero. Cap integration delta at 50 ms, with no time catch-up. Zero Reactivity clears every audio response immediately. Reduced motion keeps the existing centered camera and uses 800/1100 ms group fades plus 1200/1500 ms atmosphere fades. These are lighting envelopes, with no geometry/camera travel or random flickering. Manual mode retains the previous exact color isolation levels, independent of audio/Reactivity; the Reactivity control is disabled in Manual.

## Nocturne N05 flash correction — 2026-11-17

Owner requested flashes instead of gradual illumination. This supersedes the normal-motion sustained/attack-release group response above. Each band detects an existing transient/flux accent ≥0.12 with fast energy >0.06; it flashes immediately to the Reactivity-scaled peak, holds for 110 ms magenta, 90 ms cyan or 70 ms violet, then cuts to zero. Use a 180 ms retrigger interval, rearm below accent 0.06, and allow a new positive accent jump ≥0.08 over a held background. Sustained energy/accents alone do not cause automatic flicker or leave fixtures lit. Holds use wall-clock time so slow frames do not stretch the flash.

Inactive/stale input and zero Reactivity clear pending normal-mode flashes. Overall gate/haze still use the existing slower atmosphere response. Reduced motion retains gradual 800/1100 ms group transitions; Manual preview retains exact levels. No random patterns, analyser/band changes, additional lights or geometry movement.

Nocturne slower-flash correction (2026-11-17): owner found the flashes too fast. Extend magenta/cyan/violet holds to 280/240/200 ms and the per-group retrigger interval to 650 ms (at most ~1.54 triggers/s per group). Keep immediate onset/sharp cutoff. Consume attacks skipped during the interval instead of queuing a late flash; subsequent attacks remain tied to input. This supersedes the 110/90/70 ms holds and 180 ms retrigger interval above. Manual, atmosphere, reduced motion and stop/stale/zero behavior remain unchanged.

## Nocturne faster smooth response — 2026-11-17

Owner clarified that lights should illuminate smoothly, faster than the first N05 version. Remove the flash holds, attack triggers and cooldowns entirely. Restore continuous independent level/accent targets with normal attack/release constants 25/180 ms magenta, 35/220 ms cyan and 20/140 ms violet. These attack constants are roughly 1.8× faster than the original 45/65/35 ms envelopes; they are exponential time constants, not total end-to-end latency. Sustained sound stays illuminated and silence/stop releases smoothly to zero. Keep overall atmosphere timing, reduced-motion fades, Manual mode, zero Reactivity and the brighter idle fill unchanged. This supersedes both flash revisions.

## Planned Music Intelligence refinement — 2026-11-18

Owner selected expressive/controlled refinement with Crimson as the future pilot, subtle terrain deformation and transitions within music/playback. [ANIMATION_REFINEMENT.md](ANIMATION_REFINEMENT.md) records the intended feature roles, two-pass Crimson approach, caps and preservation rules. This is a future direction after MI03/MI04 and feature-quality review; it does not replace the implemented response constants or authorize immediate scene changes. Onsets will be discrete, strength-qualified events with identity/timing; camera kicks, BPM claims, random flicker and scene-switch transition work are excluded. Existing scene-specific reduced-motion and zero-Reactivity behavior remains the baseline. The next deliverable/approval is [MI03_PLAN.md](MI03_PLAN.md).

## Crimson bounded vertex pass — 2026-11-21

Owner approved the second MI05 pass. Selected banks now have ≤0.08 world units vertical deformation, with sustained mid/overall energy and proportional mid accents (50/30/20 weighting), 140/600 ms amplitude response and slow context-driven phase (0.25–0.6 rad/s). Central corridor, near camera and distant/high skyline remain fixed through smooth spatial masks. Waves remain continuous across chunks/rebases/phase wrapping. Zero Reactivity/reduced motion clear amplitude/freeze phase; stale/inactive features freeze phase and release amplitude. Sun, camera, journey, audio interpretation and other landscapes remain unchanged. See MI05_VERTEX.md; owner visual/musical acceptance remains separate.

Crimson visibility adjustment (2026-11-21): owner approved raising the initial0.08 cap to0.32 and using a0.7 power on normalized50/30/20 mid/overall/accent drive, then applying Reactivity linearly. Masks,140/600 ms envelope, phase rates, normal handling and motion overrides remain unchanged. This supersedes only the earlier amplitude/linear-drive settings; sun/camera/audio/other worlds remain as accepted.

## Crimson contour lighting replaces deformation — 2026-11-21

Owner reverted all vertex motion. Current terrain positions/normals are authored. Existing lowMids250–800 drive gradual contour illumination (sqrt visual target,320/750 ms); highMids800–2500 rises create550 ms travelling contour highlights. Qualification and strength depend only on high-mid energy, not bass/overall/broad onset events; constant high mids do not continually retrigger. Zero/stale/pause/reset clear streaks, reduced motion suppresses travel and slows low-light response to1.5 s. Existing sun/camera/journey behavior preserved. See CRIMSON_CONTOURS.md for defaults and current evidence; earlier vertex sections are historical.

## VM02 refinement — IMPLEMENTED — AWAITING REVIEW — 2026-11-21

Current contour visuals supersede the earlier550 ms/power-shaped defaults: low-mid emission target is linear lowMids×Reactivity with existing320/750 ms response; high-mid local rise qualification is unchanged but strength is linear rise×Reactivity. A35 ms eased attack and smooth release through950 ms allow a bright head/short one-sided trail to visibly travel along selected logical contour coordinates. Rest stays barely burgundy; sustained light is soft crimson; strong heads are warmer/brighter. Restricted secondary contours and narrow halos avoid wireframe appearance. Geometry/MI/sun/camera and motion overrides unchanged; fixture-only stationary tests/recording are documented in VM02_REVIEW.md. No VM03.

Activity-driven sun halo (2026-11-21 owner request): Candidate continuous halo emission follows gain-scaled existing context.activity, with120/450 ms local rise/fall and≥1.5 s reduced-motion response. Idle alpha0.003, activity coefficient0.17, bass-pulse coefficient0.06 and Gaussian width/geometry remain unchanged. Zero Reactivity clears the activity drive; inactive/stale input releases it smoothly. Sun body/size, bass pulse geometry, camera and VM02 contours are preserved. Legacy comparison retains energy-driven halo behavior; no MI changes.

VM04 upper detail: presence/air weight existing high onset envelope into short distant glints, fading sparse sky specks and subtle edge shimmer. No permanent particle travel; reduced motion suppresses accents. Quality reduces speck density; sun/corona/valley/camera timing unchanged.

VM05 atmosphere: density combines slow intensity/activity; warmth uses valid brightness×intensity.2s rise/4s release (4/6s reduced), including existing haze. Context affects horizon color and distant depth before reactive emission, without onset flashes or sun/camera changes.
