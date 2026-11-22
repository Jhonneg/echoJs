# Crimson response range refinement

Status: IMPLEMENTED — AWAITING OWNER REVIEW.

Owner extended testing reports that even energetic music struggles to reach maximum sun brightness and travel speed. Previously sun drive used .75×low + .25×overall directly, and travel used16×overall^1.2. Both required calibrated energy near1 for their caps.

Scene-only drive is now clamp(energy / .35, 0, 1). It applies to the same sun energy mix and overall travel energy, before the existing gain and speed exponent. Full visual brightness and16-unit/second target speed become reachable at.35 measured energy. This value is not35% player volume or a loudness measurement. Quiet levels remain proportional below the ceiling; strong passages share the ceiling intentionally. Original easing, loaded-terrain safety, silence stop, zero gain and reduced-motion behavior remain.

No MI normalization, detector, adapter, frequency boundary or other landscape changes. Sun expansion/corona/activity glow, valley waves and upper accents retain their existing mappings/caps. This addresses brightness and travel only; it does not introduce tempo detection or beat-synchronized camera steps. VM04 still awaits artistic review; no VM05 progression.

Verification:29 test files, lint/typecheck/build; `verify-crimson-range.mjs` measures rendered journey sun/speed across.1/.2/.35/.7 input, verifies original caps and silence/zero, and saves a full-drive scene. Built-production Candidate regression uses generated audio for integration/source checks. Real-music feel, native picker/audibility and device performance remain manual pending.

- [Range evidence](evidence/crimson-range-verification.json)
- [Full drive](evidence/crimson-range-full-drive.png)
- [Production regression](evidence/crimson-range-public-verification.json)

Initial browser silence check used a7s fixed wait and caught the normal remaining0.000158 fade. The verifier now waits for the existing exact-zero condition; no production decay or threshold was changed.
