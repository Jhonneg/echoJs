# Agent workflow & token efficiency

## Tools
Codex VS Code extension, Git, Context7 (reported working), Playwright MCP (browser execution pending). Do not install duplicate tools or overwrite global config. Optional smoke prompts:
- Context7: retrieve version-relevant R3F useFrame docs; identify tool used; no changes.
- Playwright: open https://example.com, report title/console, capture ECHO-independent smoke screenshot only if allowed; no repo edits. If browser executable missing, locate existing Chromium/Chrome via shell and configure appropriate executable path per official Playwright MCP documentation, or ask owner to install compatible browser. No sudo/secret requests to agent. Report failure honestly.

Official starting points: https://learn.chatgpt.com/docs/build-skills ; https://github.com/microsoft/playwright-mcp ; https://github.com/upstash/context7 .

## Reusable prompts
- `$implement-phase` — Resume from current checkpoint; plan next task, wait for approval.
- `$code-review` — Review current diff against specs; no modifications.
- `$visual-review` — Inspect current render against approved direction; report first, no edits.
- `$session-handoff` — Update actual progress, evidence and next action; no feature changes.
- Bug: Investigate root cause, give smallest viable fix and affected verification; wait for approval.
- Custom request: objective / relevant context / constraints / acceptance / boundaries. Do not repeat whole docs.

## Cycle
Read checkpoint → plan one task → owner approval → implement → relevant checks → report → owner review → checkpoint/authorized commit. Explicit task approval may cover that task's implementation and checks only. Stop at task boundary. No automatic push or changes to global tools. Reopen in new conversation when useful; repo docs are canonical. If ambiguity materially affects product/scope, propose options; otherwise state small reversible assumptions.

## Efficiency experiment
Prefer minimal relevant files and concise plans. Use Context7 selectively, bounded browser iterations, deterministic fixtures and approved screenshots. Don't repeatedly query same docs or reorganize unrelated code. On repeated failed attempts (suggested max two materially different tries), or if task balloons, stop and summarize root cause, evidence, options and recommended action; owner decides. Avoid arbitrary token promises; record actual usage/time only when available, plus manual prompts/rework and useful lessons. Never invent telemetry. Keep journal in PROGRESS or a small optional dated log if needed; no tracking private media.

## Source of truth
AGENTS = workflow rules; specs = requirements; ROADMAP = task definitions; PROGRESS = current actual status; DECISIONS = rationale; skills = procedures; Git = implementation history. If contradictory, surface discrepancy and ask owner rather than assuming outdated conversation or docs supersede a decision. User-approved scope changes require updating relevant files. Keep global installations outside repo and secrets out of source control.
