# Map and tame cross-plugin prototype hook surfaces (JABS_Engine, Game_Action, Scene_Map, JABS_AiManager)

## Schedule

Explicitly **deferred** — documentation / inventory pass postponed until bandwidth allows.

## Severity

**High** for long-term maintainability. **Low** immediate crash risk unless load order or alias chains break. The main risk is subtle ordering bugs when two extensions override the same method without chaining correctly.

## Gain

**High.** A documented inventory plus optional “extension points” (or even a lightweight convention doc in `.junie/`) reduces time spent tracing alias stacks. Medium effort: mostly documentation + a few risky hotspots refactored over time. Unlocks safer refactors for `jabs-engine-loot-action-director.md`, `cached-actions-map.md`, and any future `Game_Action` UUID work.

## Source (representative; grep for full lists)

### `JABS_Engine.prototype` patches

- `src/plugins/abs/ext/allyai/managers/JABS_Engine.js` (large surface)
- `src/plugins/abs/ext/formula/managers/JABS_Engine.js`
- `src/plugins/abs/ext/input/managers/JABS_Engine.js`
- `src/plugins/abs/ext/tools/managers/JABS_Engine.js`
- `src/plugins/abs/ext/hitstop/managers/JABS_Engine.js`
- `src/plugins/abs/ext/shield/managers/JABS_Engine.js`
- `src/plugins/abs/ext/diag/managers/JABS_Engine.js`
- `src/plugins/sdp/managers/JABS_Engine.js`
- `src/plugins/apt/ext/typed/managers/JABS_Engine.js`
- `src/plugins/regions/ext/skills/managers/JABS_Engine.js`
- `src/plugins/map/managers/JABS_Engine.js`
- `src/plugins/omni/ext/monster/managers/JABS_Engine.js`
- `src/plugins/__ca-mods/managers/JABS_Engine.js`
- Popups: `src/plugins/popups/ext/abs/managers/J_POPABS_Engine.js` (separate class but same conceptual hook point)

### `Game_Action.prototype` patches

- `src/plugins/abs/core/objects/Game_Action.js` (core JABS)
- `src/plugins/abs/ext/formula/objects/Game_Action.js`
- `src/plugins/abs/ext/shield/objects/Game_Action.js`
- `src/plugins/sdp/objects/Game_Action.js`
- `src/plugins/crit/objects/Game_Action.js`
- `src/plugins/prof/objects/Game_Action.js`
- `src/plugins/elem/objects/Game_Action.js`
- `src/plugins/extend/objects/Game_Action.js`
- `src/plugins/level/objects/Game_Action.js`

### `Scene_Map.prototype` patches

- `src/plugins/abs/core/scenes/Scene_Map.js` (dominant)
- `src/plugins/abs/ext/allyai/scenes/Scene_Map.js`
- `src/plugins/abs/ext/star/scenes/Scene_Map.js`
- HUD family: `src/plugins/hud/core/scenes/Scene_Map.js`, `hud/ext/*/scenes/Scene_Map.js`
- `src/plugins/map/scenes/Scene_Map.js`, `src/plugins/time/scenes/Scene_Map.js`, `src/plugins/log/scenes/Scene_Map.js`, `src/plugins/sdp/scenes/Scene_Map.js`, `src/plugins/omni/core/scenes/Scene_Map.js`, `src/plugins/utils/scenes/Scene_Map.js`

### `JABS_AiManager` stack

- Core: `src/plugins/abs/core/managers/JABS_AiManager.js`
- Ally AI: `src/plugins/abs/ext/allyai/managers/JABS_AiManager.js`
- Pixel bridge: `src/plugins/pixel/ext/abs/managers/JABS_AiManager.js`, `src/plugins/abs/ext/pixel/managers/JABS_AiManager.js`
- Level: `src/plugins/level/managers/JABS_AiManager.js`

### `Game_Unit.prototype` (ABS core)

- `src/plugins/abs/core/objects/Game_Unit.js` — `inBattle` forced true when ABS enabled; see `abs-game-unit-inbattle-semantics.md`.

## Context

The monorepo relies on alias maps and consistent super-call ordering. There is no single registry of “who touches what.” New extensions often copy an existing file’s pattern, which is good, but nobody can see the full dependency graph without ripgrep.

## Work

1. Generate a maintained markdown table (this file or `docs/`) listing engine class → plugin file → method names → alias namespace.
2. Flag methods with **multiple overwriters** (e.g. `JABS_AiManager.canMoveIdly`, `moveIdly`, `goHome` under Pixel + others) and document **expected plugin load order** from `plugins.js` / ship dependencies.
3. For the worst offenders, consider extracting collaborators (`jabs-engine-loot-action-director.md`) rather than growing `JABS_Engine` further.
4. Optional long-term: formal “subscribe” hooks on `$jabsEngine` for cross-cutting concerns instead of N separate prototype files (high effort; only after inventory exists).

## Definition of done

- [ ] one command emits the inventory: engine class, patching plugin file, method name, alias
      namespace
- [ ] the inventory is **generated from source on every run, not committed as a hand-maintained
      table**. A table someone has to remember to update is the same rot this folder's own README
      rejected for its inventory, and it decays into a document nobody trusts the first time it is
      wrong
- [ ] the report flags every method with more than one overwriter and names the load order that
      decides which wins
- [ ] run against today's tree it finds the cases the Source section already lists by hand — that is
      the only available proof the walker is complete rather than merely quiet
- [ ] `bun run hotfix` green

## Notes

- Relates to `game-action-battler-uuid-refactor.md` (identity and serialization touch `Game_Action` and battlers).
- Relates to [`build-tools-linting.md`](../completed/build-tools-linting.md) (lint gates `hotfix`; override inventory could inform future tooling).
- Plugin **load order** is `plugins.js` + `@orderAfter` / ship dependencies (post-Vite); there is no Combiner manifest.
