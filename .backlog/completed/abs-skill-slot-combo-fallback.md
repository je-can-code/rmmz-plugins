---
status: done
area: code-quality
---

# ABS: `JABS_SkillSlotManager#getSlotComboId` must not silently return combo id `1`

## Severity

**High** for gameplay correctness: wrong combo skill can execute with no user-visible error.

## Gain

**High trust** in skill HUD and charge/combo flows once invalid keys fail loudly or use an explicit documented default.

## Source

- `src/plugins/abs/core/__models/JABS_SkillSlotManager.js` — `getSlotComboId`

## Context

When `getSkillSlotByKey(key)` misses, the code warned to console and returned `1`, with a TODO to fix. That masked configuration bugs and slot sync bugs.

## Work

1. Decide contract: throw in dev / return `0` or `-1` with caller handling / assert in test project.
2. Audit callers of `getSlotComboId` for safe handling.
3. Align with enemy slot assignment work in `readiness.js` (missing slot + TODO “make sure enemies get assigned their slots”).

## Notes

- Related console noise: `abs-debug-and-placeholder-logging.md`.

## Resolution

Shipped: missing slot now returns **`0`** (same “no combo” sentinel used elsewhere: `getSkillIdForAction`, `canExecuteSkill`). Replaced vague `console.warn(key)` / `console.warn(this)` with a single **`[J-ABS]`** message including the key. Success path uses one `getSkillSlotByKey` lookup. Callers were audited (`getComboNextActionId` only); no signature change. Built output refreshed via `bun run hotfix`.

**Follow-up (still open elsewhere):** enemy slot setup and `readiness.js#getCooldown` “make sure enemies get assigned their slots” — same root cause when keys miss; not duplicated as a new backlog file.
