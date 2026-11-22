# Nocturne left cyan fixture — composition review, 2026-11-22

## Matched browser captures

All frames are 1440×810, Standard quality, fixed centered camera, headless Brave through a local Vite server. Manual preview isolates the change: magenta 100%, original cyan/violet 0%; only the new panel changes between the last two frames. The original is reconstructed from `HEAD` versions of the Nocturne scene files in an isolated temporary copy of the otherwise current app. No user working-tree changes were reverted.

- [Original alley before the fixture](../../evidence/nocturne/cyan-panel/original.png)
- [Updated alley, left cyan on](../../evidence/nocturne/cyan-panel/cyan-on.png)
- [Updated alley, left cyan off](../../evidence/nocturne/cyan-panel/cyan-off.png)
- [All lighting groups off](../../evidence/nocturne/cyan-panel/silence.png)

The first implementation appeared as a horizontal high-wall bar. The revised single fixture is vertical, 1.75 m tall and 0.5 m along the wall, at left `z = -7.3`; the dominant right magenta diffuser is 2.95 m tall and 0.96 m along the wall. A reused dark recess and frame keep its face set into the wall composition. The nearby pipe no longer hides it. The existing low neutral fill still outlines the bridge, door bays and road when all groups are off. No camera, existing magenta fixture, global fill, bloom or postprocessing changes were made.

The panel's one point light is at `(-2.35, 2.65, -7.3)`, with full intensity 30, distance 9 and inverse-square decay. It produces localized cyan on the wall, conduit, vent and wet pavement in the on frame. The existing planar reflector shows the cyan streak; no new reflection pass was added. Comparing the final on/off PNGs with ImageMagick difference, mean normalized pixel difference is .232 in the left fixture crop, .121 across the left wall and .062 in the wet-floor crop, versus .006 at the dominant right-magenta crop. These are screenshot differences, not luminance or hardware-performance measurements. Browser console exceptions were absent in the capture metadata.

## Audio, checks and limits

The fixture consumes Music Intelligence `energy.six.highMids` (800–2500 Hz) for restrained sustain. A broad-mid onset event (250–4000 Hz) adds an accent only when a recent high-mid energy rise qualifies it. It has a separate scene material, point light and manual level; bass/magenta final brightness does not enter its response. Controlled tests cover silence, bass-only, low-mid-only, quiet/loud sustained high mids, one-frame high-mid attacks, mixed bands, independent magenta output, stale/session/zero-Reactivity and reduced motion. Reduced motion eases sustain more slowly and suppresses sharp accents.

`npm test` (33 files), lint, typecheck and production build passed. The existing large bundle warning remains. One additional shadowless point light and one instanced emissive finish add bounded scene cost; the existing reflector renders the result. No FPS claim was measured here. The headless captures establish visible composition and reflection at one viewport, not owner aesthetic acceptance, actual music timing, native tab sharing, audible playback or device performance. Owner visual and permitted-music review are pending. No further fixture is authorized.
