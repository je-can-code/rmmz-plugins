---
status: open
area: architecture
---

# Save system rewrite: codecs, scopes, and readable JSON

## Start here

You are replacing RMMZ's save format. Today a savefile is a compressed heap dump of live engine
objects. You are turning it into a **directory of pretty-printed JSON documents**, written through
per-type **codecs** that decide what persists, what is regenerated, and what a field means.

**This is one pull request.** The phases below are a build order — the sequence in which the pieces
become testable — not shipping boundaries. Do not split them.

| Phase | Produces | Status |
|---|---|---|
| 0 | the transient inventory, as data; plus the stale-cache bug fix | ✅ done |
| 1 | codec core: registry extension, encoder, decoder, `seed` | ✅ done |
| 2 | storage layer: generations, atomic pointer, pretty JSON | ✅ done |
| 3 | scopes and the section router | ✅ done |
| 4 | JAFTING refinement lineage | ✅ done |
| 5 | versioning and the migration seam | ✅ done |
| 6 | the test suite | ✅ done |
| 7 | `docs/save-system.md` + the `CLAUDE.md` rewrite — how to code against it afterwards | |

**Nothing is carved out, and nothing merges early.** An earlier draft proposed shipping Phase 0's
one-line battler-cache fix ahead of the rest, since it repairs a defect that exists on `main` today.
That is overruled deliberately: a save format is not partially verifiable, and a branch that has
merged half of itself is harder to reason about than one that has merged none of it. Everything lands
together, after the whole thing is verified and functional.

**Branch:** `feat/save-system-codec-rewrite`, cut from `main` at the close of PR #67.

### Carried forward out of Phases 2 and 3

Work that is understood, is not blocking, and belongs to a later phase or a sweep:

- **The namespace-registration sweep.** 27 `_j.<plugin>` namespaces could be routed into
  `systems/*.json`; none are registered yet. Unregistered means "written inline with its host", which
  is correct but untidy. One line per plugin.
- **The retirement of the five ad-hoc hooks.** See
  [Ad-hoc save hooks to retire](#ad-hoc-save-hooks-to-retire) — they still run, they still work, and
  they now duplicate work the codecs would do.
- **`_j._passive._passiveSources` persists 14 whole `RPG_Skill` rows.** Registering the type made it
  encode cleanly and it is still wrong — a rebalanced skill never reaches an existing save. **This
  needs Jeremy's call**, because the fix is a change to J-Passive's storage (persist ids, resolve on
  read), not to the codec layer.
- **Nothing has saved or loaded in the real engine yet.** Every acceptance criterion below that says
  "in-engine" is outstanding. Phase 6 closes as much of this as automation can - a real
  `Game_Party` / `Game_Actor` / `Game_Map` now go out through `StorageManager.saveObject` and back in
  through `loadObject` on an in-memory filesystem - but `Scene_Boot`, `Scene_Load`, and the map setup
  that follows a load all need a rendering context. **A human at the keyboard is still the only thing
  that proves the cutover boots.**
- ~~**`SaveManifest.schemaVersion` is 1 and there is no migration chain.**~~ ✅ The seam is in
  (Phase 5). The chain is still deliberately empty, which is correct until the first schema change.

Found while doing Phases 4-6, none of them blocking, all of them belonging to somebody's later sweep:

- **`Game_Player`'s derived seed constructs a `Game_Followers`, which reads `$gameParty`.** The seed
  contract says seeds are side-effect free and do not read globals, and this one does both -
  `Game_Player.prototype.initMembers` ends with `this._followers = new Game_Followers()`, and that
  constructor's `setup()` sizes `_data` from `$gameParty.maxBattleMembers()`. It is masked in
  practice: `createGameObjects()` always runs before `extractSaveContents`, so the global exists, and
  the file's own `_followers` replaces the seeded one outright. **The fix is not "give `Game_Player`
  an explicit seed"** - `initMembers` is the alias chain every plugin's `_j` namespace on the player
  is built by, including all four character-like timer holders, and bypassing it would silently stop
  seeding them. It needs a way to run the chain without the construction, and that is a design call.
- **`Game_Party`'s explicit seed does not run the plugin `initialize` alias chain, so no plugin's
  `_j` namespace on the party is seeded.** Seven plugins alias `Game_Party.prototype.initialize` -
  ABS, ABS-ALLYAI, JAFTING-CREATE, JAFTING-REFINE, OMNI, PASSIVE, SDP. Classes that seed from
  `initMembers` get their chains for free; `Game_Party` is the one that had to supply a seed by hand,
  and a hand-written seed only knows about the engine's own fields. The consequence is the exact
  thing `seed` exists to prevent, for one class: a save written before a plugin existed comes back
  without that plugin's party state. Harmless today because saves are disposable. The shape of a fix
  is J-Base defining a `Game_Party.prototype.initMembers` for plugins to alias instead, which is a
  seven-plugin sweep and therefore Jeremy's call.
- **The `Game_Event` `_j` transient mints an own key holding `undefined` in a J-Base-only install.**
  Its cold value is "whatever the seed built", and it is plugins that build `_j` - vanilla has none.
  With no plugins loaded the factory hands back `undefined` and the decoder assigns it, producing a
  key that reads as present rather than absent. Unreachable in CA and in any install with a single
  `_j`-carrying plugin. Recorded because it is Principle 3's own failure mode in miniature.

Phases are expected to span several working sessions. Each session should pick up from this document
rather than from the last session's memory — if something here is unclear or wrong, **fix the
document as part of the work**. It is the only handoff artifact, and a gap found while executing is
worth more than a gap found later.

### Read these before writing anything

1. `project/js/rmmz_managers.js` lines **611-849** — `StorageManager`, the whole current pipeline.
2. `project/js/rmmz_core.js` lines **6416-6491** — `JsonEx`. Thirty lines. Read `_encode` twice; it
   mutates the objects you pass it.
3. `src/plugins/_base/core/SerializableRegistry.js` — 74 lines, the seam you are extending.
4. `src/plugins/_base/core/JsonEx.js` — the existing `Map`/`Set` override you will retire.
5. `src/plugins/omni/ext/quest/objects/Game_Party.js` lines **160-267** — a hand-written codec pair.
   This is the pattern you are generalizing.
6. `src/plugins/time/core/database/DataManager.js` — a hand-written re-seed-on-load. Same idea,
   different dialect.
7. `CLAUDE.md` — the repo rules. Several of them bite hard here; see
   [Conventions that bite](#conventions-that-bite-in-this-work) below.

### Glossary

| Term | Meaning |
|---|---|
| **Codec** | The per-type rules for turning an instance into plain data and back. |
| **Transient** | A field that is never written to disk and is re-seeded to a known cold value on load. |
| **Type map** | A codec's declaration of which of its fields hold class instances, and of what type. |
| **Section** | One JSON file inside a slot (`world.json`, `systems/abs.json`, …). |
| **Generation** | One complete, immutable write of a slot. Slots keep several; a pointer names the live one. |
| **Scope** | Which lifetime a piece of data belongs to: installation, profile, slot. |
| **Save id** | The stable string a codec is registered under. Never `constructor.name`. |

---

## Why this exists

### What RMMZ does today

`DataManager.makeSaveContents` collects ten live engine objects into a plain object.
`StorageManager.saveObject` runs `JsonEx.stringify` over it, `pako.deflate`s the result, and writes
the deflate stream to a single `.rmmzsave` file. Loading reverses that, and
`DataManager.extractSaveContents` assigns the deserialized blobs **directly** onto `$gameActors`,
`$gameParty`, `$gameMap` and friends.

That last step is the root of everything. Because the restored object *is* the live object, it must
carry the right prototype — so `JsonEx._encode` stamps `value['@'] = constructorName` onto every
node, and `_decode` resolves it with `window[name]`. The file is self-describing because the decoder
is type-blind: it asks each of ~1,700 nodes what it is, rather than the container knowing what it
holds.

Everything below follows from that one decision.

### What that costs

Measured against a real CA save (`save/file1.rmmzsave`, 2026-08-01):

| | chars |
|---|---|
| today, minified | 351,919 |
| minus derivable caches | 211,901 |
| minus `JABS_Timer` and map-event `_j.*` | 181,468 |

**Roughly half of every savefile is data the codebase already contains code to regenerate.**
`_questopediaCache` alone is 44,118 chars and is rebuilt in full by
`translateQuestopediaSaveablesToCache` on load — then written back to disk. The field names
(`_questopediaSaveables` vs `_questopediaCache`) already express the distinction. The format had
nowhere to record it.

Three further consequences:

- **No versioning and no migrations.** `Game_System._versionId` only drives
  `Scene_Load.reloadMapIfUpdated`, which reloads the *map* and never touches actors. Rename a
  persisted field and every existing save breaks silently.
- **No structure.** 27 distinct `_j.<plugin>` namespaces, spread across 58 host-path combinations,
  hang off whichever engine singleton was
  nearest. Quests live on `Game_Party` (99,581 chars) because `$gameParty` already got saved, not
  because quests belong to the party. Exactly one plugin ever added a top-level key
  (`contents.time`, in J-TIME).
- **No reference/value distinction.** JAFTING clones `$dataWeapons` rows into indices 2001+ and
  persists the *result*, so rebalancing a base weapon never reaches its refined descendants.

### A live correctness bug, not just waste

Nothing invalidates the battler trait caches on load. `$.actors._data[]._j._base._cachedTraitObjects`
comes back **warm**, holding database-row *copies* frozen at save time, and stays that way until a
state or equip change fires `onBattlerDataChange`. In combat that is instant. On the map it is not.
So during rebalancing: edit a state's traits, load a save, and the actor keeps the old values.

`Scene_Load.reloadMapIfUpdated` is the one mechanism that notices the database changed, and it only
reloads the map.

### The goal is reliability, not size

**Save size is explicitly a non-goal.** The measurements above are evidence that the format models
the wrong thing; they are not a target. A slot may grow to tens of megabytes without anyone caring —
the engine writes that in the blink of an eye, and shipped AAA titles take seconds and hundreds of
megabytes without complaint. Nothing in this item should trade correctness, recoverability, or
clarity for bytes. **Where the two conflict, spend the bytes.**

The single requirement is that a player never thinks about saving. It works every time, and when
something does go wrong it degrades to the previous good state rather than to a broken one.

### You are not inventing codecs — five already exist by hand

This is a consolidation, not a new idea. The repo already contains five hand-rolled dialects of the
same pattern, each hooked into a different place:

| Where | What it does | Hook |
|---|---|---|
| `omni/ext/quest/objects/Game_Party.js` | `translateQuestopediaCacheToSaveables` / `…SaveablesToCache` | `Game_System.onBeforeSave` / `onAfterLoad` |
| `omni/ext/monster/objects/Game_Party.js` | same shape for monsterpedia | same |
| `time/core/database/DataManager.js` | re-runs `$gameTime.initMembers()` (`??=`) and recomputes derived tone after load | `DataManager.extractSaveContents` |
| `jafting/core/objects/DataManager.js` | `JaftingSalvageManager.initPartySalvageStorage()` after load | `DataManager.createGameObjects` + `extractSaveContents` |
| `jafting/ext/refine/objects/Game_Party.js` | stores whole refined equips, then `refreshDatabaseWeapons` re-injects them into `$dataWeapons` on load | called from JAFTING's own load path |

And `Game_Item` is the engine's own reference type — it stores `_itemId` + `_dataClass` and looks the
row up, instead of embedding it. Nothing else in the graph follows that example.

Four hooks, four conventions, zero shared contract. That is what this replaces.

---

## Design

### Principles

**1. A save is a document describing the world, not a dump of the objects that model it.**
The save structure does not have to mirror the runtime object graph. `$gameParty._j._omni` stays
exactly where it is at runtime and is *written* to `systems/omni.json`; the codec knows both ends.
No plugin refactor is required to reorganize the file layout.

**2. Field selection fails open.**
The default codec persists every own enumerable field except those a type explicitly declares
transient. Forgetting to declare something means it gets **saved**, which is wasteful and harmless.
The alternative — a schema that only persists what it names — fails closed, and its failure mode is
a player twenty hours in whose progress silently evaporated.

**3. Transients are re-seeded on decode, never merely omitted.**
A declared transient is absent from the *file* but restored to its cold value on the *object*. This
is not cosmetic. The cache guards read:

```javascript
if (this.getCachedAllNotes() !== null)
```

Strict `!== null`. A field that decodes as `undefined` passes that guard, and `allNotes()` returns
`undefined` instead of rebuilding. **Omission alone converts a size win into silent corruption.**

The declaration is therefore `field -> cold value factory`, not a bare field list. `null` and
`undefined` are not interchangeable here, and no guard gets rewritten to a falsy check to paper over
the difference: `null` is the deliberate "no value" sentinel, `undefined` is what an absent key or a
`Map` miss yields. A field whose cold value is genuinely either must say so, and say why.

**4. Typing is authoritative in code, redundant in the file.**
The type map is what the decoder uses. The tag is written anyway, carrying the registry's stable save
id — because size is a non-goal and there is no reason to drop a field that makes the file
self-describing to a human, gives the decoder something to recover from when a type map is
incomplete, and provides a free integrity check. Encoder and decoder assert the two agree.

The encoder additionally **throws when it meets a class instance at a position no type map
declares**. That is a completeness check on the declaration, not a decode requirement — it forces
every newly-added typed field to be classified deliberately, at save time, by the person who added
it.

### Scopes

| Scope | File | Contains | Lifetime |
|---|---|---|---|
| Installation | `save/config.json` | volume, touchUI, alwaysDash, **keybinds**, window prefs | forever; survives deleting all saves |
| Profile | `save/profile.json` | anything outliving a single playthrough | forever |
| Slot | `save/fileN/**` | the world | one playthrough |
| Slot header | `save/fileN/<gen>/manifest.json` | schemaVersion, playtime, chapter, party, saved-at | with its generation |

Keybinds live at `$gameSystem._j._abs._input._mappings` today, which is installation data trapped in
slot scope. `ConfigManager` has seven vanilla fields and zero plugin additions, which is why they
ended up there. Moving them is a deliberate behavior change: bindings become global rather than
per-save.

### On-disk layout

```
save/
  config.json
  profile.json
  file1/
    current                 <- one line: the live generation directory name
    gen-0007/
      manifest.json
      world.json            map, player, followers, vehicles, screen, timer,
                            switches, variables, selfSwitches
      party.json            gold, inventory, roster, formation
      actors.json
      systems/
        abs.json
        omni.json
        crafting.json
        jafting.json
        sdp.json
        ...
    gen-0006/               <- retained for rollback
```

### The system-file shape

A system file gathers one `_j.<plugin>` namespace from every host that carries it, keyed so the
router can put each slice back where it came from:

```json
{
  "@": "save-section",
  "plugin": "_abs",
  "hosts": {
    "system":    { },
    "party":     { },
    "player":    { },
    "map":       { },
    "actors":    { "1": { }, "2": { } },
    "followers": { "0": { }, "1": { } },
    "vehicles":  { "boat": { }, "ship": { }, "airship": { } }
  }
}
```

#### Eight hosts carry `_j.*` slices, not seven

Measured by walking `save/file1.rmmzsave` on 2026-08-01: **27 plugin namespaces across 57 host-path
combinations, on 8 distinct host paths.**

| Host path | Routed? |
|---|---|
| `$gameSystem` | yes |
| `$gameParty` | yes |
| `$gamePlayer` | yes |
| `$gameActors._data[]` | yes |
| `$gamePlayer._followers._data[]` | yes |
| `$gameMap._vehicles[]` | yes |
| **`$gameMap` itself** | **yes** — carries `_j._levelSync`, `_j._omni`, `_j._regions` |
| `$gameMap._events[]` | **no** |

`$gameMap` was missing from every list in an earlier draft, which would have silently dropped J-TIME's
neighbour plugins' map-scoped state — including `_j._omni._quest._destinationTimer`, the lone
`J_Timer` in the whole save. A system file therefore has **seven** host keys, never six and never
eight.

**`$gameMap._events[]` is the one host that is not routed.** Every `_j.*` slice on a map event is
transient per Phase 0, so the router does not walk `$gameMap._events` on either encode or decode and
a system file has no `events` key.

**But the router is not what drops them — a codec is.** An earlier draft had the router handling
event state, which cannot work: the events are still inside `$gameMap._events` when `Game_Map` is
encoded, so a router that merely declines to *lift* their slices leaves them to be written with the
map, `JABS_Timer`s and all, and the encoder throws on the first one. The `Game_Event` codec
therefore declares `_j` transient outright, which is both the skip and the re-seed.

Its cold value is **whatever the seed established**, which is a third shape of transient alongside
the lazy cache that answers `null` and the eager cache that rebuilds itself. The decoder runs `seed`
before any field from the file lands, and `Game_Event.initMembers` - the chain every plugin aliases -
is what builds `_j`. So by the time the transient factory runs, a complete freshly-initialized
namespace is already sitting there, and handing it back is the whole of the re-seed:

```javascript
transients: {
  _j: event => event._j,
},
```

That chain was checked link by link before relying on it: every plugin's `Game_Event.initMembers`
alias is pure assignment, including J-Pixelistics', whose `$dataMap`-reading work hangs off
`setupPageSettings` rather than `initMembers`.

**And the reason a load reaches a map setup at all is J-ABS, not the engine.** Vanilla's
`Scene_Load.reloadMapIfUpdated` only reserves a transfer when `$gameSystem.versionId()` disagrees
with the database, so an ordinary load performs no transfer and never calls `Game_Map.setup` -
meaning vanilla would keep the decoded events as the live ones. J-ABS **overwrites** that method to
reserve a transfer and request a map reload whenever JABS is enabled
(`abs/core/scenes/Scene_Load.js`), which is what actually guarantees `setupEvents` rebuilds every
event on load. Phase 0's claim that "the engine reconstructs them" is true for CA and false in
general; if J-ABS is ever disabled, event state comes back at its `initMembers` defaults instead of
its saved values, which is the intended behavior either way.

#### Not every `_j.<key>` is a namespace

Four keys sit directly on `_j` holding a primitive or an array rather than a plugin namespace object:

| Key | Host | Holds |
|---|---|---|
| `_j._textPops` | player, followers, vehicles, events | an array of pop requests |
| `_j._textPopRequest` | same | a boolean |
| `_j._hcr` | actors | a number |
| `_j._levelScalingEnabled` | system | a boolean |

A router that assumes `_j.<key>` is always a namespace object would happily write
`systems/_textPopRequest.json` containing `false`. The first two are already transient per the table
above; the other two are real persisted state that belongs with its owning plugin's slice, not in a
file of its own. **The router keys on a registered plugin list, not on whatever `Object.keys(_j)`
returns** — which is also what stops a stray field added to `_j` from silently minting a section.

### manifest.json

```json
{
  "schemaVersion": 1,
  "savedAt": "2026-08-01T19:04:11.238Z",
  "playtimeFrames": 547933,
  "sections": [ "world.json", "party.json", "actors.json", "systems/abs.json" ],
  "display": {
    "title": "Chef Adventure",
    "characters": [ [ "Actor1", 0 ] ],
    "faces": [ [ "Actor1", 0 ] ],
    "playtime": "12:45:33",
    "timestamp": 1754074251238,
    "mapName": "Riverside Kitchen",
    "leaderName": "Jerald",
    "level": 24,
    "gold": 8140,
    "party": [ 1, 2 ]
  }
}
```

`display` exists so the load menu never parses the world. `sections` exists so a truncated
generation is detectable before anything is decoded.

**`display` must be a superset of what `DataManager.makeSavefileInfo` produces, not a replacement.**
An earlier draft listed only the interesting fields and dropped the vanilla five - `title`,
`characters`, `faces`, `playtime`, `timestamp` - which `Window_SavefileList.drawItem` reads by name.
Dropping them would have left the load menu blank. `_base/managers/DataManager.js` therefore extends
`makeSavefileInfo` rather than replacing it, and the manifest writes whatever it returns.

**The manifest replaces `global.rmmzsave` outright.** Vanilla keeps a second document listing every
slot's summary, written *after* the save it describes, so a crash between the two leaves the menu
describing a save that is not there. `DataManager.loadGlobalInfo` now derives `_globalInfo` by
reading each slot's manifest, and `saveGlobalInfo` is a no-op. No `global.json` is ever written. A
manifest is read as **plain data** - the decoder is never run over it, because the menu wants five
fields off a small document.

### The slot document and its section map

`SaveDocument` owns **what sections exist and what lands in each** — the single place that answers
"where does `$gameScreen` go." It replaces the flat object `DataManager.makeSaveContents` builds
today (ten engine keys plus J-TIME's `contents.time`).

```javascript
SaveDocument.registerKey('system', 'world.json');
SaveDocument.registerKey('screen', 'world.json');
SaveDocument.registerKey('timer', 'world.json');
SaveDocument.registerKey('switches', 'world.json');
SaveDocument.registerKey('variables', 'world.json');
SaveDocument.registerKey('selfSwitches', 'world.json');
SaveDocument.registerKey('map', 'world.json');
SaveDocument.registerKey('player', 'world.json');
SaveDocument.registerKey('party', 'party.json');
SaveDocument.registerKey('actors', 'actors.json');
// 'systems/<plugin>.json' is generated by SaveSectionRouter, not registered here.
```

(`system` was missing from the earlier draft's list of the ten. Followers and vehicles are absent
because they are not top-level keys - they travel inside `player` and `map`.)

A plugin adding a top-level key registers it against a section rather than aliasing
`makeSaveContents`. J-TIME's `time` is the migration case: it becomes a registered key routed into
`world.json`, and its `DataManager` alias goes away.

**Registration is optional, and an unregistered key lands in `world.json` rather than being
dropped.** The failure modes are not symmetrical: a key in the wrong file is untidy, a key in no file
is a player's progress evaporating. This is the same fail-open stance the codec layer takes on
fields, and it is what lets J-TIME's `contents.time` keep working untouched while its own retirement
waits its turn.

### Routing sequence

The router is not a free-floating transform — its ordering against the decoder is load-bearing,
because system slices must land on hosts that are themselves being decoded.

**Encode:**

```
1. build the slot object from SaveDocument's registered keys
2. encode each top-level key independently
3. router lifts each _j.<plugin> slice out of each encoded host, recording host kind + key
4. group the remaining keys into their sections and write
```

**Decode:**

```
1. read + parse every section file
2. router merges each slice back into the encoded host data it came from
3. decode each top-level key
4. assign the globals ($gameMap, $gameParty, ...)
```

**Both transformations happen on plain data, and the order above is a correction to an earlier
draft** that had the router lift before encoding and place after decoding. Both directions were
wrong, for different reasons:

- Lifting before encoding means reaching into `$gameParty` and pulling `_j._omni` off it during a
  save. Mutating live state while writing it is exactly the defect that made the engine's own
  `JsonEx._encode` dangerous.
- Placing after decoding is worse, because it is silent. **A host's transients are re-seeded as the
  last step of its own decode** - a fresh `JABS_Timer` is written to `_j._regions._skills._timer`
  while the `Game_Player` is being rebuilt. A slice merged onto the finished object afterwards
  replaces `_j._regions` wholesale and takes the freshly-seeded timer with it, leaving `undefined`
  at a path a guard reads with `!== null`. That is the exact failure Principle 3 exists to prevent,
  reintroduced by the routing step.

Merging before the decode also removes the problem the old ordering was trying to solve: there is no
"resolve `actors.3` against decoded objects" step, because the slice is put back while everything is
still the plain data the file holds.

**A system file naming a host that no longer exists is not an error.** Follower counts change,
vehicles get removed, an actor leaves the party. The router logs the orphaned slice and drops it; the
host that *does* exist keeps whatever `seed` gave it. The inverse — a host with no slice in the file
— is equally fine and is the normal case for anything added since the save was written.

**No codec may read `$dataMap` during decode.** `DataManager.loadGame` decodes before
`Scene_Map.create` calls `DataManager.loadMapData`, so map data for the saved map is not loaded yet.
Anything needing it belongs in a post-load hook, not a codec.

### The codec contract

Registration stays on `SerializableRegistry.register`, which already accepts `{ id, aliases }`:

```javascript
SerializableRegistry.register(Game_Party, {
  id: 'game-party',
  aliases: [ 'Game_Party' ],
  transients: {
    _questopediaCache: () => new Map(),
    _monsterpediaObservationsCache: () => new Map(),
  },
  typed: {
    _lastItem: Game_Item,
  },
});
```

**Read that `typed` block carefully, because the obvious guesses are wrong.** `Game_Party._actors` is
an array of actor **ids**, not `Game_Actor` instances (`Game_Party.prototype.initialize` sets
`this._actors = []` and `exists()` tests its length) — declaring it typed would make the decoder try
to rebuild integers into actors. `_items` / `_weapons` / `_armors` are plain id-to-count maps for the
same reason. The only field on `Game_Party` that genuinely holds an instance is `_lastItem`.

**A field is typed if it holds a class instance, not if its name sounds like it does.** The way to
know is to read the class's `initialize` / `initMembers` and see what it assigns.

| Option | Type | Meaning |
|---|---|---|
| `id` | `string` | Stable save id. Defaults to `constructor.name`; **new registrations should pass it explicitly** so a class rename never touches a save. |
| `aliases` | `string[]` | Older ids that still resolve here. How a rename ships without a migration. |
| `transients` | `Object<string, Function>` | Field name to `instance => coldValue`. Never written; always re-seeded. The factory receives the decoded instance so an *eager* cache can rebuild itself from fields that have already landed; lazy caches ignore the argument. |
| `typed` | `Object<string, Function>` | Field name to the constructor it holds. Arrays and `Map` values declare the *element* constructor. |
| `typedValues` | `Object<string, Function>` | Field name to the constructor its **dictionary values** hold. For a plain object used as a keyed collection, which `typed` cannot express — see below. |
| `seed` | `Function=` | Establishes every field's default on a bare instance before decoded fields land. Defaults to calling `initMembers()` when the class has one, and to a no-op when it has neither. **Required** for classes that set up state in `initialize` instead. Must be side-effect free. |
| `encode` | `Function=` | Full override. Receives `(instance, path)`, returns plain data. Skips the default walk. |
| `decode` | `Function=` | Full override. Receives `(data, path)`, returns an instance. |

#### `transients` and `typed` take dotted paths

A flat field list could not express one row of the Phase 0 inventory: the caches worth declaring live
inside a plugin namespace (`_j._base._cachedAllNotes`), not on the class. Keys may therefore be dotted
paths, which compile once at registration into a tree the walkers descend in step with the data — the
encoder to skip a transient three plain objects down, the decoder to carry a declared type there.

The typed-field completeness throw applies **only to the direct own keys of a registered class.** A
namespace object is plain, has no declarations of its own, and is not policed; what protects an
instance nested inside one is the encoder refusing to encode an unregistered type at all. That is why
the real Phase 1 constraint was registration completeness rather than type-map size.

#### `typedValues`: a dictionary is not an instance

`typed` says "this field holds an instance of X" and forwards through arrays and `Map` values to their
elements. It cannot describe a plain object used as a keyed collection — and three exist in a real
save: `_j._aptitude._progress` keyed by class descriptor, `_j._aptitude._learned` keyed by skill id,
`_j._jafting._salvageLedgers` keyed by `w:62`-style stack slots.

Declaring one of those under `typed` would have the decoder rebuild the **whole dictionary** into a
single instance. With tags present the mismatch is invisible, because the `'@'` branch resolves before
the declaration is consulted; it surfaces only on the tags-stripped path, which is exactly where a
developer hand-editing a file lives. `typedValues` names that case explicitly.

#### `extend`: a codec for a shared host has more than one author

`Game_Party` is registered by J-Base. The caches at `$gameParty._j._omni` belong to J-Omni, and core
does not reach into an optional extension — so J-Base cannot name them, and a second `register` call
would clobber the first. `SerializableRegistry.extend(constructor, options)` merges `transients`,
`typed`, and `typedValues` into an existing codec, leaving `id`, `aliases`, and `seed` to whoever
registered the type.

**This is where every plugin-owned transient in the Phase 0 table gets declared** — the omnipedia
caches, the timer holders, `_textPops` — as each plugin is touched. J-Base declares only its own: the
five battler caches on `Game_Actor`.

Extending a type nothing has registered throws, naming the load-order problem, rather than quietly
inventing a codec that the owning plugin would then overwrite.

#### A codec is resolved by exact constructor, so declare on the classes that are saved

`SerializableRegistry.codecForInstance` is a `Map` lookup on `value.constructor`. It does **not**
walk the prototype chain, and declarations do not inherit. That is deliberate - it is a lookup, not a
resolution algorithm - but it invalidates a line Phase 0 wrote about the character-like timers:

> The four character-like timers are declared on `Game_CharacterBase` / `Game_Character`, so one
> declaration per class covers player, followers, vehicles, and events alike.

They are *assigned* there. They must be *declared* on `Game_Player`, `Game_Follower`, and
`Game_Vehicle` - each one separately - because those are the constructors an encoder actually meets
in a savefile. A declaration on `Game_CharacterBase` describes a type that never appears in a save by
itself and reaches nothing. Events need no declaration at all, since their whole `_j` is dropped by
the `Game_Event` codec.

This is why `abs/ext/tools`, `regions/ext/skills`, and `regions/ext/states` each call `extend` three
times with the same transient bag.

`encode` / `decode` are the escape hatch for types whose storage shape genuinely differs from their
runtime shape — JAFTING lineage in Phase 4 is the motivating case. Most types declare only
`transients` and `typed`, and many declare neither.

### Encode

```
encode(value, path):
  null or primitive            -> value
  Array                        -> value.map(el => encode(el, path + '[i]'))
  Map                          -> { '@': 'Map', entries: [ [ encode(k), encode(v) ], ... ] }
  Set                          -> { '@': 'Set', values: [ encode(v), ... ] }
  plain object                 -> map each own key through encode
  class instance:
    codec = registry.codecForInstance(value)     // keyed on the constructor, not a name
    if !codec        -> throw SaveEncodeError(path, value.constructor.name)
    out = codec.encode ? codec.encode(value) : defaultEncode(value, codec, path)
    out['@'] = codec.id
    return out

defaultEncode(value, codec, path):
  out = {}
  for each own enumerable key of value:
    if codec.transients has key -> skip
    if value[key] is a class instance and codec.typed lacks key -> throw SaveEncodeError(path.key)
    out[key] = encode(value[key], path + '.' + key)
  return out
```

Dispatch is on `Object.prototype.toString.call(value)` — `'[object Map]'`, `'[object Set]'`,
`'[object Array]'`, `'[object Object]'` — with "is this a class instance" being the `'[object Object]'`
case plus a registry lookup keyed on `value.constructor`. **Not `typeof`, not `instanceof`** — see
[Conventions](#conventions-that-bite-in-this-work).

**`Map` and `Set` need their own branches, and it is easy to leave them out.** They do not answer
`'[object Object]'`, so the class-instance path never sees them; their real entries live in internal
slots that `Object.keys` cannot reach, so the plain-object path would encode them as `{}`. The existing
`JsonEx._encode` override already carries exactly these two branches and is the reference. A save holds
37 `Map`s today, 35 of which survive Phase 0 — among them `$.actors._data[]._j._sks._slotMap`, whose
silent loss would unequip every skill.

#### The real Phase 1 worklist is registration completeness, not type-map size

Trace `defaultEncode` carefully: the `typed` completeness throw only fires on **direct own keys of a
registered class**. `Game_Actor._j` is a plain object, so the walk falls into the plain-object branch,
which has no typed check and simply recurses. `_j._abs._equippedSkills` therefore never needs a
`Game_Actor.typed` entry.

What it *does* need is for `JABS_SkillSlotManager` to be in the registry — otherwise the encoder throws
when it reaches one. So type maps stay small, and the binding constraint is that **every class
reachable anywhere in a save must be registered.**

Measured against `save/file1.rmmzsave` on 2026-08-01: **55 distinct tags, 1,700 tagged nodes.** 23
classes are registered today. The gap is the worklist:

| Unregistered class | Tags | Where | Disposition |
|---|---|---|---|
| `RPG_Trait` | 255 | only inside battler caches | vanishes with the transients |
| `JABS_Timer` | 110 | five holder paths | register; transient at every holder |
| `RPG_Skill` / `RPG_SkillDamage` | 61 each | 47 in battler caches, **14 in `$.actors._data[]._j._passive._passiveSources[]`** | ✅ registered — see below |
| `RPG_UsableEffect` | 28 | read as cache-only, but reachable as `RPG_Skill.effects[]` | ✅ registered — the census missed this |
| `RPG_State` / `RPG_UsableEffect` / `RPG_Armor` / `RPG_Actor` / `RPG_Class` / `RPG_Weapon` | 28/28/8/4/4/4 | only inside battler caches | vanishes with the transients |
| `Map` | 37 | 35 survive | register as a codec, Phase 1 step 5 |
| `DifficultyConfig` | 17 | `$.system._j._difficulty._configurations[]` | register |
| `JABS_DeathContext` | 1 | `$.actors._data[]._j._abs._deathContext` | register |
| `J_Timer` | 1 | `$.map._j._omni._quest._destinationTimer` | register; transient |
| the 18 engine `Game_*` classes | 94 | the spine of the document | register with type maps, Phase 1 step 6 |
| `CGMZ_Core`, `Eli_SavedContents` | 1 each | third-party top-level keys | **not registered** — ✅ both plugins removed from CA's `plugins.js`, with their dependents |

**`_j._passive._passiveSources` is a genuine reference-vs-value bug, not a registration gap.** It
persists 14 whole `RPG_Skill` rows — database objects stored by value, so a rebalanced skill never
reaches a loaded save, exactly the failure JAFTING refinement has in Phase 4. Registering `RPG_Skill`
would make it encode cleanly and stay wrong. **Raise it with Jeremy rather than quietly fixing it**;
the fix is to persist skill ids and resolve them on read, which is a change to J-Passive's storage, not
to the codec layer. Nothing else in this item depends on the answer, so it does not block.

### Decode

```
decode(data, expectedCtor):
  null or primitive            -> data
  Array                        -> data.map(el => decode(el, expectedCtor))
  object with '@':
    codec = registry.codecById(data['@'])
    if !codec                        -> throw SaveDecodeError(data['@'])
    if expectedCtor and mismatch     -> throw SaveDecodeError(mismatch)
    return codec.decode ? codec.decode(data) : defaultDecode(data, codec)
  object without '@':
    if expectedCtor -> defaultDecode(data, registry.codecForConstructor(expectedCtor))
    else            -> map each own key through decode

defaultDecode(data, codec):
  instance = Object.create(codec.constructor.prototype)
  codec.seed(instance)                             // establish every field's default first
  for each key of data except '@':
    instance[key] = decode(data[key], codec.typed[key])
  for each [field, factory] of codec.transients:
    instance[field] = factory()
  return instance
```

`Object.create(prototype)` rather than `new` — the constructor must not run, which is the same
contract `JsonEx._decode` has via `setPrototypeOf` and the reason `#private` fields are banned in
registered classes.

The `object without '@'` branch is what makes a **hand-edited file** work: strip the tags by hand and
the type map still rebuilds it correctly.

#### `seed`: why decode must establish defaults before assigning

`DataManager.loadGame` calls `createGameObjects()` and *then* `extractSaveContents()`, so the freshly
constructed `$gameParty` / `$gameActors` / `$gameMap` are thrown away and replaced by decoded ones.
Because `defaultDecode` never runs a constructor, **any field the class assigns at construction that
is not in the file comes back missing** — not just transients. Add a field to a model after a save
was written and every older save produces objects missing it, forever.

This is exactly why `time/core/database/DataManager.js` re-runs `$gameTime.initMembers()` on load
with `??=` assignments. That fix is correct and this generalizes it, one level up, so no individual
plugin has to remember.

**Every codec has a `seed(instance)` step that runs before decoded fields are assigned.** Default
behavior: call `instance.initMembers()` when the class defines one. Classes that establish state in
`initialize` instead — `Game_Party` is the obvious case, it assigns `_gold`, `_steps`, `_lastItem`,
`_actors` and calls `initAllItems()` directly in `initialize` — **must supply `seed` explicitly**, as
a function that assigns the same defaults without the side effects. Never call `initialize` itself:
`Game_Actor.prototype.initialize` takes an actor id and runs `setup()`, which does real work.

**An `initMembers` that takes parameters is a mapper, not a defaulter, and is never the seed.**
`RPG_Skill.prototype.initMembers(skill)` reads a database row it is handed and throws on the first
property access if called with nothing. The derived seed therefore checks arity and falls back to a
no-op when `initMembers.length > 0`, so a class shaped that way supplies `seed` explicitly or gets
nothing. Found while registering `RPG_Skill`; without it every decode of one threw.

**Decoded plain objects merge over seeded ones rather than replacing them.** `seed` promises that a
field added after a save shipped comes back at its default, and a plain assignment breaks that
promise one level down: the seed runs the whole `initMembers` chain and builds every plugin's `_j`
namespace, then the file's older `_j` replaces it wholesale and every plugin added since the save was
written finds its own state missing. `SaveDecoder.mergeOverSeeded` merges plain objects key by key -
the file wins where it has something to say, the seeded default survives where it does not - and
replaces outright for instances, arrays, `Map`s, and primitives, since a decoded instance is already
the complete answer for its position.

**Defaulting `seed` to `initMembers()` inherits the whole alias chain, so verify the chain, not the
method.** `Game_Battler.prototype.initMembers` is aliased by a dozen plugins, and the default is only
correct if *every* link is pure assignment. J-Base's link is (`||=` namespaces, then five literal
assignments), and so are the ones read for Phase 0 step 1 — but that is a property of the current
chain, not a guarantee. A link that constructs, registers, or reads a global makes the default wrong
for that class, and the class must then supply `seed` explicitly. Check before relying on the default.

Consequences to accept deliberately:

- `seed` must be **free of side effects**. It assigns defaults and nothing else. This is the same bar
  `is*` / `can*` / `should*` methods are already held to.
- **`seed` must also produce fresh, unshared objects.** `mergeOverSeeded` writes into the seeded
  object in place, so an `initMembers` that assigns a shared constant rather than a fresh literal
  would have that shared default mutated on every load, corrupting it for every other instance.
  Nothing in the tree does this today — verified by review on 2026-08-02 — which is exactly why it
  needs writing down before someone adds the first one. This is a stricter bar than side-effect
  freedom and it did not exist before the merge did.
- **The merge cannot represent a deletion.** Where `seed` produces a *non-empty* plain-object
  dictionary and the runtime can `delete` keys from it, a key removed before the save is resurrected
  on load: the file says it is gone, the seed says it exists, and the merge sides with the seed.
  Currently harmless — the engine does delete this way (`Game_Party` drops an item key when its stack
  hits zero) but seeds those containers empty, so there is nothing to resurrect. A future field that
  seeds non-empty *and* supports deletion must use an array, a `Map`, or an explicit tombstone.
- Assignment order is **seed, then decoded fields, then transients**. Decoded values always win over
  seeded defaults; transients always win over both.
- A field added to a class after a save shipped comes back at its seeded default instead of
  `undefined`. **This is the property that lets you add fields without a migration**, and it is worth
  more than the milliseconds it costs.

### Storage: generations behind an atomic pointer

This is the part that makes it Just Work, and directory-per-slot makes it *more* important, not less
— a slot is now a dozen files, so a naive in-place write has a dozen chances to be torn, and a
half-written slot is unrecoverable.

**Save:**

```
1. generation = read(save/fileN/current) + 1, or 1 if absent
2. dir = save/fileN/gen-<zero-padded generation>/
3. mkdir dir, and dir/systems
4. for each section: openSync, writeSync, fsyncSync, closeSync
5. write manifest.json the same way
6. fsync the directory handle
7. write save/fileN/current.tmp containing the generation dir name; fsync; close
8. rename current.tmp -> current            <- the only atomic step, and the only one that matters
9. prune generations older than the retained count
```

Nothing overwrites a file the game might need. A crash at any point before step 8 leaves the previous
generation live and the partial one orphaned; step 9 next time cleans it up.

**Load:**

```
1. read current -> generation dir name
2. read manifest; verify schemaVersion is understood and every listed section exists
3. decode sections
on any failure at 2 or 3: step to the next-older generation and retry
if none verify: fail loudly, naming what was wrong with each
```

Retain at least **three** generations. The failure mode of a bad save becomes "you lost the last
save", never "you lost the file."

For contrast, today `saveToLocalFile` renames the live file to `.rmmzsave_` before writing, and
`loadFromLocalFile` **never reads that backup**. The safety net exists and is not connected to
anything.

`Utils.isNwjs()` is always true for CA — external file loading does not work in a browser context, so
the `localforage` branch is deleted rather than abstracted. Do not reintroduce it "just in case."

### Where each piece lives

New files:

| Path | Holds |
|---|---|
| `src/plugins/_base/core/save/SaveEncoder.js` | the encode walk |
| `src/plugins/_base/core/save/SaveDecoder.js` | the decode walk |
| `src/plugins/_base/core/save/SaveCodec.js` | the normalized per-type record the registry stores |
| `src/plugins/_base/core/save/registerEngineSaveCodecs.js` | `Map`, `Set`, and the engine classes |
| `src/plugins/_base/core/save/SaveManifest.js` | manifest model, registered serializable |
| `src/plugins/_base/core/save/SaveDocument.js` | which top-level key lands in which section |
| `src/plugins/_base/core/save/SaveSectionRouter.js` | slot object <-> section files, `_j.*` lifting |
| `src/plugins/_base/core/save/SaveMigrationRegistry.js` | version chain |
| `src/plugins/_base/core/save/SaveError.js` | the error base: path plus a `kind` discriminator |
| `src/plugins/_base/core/save/SaveEncodeError.js` | encode failures, one named factory per case |
| `src/plugins/_base/core/save/SaveDecodeError.js` | decode failures, one named factory per case |
| `src/plugins/_base/core/save/SaveStorageError.js` | file-level failures: missing pointer, torn generation, refused write |
| `src/plugins/_base/managers/SaveFileSystem.js` | generations, pointer, fsync, pruning |
| `src/plugins/_base/managers/StorageManager.js` | engine augmentation replacing the pipeline |
| `src/plugins/_base/managers/ConfigManager.js` | installation scope onto the new pipeline |
| `src/plugins/_base/managers/ProfileManager.js` | profile scope: the third lifetime, with the same registration seam |

`SaveDocument.js` was missing from this table in the original draft even though the design section
describes `SaveDocument.sections`; it is its own file, because one class per file is the rule and
because "which section does this key go in" and "how are `_j` slices lifted" are two questions with
two different answers. `SaveStorageError.js` and `ProfileManager.js` were simply not anticipated.

Modified:

| Path | Change |
|---|---|
| `src/plugins/_base/core/SerializableRegistry.js` | accept `transients` / `typed` / `encode` / `decode`; index by constructor |
| `src/plugins/_base/core/JsonEx.js` | retire the `Map`/`Set` overrides once codecs cover them |
| `src/plugins/_base/managers/DataManager.js` | route save/load through the new pipeline |
| `src/plugins/_base/_metadata/initialization.js` | add `StorageManager` and `ConfigManager` to `J.BASE.Aliased` |
| `src/plugins/_base/entry.js` | import every new file |
| `src/plugins/_base/core/registerJBaseSerializableModels.js` | register the engine-class codecs |

Every new file must be reachable from `_base/entry.js` or it does not ship.

---

## Phase 0 — inventory and the stale-cache bug

**This phase writes almost no code.** Its product is the table below: every field that must not be
persisted, and the cold value it comes back as. That table is *input* to Phase 1 — each row becomes a
`transients` entry on a codec declaration.

Resist the urge to implement transient handling here with `Game_System.onBeforeSave` /
`onAfterLoad`. Those hooks work, and in a two-PR world they would be the right interim answer — but
in one PR you would write them in Phase 0 and delete them in Phase 1. **Do the inventory, not the
plumbing.**

### Do step 1 first anyway

Step 1 below — calling `onBattlerDataChange()` on every actor after a load — fixes a defect that
exists on `main` today and is independent of the rest of this work. It does not ship early, but it
should be the **first commit on the branch**: it is a few lines, it is verifiable on its own, and
every subsequent phase is easier to trust when the caches are not already lying.

**Done** — commit `a388398`. `DataManager.extractSaveContents` now walks `$gameActors.existingActors()`
(a new accessor on `Game_Actors`, added because `actors()` lazily *constructs* every database actor it
is asked about and would permanently bloat the roster) and fires `onBattlerDataChange()` on each.

### The complete transient inventory

Every cold value below was read out of the line that assigns it, cited in the last column. Nothing
here is inferred from a field's name.

| Field | Owner | Cold value | Assigned at |
|---|---|---|---|
| `_j._base._cachedTraitObjects` | `Game_BattlerBase` | `null` | `_base/objects/Game_BattlerBase.js:29` |
| `_j._base._cachedAllTraits` | `Game_BattlerBase` | `null` | `_base/objects/Game_BattlerBase.js:39` |
| `_j._base._cachedAllNotes` | `Game_Battler` | `null` | `_base/objects/Game_Battler.js:150` |
| `_j._base._cachedMaxTpBonuses` | `Game_Battler` | `null` | `_base/objects/Game_Battler.js:158` |
| `_j._base._cachedHarFactor` | `Game_Battler` | `null` | `_base/objects/Game_Battler.js:165` |
| `_j._omni._questopediaCache` | `Game_Party` | **rebuilt, not blank** — see below | `omni/ext/quest/objects/Game_Party.js:52` |
| `_j._omni._monsterpediaObservationsCache` | `Game_Party` | **rebuilt, not blank** — see below | `omni/ext/monster/objects/Game_Party.js:47` |
| `_j._textPops` | character-likes | `[]` | render state; serializes as `[]` already |
| `_j._textPopRequest` | character-likes | `false` | render state; serializes as `false` already |
| every `JABS_Timer` / `J_Timer` | see holder table below | a fresh timer, per holder | stopwatches; no player-visible state |
| every `_j.*` on `$gameMap._events[]` | `Game_Event` | the next map setup | handled by the router in Phase 3, not by a codec |

#### Lazy caches re-seed; eager caches must be rebuilt

The five battler caches are **lazy**: every reader is guarded by `if (this.getCachedX() !== null)`, so
handing back `null` is a complete answer — the next read rebuilds. Principle 3 is satisfied by the cold
value alone.

The two omnipedia caches are **eager**, and a cold value alone silently breaks them.
`getQuestopediaEntryByKey` reads `getQuestopediaEntriesCache().get(questKey)` with no guard and no
rebuild path, so an empty `Map` does not read as "cold" — it reads as *"this playthrough has no
quests."* Today `synchronizeQuestopediaAfterLoad` repopulates it from `_questopediaSaveables`, and
something must keep doing that.

**So a transient factory receives the decoded instance**, not nothing:

```javascript
transients: {
  // lazy: the guard rebuilds on next read, so the cold value is the whole answer.
  _cachedAllNotes: () => null,

  // eager: nothing rebuilds this lazily, so the factory rebuilds it from the fields
  // that were just decoded.
  _questopediaCache: party => new Map(
    party.getSavedQuestopediaEntries()
      .map(entry => [ entry.key, entry ])),
},
```

This is safe because of the assignment order the contract already fixes — **seed, then decoded fields,
then transients** — so `_questopediaSaveables` is fully decoded by the time the factory runs. The
signature change costs nothing for the lazy cases, which simply ignore the argument.

**When classifying a transient, the question is not "is this derived?" but "does a reader rebuild it
on a miss?"** If nothing does, the factory owes the rebuild.

**Map-event state follows the engine.** `Game_Map.setupEvents` does `this._events = []` and
reconstructs every `Game_Event`, so anything hanging off an event is map-session state that a *load*
was restoring only by accident. Resulting behavior: reload next to a half-dead enemy and it comes
back fresh. That is the intent.

**Timers are transient by type.** Nothing they hold is state a player would notice resetting — they
are stopwatches and kitchen timers. Durable in-world time is J-TIME's `Game_Time`, which uses neither
timer class.

The two rules overlap, and the remainder is the part that needs care:

| Holder | Timers | Rebuilt by the engine? | Handled by |
|---|---|---|---|
| `$gameMap._events[]` | 64 | **yes** — `setupEvents` reconstructs | the router, Phase 3 |
| `$gamePlayer._followers._data[]` | 28 | no | a codec `transients` entry, Phase 1 |
| `$gameMap._vehicles[]` | 12 | no — `refereshVehicles` only calls `refresh()` | same |
| `$gamePlayer` | 4 | no | same |
| `$gameActors._data[]` (`_j._passive._conditional`) | 2 | no | same |
| `$gameMap` (`_j._omni._quest`) | 1 | no | same |

Counts re-measured against `save/file1.rmmzsave` on 2026-08-01: 110 `JABS_Timer` plus 1 `J_Timer`.
The 64 on events never reach a codec — the router skips `$gameMap._events` entirely, and the engine
re-seeds them at the next map setup. **The other 47 live on hosts that survive a transfer, so each
holder declares an explicit cold value.** Principle 3 applies to every one of them.

**There are two timer classes, not one, and the plan previously named only `JABS_Timer`.** The 47th
holder is a `J_Timer` on `$gameMap` — a host the routing section also missed; see
[Hosts](#eight-hosts-carry-_j-slices-not-seven). Both classes need registering.

#### Cold value per holder

Five distinct construction sites cover all 111 timers. Each cold value is the literal expression at
that site — a factory reproduces it exactly, including the plugin-parameter reads, so a rebalanced
delay takes effect on the next load rather than being frozen at whatever a save happened to capture.

| Path | Cold value | Constructed at |
|---|---|---|
| `_j._tools._grabThrow._grab._wait` | `new JABS_Timer(0)` | `abs/ext/tools/objects/Game_CharacterBase.js:38` |
| `_j._tools._grabThrow._throw._wait` | `new JABS_Timer(0)` | `abs/ext/tools/objects/Game_CharacterBase.js:54` |
| `_j._regions._skills._timer` | `new JABS_Timer(J.REGIONS.EXT.SKILLS.Metadata.delayBetweenExecutions)` | `regions/ext/skills/objects/Game_Character.js:42` |
| `_j._regions._states._timer` | `new JABS_Timer(J.REGIONS.EXT.STATES.Metadata.delayBetweenApplications)` | `regions/ext/states/objects/Game_Character.js:47` |
| `_j._passive._conditional._timer` | `new JABS_Timer(J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames \|\| 15)` | `passive/ext/conditional/objects/Game_Battler.js:59` |
| `_j._omni._quest._destinationTimer` | `new J_Timer(15)` | `omni/ext/quest/objects/Game_Map.js:44` |

The four character-like timers are *assigned* on `Game_CharacterBase` / `Game_Character`, but they
must be **declared** on each concrete class a savefile actually holds — `Game_Player`,
`Game_Follower`, `Game_Vehicle` — because codec lookup is an exact-constructor `Map` hit and
declarations do not inherit. Events need no declaration; their whole `_j` is dropped by the
`Game_Event` codec. See
[A codec is resolved by exact constructor](#a-codec-is-resolved-by-exact-constructor-so-declare-on-the-classes-that-are-saved).

Timer paths as they appear in a save, for the sweep:

```
$.map._events[]._j._tools._grabThrow._grab._wait          16
$.map._events[]._j._tools._grabThrow._throw._wait         16
$.map._events[]._j._regions._skills._timer                16
$.map._events[]._j._regions._states._timer                16
$.player._followers._data[]._j.<same four>                28
$.map._vehicles[]._j.<same four>                          12
$.player._j.<same four>                                    4
$.actors._data[]._j._passive._conditional._timer           2
$.map._j._omni._quest._destinationTimer                    1  (J_Timer)
```

### Steps

1. **Fix the stale cache on load.** ✅ Done, commit `a388398`. `DataManager.extractSaveContents` in
   `src/plugins/_base/managers/DataManager.js` walks the restored actors and calls
   `onBattlerDataChange()` on each. That one call nulls all five battler caches *and* runs
   `JCache.invalidateAllForBattler`, which walks `JCache._battlerCaches` — every battler-dimensioned
   cache instance ever constructed — and drops this battler's subtree from each. It is
   self-maintaining: a cache added later is covered without touching this code.

   Two placement details that are load-bearing and were confirmed while doing it:

   - The walk goes **after** the aliased original, not before. Vanilla's
     `extractSaveContents` body is what assigns `$gameActors`; anything ahead of the call is walking
     the throwaway object `createGameObjects` just made.
   - The engine's actor store is **sparse and indexed by actor id**. `forEach` skips holes, an index
     loop does not, and `Game_Actors.prototype.actor(id)` *constructs* a missing actor rather than
     reporting its absence — so the new `existingActors()` accessor hands back the raw store instead
     of routing through `actors()`.

   Every plugin that aliases `onBattlerDataChange` — LEVEL, SKS, ABS, ABS-SPEED, RESOURCES — was read
   before wiring this up, because `extractSaveContents` runs before `Scene_Map.create` and therefore
   before `$dataMap` exists. All of them recompute from the battler's own decoded state plus `$data*`
   tables; none reaches `$gameMap` or `$dataMap`. **Anything added to that chain later must hold to
   the same constraint**, which is the same rule the codecs are held to below.

2. **Complete the transient table above.** ✅ Done. Every cold value now cites the line that assigns
   it. The investigation turned up one thing the table could not express as written — eager caches
   need a rebuild rather than a blank — which changed the codec contract; see
   [Lazy caches re-seed; eager caches must be rebuilt](#lazy-caches-re-seed-eager-caches-must-be-rebuilt).

3. **Trace the non-event timer holders.** ✅ Done — 47, not 46, and across two timer classes rather
   than one. Cold values per holder are tabulated above.

4. **Note which existing hooks become obsolete.** ✅ Done; behaviors recorded below, so the Phase 1
   swap can be diffed against them rather than merely compiling.

#### Behavior of each hook being retired

| Hook | What it does today | Becomes |
|---|---|---|
| `Game_Party.synchronizeQuestopediaDataBeforeSave` | inits omnipedia if absent, then `cache -> saveables`, then `saveables -> cache` | nothing; the encoder skips the transient outright |
| `Game_Party.synchronizeQuestopediaAfterLoad` | inits omnipedia if absent, then `saveables -> cache`, then `cache -> saveables` | the `_questopediaCache` transient factory, which rebuilds the `Map` from decoded saveables |
| `Game_Party.synchronizeMonsterpedia*` | identical shape, keyed by `enemyId` instead of quest key | the `_monsterpediaObservationsCache` transient factory |
| J-TIME `DataManager.extractSaveContents` | assigns `$gameTime`, constructs a fresh `Game_Time` when the save predates TIME, re-runs `initMembers()` (all `??=`) to backfill new members, then `updateCurrentTone()` | `seed` covers the backfill; `updateCurrentTone()` is **derived display state and stays a post-load hook** — it is not a codec's job |
| JAFTING `initPartySalvageStorage` on `createGameObjects` **and** `extractSaveContents` | `\|\|=` three nested objects into place on `$gameParty._j._jafting`, guarded by a `$gameParty` null check | `seed` on the `Game_Party` codec; the double-call disappears because `seed` runs on the decoded instance rather than the throwaway one |

Note the shared shape: **all five are compensating for `JsonEx` restoring an object without ever
running its constructor.** That is precisely what `seed` exists to do once, centrally.

Two of them additionally guard against a save predating the plugin (`if (!$gameTime)`,
`if (!$gameParty)`). Those guards do not survive the swap and should not be reintroduced — a decoded
`Game_Party` always exists by the time the router runs, and a missing section is the router's normal
case, not an error.

**Why event `_j.*` is a router concern and never a codec one** — worth recording so nobody tries to
handle it with a `transients` entry:

- There is no single "event `initMembers` path" to re-run. Each plugin aliases
  `Game_Event.prototype.initMembers` independently and they run as a chain at construction. Calling
  `event.initMembers()` again would also reset engine fields — `_moveRouteIndex`, `_erased`,
  `_prelockDirection` — which is wrong.
- Nothing can re-seed it at decode time anyway: `$dataMap` for the saved map is not loaded until
  `Scene_Map.create`, so there is nothing to rebuild events against yet.

The router sidesteps both by never walking `$gameMap._events`, which leaves the engine's own
`setupEvents` to do the re-seeding at the next map setup, exactly as it does after a transfer.

### Acceptance

For step 1:

- **Manual, in-engine:** save, edit a state's traits in the database, load — the actor reflects the
  **new** traits without needing an equip change. This one cannot be automated from outside the editor,
  so it is a testplay step, and it stays outstanding until someone runs it.
- **Automated:** the seam is covered as a pair, since both halves already had homes.
  `_base/_component/game-battler-methods` asserts `onBattlerDataChange` nulls all five caches;
  `_base/_component/data-manager` asserts `extractSaveContents` fires it on every restored actor and
  skips the holes in a sparse store. Together those are the whole chain.

For the inventory: ✅ all met.

- Every row in the transient table names a cold value traceable to a specific line. No row says
  "probably null."
- All 47 non-event timer holders are accounted for, with the cold value each needs, across both timer
  classes.
- The behavior of each obsolete hook is written down well enough to diff against after Phase 1.

The observable outcomes — round-trip produces no `undefined`, quests survive intact, enemies reload
fresh, no growth across save/load/save — are asserted in **Phase 6**, once codecs actually do the
work. Phase 0 has nothing to assert them against.

---

## The build

### Phase 1 — codec core

**New:** `SaveCodec.js`, `SaveEncoder.js`, `SaveDecoder.js`, `SaveError.js`.
**Modified:** `SerializableRegistry.js`, `registerJBaseSerializableModels.js`.

✅ **Phase 1 is done**, commit `04595ed`, 61 new tests in
`test/plugins/_base/core/save/save-codec-core.test.js`. What each step turned into:

1. ✅ `SerializableRegistry.register` accepts `transients`, `typed`, `typedValues`, `seed`, `encode`,
   `decode`, and normalizes them into a `SaveCodec`. All 23 existing call sites still pass.
2. ✅ `codecForConstructor` / `codecForInstance` index on the constructor function.

   **`resolve(id)` still returns a bare constructor and must keep doing so.** `JsonEx._decode` reads
   it directly — `SerializableRegistry.resolve(name) || window[name]` — and hands the result to
   `Object.setPrototypeOf`. Repointing it at a `SaveCodec` throws on every load until Phase 2 retires
   that path, and even then the two lookups are worth keeping apart: one caller wants a constructor,
   the other wants a codec.
3. ✅ `SaveEncoder` and `SaveDecoder`, per the pseudocode above.
4. ✅ `SaveError` carries a `kind` discriminator alongside the path, because Phase 2's load loop has
   to tell a recoverable failure from one every generation will share, and cannot use a
   prototype-chain test to do it. `SaveEncodeError` / `SaveDecodeError` expose one named factory per
   case so the message is written once, next to the condition that produces it.
5. ✅ Register codecs for the `Map` and `Set` cases currently handled by the `JsonEx._encode` /
   `_decode` overrides, in the same wire shape. **The overrides are still in place.** `JsonEx` is still the live save path until
   Phase 2 swaps `StorageManager`, so deleting them here breaks saving in a branch that cannot yet
   save any other way — and reds two component suites that cover them. Adding the codecs is purely
   additive; the deletion is Phase 2 step 2, alongside the pipeline swap that makes it true.
6. ✅ Register codecs for the engine classes: `Game_Actor`, `Game_Party`, `Game_Map`, `Game_Player`,
   `Game_Event`, `Game_CommonEvent`, `Game_Follower`, `Game_Vehicle`, `Game_System`, `Game_Actors`,
   `Game_Followers`, `Game_Action`, `Game_ActionResult`, `Game_Item`, `Game_Interpreter`,
   `Game_Screen`, `Game_Picture`, `Game_Timer`, `Game_Switches`, `Game_Variables`,
   `Game_SelfSwitches`. Each with a stable kebab-case id plus its class name as an alias, so a file
   the engine's own `JsonEx` wrote — always tagged `constructor.name` — still resolves.

   Thirteen of them set state in `initialize` rather than `initMembers` and therefore carry an
   explicit `seed`. Where the engine already has an idempotent, side-effect-free reset — `clear()` on
   `Game_Screen`, `Game_Switches`, `Game_Variables`, `Game_SelfSwitches`, `Game_ActionResult`,
   `Game_Action` — that *is* the seed, so the defaults follow the engine instead of a copy that can
   drift. `Game_Followers` is the one that must stop short of its own setup: `setup()` sizes `_data`
   from `$gameParty.maxBattleMembers()`, which at decode time is the throwaway party.

   **Derive each type map by reading that class's `initialize` / `initMembers` in
   `project/js/rmmz_objects.js` — not from the counts in [Type-map scope](#type-map-scope) below.**
   Those counts were measured by walking one save, so they only capture fields that *happened to hold
   an instance in that snapshot*. An unequipped slot, an actor not mid-turn, a vehicle nobody boarded
   — all read as untyped there and are typed in general. `Game_Actor` alone assigns
   `_lastMenuSkill` and `_lastBattleSkill` as `Game_Item`s and fills `_equips` with `Game_Item`s via
   `initEquips`, while `_skills` holds ids and `_exp` is a plain id-to-number map.

   The counts are a **floor for estimating effort**, never the list to type in.

**Acceptance:** ✅ met. Round-trip produces a deep-equal object carrying the right prototype; the
encoder throws on an undeclared typed field; a payload with every tag stripped rebuilds from type maps
alone.

One acceptance line was added rather than deferred: **a decode with fields deliberately removed
matches a freshly constructed instance for those fields.** Round-trip alone passes whether `seed` is
correct, wrong, or absent — a full payload overwrites every default it establishes — so it cannot
detect the one property `seed` exists for. Phase 6 still sweeps this across every registered type; the
version here just makes Phase 1's own deliverable verifiable.

### Phase 2 — storage layer

**New:** `SaveFileSystem.js`, `StorageManager.js`, `SaveManifest.js`, `SaveStorageError.js`.
**Modified:** `initialization.js` (add the `ConfigManager` alias map and the retention parameter),
`_annotations.js` (the parameter itself), `DataManager.js`.

✅ **Phase 2 is done**, alongside Phase 3 — the two landed together, and the reason is step 2 below.

**The cutover moved to the end of Phase 3.** Step 2 as written switches `StorageManager` over before
`SaveSectionRouter` exists, which forces a throwaway single-section split that gets deleted days
later. Since both phases land in one PR anyway, the real order was: registrations, CA plugin removal,
`SaveFileSystem` + `SaveManifest` with a section-agnostic API, `SaveDocument` + `SaveSectionRouter`,
then **one** cutover with the real sections, then the scopes.

0. ✅ **Finish the registration sweep first, before anything points at the new encoder.** Phase 1
   registered only what `_base` owns; the moment `StorageManager` calls `SaveEncoder`, the first save
   throws `unregisteredType` on the first class it meets that nobody claimed. The census in
   [The real Phase 1 worklist](#the-real-phase-1-worklist-is-registration-completeness-not-type-map-size)
   names four that need an owner: `JABS_DeathContext` (J-ABS), `DifficultyConfig` (J-Difficulty),
   and `RPG_Skill` / `RPG_SkillDamage` (J-Base's database models, reachable through J-Passive's
   `_passiveSources`).

   **It is five, not four.** `RPG_Skill.effects` holds `RPG_UsableEffect` instances, so registering
   the skill drags that in too — the census read it as cache-only because in that snapshot every
   other occurrence was inside a battler cache. All five are registered, each with an explicit seed:
   `JABS_DeathContext` and `RPG_UsableEffect` because their initializers take arguments,
   `DifficultyConfig` and `RPG_SkillDamage` by copying a blank instance, and `RPG_Skill` from
   `RPG_Skill.createEmpty(0)`.

   `JABS_Timer` is **not** one of them. It is transient by type, so it reaches the encoder only if one
   of the forty-six holder declarations was missed — treat an `unregisteredType` on `JABS_Timer` as a
   missing transient declaration, not as a class needing registration. All 47 non-event holders are
   now declared, on `Game_Player` / `Game_Follower` / `Game_Vehicle` / `Game_Actor` / `Game_Map` —
   see [A codec is resolved by exact constructor](#a-codec-is-resolved-by-exact-constructor-so-declare-on-the-classes-that-are-saved)
   for why not on the classes that assign them.

0b. ✅ **Remove CGMZ_Core, EliMZ_Book, and SoR_MiniMapAndScene from CA before the cutover.** A real
   save carries `$.cgmz` and `$.eli` as top-level keys, written by two of those plugins through their
   own `makeSaveContents` aliases. `CGMZ_Core` and `Eli_SavedContents` are unregistered and nothing in
   this repo can register them, so the first save after `StorageManager` points at `SaveEncoder`
   throws on whichever it meets first.

   **Four entries came out of `plugins.js`, not two, and `SoR_MiniMapAndScene` was never in it.** The
   two cores have dependents that cannot load without them: `CGMZ_SaveFile` (the save/load scene) and
   `EliMZ_Zoom`. Jeremy approved removing all four. Evidence gathered first: zero references to either
   plugin family anywhere in CA's `data/*.json`, and none in any J plugin, so nothing in an event or
   a script call breaks. `CGMZ_ExitToDesktop` is on disk but was already not in `plugins.js`.

   Consequences to know about: **CA is on the vanilla save/load scene with no autosave** until
   `J.BASE.EXT.SAVE` exists, and the Eli zoom plugin command is gone. The `.js` files remain in
   `js/plugins/` — only the `plugins.js` entries were removed.

   Each plugin registers **its own** classes and calls `SerializableRegistry.extend` for the
   `_j.<plugin>` transients it contributes to an engine host — the omnipedia caches on `Game_Party`,
   the four character-like timers, `_textPops` / `_textPopRequest`. Core cannot do this on their
   behalf; that is what `extend` exists for.

   The census was measured from one save, so it is a floor. The mechanical check is the Phase 6 sweep
   over every registered type; the practical one is that a save now throws rather than silently
   writing something the decoder cannot rebuild.

1. ✅ `SaveFileSystem`, with the save and load sequences above. Synchronous `fs` calls inside
   `new Promise(...)`, reached through `StorageManager`'s `fs*` helpers rather than a local
   `require('fs')` — which is where the engine already put them and is what lets the crash-injection
   tests fail step N by stubbing one method.

   **`fsync` on a directory is best-effort.** Windows refuses to open a directory as a file, and CA
   ships on Windows; treating it as fatal would cost every save on that platform to buy durability on
   another. The pointer rename carries atomicity regardless.

2. ✅ Replaced `StorageManager.saveObject` / `loadObject` / `exists` / `remove` / `filePath`. The
   `pako` and `localforage` paths are unreachable. Slots and documents are told apart by name —
   `/^file\d+$/` is a slot, anything else is a single document — so `ConfigManager` needed no change
   to land on `config.json`.

   **The `JsonEx` `Map`/`Set` overrides do *not* get deleted, and this step said they would.** `JsonEx`
   stops being the *save* path but does not stop being used: `JsonEx.makeDeepCopy` is live in
   `_base/objects/Game_Actor.js`, `_base/windows/Window_EquipItem.js`, `abs/core/managers/JABS_Engine.js`,
   and vanilla `rmmz_windows.js`, and two of those deep-copy a **`Game_Actor`** — which holds
   `_j._sks._slotMap` and friends. Deleting the override would silently drop every `Map` from an equip
   preview. The same override also carries the fix that stops `_encode` mutating the live graph, which
   is a bug that was found the hard way and must not be reintroduced. Both suites
   (`_base/_component/jsonex-map-set-direct` and `…-save-load-integration`) stay for the same reason.
3. ✅ Pretty-printed with `JSON.stringify(value, null, 2)`.
4. ✅ `SaveManifest`, and a load-menu path that reads only `manifest.json` — asserted by a test that
   fails if any section file is opened.
5. ✅ Retention and pruning, parameterized as `retainedSaveGenerations` (default 3).

   Two defects surfaced here that the sequence in [Storage](#storage-generations-behind-an-atomic-pointer)
   does not anticipate. **Orphans must be recognized against the pointer the save started from**: the
   original "anything newer than the pointer" test runs after the swap, by which time a crashed
   write's leftovers are *older* than the new pointer and read as a legitimate previous generation.
   And **retention has to count generations, not compare numbers**: stepping over an orphan leaves a
   gap in the numbering, and a number-based window reads that gap as several saves' worth of age and
   deletes files that are still the newest ones there are.
6. ✅ A refused write throws `SaveStorageError.writeFailed` naming the file, leaves `current`
   untouched, and never reports success.

**Acceptance:** ✅ met, in `test/plugins/_base/core/save/save-storage-layer.test.js`. Crash injection
at every write step of a save leaves the previous generation live and loadable; a newest generation
that is truncated, malformed, versioned wrong, or merely undecodable falls back to the prior one; the
load menu reads a manifest without touching a section.

### Phase 3 — scopes and routing

**New:** `SaveSectionRouter.js`, `SaveDocument.js`, `ConfigManager.js`, `ProfileManager.js`.

✅ **Phase 3 is done.**

1. ✅ The section router. Runtime homes are unchanged — this is purely a file-layout concern.

   **The router skips `$gameMap._events` on both encode and decode**, and a system file has **seven**
   host keys, never six: `system`, `party`, `player`, `map`, `actors`, `followers`, `vehicles`. The
   "six" in the earlier draft contradicted the design section's own host table, which is right —
   `$gameMap` itself carries `_j` and is a host. Dropping event state is the `Game_Event` codec's job,
   not the router's; see [Eight hosts](#eight-hosts-carry-_j-slices-not-seven).

   **Namespace routing is opt-in and nothing is lost by not opting in.** `SaveSectionRouter.registerNamespace('_abs', 'abs')`
   is what produces `systems/abs.json`; an unregistered namespace stays inline on its host and is
   written with it. That is what keeps the router keyed on a list of real plugins rather than on
   whatever `Object.keys(_j)` returns — four keys on `_j` hold a boolean or an array rather than a
   namespace, and a naive router would write `systems/_textPopRequest.json` containing `false`.
   **The sweep of the 27 real namespaces is outstanding**; the seam and its tests are in place, and
   each plugin opting in is a one-line change with no behavioral consequence.
2. ✅ Keybinds moved to installation scope. Both stores — the controller mappings and the `Input`
   registry snapshot — live on `ConfigManager` and are written the moment they change, because
   installation scope has no save to wait for. The `Game_System` methods kept their names, since every
   caller already reaches for them there; only the storage moved.
   `initializeJabsInputForLegacySaveIfMissing` became `initializeJabsInputIfMissing`, which is what it
   now does: seed the store from the controllers' own defaults on a first run.
3. ✅ `ConfigManager` is on `config.json`, by way of `StorageManager` routing it as a document. It
   also grew a registration seam — `ConfigManager.registerField(key, defaultFactory)` — which is what
   the keybind move needed and what vanilla's seven fixed fields never allowed.
4. ✅ Profile scope: `ProfileManager`, `save/profile.json`, the same registration seam, read at boot
   through `Scene_Boot.loadPlayerData` and waited on by `isPlayerDataLoaded`. Nothing populates it
   yet, on purpose — what belongs at that lifetime is content design.

**Acceptance:** a fresh install with no `save/` produces sane defaults for every scope. Rebinding a
key in one slot is visible in another. Deleting `save/file1/` leaves config and profile intact.
**These are in-engine checks and remain outstanding** — the automated coverage asserts the mechanics
beneath them, not the player-visible outcome.

### Phase 4 — JAFTING refinement lineage

`JaftingManager.determineRefinementOutput(base, material)` is pure and deterministic — it parses
traits after the code-63 divider, merges with keep-better semantics, strips the self-sealing trait,
clones the base, and reattaches. No randomness, no player choice, no clock. **So refined equipment is
derivable and must not be persisted as a result.**

**Read `jafting/ext/refine/objects/Game_Party.js` lines 80-125 first.** The current mechanism is not
what it looks like from the manager alone: `addRefinedWeapon(equip)` pushes the whole
`RPG_EquipItem` into `$gameParty._j._refinement._weapons`, and `refreshDatabaseWeapons()` re-injects
each one into the datastore on load via `$dataWeapons[updatedWeapon._key()] = updatedWeapon`. So
there is already a hand-rolled encode/decode pair here too — a fifth one — and **the datastore index
is carried on the equip itself (`weapon.index` / `_key()`), not derived from list position.**

✅ **Phase 4 is done.** New: `jafting/ext/refine/__models/JaftingRefinementLineage.js`. Modified:
`JaftingManager.js`, `RefinementWorkflowSession.js`, `jafting/ext/refine/objects/Game_Party.js`.

1. ✅ Persist lineage, recursive, since a material may itself be refined. **One material per node,
   not a `materials: [ ... ]` array** — a refinement is always exactly base plus one donor, and depth
   is carried by the recursion on `base`. A node is either a *leaf* naming a database row by
   `kind` + `id`, or a *refinement* holding a `base` and a `material` that are themselves nodes. One
   class describes both, so the field is homogeneous and the tags-stripped decode path still works.

   **The recursion is load-bearing rather than thorough.** `JaftingSalvageManager.reclaimDynamicWeaponSlot`
   splices a refined row's entry out of the party's tracking list *and* writes `RPG_Weapon.createEmpty`
   over its `$data*` slot the moment its last copy leaves the party — which is what consuming it as a
   material does. A flat list with nodes referencing each other by index would therefore lose the
   provenance of every refined item ever used as a donor.

2. ✅ **One field is stored rather than derived, and the plan did not anticipate it: the salvage
   ledger.** `RefinementWorkflowSession.commitRefinement` stamps the output with
   `JaftingSalvageManager.buildRefinementOutputLedger(base, material)`, and that reads
   `$gameParty._j._jafting._salvageLedgers[key].unitLedgers[ordinal]` — the dismantle history of the
   *specific stack slot* the material came out of. The consuming `gainItem(-1)` then prunes it. So it
   is an input captured at a moment, not a derivation, and replay cannot reproduce it. The node
   carries it verbatim; traits, name, and refine count are still re-derived.

3. ✅ **Provenance is captured before the inputs are spent**, alongside the ledger, for the reason the
   existing code already documents for the ledger: `gainItem(-1)` fires `afterPartyLostItem`, which
   reclaims and splices. Reading it afterwards finds nothing to nest.
   `JaftingManager.lineageForDatum` therefore runs in `commitRefinement`, and `createRefinedOutput`
   receives two finished nodes rather than two equips.

4. ✅ **Replay runs from the post-load hook, not from a `decode` override, and this is a correction.**
   The plan puts it in the codec. It cannot go there: `SaveFileSystem.readSlot` steps back through
   older generations when one fails, so a decode that wrote into `$dataWeapons` on its way to
   throwing would leave a rejected generation's rows behind in the live datastore. The datastore is
   only ever touched by a load that succeeded, which means `Game_System.onAfterLoad` →
   `refreshDatabaseWeapons` / `refreshDatabaseArmors`, exactly where it happens today.

   **Consequently those two methods are not retired** — see
   [Ad-hoc save hooks to retire](#ad-hoc-save-hooks-to-retire), which says they become the lineage
   codec. They change what they do (replay a lineage instead of re-injecting a stored equip) and stay
   where they are. `addRefinedWeapon` / `addRefinedArmor` do change: they now take a lineage node.

5. ✅ The deterministic half of `generateRefinedEquip` — the refine-count increment, the `+N` suffix
   rewrite, and `_updateIndex` — is extracted as `JaftingManager.stampRefinedOutput`, called by both
   the live path and the replay path. **Two implementations that had to agree would be precisely the
   bug this phase exists to prevent**, and the plan's step 2 describes a replay of
   `determineRefinementOutput` alone, which reproduces neither the name nor the count.

6. ✅ The allocator counters in `_j._refinement._increments` were already persisted and stay so.

7. ✅ A lineage naming a row that is gone throws with `'w:404'`-shaped context. So does a node
   carrying a datastore letter nothing maps to.

8. ✅ The tradeoff is stated at `JaftingManager.replayLineage`: derived values follow the deriver, so
   changing `TraitResolver.refineTraits` shifts every existing refined item on the next load.

**A latent defect this closed on the way past.** `RPG_Weapon` and `RPG_Armor` are not registered, and
the old storage put whole `RPG_EquipItem`s on `$gameParty`. The first save taken after any player
refined anything would have thrown `unregisteredType` — the census never saw it because the measured
save had no refined equipment in it. Storing lineage removes the reachable path rather than papering
over it with two more registrations.

**Acceptance:** ✅ automated in `test/plugins/jafting/_component/refine-jafting-manager-direct.test.js`
(replay picks up a mutated base row, reproduces indices, and is stable across two runs) and
`…/refinement-lineage-codec.test.js` (a three-deep lineage round-trips through the real encoder and
decoder, tags stripped or not). The in-engine version — refine, save, raise the base's ATK, load —
remains a testplay step.

### Phase 5 — versioning

✅ **Phase 5 is done.** New: `SaveMigrationRegistry.js`. Modified: `SaveFileSystem.js`,
`SaveStorageError.js`.

1. ✅ `manifest.json` carries `schemaVersion`; that landed in Phase 2.
2. ✅ `SaveMigrationRegistry.register(fromVersion, migrate)` maps a version to a pure function
   producing the next version's document, and the loader chains them.

   **A migration receives and returns `{ manifest, sections }`, not just the sections.** A schema
   change that renames or splits a section file has to rewrite the manifest's `sections` list too, and
   a migration handed only the sections could not.

   **The registry stamps the new version, not the migration.** A step that forgot would otherwise
   spin the chain forever; this way the loop cannot fail to advance.

3. ✅ The chain applies inside `SaveFileSystem.readGeneration`, **on plain data, between reading the
   sections and handing them on** — the same reason the router merges before decoding. Seeds and type
   maps describe the current schema and cannot be told to read an older one, so the document has to be
   brought forward before anything becomes an instance. It also sits **inside the generation retry
   loop**, so a migration that throws makes its generation fall back like any other unreadable one
   rather than taking the whole load down.
4. ✅ `readManifestAt` no longer hard-fails on any mismatch: it fails when no *chain* reaches the
   current version. That is what lets the load menu show a slot written by an older build, and keeps
   it hiding one it genuinely cannot open. The error names the first missing step, or says the save
   is from a newer build when nothing could ever bridge it.
5. ✅ Day one the chain is empty, which is correct — with no steps registered,
   `hasPathToCurrent(current)` is trivially true and every older version fails loudly.
6. **The chain must be real before 1.0 ships, not after.** Pre-release, hard-failing is correct
   because saves are disposable. The day a player exists, that same behavior is a patch that eats
   their file — and a migration cannot be retrofitted onto a version that shipped without a stamp.
   This is the one phase whose deadline is external. **It is still outstanding**; the seam exists, the
   first real migration does not, and nothing needs one yet.
7. ✅ Every migration ships with a **committed fixture** of the older document shape.
   `test/plugins/_base/core/save/fixtures/legacy-generation-v1.json` is the first one, and it exists
   before any migration does on purpose: it is what proves the mechanism composes a v1 → v3 chain
   through the real reader, so the migration written a year from now drops into something already
   verified.

### Phase 6 — tests

✅ **Phase 6 is done.** These are acceptance criteria for "Just Works", not a coverage exercise. The
suite stands at **774 files / 12,830 tests**, up 79 across four new files:

| File | Covers |
|---|---|
| `_base/_component/save-load-real-engine.test.js` | the whole pipeline, against real engine objects |
| `_base/core/save/save-codec-registry-sweep.test.js` | the two fixture-driven sweeps over the registry |
| `_base/core/save/save-migration-chain.test.js` | the versioning seam, unit and through the real reader |
| `jafting/_component/refinement-lineage-codec.test.js` | lineage survives a save |

Against the list this phase was written as:

- ✅ Round-trip per codec, one `it` per branch — Phase 1's 61 cases, plus five more from Phase 2.
- ✅ **`seed` covers every constructor-assigned field**, and it is now a *sweep* rather than a case
  per type: every entry of `SerializableRegistry.codecsByType()` is seeded and decoded from an empty
  payload, and any field left holding `undefined` fails the run naming its codec. A type registered
  next year is covered the day it is registered.
- ✅ **Seeds produce fresh, unshared objects** — the same sweep seeds each type twice and fails on any
  field where the two instances hold the same object. This is the boundary condition the merge
  introduced and nothing else checks.
- ✅ Routing places a slice, drops an orphan, leaves a host with no slice at its seeded default —
  Phase 3.
- ✅ **No field is `undefined` after a decode**, as above.
- ✅ **Every registered type's fields are covered by its type map** — the second sweep, in two forms:
  a direct check that every instance-valued field a seed establishes appears in the type tree, and an
  encode of every seeded instance asserting the completeness throw does not fire.
- ✅ Encoder assertion fires on an undeclared typed field — Phase 1.
- ✅ Transients absent from the file, present and cold on the object — asserted at unit level in
  Phase 1 and end-to-end against a real `Game_Actor` in the round-trip suite.
- ✅ Crash injection at every step of a save — Phase 2's 44 cases.
- ✅ A truncated or malformed newest generation falls back — Phase 2, and again end-to-end.
- ✅ An unregistered codec id and a tag disagreeing with its type map both fail loudly — Phase 1.
- ✅ JAFTING lineage replay reproduces indices and picks up a mutated base row — Phase 4.
- ✅ Migration chain: a committed v1 fixture loads at v3, through `SaveFileSystem.readSlot`.

#### The test the plan did not name, and the one it cannot have

**The plan's list is all mechanisms, and the branch's real risk was that none of them had ever run
together.** The addition is `save-load-real-engine.test.js`: build a world out of real `Game_Party` /
`Game_Actors` / `Game_Map` / `Game_Player` objects, `StorageManager.saveObject` it, throw the world
away, `loadObject` it back, and check what comes out. That single path exercises the router, the
section split, the manifest, the seed merge, the transient re-seeding, and the globals assignment at
once — and it is the only place any of them meet.

Two things are reproduced rather than imported, for the reason the existing
`jsonex-map-set-save-load-integration` suite already documents: **`project/js/rmmz_managers.js`
cannot be loaded in this environment**, because `ImageManager` builds a `Bitmap` at module scope and
that needs a real `document`. So `makeSaveContents`, `extractSaveContents`, and `createGameObjects`
are copied verbatim — they are pure key assignment — while everything beneath them is the real,
imported implementation.

**What no automated test here can reach:** `Scene_Boot`, `Scene_Load`, `Scene_Map.create`, and the
map setup that follows a load. Those need a rendering context. The in-engine acceptance lines in
Phases 0, 2, 3, and 4 stay outstanding, and a human at the keyboard is still the only thing that
proves the cutover boots.

### Phase 7 — the developer documentation

**JE asked for this explicitly and it is not optional.** Everything above describes how to *build*
the save system. This phase describes how to *code against it* afterwards, for the person adding a
field to a model two years from now with nobody to ask.

Two artifacts, following the precedent `docs/testing-scenes-and-windows.md` already sets:

- **`docs/save-system.md`** — the long form, written from the finished code rather than from this
  plan. This plan is a construction document and stops being true the moment the work lands.
- **A rewritten "Serialized models" section in `CLAUDE.md`** — the short rules, pointing at the long
  form. The current section describes `SerializableRegistry.register(ClassName)` and the `JsonEx`
  contract, both of which this work supersedes. **Leaving it stale is worse than not writing the new
  doc at all**, because it is auto-loaded and will actively mislead.

The long form must answer, at minimum:

1. **Adding a field to a serialized class.** What must be declared, and what happens when you forget.
   The asymmetry is the point: a missed `typed` declaration throws at save time, a missed `transient`
   silently persists forever. One is loud, one is a slow leak.
2. **Deciding transient vs persisted**, including the lazy/eager cache split — a guarded cache is
   satisfied by a cold value, an eagerly-read one has to be rebuilt from the decoded instance.
3. **The `seed` contract.** Why decode never runs a constructor, why `seed` must be side-effect free,
   and the property it buys: a field added after a save shipped comes back at its default instead of
   `undefined`, so most new fields need no migration at all.
4. **Reference versus value.** Database rows are stored as ids and resolved on read. This is the
   lesson `_passiveSources` and JAFTING refinement both taught the hard way — persisting a database
   row by value means rebalancing that row never reaches an existing save.
5. **Ownership and `extend`.** Which plugin declares what on a shared engine host, and why the plugin
   that owns the feature declares its own slice rather than core knowing about it.
6. **Dotted-path notation** for fields nested inside a `_j.<plugin>` namespace.
7. **The standing prohibitions**, each with its reason: no `#private` in a registered class, no
   reading `$dataMap` during decode, no side effects in `seed`.
8. **When a migration is genuinely required** versus when a `seed` default covers it.
9. **How to test a new codec** — the round-trip, and the sweep asserting no field decodes as
   `undefined`.

Write it for someone who has never read this plan and never will.

---

## Reference

### Measured baseline (`save/file1.rmmzsave`, 2026-08-01)

| Metric | Value |
|---|---|
| bytes on disk (deflate written as utf8) | 67,994 |
| deflate stream | 45,246 |
| inflated JSON | 351,919 |
| type tags | 1,700 across 55 classes |
| type tags surviving Phase 0 | 1,122 across 48 classes |
| distinct `_j.<plugin>` namespaces | 27, across 57 host-path combinations on 8 host paths |
| heaviest section | `$.party._j._omni` at 99,581 |

Reproducing this: inflate the file and walk it. `readFileSync(path, 'utf8')` yields the deflate stream
as a binary string exactly as the engine wrote it, so
`pako.inflate(Uint8Array.from(raw, c => c.charCodeAt(0) & 0xff))` round-trips it. Note that `pako` 3 has
no default export and does not accept `{ to: 'string' }` on `inflate` — `import * as pako` and decode
the bytes with `TextDecoder`.

### Type-map scope

**These counts are a floor, measured by walking one save — they are not the type maps.** See Phase 1
step 6. They are here to show that the work is small, not to be transcribed. Every figure in this
section was re-verified against `save/file1.rmmzsave` on 2026-08-01; the walk runs against the
document *after* Phase 0's transients are removed, since those classes are leaving.

The graph is broad and shallow — almost nothing holds another class instance:

```
                 typed/all fields    instances
Game_Player            2 / 62             1
Game_Event             1 / 62            16
Game_Vehicle           1 / 52             3
Game_Follower          1 / 48             7
Game_Actor             5 / 46             2
Game_Map               4 / 27             1
Game_Party             2 / 11             1
RecipeTracking         0 / 3            331
SkillProficiency       0 / 2            193

ENGINE:    94 tags, 19 classes -> 19 type-map entries
OWNED:  1,028 tags, 29 classes -> 10 type-map entries
                                 -----------------------
                                 29 declarations replace 1,122 tags
```

### Ad-hoc save hooks to retire

Once codecs exist, these hand-rolled pairs collapse into declarations:

- `Game_Party.synchronizeQuestopediaDataBeforeSave` / `synchronizeQuestopediaAfterLoad`
- `Game_Party.synchronizeMonsterpediaDataBeforeSave` / `synchronizeMonsterpediaAfterLoad`
- `DataManager.extractSaveContents` re-running `$gameTime.initMembers()` and `updateCurrentTone()` —
  becomes `seed` plus a post-load hook for the derived tone
- `JaftingSalvageManager.initPartySalvageStorage()` on both `createGameObjects` and
  `extractSaveContents` — becomes `seed`
- ~~`Game_Party.addRefinedWeapon` / `addRefinedArmor` storing whole equips, plus
  `refreshDatabaseWeapons` / `refreshDatabaseArmors` re-injecting them into `$dataWeapons` /
  `$dataArmors` on load — becomes the Phase 4 lineage codec~~ ✅ **done, and half of this line was
  wrong.** `addRefinedWeapon` / `addRefinedArmor` now take a lineage node instead of an equip. But
  `refreshDatabaseWeapons` / `refreshDatabaseArmors` are **not** retired and must not be: replaying a
  lineage writes into `$dataWeapons`, and the loader steps back through generations when one fails,
  so a codec doing that during decode would leave a rejected generation's rows in the live datastore.
  Replay belongs in a hook that only runs after a load succeeds, which is exactly where these two
  already were. Same methods, different contents.
- `DataManager.makeSaveContents` adding `contents.time` in J-TIME — becomes a `SaveDocument`
  registration

Retire them **as their types gain codecs**, not in a big-bang pass, and keep the behavior identical
across the swap.

**The JAFTING refinement pair is resolved by Phase 4; the other four still run, and nothing is broken
by that.** Each one compensates for `JsonEx` restoring an object without running its constructor, and
the new pipeline simply does the same work twice — the omnipedia caches are still written to disk and
still rebuilt on load by their own hooks. Retiring them is a per-plugin change: declare the eager
cache as a transient with a rebuilding factory, then delete the pair of hooks. It belongs with the
namespace-registration sweep, since both are "walk the plugins once and opt each one in".

**Neither sweep was needed by Phase 6 and neither was done.** The router works with every namespace
inline, and the four surviving hooks duplicate work harmlessly. They stay listed.

### Conventions that bite in this work

Read `CLAUDE.md` in full; these are the ones this item trips over specifically.

- **No `typeof`.** The encoder is a type boundary and will want it. Use
  `Object.prototype.toString.call(value)`, exactly as `JsonEx._encode` already does. The only
  sanctioned `typeof` in the repo is `_base/_utilities/JsonMapper.js`, and it stays that way.
- **No `instanceof`.** Identify types by registry lookup keyed on `value.constructor`.
- **No `async` / `await`.** `StorageManager` returns Promises; construct them explicitly around
  synchronous `fs` calls.
- **No optional chaining.** Rewrite so it is not needed.
- **No `#private` fields in anything registered** — `Object.create(prototype)` never brands them, so
  the first `this.#anything` throws on a restored object.
- **Trust the contracts.** No `(someMethod() || [])`, no `filter(x => !!x)`. If a codec's JSDoc says
  it returns an array, it returns an array.
- Allman braces, 2-space indent, single quotes, 120-column lines, **no trailing newline**.
- Multiline JSDoc on every class, function, field, getter, and setter — `verify:docs` gates it.
- Inline comments on almost every line of substance, lowercase, ending in a period, on the line
  above.
- `//region <filename>` / `//endregion <filename>` wrapping each file.
- One class per file. New helpers and managers use modern `class`; engine augmentation uses prototype
  syntax and the `J.BASE.Aliased` map pattern.
- Alias maps are declared in `_metadata/initialization.js` and nowhere else.
- `bun run hotfix` is the build, and it runs the tests. Never `npm`, `node`, or a manual `cp`.

---

## Notes

- **Existing saves are explicitly disposable.** No reader for the old format, no converter, no
  migration from it. This was confirmed deliberately.
- Absorbs [`game-system-j-namespace-save-slice`](game-system-j-namespace-save-slice.md) — its Phase 0
  ("classify every field: persisted vs map-session transient vs frame transient") is exactly the
  transient declaration — and [`time-save-data-vs-runtime-manager`](time-save-data-vs-runtime-manager.md)
  ("persist a DTO, not the runtime manager"), which is a codec with an `encode` override. Close both
  when this lands.
- Overlaps [`convert-saved-prototype-models-to-modern-classes`](convert-saved-prototype-models-to-modern-classes.md);
  every model touched here should land as `class` + registry.
- Related: [`game-action-battler-uuid-refactor`](game-action-battler-uuid-refactor.md) — id-vs-uuid in
  saves is the same reference/value question this item answers for database rows.
- **PR strategy: one branch, one PR, no exceptions.** `feat/save-system-codec-rewrite` holds every
  phase and merges only once the whole thing is verified and functional. The battler-cache fix in
  Phase 0 step 1 repairs a defect present on `main` today and could technically ship alone; it does
  not, because a save format is not partially verifiable and a half-merged branch is harder to reason
  about than an unmerged one.
- **Ships touched, for the PR-time changelog pass.** `_base` carries the whole pipeline. Downstream
  plugins mostly need no source change, because the router reads `_j.*` generically — but these have
  hand-rolled save behavior that gets retired and will therefore have real diffs: `J-Omni` (quest and
  monster exts), `J-TIME`, `J-JAFTING` (core and refine ext). Reverse-analyze the final diff rather
  than trusting this list; a ship only gets a changelog section if its tree actually changed.
- One PR means one revert unit. That is acceptable here specifically because existing saves are
  already disposable — reverting costs nothing a player would notice.
- **Out of scope:** the save scene, slot UI, and autosave policy. Those become `J.BASE.EXT.SAVE`,
  depending on this, and retire CGMZ_SaveFile. This item is the format only.
- CGMZ_Core, EliMZ_Book, and SoR_MiniMapAndScene are all being removed from CA, so their three
  third-party `makeSaveContents` aliases stop constraining the design. Do not design around them.
- Version bumps and `_annotations.js` changelog entries are **PR-time work**. Do not touch `meta.js`
  or changelogs while building.
