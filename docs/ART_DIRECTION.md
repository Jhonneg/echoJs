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

Use the owner-added misty lavender mountain image in `references/bloom/` as a conceptual starting point. This scene is an open, pale composition: warm cream light near the horizon, lavender sky, several ridges fading through atmospheric depth, and a stronger foreground silhouette. Keep negative space and tranquil pacing from ECHO's design pillars, but give this world its own palette and silhouette. It has no lake, halo or central object. L01 is static; motion and audio behavior follow only after visual review.
