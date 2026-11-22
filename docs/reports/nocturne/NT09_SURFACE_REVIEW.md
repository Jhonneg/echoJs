# NT09 — wet-surface and local material assessment

Verified 2026-11-22 after owner “proceed” following NT08. **The existing surface response is sufficient; no production change is warranted.** NT09 retains the wet-floor shader, wall materials, fixture mappings, geometry, camera and global lighting. Owner environment/music/device acceptance remains pending; NT10 is not started.

## Current implementation audit

The repository began clean at `f0485eb391e32bcf1654bb33f2bae33f99ef958d` (“started nt08”), containing the completed NT08 source. All89 source files remain byte-identical to this commit.

- `LightingDriver.tsx` applies final per-fixture material and point values at useFrame priority-1, before camera/render and the planar reflection. No surface-specific audio calculation is needed.
- `WetGround.tsx` uses Three.js r186 Reflector with a custom shader. Its onBeforeRender renders the current scene through a reflected camera into its existing target, hiding the reflector itself during that pass. [Reflector documentation](https://github.com/mrdoob/three.js/blob/r186/docs/pages/Reflector.html); installed source `node_modules/three/examples/jsm/objects/Reflector.js`, lines116–250, confirms ordering/render behavior. Context7 checked the r186 addon/custom-shader/render-target interface.
- Five weighted texture taps soften the reflected image; static spatial noise varies wet patches, Fresnel strength, edge attenuation and subtle UV distortion. There is no time/audio uniform and no moving water deformation. Uniforms are only `color`, `tDiffuse`, `textureMatrix`, `texel`.
- The plane stays at y.016, size5.36×60, original placement. At1440×810 the measured target is1007×567 Standard and512×288 Low, with texel size adjusted accordingly. Existing quality bounds are unchanged.
- `WallSurface.tsx` supplies industrial metal/concrete bump and roughness maps. `ArchitectureDetails.tsx` supplies existing steel/frame surfaces; their normals/materials receive the existing local point lights. No new emissive edge material is needed.
- `visualState.reflections` records derived final source levels, while the actual floor samples the rendered scene. Feeding that record into another intensity multiplier would duplicate the response rather than close a missing interface.

## Controlled checks and screenshots

[Isolated diagnostic metadata](../../evidence/nocturne/nt09/surfaces/verification.json) retains32 fixed-camera captures. The harness copies the app to a temporary directory and overrides final outputs only in that copy: every unselected fixture and all atmosphere outputs are0. It then delivers the selected real material/point values through the normal adapter. Separate controls hide the reflector or disable only the selected spill light. These controls are not added to production.

Both Standard/Low cover main magenta and approved cyan at0/.25/.75, reflection-disabled and spill-disabled pairs, both violet banks, cyan windows/details, and bridge sections0/5. Bridge controls retain the actual mean-driven point: one section.48 gives point(.48/6)×40=3.2. Two reduced-motion static captures verify the existing floor appearance has no separate motion path.

| Evidence | Image |
| --- | --- |
| All fixtures off | [Off](../../evidence/nocturne/nt09/surfaces/standard-off.png) |
| Cyan fixture and real local surface influence | [Cyan on](../../evidence/nocturne/nt09/surfaces/standard-cyanPanel-0.75.png) |
| Same cyan fixture, reflector hidden | [Point-lit floor remains, broken mirror image removed](../../evidence/nocturne/nt09/surfaces/standard-cyanPanel-no-reflection.png) |
| Same cyan fixture, spill disabled | [Reflected emitter remains, local wall illumination removed](../../evidence/nocturne/nt09/surfaces/standard-cyanPanel-no-spill.png) |
| Main magenta | [Magenta on](../../evidence/nocturne/nt09/surfaces/standard-magentaMain-0.75.png) |
| Near violet detail | [Violet](../../evidence/nocturne/nt09/surfaces/standard-violet.png) |
| Built production, original controls | [Cyan on](../../evidence/nocturne/nt09/production/standard-cyan-on.png), [off](../../evidence/nocturne/nt09/production/standard-off.png), [portrait](../../evidence/nocturne/nt09/production/portrait-cyan-on.png) |

Browser inspection confirms a broken cyan vertical reflection on the wet foreground, gradual surrounding pool and local wall/curb detail. Magenta has its own pavement color and right-wall influence. Hiding reflection and disabling spill change different parts of the result, establishing their separate contributions. The fixed dark alley remains readable with all selected fixtures off; no global exposure increase or postprocessing change is involved.

The uninstrumented built-production harness retains9 captures: idle, Standard/Low magenta/cyan on/off, wide and portrait cyan. Four cyan-on/off production images are pixel-identical to their isolated diagnostic equivalents. Manual Magenta retains its original atmosphere weighting, so production magenta is visual smoke; the atmosphere-frozen diagnostic is the causal comparison.

All images show only the generated app scene. No private/captured audio or screen-share content is inspected or persisted. This phase does not record a new music clip: the unchanged NT08 generated clips remain available in the [NT08 report](NT08_VIOLET_REVIEW.md). NT09 evidence specifically tests final fixture-to-surface delivery, rather than repeating DSP validation.

## Pixel evidence

[Comparison JSON](../../evidence/nocturne/nt09/comparison.json) defines fixed floor/wall crops and retains measurements. Camera remains(0,1.6,5), viewport1440×810, with no pointer offset. Floor crop is550×180 at(460,530), entirely below the distant opening. Measurements are8-bit display RGB, not physical radiance or a claimed linear exposure response.

For magenta, the color score is(R+B)/2−G; for cyan it is(G+B)/2−R, averaged over the same pavement crop. Background values include the existing environmental fill. Ordering is what is tested:

| Quality / fixture | Off | Level.25 | Level.75 |
| --- | ---: | ---: | ---: |
| Standard magenta | .227 | 2.605 | 7.825 |
| Low magenta | .232 | 2.603 | 7.816 |
| Standard cyan | 3.483 | 6.235 | 11.222 |
| Low cyan | 3.475 | 6.236 | 11.252 |

At level.75, toggling the reflector changes74,552 magenta floor-crop pixels and63,086 cyan pixels in Standard; maxima17/91 RGB steps respectively. Low also shows a clear contribution. Disabling spill changes21,340 right-wall pixels for magenta and3,306 left-wall pixels for cyan in Standard. Wall crops exclude the emissive fixture faces. Existing bright local highlights are retained; no new brightness gain is introduced.

Every selected material is verified at its final level×1.3, all other emitters/points are0, and atmosphere remains0 throughout causal captures. Static Standard/reduced cyan and off floor crops match exactly. Both qualities retain114 renderer geometries and6 tracked textures; all7 original points remain unchanged.

## Limits and decision

The sampled floor shows near violet, windows and small-panel influence; the distant left violet contribution is much weaker, particularly at Low resolution. Bridge sections0/5 produce the same floor-crop result at equal level because this crop sees the shared mean-driven spill, without a visible reflected head. Geometrically, the mirror of a strip center(y4.13,z−7.1) through floor y.016 lies around screen y875 in the810-high fixed view, below the viewport. This approximate projection explains the limit; it is not a GPU measurement. Do not add a fake traveling floor streak or move the camera to force visibility.

These limits do not prevent credible local material/reflection response. Keep all current production coefficients, masks, blur, roughness/bump and fixture bindings. The roadmap explicitly calls for inspecting the existing reflection before adding shader complexity; that assessment finds no missing functionality to implement here. This phase is verified reuse, not a new shader feature or a redesign.

No production runtime cost is added: source bytes, render passes, allocations and light inventory remain unchanged. Headless screenshot/counter checks do not verify owner-device frame rate, comfort or physical audibility. Full-song/native/device and grouped environment acceptance remain manual pending.

## Files and verification

Added only:

- `scripts/verify-nocturne-surfaces.mjs`: temporary final-output/contribution diagnostics.
- `scripts/verify-nocturne-surface-production.mjs`: built-production original-control smoke captures.
- `scripts/compare-nocturne-surfaces.mjs`: fixed-crop measurements, delivery checks, exact production/static pairs and source preservation against f0485eb (ECHO_NT09_BASELINE override supported).
- This report, NT09 evidence and updates to progress/roadmap/mapping/migration/architecture/decisions/verification documentation.

Passed all38 test files, lint, typecheck via build and production build; existing bundle warning remains (JS1,238.61 kB/gzip344.72 kB). Both browser runs have no console/runtime errors. Comparison passes local influence/monotonic ordering, independent reflection/spill contributions, reduced static parity, four production image matches and all89 source hashes. No unit tests were added for unchanged production code.

Next action: owner reviews these captures, then authorizes NT10 slow atmosphere/depth. NT09 does not authorize it automatically. No commit, push or deployment. Suggested verification-only commit after authorization: `Verify Nocturne local wet-surface response`.
