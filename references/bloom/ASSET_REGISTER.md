# Asset register

| File | Origin | Status / intended use |
|---|---|---|
| bloom-comparison-concept.png | Generated earlier in this ChatGPT project conversation | Concept reference only; not a runtime asset |

No external runtime images, music or models included. Before adding any, record source URL/creator, license and attribution, modifications, file size and approval. Use only permitted test audio, preferably generated local tones or owner-authorized files. Never bundle captured content.

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
