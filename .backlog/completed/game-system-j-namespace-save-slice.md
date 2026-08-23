# `$gameSystem._j` save slice + JABS transient lifecycle

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js` (runtime flags: `absEnabled`, `absPause`, `request*`, `_player1`, …)
- `src/plugins/abs/core/managers/DataManager.js` (`$jabsEngine = new JABS_Engine()` in `createGameObjects`)
- `src/plugins/abs/core/objects/Game_Map.js` (`$jabsEngine.initialize()`, `update()`)
- `src/plugins/abs/core/scenes/Scene_Map.js` (map enter / menu / transfer hooks)
- Vanilla pattern: `$gameSystem` persists across maps; engine instance does not carry durable state today

## Context

Discussion concluded: **`JABS_Engine` can become static** (see `jabs-5-static-engine-external-data.md`), but **only a narrow slice** of JABS state belongs in save data — chiefly player-facing toggles like `absEnabled`, not per-frame render request latches.

Vanilla already uses `$gameSystem` for cross-map persistence. A **`_j` namespace** on `Game_System` gives JMZ plugins a disciplined home for save-safe slices without inventing nine new `$` globals:

```javascript
// illustrative shape — design in Phase 0
$gameSystem._j ??= {};
$gameSystem._j._abs ??= { absEnabled: true, /* … */ };
```

**Transient engine state** (static or instance) must **reset on map transfer** — `requestActionRendering`, `requestClearLoot`, hitbox overlay requests, etc. must not leak map-to-map. Requires explicit lifecycle hooks: `JABS_Engine.onMapSetup()`, `resetTransientState()`, or equivalent called from `Game_Map.setup` / transfer paths.

## Work

### Phase 0 — inventory
- Classify every `JABS_Engine` field: **persisted** vs **map-session transient** vs **frame transient**.
- Define `JabsSystemSaveData` (or `$gameSystem._j._abs`) schema; register with `SerializableRegistry` if class-based.
- Document `_j` convention for other plugins (TIME, LOG, …) without implementing them all at once.

### Phase 1 — save slice (can ship before static engine)
- Move `absEnabled` (and peers) reads/writes to `$gameSystem._j._abs`.
- Engine/director delegates to save slice; default on new game.
- Save/load migration for existing saves (missing `_j` → sane defaults).

### Phase 2 — transient lifecycle
- Implement map enter / transfer reset for all non-persisted engine fields.
- Add harness tests: transfer does not leave stale `request*` flags.

### Phase 3 — static engine alignment
- When `JABS_Engine` goes static (`jabs-5-static-engine-external-data.md`), persisted flags stay on `$gameSystem._j._abs`; static fields hold only transient runtime.

## Notes

- Distinct from **`jabs-5-static-engine-external-data.md`** (umbrella breaking release) — this item is the **persistence + lifecycle contract** that static migration depends on.
- `_player1` / battler wrappers remain **runtime only**, re-inited on map enter like today.
- Pairs with `time-save-data-vs-runtime-manager.md` (same data-vs-manager split for J-TIME).