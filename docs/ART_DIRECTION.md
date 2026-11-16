# Bloom — art direction (approved conceptual direction)

Ambient surrealism: a living album cover, not an explorable game world. Tranquil, ethereal, spacious, cinematic, mysterious. A wide reflective lake beneath soft twilight, distant layered mountains dissolving in mist, one fragmented luminous floating halo as the POC prop. Camera close to water; horizon around middle; open space; lake roughly half frame; restrained foreground silhouettes, sparse particles. Strong focal point and readable reflection; no UI competing with artwork. The owner favored tranquil reflective water and disliked a cluttered atmosphere reference; avoid dense fantasy objects, floating debris, busy flowers, loud neon and heavy bloom.

## Palette (approved working direction)
| Role | Hex |
|---|---|
| Midnight | #101322 |
| Indigo | #353451 |
| Lavender | #81769E |
| Dusty rose | #C69AB7 |
| Moonlight | #F6D5EC |

Muted surroundings; reserve bright values for the prop and reflection. Soft gradients, gentle atmospheric perspective, no photorealism requirement. Aim for tasteful color shifts within this palette.

## Composition layers
1. Sky/background: image texture or gradient; soft pink-lavender horizon.
2. Distant mountains: layered textured planes or simple silhouettes with depth.
3. Hero: segmented 3D luminous ring, graceful and not overly complex. Transparent/translucent look optional; cheap emissive material acceptable.
4. Lake: low-cost reflective plane/approximation, surface ripples and clear focal reflection.
5. Foreground: minimal silhouettes, sparse particles, optional modest fog.

Start with static composition, then ambient motion, then real audio. Fixed composition with limited camera drift; no freely explorable camera, full 3D landscape, detailed vegetation or complex clouds. Prefer simple assets/procedural shapes. Use only approved/licensed assets; record source and terms in references/bloom/ASSET_REGISTER.md. Ask owner before acquiring or generating a new asset if required. See references/bloom/README.md for reference limitations.

## Beyond Bloom
The halo is only an example prop, not the brand or scene engine. Future worlds should have distinct compositions, including ones without a central object (e.g. aurora, dunes, sea, tree, islands). Reuse rendering/audio infrastructure, never force the same prop or motion mapping on every scene. These are optional future possibilities.

## Lavender Peaks — first new landscape preview

Use the owner-added misty lavender mountain image in `references/bloom/` as a conceptual starting point. This scene is an open, pale composition: warm cream light near the horizon, lavender sky, several ridges fading through atmospheric depth, and a stronger foreground silhouette. Keep negative space and tranquil pacing from ECHO's design pillars, but give this world its own palette and silhouette. It has no lake, halo or central object. L01 established the static composition. L02 adds the owner-approved experiment: two ridges per depth group, moving sideways with bass (back), mids (middle) and treble (front). L03 replaces those pairs with one frequency band per ridge, from deep bass at the back to high treble at the front. Keep the camera and sky fixed.

Lavender Peaks sun refinement (2026-11-16): owner requested a faint warm sun behind the first large mountain. Place a fixed, softly feathered cream disc at (1.6, 1.9) in the sky, initially occluded by the far ridge. Its movement reveals the sun naturally; repeated mountains cover it again. Keep its contrast restrained within the pastel sky.

## Crimson Horizon — static composition preview

Owner selected the dark sun valley JPEG (filename beginning `rblopP`) and named the scene Crimson Horizon. A nearly black sky surrounds a large pale pink sun low in the center. Four asymmetric terrain layers form a jagged valley opening toward it, with broad dark foreground slopes and selective crimson faces along sun-facing edges. Distant terrain partially obscures the sun. Use soft localized glow, no heavy bloom. This is an approved palette variation for a distinct scene, not a change to Bloom's palette.

The first preview keeps terrain, sun and lighting static while inheriting shared camera roll. Preserve the valley opening and sun at desktop/portrait sizes; use procedural geometry/shaders and keep the JPEG conceptual only. Scene-specific audio motion requires a later task and owner review.

## Crimson Horizon C02 — full 3D valley

Owner requested full 3D and gentle mouse-following camera movement, keeping the supplied dark valley reference as the visual target. C02 supersedes the flat C01 terrain. Use a solid faceted mountain valley with raised ridges, visible side surfaces, dark rock, selective sun-facing crimson accents and a large luminous pink sphere. Preserve the distant sun and valley opening; avoid a noisy bright foreground. The camera shifts within a small range and looks toward the valley/sun, then returns to the central view. This approval is specific to Crimson Horizon; earlier scene camera choices remain intact.

Lavender Peaks sun pulse refinement (2026-11-16): the faint warm sun may gently expand and brighten with bass, retaining its fixed position, pastel contrast and mountain occlusion. Keep its baseline appearance in silence, reduced motion and zero Reactivity.

Crimson Horizon terrain/focus correction (2026-11-16): owner rejected the small jagged facets and flat-looking ground competing with the sun. Use continuous surface normals, broad outer mountain ridges and low foreground folds instead of fine serrations/random face patches. Keep low ground near black, reserve crimson accents for raised sun-facing slopes, add restrained cool fill for mountain volume, and enlarge the sun radius from 8.8 to 10.2. Sun remains the brightest focal shape; owner aesthetic acceptance is pending.

## Crimson Horizon C03 — ridged 3D visual study

Owner explicitly retained full 3D and perspective camera movement, approving ridged multifractal terrain and custom artistic shading before further audio work. This supersedes the smooth Gaussian terrain and the proposed silhouette alternative (which was not implemented). Use irregular connected ridge systems, asymmetrically shaped banks, a wide sun-framing valley and dark foreground folds. Preserve generous black sky; expand the authored world view with aspect ratio without stretching the sun.

The material is near-black with restrained stepped directional shading, selected thin crimson crest/slope highlights and distance-based red atmospheric separation concentrated toward the sun. Avoid diffuse red ground fill, specular/plastic materials, noisy triangle decoration and isolated rounded cones. Mouse viewpoint remains available; bass tilt and other Crimson audio effects are off for this milestone. Neutral, stationary screenshots establish the composition gate; owner sign-off is required before audio work resumes.

## Crimson Horizon C04 — nightshade journey

Owner requested more visible terrain, a nightshade sky instead of pure black, and an idle sun that brightens with the number of active audio bands. C04 supersedes C03's static-only restriction without recording aesthetic sign-off. Keep the asymmetric overlapping ridges, broad central valley and thin crimson accents. Lift the charcoal directional fill enough to reveal terrain depth; use a blue-purple sky gradient (approximately #100E20 overhead to #221A32 at the horizon). Match distant terrain to that sky and localize red haze around the sun.

Keep the sun's apparent size stable as terrain passes. Its idle disc retains 5.5% of the full pink color blended with the sky so it remains visible after playback stops; glow stays faint. More active bands reveal the pink disc and restrained glow. Avoid diffuse red terrain fill and specular materials. Fully 3D terrain continues indefinitely; the artwork remains the reference target, with owner acceptance pending.

Crimson sun pulse refinement (2026-11-16): strong bass hits briefly expand the pink sun up to 8% and its restrained glow up to 12%, with a modest brightness lift. Return to its existing size after each accent; retain faint idle visibility, valley occlusion and localized haze. Reduced motion suppresses this pulse.

Lavender initial sun reveal (2026-11-16): lower only the far ridge's large peak at x=1.6 from amplitude 4.8 to 3.7. The upper sun arc should peek above the ridge on load while most of the disc remains hidden. Preserve sun placement/size, other mountains and movement. This supersedes the earlier fully covered initial disc.

Crimson terrain readability correction (2026-11-16): owner still found the landscape too dark. Raise the terrain's charcoal base and directional contrast, add restrained cool sky fill on upward-facing slopes, and keep selected crimson crests more visible at idle. Preserve the nightshade sky, localized red haze and sun hierarchy; no global exposure or diffuse red wash. Terrain must remain readable without music.

Crimson gray-fill correction (2026-11-16): owner rejected the cool brightness lift because the terrain became gray. Replace the blue-gray base/fill with deep burgundy shadows and warm directional shade separation. Strengthen narrow crimson highlights for visibility rather than broad neutral illumination. Nightshade sky, sun and motion remain unchanged. This supersedes the cool-fill choice above; owner palette review remains pending.

Owner acceptance (2026-11-16): “looks good now” confirms the corrected burgundy/crimson terrain palette and readability. Retain this treatment as the current visual baseline.

## Nocturne — Industrial Crossing N01

Owner-supplied Industrial Crossing board guides a genuine 3D narrow industrial alley with a stationary perspective view. N01 uses a 6 m alley, 52 m depth, 14–22 m building masses, camera height 1.6 m/FOV 50°, crossing underside clearance 4.5 m. Dim neutral fill is an approved temporary composition aid. Compare bridge prominence, converging walls, foreground road and distant gate before detail or reactive lighting. Later phases introduce magenta fixtures, cyan windows, violet accents, corresponding wet-floor reflections and atmospheric depth. No camera travel, pointer motion or bass roll.

Nocturne mouse-camera refinement (2026-11-16): owner approved Crimson-style bounded mouse parallax, superseding N01's pointer-motion restriction. Retain the neutral camera framing and fixed forward position; allow ±1.6 m horizontal/±0.85 m vertical displacement with return on leave/blur and centered reduced motion. Architecture remains stationary.

Nocturne parallax reduction (2026-11-16): owner found the full Crimson offsets excessive in the narrow alley. Scale Nocturne camera displacement to 25% (±0.4 m horizontal, ±0.2125 m vertical), retaining the 180 ms smoothing, fixed forward position, neutral target and reduced-motion/return behavior. This supersedes the full-range Nocturne offsets above; Crimson stays unchanged.

## Nocturne N02 — industrial geometry and static materials

Owner approved recessed service door bays/shutters, window matrices, vents, selective pipes/conduit, sagging overhead cables and unlit fixture housings. Add bridge underside ribs, curb drains, gate bars and restrained asphalt repair patches. Use dark rough steel, darker recesses and muted blue-black glass, all non-emissive. Repeated parts are instanced by finish. Preserve accepted alley/camera proportions and subtle parallax; neutral review lighting remains until N03. Wet reflective puddles, haze and postprocessing belong to N04.

## Nocturne N03 — independent manual lighting

Separate emissive magenta fixtures/bridge, cyan windows/panels and thin violet strip surfaces. Each group has independent 0–100% manual control and two bounded point lights for representative local spill (six total, no shadow maps). All groups start at 100% for the lighting preview; all-off leaves only faint neutral architectural readability. Zero group level gives exactly zero emission and point-light intensity; other active groups may still illuminate the inactive fixture surfaces. Emitter diffusers use dark nonmetallic bases to retain saturated color under neighboring light spill. Small cyan panels moved above vents (y=4.75 m) and shortened to clear the overlap revealed by lighting. Keep accepted subtle camera parallax; no bloom, fog, reflections, flicker or audio mapping in N03.
