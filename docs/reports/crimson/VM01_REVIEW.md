# VM01 — Sun and corona refinement

Status: **IMPLEMENTED — AWAITING OWNER REVIEW**.

Candidate body scale is now1 +0.15 × smoothed fixed `six.bass` energy × Reactivity +0.05 × the gain-scaled low onset envelope, capped at1.20. The body rises in180ms and falls in650ms; reduced motion uses1.5s. Sustained bass holds a proportional expansion; each onset adds a brief proportional breath, then returns to the sustained size. The authored sphere, composition and resting appearance stay intact. Legacy comparison retains its5% transient expansion.

The existing validated `low` onset envelope drives a separate thin warm-pink corona on the existing halo plane. Its strength-scaled light expands outward while fading, with brightness reduced by up to20% as combined body expansion rises; the plane's perspective distance and existing12% pulse scale are accounted for to keep the ring outside the body. No extra mesh, light, postprocessing or detector. The earlier activity-driven diffuse glow remains intact; Candidate removes its old diffuse pulse contribution in favor of the localized corona. Optional subbass distortion is deferred to preserve restraint.

Existing event cursor, freshness, gain/profile/session and reduced-motion guards still apply. Valley waves use the same low event independently and arrive later through world-space travel; neither consumer drains the shared event stream. Mountains, terrain geometry, camera, MI and source adapters unchanged.

## Evidence and owner review

- [Resting](../../evidence/crimson/vm01/vm01-blend-resting.png), [weak attack](../../evidence/crimson/vm01/vm01-blend-attack-0.2.png), [strong attack](../../evidence/crimson/vm01/vm01-blend-attack-0.8.png)
- [Weak sustain](../../evidence/crimson/vm01/vm01-blend-sustain-0.2.png), [strong sustain](../../evidence/crimson/vm01/vm01-blend-sustain-0.8.png)
- [Generated renderer checks](../../evidence/crimson/vm01/vm01-blend-verification.json), [production regression](../../evidence/crimson/vm01/vm01-blend-public-verification.json)

Run `node scripts/verify-vm01.mjs` for generated feature isolation, actual scene values and six viewport/quality captures. `npm test` covers sustained bass proportionality/independence, existing once-only onset lifecycle and stale/reset/reduced controls. Built-production `verify-crimson-candidate.mjs` checks generated audio playback, GPU uniforms and all-scene/source continuity. No private/captured input inspected; native picker/audibility and real-music artistic judgment remain manual pending. No new recording requested/produced for VM01; still captures are retained. Existing VM03 video documents its earlier build.

Owner: play permitted music in main-app Crimson and compare quiet bass, strong attacks, sustained bass and silence. Check restrained expansion, readable corona against the sky, and hierarchy alongside ground waves. Review wide and portrait views for clipping. Automation does not approve beauty or musical feel. VM04 remains unimplemented until owner review/continuation.
