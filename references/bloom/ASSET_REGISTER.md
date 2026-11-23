# Asset register

| File | Origin | Status / intended use |
|---|---|---|
| bloom-comparison-concept.png | Generated earlier in this ChatGPT project conversation | Concept reference only; not a runtime asset |
| Owner-added JPEGs beginning `h4Wq72`, `rblopP`, `svH0FW` | Added by owner; creator, license and runtime rights not yet recorded | Concept references only; not loaded by ECHO. `h4Wq72` guides Lavender Peaks. |

No external runtime images, music or models included. Before adding any, record source URL/creator, license and attribution, modifications, file size and approval. Use only permitted test audio, preferably generated local tones or owner-authorized files. Never bundle captured content.

L01 adds original repository-authored `src/scenes/lavender-peaks/LavenderPeaksScene.tsx` geometry/GLSL and local CSS. It loads none of the JPEGs at runtime; no third-party art asset or new license is involved.

## P03a procedural runtime composition — 2026-11-16

| Source | Origin and terms | Size / approval / use |
|---|---|---|
| `src/scenes/bloom/BloomScene.tsx` | Original repository-authored geometry and GLSL; no copied image/model assets or external attribution requirement. Project licensing applies; no new license assigned. | 7,132 bytes at P03a capture; owner approved procedural composition implementation. Sky/lake gradients, static analytic reflection, mountain Shapes and torus segments; visual acceptance pending. |
| `src/scenes/bloom/bloom.css` | Original repository-authored presentation; project licensing applies. | 1,130 bytes; sparse labels and responsive viewport styling. |

Reference board remains conceptual only and is not loaded at runtime. Runtime geometry/materials are declaratively owned by React Three Fiber and disposed on unmount. No downloaded textures, fonts, models or generated raster assets. Screenshot evidence is local under ignored `.playwright-mcp/`; no media capture content included.

## P03b motion update — 2026-11-16

Same original procedural geometry/materials; no additional runtime assets. `BloomScene.tsx` adds bounded halo drift and matching reflection offsets, slow lake phases and reduced-motion handling. Owner approved implementation; motion acceptance pending. Current scene source size: 8669 bytes. P03a sizes above remain historical capture measurements.

P03b visibility tuning (2026-11-16): adjusted numeric drift/ripple constants after owner feedback; no new assets. Current scene source: 8669 bytes.

P04 (2026-11-16): same original procedural scene; added original `reactivity.ts` mapping helper and a CSS Reactivity control. No new runtime images, models, textures or captured media. Generated-tone screenshot evidence stays in ignored `.playwright-mcp/`; owner P04 visual acceptance pending.

## P05 evaluation inventory — 2026-11-16

P03a static and P03b motion were owner accepted; P04 was accepted as passable after tuning. P05 preserves those visuals. Current procedural Bloom sources total 14,326 bytes; no runtime texture/image/model/font/audio payload. Measurement UI/probe has no visual art assets. Generated 45-second WAV is written to the OS temporary directory for tests and is not a captured or bundled production asset.

Production build totals 1,162,425 raw bytes / 316,683 gzip level 9 bytes including rendering libraries and the standalone HTML tone fixture. Installed runtime/peer license labels are MIT except ieee754 (BSD-3-Clause); no root LICENSE file found. Inventory details and actual measurement environments are in `docs/EVALUATION.md`. This records provenance, not a publication licensing audit.

## C01 Crimson Horizon — 2026-11-16

Original repository-authored `src/scenes/crimson-horizon/CrimsonHorizonScene.tsx` geometry/GLSL and local CSS. The owner approved using the `rblopP` JPEG as a conceptual direction only. No runtime texture/model/font/image payload or new third-party art license. Reference provenance remains unverified; the JPEG is not loaded by ECHO.

C02 replaces Crimson Horizon's flat procedural terrain with original closed triangulated surfaces, generated face colors/normals and a sphere sun. No external models, textures or reference JPEGs are loaded. New scene-local terrain and camera-motion helpers are repository-authored; ownership/disposal stays local to the mounted scene.

C03 adds original repository-authored seeded 2D gradient/ridged multifractal noise and a custom artistic GLSL terrain material. No copied library source, texture/model asset or new runtime dependency; the supplied JPEG remains reference-only. Ridged multifractal feedback follows the general method described in libnoise documentation, implemented locally rather than importing its C++ code.


## Bloom BL02 — 2026-11-23

Original repository-authored procedural mountain banks (`src/scenes/bloom/mountains.ts`) interpolate the existing authored ridge profiles through depth with bounded folds, indexed closures, normals and vertex colors. No downloaded model, texture, new generated image or external code asset. Existing comparison board remains conceptual; new monolith/aurora direction is defined in the written roadmap. Scene-local static materials/fog reuse installed Three.js.

BL02 ridge/shore refinement uses repository-authored monotone cubic interpolation and broad analytic spurs/toe shaping; no external code/art assets or runtime textures.

BL02 depth/material/portrait pass adds authored shoulder height fields and baked vertex colors using normals/curvature and broad analytic variation. No new asset, texture, model or external shader code.

BL02 further range sculpting reauthors existing profile heights and adds analytic drainage/cavity shaping. Original procedural work only; no new art assets or dependencies.


## Bloom BL03 — 2026-11-23

Repository-authored box/plane monolith geometry, static rough material and analytic projected lake silhouette/seam shader. No downloaded model, texture, generated bitmap asset, new dependency or render-target capture. Existing conceptual reference limitations remain.

BL04 auroras are original analytic GLSL folds and shared scalar/color animation, rendered in existing sky/lake passes. No raster/model/texture download, new art dependency or captured media.

## BL03 stone correction reference and runtime assets — 2026-11-23

Owner supplied `e9db88c2-38de-4c1f-a9d2-f061b5053b89.png` as the approved Resonant Monolith conceptual reference. Creator/license beyond owner supply is not independently established; image is used only for local visual comparisons, never imported as a runtime texture. Original repository-authored cross-section bevel/groove geometry, two asymmetric faceted fragments and procedural GLSL stone material replace the plain box/glow overlay. No downloaded texture/model, generated raster production asset, dependency, shadow or render target. Source helper follows installed Three.js r186 WebGL material compile hooks; see official `Material` onBeforeCompile/customProgramCacheKey documentation.

## BL05 procedural trails — 2026-11-23

Original repository-authored terrain triangle interpolation, two bounded world-space downhill routes and analytic GLSL core/halo/travel profiles in `src/scenes/bloom/trails.ts`. One batched ribbon mesh, no downloaded texture/model, generated bitmap runtime asset, added dependency or new light/shadow. Existing owner-supplied concept remains comparison-only. No audio captured or recorded; demonstration video contains only authorized ECHO scene pixels from an isolated deterministic visual clock.

## BL06 Music Intelligence integration — 2026-11-23

No new visual assets or dependencies. Existing authored procedural geometry/materials now receive scene-local MusicFeaturesV1 controls and matching analytic reflections. Controlled tone spectra and a locally generated WAV provide test input; no captured/owner media is inspected, recorded or shipped. New scalar histories retain only calibrated six-band values/times/rises, never media. Supplied monolith reference remains conceptual and is not loaded at runtime.
