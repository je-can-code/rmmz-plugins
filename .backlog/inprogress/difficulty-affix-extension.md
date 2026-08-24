# Difficulty-driven affix rates (`J-Difficulty-Affix`)

## Severity

Low — nothing is broken. This is new capability.

## Gain

High. It gives the difficulty layer system a **second reason to engage with it**. Today a layer trades
"harder enemies" for "better rewards," and that is a single axis the player either wants or does not.
With this, raising a layer also changes *what the world spawns*: affixes get more frequent, the rare
end of the affix ladder becomes reachable, and layers can hand out affixes that do not exist at base
difficulty at all.

---

## Context

### What exists today

`J-Passive-Affix` (`src/plugins/passive/ext/affix/`) rolls a prefix and a suffix onto every JABS map
enemy at spawn, in `JABS_AiManager.postConvertMutate`. Two independent gates, then two weighted draws:

```javascript
// src/plugins/passive/ext/affix/managers/JABS_AiManager.js:80-118
const prefixChance = character.getResolvedPassiveAffixPrefixChance(enemyData);
const canApplyPrefix = JABS_AiManager.shouldBlockPassivePrefixRng(character, enemyData) === false &&
  RPGManager.chanceIn100(prefixChance);

if (canApplyPrefix)
{
  const prefixStateId = RPGManager.weightedMapChoice(
    J.PASSIVE.EXT.AFFIX.Metadata.prefixMap,
    J.PASSIVE.EXT.AFFIX.Metadata.totalPrefixWeight
  );
  // …
}
```

The pools are built once at boot from `$dataStates`
(`JPassiveAffix_PluginMetadata#initializeStateAffixWeights`, called from the extension's
`Scene_Boot.onDatabaseLoaded` alias) and are never consulted again except to read from.

`J-Difficulty` (`src/plugins/diff/core/`) holds N layers, any subset of which can be enabled at once.
`Game_Temp.prototype.buildAppliedDifficulty` folds every enabled layer into one synthetic
`DifficultyLayer` by multiplying each layer's percentages together. Nothing in it touches affixes.

### CA's live numbers, for grounding

`config.difficulty.json` holds 17 layers: a default, five `easy` steps, five `hard` steps, and six
**drives** — Crimson, Saffron, Lemon, Viridian, Aqua, Royal — which are the reality-bending tier and
the natural home for granted affixes.

`States.json` holds 65 affix states, 15 prefixes and 50 suffixes:

| prefix | weight | share of pool |
|---|---|---|
| 301 Origin | 500 | 18.6% |
| 302 Vintage | 100 | 3.7% |
| 303 Prime | 50 | 1.9% |
| 304 Grand | 25 | 0.9% |
| 305 Elysian | 10 | **0.4%** |
| 311–320 (ten negatives) | 200 each | 7.4% each |

Prefix pool total **2685**, suffix pool total **8350**. `default-prefix-chance` and
`default-suffix-chance` are both **8** in `plugins.js`.

So at base difficulty Elysian lands on `8% × 0.372% =` **0.03%** of enemies — one in 3,356. The rare end
of the ladder is authored but effectively unreachable, which is the concrete problem `flatten` solves.

---

## Design

### Shape

A new ship, `J-Difficulty-Affix`, at `src/plugins/diff/ext/affix/`, namespace
`J.DIFFICULTY.EXT.AFFIX`. It is the first extension of `J-Difficulty`, so `diff/ext/` does not exist
yet and `J.DIFFICULTY.EXT` is not declared anywhere — the ext shell-declares it.

It reads an **optional** per-layer block from `config.difficulty.json`:

```json
"affixEffects": {
  "prefixChance": 150,
  "suffixChance": 150,
  "flatten": 40,
  "grants": { "306": 50, "307": 25 }
}
```

Every field is optional and every omission is identity. A layer with no `affixEffects` block at all
contributes nothing, which is what keeps the seventeen existing layers working untouched.

The mechanism is **generic**; only the tuning is CA-specific. This does not belong in a CA-only plugin.

### How the config reaches the extension

There is a load-order problem to route around, and the way around it is smaller than it first looks.

`J_DiffPluginMetadata.classifyDifficulties` destructures the JSON blob field by field
(`_pluginMetadata.js:55-67`) and rebuilds each layer through `DifficultyBuilder`, which also
enumerates fields by name. `DifficultyLayer.fromMetadata`, `DifficultyLayer.fromLayer` and
`Game_Temp.buildAppliedDifficulty` each do the same again. An unknown `affixEffects` key is dropped
at the first of those five gates and never reaches anything downstream.

Worse, that parse happens inside `new J_DiffPluginMetadata(...)` — `PluginMetadata`'s constructor runs
`initializePlugin → postInitialize` (`_base/core/models/PluginMetadata.js:58` → `:129`), and
`postInitialize` calls `initializeDifficulties` synchronously. That is **script-evaluation time for
the diff-core ship**. The extension's script has not been evaluated yet, so there is no alias on any
of those five methods that could have been installed in time, and `ExternalJsonConfigLoader.load` is
fully synchronous (`_base/core/managers/ExternalJsonConfigLoader.js:26-84`) so there is no async
window either.

**The answer is not for the extension to read the file a second time.** The file is read once, by the
ship that owns it, and the raw parsed blob is retained. Two moves:

**Core keeps what it parsed.** `J_DiffPluginMetadata` gains one field — a `Map<string, object>` of
layer key to the raw JSON blob for that layer, captured alongside `allMetadatas` in
`initializeDifficulties`. That is the whole core change. It asserts nothing about affixes and does not
know this extension exists; it just stops throwing away the source of the objects it built. Any future
extension of `J-Difficulty` needing a field the mapper does not carry uses the same door.

**The extension decorates the already-built metadata objects in place.** At its own script-eval time
`J.DIFFICULTY.Metadata.allMetadatas` is fully populated, so the extension walks it, pulls each layer's
raw blob, and assigns an `AffixEffects` onto the matching `DifficultyMetadata`.

This is what makes the five field-enumerating methods irrelevant rather than obstacles. The extension
is not trying to push a field *through* the mapping pipeline — it decorates the objects the pipeline
already finished producing, after it has finished producing them. Nothing needs aliasing, because
nothing is in the way anymore.

**And the field never needs to reach a `DifficultyLayer` at all.** The question the extension asks at
runtime is "for the layers currently enabled, what are their affix effects?", and enabled-ness comes
from `$gameSystem.getAllDifficultyConfigs().filter(config => config.enabled)` — which yields **keys**.
Key → `allMetadatas` → `AffixEffects`. `DifficultyLayer.fromMetadata` and `fromLayer` dropping the
field costs nothing, because the lookup never goes through a layer.

Storage on `DifficultyMetadata` follows the repo's accessor rule rather than being sprayed on as a
bare property: the extension augments the prototype with `getAffixEffects()` / `setAffixEffects(value)`
over an `_affixEffects` field, seeded on the prototype to `null` so an undecorated layer answers with
the cold value instead of `undefined`. `DifficultyMetadata` is a top-level binding in the built ship
(`project/js/plugins/diff/J-Difficulty.js:170`, `var DifficultyMetadata = class {`), so the extension
reaches it as a bare global.

> **This prototype-field seed is a new pattern in this tree.** Every existing `X.prototype._y =`
> assignment under `src/plugins/**` is a method, never a field default. It clears
> `verify:no-direct-property-getset` — that gate's `chainOf()` only resolves chains rooted at
> `this`, so a prototype-object assignment is invisible to it — but it should get a deliberate look
> at review rather than being assumed conventional.

### The three effects

**1. Chance — multiplicative, matching `buildAppliedDifficulty`.**

`prefixChance: 150` means "×1.5 the chance this spawn would otherwise have had." Combining is a
product across enabled layers, and the result is clamped to 0–100. Two layers at 150 give ×2.25.

This multiplies the *resolved* chance, so it composes correctly with the existing precedence chain
(event comment beats enemy note beats plugin default). A boss pinned to `<passive-affix-prefix-chance:0>`
stays at 0 because `0 × anything` is 0, which is the correct and predictable behavior.

Note that the base resolver clamps only its two override branches; the plugin-default fall-through
returns `Metadata.defaultPrefixChance` **unclamped** (`objects/Game_Event.js:139,169`). The extension
therefore clamps its own result rather than assuming the incoming value was already in range.

`prefixChance: 0` is legal and means "this layer zeroes affixes entirely while it is enabled." That
is a usable effect, but with `100` as the identity default it is an easy authoring slip — document it
in `@help`.

**2. Flatten — interpolate each weight toward the pool mean.**

```
mean = totalWeight / count(entries with base weight > 0)
newWeight = w + (mean - w) × f          where f = flatten / 100
```

At `f = 0` nothing changes; at `f = 1` every entry is equally likely. The sum is preserved:
`Σ(w + (m − w)f) = Σw + f(n·m − Σw) = Σw`, given the mean is taken over exactly the set being
flattened — which the "base weight > 0" domain restriction satisfies. Sum preservation holds here
only because zero-weight entries contribute `0` to `totalPrefixWeight`, so "total over all entries"
and "total over positive entries" are the same number. That coincidence would break the moment a
negative weight became authorable, which is why negative weights throw at boot.

Worked against CA's real prefix pool (mean = 2685 / 15 = 179 exactly) at `flatten: 40`:

| affix | weight before | weight after | share before | share after |
|---|---|---|---|---|
| Origin | 500 | 371.6 | 18.6% | 13.8% |
| Elysian | 10 | 77.6 | **0.4%** | **2.9%** |
| a negative | 200 | 191.6 | 7.4% | 7.1% |

Elysian becomes nearly eight times more likely while Origin loses about a quarter of its share. That
is the whole point: the rare tiers stop being decorative.

**Those are the real values, not rounded ones. Keep weights as floats.** `weightedMapChoice` handles
fractional weights fine, and rounding is what introduces drift between the map and its stored total.

**Combining flatten across layers is a complement-product, not a sum.** Applying `f₁` then `f₂`
rewrites each weight as `w → m − (m − w)(1 − f)`, so distance from the mean composes as `Π(1 − fᵢ)`:

```
effectiveFlatten = 1 − Π(1 − fᵢ)
```

Two layers at 40 give `1 − 0.6 × 0.6 = 0.64`, not 0.8. This form is order-independent, never exceeds
1, and degrades correctly to `f` for a single layer. **Order-independence holds *because* flatten
preserves the sum** — the mean is invariant across applications, so each layer interpolates toward the
same target. That is the reason, not a coincidence.

Compute the effective value first, then apply the interpolation **once**. Do not apply each layer's
flatten in sequence, or the result depends on map iteration order.

**When the positive-base domain is empty, skip flatten entirely.** A slot whose states are all
authored at weight zero — a supported authoring mode, since grants are the intended way to reach
them — gives `count = 0` and `mean = 0/0 = NaN`. Every weight becomes `NaN`, and `weightedMapChoice`
does not catch it: `NaN <= 0` is `false` so the skip guard never fires, `Math.random() * NaN` is
`NaN`, and `r < 0` never holds, so it returns `null` forever. The affix system dies **silently**.
Guard on the count, not on the mean.

**3. Grants — unlock an otherwise-unavailable affix, and price it.**

An exotic affix is authored as an ordinary affix state with an explicit weight of **zero**:

```
<enemy-prefix>
<affix-weight:0>
<affix-tier:6>
<tier-color-hex:#B026FF>
```

Zero tickets means it can never be drawn — `RPGManager.weightedMapChoice` already skips any entry
with `val <= 0` (`RPGManager.js:339`), so this needs no new "is it unlocked" check anywhere. It stays
registered in `prefixMap`, so `isAffixStateId` still recognizes it and an event that pins it via
`<passive:[...]>` still works. It simply has no presence in the random pool.

A layer's `grants` block then supplies the weight:

```json
"grants": { "306": 50 }
```

One declaration both unlocks the affix and sets how rare it is **at that layer** — a later drive can
price the same affix differently from an earlier one.

**Grant keys arrive from JSON as strings and must be coerced to numbers.** `Object.keys` on that
block yields `"306"`, while `prefixMap` is keyed by the numeric `state.id`
(`passive/ext/affix/_metadata/_pluginMetadata.js:84`). Overlaying an unconverted key writes a
**second, string-keyed entry beside the numeric one**, and `weightedMapChoice` then returns the string
`"306"` as the chosen state id. That value survives downstream because array indexing canonicalizes
it, which is worse than failing outright — the pool is silently double-counted and nothing reports it.
`AffixEffects.fromRaw` parses every grant key with `parseInt`.

**Grants are applied after flattening and are never themselves flattened.** This is the load-bearing
rule of the whole design. If a granted weight participated in flatten, then `flatten: 100` would
raise every zero-weight exotic to the pool mean and unlock the entire reality-breaking set without any
layer having granted it. Flatten's domain is therefore restricted to entries whose **base** weight is
greater than zero, and the mean is computed over that same set. Granted weights are assigned into the
flattened map afterward, replacing whatever was there.

`flatten: 100` combined with grants is safe: the domain restriction keeps granted zeros out of the
interpolation, and `w(1 − f) + m·f` with `f ≤ 1` and `w, m ≥ 0` can never go negative.

**Duplicate grants for the same state across two enabled layers resolve by max, not sum.** A grant is
a statement about how rare a thing should be, and two layers each saying "50" should not silently mean
100. This is settled, not open — but it is one line in `combinedPrefixGrants()` if it ever needs to
change.

### Slot routing and validation

A grant names a state id and a weight. Which slot it lands in comes from the state's own
`<enemy-prefix>` / `<enemy-suffix>` tag, so there is no second place to keep that fact in sync.

**A state may carry both tags**, and that is legal today: `initializeStateAffixWeights` uses two
independent `if`s (`passive/ext/affix/_metadata/_pluginMetadata.js:80-93`), so such a state lands in
both maps and both totals. CA has none today, but nothing prevents one. A grant naming a dual-tagged
state lands in **both** slots, at the same weight.

Validate at boot and **throw**, naming the offending layer key and state id, matching the discipline
established by `J.DROPS.Metadata.buildDropLadders`:

- a granted state id that does not exist in `$dataStates`
- a granted state carrying neither `<enemy-prefix>` nor `<enemy-suffix>`
- a granted state whose **base weight is not zero**. Grants exist to unlock states that are otherwise
  unreachable. Granting `50` to Origin — base 500, flattened to ~372 — would *lower* it, which is the
  opposite of what the word means, and no author intends it.
- a granted weight below zero
- a `flatten` outside 0–100
- a `prefixChance` or `suffixChance` below zero

A silent misconfiguration here surfaces as "the exotic affix never appears," which is indistinguishable
from bad luck and costs an evening to diagnose. A throw at boot costs ten seconds.

### What is computed when

Three different things get built, at three different times, for three different reasons. Conflating
them is the easiest way to get this wrong.

**Tier 1 — per-layer affix modifiers. Built once, at script-eval. Never rebuilt.**

Turning a layer's raw `affixEffects` block into an `AffixEffects` and hanging it off that layer's
`DifficultyMetadata` is **static data being reshaped**. `config.difficulty.json` does not change while
the game is running, so neither does the answer. This happens exactly once, inside the extension's
`postInitialize` — before the title screen — and nothing ever recomputes it.

It lives on `J.DIFFICULTY.Metadata.allMetadatas`, which is plugin metadata rather than game state. It
survives for the whole session, is untouched by new-game, save, and load alike, and does not care
which layers are enabled — a locked, hidden, disabled layer carries its `AffixEffects` exactly like an
active one does.

**It is deliberately not written to the savefile, and must not be.** Config baked into a save is
frozen at write time — the same defect `Game_Item` exists to avoid, and the reason this repo's rule is
"store an id, not a database row." Because it is re-derived from the JSON on every boot instead,
retuning a drive's affix rates reaches **existing saves** the next time they are loaded. Persisting it
would mean a player's save kept whatever numbers shipped on the day they started.

**Tier 1b — the slot split. Once, at `onDatabaseLoaded`.**

Deciding whether a grant is a prefix or a suffix needs the hydrated `$dataStates` row, which does not
exist at script-eval. So `AffixEffects.fromRaw` cannot fill `prefixGrants` / `suffixGrants` — it fills
a third field, `_rawGrants`, and those two stay empty until `assertGrantsAreValid()` drains them
during the `Scene_Boot.onDatabaseLoaded` pass. That pass validates and splits in one walk, and it is
still static: it runs once and its answer never changes.

**Tier 2 — the combined effective pools. Rebuilt on change, which is rare.**

*Which* layers are enabled genuinely is runtime state — the player toggles it in `Scene_Difficulty`.
So the folded result (chance factors, effective flatten, unioned grants, and the two resulting weight
maps) has to be recomputed when that set changes. Not per spawn, though: spawns are hot and toggles
are rare, so this is cached on the extension's metadata instance and invalidated on change.

**`Game_Temp.prototype.refreshAppliedDifficulty` is the single correct seam** for that invalidation.
It is reached by all three paths that can change which layers are enabled, and a repo-wide search
confirms there is no fourth: `DifficultyLayer.enable()` / `disable()` are the only writers of
`config.enabled`, their only callers are `DifficultyManager.enableDifficulty` / `disableDifficulty`,
and both always refresh. Plugin commands and `Scene_Difficulty` route through the manager;
`Window_DifficultyList` never mutates.

- `DataManager.setupNewGame` → `setupDifficultySystem` → `refreshAppliedDifficulty`
- `Game_System.onAfterLoad` → `setupDifficultySystem` → `refreshAppliedDifficulty` (save load)
- `DifficultyManager.enableDifficulty` / `disableDifficulty` → `refreshAppliedDifficulty`

Boot ordering is safe: the affix extension's `Scene_Boot.onDatabaseLoaded` builds the base pools
before any of the three ever run, and tiers 1 and 1b are complete before that.

**Two rules the rebuild must obey**, because both failure modes are silent:

1. **Build a fresh `Map` every time.** `effectivePrefixPool()` hands back `this.prefixMap` *by
   reference*. Flattening it in place would permanently corrupt J-Passive-Affix's base pool and
   compound on every subsequent refresh. Clone the entries, then flatten the clone.
2. **Read the base pool directly, never through the seam.** This ship has already aliased
   `effectivePrefixPool`, so calling it from inside `buildEffectivePools()` recurses. Read
   `prefixMap` / `totalPrefixWeight` off the affix metadata instance, or go through
   `Aliased.JPassiveAffix_PluginMetadata.get('effectivePrefixPool').call(...)`.

**Recompute `totalWeight` by summing the final map.** Never carry `totalPrefixWeight` forward and
never adjust it incrementally — grants change the sum, and any drift means
`Math.random() * totalWeight` overshoots the entries, which `weightedMapChoice` answers with `null`.
That reads as "no affix rolled," at exactly the drift rate, with nothing reporting it.

**A cold cache returns the original.** Before the first `refreshAppliedDifficulty` ever runs, the
aliased seam must hand back the untouched base pool rather than an empty one.

Tier 2 reads tier 1 and never writes to it.

### One divergence to decide deliberately

CA's `000_default` layer is `enabled: true` out of the box, so an `affixEffects` block on it would
apply unconditionally — a usable feature worth knowing about.

But it is also **player-toggleable**: `availableDifficulties()` filters only on hidden/unlocked, so
`Scene_Difficulty` will happily disable the default. When zero layers are enabled,
`buildAppliedDifficulty` falls back to `defaultLayer()` and the default's *stat* effects still apply
(`objects/Game_Temp.js:150-154`) — whereas `enabledAffixEffects()` as specified would return empty and
drop the default's *affix* effects.

**Mirror the fallback**: when no layers are enabled, read the default layer's `AffixEffects`. That
keeps this extension consistent with the system it is extending, and consistency is worth more here
than the marginal simplicity of not special-casing it.

---

## Work

Version bumps and changelog blocks are **PR-time work** per the repo rule — do not edit `meta.js` or
`_annotations.js` `CHANGELOG:` blocks while building. The bumps noted per part below are expected
outcomes to sanity-check the reverse-analysis against, not instructions to make now.

### Part 1 — `diff/core` (expect **minor**)

**One field, one method.** `initializeDifficulties` currently hands the loader a mapper and keeps only
what comes back. Split it so the raw blob survives the trip:

```javascript
// src/plugins/diff/core/_metadata/_pluginMetadata.js — initializeDifficulties

// load the raw blob without a mapper, so the source of the built metadatas is still available after.
const parsedBlob = ExternalJsonConfigLoader.load(J_DiffPluginMetadata.CONFIG_PATH, options);

/**
 * The raw JSON blob for each layer, keyed by that layer's key.
 * Retained because {@link J_DiffPluginMetadata.classifyDifficulties} reads a fixed set of fields
 * by name, so anything an extension adds to the config is not represented in the built metadata.
 * Keeping the source is what lets an extension find its own fields without reading the file twice.
 * @type {Map<string, object>}
 */
this.allRawConfigs = new Map(parsedBlob.map(blob => [ blob.key, blob ]));

/**
 * A map of difficulty layer metadatas by their key.
 * @type {Map<string, DifficultyMetadata>}
 */
this.allMetadatas = J_DiffPluginMetadata.classifyDifficulties(parsedBlob);
```

The options builder loses its `.mapper(...)` line, and `.logSummary(...)` now receives the raw array,
so its body becomes `result => [ \`- ${result.length} difficulty layers\` ]`. Dropping the mapper is
safe — `ExternalJsonConfigLoader.js:72-74` falls through to `parsed`, `classifyDifficulties` is a
plain static taking the array, and `initializeMetadata` only reads `this.allMetadatas`.

This change knows nothing about affixes. It is the generic door for any future extension of
`J-Difficulty` that needs a config field the classifier does not carry — which is why it reads as a
minor rather than a patch: it is additive public API another ship depends on.

**Tests:** `test/plugins/diff/_component/metadata.test.js` asserts on `allMetadatas` and not on the
log summary, so nothing existing breaks. Add coverage for `allRawConfigs` — that it is keyed by layer
key, and that a key carrying a field the classifier ignores still round-trips through it. That last
assertion is the whole point of the field and nothing else tests it.

### Part 2 — `passive/ext/affix` (expect **minor**)

Two changes, both small, both prerequisites.

**2a. Widen the weight regex so zero is authorable.**

`src/plugins/passive/ext/affix/_metadata/initialization.js:39`

```javascript
// before — [1-9] makes <affix-weight:0> unmatchable, so it silently falls through to the default of 100.
J.PASSIVE.EXT.AFFIX.RegExp.Weight = /<affix-weight:([1-9]\d*)>/i;

// after
J.PASSIVE.EXT.AFFIX.RegExp.Weight = /<affix-weight:(\d+)>/i;
```

Nothing downstream needs to change to accommodate it, which was verified rather than assumed:

- `RPG_State#affixWeight` reads `getNumberFromNoteByRegex(…, true) ?? 100`. `RPGManager.js:592-632`
  returns the parsed `0` rather than `null` for a matched `"0"`, and `0 ?? 100` is `0`, since `??`
  only falls through on null and undefined.
- `initializeStateAffixWeights` adds `0` to the running total (no-op) and sets the entry in the map,
  so the state stays a known affix.
- `RPGManager.weightedMapChoice` already has `if (val <= 0) continue;` (`RPGManager.js:339`).
- `isAffixStateId` keeps returning true (`_pluginMetadata.js:104`), preserving explicit-affix
  precedence for pinned spawns.

Update the `<affix-weight>` tag documentation in `_annotations.js` to state that `0` means "in the
pool, never drawn — reserved for something else to grant it."

**2b. Extract the pool seams — both slots, symmetrically.**

Add **two methods** to `JPassiveAffix_PluginMetadata` (`_metadata/_pluginMetadata.js`). Neither slot is
privileged: suffixes take flatten and grants exactly as prefixes do, and CA's suffix pool is over
three times the size of its prefix pool. Anything done to one is done to the other, everywhere in this
plan.

```javascript
/**
 * The prefix pool as it should be rolled against for the spawn happening right now.
 * Base behavior hands back the boot-time pool unchanged; this exists as the single seam
 * an extension can alias to bias the pool without re-implementing the whole spawn body.
 * @returns {{map: Map<number, number>, totalWeight: number}}
 */
effectivePrefixPool()
{
  return {
    map: this.prefixMap,
    totalWeight: this.totalPrefixWeight,
  };
}

/**
 * The suffix pool as it should be rolled against for the spawn happening right now.
 * The suffix twin of {@link #effectivePrefixPool}, and biased by the same extensions - a
 * difficulty layer that grants a new suffix has nowhere else to inject it.
 * @returns {{map: Map<number, number>, totalWeight: number}}
 */
effectiveSuffixPool()
{
  return {
    map: this.suffixMap,
    totalWeight: this.totalSuffixWeight,
  };
}
```

**These must be prototype methods, never class fields.** `effectivePrefixPool = () => {…}` would
install an own property on the instance, and the extension's prototype alias would then never be
reached — the whole design would silently do nothing. The repo has arrow-field precedent an
implementer could imitate (`DifficultyManager.js:62`), so this is worth stating rather than assuming.

Then rewrite both draws in `JABS_AiManager.postConvertMutate` to consume them:

```javascript
// the pool is resolved per spawn rather than read from metadata directly, so an extension can bias it.
const {
  map: prefixPool,
  totalWeight: prefixPoolWeight
} = J.PASSIVE.EXT.AFFIX.Metadata.effectivePrefixPool();

const prefixStateId = RPGManager.weightedMapChoice(prefixPool, prefixPoolWeight);
```

…and the identical shape against `effectiveSuffixPool()` in the suffix branch. Destructuring first is
a readability choice here, not a gate requirement — `verify:no-chained-call-arguments` allows one
chain step and would accept the inline form.

### Part 3 — `diff/ext/affix` (new ship)

Twelve new files. `build-all.js` discovers ships by globbing `src/plugins/**/vite.config.*.js`, so the
vite config is what registers it and nothing else needs editing in the build tooling.

```
src/plugins/diff/ext/affix/
  entry.js
  vite.config.diff-affix.js
  __models/
    AffixEffects.js
    DifficultyMetadata.js
  _metadata/
    meta.js
    _annotations.js
    initialization.js
    _pluginMetadata.js
    JPassiveAffix_PluginMetadata.js
  objects/
    Game_Event.js
    Game_Temp.js
  scenes/
    Scene_Boot.js
```

**`_metadata/meta.js`** — mirrors the sibling naming:

```javascript
export const PLUGIN_NAME = 'J-Difficulty-Affix';
export const PLUGIN_VERSION = '1.0.0';
export const PLUGIN_DESC_TAG = 'DIFFICULTY-AFFIX';
```

`PLUGIN_NAME` must match the built file's basename, which `verify:declared-dependencies` checks.

**`_metadata/_annotations.js`** — declares both parents:

```
 * @base J-Difficulty
 * @base J-Passive-Affix
 * @orderAfter J-Base
 * @orderAfter J-Difficulty
 * @orderAfter J-Passive-Affix
```

Both are genuine hard requirements — this ship does nothing without either. Note that
`verify:declared-dependencies` would not *force* all of these: it scans for `J.<namespace>` tokens,
exempts `J-Base` outright via `ALWAYS_AVAILABLE_PLUGINS`, and this ship reaches `J-Passive-Affix`
through the bare global `JPassiveAffix_PluginMetadata` rather than through `J.PASSIVE.EXT.AFFIX.*`.
Declare them because they are true, not because the gate demands it.

> The gate itself (`src/build-tools/verify-declared-dependencies.js`) is **untracked in the working
> tree** as of writing, wired into `verify-pre-compile` in `package.json`. If it lands separately,
> this requirement is not yet enforced on `main`.

The `@help` block documents the `affixEffects` config shape, the weight-zero authoring recipe for a
granted affix, the `prefixChance: 0` semantics, and the three combination rules.

**`__models/AffixEffects.js`** — a plain model holding one layer's block, with typed sentinel defaults
so an absent field is identity. Not serialized (difficulty layers live on `Game_Temp`, which is not
saved; `Game_System` persists only `DifficultyConfig`s and the layer-point counters), so no
`SerializableRegistry` registration is needed.

Fields: `prefixChance = 100`, `suffixChance = 100`, `flatten = 0`, `_rawGrants = new Map()`,
`prefixGrants = new Map()`, `suffixGrants = new Map()`.

`static fromRaw(blob)` does the JSON mapping, coerces every grant key with `parseInt`, performs the
numeric-range validation throws, and fills `_rawGrants` only. The two slot maps stay empty until
`assertGrantsAreValid()` drains `_rawGrants` into them at `onDatabaseLoaded` — that is the earliest
moment a hydrated `$dataStates` row can answer which slot a state belongs to.

**`__models/DifficultyMetadata.js`** — augments the diff-core model with the accessor pair that holds
this extension's data:

```javascript
/**
 * The affix biasing this layer applies while it is enabled, or null when it declares none.
 * Seeded on the prototype so an undecorated layer answers with the cold value rather than
 * undefined - most layers never carry a block, and every reader tests this against null.
 * @type {AffixEffects|null}
 */
DifficultyMetadata.prototype._affixEffects = null;
```

…plus `getAffixEffects()` and `setAffixEffects(affixEffects)`. Nothing outside those two touches
`_affixEffects`, per `verify:no-direct-property-getset`.

**`_metadata/initialization.js`** — bootstrap only, per the namespace rule:

```javascript
globalThis.J ||= {};

// first extension of J-Difficulty, so the EXT shell does not exist yet.
J.DIFFICULTY.EXT ||= {};
J.DIFFICULTY.EXT.AFFIX = {};
J.DIFFICULTY.EXT.AFFIX.Metadata = new JDifficultyAffix_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

J.DIFFICULTY.EXT.AFFIX.Aliased = {};
J.DIFFICULTY.EXT.AFFIX.Aliased.Game_Event = new Map();
J.DIFFICULTY.EXT.AFFIX.Aliased.Game_Temp = new Map();
J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata = new Map();
J.DIFFICULTY.EXT.AFFIX.Aliased.Scene_Boot = new Map();
```

**`_metadata/_pluginMetadata.js`** — `JDifficultyAffix_PluginMetadata extends PluginMetadata`.

It does **not** read any file. Its config arrives already parsed, from the map diff-core retained.

- `postInitialize()` → `decorateDifficultyMetadatas()`, which walks
  `J.DIFFICULTY.Metadata.allRawConfigs`, builds an `AffixEffects` for every layer carrying an
  `affixEffects` block, and calls `setAffixEffects` on the matching entry in
  `J.DIFFICULTY.Metadata.allMetadatas`. Layers with no block are skipped and keep the prototype's
  `null`.
- Holds the cached effective pools and the methods that build them:
  - `enabledAffixEffects()` — maps enabled `DifficultyConfig` keys through `allMetadatas` to their
    `AffixEffects`, dropping the nulls; falls back to the default layer's when none are enabled.
  - `combinedPrefixChanceFactor()` / `combinedSuffixChanceFactor()` — product of `chance / 100`.
  - `combinedFlatten()` — `1 − Π(1 − fᵢ)`.
  - `combinedPrefixGrants()` / `combinedSuffixGrants()` — union by max.
  - `buildEffectivePools()` — for each slot: clone the base entries into a fresh `Map`, flatten the
    clone, overlay that slot's grants, then sum the result for the total.
  - `assertGrantsAreValid()` — the boot-time throws listed above, and the pass that drains
    `_rawGrants` into the two slot maps.

  **No `#private` fields on this class** — it extends `PluginMetadata`, whose constructor calls the
  overridable `postInitialize` hook, so a private declared here would not exist yet when that hook
  runs. `verify:no-private-before-construction` enforces it (its `HOOK_CALLING_BASES` names
  `PluginMetadata` explicitly). Use `_underscore` fields with accessors.

**`_metadata/JPassiveAffix_PluginMetadata.js`** — augments the affix ship's metadata class prototype.
It is a top-level binding in the built `J-Passive-Affix.js`
(`project/js/plugins/passive/ext/J-Passive-Affix.js:266`,
`var JPassiveAffix_PluginMetadata = class extends PluginMetadata`), so it is reachable as a bare
global once that ship has loaded — which the `@orderAfter` guarantees.

It sits in `_metadata/` rather than `managers/` to mirror where the class it augments actually lives
in the sibling ship, so a reader looking for it finds it in the corresponding place.

```javascript
/**
 * Extends {@link #effectivePrefixPool}.<br/>
 * Also biases the pool by whatever the currently enabled difficulty layers ask for.
 */
J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata.set(
  'effectivePrefixPool',
  JPassiveAffix_PluginMetadata.prototype.effectivePrefixPool);
JPassiveAffix_PluginMetadata.prototype.effectivePrefixPool = function()
{
  // perform original logic.
  const original = J.DIFFICULTY.EXT.AFFIX.Aliased.JPassiveAffix_PluginMetadata.get('effectivePrefixPool')
    .call(this);

  // …return the difficulty-adjusted pool, or the original when the cache is cold or no layer asks.
};
```

`effectiveSuffixPool` is aliased in the same file with the identical shape. Both slots, always.

**Why aliasing a prototype method after the instance already exists works:**
`J.PASSIVE.EXT.AFFIX.Metadata` is constructed at that ship's script-eval time, long before this file
runs. Class methods live on `.prototype`, method dispatch resolves at call time, and the instance has
no own property shadowing them — so replacing the prototype method afterward is seen by the existing
instance. This is the load-bearing assumption of the whole design, and it was verified empirically
rather than reasoned about.

**`objects/Game_Event.js`** — aliases `getResolvedPassiveAffixPrefixChance` and its suffix twin,
multiplying the original result by the combined factor and clamping to 0–100.

**`objects/Game_Temp.js`** — aliases `refreshAppliedDifficulty` to rebuild the cached pools after the
original runs.

**`scenes/Scene_Boot.js`** — aliases `onDatabaseLoaded` and calls `assertGrantsAreValid()`.

This file exists because the validation has exactly one correct call site and neither obvious
candidate is it. It cannot run in `postInitialize`, because that is script-evaluation time: `$dataStates`
does not exist yet, and the slot check reads `state.isEnemyPrefix` off a hydrated row. It cannot run
inside `buildEffectivePools()` either, because that only ever inspects *enabled* layers — a bad grant
sitting on a layer the player never turns on would never throw, and the whole value of a boot throw is
that it fires for everyone on first launch rather than for one player three hours in.

So: validate and slot-split **every** configured grant, regardless of which layers are enabled, after
the original `onDatabaseLoaded` has run. The alias chain guarantees the affix extension's own
`initializeStateAffixWeights` has already populated `prefixMap` and `suffixMap` by then, because
`J-Passive-Affix` loads first and its alias sits underneath this one.

**`entry.js`** — **`__models/` first, then `_metadata/initialization.js`, then the rest.**

This order is load-bearing, not cosmetic. `initialization.js` constructs the metadata, whose
`postInitialize` calls `decorateDifficultyMetadatas()` → `setAffixEffects(...)` — an accessor
installed by `__models/DifficultyMetadata.js`. Import `initialization.js` first and ESM's depth-first
evaluation reaches that call before the accessor exists: `setAffixEffects is not a function`, at boot,
every time. `src/plugins/diff/core/entry.js` already models the correct order — all six `__models/*`
before `_metadata/initialization.js`.

**`vite.config.diff-affix.js`** — copy the sibling and change the one input line to
`'diff/ext/J-Difficulty-Affix'`.

### Part 4 — Tests

Coverage is a 100% floor, so both touched ships and the new one land with their tests or none of it
lands. Direct ESM import from `src/`, stubbing globals — a `vm` load of a built bundle scores zero
against `src/**` and would silently drop coverage. One `it` per branch with inline
Arrange/Act/Assert.

**The passive ship's changes need tests too, and they have a home.** Part 2 adds two methods and
widens a regex in a ship already at 100%; that coverage comes from
`test/plugins/passive/_component/j-passive-affix.test.js`, a genuine direct-src-import suite. Add
there rather than starting a new file.

New files mirror the new source tree:

```
test/plugins/diff/ext/affix/
  __models/affix-effects.test.js
  __models/difficulty-metadata.test.js
  _metadata/difficulty-affix-metadata.test.js
  _metadata/passive-affix-metadata.test.js
  objects/game-event.test.js
  objects/game-temp.test.js
  scenes/scene-boot.test.js
```

**The shared fixture every one of these needs.** Constructing `JDifficultyAffix_PluginMetadata` is
harder than it looks: `PluginMetadata`'s registry is append-only and **throws on a repeated name**
(`PluginMetadata.js:80-89`) — the existing affix suite works around this with per-scenario unique
names like `J-Passive-Affix-test-custom-${n}`, and this suite must do the same. The constructor also
immediately reaches `J.DIFFICULTY.Metadata.allRawConfigs` and `allMetadatas` through `postInitialize`,
so every construction needs a stubbed diff-core namespace. Build that fixture once and share it.

**Five fixtures carry the suite.** Each is named because the lazy version passes against a do-nothing
implementation:

1. **Flatten needs three entries: one above the mean, one below, and one *at* it.** The pair alone is
   not enough — with only a high and a low, "interpolate toward the mean" and "swap the two extremes"
   are the same program. The at-mean entry must not move, and that is what distinguishes them. A
   two-entry pool is likewise useless: any symmetric averaging agrees with flatten on two points.
   Hardcode all three expected weights; do not recompute them from the formula.
2. **Grants need an ungranted near-miss sibling.** Two zero-weight exotic states in the same slot,
   only one granted. The granted one becomes drawable, the sibling stays at zero — otherwise "grants
   this id" and "grants everything" are indistinguishable.
3. **Weight zero needs its pair of opposite claims.** One test that a zero-weight state is never
   returned by `weightedMapChoice`, and a second that `isAffixStateId` still returns **true** for it.
   The second protects pinned `<passive:[...]>` spawns and is the one a coverage sweep never asks for.
4. **The complement-product needs two layers whose wrong answer differs from the right one.** Two
   layers at `flatten: 40` must give `0.64`, not `0.8` — an implementation that sums, or applies each
   layer's flatten sequentially in map order, produces a different number. A single-layer fixture
   cannot catch this: `1 − (1 − 0.4)` and `0.4` are the same value.
5. **The slot-split happy path, asserted on both maps.** A valid prefix grant must land in
   `prefixGrants` **and be absent from** `suffixGrants`. Assert only the first and "sorts into prefix"
   and "sorts into both" are the same program. Pair it with a dual-tagged state that must land in
   both.

**The identity-path assertion has to pin the right thing.** `effectivePrefixPool()` returns a fresh
object literal on every call, so the wrapper is never reference-equal. Assert that `result.map` **is**
`Metadata.prefixMap` — that is the claim that actually proves nothing was rebuilt.

Also cover: a layer present but carrying no `affixEffects` block; the cold-cache path before any
refresh; the empty-positive-domain guard (all-zero pool must not produce `NaN`); the fresh-clone rule
(after a rebuild, the base `prefixMap` still holds its original weights); the default-layer fallback
when nothing is enabled; and each of the six boot-time throws with its own `it` asserting the message
names the offending layer key and state id.

### Part 5 — CA data (separate PR in the `ca` repo)

Nothing here is code. Listed so it does not get forgotten, since the plugin does nothing observable
until the data exists.

1. **Register the ship in `plugins.js`**, positioned after both `J-Difficulty` and `J-Passive-Affix`.
   The copy scripts move files; they do not touch `plugins.js`.
2. **Raise the base chances 8 → 15** on `J-Passive-Affix`'s parameters. At 15/15 a 30-enemy map
   averages 4.5 prefixed, 4.5 suffixed and 0.7 carrying both, which is the target JE stated
   ("3-6 of 30" each, both "occasionally"). *Confirm before changing — derived from the target, not
   ratified.*
3. **Author the exotic affix states** — Distortion, Warped, Dual, Trifurcation and whatever joins
   them — each with `<affix-weight:0>` plus its slot tag.
4. **Add `affixEffects` blocks to the six drives** (`011_crimson-drive` … `016_royal-drive`).
5. **Reconsider the negative prefix weights.** Ten negatives at 200 hold 74.5% of the prefix pool
   against the five positives' 25.5%, while the suffix pool is only 24% negative. The two halves
   currently disagree with each other. At chance 8 this was invisible (6% of all enemies); at chance
   15 it becomes 11%. **Separate tuning decision — do not bundle it into this work.**

---

## Definition of done

**Plugin PR** (`rmmz-plugins`):

- [ ] `bun run hotfix` green
- [ ] `ls src/plugins/diff/ext/affix/vite.config.diff-affix.js` exists, and
      `out/diff/ext/J-Difficulty-Affix.js` is produced by the build
- [ ] a test asserts `<affix-weight:0>` yields `0` and not `100` — the widened regex is only half the
      change, and `getNumberFromNoteByRegex` returning `0` rather than `null` is the load-bearing half
- [ ] `bun run mutate src/plugins/passive/ext/affix` and `bun run mutate src/plugins/diff/ext/affix`
      — survivor list read and each survivor classified, per `docs/mutation-testing.md`
      (`mutate.js` resolves the argument against the filesystem, so the `src/plugins/` prefix is
      required)
- [ ] coverage still 100% on all three touched ships

**CA data PR** (`ca`) — these need Part 5's data to exist, so they cannot be checked from the plugin
repo alone:

- [ ] in-game: with all difficulty layers disabled, kill roughly 50 map enemies and confirm affix
      frequency is unchanged from before this shipped (identity path)
- [ ] in-game: enable a drive carrying an `affixEffects` block, and confirm both that affixes appear
      noticeably more often and that the granted exotic can appear at all
- [ ] in-game: disable that drive again, and confirm the granted exotic stops appearing — this is the
      invalidation path, and it silently fails if `refreshAppliedDifficulty` was not the seam
- [ ] boot with a deliberately bad grant (a state id that does not exist) and confirm it throws at
      boot naming the layer key and the id, rather than booting and never showing the affix

---

## Open decisions

1. **Should the chance multiplier scale a chance an event comment pinned explicitly?** Recommended
   yes, on the grounds of being uniform and predictable, and because a designer wanting a truly fixed
   rate can pin `0` or `100`, both of which are multiplication fixed-points at the clamp boundaries.
2. **Ship name** — `J-Difficulty-Affix` proposed, mirroring `J-Passive-Affix`. `J-Difficulty-Affixes`
   and `J-Difficulty-Rates` were the alternatives considered.

### Settled: flatten applies to the whole pool

Raised and closed 2026-08-24. The question was whether `flatten` should skip the "negative" affixes,
so that a drive made Elysian more common without also making Fractured more common.

It should not, and the reason is that **"negative" is not a thing this system can know.** An affix is
a state. A state can lower a parameter, raise one, grant a skill, change an element rate, or any
combination — and whether the net result is bad for the player is a judgment no tag records and no
code can infer. Any implementation would have needed a proxy for it (the five positives happen to
carry `<affix-tier>` and the ten negatives happen not to), and a proxy for a concept the system does
not model is a rule that quietly breaks the first time someone authors a tiered debuff.

Flatten operates on the weight distribution, which is the only thing it can see. If a pool feels wrong
when flattened, the fix is the weights, not a carve-out.

### Settled: duplicate grants resolve by max

A grant states how rare a thing should be at a given layer. Two layers each saying "50" should not
silently mean 100 — that is an accumulating-resource reading of a declarative statement. One line in
`combinedPrefixGrants()` if it ever needs to change.

## Notes

- Sibling item: [`../inprogress/ca-affix-drop-upgrades.md`](../inprogress/ca-affix-drop-upgrades.md).
  Its "flux drive" half recorded difficulty-vs-drive as a blocker; the optional `affixEffects` block
  dissolves it, since the presence of the block is itself the marker for which layers are drives.
- The reward side already exists and is untouched by this: affix states carry
  `<rewardMultiplier:[exp|gold|sdp|ap|drops, N]>`
  (`passive/ext/affix/_metadata/initialization.js:53`), which is the existing mechanism for making a
  monstrous spawn worth fighting.
