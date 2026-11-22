# ECHO documentation

Start with [current progress](PROGRESS.md) and [the project roadmap](ROADMAP.md). They identify the actual checkpoint and next authorized work. Milestone reports and historical logs preserve earlier states; they do not override the current checkpoint.

## Guides and authoritative roadmaps

- Product: [vision](VISION.md), [art direction](ART_DIRECTION.md), [motion](MOTION.md).
- Engineering: [architecture](ARCHITECTURE.md), [decisions](DECISIONS.md), [verification](VERIFICATION.md), [evaluation](EVALUATION.md).
- Process: [workflow](WORKFLOW.md), [release checklist](RELEASE_CHECKLIST.md).
- Application audio: [Music Intelligence roadmap](ECHO_Music_Intelligence_Roadmap.md), [animation refinement](ANIMATION_REFINEMENT.md).
- Crimson: [visual mapping roadmap](CRIMSON_VISUAL_MAPPING_ROADMAP.md), [visual polish roadmap](CRIMSON_VISUAL_POLISH_ROADMAP.md).

- Noctune 2.0: [master roadmap](NOCTUNE_MASTER_ROADMAP.md), [visual mapping](NOCTUNE_VISUAL_MAPPING.md), [migration tracker](MUSIC_INTELLIGENCE_MIGRATION.md).

## Reports, evidence and history

| Folder | Contents |
| --- | --- |
| [Crimson reports](reports/crimson/README.md) | Mapping, polish and requested refinements |
| [Music Intelligence reports](reports/music-intelligence/README.md) | Audio interpretation plans and diagnostic results |
| [Nocturne reports](reports/nocturne/README.md) | Nocturne verification |
| [Release reports](reports/release/README.md) | Integration and owner-review gates |
| [Evidence](evidence/README.md) | Original artifacts grouped by topic and milestone |
| [Progress history](history/PROGRESS_THROUGH_2026-11-22.md) | Earlier chronological checkpoints with original statuses |

Keep core guides and authoritative roadmaps here so existing session instructions remain valid. Put milestone reports in their topic folder and artifacts in the matching evidence topic/milestone. Link evidence rather than copying it. Keep PROGRESS.md focused on current status and move older entries to history without rewriting their outcomes. Record a short archive link when doing so.

After moving documentation, run `node scripts/check-doc-links.mjs` from the repository root. This checks local Markdown targets; external URLs and heading fragments need separate review. Archived source artifacts under evidence/ are preserved as evidence and excluded from lint; active source and scripts remain checked. Preserve historical JSON payloads and filenames inside recordings/manifests: paths recorded at capture time are provenance, not current navigation links.
