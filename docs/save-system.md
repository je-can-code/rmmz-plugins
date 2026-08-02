# Coding with the save system

RPG Maker MZ's own savefile is a heap dump. `DataManager.extractSaveContents` assigns decoded blobs
straight onto `$gameParty`, `$gameMap` and friends, so every restored object must arrive already
carrying the right prototype — which is why `JsonEx` stamps a class name onto all ~1,700 nodes and
looks each one up in `window[]` on the way back. The file is compressed, unreadable, and full of data
the game already knows how to rebuild.

**J-Base-Save replaces that.** A slot is a directory of pretty-printed JSON, written through a
**codec** per type — a small declaration saying what that type persists, what it regenerates, and
what it holds instances of.

```
save/
  config.json               settings that outlive every save
  profile.json              anything that outlives one playthrough
  file1/
    current                 one line naming the live generation
    gen-0007/
      manifest.json         what the load menu reads
      world.json
      party.json
      actors.json
      systems/
    gen-0006/               retained for rollback
```

This document is about writing code that lives in that file. It assumes nothing about how the system
was built.

**J-Base owns the declarations; J-Base-Save owns what they mean.** `SerializableRegistry` lives in
J-Base because every plugin registers models against it. Everything that *reads* a declaration —
`SaveEncoder`, `SaveDecoder`, `SaveCodec`, the storage layer — lives in the extension. Remove the
extension and every registration becomes inert metadata while the engine's own save path resumes.

---

## Registering a model

At the bottom of the file, after the closing `}` and before `//endregion`:

```javascript
class SkillEquipSlot
{
  // …
}

export default SkillEquipSlot;
SerializableRegistry.register(SkillEquipSlot);
```

That bare form is a complete, valid registration. Every option below is optional, and the defaults
are chosen to **fail open**: a type registered with no options persists every own enumerable field,
holds no instances, and seeds from `initMembers` if it has one.

```javascript
SerializableRegistry.register(Game_Party, {
  id: 'game-party',
  aliases: [ 'Game_Party' ],
  transients: { '_j._base._cachedAllNotes': () => null },
  typed: { _lastItem: Game_Item },
});
```

| Option | Meaning |
|---|---|
| `id` | The stable name written into the file. Defaults to `constructor.name`. **Pass it explicitly on new models** — then renaming the class never touches a save. |
| `aliases` | Older ids that still resolve here. This is how a rename ships without a migration. |
| `transients` | Fields never written to disk, each mapped to a factory producing its cold value. |
| `typed` | Fields holding a class instance, mapped to that constructor. |
| `typedValues` | Fields holding a *dictionary* of instances, mapped to the value constructor. |
| `seed` | Establishes defaults on a bare instance before decoded fields land. |
| `encode` / `decode` | Replace the default walk entirely, for a type whose stored shape genuinely differs from its runtime shape. |

---

## Adding a field to a registered model

**The two ways of getting it wrong are not symmetric, and the asymmetry is deliberate.**

Add a field holding a **class instance** and forget to declare it in `typed`, and the encoder
**throws at save time**, naming the path, the type, and the fix:

```
[save-encode-undeclared-typed-field] at $.actors._data[1]._j._abs._equippedSkills._slots[0].cooldown:
'cooldown' holds a JABS_Cooldown, which the codec for 'JABS_SkillSlot' does not declare.
Add it: typed: { cooldown: JABS_Cooldown }.
```

Loud, immediate, and in front of the person who added the field.

Add a field that *should* have been **transient** and forget, and nothing happens. It gets written,
forever, to every savefile. That is wasteful and harmless — and it is the direction the design
chooses on purpose, because the opposite mistake loses a player's progress.

So: **a missed `typed` is caught for you. A missed `transient` is not.** When you add a field, the
question worth actually stopping to ask is "does this need to survive a load?"

---

## Deciding what is transient

A field is transient when the game can rebuild it. There are three flavours, and they need different
factories.

### Lazy caches — a cold value is the whole answer

Every reader is guarded and rebuilds on a miss, so the factory just returns the cold sentinel.

```javascript
transients: { '_j._base._cachedAllNotes': () => null }
```

**The cold value must be exactly what the guard tests for.** These guards read `!== null`, so a field
that comes back `undefined` sails straight through and the accessor returns `undefined` instead of
rebuilding. Omitting a transient from the file is not enough; it has to be *re-seeded*.

### Eager caches — the factory owes the rebuild

Nothing rebuilds these on a miss, because readers call `.get()` on them directly. An empty `Map`
would read as "no quests," not as "cold." The factory receives the decoded instance, so it can
rebuild from the fields that just landed.

```javascript
transients: {
  '_j._omni._questopediaCache': party => new Map(
    party.getSavedQuestopediaEntries()
      .map(entry => [ entry.key, entry ])),
}
```

### Session state — something else re-seeds it

State whose lifetime is shorter than a save. Every `_j.*` slice on a `Game_Event` is like this:
`Game_Map.setupEvents` reconstructs every event from scratch on a map transfer, so the state was only
surviving a load by accident. Its factory hands back whatever `seed` built.

---

## `seed`: why decode establishes defaults first

**Decoding never runs a constructor.** Instances are built with `Object.create(prototype)`, because a
constructor takes arguments a file does not have and does real work a load must not repeat —
`Game_Actor.prototype.initialize` calls `setup()`.

That means any field a class assigns at construction, but which is **not in the file**, would come
back missing. `seed` is what prevents it: it establishes every field's default on the bare instance
before anything from the file lands.

**Assignment order is `seed` → decoded fields → transients.** Decoded values win over seeded
defaults; transients win over both.

The payoff is worth stating plainly: **a field added to a model after a save was written comes back at
its seeded default rather than as `undefined`. Most new fields therefore need no migration at all.**

### What you get by default

| The class… | Its seed is… |
|---|---|
| has `initMembers()` taking no parameters | `initMembers()` — free, no declaration needed |
| has `initMembers(row)` taking parameters | a **no-op** |
| has no `initMembers` | a **no-op** |
| sets up in `initialize` instead | a no-op — **declare `seed` yourself** |

That second row is not an edge case. `RPG_Skill.prototype.initMembers(skill)` reads a database row it
is handed and throws on the first property access when called with nothing. An `initMembers` that
takes parameters is a *mapper*, not a *defaulter*, and running it as a seed is worse than not seeding
at all.

`Game_Party` is the fourth row: it assigns `_gold`, `_steps`, `_lastItem`, `_actors` and calls
`initAllItems()` directly in `initialize`, so its codec supplies a `seed` by hand.

### Two rules `seed` must obey

**It must be free of side effects.** It assigns defaults and nothing else — the same bar `is*` /
`can*` / `should*` methods are already held to.

**It must produce fresh, unshared objects.** The decoder merges decoded plain objects *into* the
seeded ones in place, so a seed handing out a shared constant would have that constant mutated on
every load, corrupting it for every other instance. Assign a fresh literal, never a module-level
default.

### One thing the merge cannot express

Merging is what makes `seed` mean anything below the top level of a class. Consider `_j`: the seed
runs the whole `initMembers` chain and builds every plugin's namespace, then the file arrives holding
a `_j` written before half those plugins existed. Plain assignment would replace the complete
namespace with the partial one — the exact failure `seed` exists to prevent, one level down.

The cost is that **a deletion cannot be represented.** Where a seed produces a *non-empty*
plain-object dictionary and the runtime can `delete` keys from it, a key removed before the save comes
back on load: the file says it is gone, the seed says it exists, and the merge sides with the seed.

Nothing hits this today, because the containers that support deletion all seed empty. If you add a
field that seeds non-empty *and* supports deletion, use an array, a `Map`, or an explicit tombstone.

---

## Reference versus value

**Store an id and resolve it on read. Never persist a database row by value.**

A row copied into a savefile is frozen at the moment it was written. Rebalance that row afterwards and
the change never reaches the save — the player keeps the old numbers forever, and nothing anywhere
reports a problem.

This has bitten twice:

- JAFTING refinement persisted the whole refined `RPG_EquipItem`. It now persists the **lineage** —
  the base, the material, and enough provenance to replay — and rebuilds the row from live `$data*`
  on load, so rebalancing a base weapon reaches every refined descendant.
- `_j._passive._passiveSources` still persists fourteen whole `RPG_Skill` rows. It is the same defect
  and it is still open.

The engine already models the right pattern: `Game_Item` stores `_itemId` plus `_dataClass` and looks
the row up. Follow that.

If the thing you want is genuinely derived — computed by a deterministic function from inputs you
have — persist the **inputs**, not the result. That is the same decision as a transient, one level up.

---

## Ownership: who declares what

A codec for a shared host is authored by more than one plugin. J-Base registers `Game_Party`, but the
caches at `$gameParty._j._omni` belong to J-Omni — and J-Base must never know they exist, because a
core plugin does not reach into an optional extension.

The owner **registers**. Everyone else **extends**:

```javascript
// in J-Omni, about a host J-Base registered
SerializableRegistry.extend(Game_Party, {
  transients: { '_j._omni._questopediaCache': party => rebuildFrom(party) },
});
```

Merging is per-declaration and last-wins on a collision. Two plugins declaring different paths — the
normal case — simply add up. The `id`, `aliases`, and `seed` of the original registration are left
alone, because identity belongs to whoever registered the type.

**Extending something nothing has registered throws**, naming the load-order problem, rather than
quietly inventing a codec.

**Declarations do not inherit.** Codec lookup is by exact constructor, so a declaration on
`Game_CharacterBase` does not cover `Game_Player`, `Game_Follower`, and `Game_Vehicle`. Each one is
declared individually.

---

## Dotted paths

`transients`, `typed`, and `typedValues` all accept dotted keys, because the fields worth declaring
usually sit inside a plugin namespace rather than directly on the class:

```javascript
transients: {
  '_j._base._cachedAllNotes': () => null,
  '_j._regions._skills._timer': () => new JABS_Timer(0),
}
```

The walkers keep their position in that path tree in step with their position in the data, so a
transient three plain objects deep is skipped exactly where it lives.

---

## The standing prohibitions

**No `#private` fields or methods in a registered class** — enforced by
`verify:no-private-in-serializable`. Decoding builds instances with `Object.create(prototype)`, so a
restored object carries the prototype without the constructor ever having branded it, and the first
`this.#anything` it touches throws. Use underscore-prefixed fields with accessors.

**No reading `$dataMap` during decode.** `DataManager.loadGame` decodes before `Scene_Map.create`
calls `DataManager.loadMapData`, so map data for the saved map is not loaded yet. Anything needing it
belongs in a post-load hook.

**No side effects in `seed`**, and no shared objects out of it. See above.

**Never persist a database row by value.** See above.

---

## Migrations

`manifest.json` carries a `schemaVersion`, and `SaveMigrationRegistry` holds pure functions from one
version's document to the next. The loader chains them.

**Most changes need no migration**, because `seed` covers them: a field you add comes back at its
default in older saves. Reach for a migration when the *shape* changes in a way a default cannot
express — a field renamed, a value's units changed, two fields collapsed into one.

Every migration ships with a **committed fixture** of the older document shape. That fixture is the
only proof a migration written a year from now still runs.

---

## Testing a new codec

Three things are worth asserting, and the sweeps already cover the last two for every registered type
automatically — so a new model gets them the day it registers, without anyone adding a case.

**Round-trip it.** Encode, decode, and compare — including that the result carries its own prototype
rather than arriving as a plain object.

**No field decodes as `undefined`.** `save-codec-registry-sweep.test.js` seeds every registered type
and decodes an empty payload for it, then fails on any field holding `undefined`. This is the sweep
that catches a missed re-seed across every holder at once, rather than one crash at a time in
testplay.

**Seeds are fresh.** The same sweep seeds each type twice and fails if the two instances share an
object, which is the shared-default hazard the merge introduces.

One caveat about those sweeps, learned the hard way: they walk the **live registry**, so they only
cover what the test file has imported. A sweep that imports only J-Base covers only J-Base's codecs
while still reporting a healthy run.

And the rule that produced most of the save system's real bugs: **build a fixture from what the
caller actually passes, never from what the function under test expects.** A mock shaped like the
implementation ratifies the bug instead of catching it, and does so at full coverage.

---

## Where things live

| Path | Holds |
|---|---|
| `_base/core/core/SerializableRegistry.js` | registration, declarations, `resolve()` for `JsonEx` |
| `_base/ext/save/core/SaveCodec.js` | one type's normalized declarations |
| `_base/ext/save/core/SaveCodecIndex.js` | codec lookup, built lazily from the registry |
| `_base/ext/save/core/SaveEncoder.js` | the encode walk and the completeness assertion |
| `_base/ext/save/core/SaveDecoder.js` | the decode walk, `seed`, and the merge |
| `_base/ext/save/core/SaveDocument.js` | which sections exist and what goes in each |
| `_base/ext/save/core/SaveSectionRouter.js` | lifting `_j.<plugin>` slices into `systems/*.json` |
| `_base/ext/save/managers/SaveFileSystem.js` | generations, the atomic pointer, retention |
| `_base/ext/save/managers/StorageManager.js` | the engine's save/load entry points |
