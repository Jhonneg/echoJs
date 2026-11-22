# Crimson combined responsiveness — VP01 owner-authorized exception

Status: APPROVED — owner “aproved” (2026-11-22).

Owner energetic-music feedback explicitly includes sun and camera travel, then approves the combined proposal with “yes.” This expands current VP01 tuning to existing sun/travel mappings; it does not advance VP02, redesign camera route, or change Music Intelligence. Initial VP01 shape evidence remains historical; use the response evidence below for this checkpoint.

## Changes

- Sustained sun body: fixed six.bass passes through the existing scene drive clamp(energy/.35) before gain and180/650ms smoothing.15% body cap unchanged; reduced1.5s unchanged. Bass.1 now drives≈28.6% of the allowed body expansion, formerly10%.
- Low accents: scene soft knee1.2×s/(s+.2), mapping0→0 and1→1 with strict ordering. Raw onset.03/.1/.3 becomes≈.157/.4/.72 visual drive. It is applied before gain/envelopes in both sun/corona and ground consumers; immutable shared events and detector thresholds are untouched. No new waves or constant movement. Upper bands unchanged.
- Travel:24×gain×clamp(overall/.25)^1.2, replacing16×gain×clamp(overall/.35)^1.2. Existing journey easing, loaded-terrain clamp, silence/zero/reduced stop and camera route remain. Moderate.1 energy now targets≈7.99 rather than3.56 units/s; full speed24 rather than16.
- Sun brightness, activity glow,20% combined body/attack expansion cap, existing corona shape and wave origin/speed/pool/lifetime remain. Ground footprint was already refined by initial VP01. No MI/adapters/frequency/normalization changes, no geometry/pass/dependency additions.

These are artistic scene curves, not a loudness/tempo detector. A busier song will not necessarily drive faster travel unless its measured overall energy rises. The softer onset curve compresses upper strengths intentionally but preserves weak/strong differences; owner should review dense passages for excessive simultaneous response.

## Evidence

- [Energy/sun/travel checks](../../evidence/crimson/response/crimson-response-verification.json), [production regression](../../evidence/crimson/response/crimson-response-public-verification.json)
- [Moderate energy](../../evidence/crimson/response/crimson-response-energy-0.1.png), [full range](../../evidence/crimson/response/crimson-response-energy-0.35.png)
- [Updated moving proof](../../evidence/crimson/vp01/vp01-response-moving-strong.mp4), [weak fixed](../../evidence/crimson/vp01/vp01-response-stationary-weak.mp4), [strong fixed](../../evidence/crimson/vp01/vp01-response-stationary-strong.mp4)
- [Updated ground/viewport/cadence checks](../../evidence/crimson/vp01/vp01-response-verification.json), [preservation hashes](../../evidence/crimson/response/crimson-response-preservation.json)

`verify-crimson-response.mjs` measures settled body/speed across.03/.1/.25/.35 and isolated low accents.03/.1/.3, composition formula/caps, event expiration, silence/zero/reduced. `verify-vp01.mjs` retains ground raw strengths.03/.3 and faster moving-camera proof, matched VP00 source replay, six quality/viewports, zero/stale/reduced and cadence. All clips use browser-composited10Hz screenshots and actual timing, encoded as3s30fps video-only proofs; duplicated frames are not native30fps rendering or a soundtrack review.

Passed31 test files, lint/typecheck/build, syntax/whitespace and generated browser/production checks. Final runs /tmp/echo-crimson-response-CR5qVu, /tmp/echo-vp01-response-I9y0hQ and /tmp/echo-candidate-85CRji. Measured travel≈1.88/7.99/23.99/24 at.03/.1/.25/.35 energy; settled body scale≈1.013/1.043/1.107/1.15. Ground bright coverage weak.03=0.0011/strong.3=0.00526667,≈4.79×. Standard/Low600-frame samples p95≈16.8ms each, no console errors. Source-hash check preserves all VP00 production files except existing ground shader, valley and musicPilot, plus the new scene-only response helper. Original scene/camera/geometry source unchanged. Existing Vite size warning remains (~1,226.88kB JS/341.27kB gzip).

Tests verify zero/full/ordered curve bounds, untouched event identity and strength, same drive across independent sun/wave consumers, no sustain retrigger, gain, new24-unit travel bound and loaded-window safety. Existing raw-strength assertions were updated to the exact approved scene curve, with timing/lifecycle checks retained. Historical VM01/Crimson range browser assertions now follow the approved caps/curve; prior saved evidence is not overwritten. No full MI numeric matrix rerun because shared DSP is unchanged.

Owner: replay the same permitted song and compare sun breathing, approach speed and each bass wave, especially quiet-to-busy transitions. Check that stronger hits remain distinguishable and dense passages do not become continuously maximal. Native capture/audibility, precise song synchronization and real-device performance remain manual pending. Headless cadence is not GPU time or matched VP00 overhead. No new actual/private music recording was inspected or analyzed. Stop before VP02; no commit/deployment authorized.
