# ECHO

**Your music. Another world.**

A browser-first audio visualizer that transforms permitted audio into living, atmospheric landscapes. The P01 scaffold provides a minimal diagnostics placeholder. Audio capture, analysis, and scene rendering are pending later roadmap tasks.

## Start here (human)
1. Extract these files into the root of a new ECHO repository (keep `.agents/`). Do not overwrite existing files without reviewing changes.
2. Open that folder in VS Code; initialize Git if you want version-controlled checkpoints. Open a new Codex session so repository skills can be discovered.
3. Context7 and Playwright MCP have been verified successfully; see `docs/PROGRESS.md` for evidence and `docs/WORKFLOW.md` for smoke procedures. No global config or secrets are supplied.
4. Paste the contents of `START_HERE.md` into Codex. Review its proposed plan before approving any implementation.
5. After each approved task review results, update/commit the checkpoint, then ask Codex to resume using `$implement-phase`.

## Docs
- `docs/VISION.md` — identity, user flow, MVP boundaries.
- `docs/ARCHITECTURE.md` — audio capture, lifecycle, scene separation and stack.
- `docs/ART_DIRECTION.md` — Bloom visual brief.
- `docs/MOTION.md` — signal mapping and movement constraints.
- `docs/ROADMAP.md` — ordered tasks and acceptance gates.
- `docs/PROGRESS.md` — actual current state; read this first to resume.
- `docs/DECISIONS.md` — rationale and open decisions.
- `docs/VERIFICATION.md` — automated and manual checks.
- `docs/WORKFLOW.md` — prompts, tools and token-efficiency conventions.

## Run locally

Use Node.js 24 LTS and npm (verified with Node 24.11.0 and npm 11.6.1).

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173). The page shows source, connection, and analysis placeholders; it does not request media permissions.

```sh
npm run typecheck
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
```

`build` checks TypeScript and creates `dist/`; `preview` serves that build locally. Dependencies are locked in `package-lock.json`; use `npm ls --depth=0` to inspect installed versions. P01 browser smoke passed in Playwright Chrome; owner approved P01 on 2026-11-16. Local Playwright artifacts are excluded from Git.

Reference art is conceptual, not licensed production assets.
