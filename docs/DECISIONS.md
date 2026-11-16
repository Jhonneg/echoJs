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
