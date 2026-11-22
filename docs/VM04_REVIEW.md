# VM04 — High-frequency atmosphere

Status: **IMPLEMENTED — AWAITING OWNER REVIEW** (visibility refinement).

Existing immutable high-band onset envelopes are weighted by the current fixed-six presence/air energy balance. Presence creates small, selected glints on distant mountain contours, restricted to28–90 units of depth. Air creates sparse warm-pink sky specks near the horizon and a faint segmented sun-edge shimmer. Strength and Reactivity remain proportional. Sustained energy without new high events does not keep these accents running. Silence, stale data, zero gain and reduced motion suppress them through the existing event lifecycle; no hidden replay.

The glints use the existing authored contour mask; the specks use a deterministic procedural grid on the sky sphere. This is an analytic particle appearance, with no new particle geometry or simulated motion. Visibility refinement uses larger/brighter specks but fewer cells: Standard1%, Low0.45%. All details fade with the existing short onset envelope rather than forming a permanent starfield. Sun size/corona/activity glow, valley waves, mountain geometry, camera and shared audio interpretation are preserved. Seven draw calls/geometries remain; no new dependencies, render targets, lights or postprocessing.

## Evidence and review

- [Presence](evidence/vm04-visible-presence-0.8.png), [air](evidence/vm04-visible-air-0.8.png), [rest](evidence/vm04-visible-resting.png)
- [Generated renderer measurements](evidence/vm04-visible-verification.json), [production regression](evidence/vm04-visible-public-verification.json)

`node scripts/verify-vm04.mjs` verifies separate presence/air output, weak/strong scaling, sustain expiration, bass-only isolation, zero-gain/reduced suppression, six Standard/Low desktop/portrait/wide captures and short cadence samples. Unit tests exercise own-band gating, proportional envelopes and no hidden replay. Production regression uses generated audio and mocked generated tab input, never a native permission bypass. Actual spectral overlap still applies; these controls do not identify instruments.

Owner requested clearer visibility: selected glints now include soft halo coverage and1.75× peak gain; air speck radius grows≈1.73× and brightness≈2.77×; sun-edge shimmer gain rises≈2.67×. Upper accents alone use a100ms peak plateau and380ms exponential fade, cut off at1.8s. Bass/corona envelopes stay unchanged. Presence and air share the already verified broad high onset stream; their fixed-band energy balance determines which detail responds. They do not introduce independent presence/air onset detectors. Current energy gating means a detail can shorten as its own band falls. No Music Intelligence change. The full audio-lab matrix was not rerun for these scene-only additions.

Owner: play permitted music containing bright percussion and high-frequency detail; compare bass-only sections, quiet upper attacks, busy passages and silence. Review whether glints remain occasional, air feels delicate, and neither competes with the sun or mountain streaks. Musical/visual approval, native capture/audibility and device performance remain manual pending. Cadence is headless scheduling, not GPU time or matched overhead. No VM05 implementation before owner continuation. No new video produced; still evidence retained.
