# ABS: `Game_Unit#inBattle` always true — document or narrow semantics

## Resolution (2026-07-14)

Investigated the full blast radius of `inBattle()` always returning `true` while JABS is enabled.
Vanilla RMMZ gates ~9 `Game_Interpreter` event commands and a handful of `Game_Battler`/`Game_Party`
methods on `$gameParty.inBattle()`. `src/plugins/abs/core/objects/Game_Interpreter.js` already
deliberately overrides 7 of the 9 commands to bypass the gate (`character`, `command201` Transfer
Player, `204` Scroll Map, `301` Battle Processing, `302` Shop, `303` Name Input, `352` Save Screen),
each with an explicit comment explaining why. Two were missed — **`command236`** (Change Weather)
and **`command351`** (Open Menu Screen event command) — both silently no-op under JABS since their
entire body was gated by `if (!$gameParty.inBattle())`. Neither is used anywhere in the current CA
map data (`grep -rl '"code":236|"code":351' data/*.json` → no hits), so there was no live-game
impact, but both were landmines for future map/event design. Fixed by mirroring the existing pattern
exactly — see `src/plugins/abs/core/objects/Game_Interpreter.js`.

Two deeper semantic issues were found but **not code-fixed**, since they're currently harmless and
any fix requires a design call, not just mirroring an established pattern:
- `Game_BattlerBase.prototype.isOccasionOk` — under JABS, "menu-only" items (`occasion: 2`) become
  permanently unusable and "battle-only" items (`occasion: 1`) become usable from any menu, since
  the vanilla branch keys off `inBattle()`. CA currently has **zero** items/skills using
  `occasion: 2` (verified against `Items.json`/`Skills.json`), so no live impact — but a trap for
  future item design.
- `Game_Party.prototype.members()` always resolves to `battleMembers()` instead of `allMembers()`
  while JABS is active (`inBattle() ? battleMembers() : allMembers()`), so any reserve-bench roster
  beyond the active battle party would never surface through `$gameParty.members()`. Only matters if
  CA ever adds a reserve-bench design; unconfirmed as a goal, flagged for JE to weigh in on if/when
  that's on the table.

Also fixed in passing: `bun run hotfix` was failing on a pre-existing unlisted `instanceof RPG_Base`
in `src/plugins/_base/core/JCache.js` (same cache-keying pattern already allowlisted for
`RPGManager.js`) — added to the allowlist in `src/build-tools/verify-no-instanceof.js`. Full
`hotfix` now passes clean (341 test files / 3883 tests green).

## Severity

**Medium–high** for interoperability: any plugin or core path that uses `inBattle()` to mean “troop battle scene” will behave incorrectly on the map while JABS is enabled.

## Gain

**Medium–high** for ecosystem compatibility: either engagement/timer-based `inBattle` (see TODO in source) or explicit documentation + optional compatibility parameter.

## Source

- `src/plugins/abs/core/objects/Game_Unit.js` — `Game_Unit.prototype.inBattle` override

## Context

JABS intentionally treats the map as combat-active. The file’s TODO asks for timer/last-hit/engaged-enemy gating. Third-party plugins often assume MZ defaults.

## Work

1. Choose: (A) implement narrowed `inBattle` per TODO, (B) keep always-true but add `J.ABS` helper like `isMapAbsActive()` and document `inBattle` override in plugin help, or (C) hybrid with plugin parameter.
2. Grep monorepo + document known breakages if behavior changes.
3. Add note to `cross-plugin-prototype-hook-surface.md` inventory for `Game_Unit`.

## Notes

- Coordinate with save data and menu plugins that branch on `inBattle`.
