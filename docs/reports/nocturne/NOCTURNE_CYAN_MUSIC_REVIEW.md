# Nocturne cyan fixture — live generated-audio review, 2026-11-22

The owner approved the fixture's appearance and required a signal-to-render review before further changes. **No production source or Music Intelligence code changed in this review.** The approved geometry, color, point-light placement, wall spill and pavement reflection remain intact.

## Method and demonstration

Played a wholly generated 16.5-second WAV through the application's existing local-file player, `createAnalysis({ musicIntelligence: true })`, and Nocturne Audio mode at 100% Reactivity. An isolated `/tmp` copy of the current working tree added temporary development-only numeric probes at `LightingDriver` and the local audio element; nothing was added to the product build. Headless Brave rendered at 1440×810 Standard with a centered, unmoving camera. Samples use the element's actual `currentTime`; the video was assembled from 122 browser screenshots and the same generated WAV, aligned to that time (screenshot cadence varies, so alignment is approximate within a frame, not sample-accurate). Browser audio was muted during capture; the generated audio is muxed into the demonstration.

- [16.24-second demonstration with generated audio](../../evidence/nocturne/cyan-reactivity/generated-music-demo.mp4)
- [Signal schedule](../../evidence/nocturne/cyan-reactivity/signal-sections.json) and [123 time-aligned signal/brightness samples](../../evidence/nocturne/cyan-reactivity/trace.json)
- [Generated WAV recipe](../../evidence/nocturne/cyan-reactivity/generate-review-audio.mjs)
- Representative frames: [bass](../../evidence/nocturne/cyan-reactivity/bass.jpg), [low mids](../../evidence/nocturne/cyan-reactivity/lowmid.jpg), [high-mid sustain](../../evidence/nocturne/cyan-reactivity/sustain.jpg), [before an accent](../../evidence/nocturne/cyan-reactivity/pre-accent.jpg), [qualifying accent](../../evidence/nocturne/cyan-reactivity/accent.jpg), [silence](../../evidence/nocturne/cyan-reactivity/silence.jpg), [mixed bass/high mids](../../evidence/nocturne/cyan-reactivity/mixed.jpg)

The WAV contains silence (0–1 s), bass-only 110 Hz (1–3), silence (3–4), low-mid-only 450 Hz (4–6), silence (6–7), sustained high-mid 1500 Hz (7–9), high-mid sustain plus five 110 ms attacks (9–12.5), silence (12.5–13.5), mixed bass/high mids (13.5–15.5), and silence (15.5–16.5). All test media was generated; no captured or private media was inspected or saved.

## Observed feature-to-fixture behavior

| Section | Music Intelligence high-mid energy | Panel result | Magenta result |
| --- | ---: | ---: | ---: |
| Bass only, 1.2–2.8 s | ≤.0000031 | level ≤.0000162; accent 0 | peak level .481 |
| Low-mid only, 4.2–5.8 s | ≤.0000050; one accepted broad-mid onset | level ≤.0000347; accent 0 | 0 |
| High-mid sustain, 7.3–8.9 s | .0989 stable | panel mean level .1295, emissive about .168, point light about 3.89 | 0 |
| High-mid attacks, 9.2–12.3 s | .0706 baseline to .325 pulse peaks | five accepted mid events; panel peak .406, of which .071 was event accent; point light peak 12.17 | 0 |
| Silence, 12.8–13.4 s | 0 | level .0218 down to .0011; accent 0 | 0 |
| Mixed bass/high mids, 13.8–15.3 s | .0848 | panel about .111, independently of magenta | peak level .392 |

The transient event and the sustained envelope are distinct in the trace. At the sampled strongest event, sustained contribution was .335 and accent contribution .071, or 17.5% of final panel level. Broad-mid events from 450 Hz did not pass the high-mid-rise qualifier. For every sample, the delivered point-light intensity equaled `30 × panel level` and the material emissive intensity equaled `1.3 × panel level` exactly. Music Intelligence sample age was 3.6 ms median, 6.6 ms p95 and 19.6 ms maximum, below the scene's 250 ms freshness limit. No browser console exceptions were captured.

The panel is plainly visible during sustained 1500 Hz and goes dark during bass, low mids and silence. A representative fixture crop's normalized mean image intensity was .026 for bass, .020 for low mids, .149 for high-mid sustain, .259 at a high-mid pulse and .021 after silence. These crop values combine diffuser and nearby wall pixels and are not calibrated luminance. The accent itself is **subtle** beside the larger energy-driven pulse: the strongest sampled accent adds .071 to a .335 sustained tail. Adjacent fixed-camera frames show a brief lift, but the event accent is not always easy to distinguish by eye from the sustained envelope's response to the same attack. The accepted visual composition remains intact.

Focused Nocturne response tests, local Markdown-link validation (461 targets) and whitespace check passed. Production build and full suite were not rerun because this review made no production source changes; their passing results from the prior fixture task remain recorded in the visual review.

## Recommendation before any change

Keep the current mapping while the owner reviews the demonstration. If the separate attack cue needs to read more clearly, a bounded scene-local follow-up could raise only the accent coefficient from `.35` to about `.6` and lengthen only its decay from `.22` to about `.28` seconds, retaining the existing high-mid rise qualifier, sustained curve, total clamp, fixture and all other groups. This is a proposal based on the measured .071 peak contribution; it was **not implemented or verified**. Real-song perception, audible playback in the owner's browser and device performance remain manual review items.
