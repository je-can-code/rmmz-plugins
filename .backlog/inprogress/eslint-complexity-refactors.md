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

## Definition of done

- [x] each named hotspot is table-driven: `RPG_Trait#textName` / `textValue`, the `JAFTING_Trait`
      name and value getters, `Game_Time#translateHourToTone`, `Game_Event.toTimeConditional`,
      `PIXEL_CollisionManager._mergeSingleTile` and `isPositionPassable`, and
      `JABS_Engine.actionTravelDirectionToSpritePatternDirection`
- [x] `grep -rn 'disable-next-line complexity' src/plugins/` no longer names any of those files
- [x] `bun run hotfix` green and coverage still 100%
- [x] `bun run mutate <file>` on each touched file reports no new survivors. A lookup table has
      fewer branches than the chain it replaced, so coverage can stay at 100% while the tests stop
      constraining anything — mutation is the only check that notices
- [ ] in-game: watch the clock roll through a full day. Tones change at the same hours as before,
      which is the one hotspot here whose output a player can actually see

## Notes

- Goal is readability/maintainability, not “hit a magic number”.
- Two of the named hotspots were already resolved before this pass and needed no work:
  `JAFTING_Trait`'s name and value getters delegate to `RPG_Trait`, and
  `Game_Time#translateHourToTone` delegates to `TimeToneResolver`, which is itself table-driven.
  Neither carried a complexity disable.
- `JABS_Engine.checkKnockback` was not a named hotspot but carried a disable in a named file, so it
  was included to make the grep check honest. Its reusable half became `toDisplacement`.
- Decomposition targeted extension points rather than line count: every table is a static a plugin
  can register into from its own tree, and every `default` arm became a named, aliasable method.

