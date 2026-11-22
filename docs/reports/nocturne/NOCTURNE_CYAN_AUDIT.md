# Nocturne Music Intelligence integration audit — 2026-11-22

## Actual contract and current groups

The production `createAnalysis({ musicIntelligence: true })` runs two parallel outputs from the same analyser. Nocturne receives only the mutable legacy `AudioSignal` through `App` and `LightingDriver`; it does **not** read `MusicFeaturesV1`. Crimson receives the separate Music Intelligence reader. `AudioSignal` carries normalized broad `fast`, `slow`, `transient`, and `flux` bands, six normalized bands, smoothed overall `atmosphere`, `isPlaying`, and millisecond `updatedAt`. `MusicFeaturesV1` supplies fixed-reference calibrated six-band linear energy and immutable low/mid/high onset events, with second timestamps, session/sequence, and active/fresh state. Its high-mid energy covers 800–2500 Hz; its mid onset covers 250–4000 Hz. The event itself has no six-band attribution. The scene can qualify a mid event against a short history of the existing high-mid energy, without changing Music Intelligence.

| Existing group | Source and control | Final fixture output | Sharing |
| --- | --- | --- | --- |
| Magenta fixtures and bridge | Legacy bass `fast`, plus `max(transient.bass, flux.bass)` | `gain × [0.7 × ((fast−.035)/.965)^1.35 + .3 × accent]`, clamped; zero below fast `.035`; attack `.025 s`, release `.18 s`; emissive `1.3 × response`, point lights `50 ×` / `40 × response` | All magenta instances share one material/response. No cyan/violet final response sharing. |
| Cyan windows and existing panels | Same formula using legacy midrange `fast`, `transient`, `flux`; attack `.035 s`, release `.22 s` | Emissive `1.3 × response`, point lights `65 ×` / `40 × response` | All cyan instances share one material/response. |
| Violet strips and accents | Same formula using legacy treble `fast`, `transient`, `flux`; attack `.02 s`, release `.14 s` | Emissive `1.3 × response`, two point lights `12 × response` | All violet instances share one material/response. |
| Gate, halo, fog tint | Legacy overall `atmosphere` in Audio; manual mix of three groups in Manual | Separate smoothed atmosphere (`.25 s` rise, `.8 s` active fall, `.35 s` inactive fall), then fixed magenta/cyan/violet color weights `.24/.85/.16`; fog adds `.018 ×` glow | Shared overall signal affects the backdrop, not fixture material or point-light brightness. |

Audio groups require playing and an update age of at most 250 ms. Reactivity scales every target; zero clears them. Reduced motion uses much slower `.8/1.1 s` group rise/fall. Manual preview directly assigns the three group levels. Nocturne does not consume `slow` or Music Intelligence onset events. The transient/flux terms are continuous envelopes rather than discrete event mapping; accent also requires `fast > .035`.

## Measured baseline

Ran `updateNocturneResponse` for 120 frames at 60 Hz with fresh, controlled legacy values, then applied the exact `LightingDriver` output multipliers. These are delivered material/light values, not pixel brightness or a captured soundtrack:

| Input (`fast.bass`, `flux.bass`, `atmosphere`) | Magenta response | Emissive intensity | Near point-light intensity | Gate atmosphere response |
| --- | ---: | ---: | ---: | ---: |
| Silence (0, 0, 0) | 0 | 0 | 0 | 0 |
| Quiet bass (.1, 0, .8) | .0183 | .0238 | .917 | .800 |
| Moderate bass (.5, 0, .8) | .2612 | .3396 | 13.062 | .800 |
| Loud bass (.9, 0, .8) | .6039 | .7851 | 30.195 | .800 |
| Moderate bass with accent (.5, .8, .8) | .5012 | .6516 | 25.062 | .800 |
| Atmosphere alone (0, 0, 1) | 0 | 0 | 0 | 1.000 |

**Cause of the reported long on/dark passages:** sustained broad-band fast energy continuously holds the fixture response; when broad-band energy drops below `.035`, the target becomes zero. Multiple magenta fixtures and bridge lamps are batched onto that single bass response, so they brighten/darken together. The `.18 s` release softens transitions but cannot create multi-second holds; overall atmosphere does not directly drive magenta fixture brightness. Missing discrete onset mapping means accents are limited to 30% continuous envelope contribution, but it is not the main cause of sustained illumination. The actual recording was not present in the workspace, so this is a source-and-controlled-signal explanation rather than a frame-aligned recording analysis.

## Cyan panel compatibility

The separate Music Intelligence reader supports the requested panel: `energy.six.highMids` supplies calibrated sustained response, and existing `mid` onset events can be qualified by high-mid energy sampled around their attack time. This avoids a low-mid-only mid event triggering the panel and preserves brief high-mid attacks after the energy falls. The scene must track event session/sequence and reject stale data. No Music Intelligence change is needed. The new fixture requires its own scene material, point-light target, response and manual preview level; existing Nocturne groups remain as mapped above.

## Implementation and verification

Added one left vertical panel at `z = -7.3` with independent emissive material, point light and manual control. Its sustained target is `0.65 × clamp(highMidEnergy / 0.5) × Reactivity`; the scene eases toward it with `.06 s` rise and `.18 s` fall. A qualifying broad-mid event needs a high-mid energy rise of at least `.02` within `.09 s` of its attack timestamp. Its separate accent peaks at up to `.35 × event strength × clamp(rise / .2) × Reactivity` and decays in `.22 s`. This scene-local scalar history is bounded at 64 samples. The final level is the clamped sum; the panel material receives `1.3 × level` and its point light receives `30 × level` with distance 9 and inverse-square decay. Overall context intensity, magenta final response and legacy broad midrange do not enter this mapping. Manual preview sets the panel directly.

Controlled 60 Hz feature trace through the panel response and the same delivery function used by `LightingDriver`:

| Input | Sustained | Accent | Final level | Emissive | Point light |
| --- | ---: | ---: | ---: | ---: | ---: |
| Silence, bass only, low-mid only, or overall intensity only | 0 | 0 | 0 | 0 | 0 |
| High-mid energy `.1` held 2 s | .130 | 0 | .130 | .169 | 3.90 |
| High-mid energy `.4` held 2 s | .520 | 0 | .520 | .676 | 15.60 |
| One-frame high-mid `.5`, later qualifying mid event | .069 | .350 | .419 | .544 | 12.56 |

The automated tests also check mixed low-mid/high-mid input, no accent from a low-mid event over stationary high-mid energy, stale/session/zero-Reactivity handling, and panel independence from a bright magenta group. `npm test` (33 files), lint, typecheck, build, 444 local documentation links, and whitespace check passed. The build retains its existing large-chunk warning. Browser render pixels, fixture appearance, actual music timing, hardware performance and native capture were **not run**; no Playwright installation was found, and no relevant recording was present in the workspace. These remain manual review items, not pass claims.
