# ECHO — repository instructions

ECHO is a client-side universal audio visualizer with handcrafted, atmospheric hybrid 2.5D/3D scenes. The immediate objective is a proof of concept (POC), not the production app.

## Start of each task
- Read `docs/PROGRESS.md`, then the active task in `docs/ROADMAP.md`. Check `git status --short` (if a repository exists) and inspect relevant code. Preserve existing user changes.
- Load only relevant sections: product/scope → `docs/VISION.md`; audio/rendering contracts → `docs/ARCHITECTURE.md`; appearance → `docs/ART_DIRECTION.md` and `references/bloom/README.md`; motion → `docs/MOTION.md`; checks → `docs/VERIFICATION.md`; rationale → `docs/DECISIONS.md`. Read `docs/WORKFLOW.md` if unsure about workflow.
- Use the project skill `implement-phase` for a roadmap task, `visual-review` for art review, `code-review` for read-only technical review, `session-handoff` for a checkpoint. Skills describe procedures; the docs define requirements.

## Work boundaries
- One approved task at a time. Present a short plan and wait for explicit approval unless that exact task/plan is already approved. Never approve the next milestone yourself.
- Change only what the task requires. No unrelated refactoring, new services, premature abstractions, speculative features or expanded scope. Ask before significant architecture changes, new nonessential dependencies, spending money, or destructive operations.
- Protect local privacy: never record, upload, transmit, persist or inspect captured media content. Do not implement streaming-provider integrations or workarounds to capture restrictions. Test with permitted audio only.
- Use simple, typed, maintainable code. Keep frame-rate data outside React state; scene code must not depend on browser capture details. Prefer hybrid composition over large models.
- Context7: consult version-matched docs for unfamiliar or version-sensitive APIs, new dependencies, migrations and advanced rendering. Avoid redundant lookups; if unavailable, use official docs and report fallback. Verify installed versions before relying on examples.
- Playwright: use for applicable visual/functional browser checks when operational. Never claim browser picker permissions, captured sound, aesthetics or hardware performance were verified by mocks. Do not bypass OS/browser permission prompts.

## Finish
- Run relevant checks in `docs/VERIFICATION.md`; distinguish passed, failed and not run/manual pending. Report evidence and limitations. Never mark a gate complete with required evidence missing.
- Update `docs/PROGRESS.md` with actual status, files, checks, blockers and next action; record meaningful decisions in `docs/DECISIONS.md`. Do not duplicate specs or rewrite history. State any deviation from approved scope.
- Stop after the approved task. Propose a focused commit; commit only if authorized, never push without explicit permission. Report the next task and wait.
