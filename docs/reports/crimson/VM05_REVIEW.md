# VM05 — Atmospheric intelligence

Status: **IMPLEMENTED — AWAITING OWNER REVIEW**.

Existing slow context drives two bounded scene-only values:

- Density target = (.65 × intensity + .35 × activity) × Reactivity.
- Warmth target = intensity × brightness × Reactivity, only while brightness is valid.

Both use2s rise/4s release; reduced motion uses4s/6s. Existing context haze now shares the density envelope rather than its former250ms scene follower. Invalid/stale/inactive data, Legacy profile and zero gain return gradually to the baseline. No individual onset drives these values. There is no auto exposure or adaptive MI normalization.

The sky receives a small horizon-weighted oxblood/pink lift. Warmth adds a restrained warmer tint, leaving the upper sky largely unchanged. Terrain gains at most18% extra distant haze after25 units and fades into the same atmospheric sky color at the streamed far boundary. Reactive ridge/ground/glint emissions remain after the depth mix, preserving their contrast. No overlay fog plane covers the sun; its shader/body/corona/activity glow are unchanged. Camera, travel, geometry, other worlds and shared audio processing are preserved.

## Evidence

- [Silence](../../evidence/crimson/vm05/vm05-silence.png), [quiet](../../evidence/crimson/vm05/vm05-context-0.2.png), [dense](../../evidence/crimson/vm05/vm05-context-1.png)
- [Generated renderer checks](../../evidence/crimson/vm05/vm05-verification.json), [production regression](../../evidence/crimson/vm05/vm05-public-verification.json)

`npm test` includes proportional bounds,30/60/120Hz integration, validity release, inactive/zero return, slower reduced motion and bounded100ms response. `verify-vm05.mjs` isolates context while energy/onsets remain zero, compares actual terrain uniforms, stationary camera/sun scale, quiet/dense output, zero/invalid/reduced ramps, six quality/viewports and short cadence. Built-production Candidate regression checks generated audio and scene/source controls. Generated evidence never inspects private/captured input or bypasses native permission prompts.

The density/brightness fixtures are intentional independent controls, not a claim that silent production audio produces high musical context. In silence the baseline persists. Real music should change atmosphere over passages rather than individual beats. Inspect quiet intros, busier sections, pauses and reduced motion; confirm richer depth without washing out the valley, losing the sun, or distracting brightness pumping.

Seven draw calls/geometries remain, no new lights/textures/passes/dependencies or per-frame allocations added by the context controller. Cadence samples are headless scheduling, not measured GPU time or a hardware/paired overhead guarantee. Full MI numeric lab matrix was not rerun for scene-only work. Native capture/audibility, device performance and owner artistic/music approval remain manual pending. Still evidence retained; no new recording produced. VM06 remains gated by owner approval/continuation.
