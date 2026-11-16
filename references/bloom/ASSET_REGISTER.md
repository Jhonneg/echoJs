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
