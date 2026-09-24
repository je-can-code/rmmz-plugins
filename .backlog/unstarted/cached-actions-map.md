# `cachedActions`: stop the live action store growing all map long

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js` (`cachedActions`, and `event(uuid)`, the scan it would replace)
- `src/plugins/abs/core/objects/Game_Event.js` (the `event()` and `page()` overrides that route every action event through that scan)

## Severity

**High** on enemy-dense maps. Jeremy has felt the lag after long sessions on the maps players spend the
most time on (Notes), and the memory held grows with every action fired until the next transfer. A
short fight shows nothing measurable, which is why it hid.

## Gain

**High**: removes lag players feel and a per-map memory leak, with O(1) lookups on top. Pairs with
loot/action director extraction.

## Context

`cachedActions = new Map()` exists on `JABS_Engine` but is unused (declared in `src/plugins/abs/core/managers/JABS_Engine.js` ~line 148; no other references in `src/plugins` as of audit). The intent is to key live actions by UUID for O(1) lookup instead of scanning arrays.

The scan it would replace is concrete. `JABS_Engine.event(uuid)` is a linear `.find()` over `_activeActions`, and J-ABS routes `Game_Event.event()` through it for every action event, so any `event()` read on an action scans every live action to find its own data. `page()` pays that twice, since the J-ABS override calls `event()` as a guard before vanilla's `page()` calls it again. Each live action is read about nine times per frame (see Measured), so the cost per frame grows with the number of live actions times the length of the scanned list.

## Measured

2026-09-23, the Hard Syrup boss fight (two party members, about six seconds of combat), with a probe wrapping `JABS_Engine.event`: 1,701 lookups over 163 frames with actions live, and no misses. Live actions peaked at 2 while the scanned list reached 22, and it stayed at 22 after the fight. Each live action was looked up about 9 times per frame, almost entirely through `page()`, from J-Base's comment readers (`getValidCommentCommands`, `getEventCommandList`, `hasPluginCommand`) and KMS_AreaEvent's `setupAreaEventAttribute`. That came to 123 comparisons per frame on average and 805 at most: well under a microsecond, against a 2.86 ms average map update. At this scale the scan costs nothing measurable.

What matters more is that `_activeActions` is never pruned. `addActionEvent` pushes a deep copy of each physical action's event data, and only `JABS_Engine.initialize()` resets the list, which runs on a real map transfer or when a new game or load builds a new engine. So the scan length is every physical action spawned since arriving on the map, dead or alive, and all of those copies stay in memory until the next transfer. On a map where enemies keep respawning, a long session grows both without bound. Pruning the list where `clearActionEvents` already filters the live actions bounds both; a uuid-keyed Map bounds them too, and adds O(1) lookup on top.

## Work

Make `cachedActions` the store for live action event data, keyed by uuid: `addActionEvent` sets, `event(uuid)` gets, and the entry is deleted when the action leaves the map, in lockstep with its `Game_Event`. Deleting earlier leaves J-ABS's `page()` guard answering nothing for an event that is still being updated; deleting later, or never, keeps the leak. `_activeActions` goes away once nothing reads it. Measure with the probe before and after (Notes).

## Definition of done

- [ ] `grep -rn 'cachedActions' src/plugins/` returns reads as well as the one declaration it
      returns today — the field is currently written nowhere and read nowhere
- [ ] no array scan remains for resolving a live action by uuid
- [ ] the store holds only live actions: fight on one map, let it settle, and its size equals
      `$jabsEngine.getAllActionEvents().length` rather than every action spawned since arriving. This
      is the lag and the leak together, so it is the box that matters most; every other box can pass
      with a store that is filled and never emptied
- [ ] the PR records the probe's before and after from the same laps on the maps in Notes: frame time,
      and the scanned count staying level instead of climbing
- [ ] in-game: fire a multi-hit skill, kill its target mid-flight, then transfer maps — no action
      renders after its owner is gone and none survive the transfer
- [ ] `bun run hotfix` green and coverage still 100%

## Notes

- See `jabs-engine-loot-action-director.md` — a extracted collaborator may own the Map instead of growing `JABS_Engine` fields further.
- Jeremy has seen visible lag after long sessions on the big, enemy-dense maps (337 Tons of Grass, 338 Green Greenery, 339 Way to the Forest), where respawning enemies make ten minutes on one map routine. The planned proof (2026-09-23): laps with the probe on those maps and Map 14 Crossroads for a before, then the fix, then the same laps for an after. The before has to happen before the fix reaches Chef Adventure through `hotfix`.
- The probe, to rebuild it: wrap `JABS_Engine.prototype.event` with a counted copy of the same `.find()`, wrap `Scene_Map.prototype.update` to attribute each frame's counts and update time, sample `activeActions().length` (after the fix, the Map's `size`) against `getAllActionEvents().length`, and write JSON once a second through NW.js's `require('fs')`. Load it from the F8 console with `eval(require('fs').readFileSync(PATH, 'utf8'))`. It prints nothing while it runs, so say so when handing it over.
