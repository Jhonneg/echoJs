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

## Open decisions
Exact reflection technique, asset source, browser/OS coverage beyond reference Chrome, final UI, production framework, precise frequency normalization and performance targets after measurement. Do not treat open decisions as blockers before their relevant tasks. Record new decisions with ID/date, alternatives, rationale, status and affected docs; do not silently rewrite earlier choices.
