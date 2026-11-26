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

2026-11-16: owner requested a faint fixed sun hidden behind Lavender Peaks’ first large mountain. Draw it procedurally within the existing sky shader so opaque ridge depth provides occlusion. No texture, glow postprocessing or new audio mapping is needed.

2026-11-16: owner requested slower distant Lavender Peaks layers. Replace paired speed caps with six distinct increasing limits from background to foreground: 0.15/0.25/0.45/0.65/0.9/1.2 world units/s. Preserve independent audio energy, smoothing and foreground maximum.

## D36 — Crimson Horizon composition preview — 2026-11-16

Owner selected the dark sun valley reference, named it Crimson Horizon and approved static artwork first with shared tilt retained. Add original procedural sun/terrain/facets, four depth layers, a black/pink/crimson palette and an in-memory chooser entry. Reference rights remain unverified, so its JPEG is not used at runtime. Scene-specific animation/audio mapping waits for owner composition review. Existing audio source/controllers remain in App across scene switches.

## D37 — full 3D Crimson Horizon and gentle mouse viewpoint — 2026-11-16

Owner requested 3D terrain and mouse-following camera, selected a gentle viewpoint shift with smooth return, and asked to match the dark sun valley reference. Replace C01's flat silhouette/facet layers with solid procedural triangulated terrain and a spherical sun; use a perspective camera and bounded local pointer response. Preserve shared bass roll by updating the base camera before the shared effect. Camera configuration becomes an optional LandscapeCanvas capability, keeping other scenes' defaults. No new dependency, texture, source integration or scene-specific audio mapping.

2026-11-16: owner requested Lavender Peaks sun pulsation on bass. Add a bounded shader uniform driven by existing bass energy/accent features and scene-only 40/220 ms smoothing. Scale size and local contrast without moving the sun or adding global exposure flashes. Honor Reactivity and reduced motion; retain terrain depth masking.

## D38 — quieter terrain and stronger sun hierarchy — 2026-11-16

Owner found Crimson Horizon's jagged floor flat and distracting. Replace fine terrain serrations/per-face color variation with broad ridges/folds and smooth vertex normals, keeping the solid 3D geometry. Suppress low-ground accents, reveal raised mountain volume with cool fill, and enlarge the sun ~16% in radius. Preserve pointer and bass camera effects. This revises the initial faceted art treatment based on owner feedback.

## D39 — ridged 3D art composition before audio — 2026-11-16

Owner rejected both the smooth terrain appearance and a proposed 2.5D replacement. Approved full 3D with ridged multifractal noise, asymmetric wide-valley shaping and custom near-black/crimson directional material. Keep mouse perspective movement; opt Crimson out of bass tilt during the art gate. Use original deterministic CPU noise (four octaves, separate bank seeds 3157/9283) and shader ridge-mask attributes without dependencies. One finite terrain region is sufficient for the existing bounded camera; continuous travel/chunks are deferred. The static composition is subject to owner reference approval, not an automated aesthetics gate.

## D40 — music-driven endless Crimson Horizon — 2026-11-16

Owner explicitly requested and approved forward travel, band-count sun brightness, more visible terrain and a nightshade sky. This advances beyond D39's static restriction while preserving the true 3D reference target; it does not imply C03 aesthetic approval. Use four worker-generated world-sampled chunks with matching normals/masks and local rendering rebases. Bound the pool, dispose retired geometry and stop safely when generation is late. No new dependency or media processing.

Separate music energy (speed) from active-band count (sun), using existing six bands with hysteresis. Stop immediately on pause/stale input, ease out connected silence, preserve mouse movement while idle, and keep the sun at a fixed horizon distance. Reactivity scales travel/brightness; reduced motion freezes the camera with slower brightness changes. Reentry resets travel. Brighter charcoal and blue-purple nightshade improve readability while retaining selective crimson highlights.

## D41 — visible idle sun and wider travel range — 2026-11-16

Owner found the stopped sun invisible and requested greater slow/fast speed separation. Retain 5.5% of the full sun color at idle, independent of audio activity, while preserving the existing brightness response. Replace the linear 0.5–4 speed range with 0.2 + 7.8 × RMS-energy^1.7 (scaled by Reactivity). Quiet passages remain slow while strong full-spectrum passages can reach 8 world units/s. Existing smoothing, stop behavior and streamed-terrain safety limit remain.

## D42 — shared Lavender Peaks mountain motion — 2026-11-16

Owner removed the individual sound-layer assignments, requesting all mountains move together while preserving speed hierarchy. Use existing overall music intensity for every ridge; keep far-to-near speed limits 0.15/0.25/0.45/0.65/0.9/1.2 and shared acceleration/release timing. Preserve terrain looping, level camera and bass sun pulse. Keep six-band audio analysis for Crimson Horizon; remove only Lavender's per-mountain mapping.

## D43 — shared high/low-frequency Lavender speed — 2026-11-16

Owner requested speed follow whether the song plays high or low. Interpret high notes as faster and low notes as slower, preserving shared motion and depth hierarchy. Use the power-weighted balance of existing normalized six-band levels to scale shared intensity between 25% and 100%. This provides a bounded spectral-brightness approximation without pitch detection, new analysis, or separate mountain mappings. Keep existing smoothing, maximum speeds, silence/freeze behavior and bass sun pulse.

## D44 — Crimson sun pulse on strong bass — 2026-11-16

Interpret the owner's “high bass” as strong bass hits. Reuse broad fast bass to gate existing transient/flux accents, with 40/220 ms pulse smoothing. Add bounded sun/glow scale and brightness modulation independently of the active-band-count brightness. Keep idle visibility and forward travel unchanged; reduced motion/zero Reactivity disable the pulse. No new audio analysis, artificial beat oscillator or dependency.

## D45 — faster Crimson travel — 2026-11-16

Owner requested increased movement speed after the Crimson sun refinement. Double forward travel across the energy curve (0.4–16 world units/s at full Reactivity), preserving the energy exponent, easing, stop/freeze behavior and streamed-terrain safety. Sun pulse and other landscapes remain unchanged.

## D46 — partial Lavender sun at initial load — 2026-11-16

Owner requested a smaller first large mountain so the sun starts partially revealed. Reduce that peak's amplitude from 4.8 to 3.7, keeping width, base, sun and all other terrain unchanged. Original repeating pattern carries the same revised peak on subsequent loops.

## D47 — brighter Crimson terrain independent of playback — 2026-11-16

Owner found Crimson too dark after previous tuning. Lift linear terrain base from (0.0065,0.0085,0.014) to (0.02,0.022,0.034), strengthen stepped directional shading, add normal-based cool sky fill, and raise idle crest strength from 55% to 75% of its full level. Change terrain material only, preserving sky/sun behavior, geometry, motion and other landscapes.

## D48 — correct gray terrain wash — 2026-11-16

Owner rejected D47's gray appearance. Replace its cool base/fill with burgundy-tinted dark terrain and warm directional shading; increase selected crimson highlight strength. Retain readability through hue/contrast while preserving nightshade sky and sun. Only terrain shader colors change.

## Nocturne N01 — 2026-11-16

Use the existing LandscapeCanvas perspective option with cameraTilt disabled and demand rendering for the stationary blockout. Procedural box geometry and neutral rough materials establish proportions without dependencies. Owner selected dim neutral review fill; colored fixtures, reflections, atmosphere and audio mappings wait for their own phases. Shared audio controllers remain in App; disable only Nocturne’s Reactivity input and preserve its stored value.

## Nocturne pointer camera — 2026-11-16

Owner approved matching Crimson's mouse camera. Reuse its existing pure cameraMotion helper without changing Crimson; keep Nocturne geometry/framing/Z and audio behavior intact. Use continuous rendering for eased movement, reset target on leave/blur and center under reduced motion. This supersedes the N01 demand-rendering/fixed-pointer choice.

## Nocturne subtle parallax — 2026-11-16

Owner rejected the full Crimson world-space range as too strong. Nearby alley walls amplify perceived motion; multiply only Nocturne's final displacement by 0.25 while retaining the existing smoothing helper and view target.

## Nocturne N02 static detail — 2026-11-16

Batch repeated box details into six instanced finish groups with explicit bounds after matrix updates, per Three r186 documentation. Model door recesses with projecting jambs around inset leaves rather than boolean cuts or a new dependency. Use non-emissive fixture/glass surfaces for this gate; reserve lighting assignments and manual isolation for N03. Pipes/cables use low-segment cylinder/tube geometry; no texture/image assets.

## Nocturne N03 — 2026-11-16

Owner approved independent manual lighting before reflections/audio. Split instanced emitter finishes into magenta, cyan and violet, sharing each level with two corresponding bounded point lights. Keep all lights mounted at zero intensity when disabled to avoid shader light-count recompilation while adjusting controls. Use the existing renderer/materials without dependencies; no bloom needed for this lighting gate. Store manual levels in App for scene-switch retention, expose controls only inside Nocturne's chooser, default all-on. Lighting exposed a panel/vent overlap; relocated/shortened the six small panels within this phase.

## Nocturne N04 shared planar reflection — 2026-11-17

Owner approved N04. Use the installed Three r186 Reflector addon: unlike Bloom’s authored halo approximation, the planar target captures Nocturne’s many active emitters, architecture and camera without per-source reflection authoring. Use one target for all procedural wet patches; cap resolution by quality, disable target MSAA, and dispose resources on unmount. This costs an additional scene render and is not a hardware-performance claim.

Prefer a small wet-surface sample filter, distance Fog and a gate-local additive halo over a new full-screen postprocessing pipeline/dependency. During manual review, gate/haze follow the active color levels so isolated group captures remain color-isolated and all-off has no residual colored illumination. Their eventual overall-intensity audio mapping remains N05. Preserve subtle pointer movement and all earlier scenes.

## Nocturne industrial wall finish — 2026-11-17

Owner rejected the uniform fully rough building material as clay-like and approved a focused surface pass. Generate deterministic procedural color and packed bump/roughness maps for metal and concrete (four shared 512×512 RGBA textures total). Map box UVs to world metres to avoid stretching seams on tall buildings. Native standard materials supply local highlights without shader injection, external assets or dependencies; dispose shared maps on scene exit. Building masses retain their existing positions/sizes, and lighting/reflection/camera behavior stays as approved.

## Nocturne N05 — existing audio contract and manual comparison — 2026-11-17

Owner approved N05 after the industrial material correction. Keep the existing analyser ranges and features; add scene-local bounded level/accent mapping and independently smoothed lights. Use updatedAt/isPlaying to release stale/stopped input. Audio becomes the default mode; keep manual values and mode in App across scene switches. Bind renderer targets once and mutate them before the reflected render, following Fiber v9.8.2 negative-priority useFrame guidance. Do not update React state per frame.

Full 1440×810 headless software rendering exceeded the 250 ms stale window (~342 ms signal age observed), suppressing a live generated bass input. Verified the actual analyser-to-emissive path instead at 720×405 Low, without loosening the stale guard or changing the audio engine. N06 must evaluate target hardware/frame cadence and whether an adjusted freshness strategy is needed for very slow devices; current browser functional evidence is not desktop-performance evidence.

## Nocturne attack flashes — 2026-11-17

Owner rejected gradual group lighting. Replace normal-mode brightness envelopes with bounded onset-triggered, fixed-peak flashes (110/90/70 ms) and sharp cutoff. Reuse existing per-band fast/transient/flux values, with a short retrigger interval and hysteresis to avoid repeated flicker from a held accent. Preserve independent smooth atmosphere and a gradual reduced-motion alternative. The scene-local response owns flash timers outside React state; renderer/reflection wiring and audio processing are unchanged.

## Nocturne flash pacing and silent readability — 2026-11-17

Owner found flashes too fast and silence too dark. Lengthen holds and enforce a 650 ms per-group retrigger interval; discard skipped attacks instead of delaying them to the end of the interval. Raise the existing neutral fill lights for idle readability without introducing permanent colored emission or altering the audio engine. Preserve the immediate flash shape and industrial surface treatment.

## Nocturne quick smooth lighting — 2026-11-17

Owner clarified the intended response: smooth illumination with a quicker onset than the first integration. Replace the flash state machine with the original continuous level/accent mapping at faster 25/35/20 ms attack constants and 180/220/140 ms release constants. Preserve reduced motion, smooth overall atmosphere, manual isolation and the brighter idle fill. Tests compare first-frame output against the original envelopes while requiring an intermediate value below full brightness and sustained illumination without timer cutoff.

## Nocturne N06 verification — 2026-11-17

Retain the accepted implementation: automated integration and NVIDIA-accelerated headless cadence checks passed without source changes, including zero stale frames on measured hardware playback. Keep software SwiftShader evidence and compositor-paused native-window trials separate from valid GPU measurements; do not relax freshness guards to accommodate those test environments. Owner/native release checks remain explicit in NOCTURNE_N06.md. No speculative rendering optimization or public diagnostic mode is justified by these results.

## MI01 separate synthetic audio lab — 2026-11-17

Owner selected a separate development entry and synthetic fixtures only, then approved the MI01 implementation plan. Keep App/public diagnostics removed as previously decided; do not restore a debug query mode. Vite's default production entry excludes audio-lab.html; DEV guards eliminate the optional analysis observer and its numeric helper. The observer uses separate reusable diagnostic storage, cannot expose buffers/nodes, and never changes AudioSignal or legacy calculations. Live fixtures use the existing local-file adapter; offline cadence replay calls existing feature functions and has a parity check against live orchestration.

Use native offline analyser readings with recorded quantized audio times to compare a common timeline at 30/60/120 updates/s. RMS/dBFS is a measurement proxy, not perceptual loudness. Threshold excursions are diagnostic observations, not new onset events. Keep fixture gain, playback volume, spectral magnitude and normalized visual values distinct. Numeric exports contain synthetic aggregate results only; no media/FFT/history exports or live-source inspection. Record baseline anomalies without correcting normalization, flux, scenes or frequency boundaries. Owner acceptance and separately approved MI02/MI03 tolerances precede algorithm changes; see MI01_BASELINE.md.

## MI01 live tab diagnostic follow-up — 2026-11-18

Owner explicitly requested tab capture inside the development lab and approved its bounded plan. This supersedes MI01's initial synthetic-only **input** decision for live tab measurements; synthetic baseline generation/export stays unchanged. Reuse existing adapters behind a small lab-only source coordinator. Keep one active source, native picker activation, pending cancellation/late-stream release, track-ended cleanup and pagehide disposal. Never route captured sound to a second destination. Add Resume analysis for suspended tab contexts; fixture volume/pause do not control the shared source.

Live RMS/features and a bounded numeric graph may be displayed transiently; do not persist/export captured media or live measurements, inspect video, collect source titles/URLs or include live diagnostics in synthetic reports. Disable exports while tab capture is pending/active and guard handlers. Automation uses generated audio and a mocked capture API; no claim that it verifies native permissions, audible playback or musical response. Owner manual review remains separate. Preserve existing MI01 work, audio algorithms and all scene behavior; MI02 still needs its own approved plan.

## MI02a fixed development energy candidates — 2026-11-18

Owner approved ±1 dB steady calibration, monotonic −36…−6 peak dBFS response, ≥0.15 separation from −12 to −6 dBFS, exact clean-silence zero, noise ≤0.005, finite/reset/source/privacy behaviour. Keep these targets fixed while measuring. Compensate AnalyserNode's specified Blackman mean-square (0.3046) and one-sided 1/N-scaled FFT power to estimate stationary band RMS. Sum integrated power without dividing by band width or bin count; retain the actual ranges. Do not mistake full-tone RMS for each partial region at a boundary. The dev estimator reads finite bins without inheriting the legacy −80 dB floor; production retains its existing formula/floor.

Compare linear min(1,rms/0.5) and soft rms/(0.5+rms), both with a fixed reference chosen before measurements. No AGC, band boost or speculative gate. A numeric result is a scene-independent candidate, not a new production feature contract or default. Linear meets the approved synthetic targets; the soft knee's minimum contrast 0.149779 fails 0.15 and remains marked FAIL without post-result retuning. Its marginal failure and browser variability are evidence for review, not grounds to round into a pass. Leave production normalization, onset/flux, capture adapters, scene mappings and automatic defaults unchanged. See MI02A_ENERGY.md for reproducibility, limits and the required owner checkpoint.

## MI02a owner checkpoint — 2026-11-18

Owner feedback “looks like it passed” after testing accepts the lab-comparison checkpoint for continuation. Retain linear as the candidate without changing production; keep the soft-knee contrast failure visible and the original thresholds unchanged. No specific native/audio/music/hardware evidence was supplied, and no full MI02 or feature-quality gate is inferred. Scope remaining range/noise/adaptation evaluation separately before onset work; avoid introducing AGC or a gate merely because it appears in the roadmap.

## MI02b bounded shared-gain experiment — 2026-11-18

Owner approved lab-only fixed versus adaptive comparison and safeguards before implementation. Use one shared 1…2× gain, reset/start at unity, hold 2 s, then 5 s gain-rise/300 ms reduction time constants. Below −50 dBFS measured time-domain RMS, desired gain returns to unity without gating the signal. The measured broadband tracker uses 300 ms attack/5 s release and desired target RMS 0.25; these defaults were stated in code/commentary before results. Use elapsed analysis time and existing source/inactivity/discontinuity resets; never alter audio playback, AudioSignal or per-scene mappings.

The range matrix meets its approved safeguards, including no additional clipping after the 1 s loud-step grace. Record the allowed early clipping (up to 0.449887 s), hit-related gain movement (0.053004×) and history-dependent quiet boost rather than treating guardrail pass as a reason to enable AGC. Retain fixed linear as the recommended candidate; no new noise gate or production adaptive default is justified by this experiment. Silence/noise checks wait until the known previous FFT window plus one render quantum clears; full-section means still retain transition tails. Preserve MI02a thresholds and its soft-knee rejection. MI02B_RANGE.md has evidence and the required owner checkpoint before MI03.

## MI02b owner checkpoint — 2026-11-18

Owner feedback “it passed” accepts the range/noise lab checkpoint for continuation. Fixed linear remains the preferred candidate; adaptive scaling stays an experiment with the measured early saturation/gain movement, and soft knee retains its failed contrast result. No production mapping/default changes or broader musical/hardware claims follow. Plan MI03 event-quality criteria separately before implementation, preserving legacy energy/accent behavior and existing adapters.

## Crimson-first animation refinement direction — 2026-11-18

Owner chose expressive/controlled expansion, Crimson Horizon as pilot, subtle terrain deformation, and musical/playback transitions rather than landscape-switching transitions, then requested the staged plan's implementation. Record the direction in ANIMATION_REFINEMENT.md: preserve current valley/palette/camera/streaming; first refine movement/local shaders, review, then consider coherent bank displacement capped initially at 0.08 world units with continuous seams/rebasing/normals/bounds. Sun/glow start with existing 8%/12% scale caps. Fixed energy remains the preferred candidate; new events/context must pass feature-quality review before they drive scenes. Do not revert Lavender's accepted shared travel or Nocturne's smooth lights/static architecture.

The first concrete deliverable is the MI03 detector scope and quantitative event criteria, recorded in MI03_PLAN.md. Current flux/transient are continuous envelopes; the baseline includes a release-induced bass flux response, so an event detector needs its own release/leakage/reset tests. Follow the roadmap's explicit pre-implementation numerical-criteria approval checkpoint. Proposed detector constants are engineering hypotheses, not measured or owner-accepted MI03 behavior. No event/scene implementation or production default was changed at this documentation checkpoint.

## MI03 initial implementation and failed quality gate — 2026-11-18

Owner authorized the bounded MI03 detector/criteria with “go ahead” after clarifying they elaborate the existing roadmap. Keep events lab-only alongside unmodified AudioSignal/legacy features. Use the approved per-bin novelty, robust prior history, peak confirmation, RMS/rise/share/fall guards, spacing/hysteresis and proportional strength; record peak/emission clocks separately and never backdate to labels. DEV-only seek/seeked handling resets diagnostics, waits for the old FFT window to clear and primes without changing legacy playback/adapters. Event/history buffers are bounded and live data is not exported.

The first complete run detects every labeled core attack but emits 29 extra mid events near bass-burst releases. Numerical FAIL is retained despite clean timing, strength, silence and stress results. Do not retune thresholds, drop failing phases/rates, hide errors in aggregate accuracy, or continue to MI04/scene migration. MI03_RESULTS.md identifies candidate-vs-confirmation release attribution and proposes one separately approved correction using confirmation fall and the band's low share of peak energy. No fix or new phase is self-authorized.
## MI03 confirmation release attribution — 2026-11-18

Owner approved the focused correction after the initial 29-extra failure. Use the already-awaited confirmation's existing falling-energy test plus saved peak band-power share below the existing 5% bound. No extra lookahead, parameter retuning, criterion waiver or backend change. The unchanged core matrix now passes; preserve initial and corrected evidence separately. Native diagnostic unequal mixtures confirm weak attacks under a declining dominant source can still be missed; core PASS does not mean universal musical accuracy or authorize MI04/production/scene promotion. See MI03_CORRECTION.md for measured results and review checkpoint.

## MI03 lab checkpoint accepted — 2026-11-18

Owner's “looks good” accepts the corrected lab checkpoint for continuation while retaining the failed initial baseline and unequal-mixture limitations. No specific test conditions were supplied; do not infer further native/song/hardware validation. Next is a bounded MI04 plan; implementation and later feature/scene gates remain separate.

## MI04 context proposal — 2026-11-20

Resume at planning after accepted MI03. Propose reusing the existing lab RMS/FFT/events for slow intensity, power-centroid brightness and a four-second accepted-event strength rate. Keep fixed calibration and MI03 unchanged; activity inherits missed-event limitations. Explicit numerical defaults/criteria in MI04_PLAN.md await approval, not implicit production adoption. Preserve original roadmap/G1 and scene gates; no new backend/dependency or scene-specific context logic.

## MI04 initial context and failed cadence gate — 2026-11-20

Owner approved the lab context scope/defaults/criteria. Implement them unchanged on existing energy/FFT/events, with fixed-capacity timestamped event storage and source-independent lifecycle. Native intensity/brightness and independent context math pass; retain 30 failed activity cadence comparisons rather than relaxing 0.05 or changing activity to ignore strengths. Expanded frequency transitions reveal missed onsets and other cases reveal differing strengths, despite MI03's original core/stress remaining green. Propose one separately approved DEV attack-window follow-up, initially 40 ms, qualifying contribution/strength at observed band-RMS maximum; retain numeric/latency gates and measure added emission delay. No automatic correction, production promotion, G1 or scene migration. See MI04_RESULTS.md.
## MI04 approved 40 ms onset observation — 2026-11-20

Owner approved the bounded onset-window follow-up. Pre-change generated candidate traces confirmed early sampled strength and falling-global-energy rejection of a rising new band; coarse peak lookback also loses the pre-attack minimum. Retain the existing 50 ms minimum at the start of rising novelty, observe maximum band RMS through 40 ms after the detected peak, and qualify falling energy against contribution at that maximum. Preserve immutable records/observed peak time and use actual later emission; no backdating. Chronologically emit different bands that mature on the same jittered tick using fixed-size selection. All prior numeric thresholds/references/quality targets remain fixed; added decision delay must stay within 150 ms. Synthetic gates now pass, with weak overlapping-attack misses still explicit. No automatic production/G1/scene promotion; see MI04_WINDOW_RESULTS.md for evidence and owner checkpoint.
## G1 review preparation proposal — 2026-11-20

Prepare a compact same-input comparison and explicit local review-file path before owner G1 testing. Existing generated fixtures/shared tabs and scattered 5 Hz panels do not alone provide a practical same-song local/tab review or precise visual event timing. Proposed neutral indicators follow actual emission clocks; presentation changes must never alter source/gain/DSP or replay old events. Reuse production adapters through the DEV coordinator, extend live export locking to review files, and keep actual music/native permission review entirely with the owner. G1_PLAN.md awaits implementation approval; synthetic PASS is not owner musical acceptance. No scene preview or MI05 promotion.
## G1 approved review interface and live-file separation — 2026-11-20

Owner authorized G1 preparation. Reuse production adapters through a distinct DEV `file` mode so real local review audio cannot be mistaken for a generated fixture in export controls. Selection waits for explicit Play, resume retains one element/node and late capture cannot replace a newer file. Comparison presentation is independent of gain/source/DSP; consume event identity continuously, show a fixed 200 ms marker from actual emission, and never replay hidden events. Reduced motion retains counts without brief markers. Keep changing diagnostic text below the stable review chart. Generated automation verifies mechanics and unchanged quality; all six owner G1 judgments remain pending in G1_REVIEW.md. No new scene mappings or production promotion.
## G1 completed for reviewed conditions — 2026-11-21

Owner completed the six directed review rows and reported candidate markers aligned, soft/strong differentiation useful and response much better than legacy. The final local/tab check is owner-reported, without exact material/browser/gain/device metadata; do not promote it into agent-observed capture or hardware evidence. Accept G1 for the bounded pilot-planning decision, retaining the known weak overlapping-attack limitation and synthetic evidence. Next is MI05's stable-contract/Crimson proposal, not automatic production or all-scene migration. No DSP retuning was needed during owner review.
## MI05 stable reader and Crimson proposal — 2026-11-21

After G1, propose a small versioned read-only numeric contract published by a DEV bridge from the existing validated snapshot, without duplicating or relocating DSP algorithms. One consumer cursor per scene preserves event identity; mode/mount/session changes cannot replay retained attacks. Propose a single mounted Crimson A/B preview sharing source/context/worker/distance, minimal target/integration seams and uniform-driven first-pass appearance. Keep public Legacy behavior, authored geometry/camera/palette/stream and all other worlds; no vertex pass or default rollout. MI05_PLAN.md records proposed artistic values and 10% matched p95 overhead criterion for owner approval, not measured acceptance.
## MI05 stronger sun expansion proposal — 2026-11-21

Owner requested a larger sun response during plan review. Revise proposed candidate scale maxima to 15% sun /20% glow, keeping strength proportionality, the proposed 25 ms/220 ms scene envelope and existing color/alpha bounds. These are initial defaults for the stronger expansion request, not measured aesthetic acceptance. Preserve Legacy's accepted 8%/12% behavior; full MI05 implementation remains separately gated by plan approval.
## MI05 owner-defined sun/glow caps — 2026-11-21

Owner explicitly specifies 50% sun growth and retention of older glow expansion. Use 1.5× maximum authored sun scale and restore the original 12% glow scale cap for the candidate, superseding the intermediate 15%/20% defaults. Strength proportionality and existing color/alpha bounds remain. Legacy stays at 8%/12%; this parameter revision does not independently authorize all MI05 implementation or production promotion.

## 2026-11-21 — MI05 reader and first-pass Crimson comparison

Owner approved the revised MI05 plan with “lets move.” Keep validated DSP in the existing DEV observer and publish its scalar controls through a shared versioned readonly reader; source adapters and public audio behavior remain unchanged. A/B owns one Canvas/worker/journey, blends targets for 0.5 s and consumes hidden event heads. Onset pulse state is bounded and strength-proportional; a 34 ms peak interval after the 25 ms eased rise avoids cadence-dependent peak loss before 220 ms decay. Existing shader materials gain bounded uniform controls, without new geometry/passes.

Preserve existing uncommitted source changes: current Legacy sun scale cap was already 40%, although the proposal cited historical 8%. Retain that 40%/12% baseline; implement Candidate at owner-requested 50%/12%. Correct documentation rather than reverting owner work. Generated-only test harness may inspect actual mesh/uniform/resource state; it cannot attach to lab/private input and stays outside production. Stop for owner musical/artistic review before vertex deformation or migration.

## 2026-11-21 — owner accepts and applies Crimson Candidate

Owner said “passed, implement candidate,” authorizing public rollout of the reviewed response. Promote the validated fixed-energy/onset/context code unchanged into shared audio modules and retain DEV re-exports so lab matrices keep exercising the same algorithms. Feed a minimal production publisher from the existing analyser tick rather than enabling the diagnostic observer/time-domain probes in the public app. Preserve legacy AudioSignal and other-world mappings; Crimson alone consumes the new reader. Use existing stop/seek lifecycle to reset/prime event state. This explicitly supersedes the earlier Legacy-only public boundary, without authorizing vertex deformation, other scene migration or deployment.

## 2026-11-21 — bounded Crimson vertex pass

Owner approved terrain-shader deformation with “go ahead.” Keep a strict 0.08-unit vertical field on selected banks, zero in the central corridor and distant/high skyline, and preserve the accepted sun/camera/audio/worker behavior. Use two slow logical-coordinate waves with bounded per-chunk origins and integer phase harmonics to avoid seams/rebase/wrap jumps. Compute the full analytical displacement gradient and transform normals with its inverse-transpose Jacobian, including all spatial mask derivatives; avoid per-frame normal/position uploads. Recompute/pad bounds once per chunk. Reduced motion/zero gain suppress deformation; stale/inactive input releases it. Preserve the later existing uncommitted sun scale edit rather than restoring older documented caps. Generated-only comparison overrides and GPU transform-feedback probes live solely in the DEV fixture harness.

## 2026-11-21 — owner approves stronger terrain visibility

Owner reported barely visible motion, then approved the concrete0.32 maximum/0.7 drive-exponent proposal with “yes.” Initial0.08 cap gave only0.008–0.024-unit targets at drive0.1–0.3 before spatial fades. Increase only the scene's amplitude/drive curve, preserving masks, normals, phase/timing, protected composition, sun/camera and audio calculations. Apply the curve before Reactivity so gain stays linear; unscale the already gain-weighted mid accent when building normalized drive. Bounds use the shared new cap; retain old0.08 evidence separately. No next milestone or visual acceptance implied by implementation approval.

## 2026-11-21 — replace vertex deformation with independent mid contour lighting

Owner explicitly reverted terrain deformation and selected low-mid gradual contours/high-mid brief streaks. Remove the entire deformation/normal/bounds path rather than retaining a hidden geometry modifier. Reuse existing250–800/800–2500 fixed controls; do not relabel/change frequencies or retune the audio engine. A scene-local high-mid rise qualifier, independent of broad onset events/bass/overall context, creates brief lighting heads without sustained retrigger. Remove sun-activity scaling from Candidate contour emission and composite self-light after haze so bass cannot gate it. Keep low/high lighting independent, source/reset/motion semantics, bounded logical coordinates and existing renderer passes. Preserve historical vertex evidence but mark it reverted. Owner visual review remains separate.

## 2026-11-21 — VM02 visual refinement, awaiting review

Owner requests a clearer resting/sustained/transient hierarchy while preserving accepted geometry, MI, sun and camera. Reduce the resting outline, restrict active light mainly to selected primary contours, use analytic narrow halos and distinguish a warm bright head from a one-sided fading crimson trail. Keep existing high-mid qualification but make visual emission controls linear and lengthen local travel/release to950 ms so movement registers. No bloom/postpass/new geometry. Stationary-camera control/recording is isolated to the generated DEV fixture, not production behavior. Test actual generated PCM via unchanged analysis, numerical pixel brightness/coverage and head movement; share an annotated video-only MP4. Keep VM02 IMPLEMENTED — AWAITING REVIEW and VM03 untouched despite passing automation.

## 2026-11-21 — activity-driven Crimson sun halo

Owner explicitly requests “make the sun glow according to activity,” then resumes with “continue.” Use existing `MusicFeatures.context.activity` (recent onset strength/density), not overall intensity or a new analyser. Only the halo's continuous emission changes: gain-scaled activity with120 ms rise/450 ms fall,≥1.5 s in reduced motion, zero-gain clear/stale release and preserved idle alpha. Keep the existing bass pulse overlay, halo width/scale, sun-body shader/size response, camera, terrain and independent contour lights. Legacy comparison retains its previous sun-energy halo. This narrowly authorizes a halo adjustment despite the earlier VM02 sun-preservation boundary; it neither completes the broader VM01 plan nor authorizes VM03. Preserve the owner's pending sun-scale edit exactly.

2026-11-21 — VM03 uses one procedural surface channel and four reusable low-onset wave slots, with chunk-relative logical coordinates and strength-scaled heads/tails. Existing fixed bass energy supplies only restrained sustained glow. This preserves authored terrain and shared DSP without extra passes or dependencies. Oldest wave replacement bounds dense passages; further channels await owner review.

2026-11-21 — VM01 separates fixed-bass sustained body expansion (15% cap) from validated low-onset corona. Reuse existing halo plane, preserve activity glow, replace Candidate diffuse bass pulse with localized ring. Optional subbass distortion deferred; no new rendering resources or shared DSP changes.

2026-11-21 — Owner-approved VM01 compromise adds5% onset breathing to15% sustained sun expansion (20% total cap), using the existing low envelope. Corona follows combined body radius and dims by up to20% during expansion; no new detector or rendering resource.

2026-11-21 — VM04 weights the existing broad high onset envelope with fixed presence/air balance. Presence lights sparse distant authored contours; air fades analytic sky specks and sun-edge shimmer. Reuse current materials (seven calls/geometries), quality-scale speck selection, avoid new particle simulation or extra detector. Shared-event spectral gating is approximate and documented; no MI changes.

2026-11-21 — Owner extended testing requests more reachable Crimson sun/travel maximums. Apply scene-local saturation at.35 calibrated energy, preserve original caps/gain/envelopes and shared audio interpretation. Deliberately trade upper-range distinction for reachable visual peaks; body/corona and other mappings stay intact.

2026-11-21 — Owner requests more visible VM04 details. Increase glint halo coverage/brightness, air speck size/brightness and edge shimmer; extend only the upper accent envelope. Lower speck density to1%/0.45% after inspecting the enlarged preview, preserving sparse accents and all accepted sun/travel/MI behavior.

2026-11-22 — VM05 uses two bounded scene-local slow-context values (density and valid brightness-weighted warmth),2/4s transitions or4/6s reduced. Reuse existing haze and shader sky/far fade, keeping foreground/emissive effects and sun shader intact. No fog plane or extra pass; keep shared MI/context unmodified.

2026-11-22 — VM06 is verification-only: preserve owner-approved effects and add combined production soak/checklist instead of speculative choreography changes. Separate generated/browser API evidence from owner full-song/native/device acceptance. Final gate stays open until required observations exist.

2026-11-22 — Owner closes original mapping roadmap and selects bounded VP00–VP05 polish workflow. VP00 protects clean6281d27 baseline using generated PCM, current DEV stationary override, source hashes and timestamped screenshots; production sources unchanged. Reject canvas video exports with missing scene elements rather than treating numeric/browser success as visual recording fidelity. Screenshot sequence fulfills VP00 option; do not infer musical synchronization or native evidence. Stop for each owner review; resume phrase is “Continue Crimson polish.”

2026-11-22 — VP01 broadens the existing ground shader event into a finite curved front, starts72 units ahead and retains approaching light through4.2s lifetime. Keep same pool/cursor and dark channel; no extra ripple system or event. Composited-browser screenshots provide reliable short motion proofs after VP00 canvas-readback artifacts. Compare local bright coverage, not whole-ground mean; preserve real-device performance limits.

2026-11-22 — Owner authorizes expanding current VP01 scope to sun/travel responsiveness. Shape validated low events only at the scene boundary with monotone1.2s/(s+.2), reused by independent sun/ground consumers. Body uses fixed-bass .35 scene saturation; travel cap24 at .25 energy. Preserve shared MI, route, original20% expansion cap and lifecycle. This is explicit owner feedback tuning, not automatic progression into VP04 or tempo inference.

2026-11-22 — VP02 boosts only scene-local high-mid rise presentation with monotone soft knee,1.25s readable travel and a brighter head/shorter dimmer trail. Keep existing qualifier, phase/selection, low-mid and rest behavior rather than adding detectors or full mountain outlines. Reuse current geometry/shader resources; owner reviews moving and fixed composited proofs.

2026-11-22 — VP03 separates near/mid/far using existing bank materials, depth haze and horizon tint: local cool middle fill, muted far violet and horizon-localized slow context. Keep near floor/sun pixels protected, unchanged reactive emissions/controllers, no global exposure or new fog system. Save fixed before/after plus same-source moving screenshots; owner judges composition.

2026-11-22 — VP04 verifies balance before changing approved curves. Ordered quiet/strong body/attack, finite low accent versus traveling wave and distinct mixed-input maxima support keeping current sun/ground/ridge/upper/atmosphere settings. Add tests/evidence without speculative tuning. Owner still judges musical coherence, clipping and hierarchy; do not reopen completed mappings.

2026-11-22 — Owner chooses constant Crimson walking over musical travel. Use fixed24 units/second independently of energy/gain/source/profile; retain reduced-motion/terrain-loading holds and delta safety. Keep musical interpretation exclusively in visual response, preserve route and shared DSP. Remove obsolete travel energy curve and update in-app copy; this supersedes prior silence/zero camera-stop behavior only.

2026-11-22 — VP05 retains accepted visuals and fixes measured rolling terrain GPU buffer growth. Own BufferGeometry/attributes together and explicitly dispose the primitive so R3F child detachment cannot hide buffers from Three cleanup. Final120s production resource trace is flat. Reconstruct VP00 from6281d27 with unchanged generated fixture/current DEV capture adapter and fixed camera; disclose timestamp/cadence limits rather than claiming original footage or soundtrack synchronization. Final owner gate remains open.

2026-11-22 — Owner “aproved” closes VP05 final artistic gate and the Crimson polish roadmap. Retain existing evidence and stop further effects/tuning unless specifically requested. Owner acceptance does not turn unreported native/device checks into verified results or authorize commit/deployment.

2026-11-22 — Owner approves a bounded post-polish star visibility follow-up. Keep existing sky shader/sparse star coordinates and air-event signal; widen Gaussian stars slightly, raise reactive emission and add faint static resting emission. Resting stars are intentionally independent of audio/zero Reactivity, while the musical accent still follows existing suppression. Preserve approved Crimson roadmap closure and other mappings.

2026-11-22 — Organize documentation by role: stable core guides/authoritative roadmaps at docs root, topic reports under reports/, immutable topic/milestone evidence under evidence/, and old chronological progress under history/. Keep current PROGRESS.md short and link the archive. Preserve captured JSON metadata rather than rewriting historical payloads. Add an offline local Markdown target check for future moves.

2026-11-22 — Nocturne's existing fixture groups stay on the accepted legacy `AudioSignal` response. Add only the new left cyan panel on the parallel validated Music Intelligence reader: high-mid six-band energy for sustained light, broad-mid onset events qualified by a bounded scene-local high-mid rise history for accents. Keep an independent material, point light and manual level. This avoids treating broad-mid events or overall song intensity as proof of a high-mid panel attack, without changing Music Intelligence or redesigning accepted groups.

2026-11-22 — The left cyan composition review replaces the first horizontal high-wall bar with one vertical 1.75 m diffuser at left `z=-7.3`, shorter/narrower than the right magenta fixture. A dark recess and existing frame finish set it into the wall; a single lower, shorter-range shadowless point light yields visible wall and wet-floor spill. Keep all other lighting, camera and neutral idle fill as approved. Preserve matched original/on/off browser captures and wait for owner visual review before any additional fixture.

2026-11-22 — Owner visually approves the one left cyan fixture. Generated-audio browser review confirms high-mid sustained response, band isolation, fade and an event accent, but the measured peak event addition (.071 over .335 sustained tail) appears subtle. Preserve the current mapping while reporting evidence and a narrowly scoped accent-only tuning option; no production response change or new fixture is authorized by the review itself.

2026-11-22 — Owner approves NT01 design and bounded NT02 migration. Require MI reader for Nocturne scene lighting, omit AudioSignal from disabled-tilt canvas invocation, and use MI for Nocturne activity feedback while adapters own source state. Use calibrated energy sustain and discrete onset accents rather than translating MI into fake legacy envelopes. Preserve cyan visual coefficients and fix frame/suppressed-event bookkeeping; keep shared DSP and other scene sources byte-identical. NT03 consolidation and NT04 owner parity review remain separate gates.

2026-11-22 — Owner “procced” authorizes NT03 after NT02. Use a single scene visual state and one borrowed MI read; retain broad/panel algorithms as frame-based subcontrollers for exact coefficient/output parity. Expose distinct named output objects without splitting approved material batches yet. Derive reflection source values from final fixtures and move Manual/Audio atmosphere weighting into state. Keep rendering as final-value delivery; NT04 owns full migration approval.

2026-11-22 — Owner authorizes NT04 verification after NT03. Preserve all source and compare Manual appearance against pre-migration e627ff8 rather than forcing old soft-knee brightness onto calibrated MI. Built-production lifecycle and actual reduced-motion generated-audio checks pass; retain exact Manual pixel matches and document dimmer audio-driven broad groups/haze for owner migration approval. NT05 remains gated; no production tuning in NT04.

2026-11-22 — Owner “proceed” accepts NT04 migration contrast and authorizes NT05. Split only original magenta material batches (one main, five secondary, two bridge); preserve all authored transforms and lights. Separate bounded bass/subBass bodies from a fresh low-event focal pulse, carry an old pulse tail through weaker retriggers, keep secondary glow weaker/slower and leave bridge at NT04 until NT07. Use existing MI unchanged; no cyan accent tuning or other artistic phase is inferred.

2026-11-22 — Owner “proceed” after NT05 authorizes NT06. Keep the approved high-mid panel unchanged; separate original cyan windows from six small panels. Use slow, low-amplitude mixed-mid window sustain and quicker low-mid detail sustain with locally qualified existing mid events. Preserve every transform and existing spill light; add one material batch only. Do not infer per-instrument events or introduce overall-intensity coupling. NT07 and final grouped lighting acceptance remain separate.


2026-11-22 — Owner “proceed” after NT06 authorizes NT07. Segment only the two existing bridge diffusers into contiguous thirds; choose existing low events for rhythmic direction rather than a guessed tempo or sustained-energy scanner. Use one920ms sweep and1.04s cooldown, dropping dense overlapping events so one readable sweep completes. Suppress this motion under reduced motion; retain uniform Manual. Reuse the bridge point with mean section brightness. Six bounded material batches are simpler than a custom instancing shader; measure whole-frame draws across reflection/main passes, not just the renderer's auto-reset last-pass counter. Owner music/device/grouped lighting review remains separate.


2026-11-22 — Owner “proceed” after NT07 authorizes NT08. Keep violet geometry/colors and both existing point lights; separate strips by side so high events accent one local group instead of the entire alley. Use presence/air sustain and qualified existing high events, alternating only accepted attacks. One240 ms envelope and400 ms cooldown prevent overlap and bound each bank to≤1.25 accepted attacks/s; owner comfort acceptance remains separate. Reduced motion suppresses accents. Browser inspection caught an initial far-spill name mismatch; corrected binding and rerun evidence now require exactly one point per bank. Stop for grouped NT05–NT08 lighting review before NT09.


2026-11-22 — Owner “proceed” after NT08 authorizes NT09. Keep existing wet-floor shader, material maps and lighting: matched final-output diagnostics with atmosphere frozen show credible local reflection and spill, including stronger magenta/cyan pavement color at higher levels. Do not add a second audio gain, synthetic floor streak or extra light where the actual reflected scene already supplies the response. Record bridge mirror images outside the fixed viewport and weak distant violet as framing/resolution limits. Verification-only phase; all89 source files unchanged. NT10 and owner environment/music/device review remain separate.


2026-11-22 — Owner “proceed” after NT09 authorizes NT10. Use validated context rather than another trend/section detector: cap distant illumination at.65, gate activity-driven depth by intensity, and guard centroid-derived tint with brightnessValid/finite values. Keep fog near17 and limit far66–74, preserving near contrast. Multi-second local response compounds upstream context smoothing deliberately; reduced motion is slower. Retain exact Manual appearance and existing palette/fog baseline without new material/pass/light. Do not tune fixtures or infer song-section labels; NT11 owns later coordination.


2026-11-22 — Owner “proceed” after NT10 authorizes NT11 coordination review. The generated intro/bass/mid/dense/breakdown/return arrangement shows distinct existing roles, restrained secondary/window levels and bounded localized violet/bridge overlap. Retain mappings rather than add speculative cross-group dimming or a global limiter that would couple the approved cyan fixture to other lights. No new energy history or unsupported section detection. No production changes; owner NT11 artistic/grouped environment approval remains required before NT12.


2026-11-22 — Owner “proceed” after NT11 authorizes NT12, with “continue” resuming the same matrix. Keep the three evidence layers distinct: ideal feature contract for exact guards, synthetic spectra for unchanged MI routing/calibration, and real browser-generated PCM for FFT leakage and final delivery. Use450 Hz for low-mid qualification because1 kHz is high-mid. Do not retune DSP or add thresholds to hide expected FFT leakage or previous-band decay; all intended criteria pass. NT13 remains live owner-authorized music review, without persisting captured media.


2026-11-22 — NT13 owner confirms bass timing but finds the corridor too dim versus Manual. Trace the gap to full Manual outputs versus restrained Audio levels. Prepare a bounded local spill-only preview before changing production: main point1.5×, windows/details2× capped at original full intensities, preserving emitters/approved cyan/other points/atmosphere/Manual. No global exposure or DSP change. Choice and live re-review remain pending.


2026-11-22 — Owner “do the lift” approves the matched NT13 spill proposal. Implement only the normalized final point-spill output in visualState.ts, with caps at original full intensities and Manual bypass. Preserve the approved cyan light and all emitter/timing/controller/atmosphere behavior exactly; tests separate point delivery from emission. Rebuild the local preview and repeat generated/owner listening checks. No additional broad brightness or DSP adjustment is inferred.

## 2026-11-22 — NT13-R0 evidence policy and phase boundary

Owner approved R0 of the refinement roadmap and chose generated captures plus live owner review. Record generated sources/scenes only; owner music remains live/text-only. This revises the roadmap's real-song recording method without waiving final musical/artistic review. R0 preserves all90 production source files and the existing spill lift; it diagnoses low delivered levels and environmental readability under matched exposure. No R1 tuning or NT14 continuation is authorized by the baseline's automated success. Preserve separate owner checkpoints for each refinement phase.

## 2026-11-22 — NT13-R1 restrained fill and final response curve

Owner “proceed” following R0 authorizes R1. Use a small scene-local cool ambient contribution for static visibility, separately from fixture energy, plus `2x/(1+x)` on Audio final fixture levels. This preserves existing MI/controller roles/timing, exact zero/full output and Manual controls while lifting modest signals. Ambient fill intentionally affects Manual surfaces as well; exposure and authored materials remain unchanged. The prior spill gains remain in effect. A generic final calibration does not replace band-specific response with global intensity. Real-song calibration/legibility remain unverified until owner live/text review; stop before R2 rather than treating generated success as artistic approval.

## 2026-11-22 — NT13-R2 instanced event choreography

Owner “proceed” after R1 authorizes R2 only. Reuse current fixture geometry/instancing with one per-instance emission float rather than split meshes or add traveling point lights. Secondary magenta follows low-onset echoes; windows/details use locally qualified broad mid events; bridge changes to high onsets to give treble a narrow spatial role. Existing controller sustain, approved panel, main magenta, R1 fill/calibration and MI stay unchanged. Cooldowns prevent queues/restarts and reduced motion suppresses travel. Point spill follows existing group means and cannot physically travel per fixture; reflect actual source emission. Retain the Low Manual-on reference discrepancy explicitly instead of claiming blanket pixel identity or expanding into a renderer fix. R2's musical readability requires owner review before R3.

## 2026-11-22 — NT13-R3 restrained environmental participation

Owner “its looking greats, lets keep going” supplies positive R2 visual feedback and authorizes R3. Reuse9 existing structural ribs for scaled real bridge accents, enhance only bright pixels of the real wet reflection and add one local unshadowed far-depth point driven by existing slow context. Preserve the approved fixtures, R1 resting fill, R2 choreography, camera and analysis. A small haze coefficient lift supports depth. Accept the explicit7→8 point cost for motivated wall/gate illumination rather than add new geometry/passes or global exposure. Real-song/device approval is still outstanding; R4 requires separate continuation.

## 2026-11-23 — NT13-R4 preserve approved appearance; measure selected hardware

Owner authorizes R4, selects this Linux/GTX1660 SUPER as target and reports native minimize/restore and fullscreen Escape both work. Preserve all91 production sources: no reproducible signal/delivery issue justifies visual tuning. Use generated spectrum/lifecycle inputs, explicit temporary reader simulations and source-scheduled benchmark validation. Retain failed harness attempts rather than relabel them; assess completed matrix data separately from passing replacement UI checks. Forced headless CDP freeze did not resume rAF and stays unverified; actual hidden-tab/native-owner checks are the applicable passing evidence. Establish30s target frame/GPU observations without inventing a hard budget or claiming isolated Low-quality speedup. R5/final real-song approval and NT14 remain separate.

## 2026-11-23 — NT13-R5 matched-source comparison, owner-only artistic decision

Owner “proceed” after R4 authorizes fresh final comparisons, not automatic NT13 approval. Align separate Noctune/Crimson recordings by measured generated-source time and use one generated soundtrack; preserve Noctune fixed pose and Crimson authored travel, labeling that confound. Same exposure/viewport/quality does not equalize scene-specific material/light semantics. Preserve all91 production sources and the approved appearance. Review the five roadmap criteria with evidence, but leave quiet legibility, perceptual clarity and expressive parity to the owner. Existing generated-capture plus live/text-only owner-song policy persists; never capture private music or infer all listening cases from prior bass/appearance/native-window notes. No new tuning or NT14 without the required decision/continuation.

## 2026-11-23 — NT13/R5 owner approval recorded

Owner replies “Approve all five visual criteria” and “all worked” to the explicit current-build question listing all five listening cases. Accept these text observations as the required owner artistic/music decision under the approved privacy-preserving review policy; do not demand track names/audio or infer additional technical measurements. Close R5/NT13. Preserve all91 production sources and comparison evidence. Stop at the phase boundary: NT14 is next after continuation, and artistic approval is not commit/push authorization.

## 2026-11-23 — Owner skips NT14 and NT15

Honor the explicit direction “we skip nt 14 and 15.” Record both roadmap phases as skipped, not successful verification or completed closeout. Preserve NT13/R5 approval, current code, existing evidence and documented limitations. No additional implementation, benchmark, handoff package, commit or push is implied. No further Noctune phase is queued.

## 2026-11-23 — Direct landscape/audio actions; smaller Options scope

Implement the owner's explicit UI request across all landscapes. Move existing source/landscape controls to a persistent bottom toolbar; keep status/quality/disconnect/Nocturne preview under Options. Replace per-scene ECHO labels with landscape names. Remove Reactivity/fullscreen controls from the public host and retain full-default1 scene response rather than change audio mappings. Keep local volume, reduced motion, native capture prompts and source continuity. This is separate work from NT14/NT15, which remain skipped. No new dependency, global desktop change or commit authorization.

## 2026-11-23 — Public controls visually approved

Owner says “looks good” after reviewing the updated interface. Record the UI task as approved; preserve current implementation. No further change, commit or push is authorized by this feedback.


## Lavender Peaks LP01 execution choices — 2026-11-23

Owner explicitly selects continuous gentle drift rather than retaining audio-dependent travel, and the attached three-panel storyboard plus written description rather than waiting for an animated orb reference. Preserve six authored profiles and approved UI; do not restore a public speed/Reactivity/fullscreen control. Begin with fixed silhouettes and independent band shading. Exact far-to-near air/presence/highMids/lowMids/bass/subBass mapping and initial scene constants are proposed in the authoritative Lavender roadmap for approval before LP02, not claimed as an existing contract.

Retain the established generated-capture + owner live/text-only listening evidence policy: no owner media recording or inspection. LP01 is an audit with documentation and temporary-copy probes only. Shared Music Intelligence, other scenes and existing uncommitted work remain untouched. Visual approvals after LP04/LP07 and LP09 closeout are still mandatory; no commit/push authorized.


## Lavender Peaks LP02 approval and scope — 2026-11-23

Owner “proceed” after LP01 accepts the documented mapping and authorizes the MI migration. Implement six-band scalar response/lifecycle foundations and the approved autonomous drift now, while retaining existing sun shader and ridge gradients. LP03 makes the independent ridge responses visible; do not introduce corona/contour illumination early. No existing MI engine change is needed. Read the borrowed view once/frame, copy bounded scalars, qualify broad events with own-band rises, seed sequence on session/re-entry, and clear musical events on invalid/disabled/reduced input.

Keep live scalar sampling in reduced motion to avoid stale demand-rendered response. This has a rendering-duty cost versus prior reduced-mode demand rendering; record it for LP08 rather than claiming identical power/performance. Source hashes preserve the other88existing source files and prior UI work. Live real-song observations remain pending, not approved by “proceed.” Stop at LP02 review; no commit/push.


## Lavender Peaks LP03 — shading before deformation (2026-11-23)

Owner “proceed” after LP02 authorizes independent six-ridge visual behavior. Keep authored profiles fixed, as selected in the migration plan. Vary only existing materials: softer high-frequency distant response, more expressive middle slopes, slower weighted foreground. Separate sustain from brief qualified-event tint patches; reserve travelling contours for LP06 and the small corona for LP04. Existing drift, sun, camera, palette, quality/UI and other landscapes remain unchanged.

Use local periodic color fields rather than vertex displacement, tile-local discontinuities or shared global-intensity flashes. Band-specific attack/release settings now belong with the corresponding visual weights. Use a source-time held-state ablation to compare the original LP02 gradient against LP03 under identical geometry/sun/input; this is a renderer comparison, not a recording of owner audio or a native-device performance certificate. Retain actual failure evidence separately, and require console/pixel checks before accepting generated browser captures.


## Lavender Peaks LP04 — small corona candidate (2026-11-23)

Owner “proceed” after LP03 authorizes LP04 only. Extend the existing sky shader rather than adding another renderer/effect stack. Keep the sun core fixed and replace its interim rigid bass pulse with small irregular strand deformation and local accents. Hard outer radius1.35×sun radius; three translucent ivory/rose strands, no particles, orange wireframe or full-screen exposure change. Existing six ridge shading, geometry, drift, camera and UI are untouched.

Separate autonomous rest, sustained envelope/detail and qualified-event accents. Low mids alone retain only intrinsic rest. Accent sensitivity is a bounded scene-local2.5 multiplier, preserving shared MI extraction unchanged. Reduced motion freezes strand shape; zero Reactivity preserves faint autonomous rest. Use generated recordings and text-only owner listening; no private media capture. Stop after LP04 for explicit owner approval of corona scale/motion before LP05 illumination, as required by the roadmap. No commit/push.


## Lavender Peaks LP04 approval / LP05 scope — 2026-11-23

Owner “aproved” after the review and next-phase explanation approves the corona scale/motion; “continue” confirms LP05. Treat that visual gate as approved, without claiming real-song/native/device checks occurred. Add only local sky/slopes/mist and delayed glints; keep the approved corona module/settings, profiles, six-band response, camera, drift, UI and other landscapes intact. No LP06 travelling strokes yet, no commit/push.

Use one tiny immutable profile texture rather than approximate edge distances, vertex deformation, six new overlay meshes or per-fragment Gaussian terrain reconstruction. This adds one4632byte texture but preserves silhouette geometry/draw count and gives exact sampled contour attachment through scrolling. Reference Three r186 DataTexture defaults/docs via Context7; nearest/manual interpolation avoids float-linear capability assumptions. Exclude the approved emitter footprint from sky tint. Share one bounded source for all environmental color masks, and limit the2nearest layers to their existing independent band treatment. Record actual GPU cost as pending LP08 rather than inferring it from draw count.


## Lavender Peaks LP06 scope and trace budget — 2026-11-23

Owner “proceed” after LP05 authorizes travelling contour highlights only. Use the existing narrow-band qualification result, not rising brightness or a new audio detector, to spawn traces. Keep a global3slot pool, one/ridge, no unbounded event queues. Prefer sparse readable movement: consume busy/full-pool events without restarts, stagger simultaneous starts, and preserve strength ordering within a bounded scene-local opacity calibration. Different bands retain stable recipients/directions; no instrument/beat claims.

Reuse the immutable terrain profile texture and existing materials to preserve geometry, camera and draw count. Bind heads/tails in periodic local coordinates so they move with terrain, while the LP05 sun field remains in world coordinates. Retain approved corona/environmental lighting and all other scenes. Generated PCM demonstrates real integrated motion; held-state path/seam replays independently test optical continuity. Owner real-song/coherence and final hardware checks remain pending; stop at LP06 before LP07. No commit/push authorized.


## Lavender corona readability refinement — 2026-11-23

Owner “yes parove” explicitly approves the current/proposed comparison after reporting that the corona felt small and its music response was hard to perceive. Apply only the demonstrated scene-local shape changes: strand radius1.15×, sustained wave3×, local accent displacement1.8×, amplitude cap.22 and hard footprint1.65×fixed core. Preserve MI, signal qualification/timing, intrinsic rest, reduced-motion behavior, opacity/palette and remaining scene. Existing sky exclusion follows the updated emitter footprint automatically; no new light source or environmental response algorithm. No LP07 authorization inferred.


## Lavender independent sun pulse — 2026-11-23

Owner explicitly supersedes the fixed-core behavior while preserving the approved corona. Restore the original disk/haze visual equations,20/80 body/attack weighting and40ms/220ms smoothing. Use existing MI low-band targets and qualified accents; do not restore legacy AudioSignal reads. Keep unscaled radial distance for corona drawing, its existing settings/state and LP05 lighting source. This permits the disk to pulse independently without scaling the whole emitter/corona. No next-phase authorization inferred.


## Lavender LP07 slow atmosphere and hierarchy — 2026-11-23

Owner continuation authorizes LP07 only. Preserve corona and restored sun pulse, own-band ridge responses and existing delayed local lighting. Copy slow context during the existing MI read, then use2/4s density/warmth envelopes (4/6s reduced) for restrained sky/valley/depth color modulation. Existing geometry and profile texture suffice; avoid particles, new draw calls, random motion or context driving attacks. Keep the3slot staggered trace pool and apply at most25% context-dependent opacity restraint for dense passages. Context warmth requires valid brightness; gain0/session clears and stale releases. Protect emitter pixels from broad sky treatment. Generated cases validate behavior; acoustic/electronic real-song feel requires owner text review before the LP07 gate can close.


## Lavender LP08 / LP09 skipped by owner — 2026-11-23

Owner explicitly requests skipping LP08 and LP09. Retain current implementation and historical evidence; mark these phases skipped rather than verified/completed. Do not infer LP07 listening/visual approval or final real-music/performance acceptance. No new phase or implementation is authorized by the skip; await the next task.


## Lavender organic bass corona — 2026-11-23

Owner approves the focused implementation plan after requesting visible noise-driven silhouette deformation. Keep the existing1.65×core footprint, pastel2D strands, mountain occlusion and environmental light. Latest stable-core instruction supersedes restored disk expansion; owner selects retaining only its gentle bass brightness/haze pulse. Shared MI and all other landscapes remain unchanged; LP08/LP09 stay skipped.

Replace regular bass harmonics with deterministic angular/time-periodic quintic value noise,2octaves and3distinct strand scales/phases. Use existing gain-scaled bass/sub-bass targets rather than cascaded slow ridge envelopes:65/35 blend divided by.45,80ms/450ms smoothing, amplitude.018+.202×drive capped.22. Preserve high-mid/upper detail; keep smooth radial bounds outside core and within existing footprint. Qualified low notices spawn3bounded650ms travelling lobes, deduplicated by session/sequence and scaled against actual observed onset strengths using.22reference. No new audio detector or event interpretation. Same envelope/lobe activity feeds existing illumination.

Record generated actual-MI distributions and equal-opacity polar contour measurements; brightness/mean-radius changes alone cannot pass silhouette acceptance. Compare identical headless fixed-scene frame timing, distinguish CPU submission from GPU execution/native performance, and stop for owner visual review without committing.


## Lavender gentle sun size pulse alongside organic corona — 2026-11-23

Owner requests a little sun pulsation after the organic-corona implementation. Permit disk/haze size1+.08sunPulse, preserving existing MI pulse/brightness timing. This supersedes the fixed-core restriction only. Keep unscaled distance for corona; no changes to its noise/accents/footprint or shared illumination. No new phase or commit authorized.


## Lavender stronger sun pulse — 2026-11-23

Owner finds the.08radius pulse barely visible and requests more. Raise only the independent sun/haze size coefficient to.24 (3×modulation). Preserve the MI sunPulse mapping/timing, brightness and unscaled corona coordinates; no corona/engine/other-landscape changes.


## Bloom BL02 3D terrain / orthographic composition — 2026-11-23

Owner selects orthographic framing and approves BL02 only. Build two static closed indexed mountain banks from authored silhouette cross-sections, smooth normals, matte vertex colors, existing lights and depth fog. Disable Bloom camera tilt now for the level composition gate, while retaining all existing halo/lake/audio behavior until later phases. No shared-engine changes or new dependencies/assets/render passes.

Keep actual shore slopes rather than visible closure walls; complete foreground descent behind the current lake plane so the lake remains broad.64×15/32×7cell grids include closures within5000/1500terrain triangle budgets. Dispose replaced/unmounted geometry explicitly. Technical checks do not approve aesthetics; stop at BL02. The new monolith concept is specified by the roadmap's written direction; available old reference board is not an exact new-scene target.


## Bloom BL02 ridge / shoreline refinement — 2026-11-23

Owner approves the proposed first refinement: natural ridge structure and softer shoreline endings. Keep projection, lights/materials/fog, hero, lake and audio unchanged. Replace straight profile joins with monotone cubic interpolation; add broad offset spurs and gentle static depth warp for connected shoulders/saddles. Separate a shallow submerged toe from the buried closure so visible mountains descend to the lake rather than ending as cliffs. Preserve the same closed topology/quality budgets and keep BL03 unstarted.


## Bloom BL02 depth / rock / portrait refinement — 2026-11-23

Owner clarifies continuation means remaining mountain refinements, not BL03. Separate cool distant/darker middle/near color bands within the existing palette, and bake broad face variation/selected convex crest tint into existing vertex colors. Keep rough nonmetallic material, lighting/fog and all renderer resources unchanged. Bring connected inner shoulders into the existing portrait frustum using shared world-space geometry, without aspect-specific mountains or camera changes. Maintain the open shoreline from the prior refinement. No hero/lake/audio/other-landscape changes or phase advancement.


## Bloom BL02 stronger range composition — 2026-11-23

Owner requests further mountain improvement after the detail pass. Strengthen range hierarchy with offset middle/near crests overlapping the far skyline, diagonal drainage depressions and restrained cavity/face contrast. Keep the existing closed topology, camera, lights/fog, halo, lake and audio. Make this a visible structural refinement rather than adding surface noise or new objects. Preserve prior evidence; stop for mountain visual review without starting BL03.


## Bloom BL03 static monolith / reflection transition — 2026-11-23

Owner “proceed” approves the presented BL03 plan. Replace eight torus fragments with one solid graphite/basalt-like rectangular slab (1.2×3.6×.5 at.6/2.25, yaw−.22), narrow rose seam and dark inset border. No optional fragments. Keep mountains/camera/lights/palette and no new reflection pass. Hero stays at the authored hover; old bass scaling, fragment motion and ring reflection are retired. Existing legacy sky/water response remains until BL06; no MI migration now.

A single authored pose supplies projected body/front/side/seam bounds to the existing water shader. Reflection compresses mirrored height by.82, adds gentle horizontal breakup/attenuation and subtle contact ripples. No full-scene capture or physical planar reflection; verify alignment and absence of the old circular ghost. Stop for BL03 visual review before BL04.


## Bloom BL03 luminous beam refinement — 2026-11-23

Owner says the seam reads as a stripe and requests a light beam. Replace the dark rectangular seam border with a localized soft additive glow and feather the bright central core/endpoints. Keep emission confined to the existing monolith surface; increase the matching lake seam glow, with no full-frame bloom, extra lights or phase advancement. Static hero and all surrounding scene/audio systems stay unchanged.


## Bloom BL03 visual approval / BL04 planning — 2026-11-23

Owner explicitly approves the monolith/beam/reflection with “alright looks good to me” and requests continuation. Record BL03 visual acceptance only; no inference of native/permitted-song verification. Plan BL04 autonomous auroras and shared ambient light next, following the existing per-phase approval workflow.


## Bloom BL04 autonomous aurora illumination — 2026-11-23

Owner “aproved” approves the concrete BL04 plan:2soft shader curtains,1at Low, slow autonomous movement and coordinated color/light across terrain, haze, monolith and lake. Integrate folds into existing sky/water passes rather than adding transparent full-screen meshes or volumetrics. Reuse the existing directional light and fog with restrained shared modulation; keep monolith/beam/geometry/camera/audio unchanged. No trails or MI linkage until later phases. Reduced motion freezes aurora phase/hue/illumination.

## 2026-11-23 — bounded post-BL04 BL03 stone correction

Owner approves reopening the monolith only against the newly supplied Resonant Monolith concept. Use a closed chamfered cross-section with an actual seam groove, deterministic procedural stone shading and two static asymmetric fragments. Retain the existing standard directional-light/fog path, adding restrained stone-only side fill and shared aurora-tinted material illumination rather than changing the global key or mountains. Update only the hero/fragment analytic lake image. Geometry stays stationary; no audio mapping, BL05, global bloom, render target or dependency. Current source/reflection comparisons—not the older acceptance—are the next owner visual gate.

## 2026-11-23 — BL05 terrain-attached downhill ribbons

Owner approves two autonomous trails at Standard and one at Low, before BL06 music linkage. Sample the actual indexed terrain triangles rather than the smoother height function: otherwise Low ribbons can float above or disappear into its coarser surface. Reuse both generated bank geometries unchanged and batch the ribbons into one draw. Static topology, a bounded scene-local shader clock, staggered accents and derivative antialiasing provide direction without dynamic buffers or full-scene bloom. Preserve depth testing to allow terrain/lake occlusion. Reduced motion freezes phase; do not add public diagnostic controls or audio inputs.

## 2026-11-23 — BL06 Music Intelligence migration and explicit material controls

Owner approves replacing Bloom's legacy signal input with the existing borrowed feature reader. Keep all calibrated analysis/capture behavior unchanged. One scene-local controller owns bounded energy/rise histories, event watermark/session/freshness guards, independent musical envelopes and autonomous clocks; meshes never read features individually. Tune from generated production-MI calibration, using a fixed monotonic knee rather than adaptive song normalization. Preserve the two approved trail lanes and add separate high-band fine highlights, not more geometry. Drive reflected hero bounds/core from final pose/light values, and use spatial low-cost lake effects rather than a render target.

Browser pixel checks exposed a stale implicit stone/core uniform binding despite valid scalar core output. The stone now owns explicit seam/aurora uniforms updated through its material ref, with regression identity tests and screenshot brightness evidence. Default trail opacity is capped at .95, altering only five resting core pixels outside the corrected stone area; approved character and all terrain/sky/camera remain. Old compatibility helpers/debug source remain unreferenced by Bloom runtime, avoiding unnecessary shared-camera/test rewrites. BL07 choreography awaits its own approval.

## 2026-11-23 — BL07 independent environmental evolution and monolith inertia

Owner approves a bounded choreography refinement. Keep the accepted seam calibration and intrinsic clocks, geometry/materials/camera and MI engine untouched. Slow the environmental context envelope, then place an exact critically damped motion step after the existing lift/yaw targets. This lets the sky lead a build and the monolith follow/settle without adding scaling, oscillatory spring overshoot or a physics dependency. Preserve all existing pose bounds and update the same final-pose reflection. Separate the two musical trail speed gains while retaining their idle speed.

Low rings previously latched the maximum strength across successive events until timeout. Merge compatible low sub-band strength only within one event, then use that event's fresh strength/age; quiet hits cannot inherit old loudness. Validate with the same production-MI generated sequence replayed against preserved BL06 code, plus actual generated audio/source lifecycle. Test-phase labels never imply musical-section detection. Do not approve aesthetics or native/real-song gates from numeric replay alone.

## 2026-11-23 — consolidated BL07 supersedes intensity-driven lift

Owner explicitly requests complete refinement and chooses a shared-tab-only manual floating control. Local source lifecycle is authoritative; silent playing media keeps floating, while pause/disconnect selects smooth descent. Do not infer source transport from MI amplitude or legacy AudioSignal. Preserve continuous phase/velocity across state changes. Add fine-pointer orbit only inside Bloom and keep backdrop horizon fixed; project final optical anchors into the existing lake shader rather than adding an unmeasured full-scene reflector. Fine-pointer capability is explicitly emulated only for automated camera evidence because headless reports no hover hardware; owner native feel remains a gate.

## 2026-11-23 — close BL07 code/optical evidence gaps without claiming native acceptance

Owner reposts the consolidated request after completion was overstated. Add the missing qualified independent stone impulses and replace bounding-box reflection silhouettes with the exact shared source triangle buffers. This adds four lightweight draws, not an unmeasured full-scene reflection technique. Validate the GPU silhouettes against CPU triangle rasterization across all nine pointer positions with1px antialias tolerance; keep wet/lighting diagnostics out of production. Record native pointer/shared-tab/real-song and owner approval as open section10 gates, even when implementation/controlled checks pass. No BL08 or automatic commit.

## 2026-11-23 — BL07 perceptibility follows delivered pixels, not only control activity

The owner's follow-up identifies visual weakness despite working controller values. Preserve source/MI/lifecycle/geometry and tune scene-local scale, contrast and route placement. Direct material-owned aurora excess uses the same final color/strength as sky/lake but only lights exposed mountain/stone faces; do not raise global ambient or change the shared engine. Keep body/detail pulse classification within the existing bounded slots. Compare identical inputs/camera/pose and isolate final surface controls to prove actual pixels respond. Enlarged low rings taper before the existing3s event cap to avoid a visible cutoff. All automated/annotated evidence supports owner review; it cannot approve aesthetics, native controls or actual-song listening. No BL08 or commit/push.

## 2026-11-23 — BL08 preserves approved visuals when audit finds no necessary correction

Owner approves the visual direction and authorizes BL08. Responsive/quality/resource checks support keeping the current production scene. Existing Low mode supplies lower geometry, one aurora layer and reduced DPR; do not add another fallback or tune accepted materials without evidence of need. Record shader/GPU/driver-memory/native measurements as unmeasured instead of deriving them from vsync cadence and CPU buffer sizes. Separate the installed R3F-created Clock deprecation from WebGL errors; dependency migration would affect the shared host and is outside this Bloom pass. Carry native/real-song gates forward; BL09 still requires owner authorization.

## 2026-11-23 — owner skips Bloom BL09

Owner explicitly skips the proposed final cross-landscape musical acceptance phase. Preserve the approved BL08/Bloom baseline and stop; do not re-request the skipped gate or claim its tests passed. Existing evidence limitations remain factual. This instruction does not authorize further production changes, commit or push.

## 2026-11-23 — APP01 separates audio ownership, processing health and musical activity

Owner approves the application audit roadmap. Implement only its first reviewable phase: typed analysis-start results plus independent processing health, propagated to existing adapters and a visible shell status/recovery area. A received track is insufficient to declare successful analysis. Preserve all approved scene files, musical calculations and the boolean element-attachment API used by development diagnostics. UI status uses the existing low-rate timer; musical features stay outside React state. Error reasons survive teardown in the owning source publication. Context-specific recovery actions do not trigger permissions automatically, and synthetic fault checks are never labeled native capture verification. Stop for APP01 review; broader layout, transactional switching, startup, compatibility and documentation reorganization remain later phases.

## 2026-11-24 — owner-approved orthographic tilt enables physical Bloom water

A horizontal lake is edge-on under Bloom's original level orthographic view. Owner approved a3°downward neutral pitch after isolated framing/grid comparisons; retain projection/zoom/pointer bounds and shift distance/fog/backdrop bookkeeping only inside Bloom. Replace the flat card with GPU-displaced geometry; concentrate mesh density around the existing small ripple packet instead of uniformly oversampling a360unit foreground. Use the installed orthographic-compatible Reflector for one capped mean-plane capture, then coherent normal distortion/aurora environment shading. Measured whole-scene GPU p95 stays below4.9ms on the target GTX1660SUPER headless samples; this supports the bounded pass here, not a universal performance claim. Other generators/materials/MI remain byte-identical. Physical depth now occludes submerged foreground bank geometry; disclose this for owner visual acceptance rather than changing mountains or pretending composition pixels are identical. No next phase or commit without authorization.

## 2026-11-26 — APP02 keeps the working source until a replacement succeeds

Analysis owns one input, and preparing it closes the previous context, so a playing file cannot keep running behind the tab picker. Instead of a new multi-input analysis design, App releases the file, remembers it and its position, and reloads it (paused, same position) if sharing is cancelled, denied or fails. Cancel restores immediately because ECHO cannot close the native picker. Opening a file while a source is active first probes it with a throwaway element; the current tab or file keeps running unless the browser can open the new file. A per-request token stops a slow earlier request from undoing a later one. Failures use a role=alert region; routine status stays polite. When large text leaves too little room above the controls, Options pins to the top like the existing short-window rule. Scene files changed only in their fallback strings.

## 2026-11-26 — APP03 loads secondary landscapes on demand and reports context loss from the shared host

Bloom (first view) stays in the main bundle; the other three load as chunks, preloaded at idle only after the first real frame (the page is idle during canvas setup, so plain idle scheduling fetched them before Bloom drew). Unloaded choices keep the current landscape on screen; latest choice wins. Context loss is reported by `LandscapeCanvas` into a change-only store, so no scene file or per-frame React state is involved; Restart remounts the landscape by key. A deliberate analysis reset after >250ms main-thread gaps remains and is recorded, not changed.
