# Crimson constant walking speed

Status: APPROVED — owner “lets do it” (2026-11-22).

Owner requests “keep walking speed at constant speed at all times.” Crimson now travels24 units/second at normal motion settings, including silence, pause, disconnected/stale input and zero Reactivity. Both public Candidate and DEV Legacy use the same fixed walking rate. This supersedes the earlier energy-driven journey only; musical sun/body/corona, waves, ridges, detail and atmosphere still consume the same signals and gain.

The journey integrates speed×bounded delta directly. Removed energy/gain-based speed targets and acceleration/deceleration. Existing50ms delta cap, logical rebase, worker window and no-unloaded-terrain boundary remain. Reduced motion freezes travel immediately; loaded-terrain holds may temporarily stop it. Resume uses the fixed speed without rewinding. Background tab scheduling/long-frame clamping can pause effective progress; no time catch-up or claim of perfect wall-clock motion under stalls.

No shared MI/frequency/adapter changes, no new graphical systems/dependencies or terrain/camera-route redesign. The pilot keeps its existing speed-target field for compatibility, now constant; actual journey speed can be0 under reduced/loading guards. In-app help and README now describe walking through silence, with Reactivity applying only to reactive visuals. Old evidence of stopping on silence/zero gain is historical, not a requirement of the new mode.

## Verification

Passed32 test files, lint/typecheck/build and generated browser checks. Unit checks now require identical progress at quiet/loud/silent/paused/stale/zero-gain states, exact240 units in10s at30/60/120Hz, reduced freeze, loading hold and exact24-unit resume. Sun/pulse/audio lifecycle tests retained. Removed obsolete energy-to-travel helper; current range/response browser checks follow constant speed while retaining reduced freeze. Historical older MI pilot scripts may encode obsolete travel or sun assumptions and are not this mode's acceptance commands.

- [Generated motion checks](../../evidence/crimson/constant-travel/crimson-constant-travel-verification.json): six input/profile cases each advance≈18 units in≈.75s, reported speed24; reduced freeze/resume retains position. At most seven geometries.
- [Walking in silence](../../evidence/crimson/constant-travel/crimson-constant-travel-silence.png)
- [Production source/lifecycle checks](../../evidence/crimson/constant-travel/crimson-constant-travel-public.json): actual camera-position GPU uploads advance≈12 units over.5s before any audio is acquired. Existing generated file/mocked tab, scene switching, pause/seek/resume, reduced/quality and source cleanup pass; no console errors.

Final motion run /tmp/echo-crimson-constant-qLZLTC and production /tmp/echo-candidate-eNf7tf. Initial production checks reached success but report write failed with storage quota(122); only disposable verification browser profiles were removed, retaining evidence/project files, and ordinary rerun saved the report successfully. No approval-review rejection or bypass. The final in-app wording correction was rebuilt after this functional run; it changes text only. Existing Vite size warning remains (~1,227.03kB JS/341.28kB gzip).

Native picker/audibility and device smoothness remain manual pending; full unchanged MI numeric matrix not rerun. Existing Brave/CDP fallback used; phase skills/Playwright unavailable. This is an explicit owner follow-up within current VP04 review, not VP04 approval or VP05 progression. No commit/push/deploy authorized.
