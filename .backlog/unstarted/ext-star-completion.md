# `ext/star` completion

## Schedule

Explicitly **deferred** — pick up when Star ABS is actively in scope again.

## Source

- Star extension plugin sources under `src/plugins/abs/ext/star/`
- `src/plugins/abs/ext/star/objects/Game_Map.js` — `postTransferEnemyParsing`, `generateStarEnemy` (lines ~111–162 region)
- DataManager load path when enemy map is missing

## Severity

**High** for anyone shipping Star extension (known broken / TODO paths). **Low** if extension unused.

## Gain

**High** when the mode is desired; unblock Star as a supported ABS ext.

## Context

Dynamic enemy generation via a separate enemy map is only partly implemented. The current `generateStarEnemy` implementation contains explicit TODOs and questionable indexing:

- `$gameTroop.members().forEach(this.generateStarEnemy)` passes `(gameEnemy, index)` but `$gameMap._events[index]` uses troop index, not the normalized map event index used elsewhere (`normalizedIndex = index + 1`).
- `$dataMap.events[normalizedIndex] = enemyData` mutates the **current** map’s event table from battle setup — verify this is still valid after prior “delete update” engine changes (comment in source: “almost certainly broken logic”).
- `BattleManager.enemyMap.events[gameEnemy.enemyId()]` uses **enemy id** as an event-table key; confirm this matches how the enemy battle map is authored (often event id ≠ database enemy id).

## Work

- Fix `Game_Map.generateStarEnemy` event registration and map/event indexing so spawned enemies attach through the same code paths as core JABS map enemies (prefer official `Game_Map` APIs over raw `_events` assignment where possible).
- Throw or otherwise fail clearly in DataManager when the required enemy map is absent.
- Finish any remaining star-flow gaps as a dedicated PR.

## Definition of done

- [ ] `generateStarEnemy` registers spawned enemies through `Game_Map`'s own APIs rather than
      assigning into `$dataMap.events` directly
- [ ] the DataManager load path fails loudly and by name when the enemy map is absent, instead of
      producing an empty battle later
- [ ] in-game: trigger a star battle from a map event. Every member of the troop appears, every one
      is attackable, and both outcomes — winning and dying — return control to the map correctly
- [ ] in-game: trigger a battle with a troop holding the same enemy twice. Two enemies appear. The
      enemy battle map is keyed by database enemy id, so a duplicate is the case where two troop
      members claim one key and the second quietly overwrites the first
- [ ] `bun run hotfix` green

## Notes

- Overlaps `cross-plugin-prototype-hook-surface.md` (`Scene_Map` / `Game_Map` star hooks vs core ABS).
