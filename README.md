# ECHO

**Your music. Another world.**

A browser-first audio visualizer that transforms permitted audio into living, atmospheric landscapes. This repository starts with a documentation-only proof-of-concept handoff. No application, dependencies, audio assets or runtime tests exist yet.

## Start here (human)
1. Extract these files into the root of a new ECHO repository (keep `.agents/`). Do not overwrite existing files without reviewing changes.
2. Open that folder in VS Code; initialize Git if you want version-controlled checkpoints. Open a new Codex session so repository skills can be discovered.
3. Context7 has been reported working by the owner. Playwright MCP is installed but browser launch is still unverified; see `docs/WORKFLOW.md` for a smoke test. No global config or secrets are supplied.
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

No production setup command exists until P01 is implemented. Runtime instructions should be added after scaffolding. Reference art is conceptual, not licensed production assets.
