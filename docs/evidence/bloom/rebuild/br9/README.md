# Bloom rebuild BR9 — song structure and night mood

2026-11-26. Run `npm run build && node scripts/verify-bloom-br9.mjs <scratch-dir>`. It builds a throwaway copy exposing the music state, plays a generated 62 s song through the real file adapter and analysis, and deletes its temporary files afterwards.

The owner compared Bloom with their Monolith Lake sketch (a screen recording and its HTML) and chose: keep the fixed camera with parallax; add song structure; borrow the warm bass-driven slit and aurora colour shifts; darken toward the Lake's night mood as the song builds. Not taken: the orbit camera, the structure panel, stars, extra crystals, the full-screen ray-marched renderer.

## What was built

- **Song structure** (`src/scenes/bloom/structure.ts`, new): section loudness (~9 s), builds (energy and highs rising above the section) and drops (a sharp bass jump close to the song's loudest bass so far). Judged against the song itself, so it doesn't depend on how loud a song is mastered.
  - Drops need 8 s of audible music first and are at least 6 s apart.
  - After a drop the section average catches up quickly and no build is read, so the louder section isn't mistaken for another rise.
  - The averages start at the first audible level, so a song's opening isn't read as a rise from silence.
- **Responses** (`music.ts` → shared uniforms). All are 0 at idle, so the calm scene is the approved look.

| Structure | Response |
|---|---|
| Loud sections and builds | Night mood: the sky deepens toward indigo, the aurora grows more saturated and brighter, the land, water and mist darken. Aurora light and rivers are added after the darkening, so they stay bright. Up 3 s, back 6 s. |
| Build | Fog: more haze on far ranges, thicker mist on the land and over the water |
| Drop | Clears the fog (~0.6 s), one soft swell of light near the horizon (fades over ~2.6 s), a burst of three rings from under the monolith |
| Bass (BR8 change) | The seam throbs with the bass and warms toward peach (`#ffcfa8`); bass hits also flash it. It used to follow the high mids. |
| Mid hits (BR8 change) | Always pulse the rivers (high-mid hits no longer flash the seam) |
| Brightness of the music | Aurora hue: duller leans green, brighter leans pink, at most 40% of the way, so each side keeps its colour |

- **Reduced motion:** the drop is still detected and the mood, fog and hue still change slowly; there's no swell, no ring burst, and the seam follows the bass slowly instead of throbbing.
- **Settling:** silence, stale audio, Reactivity 0 or a new source return everything to the approved look.

## Results

Generated song through the real analysis (`capture.json` has the full 100 ms timeline):

| Section | Section loudness | Build (max) | Night mood | Fog (max) | Seam range |
|---|---|---|---|---|---|
| Intro 5–13 s | 0.027 | 0 | 0.013 | 0 | 0 |
| Build 24–30 s | 0.421 | 0.848 | 0.393 | 0.697 | 0.045 |
| Drop 36–46 s | 1 | 0.04 | 0.761 | 0.029 | 0.375 |
| Breakdown 50–58 s | 0.223 | 0 | 0.478 | 0 | 0.023 |
| After 70–75 s | 0 | 0 | 0.026 | 0 | 0 |

- One drop detected at 30.13 s (the song drops at 30 s); none elsewhere.
- Reduced motion: 1 drop detected, swell 0, burst 0, mood 0.765 at 38 s, seam range in the drop 0.03.
- Captures: [intro](intro-10s.png), [late build](build-29s.png), [just after the drop](drop-31s.png) (ring burst), [drop section](drop-section-42s.png), [breakdown](breakdown-52s.png), [after](after-74s.png).
- Forced extremes (same throwaway build, values pinned): [idle](forced-idle.png), [night mood 1](forced-mood-1.png), [fog 1](forced-fog-1.png), [swell 1](forced-swell-1.png).
- **GPU** (no audio playing, [measurement](gpu-idle.json)): Standard 4.642 ms per frame, Low 3.057 ms. BR8 measured 4.7 and 3.0 ms: no meaningful change.

## Checks

- PASS: 328 unit tests, 8 new in `tests/bloomStructure.test.mjs`:
  - intro, build and one drop found at the right moments;
  - no drops or builds in steady music at any level;
  - warm-up and cooldown;
  - settling after silence;
  - idle is the approved look; loud sections and builds darken it; a drop clears the fog and bursts rings;
  - reduced motion;
  - Reactivity 0 and a new source;
  - aurora hue limits.

  `tests/bloomMusic.test.mjs` was updated for the seam and hit re-routing. Lint, typecheck, build and whitespace pass.
- PASS: `verify-bloom-br9.mjs` (all 9 checks, 0 runtime errors).
- PASS: `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- `verify-bloom-br8.mjs` is superseded for the seam and mid-hit checks, which describe BR8's routing. Its parallax checks still apply.

## Not tested

- Real songs. Thresholds were calibrated on generated songs through the real analysis. Commercial songs differ, so drops may be missed or found where you don't hear one. That needs your listening review.
- How dark the night mood should get, and how it feels over a whole song.
- Shared-tab capture natively.
