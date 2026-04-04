---
status: open
area: architecture
---

# ABS: `Game_Unit#inBattle` always true — document or narrow semantics

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
