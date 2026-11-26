# Bloom rebuild BR8 — music response and mouse parallax

2026-11-26. Run `npm run build && node scripts/verify-bloom-br8.mjs <scratch-dir>`. It builds a throwaway copy exposing the music state and camera, plays a generated track through the real file adapter and analysis, and deletes its temporary files afterwards.

## What was built

- **Music controller** (`src/scenes/bloom/music.ts`): reads the shared analysis once per frame and drives the existing shaders through shared uniforms. No new visual elements.

| Music | Response (upper limit) |
|---|---|
| Bass / sub-bass, sustained | Aurora and its light on snow and mist (+40%) |
| Bass hits | A ring spreads on the water from under the monolith, plus a brief contact glow |
| High mids, sustained | Seam brightness and glow (+60%) |
| High-mid hits | Short seam flash (+120%, decays in ~0.35 s) |
| Low and high mids | River brightness (+80%) and flow-pulse speed (+50%) |
| Low-mid hits | A pulse runs down each river, source to mouth in 2.5 s |
| Presence and air | Aurora shimmer speed (+80%) and crystal edge sparkle |
| Overall intensity (slow) | Whole-scene light (+12%) |
| Playback | The monolith rises 3% of its height while playing (critically damped, about 4 s) |

- **Hits:** a mid hit counts as high-mid or low-mid by which band rose more over the previous 0.12 s.
- **Safeguards:**
  - only fresh, same-session hits fire, each once, and none older than 0.5 s;
  - a new source starts fresh;
  - stale audio, silence and Reactivity 0 fade to the calm scene;
  - reduced motion keeps only the slow light changes.
- **Change from the plan:** the plan had the monolith settle *lower* when audio stops. Since BR1–BR7 were all approved on the idle scene, idle stays the exact approved pose and the monolith *rises* 3% while playing instead.
- **Mouse parallax** (`src/scenes/bloom/parallax.ts`, applied in the camera):
  - the camera turns up to ±2.5° sideways and ±1.2° up and down toward the mouse, following over about 0.25 s;
  - it works with a real mouse only (fine pointer with hover, mouse pointer events), never on touch or with reduced motion;
  - it eases back to centre when the pointer leaves or the window loses focus.
- **Help text:** the Bloom text written in APP02 already describes this behaviour, so it's unchanged.

## Generated test track (browser, production analysis)

Sections: 0–4 s silence, 4–10 s bass hits (110 Hz), 10–16 s high-mid hits (1.5 kHz), 16–22 s both, 22–28 s silence. Averages from the [timeline](capture.json):

| Section | Aurora | Seam | Rivers | Peak seam flash* | Rings | Monolith lift |
|---|---|---|---|---|---|---|
| Silence | 0 | 0 | 0 | 0 | 0 | rising |
| Bass | 0.48 | 0 | 0.00 | 0 | 7 | 3% |
| High mids | 0.11 | 0.42 | 0.26 | 0.17 | 0 | 3% |
| Mixed | 0.49 | 0.42 | 0.26 | 0.18 | 8 | 3% |
| Silence after | 0.05 | 0.00 | 0.01 | 0 | 0 | 3% (track still playing) |

\*Sampled every ~100 ms, so the true peak is higher.

- **After the track ends:** aurora 0.003, seam 0.00001, lift 0.00001.
- **Reduced motion:** no rings, flashes or lift; the aurora still responds (0.49).

Frames: [bass](section-7s.png) · [high mids](section-13s.png) · [mixed](section-19s.png) · [silence after](section-26s.png)

## Parallax (browser)

Headless reports no hover-capable mouse, which correctly keeps parallax off. As the old Bloom camera test did, the throwaway copy treats the screen as having a fine pointer.
- **Corners:** yaw ±2.49° and pitch ±1.19–1.20°, within the limits.
- **After window blur:** −0.006° / −0.003° (back to centre).
- **Touch:** 0° change.
- **Wide screen at full parallax:** no gaps at the frame edges ([left](parallax-wide-extreme.png), [right](parallax-wide-extreme-right.png)). Corner frames: [top-left](parallax-top-left.png) · [bottom-right](parallax-bottom-right.png).

## Checks

- PASS: 319 unit tests, including 9 in `tests/bloomMusic.test.mjs`:
  - each band drives only its element;
  - hit routing;
  - once-only, fresh, same-session hits and reset on a new source;
  - limits under loud music with repeated hits;
  - settling after silence, stale audio and Reactivity 0;
  - reduced motion;
  - playback lift;
  - the production analysis fed generated tones;
  - parallax limits and return to centre.

  Lint, typecheck, build and whitespace also pass.
- PASS: `verify-bloom-br8.mjs` (all 11 checks, 0 runtime errors).
- PASS: `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- **GPU** (no audio playing, [measurement](gpu-idle.json)): Standard 4.7 ms per frame, Low 3.0 ms. Within BR7's range; the music only feeds values into existing shaders.

## Fix during review: split reflection

On the owner's GTX 1660 the lake reflection sometimes split along a line and shifted sideways. Throwaway builds showed it was in Bloom's reflection pass (a plain mirror still split; no reflection, no split; a frozen frame kept it). The lookup is now computed per pixel and the lake is subdivided. The owner confirmed the fix on their machine; headless Brave never reproduced the fault. `verify-bloom-br8.mjs` was rerun afterwards: all 11 checks pass.

## Not tested

- Real songs, how it feels to listen, and how the parallax feels with a real mouse. These need your own ears and hand.
- Shared-tab capture: same analysis path, but not tested natively.
