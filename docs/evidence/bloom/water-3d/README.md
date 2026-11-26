# Bloom 3D water — owner review

2026-11-24. The owner approved the3°orthographic camera proposal. Focused water implementation is complete; owner visually approved the result (“looks good now,”2026-11-24). No BL09/APP02, commit or push.

## Review media

- [Before/after](comparison.png), [matched resting/moderate/energetic cases](matched-states.png), [Standard/Low](quality-comparison.png).
- [15s fixed-camera demonstration](current/water-demonstration.mp4): 0–3s gentle ambient,3–6s strong aurora,6–9s isolated expanding ring,9–12s neutral shading,12–15s wireframe. Annotated controlled inputs;12fps state sampling, no audio. The last two sections are temporary diagnostics only.
- [6s mouse-parallax demonstration](current/mouse-parallax.mp4): bounded horizontal/vertical motion, moving stone fragments and projected lake reflections.
- [Low-quality water/ripple film](current/low-water.mp4).
- [Dedicated monolith hover/reflection film](smoke/moving-monolith-reflections.mp4):6s controlled authored lifecycle phase replay,8fps; measured hero vertical span.216world, maximum reflection NDC error1.60e−13. See smoke/capture.json for delivered values.
- [Resting](current/resting.png), [strong aurora](current/energetic.png), [qualified low onset](current/qualified-low-event.png), [ring at.5s](current/ripple-6.png), [ring at1s](current/ripple-12.png), [ring at1.67s](current/ripple-20.png), [neutral surface](current/neutral-geometry.png), [wireframe](current/wireframe-geometry.png). Desktop/wide/portrait pointer-corner frames are in current/.

Inputs/poses are repeated through the existing scene controller in disposable production builds; original camera0°,new approved3°. Films manipulate scalar test clocks/poses/events, never owner media or the analysis engine. Low-film ring uses an isolated downstream strength.8; the separate qualified-onset frame verifies the real controller→water path. These are visual demonstrations rather than native audio capture or real-song listening tests.

## Verified

- Replaced two-triangle flat card and four screen-space reflection draws with genuine horizontal GPU-displaced mesh, four unequal coherent waves, small warped noise, analytic normals, gentle specular/Fresnel and one capped planar capture. Palette/other content preserved. No per-frame CPU geometry rebuild or React state.
- Standard33153vertices/65536triangles; Low18721/36864. Near-origin spacing.125/.167 world units resolves the existing ripple packet; both remain3D. Ambient mesh-vertex heights over6s:−.07269..+.07127world, maximum local travel.13026world (~11.72px at desktop90px/unit), slope<.084. [Measurements and protected-source hashes](assessment.json).
- GPU float-framebuffer readback of the exact production field/gradient versus the CPU reference:256sample cases, max error1.3384e−7. No per-frame readback ships. Normal and neutral/wireframe footage verify geometry and surface motion instead of brightness alone.
- Qualified isolated low event delivers ringStrength.71222 and nonzero age to the actual lake material. Existing low event qualification/sequence/freshness/silence rules are unchanged. Water origin stays(.6,−.02,0), directly below the vertically moving monolith. Aurora/seam/trail material values remain final controller outputs.
- Installed orthographic reflection camera matches mirrored hero projection at all12responsive pointer-corner captures; maximum post-render NDC error5.18e−13. Source-triangle tests cover nine exact view angles and three hover heights. Intentional normal distortion changes reflected appearance around this aligned mean-plane image; this is not exact ray tracing of every wave.
- Reduced-motion clock remains exactly frozen over.8s; camera targets reset. Pointer leave selects neutral targets and interpolates back. Three full scene-replacement cycles and four Standard/Low cycles return stable9geometries/2textures/10programs in the instrumented build (diagnostic shader variants affect programs); no resource-count growth. Targets/material/geometry explicitly dispose.
-107pre-existing production sources preserve their SHA-256, including shared MI/audio, other landscapes, and Bloom music/lifecycle/mountains/stone/aurora/trails. Only BloomScene changes, obsolete reflection.ts is deleted, and WaterSurface.tsx/water.ts are added.
- PASS59test files, lint, TypeScript/build, whitespace. No runtime/WebGL errors in final browser run. Existing chunk-size warning remains; JS1298.59kB/363.97kB gzip. No dependency or shared-host edits.

## Measured rendering cost

Headless Brave production build on ANGLE/NVIDIA GTX1660SUPER,1440×900CSS. Standard DPR1 / Low.75. Three2s samples per condition, EXT_disjoint_timer_query_webgl2 around the complete nested render. CPU submission and frame intervals are separate from GPU query time. Draw/triangle probes include both passes (plain renderer.info resets during the nested reflection and undercounts the whole frame).

|Quality|Reflection|GPU median range(ms)|GPU p95 range(ms)|Total draws|Total triangles|
|---|---|---:|---:|---:|---:|
|standard|on|2.58–4.15|4.18–4.90|16|78774|
|standard|disabled for comparison|2.41–3.38|4.46–5.56|9|72156|
|low|on|1.01–2.40|3.41–4.38|16|41014|
|low|disabled for comparison|1.17–1.87|2.29–3.27|9|38940|

Final full-scene frame median16.7ms, p95≤17.2ms; CPU render submission median.1–.3ms. The reflection adds seven scene draws and one capped half-float color target (Standard936×585,Low512×320 here); measured GPU ranges overlap, so do not infer a precise marginal cost from differences of medians. Complete-scene GPU p95 stayed below4.9ms with capture enabled in these samples, supporting this bounded pass on this device. Vsync-limited short headless measurements do not certify native-window/browser/mobile performance or driver memory. The original rejected card had13draws; the new geometry is materially more expensive. Low reduces mesh, terrain/trails, target and DPR, rather than disabling geometric water.

## Reference comparison / owner gate

The supplied Monolith Lake recording shows fine broken reflections, continuous relief and broad rings. The reconstruction adopts those surface properties within Bloom's stylized palette and fixed composition; it does not reproduce the reference's objects/UI/free orbit. The camera proposal disclosed real framing shifts. Opaque world-space water now submerges formerly visible low foreground bank geometry that was below water; generators/materials stay untouched. Review that shoreline/foreground consequence as well as calmness, reflection contrast and ripple visibility.

Owner visual review is approved. Native mouse/performance feel and permitted real-song inspection remain unverified. Media contains only rendered application output and test annotations. The owner reference was visually inspected locally; no audio extraction, copy/upload or stored reference frames.

[Final browser report](current/capture.json), [focused hover report](smoke/capture.json), [implementation/design report](../../../BLOOM_3D_WATER_RECONSTRUCTION.md). `probe-first-attempt.json` records corrected harness issues: initial projection comparison ignored mirrored-camera handedness, then sampled its matrix one frame early. Final checks read after rendering; production reflection was unchanged by those probe fixes. Earlier synthetic attack indexing was corrected before final controller validation. Baseline source .txt files retain the original lake for reproducible comparisons, never imported into production.
