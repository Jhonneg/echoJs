# VM03 — Reactive Valley Floor

Status: **IMPLEMENTED — AWAITING OWNER REVIEW**. One milestone only; next eligible topic after approval is VM01.

A single sinuous pink/crimson channel follows the existing valley surface. Four reusable wave slots consume immutable `low` onset events from the existing MusicFeatureReader. Each new attack launches 48 units ahead of the logical camera position and travels back at26 units/second. Strength scales amplitude, head width and tail length/decay; waves expire after3.5 seconds. Existing fixed `six.bass` energy raises only a restrained continuous channel glow. No new detector, analyser, geometry, displacement, render pass or dependency.

Events are consumed once per scene cursor. Mount/profile/session changes prime the event head; stale data, zero gain and reduced motion suppress waves without replay. Chunk-relative coordinates keep waves fixed in logical world space across camera travel/rebasing. The procedural channel phase is continuous across chunk seams. Terrain position/normal buffers, sun/halo and camera behavior are preserved.

## Review

Refresh ECHO, select Crimson Horizon, and play permitted music. Look for separate waves on bass attacks, a brighter/wider wave on stronger attacks, a short trail toward the horizon, and quiet settling. Sustained bass should retain only a faint channel after its initial wave expires. Check that the sun stays the focal point. Owner musical/visual approval remains pending.

Generated-only evidence (no private source, no native picker, video has no audio):

- [Moving-camera recording](../../evidence/crimson/vm03/vm03-moving-review.mp4)
- [Stationary resting frame](../../evidence/crimson/vm03/vm03-resting.png), [weak](../../evidence/crimson/vm03/vm03-wave-0.2.png), [strong](../../evidence/crimson/vm03/vm03-wave-0.8.png), [earlier head position](../../evidence/crimson/vm03/vm03-wave-early.png)
- [Browser measurements](../../evidence/crimson/vm03/vm03-verification.json), [production regression](../../evidence/crimson/vm03/vm03-public-verification.json)

`node scripts/verify-vm03.mjs` covers renderer uniforms, stationary isolation, lifecycle suppression, authored geometry, six quality/viewport combinations, generated110Hz PCM through unchanged production analysis, moving-camera recording and10-second cadence samples. Unit tests cover event cursor/sustain, proportional strength, logical travel/seams and bounded lifecycle. Production regression uses generated file and mocked generated tab input; it does not verify native sharing/audibility.

Cadence is headless frame scheduling on the recorded GPU, not GPU execution time, paired overhead or a universal device guarantee. Four simultaneous slots deliberately replace the oldest event under dense attacks. No extra channels added before owner review. The full Music Intelligence diagnostic matrix is unchanged and was not rerun for this scene-only task.
