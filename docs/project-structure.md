# Project Structure

Reference material for the `rmmz-plugins` monorepo. Rules that govern *how code is written* live in
`CLAUDE.md` at the repo root; this file is the map of *where things are*.

This listing rots faster than anything else in the repo. When it disagrees with the filesystem, the
filesystem wins — `ls src/plugins` and `find src/plugins -maxdepth 3 -type d -name ext` regenerate the
truth in a second.

## Top-level

| Path | What it is |
|---|---|
| `/src` | All source: plugins, build tooling, type definitions |
| `/test` | Vitest suites (see [Test layout](#test-layout)) |
| `/out` | Vite build scratch, **nested by ship** (`out/sdp/J-SDP.js`). Gitignored — this is the intermediate, not the deliverable |
| `/project` | Not a loadable MZ project — no `data/`, no plugin manifest, no bootstrap. Three things live here and all three are load-bearing: `project/js/plugins/` is the **committed** mirror of `out/` that `hotfix` produces; `project/js/rmmz_*.js` are the vendored engine scripts the test harnesses execute and the engine-def and phantom-call tooling parse; `project/js/libs/` holds the real PIXI the view harness runs against |
| `/docs` | Markdown documentation, including this file. Mostly incomplete |
| `/.backlog` | Work items: `unstarted/` and `completed/`. Historical record, not active instruction |

## `/src`

| Path | What it is |
|---|---|
| `/src/build-tools` | Vite orchestration (`build-all`, `copy`, `init`), the MZ header plugin, the engine defs generator, and the `verify:*` gates. See root `README.md` |
| `/src/defs` | Custom type definitions covering much of the RPG Maker MZ core |
| `/src/plugin-template` | Vite ship scaffold cloned by `bun run plugin:init`; see `SCAFFOLD.md` in the generated folder |
| `/src/plugins` | Every plugin, one directory per family |

`src/build-tools` and `src/defs` use normal Node ESM. `src/plugins` uses ESM that gets bundled — see
the ship bundle contract in `CLAUDE.md`.

## Plugin families

A family is either a single `core/` or a `core/` plus an `ext/` tree of optional extensions. Each leaf
directory is one ship — one bundled `.js` that RMMZ loads.

Descriptions below are the `@plugindesc` values from each ship's `_metadata/_annotations.js`, which is
the authoritative source.

### `_base` and `__ca-mods`

| Ship | Description |
|---|---|
| `_base` | The base class for all J plugins. Common logic reused everywhere else lives here |
| `__ca-mods/core` | JS mods exclusive to Chef Adventure ("CA"), the consumer test game |

### `abs` — JABS, J's Action Battle System

Custom action battle system for RMMZ. The largest family in the repo.

| Ship | Description |
|---|---|
| `abs/core` | Enables combat to be carried out on the map |
| `abs/ext/allyai` | Grants your allies AI to fight alongside the player |
| `abs/ext/charge` | Enable skills to be charged to perform other skills |
| `abs/ext/danger` | Enable danger indicators on foes on the map |
| `abs/ext/diag` | Enables diagonal movement |
| `abs/ext/food` | Food group chain states and decay |
| `abs/ext/formula` | Allows multiple damage formulas on a single action |
| `abs/ext/hitstop` | Adds hitstop functionality |
| `abs/ext/input` | A manager for overseeing the input of JABS |
| `abs/ext/juice` | Procedural map battler motion juice (squish, tilt) |
| `abs/ext/loadout` | A scene for managing every party member's combat loadout |
| `abs/ext/poses` | Enable action poses for JABS |
| `abs/ext/shield` | State-based HP shields |
| `abs/ext/speed` | Enable modifying move speeds |
| `abs/ext/star` | Converts random encounters into star battles. **Incomplete — see `CLAUDE.md`** |
| `abs/ext/targeting` | Cursor-driven tactical targeting |
| `abs/ext/timing` | Enable modifying cooldowns/casting for actions |
| `abs/ext/tools` | Enable new tool-like tags for use with skills |

### Everything else

| Ship | Description |
|---|---|
| `apt/core` | Grants the ability to learn by gaining points (aptitude) |
| `apt/ext/typed` | Typed (element / weapon type / skill type) AP gains |
| `cms/core` | A redesign of the main menu. Also owns the shared parameter-catalog rendering machinery the other CMS scenes build on |
| `cms/ext/equip` | A redesign of the equip menu |
| `cms/ext/skill` | A redesign of the skill menu |
| `crit/core` | Manages critical damage multiplier/reduction of battlers |
| `diff/core` | A layered difficulty system — several layers can apply at once |
| `drops/core` | Enables greater control over loot drops |
| `elem/core` | Enables greater control over elements |
| `escribe/core` | "Describing" an event with text and/or an icon over its head on the map |
| `extend/core` | Extends the capabilities of skills/actions — lets skills inherit from one another |
| `extend/ext/abs` | J-ABS integration for J-Extend |
| `extend/ext/sks` | J-SKS integration for J-Extend |
| `hud/core` | Core functionality for the HUD system, designed for use with JABS |
| `hud/ext/boss` | A HUD frame that displays a single target, like a boss |
| `hud/ext/food` | Displays the current food chain state |
| `hud/ext/input` | Displays your leader's buttons data |
| `hud/ext/party` | Displays your party's data |
| `hud/ext/quest` | Displays quest objective information |
| `hud/ext/target` | Displays your battle target |
| `jafting/core` | Root JAFTING ("J's" + "Crafting") menu, salvage loop, and extension hooks |
| `jafting/ext/create` | Consume items per a recipe to create another item |
| `jafting/ext/refine` | Bestow traits from one equip onto another, with limits |
| `level/core` | Allows levels to have greater control and purpose |
| `level/ext/flat` | Flat per-level thresholds and map-based kill experience |
| `level/ext/sync` | Content level sync for dungeons and trials |
| `log/core` | A log window for viewing on the map |
| `map/core` | Renders a passability-driven minimap on the screen |
| `message/core` | More message window functionality — choice visibility and extra code parsing |
| `natural/core` | Enables level-based growth of all parameters |
| `omni/core` | The "Omnipedia" data-centric scene |
| `omni/ext/monster` | Extends the Omnipedia with a Monsterpedia entry |
| `omni/ext/quest` | Extends the Omnipedia with a Questopedia entry |
| `passive/core` | Grants passive states from various database objects |
| `passive/ext/affix` | Random passive affixes + tier presentation for JABS enemies |
| `passive/ext/conditional` | Gates passives and auto-applies combat states on the JABS map |
| `passive/ext/otib` | One-Time Item Boosts as permanent passive states |
| `passive/ext/sks` | Gates passive state application by SKS equip state |
| `pixel/core` | J-Pixelistics — sub-tile (pixel-accurate) movement on the map |
| `pixel/ext/abs` | Bridges J-Pixelistics with J-ABS for combat-aware pixel movement |
| `popups/core` | Map text popups for JABS and beyond |
| `popups/ext/abs` | Combat and reward popups for JABS |
| `popups/ext/apt` | Aptitude point gain popups |
| `popups/ext/resources` | Skill cost and resource gain popups |
| `popups/ext/sdp` | SDP point gain popups |
| `prof/core` | Skill proficiency tracking — battlers track skill usage to learn/empower skills |
| `regions/core` | Controls passage by region ids |
| `regions/ext/skills` | Executes skills via region ids |
| `regions/ext/states` | Applies states via region ids |
| `resources/core` | Extends the skill cost/gain system to include HP, MP, and TP |
| `resources/ext/abs` | Damage-linked HP, MP, and TP resource effects |
| `sdp/core` | The SDP system, aka Stat Distribution Panels — permanent actor stat modification. Known in-world as the "Node Junction" |
| `sks/core` | Lets actors equip skills into dedicated skill slots |
| `sks/ext/abs` | Makes JABS's combat/dodge/offhand quick menus respect SKS slots |
| `time/core` | A system for tracking time — real or artificial |
| `utils/core` | Various system utilities |

## Inside a ship

```
<ship>/
  entry.js              # the Vite entry; every new file must be reachable from here
  vite.config.js        # merges vite.config.shared.js
  _metadata/
    _annotations.js     # the oversized JSDoc the MZ editor parses; holds the CHANGELOG
    initialization.js   # namespace shell, Metadata, Aliased maps, RegExp, Helpers — bootstrap only
    meta.js             # ship name/version constants for the header plugin
    _pluginMetadata.js  # the PluginMetadata subclass
    pluginCommands.js   # PluginManager.registerCommand wiring
  database/             # RPG_* classes
  managers/             # Manager classes and other static singletons
  objects/              # Game_* classes
  scenes/               # Scene_* classes
  sprites/              # Sprite_* classes
  windows/              # Window_* classes
  _models/              # plain data models (some older ships spell this __models)
```

Both `_models` and `__models` spellings are live across the repo. Neither is wrong; match whichever
the ship you are editing already uses.

## Test layout

`test/plugins/<family>/**` mirrors `src/plugins/<family>/**` for unit tests. Within a family,
`_component/` holds scenario and real-chain tests that exercise several units together.

| Path | What it is |
|---|---|
| `test/setup/rmmz-engine-loader.js` | Loads the real vendored `rmmz_core.js` / `rmmz_objects.js` so tests run against actual engine classes |
| `test/setup/rmmz-view-harness.js` | Loads the *whole* view layer — real PIXI, real `Window_*`, real `Scene_*` — with only `Bitmap` and the shader-compiling filters mocked. See [`testing-scenes-and-windows.md`](testing-scenes-and-windows.md) |
| `test/setup/install-minimal-menu-ui-stubs.js` | Menu scene/window scaffolding shared by SDP, Difficulty, and Aptitude |
| `test/setup/install-plugin-manager-with-params.js` | `PluginManager` with plugin parameters populated |
| `test/setup/repo-root.js` | Repo root path resolution |
| `test/fixtures/` | Shared fixtures |
| `test/plugins/<family>/fixtures/` | Per-family fixtures. JABS extension packs each get their own isolated fixture — never shared between packs |

Tests import plugin source directly as ESM and stub globals via `globalThis`. An older VM-based
harness (`evaluateShippedPlugin`, `*-vm.js`) was removed entirely; if you find a reference to it
anywhere, it is stale documentation.
