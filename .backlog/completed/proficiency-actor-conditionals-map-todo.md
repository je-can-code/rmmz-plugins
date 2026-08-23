# Proficiency: replace hardcoded actor conditional map seed

## Severity

**Medium** for correctness in games with more than six actors or non-contiguous actor IDs. **Low** for small default parties.

## Gain

**Low effort, high clarity.** Removes a known TODO and avoids silent empty lookups for actor 7+.

## Source (historical)

- `src/plugins/prof/_metadata/_pluginMetadata.js` — inside `initializeProficiencies`, after `classifyConditionals`, previously:

```javascript
// TODO: fix this!
[ 1, 2, 3, 4, 5, 6 ].forEach(actorId =>
{
  this.actorConditionalsMap.set(actorId, Array.empty);
});
```

## Context

The map was pre-seeded for actors 1–6 only. Real projects can have larger rosters or DLC actors. `Game_Actor#proficiencyConditionals` reads `actorConditionalsMap.get(this.actorId())` with no fallback; missing keys caused `undefined` and `.filter` crashes downstream.

## Work (original checklist)

1. Define intended semantics: “all actors that exist in database” vs “only actors referenced in proficiency JSON.”
2. Replace the hardcoded loop; add a test in `test/plugins/` if a Proficiency VM harness exists or is added later.
3. If this uncovers missing config entries, document migration for existing `config.proficiency.json` files.

## Notes

- Fits well after or alongside `j-base-external-json-config-loader.md` for shared load helpers.

## Resolution

**Semantics:** Seed **every non-null `$dataActors` row** (by `actor.id`) so all database actors have a map entry before conditionals are pushed.

**Implementation:**

- `src/plugins/prof/scenes/Scene_Boot.js` — `Scene_Boot#onDatabaseLoaded` chains the vanilla handler, then calls `J.PROF.Metadata.initializeProficiencies()`. That moment has **`DataManager.isDatabaseLoaded()`** true and **`$dataActors`** populated; **`$gameActors` is still `null`** until `DataManager.createGameObjects()` (e.g. from `Scene_Boot#start` → `setupNewGame`), so initialization correctly depends on **`$dataActors`**, not `$gameActors`.
- `src/plugins/prof/_metadata/_pluginMetadata.js` — `initializeProficiencies()` builds `actorConditionalsMap` with `$dataActors.filter(actor => !!actor).forEach(actor => this.actorConditionalsMap.set(actor.id, Array.empty))`, then the existing nested `forEach` over `this.conditionals` / `actorIds` to `push` each conditional into the right bucket.

**Interaction:** `Game_System#updateProficienciesFromPluginMetadata` (on save load) still replaces map entries from `J.PROF.Metadata.conditionals` filtered per `$gameActors.actorIds()`; behavior was checked and counts aligned with the new boot-time map.

**Follow-ups (optional, not blocking this item):**

- Add or extend `test/plugins/` coverage if a Proficiency harness is added later.
- Optional defensive `?? Array.empty` on `Game_Actor#proficiencyConditionals` if any code path can query an id outside the seeded set.

No `config.proficiency.json` migration was required for this change.
