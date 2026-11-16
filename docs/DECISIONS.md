# Decision log

| ID | Decision | Why / status |
|---|---|---|
| D01 | Universal visualizer, not music streaming/player replacement | Owner approved pivot; supported consent-based inputs only. |
| D02 | Hybrid 2.5D/3D, one scene first | Reduce modeling, iteration and token cost. Approved direction. |
| D03 | Bloom: reflective lake, sparse ambient surrealism, halo example only | Owner approved direction; distinct future scenes. |
| D04 | Separate audio analysis and scene behavior | Shared signals without scene-coupled capture; proposed technical contract. |
| D05 | Validate real tab capture before installing 3D dependencies | Highest risk first; mandatory gate in handoff. |
| D06 | Vite/React/TS POC; no backend, streaming SDK or AI | Lightweight feasibility test; proposed stack, exact versions TBD. |
| D07 | Modular docs, four repo skills, Context7 + Playwright initially | Owner learning goal; selective loading and verification. |
| D08 | Explicit approval at task and feasibility gates | Prevent scope drift and long unbounded agent sessions. |

| D09 | 2026-11-16: npm + official create-vite 9.3.4 react-ts template for P01; retain template Oxlint and enable strict TS | Approved P01 scope; use template tooling rather than introduce a separate lint stack. Installed versions recorded in PROGRESS and lockfile; later dependencies remain deferred. |

| D10 | 2026-11-16: P02a owns capture lifecycle only; use Node built-in tests and generated local tone fixture | No analyser/output graph until P02b. Request generation guards stop late streams; any audio/video track ending tears down the whole capture. Mock evidence remains separate from real picker and audible playback acceptance. |

| D11 | 2026-11-16: P02b uses FFT 2048, peak linear band amplitude above -80 dB, normalized against 0.1 and clamped; elapsed-time smoothing | Predictable narrow-tone tests without band-width dilution; visual tuning, not loudness. Stable signal/buffers and imperative spectrum, 5 Hz UI; separate capture/analysis lifecycle and no analyser destination. README records band boundaries and constants. |

| D12 | 2026-11-16: P02c creates one fresh audio element/object URL per selection, one reusable media-source node for Play/Pause/replay, and one analyser output route for local audio | Prevent duplicate playback and invalid repeated node attachment. Selection does not autoplay; source switch/disconnect revokes URLs and closes graph. Existing tab capture stays analysis-only. Local isPlaying reflects playback state, while tab activity uses a signal threshold. |

| D13 | 2026-11-16: owner approved G1 and P03a after tab/local manual passes on Arch Linux / Brave 1.98.63 | Enables static 3D work; records actual reference browser rather than inferring a separate Chrome test. No permission for later milestones. |
| D14 | 2026-11-16: P03a uses procedural shapes, an orthographic camera, demand rendering, capped DPR and a static analytic reflection | Keeps authored composition and readable reflection without model/image dependencies, postprocessing or reflection render targets. Visual approval pending; motion and audio mappings deferred. |

| D15 | 2026-11-16: P03b uses bounded sinusoidal halo drift and slow lake phase motion; reduced preference freezes current scene with demand rendering | Preserves composition and shared halo/reflection offsets, avoids new effects/dependencies, caps resumed frame deltas, and keeps frame data in refs/uniforms. Audio remains deferred to P04. |

| D16 | 2026-11-16: increase P03b halo drift range/speed and lake ripple visibility after owner found the original motion nearly imperceptible | Bounded adjustment within approved ambient-motion task; fixed camera/composition and static reduced-motion behavior retained. Original change approved, tuned motion review pending. |

| D17 | 2026-11-16: P04 passes stable AudioSignal to Bloom, uses bounded scene-only gain/smoothing, and one Reactivity control | Makes permitted fixture levels visible while leaving audio normalization/volume and capture lifecycle independent. Reduced mode permits only slow glow and thus uses continuous rendering; zero Reactivity preserves ambient exactly. No new scene effects/dependencies. |

| D18 | 2026-11-16: bounded P04 bass correction after weak-response feedback: faster bass envelopes, stronger scale/ripple mapping and soft-knee visual gain | Generated 30–200 Hz detection passed. Original scene curve clipped at ~0.39 and successive slow envelopes weakened hit timing; revised mapping keeps dynamics and shorter release separates hits. Capture/output graph unchanged; owner native-source retest pending. |

| D19 | 2026-11-16: P04 quiet/loud contrast uses a linear-magnitude soft knee (gain 12 bass / 6 other), with halo scale up to 1.20 | Owner requested clearer quiet/loud separation. Removes square-root lifting of low levels, retains ordinary bass visibility and expands loud-hit headroom. Generated-level contrast test passed; owner source review pending. Sample/update rate and audio volume unchanged. |

| D20 | 2026-11-16: owner requested higher sample rate; request 96 kHz analysis and expose actual context rate, FFT size and unsupported-rate fallback | FFT 4096 at 96k preserves prior bass resolution/window length; source/capture rate is not forced higher. Generated browser tests passed native 96k, 48k-stream resampling and simulated unsupported fallback. Owner Brave playback/performance retest pending. |

| D21 | 2026-11-16: P05 evaluates unchanged visuals using manual 5 s warm-up / 30 s frame-cadence runs and environment metadata; invalidate changed/hidden scenarios | Distinguishes software automation from owner GPU results and avoids frame-delta clipping in metrics. Code/Electron owner results are retained under their actual environment; direct Brave result and G2 approval remain pending. No new dependencies or quality mode. |

| D22 | 2026-11-16: focused P05 halo correction after shared-tab feedback: bass-only size, tangential mid drift, one bass envelope and stronger quiet/loud contrast | Removes non-bass apparent expansion and second bass smoothing. Generated quiet/loud pulse fixture supports a native timing comparison. Capture graph remains unchanged; native sync is not claimed fixed before owner retest. |

| D23 | 2026-11-16: owner approved bounded feature refinement after ECHO/GLASS audit: integrated spectral power, fixed per-band sensitivities, independent fast/slow/transient/atmosphere signals, direct scene mappings | Audit found double-smoothed mids/treble and single-bin peak aggregation. Preserve adapters, 96 kHz/FFT window, graph, artistic bounds and one Reactivity control. No beat classifier, extra analyser, AudioWorklet, dependency or landscape redesign. Native/manual acceptance pending. |

| D24 | 2026-11-16: owner approved parallel positive spectral flux, distinct spatial mappings and isolated visual debug after separation audit | Retain accepted energy/atmosphere, graph, adapters, FFT/rate and cutoffs. Use bin-first L2 positive differences with independent references and leaky accumulation; compare L1 in tests. Combined accents take max rather than sum. Bass owns size, mids fragment translation/local rotation, treble selected emission. Debug affects rendering and invalidates non-default benchmarks. No beat classifier, dependency, rolling AGC or media persistence. Automated checks passed; owner perceptual acceptance pending. |

| D25 | 2026-11-16: owner approved M01 source-and-controls interface | Present tab/file selection and playback status in a responsive bar below Bloom; group Disconnect, local-only playback/volume and Reactivity. Collapse optional diagnostics/debug/performance together. Lift ordinary settings to App; preserve adapters and all audio/motion processing. No dependency, landscape redesign, fullscreen or graphics-quality feature. Keyboard and headless functional checks passed; owner interface/native review pending. |

| D26 | 2026-11-16: owner approved M02 native Fullscreen API controls for Bloom plus the audio bar | Use the existing experience container; sync state from fullscreenchange rather than optimistic clicks. Keep native Escape behavior, usable keyboard focus, unavailable/rejection feedback and short-screen scrolling. Diagnostics stay outside and require exit. Invalidate active benchmarks on transitions. No audio/motion changes or dependencies. Real headless enter/exit and playback continuity passed; owner subsequently confirmed native Escape/audible continuity with "it works". M02 accepted. |

| D27 | 2026-11-16: owner approved M03 Standard/Low graphics-quality control | Preserve default DPR range 1..1.5; Low fixes render DPR at 0.75 to reduce pixels even on 1× displays. Keep Canvas/audio alive, all geometry/motion/shaders unchanged, and setting in memory. Include preset plus actual DPR in results and invalidate changed runs. Browser resolution/continuity/fullscreen checks and real software result metadata passed; owner confirmed normal/fullscreen switching and audio continuity with "it works". M03 accepted. No adaptive quality, persistence, dependency or hardware FPS claim. |

| D28 | 2026-11-16: owner approved M04 bounded accessibility/release-readiness review | Fresh locked install and committed build passed in an isolated archive of 130a99e. Fix only reproduced Cancel/Disconnect focus loss and stale Diagnostics page title; preserve audio/motion/adapters. Record software-browser evidence separately from native owner acceptance and unverified screen-reader/platform coverage. Recommend limited desktop-preview deployment planning, with no hosting/deployment performed or authorized. Owner M04 review pending. |

| D29 | 2026-11-16: owner approved revised M05 portfolio interface: full-viewport Bloom, only ECHO and scene name outside one compact chooser, no developer access | Bloom summary toggles a native disclosure; all audio, settings and fullscreen controls stay inside, with internal scrolling, keyboard/outside dismissal and focus restoration. Remove public diagnostics/debug/benchmarks and runtime probe imports; retain historical utilities/tests unmounted rather than rewrite the engine. Preserve accepted default response, geometry, privacy and adapters. Software browser checks passed; owner visually accepted the layout ("looks great, exactly what i wanted"). Native release checks remain separate. No publishing or dependency. |
| D30 | 2026-11-16: owner approved a bounded halo-versus-camera bass motion experiment | Compare baseline, halo and camera using one damped response to rising bass, with 1.5° halo and 0.25° camera limits. Select the variant at Vite startup, without public controls; preserve audio processing and reduced-motion behavior. Halo reflection follows the halo rotation. Automated checks passed; rendered motion and owner aesthetic acceptance remain pending. |
| D31 | 2026-11-16: owner requested stronger bass tilt, simultaneous halo and camera motion, and player controls | Raise limits to 5° halo / 1° camera, make `both` the default comparison, and place local Play/Pause/Replay plus volume on the scene after file selection. Shared-tab playback stays at its source; chooser still owns source and scene settings. Automated checks passed; browser motion and player-flow acceptance remain pending. |
| D32 | 2026-11-16: owner approved Lavender Peaks as the first new landscape, initially a static selectable preview | Preserve Bloom as default and its audio mapping. Use the owner-added misty mountain JPEG for composition only, with procedural shapes and no runtime asset or unverified licensing. Keep audio controllers mounted across scene switches; preview status and inactive Reactivity state set clear expectations. Other references and reactive behavior await separate tasks. |

## Open decisions

2026-11-16: owner requested removal of mouse-driven movement. Remove pointer tracking and transforms; retain the larger halo and existing ambient/audio motion. This supersedes the earlier mouse-interaction choice.

2026-11-16: owner requested a much more pronounced bass back-and-forth. Increase halo rotation limit to 24° and use a separate spring with damping 8/s; retain the camera’s original 16/s spring to avoid also amplifying camera rebound. Synthetic motion checks passed; perceptual acceptance pending.

2026-11-16: owner requested stronger halo bass tilt after the larger-prop refinement. Raise its limit from 5° to 12° while retaining spring timing and existing camera/mouse response. Visual acceptance pending.

2026-11-16: owner requested a larger prop and mouse interaction. Increase halo base scale to 1.25, raise its center, widen narrow-screen framing and keep the analytic reflection aligned. Use a bounded mouse pull/roll with smooth return, independent of audio Reactivity and suppressed by reduced motion. No new dependency or audio behavior. Automated checks passed; visual acceptance pending.






2026-11-16 earlier owner direction: stop iterative audio/motion tuning and move forward. Retain implemented separation work, defer remaining chopped-motion feedback as a known limitation, and do not implement the proposed additional motion pass. The later explicit approval of D30 supersedes this only for the bounded comparison; it does not fabricate perceptual acceptance or a production-readiness result.
Exact reflection technique, asset source, browser/OS coverage beyond reference Chrome, final UI, production framework, precise frequency normalization and performance targets after measurement. Do not treat open decisions as blockers before their relevant tasks. Record new decisions with ID/date, alternatives, rationale, status and affected docs; do not silently rewrite earlier choices.

## D33 — Lavender Peaks depth motion — 2026-11-16

Owner approved continuous sideways drift with front/treble, middle/midrange and back/bass. Use the existing fast energy bands to drive rightward speed, with 120/300 ms acceleration/deceleration and periodic geometry for endless travel. Speed, rather than position, follows energy so sustained sound keeps layers travelling. Freeze in place for zero Reactivity/reduced motion. Owner musical/visual acceptance remains pending; no new analysis, effect or dependency.

2026-11-16: owner requested faster Lavender Peaks mountain travel. Double all three speed limits to back/middle/front 0.5/0.8/1.2 world units/s, preserving relative speeds and acceleration/deceleration. Perceptual review pending.

## D34 — six bands for six mountains — 2026-11-16

Owner approved assigning one independent frequency band to each ridge, low to high from back to front. Extend the stable AudioSignal with six independently normalized energy values using the existing FFT, preserving Bloom's original features. Keep faster travel limits as two ridges each at 0.5/0.8/1.2 world units/s. Fixed per-band sensitivity is provisional, with a modest presence/air boost. This is frequency separation, not instrument separation; FFT leakage near boundaries remains possible.

2026-11-16: fix owner-reported flat terrain during travel by filling sparse intervals with periodic lower peaks. Seam continuity alone was insufficient: each repeating section must retain broad mountain variation across its full width. Existing hero peaks, motion and six-band mapping retained.

## D35 — shared camera roll, Lavender Peaks opt-out — 2026-11-16

Owner requested universal camera tilt, then explicitly removed it from Lavender Peaks before the task finished. Introduce a shared LandscapeCanvas with default-on camera roll for Bloom/future landscapes and a scene opt-out. Lavender Peaks sets that opt-out. Move generic spring math to engine, preserve Bloom's original camera response and halo spring, and reset shared roll on disable/unmount. No visitor setting or audio change.

2026-11-16: owner clarified that the original large mountain pattern must repeat, rather than transition into added small hills. Remove the continuation-hill generator and shorten the repeat from 40 to 24 world units, covering the authored peaks without a long filler interval. Keep independent ridge motion and periodic joins. This supersedes the earlier filler decision.
