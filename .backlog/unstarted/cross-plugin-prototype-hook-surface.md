# Map and tame cross-plugin prototype hook surfaces (JABS_Engine, Game_Action, Scene_Map, JABS_AiManager)

## Schedule

Explicitly **deferred** — documentation / inventory pass postponed until bandwidth allows.

## Severity

**High** for long-term maintainability. **Low** immediate crash risk unless load order or alias chains break. The main risk is subtle ordering bugs when two extensions override the same method without chaining correctly.

## Gain

**High.** A documented inventory plus optional “extension points” (or even a lightweight convention section in `docs/`) reduces time spent tracing alias stacks. Medium effort: mostly documentation + a few risky hotspots refactored over time. Unlocks safer refactors for `jabs-engine-loot-action-director.md`, `cached-actions-map.md`, and any future `Game_Action` UUID work.

## Source (representative; grep for full lists)

### `JABS_Engine.prototype` patches

- `src/plugins/abs/ext/allyai/managers/JABS_Engine.js` (large surface)
- `src/plugins/abs/ext/formula/managers/JABS_Engine.js`
- `src/plugins/abs/ext/input/managers/JABS_Engine.js`
- `src/plugins/abs/ext/tools/managers/JABS_Engine.js`
- `src/plugins/abs/ext/hitstop/managers/JABS_Engine.js`
- `src/plugins/abs/ext/shield/managers/JABS_Engine.js`
- `src/plugins/abs/ext/diag/managers/JABS_Engine.js`
- `src/plugins/sdp/core/managers/JABS_Engine.js`
- `src/plugins/apt/ext/typed/managers/JABS_Engine.js`
- `src/plugins/regions/ext/skills/managers/JABS_Engine.js`
- `src/plugins/map/core/managers/JABS_Engine.js`
- `src/plugins/omni/ext/monster/managers/JABS_Engine.js`
- `src/plugins/__ca-mods/core/managers/JABS_Engine.js`
- `src/plugins/popups/ext/abs/managers/JABS_Engine.js`

### `Game_Action.prototype` patches

- `src/plugins/abs/core/objects/Game_Action.js` (core JABS)
- `src/plugins/abs/ext/formula/objects/Game_Action.js`
- `src/plugins/abs/ext/shield/objects/Game_Action.js`
- `src/plugins/sdp/core/objects/Game_Action.js`
- `src/plugins/crit/core/objects/Game_Action.js`
- `src/plugins/prof/core/objects/Game_Action.js`
- `src/plugins/elem/core/objects/Game_Action.js`
- `src/plugins/extend/core/objects/Game_Action.js`
- `src/plugins/level/core/objects/Game_Action.js`

### `Scene_Map.prototype` patches

- `src/plugins/abs/core/scenes/Scene_Map.js` (dominant)
- `src/plugins/abs/ext/star/scenes/Scene_Map.js`
- HUD family: `src/plugins/hud/core/scenes/Scene_Map.js`, `hud/ext/*/scenes/Scene_Map.js`
- `src/plugins/map/core/scenes/Scene_Map.js`, `src/plugins/time/core/scenes/Scene_Map.js`, `src/plugins/log/core/scenes/Scene_Map.js`, `src/plugins/sdp/core/scenes/Scene_Map.js`, `src/plugins/utils/core/scenes/Scene_Map.js`

### `JABS_AiManager` stack

- Core: `src/plugins/abs/core/managers/JABS_AiManager.js`
- Ally AI: `src/plugins/abs/ext/allyai/managers/JABS_AiManager.js`
- Pixel bridge: `src/plugins/pixel/ext/abs/managers/JABS_AiManager.js`
- Level: `src/plugins/level/core/managers/JABS_AiManager.js`

### `Game_Unit.prototype` (ABS core)

- `src/plugins/abs/core/objects/Game_Unit.js` — `inBattle` forced true when ABS enabled; see [`abs-game-unit-inbattle-semantics.md`](../completed/abs-game-unit-inbattle-semantics.md).

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

- Two known collisions the report has to find, or it is not complete. J-Pixel-ABS replaces J-ABS-AllyAI's `JABS_AiManager.moveTowardSlotIfNeeded` without calling it, and loads later in `plugins.js`, so Ally AI's version never runs in Chef Adventure (still live on 2026-09-22). And J-ABS replaces `Sprite_Animation.prototype.targetPosition` for map animations without calling the original, which is why J-Base's device-scale correction lives in `targetSpritePosition` instead.
- Relates to [`build-tools-linting.md`](../completed/build-tools-linting.md) (lint gates `hotfix`; override inventory could inform future tooling).
- Plugin **load order** is `plugins.js` + `@orderAfter` / ship dependencies (post-Vite); there is no Combiner manifest.
