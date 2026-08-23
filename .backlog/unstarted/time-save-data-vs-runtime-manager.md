# J-TIME: separate save data from runtime manager

## Source

- `src/plugins/time/core/_models/Game_Time.js` (prototype class — clock state + HUD/tone/block flags mixed in)
- `src/plugins/time/core/_models/Time_Snapshot.js` (immutable moment-in-time DTO; already used by `currentTime()`)
- `src/plugins/time/core/database/DataManager.js` (`contents.time = $gameTime` — **entire manager** serialized)
- `src/plugins/time/core/_metadata/initialization.js` (`globalThis.$gameTime`)

## Context

Today the save file stores the **whole `Game_Time` instance** — tick counters, `_active`, `_blocked`, tone/HUD transient flags, frame accumulators, and calendar fields together. That couples persistence to runtime/UI concerns and bloats saves with data that does not need round-tripping (or should re-derive on load).

`Time_Snapshot` already exists as the **calendar + time-of-day + season** shape. The ideal split:

| Layer | Holds | Persisted? |
|-------|--------|------------|
| **Time data** (blob / snapshot + small flags) | year/month/day/hour/minute/second, season, time-of-day id, maybe `_active` | Yes — compact DTO in `contents.time` or `$gameSystem._j._time` |
| **Time manager** (static or singleton service) | tick frames, `_blocked`, HUD dirty flags, tone cache, map window visibility | No — rebuilt or reset on load / map enter |

On load: hydrate data blob → manager reads/writes through it → `updateCurrentTone()` etc. run from persisted calendar, not from resurrected manager fields.

## Work

- Define explicit **save DTO** (extend or wrap `Time_Snapshot` + minimal persisted flags); register with `SerializableRegistry` if class-based.
- Refactor `Game_Time` to own/reference DTO; stop assigning `$gameTime` wholesale in `extractSaveContents`.
- Migration: old saves that stored full `Game_Time` → convert-on-load to DTO once.
- Optional: static `Game_Time` API (`Game_Time.update()`, `Game_Time.currentSnapshot()`) with one live DTO on `$gameSystem` — aligns with “one clock per world” without serializing the manager.
- Remove `globalThis.$gameTime` bootstrap when doing `$` cleanup.

## Notes

- Pairs with `convert-saved-prototype-models-to-modern-classes.md` (prototype → class + registry).
- Do not conflate with `$gameSystem.playtime` — J-TIME is fictional calendar, not real-time session clock.