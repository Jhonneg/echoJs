# NT06 — Midrange architectural choreography

2026-11-22 — implemented, owner lighting review pending. Owner “proceed” after NT05 authorizes NT06. This phase separates the existing cyan windows and six small wall panels into distinct material/control groups. The approved left cyan fixture's controller, geometry, color and point-light mapping are preserved; magenta, bridge, violet and atmosphere responses remain exact NT05 values.

## Owner review

- Same generated input, fixed camera: [before NT06](../../evidence/nocturne/nt06/before/generated-music-demo.mp4) · [after NT06](../../evidence/nocturne/nt06/after/generated-music-demo.mp4).
- [Low-mid-only](../../evidence/nocturne/nt06/after/lowmid.jpg), [high-mid-only](../../evidence/nocturne/nt06/after/highmid.jpg), [qualified architectural accent](../../evidence/nocturne/nt06/after/attacks.jpg), [held high mids with low-mid attacks](../../evidence/nocturne/nt06/after/stationary-highmid.jpg), [bass/high-mid mix](../../evidence/nocturne/nt06/after/mixed.jpg).
- [Generated signal schedule](../../evidence/nocturne/nt06/after/signal-sections.json), [feature/final brightness trace](../../evidence/nocturne/nt06/after/trace.json), [geometry/delivery/pixel comparison](../../evidence/nocturne/nt06/comparison.json).

The 20-second generated WAV covers bass-only, low-mid-only 450 Hz, high-mid-only 1500 Hz, low-mid attacks, low-mid attacks over stationary high mids, bass/high-mid mix and silence. Playback uses the normal local-file/analyser/MI path, app volume 50%, centered 1440×810 Standard. Probes exist only in isolated source copies; no private or captured media is inspected. The before run retained 171 samples/170 frames, after 169 samples/168 frames; generated audio is muxed into each video with approximate screenshot timing. Before source is a task-start snapshot of the NT05 working tree, preserving previous uncommitted changes.

The windows now form a quieter, slowly changing architectural layer. Six existing small panels provide a quicker low-mid response, while the approved left cyan fixture remains the high-mid focal light. This deliberately reduces the old all-cyan synchronous wash. Low-mid held passages are more restrained; owner review should judge their subtlety in actual music. Each architectural set is still a shared group, not per-window random animation or a new sign system.

## Mapping and state

| Output | Exact response |
| --- | --- |
|336 original window panes | Sustain `.18 * clamp((.7*lowMids + .3*highMids)/.35) * gain`; .35 s rise/.9 s fall; no event accent |
|6 small original cyan panels | Sustain `.28 * clamp(lowMids/.35) * gain`; .1 s rise/.35 s fall; plus a separately decaying low-mid-qualified mid-event accent |
|Small-panel accent | Existing broad-mid event, own session/unconsumed sequence and emission age 0–.25 s. Low-mid energy rise ≥.02 within .09 s of event attack, sampled relative to an approximately 60 ms previous feature sample. Peak `.12 * clamp(strength/.35) * clamp(rise/.15) * gain`; .2 s exponential decay; maximum-overlap, no accumulation; settle below .001 |
|Approved left cyan fixture | Existing 800–2500Hz sustain and high-mid-rise-qualified onset unchanged, including all coefficients and delivery multipliers |

Window Audio level ≤.18; small-panel sustained contribution ≤.28 and total ≤.4. The two families use different energy weights and timing. Neither consumes bass or overall song intensity. Near-window spill uses final window level×65; existing right-panel spill uses final small-panel level×40. All emissive materials use final level×1.3. The approved left fixture remains its own level×30 light and level×1.3 material. Reflections follow actual fixture output through the existing wet-floor pass.

`midrange.ts` owns a 64-sample scalar low-mid history, sampled once per feature frame, not an audio detector. It qualifies existing immutable broad-mid events without retaining the borrowed feature view. Inactive/stale data clears qualifying history and new accents, then releases body levels; session changes skip retained events. Manual/zero consume suppressed events and reset audio bodies; Manual Cyan still directly controls windows and small panels together. Reduced motion suppresses architectural accents and uses .8/1.1 s body easing. dt is capped .05 s; fresh active data age is 0–.25 s. No FFT, raw-audio read, new analyser or source lifecycle is introduced.

The old 342-instance cyan batch becomes 336 windows plus 6 small panels; all original transforms and material finish/color remain identical. The approved left panel remains its separate single instance. Production changes are limited to new midrange.ts, visualState.ts orchestration, ArchitectureDetails.tsx material grouping and LightingDriver.tsx binding. No new authored object, light, camera motion, texture, shadow or postprocessing pass.

## Measured observations

| Generated section | Windows mean | Small panels mean | Architectural accent peak | Approved left-panel accent |
| --- | ---: | ---: | ---: | ---: |
|Low mids only | .033 | .079 | .002 initial tail in sampled held window |0 |
|High mids only | .026 | .004 residual release |0 |0 in sampled held window |
|Low-mid sustain/attacks | .044 | .135 | .061 |0 |
|Held high mids + low-mid attacks | .034 | .057 | .042 |0 |

During held high mids, the approved left-panel mean is about .184, clearly above the restrained architectural window contribution. Low-mid events over held high mids activate small-panel accents while the approved fixture retains its sustained level without a high-mid accent. Decaying residual bodies are release behavior, not new unrelated-band activation. The trace includes the actual low/high-mid values and all delivered material/point-light intensities; these are renderer-control values, not calibrated luminance. Matched-input pure tests, rather than independently sampled video peaks, establish exact preservation of the other systems.

## Verification

- Passed 36 test files, lint, typecheck and production build. Existing bundle warning remains (~1,235.57kB JS/343.65kB gzip).
- New tests cover band separation, quiet/loud ordering, finite/no-retrigger accents, high-mid attacks near stationary low mids, wrong-band/session/time rejection, repeated frames, bounded history, Manual/zero/reduced/stale states, session reset, silence and 30/60/120 Hz behavior.
- [4,200-frame preservation comparator](../../evidence/nocturne/nt06/state-parity.json) proves exact magenta, approved panel, violet, bridge and atmosphere output parity across identical normal/lifecycle inputs. 83 non-target production files, including magenta.ts, cyanPanel.ts, all shared audio sources and other landscapes, are byte-identical to task-start.
- Browser before/after samples validate delivered window material×1.3/point×65, detail material×1.3/point×40 and approved panel material×1.3/point×30 exactly. All 342 original cyan transforms and the protected left fixture's matrix/color are unchanged.
- [Matched Manual before](../../evidence/nocturne/nt06/manual/before/verification.json) and [production after](../../evidence/nocturne/nt06/manual/after/verification.json) include all cyan at 100%, magenta at 100%, violet 0. Six desktop/wide/portrait Standard/Low pairs, idle and panel-off pairs are pixel-identical. Inspected normal low/high-mid and attack views. Manual comparison protects appearance at equal final levels; it does not undo deliberate Audio mapping differences.
- [Reduced-motion generated run](../../evidence/nocturne/nt06/reduced/generated-music-demo.mp4) passed with 170 samples/170 frames, architectural accent exactly 0 throughout and gradual body response. [Summary](../../evidence/nocturne/nt06/reduced-summary.json). The approved panel's reduced-motion behavior remains unchanged.
- Successful normal/reduced runs had no runtime errors. Source-identity/quality/Manual smoke remained operational. All frame-rate state remains outside React.
- One additional geometry/material batch: observed geometry count 107→108 and renderer call counter 82→83; textures stay 6 and point lights 7. The existing reflection incurs its normal extra scene pass. These counters do not establish an FPS/GPU-time improvement or hardware acceptance. Version-matched r186 instancing guidance from NT05 remains applicable; no new dependency/API was needed.

Commands: `ECHO_NT05_BASELINE=<NT05 snapshot containing src/> node scripts/verify-nocturne-midrange-parity.mjs`; `ECHO_NT06_ROOT=<snapshot> ECHO_NT06_LABEL=before node scripts/verify-nocturne-midrange.mjs`; default command for after; ECHO_NT06_LABEL=reduced ECHO_NOCTURNE_REDUCED=1 for reduced. Use `verify-nocturne-midrange-views.mjs` with the same before root/label, default after for built production, then `compare-nocturne-midrange.mjs` for delivered values, geometry and static pixels. Installed Brave/ffmpeg/ImageMagick and the existing CDP fallback were reused; project phase skills/Playwright remain unavailable.

NT06 stops here. NT07 bridge choreography is next; grouped NT05–NT08 artistic acceptance remains open. Real-song feel/audibility, native tab permissions, screen readers, long playback and actual-device performance remain manual/later gates. No commit/push/deploy. Suggested focused commit, only after authorization: `Separate Nocturne midrange windows and cyan detail response`.
