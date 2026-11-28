# Bloom bass flash and stronger rivers

2026-11-28. Run `npm run build && node scripts/verify-bloom-bass-flash.ts <scratch-dir> <before|after>`. It builds a throwaway copy exposing Bloom's music state, plays a generated 24 s song (quiet pad 0–6 s, kick with loud mid chords 6–20 s, silence) through the real file adapter and analysis, and captures full 1440×900 frames at rest, just after bass hits and between hits. It measures the mean brightness (0–255) of screen regions: right ranges, left ranges, the teal river's area and upper sky. `before/` was captured before any code change; `after/` with the final code.

## What was built

- **Bass flash:** each fresh bass hit floods every mountain surface (rock, snow, mist, all ranges) with aurora light. Linear light ×(1 + 0.9·flash) plus an aurora tint (green left, pink right), with skyward faces catching a little more. The curtains and their existing light on the land, monolith and crystals go up to +40%. The flash rises in ~0.04 s and fades over ~0.3 s. Detected kicks read low (~0.35), so hit strength is doubled for the flash. It doesn't fire at rest, on mid hits, at Reactivity 0 or under reduced motion.
- **Rivers:** they follow the louder of the two mid bands at double sensitivity (the old average of the two read only ~0.2 on strong chords), rise in 0.15 s and fall in 0.6 s (was 0.5 s / 1.5 s), and get up to +250% brightness (was +80%). The halo widens up to 2× with the mids. Rivers flash with each bass hit, and the mid-hit pulse is 2.5× brighter and a little longer.

## Results (mean brightness, before → after)

| Moment | Right ranges | Left ranges | Teal river area | Upper sky |
|---|---|---|---|---|
| Idle | 145 → 145 | 142 → 142 | 140 → 140 | 103 → 103 |
| Quiet pad | 145 → 147 | 143 → 145 | 140 → 143 | 104 → 105 |
| Bass hit 1 | 141 → 170 | 138 → 173 | 136 → 166 | 110 → 113 |
| Between hits 1 | 138 → 151 | 135 → 151 | 133 → 149 | 109 → 111 |
| Bass hit 2 | 131 → 160 | 127 → 162 | 129 → 160 | 109 → 113 |
| Between hits 2 | 129 → 144 | 126 → 143 | 128 → 145 | 108 → 110 |
| After silence | 126 → 126 | 122 → 122 | 128 → 128 | 97 → 97 |

- At rest and after the song, the frames are unchanged.
- At a hit, the land is about 30 levels (~21%) brighter.
- With loud chords, river level went from 0.22 → 0.39 and river brightness from ×1.18 → ×1.97.
- The land darkens over the song in both captures (the BR9 night mood).
- Before-hit shots were taken 0.017 s after the hit; after-hit shots 0.083 s after, at the flash peak. Without a flash the land differs by ≤3 levels between those moments (before: hit vs between shots).

`compare-hit-1.png` and `compare-between-1.png` show the right-hand view, before (left) and after (right).

Tuning during the run: the first after-capture showed a flash of only 0.17–0.27 at the shot (hits read weak) and rivers at 0.24, so flash sensitivity and river sensitivity were doubled.

## Limits

- Generated audio only; real songs' hit strengths and mid levels will differ. The owner's eye with real music decides whether the flash is too strong or too pink.
- GPU cost not measured (a few operations in the range and river shaders).
