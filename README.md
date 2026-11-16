# ECHO

**Your music. Another world.**

A client-side audio visualizer built around Bloom: a full-viewport, atmospheric landscape. The scene starts with ambient motion; audio is optional. Only ECHO branding and the Bloom scene label remain on the landscape. All controls live in the compact chooser opened by **Bloom** at the bottom left.

## Run locally

Verified with Node.js 24.11.0 and npm 11.6.1.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the URL printed by Vite (normally http://127.0.0.1:5173/).

## Use ECHO

Click **Bloom** to open the chooser, or focus it with Tab and press Space/Enter.

- **Share a tab:** choose a permitted browser tab and enable Share tab audio in the native picker. Keep playback in that tab. The browser also requests video; ECHO does not read or display it.
- **Open audio file:** select a local browser-supported file, then Play/Pause/Replay. Volume affects local playback only.
- **Disconnect / Cancel sharing:** release the selected source or cancel ECHO's pending sharing request. Close a pending native picker yourself too.
- **Reactivity:** changes visual amplitude, not sound volume.
- **Graphics quality:** Standard preserves the existing drawing resolution; Low is softer and renders fewer pixels. The choice lasts for the page session.
- **Enter/Exit fullscreen:** expands the landscape and chooser using the browser's native API. Native Escape remains available.

Close the chooser using its close button, the Bloom label, Escape or a click on the landscape. Closing it keeps playback running. On small/short screens the chooser scrolls internally; the landscape remains full-screen without page scrolling. Reduced-motion preferences remain supported.

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

- [Progress](docs/PROGRESS.md): actual checkpoint and next action.
- [Roadmap](docs/ROADMAP.md): approved task boundaries.
- [Vision](docs/VISION.md), [art direction](docs/ART_DIRECTION.md) and [motion](docs/MOTION.md).
- [Architecture](docs/ARCHITECTURE.md), [decisions](docs/DECISIONS.md), [verification](docs/VERIFICATION.md) and [evaluation](docs/EVALUATION.md).
- [Workflow](docs/WORKFLOW.md): one reviewed task at a time; no automatic publishing.

Known chopped-motion/perceptual refinement remains deferred by the owner. The existing large-JS-chunk and Three.Clock warnings remain documented. Current-build hardware performance and actual screen-reader usability are not established by software-browser checks. No new world, microphone, backend, account, recording or upload feature is included.
