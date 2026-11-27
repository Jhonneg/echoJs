# Nocturne roadmap NT17–NT23 — closing the gap to the reference board

Started 2026-11-26, after NT16 (glow, streaked wet floor, haze). The owner reviewed Nocturne against the Industrial Crossing reference board (`references/bloom/ECHO NOCTURNE_ Industrial Crossing Reference Board.png`) and asked for items 1–9 of that review as a roadmap. Phases run one at a time; each stops for owner review.

**Kept throughout** unless a phase says otherwise and the owner approves it at that phase's gate:
- the camera and bounded mouse parallax;
- the dominant right magenta fixture and the recessed left cyan fixture;
- the NT13 music mapping, colours and spill;
- the NT16 effects.

Original procedural geometry and GLSL only; no new dependencies without approval.

## Phases

| Phase | Content | Touches approved choices? | Status |
|---|---|---|---|
| NT17 | **Skyline and treble layer.** (1) Distant towers above the gate with sparse lit windows and a faint sky glow, giving the alley vertical depth. (2) Longer, brighter violet strips, a few angled neon accents, and longer magenta tubes under and along the bridge, so the treble layer and the bridge read clearly with the NT16 glow. | Adds elements to the resting view (faint towers); no approved element changes | Owner approved 2026-11-27 ([evidence](evidence/nocturne/nt17/README.md)) |
| NT18 | **Cyan balance and idle focal point.** (3) Brighter, more saturated cyan window grids, so the board's cyan/magenta balance returns. (4) A faint permanent gate glow at idle. | **Yes:** NT13 colour balance and approved resting view; owner approved 2026-11-27 | Owner approved 2026-11-27 ([evidence](evidence/nocturne/nt18/README.md)) |
| NT19 | **Light rain.** Thin falling streaks lit by the neon and brighter near lights; hidden with reduced motion | No | Committed at owner request 2026-11-27 ([evidence](evidence/nocturne/nt19/README.md)) |
| NT20 | **Puddle ripples on bass hits.** Small rings in the puddles that bend the streaked reflections | No (adds motion to the floor's reflections) | Planned |
| NT21 | **Vent steam.** Slow, soft plumes from a few wall vents, lit by nearby fixtures | No | Planned |
| NT22 | **Neon flicker.** A rare, soft failing-neon stutter on one minor strip, tied to the treble; never a strobe | No | Planned |
| NT23 | **Performance, accessibility and lifecycle review** (the skipped NT14): native window on the owner's GTX 1660 at 1080p, Low quality, reduced motion, tab switching and context loss with all the new passes | No | Planned |

## Checks for every phase

- Unit tests for new pure logic.
- Browser capture of idle and of a generated song (`scripts/verify-nocturne-nt16.mjs` or its successor), with before/after brightness and back-to-back GPU timing.
- APP02/APP03 regression scripts; restore their committed evidence afterwards.
- Evidence page under `docs/evidence/nocturne/`, plus PROGRESS and DECISIONS entries.
