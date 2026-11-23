# ECHO

**Your music. Another world.**

A client-side audio visualizer with full-viewport landscapes. Bloom starts with ambient motion and can react to audio; Lavender Peaks previews sideways mountain motion driven by shared music intensity and frequency balance and a bass-pulsing sun. Crimson Horizon travels forward at a constant pace through an endless 3D ridged valley, with a gentle mouse-following viewpoint. Its pink sun responds to musical energy and strong bass hits, while its surrounding glow follows musical activity against a nightshade sky. Silence dims the sun while travel continues. The landscape name appears at the top left. Landscape selection, Share a tab and Open audio file are available directly in the bottom toolbar. Options opens the remaining settings; selecting a local file also shows a compact player on the landscape.

## Run locally

Verified with Node.js 24.11.0 and npm 11.6.1.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite (normally http://127.0.0.1:5173/).

For the temporary bass-motion comparison, restart the dev server with `VITE_BASS_MOTION_VARIANT=off`, `halo`, or `camera` before `npm run dev`. With no setting, the halo and camera move together (`both`). This setting is internal; it does not add a visitor control.

## Use ECHO

Bloom is selected initially. Use the bottom toolbar to change landscape, share a permitted audio tab or open a local audio file. Open Options for status and the remaining settings; keyboard users can focus Options and press Space/Enter.

- **Share a tab:** choose a permitted browser tab and enable Share tab audio in the native picker. Keep playback in that tab. The browser also requests video; ECHO does not read or display it.
- **Open audio file:** select a local browser-supported file, then use the on-scene Play/Pause/Replay and volume controls. Volume affects local playback only.
- **Disconnect / Cancel sharing (in Options):** release the selected source or cancel ECHO's pending sharing request. Close a pending native picker yourself too.
- **Landscape:** switch between Bloom, Nocturne, Lavender Peaks and Crimson Horizon without stopping audio. The choice lasts for the page session.
- **Graphics quality (in Options):** Standard preserves the existing drawing resolution; Low is softer and renders fewer pixels. The choice lasts for the page session.

Close Options using its close button, Options again, Escape or a click outside the panel. Closing it keeps playback running. On small/short screens the panel scrolls internally and the toolbar stacks without page scrolling. Visual response stays at its full default strength, with reduced-motion preferences respected. Local playback volume remains adjustable; Reactivity and fullscreen buttons are not part of the public controls.

Audio stays on your device. ECHO does not record or upload it. The reference environment is desktop Brave on Arch Linux; other browser/OS combinations and mobile capture remain unverified. Browser capture restrictions apply; this is not a streaming-provider integration or arbitrary system-audio capture tool.

## Verify a build

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

Open http://127.0.0.1:4173/. `dist/` contains the static build; nothing is deployed automatically. For permitted synthetic local audio, `npm run fixture` prints the generated WAV path. No recorded media is bundled.

See [the release checklist](docs/RELEASE_CHECKLIST.md) for current evidence, manual-pending checks and known limitations. Historical diagnostics, visual-debug and benchmark panels are no longer mounted in the visitor interface. No developer-access mode was added.

## Project context

- [Documentation index](docs/README.md): guides, reports, evidence and history.
- [Progress](docs/PROGRESS.md): actual checkpoint and next action.
- [Roadmap](docs/ROADMAP.md): approved task boundaries.
- [Vision](docs/VISION.md), [art direction](docs/ART_DIRECTION.md) and [motion](docs/MOTION.md).
- [Architecture](docs/ARCHITECTURE.md), [decisions](docs/DECISIONS.md), [verification](docs/VERIFICATION.md) and [evaluation](docs/EVALUATION.md).
- [Workflow](docs/WORKFLOW.md): one reviewed task at a time; no automatic publishing.

Known chopped-motion/perceptual refinement remains deferred by the owner. The existing large-JS-chunk and Three.Clock warnings remain documented. Current-build hardware performance and actual screen-reader usability are not established by software-browser checks. No new world, microphone, backend, account, recording or upload feature is included.
