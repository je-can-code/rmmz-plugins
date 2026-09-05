# `$actionMap` bootstrap refactor

## Source

- `src/plugins/abs/core/managers/DataManager.js` (`loadSkillMasterMap`, `onMapGet`, `globalThis.$actionMap`)
- `src/plugins/abs/core/_metadata/initialization.js` (if any references remain)

## Context

`$actionMap` holds the parsed JSON for the JABS **skill master map** — a template map whose events are cloned for live map actions. It is loaded asynchronously via XHR during `DataManager.createGameObjects` and stored on `globalThis.$actionMap`.

This is **database-ish template data**, not a per-frame game object like `$gameParty`. The current pattern mirrors `$dataMap` naming but uses a separate global bootstrap slot that does not fit the "one instanced `$` global per live game object" model cleanly.

## Work

- Decide ownership: static cache on `DataManager`, lazy loader module, or a small `JABS_ActionTemplateLibrary` hoisted global (similar to hoisted class pattern — one name, no `globalThis` write).
- Ensure load ordering remains safe before first `forceMapAction` / action clone.
- Remove `globalThis.$actionMap` bootstrap; update call sites to the chosen accessor.
- Shrink `LEGACY_GLOBAL_THIS_PROPERTIES` in `verify-ships.js` when done.

## Definition of done

- [ ] `grep -rn '\$actionMap' src/plugins/ --include=*.js` returns nothing outside `_annotations.js`
      changelog text
- [ ] `$actionMap` is gone from `LEGACY_GLOBAL_THIS_PROPERTIES` in `src/build-tools/verify-ships.js`
- [ ] `bun run hotfix` green
- [ ] in-game: new game, then immediately use a skill that spawns a projectile. The action event
      appears, which is the whole load-ordering risk in this item — the master map has to be parsed
      before the first clone is requested, and the old bootstrap guaranteed that by being awaited in
      `createGameObjects`
- [ ] in-game: load a save directly into a map and fire the same skill before doing anything else —
      the load path has to reach the new accessor too, not only new-game

## Notes

- Not urgent — current behavior is fine for shipping.
- Pairs with broader `$` singleton / verify cleanup; see guidelines **J namespace bootstrap**.