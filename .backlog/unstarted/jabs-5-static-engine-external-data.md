# JABS 5.0 — static engine, persisted JABS slice, external data

## Source

- `src/plugins/abs/core/managers/JABS_Engine.js` (~4.9k lines — instance fields for runtime flags + orchestration)
- `src/plugins/abs/core/managers/JABS_AiManager.js` (already **static** battler registry / spatial index)
- `src/plugins/abs/core/managers/DataManager.js` (`globalThis.$jabsEngine = new JABS_Engine()`)
- Hundreds of `$jabsEngine` call sites across ABS, extensions, HUD, SDP, Pixel, Regions, Popups, …
- Partial external config today: `data/config.jabs.json`, `J.ABS.Helpers.loadExternalConfig`, team rules

## Context

`JABS_Engine` is currently an **instanced** `$` global created in `createGameObjects`. Most of its fields are **map-session runtime** — `absPause`, `request*` booleans, hitbox overlay state, `_player1` wrapper, action/loot render requests — not save-game state.

`absEnabled` and similar **are** persisted in spirit (player expectation across maps) but live on the ephemeral engine today.

**Jeremy’s direction:** JABS 5.0 as a breaking umbrella:

1. **`JABS_Engine` → static director** (like `JABS_AiManager`) — `JABS_Engine.update()`, `JABS_Engine.getPlayer1()`, no `$jabsEngine` instance.
2. **Persisted JABS state** on a durable game object slice, e.g. `$gameSystem._j._abs` (or dedicated save DTO): `absEnabled`, forced combat defaults, any cross-map flags worth keeping — **not** request flags or per-frame render latches.
3. **External JABS data** — global rules in `data/config.jabs.json` (teams — **done**); per-entity database tags → **`jabs-database-tags-editor-first.md`** (editor-only authoring across eight DB types).

## Assessment (do we disagree?)

**Mostly aligned — with caveats.**

| Point | View |
|-------|------|
| Engine can be static | **Yes.** Runtime orchestration + static AiManager is coherent; instance was historical `$game*` mimicry, not a multi-engine requirement. |
| Persist only select flags | **Yes.** Map transfer should reset `requestActionRendering`-style latches; `absEnabled` belongs on `$gameSystem` / JABS save slice. |
| Big refactor | **Yes.** Every `$jabsEngine` reference, test VM, and extension alias must move; plan as major version. |
| Same release as external data | **Good bundling.** One migration guide, one CA plugin list bump, one “JABS 5.0” comms pass. |

**Caveats to design up front:**

- **Lifecycle hooks** — `Game_Map.setup` / transfer / new game must call explicit `JABS_Engine.onMapSetup()` / `resetTransientState()` so static fields do not leak between maps.
- **Player 1** — `_player1` stays runtime; re-init on map enter like today, not in save blob.
- **Test harness** — `evaluateShippedPlugin` and ABS VMs assume `$jabsEngine`; update fixtures in same PR train.
- **Extension contract** — document static entry points; avoid reintroducing `$jabsEngine` shims long-term.

## Work (phased)

### Phase 0 — design doc / migration guide
- Inventory every persisted vs transient engine field.
- Define `$gameSystem._j._abs` schema (or `JabsSaveData` class + registry).
- List external JSON surfaces still inline in metadata.

### Phase 1 — save slice + external data (can ship before static flip)
- Move `absEnabled` (and peers) to save slice; engine reads/writes through it.
- Expand `config.jabs.json` ownership; deprecate duplicate plugin parameters.

### Phase 2 — static engine
- Convert `JABS_Engine` to static class; migrate call sites (`JABS_Engine.update()` etc.).
- Remove `$jabsEngine` / `globalThis` bootstrap; verify allowlist shrink.
- Map lifecycle reset for transient static fields.

### Phase 3 — 5.0 release
- Version bump, CA hotfix, changelog, breaking-change notes for third-party J-ABS extensions (if any).

## Notes

- **Not** multi-engine — still one map-wide director; static ≠ multiple instances.
- Pairs with: `abs-input-controller-registry.md`, `abs-action-map-bootstrap-refactor.md`, `game-enemies-factory-rename.md`, `game-system-j-namespace-save-slice.md`, `jabs-database-tags-editor-first.md`, `jabs-engine-loot-action-director.md`, `cached-actions-map.md`.
- Defer until SDP mastery / current ABS feature train allows a deliberate breaking window — label explicitly **JABS 5.0** in PR titles when execution starts.