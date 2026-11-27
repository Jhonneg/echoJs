# Crimson Horizon — glow band under the sun

2026-11-27. Item 9 of the owner-requested review against the reference image: during the drop, stacked pink slivers appeared under the sun. The owner approved the plan and chose option **(b)**, one soft swell at the sun's base instead.

## Cause

- The bands are the music-driven valley waves (`valley.ts`). Each accepted bass hit launches a wave 72 m ahead, near the sun's base, which travels toward the camera at 30 m/s for 4.2 s. Up to four run at once.
- Far away the floor is seen almost edge-on, so a wave front there is a thin bright sliver.
- In the drop, with a kick every half second, three or four slivers stacked up with dark gaps between them.

## What changed

- **`valley.ts`:**
  - `WAVE_FADE` (near 35 m, far 55 m) and `waveVisibility()`, the tested twin of the shader's fade.
  - A `swell` value set on each wave launch (the wave's strength) that decays with a 0.5 s time constant (`SWELL_DECAY`). It is cleared in silence, at Reactivity 0, outside the public music profile and with reduced motion, exactly as the waves are.
- **`material.ts`:**
  - Wave head and tail light fade with distance (zero beyond 55 m, full by 35 m), so no far slivers are drawn.
  - The magenta sun-base glow adds `baseSwell × 0.6`.
- **`CrimsonHorizonScene.tsx`:** passes the swell to the terrain, scaled by Reactivity.
- **Unchanged:** wave launch timing, count, speed, lifetime, strength and colour, the sun, halo, rims and all earlier passes.

## Results

Before (commit 8813deb) → after, back-to-back runs with the generated song, including a burst of six frames in the drop.

- `drop-burst-before-top-after-bottom.png`: three drop frames each. Before, two or three stacked pink slivers sit under the sun. After, none, just a soft magenta swell at the sun's base on each kick.
- **Bright pixels (luma ≥ 90) in the strip just under the sun, per frame** (drop-hit, drop, six-frame burst):

| Run | Frames |
|---|---|
| Before, run 1 | 1381, 3203, 1160, 2226, 1262, 948, 1312, 2044 |
| Before, run 2 | 839, 1901, 878, 1453, 2397, 1253, 889, 1212 |
| After, run 1 | 609, 450, 653, 770, 817, 562, 506, 294 |
| After, run 2 | 543, 366, 640, 863, 846, 592, 796, 390 |

  That's about 1,500 → 600 on average (−60%). The remainder is the sun's lower edge and the base glow, which share the strip.
- **An honest finding: the waves were never visible on the near floor.** The centre of the near floor (y 560–740) measures 13.8–13.9 in every burst frame, before and after. By the time a wave reaches it, it has faded, or it lies outside its narrow channel.
  - So in practice the waves only ever showed as the far slivers. With this change the travelling fronts are visible only briefly, 35–55 m out, as they fade in.
  - The bass reads at the horizon through the swell instead. The middle floor strip still varies with the music: 20–28 after, against 19–33 before.
  - If the owner wants waves visibly rolling toward the camera, that would be separate tuning of their brightness and decay.
- **GPU** (ms per frame, median of 3, two alternated pairs): Standard idle 2.45, 2.41 → 2.47, 2.45; Low idle 2.09, 3.51 → 3.40, 3.35; Standard with music 2.02, 1.75 → 2.06, 1.74. Within noise; the Low idle values are noisy in both versions. These are headless measurements.

## Checks

- PASS: 361 unit tests, 2 new in `tests/crimsonValley.test.mjs`:
  - wave visibility is full near, zero far and monotonic, launches happen beyond the fade, and the shader uses the same numbers;
  - the swell rises on a launch, halves within half a second and settles to zero, and stays off at zero gain, with reduced motion or outside the public profile, including when switching to reduced motion.
- PASS: the shader-safety test, lint, typecheck, build, whitespace, `verify-crimson-candidate.mjs` (which inspects the live wave uniforms), `verify-app02.mjs` and `verify-app03.mjs`. The committed APP evidence was restored afterwards.
- Not tested: real songs, and the feel of the swell's timing.
