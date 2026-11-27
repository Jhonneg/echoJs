# Bloom — art direction (approved conceptual direction)

> **2026-11-26: Bloom is being rebuilt.** The active Bloom reference is `references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png` (Resonant Monolith): a tall cracked monolith with a bright seam hovering over a still lake, jagged snow-capped ranges in misty layers, vertical green and pink aurora, glowing valley rivers, and saturated lavender, pink and teal light. See [BLOOM_REBUILD_ROADMAP.md](BLOOM_REBUILD_ROADMAP.md). The Bloom sections below describe the previous scene and are superseded for current work.

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

Crimson sun glow (2026-11-27): owner chose a clearer resting sun. At rest the sun shows at 20% of its full colour (superseding C04's faint 5.5%), with a soft dark-red sky halo and a hot magenta glow on the far slopes around its base, both growing with the existing sun activity. The foreground stays dark; the sun remains the brightest shape.

Crimson rim lines (2026-11-27): owner approved steady crimson rims on the mountains, superseding "selected thin crimson crest/slope highlights" as the resting look: a thin backlight along crests and outlines that turn edge-on while facing the sun, present at rest, slightly stronger with the sun's activity. The valley floor and foreground stay dark; music-driven contour lights remain on top.

Crimson darker values (2026-11-27): owner chose a moderate darkening of the terrain's base shading, partly reversing the 2026-11-16 readability lift: valley floor and foreground about half their former brightness, mountains slightly less darkened, so the terrain is darker than the nightshade sky and reads as silhouettes. The rims, sun glow and music lights carry readability. Hue, sky and sun are unchanged.

Crimson sun cut (2026-11-27): owner chose reference-like occlusion. A distant ridge in front of the sun overlaps about a quarter of its visible disc with irregular peaks and a V where the valley opens, never covering its top half, replacing the straight cut by the far valley floor. It shares the far mountains' dark base, crimson rim and sun-base glow.

## Nocturne — Industrial Crossing N01

Owner-supplied Industrial Crossing board guides a genuine 3D narrow industrial alley with a stationary perspective view. N01 uses a 6 m alley, 52 m depth, 14–22 m building masses, camera height 1.6 m/FOV 50°, crossing underside clearance 4.5 m. Dim neutral fill is an approved temporary composition aid. Compare bridge prominence, converging walls, foreground road and distant gate before detail or reactive lighting. Later phases introduce magenta fixtures, cyan windows, violet accents, corresponding wet-floor reflections and atmospheric depth. No camera travel, pointer motion or bass roll.

Nocturne mouse-camera refinement (2026-11-16): owner approved Crimson-style bounded mouse parallax, superseding N01's pointer-motion restriction. Retain the neutral camera framing and fixed forward position; allow ±1.6 m horizontal/±0.85 m vertical displacement with return on leave/blur and centered reduced motion. Architecture remains stationary.

Nocturne parallax reduction (2026-11-16): owner found the full Crimson offsets excessive in the narrow alley. Scale Nocturne camera displacement to 25% (±0.4 m horizontal, ±0.2125 m vertical), retaining the 180 ms smoothing, fixed forward position, neutral target and reduced-motion/return behavior. This supersedes the full-range Nocturne offsets above; Crimson stays unchanged.

## Nocturne N02 — industrial geometry and static materials

Owner approved recessed service door bays/shutters, window matrices, vents, selective pipes/conduit, sagging overhead cables and unlit fixture housings. Add bridge underside ribs, curb drains, gate bars and restrained asphalt repair patches. Use dark rough steel, darker recesses and muted blue-black glass, all non-emissive. Repeated parts are instanced by finish. Preserve accepted alley/camera proportions and subtle parallax; neutral review lighting remains until N03. Wet reflective puddles, haze and postprocessing belong to N04.

## Nocturne N03 — independent manual lighting

Separate emissive magenta fixtures/bridge, cyan windows/panels and thin violet strip surfaces. Each group has independent 0–100% manual control and two bounded point lights for representative local spill (six total, no shadow maps). All groups start at 100% for the lighting preview; all-off leaves only faint neutral architectural readability. Zero group level gives exactly zero emission and point-light intensity; other active groups may still illuminate the inactive fixture surfaces. Emitter diffusers use dark nonmetallic bases to retain saturated color under neighboring light spill. Small cyan panels moved above vents (y=4.75 m) and shortened to clear the overlap revealed by lighting. Keep accepted subtle camera parallax; no bloom, fog, reflections, flicker or audio mapping in N03.

## Nocturne N04 — wet ground and distant atmosphere

One planar scene reflection supports a thin wet film and irregular puddles over the asphalt. Stable world-space noise breaks up opacity and slightly distorts the reflection; view angle and a small spatial filter keep it from reading as a polished mirror. Keep visible patches of dark asphalt and reserve bright reflections for the active sources. Reflect actual geometry/illumination through the accepted pointer-camera range.

Linear distance fog and a soft gate-local halo establish depth. During the manual preview, active magenta/cyan/violet levels tint the atmosphere and gate together (cyan carries the strongest weight); all-off removes their colored glow. This preview is not audio-driven. The gate is softly emissive behind its existing bars. No full-screen bloom or animated water is needed for N04; keep architectural surfaces and camera response intact.

Nocturne wall-material correction (2026-11-17): owner found the walls clay-like and approved panel seams, subtle grain and roughness variation. Replace only the uniform building-mass finish with alternating dark coated metal and cast concrete. Use shallow seams/fine bump, restrained per-panel value variation, vertical wear and local metal highlights; concrete stays duller. World-scaled four-metre texture repeats keep detail consistent across wall heights. Retain the accepted camera, geometry proportions, lighting, wet ground and atmosphere.

Owner wall-material acceptance (2026-11-17): “looks way better now” accepts the industrial wall surface correction. Retain these metal/concrete finishes as the current wall baseline.

Nocturne N05 (2026-11-17): default Audio mode lights the accepted scene from the existing bass/midrange/treble features, with independent smooth band responses and restrained onset accents. Existing overall atmosphere controls the cyan-weighted gate and haze independently of band hue. Silence/pause fades the scene to its near-black architectural baseline; zero Reactivity removes audio illumination immediately. Reflections follow actual material/light changes in the same frame. Retain Manual preview for isolated comparison and all-on/off review. No camera/architecture movement, material redesign, random flashes or new postprocessing. Musical feel requires owner review.

Nocturne flash correction (2026-11-17): owner requested immediate musical flashes rather than gradual group illumination. Magenta/cyan/violet fixtures now switch to their Reactivity-scaled peak on attacks, hold briefly and cut fully off; sustained tones do not keep them illuminated. Corresponding spill and wet reflections share the sharp changes. Keep the gate/haze smooth, Manual preview intact and reduced-motion lighting gradual.

Nocturne idle readability and slower flashes (2026-11-17): owner requested less rapid flashes and a clearer silent scene. Use longer 200–280 ms holds with at least 650 ms between retriggers per group. Raise only the existing neutral hemisphere fill from 0.85 to 2.2 and directional fill from 0.45 to 0.9. Walls, crossing, vents, curbs and wet ground should remain legible without music, while reactive emitters and their colored spill stay off. Retain industrial materials and dark night mood.

Nocturne smooth-response clarification (2026-11-17): owner requested quick smooth illumination rather than timed flashing. Band brightness now tracks existing energy/accents continuously with a faster rise than the first N05 response and a soft release. Retain the lifted neutral idle lighting and accepted industrial/wet-ground appearance. No periodic flash holds or retrigger gaps remain.

Owner response acceptance (2026-11-17): “tested, looks good” accepts the current quick smooth lighting response and brighter idle appearance. Retain this treatment as the Nocturne baseline; further response tuning requires a new owner request.

Nocturne left cyan fixture (2026-11-22): owner visually approves the single recessed vertical fixture, local wall spill and wet-pavement reflection at the accepted left near-midground placement. Preserve its geometry, color, camera relationship and lighting footprint. Music-reactivity review is separate; no additional fixture or global-lighting change is authorized by visual approval.

## Planned Crimson-first animation expansion — 2026-11-18

Owner chose expressive/controlled expansion while retaining each landscape's atmosphere. [ANIMATION_REFINEMENT.md](ANIMATION_REFINEMENT.md) records Crimson as pilot with subtle coherent bank deformation, localized ridge/sun accents and slow haze, subject to feature-quality and scene-specific reviews. Preserve the burgundy valley, nightshade sky, pink sun, open corridor and camera character. Other landscapes retain their current identities, including Lavender's silhouettes/shared depth motion and Nocturne's stationary industry/smooth illumination/idle readability. This is a design direction, not evidence of newly implemented or visually accepted effects; no current palette, material or geometry baseline changes here.

Crimson star visibility follow-up (2026-11-22): owner approved slightly larger/brighter existing sky specks and faint resting visibility. Preserve sparse Standard/Low selection and dark pink nightshade palette; existing air accents brighten the same stars. No additional particles/bloom or sun/camera changes. Approved by owner “looks better now” (2026-11-22).


## Bloom Resonant Monolith — BL02 composition checkpoint (2026-11-23)

The owner-approved [new Bloom roadmap](BLOOM_RESONANT_MONOLITH_ROADMAP.md) supersedes earlier flat-mountain-only constraints for Bloom. BL02 implements genuine static3D banks while retaining the halo and analytic reflective lake temporarily. Keep orthographic, level framing, asymmetric broad ridges, matte lavender/indigo slopes, fading depth and open water. Avoid channel-like enclosing walls: taper inner shores below frame and place the foreground descent behind the existing water plane. Bright hero/reflection stay focal; mountain volume remains readable in silence. BL02 artistic approval is pending; monolith/aurora/trails are later gated phases. Other landscapes' approved directions are unchanged.


BL02 owner-requested shape refinement: favor rounded irregular shoulders, secondary spurs and uneven saddles over straight pointed ramps. Keep a shallow toe meeting the lake, with closure walls buried below view. This first pass changes ridge/shore shape only; further material/depth/framing changes require their own review.


BL02 remaining mountain refinements (owner continuation,2026-11-23): cool faint distance, darker middle slopes and restrained near shoulders separate depth; broad matte face variation and selected crest tint replace uniform soft gradients. Connected asymmetrical inner shoulders stay recognizable in portrait without changing the level orthographic camera or crowding the halo/lake opening. These remain within the mountain review; BL03 is not started.


BL02 further owner-requested improvement: prefer visibly overlapping ranges, offset substantial middle peaks and connected drainage valleys over a continuous soft wall. Reserve the brightest feature for the hero; maintain misty distance, dark readable rock and open lake/halo space. No extra decorative objects or noisy fine rock texture.


## Bloom BL03 monolith composition checkpoint — 2026-11-23

Owner approves replacing the segmented halo with a tall solid graphite slab, restrained yaw exposing one side, authored resting hover and one narrow rose seam with a dark inset border. No small floating fragments in this first composition. Preserve the approved mountain range and open lake; monolith and its broken dark/seam reflection become the focus. No circular ring remains except subtle waterline ripples. Hero is static until later MI work. BL03 appearance/reflection require owner review before auroras.


BL04 aurora checkpoint (2026-11-23):2restrained mint/lavender/rose shader curtains frame the approved static monolith, reduced to1at Low quality. Favor soft ribbons and faint folds over regular grey bars, particles or a bright sky wash. Their shared ambient color gently reaches rock, stone, haze and lake; geometry/beam/camera stay fixed. Autonomous movement is slow and freezes under reduced motion. Owner review required before BL05.

### Bloom post-BL04 BL03 owner correction

The owner-supplied `references/bloom/e9db88c2-38de-4c1f-a9d2-f061b5053b89.png` now guides the hero: a dark graphite front, visibly lighter lavender right side, restrained stone fractures/grain and chamfered edges, with a narrow rose seam cut into the solid. Two small, unequal angular stone fragments hover asymmetrically, larger left/mid-height and smaller right/lower. Retain the current camera, BL02 terrain and BL04 auroras rather than copying the reference's terrain/trails/sky. Revised browser evidence awaits owner review; conceptual realism is a direction, not an exact raster match.

### Bloom BL05 trail checkpoint

Two sparse asymmetrical light paths descend from the existing shoulders toward the lake: rose on the left, mint on the right. Low retains only the rose path. Follow the rendered terrain, with narrow antialiased cores, restrained soft halos, feathered endpoints and offset traveling highlights; preserve the monolith as the brightest focal point. Portrait naturally crops the upper route sections rather than reframing the camera. Motion is autonomous until BL06; reduced motion holds a static glow. Current matched-phase browser screenshots/video await owner visual review.

Lavender startup sun visibility follow-up (2026-11-23): owner requests further reduction of the mountain covering the sun. Lower only far-ridge peak x1.6 amplitude3.7→3.2, exposing the upper disc immediately. Preserve its width/base/detail, other ridges, sun position/size/corona/pulse and camera. This supersedes the earlier3.7 startup-peak amplitude; natural occlusion during terrain travel remains.
