# Lavender Peaks — bigger, centred sun

2026-11-28. Run `node scripts/capture-lavender-sun.ts <scratch-dir> <before|after>`. It builds a throwaway copy of the app (no probes), selects Lavender Peaks and captures the opening view (1.5 s after selecting) and a reduced-motion still, at desktop 1440×900 and portrait 390×844. No audio. `before/` was captured before any code change.

## What changed

- The sun moves from (1.6, 1.9) to (0, 1.9), the horizontal centre, at the same height, and is twice the size. The disc edge goes from 0.65–0.78 to 1.30–1.56, the haze from 1.65 to 3.3 and the corona core radius from 0.75 to 1.5. Strand displacement in the shader is scaled 2×, so the wobble keeps its proportions; line widths are unchanged.
- One definition (`SUN`, `SUN_SHAPE`, `SUN_CENTER_GLSL` in `corona.ts`) now feeds the disc, the corona, the sky and ridge light, the atmosphere's emitter protection and the warm mist peak. Before, the centre was repeated in 7 places.
- The light the sun casts on the sky and ridges reaches 1.4× wider rather than 2×, so the ridges aren't washed out.
- The pulse with the bass, the occlusion by the ridges and the warm sky glow (already centred) are unchanged.

## Results

- `after/desktop-opening.png`: the disc is centred, with most of it above the ridges at load; the far peak covers its lower right.
- `after/portrait-opening.png`: centred, fully above the ridges.
- Lavender corona check (`verify-lavender-corona-noise.ts` and its assessment, both pointed at the new sun geometry): PASS. The strands' movement relative to the ring now matches the committed run: moderate 5.1% (was 5.1%), strong 7.1% (was 7.0%); 0 protected emitter pixels changed. A first attempt scaled only the resting amplitudes and failed (strong 4.2%), so the scaling moved into the shader. Running the check regenerates the committed `corona-noise/current` evidence; that was restored afterwards, as in earlier rounds.

## Limits

- Not checked: real songs, the owner's screen, GPU time (no new shader work beyond constants).
