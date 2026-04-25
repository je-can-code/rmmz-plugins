---
status: open
area: code-quality
---

# ESLint complexity refactors (small, safe)

## Context

ESLint `complexity` warnings are currently allowed, but several hotspots were marked with `eslint-disable-next-line complexity` plus TODOs.

This item tracks converting those hotspots into simpler, table-driven code **without changing behavior**.

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

