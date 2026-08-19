# Deferred Suggestions

## 2026-08-18 — Separate exact armor snapshots from runtime schema validation

- Plan: `.dreamers/plans/feature-armor-tier-progression/plan-01-armor-tier-progression.md`
- Branch: `feat/armor-tier-progression`
- Reviewer: Hone
- Review artifact: `.dreamers/reviews/hone-armor-tier-progression-20260817-214118.md`
- Severity / lens / location: Medium / simplicity / `node/game/equipment_schema.js:23`
- Finding: Runtime schema validation duplicates exact tier signatures and reduced-set payloads already authored in `design/items.js`, creating a second balance-data authority.
- Suggested fix: Move `ARMOR_SET_SIGNATURES` and `REDUCED_ARMOR_SET_COMPLETION_PAYLOADS` into one offline armor contract used by fixture generation and verification; remove those exports and exact-value checks from runtime schema validation while retaining structural, tier/count, retirement, and cumulative-publication checks.
- Major-refactor criterion: A new module and data-ownership boundary plus a cross-file refactor spanning runtime schema, offline tools, and focused tests.
- Deferral rationale: The user selected **Defer** at the Dreamers major-refactor gate. The current implementation is behaviorally correct and fully validated; applying this architecture-only change now would broaden the focused armor-balancing scope.
