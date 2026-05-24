---
status: open
area: code-quality
---

# Complexity refactors (small, safe)

## Context

Oxlint / legacy ESLint `complexity` warnings are currently allowed, but several hotspots were marked with disable comments plus TODOs.

This item tracks converting those hotspots into simpler, table-driven code **without changing behavior**. Lint gates `hotfix` via Oxlint (see [`build-tools-linting.md`](../completed/build-tools-linting.md)).

## Work

- Convert large switch/if chains into lookup tables where appropriate:
  - `RPG_Trait#textName` / `RPG_Trait#textValue`
  - `JAFTING_Trait` name/value getters
  - `Game_Time#translateHourToTone`
  - `Game_Event.toTimeConditional`
  - `PIXEL_CollisionManager._mergeSingleTile` (bitmask) and `isPositionPassable` (code→predicate)
  - `JABS_Engine.actionTravelDirectionToSpritePatternDirection` (direction lookup matrix)
- Keep refactors isolated and reviewable (one area per PR).

## Notes

- Goal is readability/maintainability, not “hit a magic number”.

