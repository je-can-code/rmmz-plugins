# Localised equipment parameters

Percentages on equipment scale **that item's own contribution**, not the wearer's total.

An item's identity becomes its base: `params[]` plus the `<this{PARAM}:N>` tags already shipped in
J-Base. Refinement materials are the only source of code 21/22/23 traits on equipment, and such a
trait multiplies the base of the item it sits on. Piling `+GRD%` onto a sword with no parry base
yields nothing, because there is nothing of that kind on the sword to amplify. Re-hosting a
percentage onto a fresh item gains nothing either, since the ceiling is the new item's own base.

Passive states remain a **global** source of parameter traits. That is deliberate: a passive is worn
by the actor, not bolted to an item.

---

## 1. Verified current state

Every claim below was read from source at plan time. File and line are given so the executor can
re-read rather than trust this document.

### 1.1 Aggregation is already additive

`src/plugins/_base/core/objects/Game_BattlerBase.js`

| line | method | current body |
|---|---|---|
| 184 | `traitsDeltaSum(code, id)` | `Σ (trait.value − 1.0)` over `traitsWithId(code, id)` |
| 205 | `sparam(sparamId)` | `1.0 + traitsDeltaSum(23, id)` — **no floor** |
| 228 | `elementRate(elementId)` | `Math.max(0, 1.0 + traitsDeltaSum(11, id))` |
| 252 | `paramRate(paramId)` | `Math.max(0, 1.0 + traitsDeltaSum(21, id))` |
| 274 | `stateRate(stateId)` | `Math.max(0, 1.0 + traitsDeltaSum(14, id))` |

`xparam` is **not** overridden anywhere in plugin source; actors and enemies use vanilla
`traitsSum(22, id)` (`project/js/rmmz_objects.js:2839`), which is already additive.

**Why this matters:** a sum is separable. Equipment's contribution to any of these totals is an
addend that can be subtracted back out. A product could not be unwound this way without knowing
which object each trait came from — and that information is destroyed, see 1.2.

### 1.2 Trait provenance is destroyed by the cache

`Game_BattlerBase.allTraits()` (line 128) flattens `traitObjects()` with
`reduce((r, obj) => r.concat(obj.traits), [])` and caches the flat array. After the flatten a trait
no longer knows which sword it came from. Both `_cachedTraitObjects` and `_cachedAllTraits` are
seeded to `null` in `initMembers` (lines 29, 39) and invalidated by `onBattlerDataChange`.

So localisation must read each equip's traits **from the equip**, never from the battler's flat list.

### 1.3 Equipment reaches the trait list through `equippedEquips`

`src/plugins/_base/core/objects/Game_Actor.js:451` — `buildTraitObjects()` returns
`[...states(), actor(), currentClass(), ...equippedEquips()]`.

`Game_Actor.equippedEquips()` (line 474) is `this.equips().filter(equip => !!equip)` — **it already
exists and already excludes the `null`s that empty slots produce.** No new null handling is needed
anywhere in this work.

`Game_Enemy.buildTraitObjects()` (`_base/core/objects/Game_Enemy.js:85`) returns states plus the
enemy's own database row. **Enemies have no equipment**, so nothing about them changes.

### 1.4 The override chain, in load order

Ships load `_base` first, then the rest.

| plugin | file | overrides |
|---|---|---|
| `_base` | `objects/Game_BattlerBase.js` | `sparam`, `paramRate`, `elementRate`, `stateRate` |
| `natural` | `core/objects/Game_Actor.js` | `paramBase` (126), `xparam` (210), `sparam` (292), `maxTp` (39) |
| `sdp` | `core/objects/Game_Actor.js` | `param` (473), `xparam` (491), `sparam` (510), `maxTp` (531) |
| `diff` | `core/objects/Game_Actor.js` | `param` (8), `sparam` (31), `xparam` (54) |

All three downstream plugins are **additive extenders** — each calls its alias and adds a bonus. None
of them will need editing: they will capture the localised value and add growths on top of it.

**`paramPlus` and `xparam` are claimed by nobody.** `paramBase` is claimed by `natural` (126) and
overwritten by `level` (`level/core/objects/Game_Actor.js:122`), and this work does not touch it — so
J-NaturalGrowths' base-parameter growths are entirely unaffected.

SDP applies `applySdpPanelStatFloor` (line 457) to `param`, `xparam` and `sparam`, with
`PanelStatFloorDefault = 0` (`sdp/core/_metadata/_pluginMetadata.js:32`). **With J-SDP loaded there is
already a floor of 0 in the actor chain** for x- and s-parameters.

### 1.5 The load-order trap — read this before writing any alias

`src/plugins/_base/core/entry.js` imports **`Game_Actor.js` at line 48 and `Game_BattlerBase.js` at
line 52.** Game_Actor is imported *first*.

Therefore, inside `_base`, this is a bug:

```javascript
// BAD - in _base/core/objects/Game_Actor.js
J.BASE.Aliased.Game_Actor.set('sparam', Game_Actor.prototype.sparam);
```

At that moment `Game_Actor.prototype.sparam` resolves up the chain to **vanilla** multiplicative
`Game_BattlerBase.prototype.sparam`, because J-Base's additive override has not been installed yet.
Actors would silently use multiplicative stacking while enemies use additive.

Two ways out. This plan takes the second.

- Late-bind: `Game_BattlerBase.prototype.sparam.call(this, id)` at call time, the pattern already used
  by `Game_Actor.traitObjects` (line 437).
- **Put the work in `Game_BattlerBase.js` itself**, beside the existing additive overrides, and give
  battlers a hook that answers "which of my trait sources are self-contained items". Enemies answer
  "none". No alias is captured, so no ordering exists to get wrong.

### 1.6 Refinement already protects an item's own note

`src/plugins/jafting/ext/refine/managers/JaftingManager.js`

- `parseTraits(equip)` (line 33) returns **only traits below the code-63 divider**, consolidated by
  `TraitResolver.consolidate`. No divider means no transferable traits at all.
- `determineRefinementOutput(base, material)` (line 64) clones the base with
  `base._generate(base, base._index())` (line 82), so **the base's entire note survives verbatim**,
  then truncates everything after the divider and appends the merged traits. **Notes are not merged
  today.**
- `TraitResolver.refineTraits` (`_base/core/managers/TraitResolver.js:152`) combines same-dataId
  parameter traits additively *within* each list (steps 1, via `#combineParameterTraitsForCode` with
  neutral 1 for codes 21/23 and 0 for code 22), and codes 21/22/23 are **absent** from
  `#HigherIsBetterCodes` / `#LowerIsBetterCodes`, so step 6 concatenates both sides. Refinement
  magnitude therefore grows **additively and without bound**, capped only by `maxRefineCount`.

### 1.7 Every parameter display already routes through the alias chain

`ParameterCatalogRenderer` (`cms/core/helpers/ParameterCatalogRenderer.js:387`) reads
`actor.parameter(key)` → `Game_Battler.parameter` (`_base/core/objects/Game_Battler.js:442`) →
`ParameterRegistry.resolveValue` → `ParameterDefinition.getValue`, and
`_base/core/core/registerVanillaParameters.js` registers those closures as
`battler => battler.param(id)` (35), `battler.xparam(id)` (60), `battler.sparam(id)` (93).

`Game_Battler.parameter`'s own JSDoc states it "does not bypass param/xparam/sparam alias chains."

**Consequence: the status scene, `Window_EquipStatus`, and the hover preview inherit localisation for
free.** The preview builds a `_tempActor` and re-reads the same accessors, so no comparison window
needs editing. This is the single largest "no work required" finding in the plan.

**The preview's cache invalidation was verified, not assumed** — it is what that claim rests on. A
`_tempActor` is a `JsonEx.makeDeepCopy` of the actor, and `JsonEx` is the **deep-copy** path rather than
the save path, so the `transients` declaration in 3.4 does *not* apply to it: the copy carries the caches
across. What saves it is that **`forceChangeEquip` is aliased** in
`_base/core/objects/Game_Actor.js:346-365` and fires `onEquipChange` — and thence
`onBattlerDataChange` — whenever the equips array actually changed. So the swap invalidates the copy's
caches before anything reads a parameter from it. `_cachedAllTraits` depends on the identical mechanism
today, which is why the preview is correct now.

`har` (`Game_Battler.js:511`) is `baseHarFactor()` plus an SDP bonus and reads no traits — unaffected.
`maxTp` (`Game_Battler.js:82`) is `getBaseMaxTp() + getBaseMaxTpBonuses()`, where the bonus is
`getSumFromAllNotesByRegex(getAllNotes(), J.BASE.RegExp.MaxTp)` (line 117) — a note sum, not traits.

### 1.8 Measured data shape (`ca/chef-adventure/data`, plan time)

Parameter traits split by divider position:

| collection | rows | code 21 | code 22 | code 23 |
|---|---|---|---|---|
| weapons, above divider | 180 | 0 | 277 | 18 |
| weapons, below divider | | 0 | 0 | 0 |
| armors, above divider | 455 | 1 | 226 | 46 |
| armors, below divider | | 60 | 45 | 15 |

**No weapon carries a divider at all**, so no weapon is currently usable as a refinement material.
153 armors carry one. `maxRefineCount` appears on 135 weapons and 0 armors; `maxTraitCount` and
`<noRefine>` appear on none.

Above-divider dataId distribution — weapons are accuracy and crit, armors are evasion and parry:

```
W x:hit 135   W x:cri 95   W x:mrg 22   W x:trg 22   W x:cnt 3    W s:grd 11   W s:rec 7
A x:eva 186   A x:mrg 16   A x:trg 14   A x:hrg 7    A x:cev 2    A x:cri 1
A s:grd 21    A s:fdr 10   A s:tcr 10   A s:tgr 5
```

Zero weapons or armors carry a `<passive:...>` tag. No equipment carries J-NaturalGrowths-style
`<atkPlus:>` / `<atkRate:>` tags. There is no competing global path from equipment today.

---

## 2. The design

### 2.1 One new model method

```
e.ownRate(21 | 23, dataId) = 1.0 + Σ over e.traits matching (code, dataId) of (value − 1.0)
e.ownRate(22,      dataId) = 1.0 + Σ over e.traits matching (22,   dataId) of  value
```

Codes 21 and 23 store values as deltas from `1.0` (`1.25` = +25%); code 22 stores deltas from `0`
(`0.25` = +25%). `ownRate` normalises both to a multiplier centred on `1.0`.

**That normalisation is what makes one subtraction work for all three families.** Because
`ownRate − 1` is always "the delta this item contributes in its family's own units", the global term
is the same expression everywhere.

### 2.2 The four formulas

```
equipDelta(code, id) = Σ over localisedEquips() of (e.ownRate(code, id) − 1)

paramRate(id) = max(0, 1.0 + traitsDeltaSum(21, id) − equipDelta(21, id))
sparam(id)    =        1.0 + traitsDeltaSum(23, id) − equipDelta(23, id)
                     + Σ over localisedEquips() of [ e.thisSParam(id)/100 × e.ownRate(23, id) ]
xparam(id)    =        traitsSum(22, id)            − equipDelta(22, id)
                     + Σ over localisedEquips() of [ e.thisXParam(id)/100 × e.ownRate(22, id) ]

paramPlus(id) = Game_Battler.paramPlus(id)
                     + Σ over equippedEquips() of [ e.thisBParam(id) × e.ownRate(21, id) ]
```

Base parameters are asymmetric on purpose: they have somewhere to be *added* (`paramBase` supplies the
class curve), so the local product lands in `paramPlus` and `paramRate` only subtracts. X- and
s-parameters have no base of their own, so the local product is the whole value.

Division by 100 matches the established unit convention: J-NaturalGrowths reads its percent tags and
divides by 100 (`natural/core/objects/Game_Actor.js:259`), and JABS converts back out with
`hundredX(grd - 1)` / `hundredX(hit)` (`abs/core/managers/JABS_Engine.js:444-460`).

**No clamp interacts with this, verified.** Moving equipment's rate from `paramRate` into `paramPlus`
would matter if the engine clamped between the two, so it was checked rather than assumed
(`project/js/rmmz_objects.js:2859-2891`):

```javascript
paramBasePlus(id) = Math.max(0, paramBase(id) + paramPlus(id));
param(id)         = Math.round((paramBasePlus × paramRate × paramBuffRate).clamp(paramMin, paramMax));
paramMax(id)      = Infinity;
paramMin(id)      = id === 0 ? 1 : 0;
```

`paramMax` is `Infinity`, so there is no ceiling for a heavily refined item to collide with, and the
clamp applies to the **final** product rather than to `(base + plus)` before the rate — so nothing
changes about where the localised product sits. `paramBasePlus`'s floor at `0` behaves exactly as it does
today: an equip with negative `params` still cannot drive a parameter below zero.

### 2.3 `ownRate` counts **all** of an item's parameter traits

Not only those below the divider. Two reasons:

1. `_base` must not encode JAFTING's code-63 divider convention. That is an extension's bookkeeping
   device, and J-Base does not know about its extensions.
2. After the data pass (section 5) there are no above-divider parameter traits left to worry about —
   they will have become tags.

An inherent parameter trait authored in future is therefore local, which is the intent.

---

## 3. Code changes, in dependency order

### 3.1 `src/plugins/_base/core/database/core/RPG_EquipItem.js`

Add one method in a new `//region own rates` block, placed **after** the existing
`//endregion this-parameter bases` and before the closing `}`.

```javascript
/**
 * How much this equip amplifies its own base for a given parameter.
 *
 * A percentage on equipment scales what that equipment is worth, not what its wearer is worth, so the
 * multiplier has to be assembled from this item's traits alone rather than the battler's flattened
 * list - which no longer knows which item each trait came from.
 *
 * Returns a multiplier centred on 1.0 regardless of family. Codes 21 and 23 store values as deltas
 * from 1.0 while code 22 stores them as deltas from 0, and normalising the two here is what lets a
 * single subtraction remove equipment's share from all three battler aggregates.
 * @param {number} code The trait code: 21 for base, 22 for ex-, 23 for sp-parameters.
 * @param {number} dataId The parameter id within that family.
 * @returns {number}
 */
ownRate(code, dataId)
{
  const baseline = code === 22 ? 0 : 1;
  const matching = this.traits.filter(trait => trait.code === code && trait.dataId === dataId);

  return matching.reduce((total, trait) => total + (trait.value - baseline), 1.0);
}
```

Notes for the executor:

- `this.traits` is `RPG_Trait[]` with plain `code` / `dataId` / `value` fields
  (`_base/core/database/base/RPG_Traited.js:15,29`). Reading it directly is correct and matches
  existing practice (`JaftingManager.js:36`, vanilla `allTraits`); the sibling `thisBParam` already
  reads `this.params` the same way and passes `verify:no-direct-property-getset`.
- The ternary is a single non-nested conditional assigning a constant. If the formatter or a reviewer
  prefers, spell it as an `if`; do **not** nest it into the `reduce`.
- No `instanceof`, no `typeof`, no optional chaining, no rest parameters. Callbacks are exempt from
  `verify:no-chained-call-arguments`.

### 3.2 `src/plugins/_base/core/objects/Game_BattlerBase.js`

**(a)** Add the hook, immediately after `buildTraitObjects` (line 97):

```javascript
/**
 * The trait sources on this battler whose parameter percentages apply only to themselves.
 *
 * Equipment is the one kind of trait source that is a discrete object the player swaps in and out, so
 * a percentage on it describes the item rather than its wearer. Battlers with no equipment answer with
 * nothing, which makes every localisation formula below a no-op for them rather than a special case.
 * @returns {RPG_EquipItem[]}
 */
Game_BattlerBase.prototype.localisedEquips = function()
{
  return Array.empty;
};
```

**(b)** Add the cache field to `initMembers` (line 7), beside the two existing ones:

```javascript
/**
 * The cached per-parameter equipment contributions for this battler, keyed `code:dataId`.
 * Null when the cache is cold; populated lazily and invalidated by {@link #onBattlerDataChange}.
 * @type {Map<string, {delta: number, local: number}>|null}
 */
this._j._base._cachedEquipContributions = null;
```

Plus the matching `getCachedEquipContributions` / `setCachedEquipContributions` accessors, and an
invalidation line in whatever `onBattlerDataChange` resets the other two caches from. **Never touch
`this._j._base._cachedEquipContributions` outside `initMembers` and its setter**
(`verify:no-direct-property-getset`); the nested `_j._base` namespace itself is exempt.

**Why cache.** Every other note-derived value on a battler in this repo is cached with the same
lifecycle: `_cachedAllTraits` (line 39), `_cachedAllNotes`, `_cachedMaxTpBonuses`
(`Game_Battler.js:108`), `_cachedHarFactor`. `thisXParam`/`thisSParam` bottom out in
`RPGManager.getSumFromNoteByRegex`, a per-equip note-string scan, and `xparam`/`sparam` are read during
damage resolution and once per catalog row per refresh — `ParameterCatalogRenderer` draws roughly thirty
rows for the actor *and* again for `_tempActor` during an equip hover. Being the one uncached
note-reader would leave a future reader with a question that has no answer.

Instance-level memoization on `RPG_EquipItem` was the cheaper alternative and is **rejected**: it would
be silently wrong if anything ever mutates a note in place, and the pending `<transferrableEffectsBelow>`
note-merge work does exactly that kind of thing to a freshly generated output. Battler-level caching
keyed off `onBattlerDataChange` cannot go stale that way, because equipping fires it —
`Game_Actor.onEquipChange` (`_base/core/objects/Game_Actor.js:262`) calls it at line 265.

**(c)** Add one combined helper, next to `traitsDeltaSum` (line 184). One method rather than two, so a
formula pays for a single cache lookup:

```javascript
/**
 * What equipment contributes to a parameter, split into the share to remove from the battler-wide
 * aggregate and the share to re-apply locally.
 *
 * `delta` is equipment's contribution to the global total in that family's own units, and is subtracted
 * back out. `local` is each item's own base for the parameter amplified by that same item's own
 * percentages. Expressed through {@link RPG_EquipItem#ownRate} so all three families normalise to one
 * 1.0-centred multiplier and a single subtraction serves each of them.
 *
 * Tags are authored as whole percents while the engine works in rate space, so the hundredth here
 * matches what J-NaturalGrowths does with its own growth tags.
 * @param {number} code The trait code: 21, 22, or 23.
 * @param {number} dataId The parameter id within that family.
 * @returns {{delta: number, local: number}}
 */
Game_BattlerBase.prototype.equipParameterContribution = function(code, dataId)
{
  // warm the cache on first use this cycle; the cold value is null, matching every other cache here.
  if (this.getCachedEquipContributions() === null)
  {
    this.setCachedEquipContributions(new Map());
  }

  const key = `${code}:${dataId}`;
  const cache = this.getCachedEquipContributions();

  // return the cached result if this parameter was already resolved this cycle.
  if (cache.has(key)) return cache.get(key);

  const contribution = this.buildEquipParameterContribution(code, dataId);
  cache.set(key, contribution);

  return cache.get(key);
};

/**
 * Computes equipment's contribution to one parameter from scratch.
 *
 * Separated from the caching wrapper above so the arithmetic can be read and tested without the cache
 * in the way, matching how {@link #buildTraitObjects} sits behind {@link #traitObjects}.
 * @param {number} code The trait code: 21, 22, or 23.
 * @param {number} dataId The parameter id within that family.
 * @returns {{delta: number, local: number}}
 */
Game_BattlerBase.prototype.buildEquipParameterContribution = function(code, dataId)
{
  let delta = 0.0;
  let local = 0.0;

  this.localisedEquips()
    .forEach(equip =>
    {
      const ownRate = equip.ownRate(code, dataId);
      const base = code === Game_BattlerBase.TRAIT_XPARAM
        ? equip.thisXParam(dataId)
        : equip.thisSParam(dataId);

      delta += (ownRate - 1);
      local += ((base / 100) * ownRate);
    });

  return { delta, local };
};
```

Base parameters read `local` from `paramPlus` instead (3.3), so the `local` computed here is unused for
code 21. Leaving it computed rather than branching keeps one code path; the `thisSParam` read for code
21 costs one note scan per equip per cycle and is discarded. **If that offends, branch it — but then
add a test for the branch**, because an unbranched-but-unused value and a wrongly-branched one look
identical from the outside.

**(d)** Edit `paramRate` (line 252) — subtract only:

```javascript
const contribution = this.equipParameterContribution(Game_BattlerBase.TRAIT_PARAM, paramId);
const rate = 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_PARAM, paramId) - contribution.delta;

return Math.max(0, rate);
```

**(e)** Edit `sparam` (line 205) — subtract, then re-add locally:

```javascript
const { delta, local } = this.equipParameterContribution(Game_BattlerBase.TRAIT_SPARAM, sparamId);
const global = 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_SPARAM, sparamId) - delta;

return global + local;
```

**(f)** Add `xparam`, which J-Base does not currently override. Use the alias pattern here — this one
is safe, because vanilla `xparam` is what is being captured and nothing in `_base` replaces it:

```javascript
J.BASE.Aliased.Game_BattlerBase.set('xparam', Game_BattlerBase.prototype.xparam);
Game_BattlerBase.prototype.xparam = function(xparamId)
{
  // perform original logic.
  const global = J.BASE.Aliased.Game_BattlerBase.get('xparam')
    .call(this, xparamId);

  const { delta, local } = this.equipParameterContribution(Game_BattlerBase.TRAIT_XPARAM, xparamId);

  return (global - delta) + local;
};
```

`Game_BattlerBase.TRAIT_XPARAM` is `22`, a vanilla static declared at
`project/js/rmmz_objects.js:2395` alongside `TRAIT_PARAM` (2394) and `TRAIT_SPARAM` (2396). Use the
named static, not the literal.

### 3.3 `src/plugins/_base/core/objects/Game_Actor.js`

**(a)** Add the actor's answer to the hook, immediately after `equippedEquips` (line 474):

```javascript
/**
 * Overwrites {@link Game_BattlerBase#localisedEquips}.<br/>
 * An actor's worn equipment is exactly the set of trait sources whose percentages describe the item
 * rather than the actor.
 * @returns {RPG_EquipItem[]}
 */
Game_Actor.prototype.localisedEquips = function()
{
  return this.equippedEquips();
};
```

**(b)** Overwrite `paramPlus`. It must be an **overwrite, not an extension** — vanilla
`Game_Actor.paramPlus` already adds `equip.params[paramId]`, and extending it would count equipment
base parameters twice. Reach past it to `Game_Battler.prototype.paramPlus` for the `_paramPlus`
half, exactly as `Game_Actor.traitObjects` (line 437) reaches past its own vanilla implementation:

```javascript
/**
 * Overwrites {@link Game_Actor#paramPlus}.<br/>
 * Equipment contributes its own base for the parameter amplified by its own percentages, rather than
 * a bare base whose percentages were pooled into the actor's global rate.
 *
 * Deliberately not an extension: vanilla's implementation already adds each equip's `params` entry, and
 * {@link RPG_EquipItem#thisBParam} includes that same entry, so aliasing would count it twice.
 * @param {number} paramId The base parameter id, 0 through 7.
 * @returns {number}
 */
Game_Actor.prototype.paramPlus = function(paramId)
{
  // the permanent plus from events and items, which belongs to the actor rather than any item.
  const actorPlus = Game_Battler.prototype.paramPlus.call(this, paramId);

  const equipPlus = this.equippedEquips()
    .reduce((total, equip) => total + (equip.thisBParam(paramId) * equip.ownRate(21, paramId)), 0);

  return actorPlus + equipPlus;
};
```

Use `Game_BattlerBase.TRAIT_PARAM` rather than the literal `21` if referencing the static reads more
clearly at this site; both are correct.

### 3.4 `src/plugins/_base/ext/save/core/registerEngineSaveCodecs.js`

The new cache holds a `Map`, and **`Map` is a registered serializable type** — so left undeclared it
would persist into every savefile and come back stale after a load. Add one line to the `transients`
block of the `Game_Actor` registration (line 244), beside the five already there:

```javascript
'_j._base._cachedEquipContributions': () => null,
```

Seed to `null`, not `undefined` and not omitted: the reader's guard is `=== null`, and a field arriving
as `undefined` would sail past it and then throw on `.has`.

`Game_Enemy` needs no declaration — it is **not registered** in this file at all, because enemies are
rebuilt from the troop rather than persisted. Enemies still inherit the helper; their cache is simply
never saved, and `localisedEquips()` returns nothing for them so every entry is zero.

### 3.5 One refinement costs one count — two sites

Per 6.2. These are the changes that make `Iron Sword (+0) + Iron Sword +6 = Iron Sword +1` valid.

**(a)** `src/plugins/jafting/ext/refine/managers/JaftingManager.js` — delete lines 100-104:

```javascript
if (material.jaftingRefinedCount > 0)
{
  output.jaftingRefinedCount += material.jaftingRefinedCount - 1;
}
```

`determineRefinementOutput` clones the base (line 82), so the output starts at the base's count, and
`stampRefinedOutput` then increments it by one (line 124). Deleting the block above is the entire change:
one refinement, one count, regardless of what the donor had accumulated.

**(b)** `src/plugins/jafting/ext/refine/managers/RefinementEligibility.js` — line 183, inside
`applyRefineCountCeiling`:

```javascript
// BEFORE - projects the donor's own history onto the base, so a +6 donor costs six of the base's budget.
const projected = baseSelection.jaftingRefinedCount + equip.jaftingRefinedCount;

// AFTER - a refinement costs exactly one, whatever the donor carried.
const projected = baseSelection.jaftingRefinedCount + 1;
```

**This is the gate that produces "why can't I donate this +6 onto my +3?"** With a cap of 6 it projects
`3 + 6 = 9 > 6` and bars the donor. After the change it projects `4/6` and allows it. Without this edit,
(a) alone would let the *output* be `+1` while the eligibility check still refused to offer the donor —
the two would disagree, and the list would silently hide the design's central move.

Leave `applyTraitCountCeiling` (line 267) alone. It re-derives the projected output and counts traits,
which remains the correct question to ask, and consolidation means a donor's payload merges into existing
entries rather than inflating the count.

**Tests:** the arithmetic change in (b) needs a case at the boundary on **each side** — a donor that
lands the base exactly on its cap must be allowed, and one that would exceed it by a single count must be
barred. A test with only the allowed case would pass against `projected = 0`.

### 3.6 Nothing else in plugin source changes

Confirmed by search, not assumption. Listed so the executor does not go hunting:

- **`paramPlus` and `paramRate` have zero call sites in plugin source.** `grep -rn '\.paramPlus(\|\.paramRate(' src/plugins/`
  returns nothing — only the engine calls them, from inside `Game_BattlerBase.param`. So no window or
  manager displays "the bonus from gear" by reading either one, and their changed meaning reaches
  nothing but `param()`.
- No plugin reads `equip.params` for combat math. The only direct reads are
  `jafting/ext/create/windows/Window_RecipeDetails.js:730-786` (display, changed per D9) and
  `level/core/objects/Game_Actor.js:129` (the class curve, unrelated).
- `natural`, `sdp` and `diff` need no edits (1.4).
- No equipment-comparison window needs edits (1.7).
- `Game_Enemy` needs no edits (1.3).
- `har`, `maxTp`, `elementRate`, `stateRate` need no edits (1.7, 1.1).

---

## 4. Tests

Coverage is at 100% of statements, branches, functions and lines across every measured file and must
stay there. Run `bunx vitest run --coverage` and read the changed files specifically; a drop is
reported against the file, not the diff.

### 4.1 `test/plugins/_base/core/database/rpg-equip-item-this-params.test.js` — extend

The file exists and already bootstraps with `installJBaseHostGlobals()` plus a real import of
`_base/core/_metadata/initialization.js`. Add an `ownRate` block. One `it` per branch:

1. code 21, one trait at `1.25` → `1.25` (baseline 1 subtracted)
2. code 23, one trait at `1.10` → `1.10`
3. code 22, one trait at `0.25` → `1.25` (**baseline 0 not subtracted** — this is the branch that
   distinguishes the two arms of the ternary)
4. no matching traits → `1.0`
5. two matching traits sum: code 21 at `1.25` and `1.50` → `1.75`
6. a reducing trait: code 23 at `0.83` → `0.83`

**Required near-miss siblings.** With one trait in the list, `filter(t => t.code === code && t.dataId === dataId)`
and `filter(() => true)` are the same program. Every fixture above must include:

- a trait with the **same code, different dataId** that must not be counted
- a trait with a **different code, same dataId** that must not be counted

Without both, neither half of the predicate is constrained. This is the exact failure mode that let
`TraitResolver` sit at 100% coverage with every identity predicate replaceable by `true`.

### 4.2 `test/plugins/_base/core/objects/game-battler-base.test.js` — extend

`buildBattler()` is `Object.create(Game_BattlerBase.prototype)` (line 42), so `localisedEquips` is
inherited from the prototype and returns an empty collection. **The existing `sparam` (277) and
`paramRate` (322) tests therefore pass unmodified** — equipment's share is zero and the local term is
zero.

**One fixture line is required first.** `Array.empty` is defined in
`_base/core/_metadata/initialization.js:646` as a getter returning `Array.of()`, and this test file does
**not** import `initialization.js` — it stands up a bare `globalThis.J` literal at line 15. So
`Array.empty` is `undefined` there, and `localisedEquips().reduce(...)` would throw on the very first
`sparam` call. Add the property to the `beforeAll` block beside the other engine statics:

```javascript
Object.defineProperty(Array, 'empty', { get: () => Array.of(), configurable: true });
```

Use `configurable: true` in the fixture even though the real definition uses `false`, so repeated test
runs in one process cannot collide.

New cases:

1. `localisedEquips` returns an empty collection at the base level
2. `buildEquipParameterContribution` returns zero for both members with no equips
3. `buildEquipParameterContribution` sums `ownRate − 1` into `delta` across two equips
4. `buildEquipParameterContribution` reads `thisXParam` for code 22
5. `buildEquipParameterContribution` reads `thisSParam` for code 23 — **this is the branch of the
   `base` ternary**, and the two stubs need *distinct* values so a transposition is visible; equal
   values make the two arms indistinguishable
6. `equipParameterContribution` allocates the `Map` when the cache is cold (the `=== null` arm)
7. `equipParameterContribution` returns the cached entry on a second call for the same key — assert by
   spying on `buildEquipParameterContribution` and checking it ran **once**, not by comparing values,
   which would pass with no cache at all
8. `equipParameterContribution` computes separately for a **different key** — the near-miss that proves
   the cache is keyed on `code:dataId` and not merely on "has anything been cached"
9. `paramRate` subtracts the equipment share
10. `sparam` subtracts the equipment share and adds the local product
11. `xparam` subtracts the equipment share and adds the local product
12. `xparam` calls its alias (proof the original logic still runs)

Case 7 is the one most easily faked. A test that calls the method twice and asserts both results match
passes identically whether or not a cache exists — the assertion has to be about *how many times the
builder ran*.

**Restore that spy manually, in the test itself.** `buildBattler()` returns
`Object.create(Game_BattlerBase.prototype)`, so a `vi.spyOn` for case 7 lands on the shared prototype and
leaks into every later test in the file. Do not rely on `restoreAllMocks`.

Fixtures must be built **from the caller's perspective** — hand-rolled stub objects exposing
`ownRate`, `thisXParam`, `thisSParam` — not copies of the implementation. Four bugs previously
survived 100% coverage in this repo because mocks mirrored the implementation.

**Beware the sentinel.** `sparam` returns `1.0` when nothing contributes, and `1.0` is also what a
do-nothing implementation returns. Pair any such assertion with a proof-of-execution anchor carrying
a value that only appears if the method ran.

### 4.3 `test/plugins/_base/core/_component/game-actor-methods.test.js` — extend

This is the existing coverage home for `_base/core/objects/Game_Actor.js`. It already calls
`installJBaseHostGlobals()` and imports the real `_metadata/initialization.js` (line 34), so `Array.empty`
is live and no fixture line is needed for it.

**Two fixture gaps that will bite immediately.** `install-j-base-host-globals.js` provides neither of
these, and the `paramPlus` overwrite needs both:

- **`Game_Battler.prototype.paramPlus`** — the overwrite calls it directly for the `_paramPlus` half
  (3.3b). Absent, the first test throws `not a function`. Stub it returning a known non-zero number, so
  the assertion can prove the actor half was actually included rather than coincidentally zero.
- **`Game_Actor.prototype.equips`** — `equippedEquips()` filters it. Stub `equips` rather than
  `equippedEquips`, so the null-slot filtering stays covered by the code under test instead of being
  mocked away; include a `null` slot in the fixture for exactly that reason.

1. `localisedEquips` delegates to `equippedEquips`
2. `paramPlus` sums `_paramPlus` with the local equipment product
3. `paramPlus` with an equip carrying **no** rate trait uses `ownRate === 1.0` unchanged
4. `paramPlus` with two equips, **only one** carrying a rate trait — the near-miss that proves the
   rate is applied per item and not to the pooled total
5. `paramPlus` does not double-count `params[paramId]` (assert an exact hardcoded number for an equip
   with `params[2] = 40`, `<thisAtk:15>` and a `1.5` rate → `82.5`, computed once and pinned, not
   re-derived in the assertion)

### 4.4 Mutation check

`bun run mutate src/plugins/_base/core/database/core/RPG_EquipItem.js` and the same for
`Game_BattlerBase.js` / `Game_Actor.js`. Read `docs/mutation-testing.md` first. The survivors decide
things, the score decides nothing. Three legitimate outcomes: a missing assertion (write it), a guard
redundant with code downstream (raise it as a deletion candidate), or equivalence by construction
(prove it and move on — never write a contrived test to kill it).

### 4.5 Full gate

`bun run hotfix`. Green means every ship built and the whole suite passed. Fix root causes; never fall
back to copying built files by hand.

---

## 5. Data migration (`ca` repo, separate PR, must merge together)

### 5.1 What migrates and how

Codes 22 and 23 have **no base of their own**, so a percentage on them has nothing to multiply until a
tag supplies one. Those transcribe mechanically:

```
code 22, dataId d, value v   →   <this{X_NAME[d]}: round(v * 100)>
code 23, dataId d, value v   →   <this{S_NAME[d]}: round((v - 1) * 100)>
```

```
X_NAME = [ Hit, Eva, Cri, Cev, Mev, Mrf, Cnt, Hrg, Mrg, Trg ]
S_NAME = [ Tgr, Grd, Rec, Pha, Mcr, Tcr, Pdr, Mdr, Fdr, Exr ]
```

Values below `1.0` on code 23 are reductions and transcribe to negative tags — the measured set
includes `0.83, 0.85, 0.87, 0.89, 0.90, 0.92, 0.93, 0.96`, giving e.g. `<thisPdr:-17>`. That is
correct: `sparam` is `1.0 + Σ locals`, so a negative local reduces the rate exactly as the old trait
did.

**Code 21 needs no migration.** A code-21 trait on an item already has `params[]` to multiply, so it
becomes local automatically and keeps its meaning. Only one above-divider code-21 trait exists anyway.

**Scope: 567 above-divider traits** (277 + 18 weapon, 226 + 46 armor). One tag per line — several
readers split notes on newlines.

### 5.2 What must not migrate

Below-divider traits are refinement payloads and **stay as traits**: 60 code-21, 45 code-22, 15
code-23. They are the percentages, which is the whole point.

### 5.3 Method

- Write it as a `bun` script. Dry-run first and read the diff before writing anything.
- **A row with two above-divider traits on the same code and dataId must emit two tag lines**, not one
  merged value. The summing reader handles duplicates correctly, but a script keyed by a `Map` of
  `dataId` would silently drop one and nothing downstream would report it. Emit per trait, one per line.
  This is not hypothetical: **armor 106 (Healing Crown) and armor 110 (Mind Crown)** each carry two
  above-divider traits sharing a code and dataId. Assert the emitted tag-line count equals the consumed
  trait count, so a future duplicate cannot slip through silently.
- `Weapons.json` and `Armors.json` are line-per-entry; preserve that serialization exactly. Do not
  reformat with a bare `JSON.stringify`.
- Never edit these files with regex, `sed`, or `perl`.
- Material payload magnitudes will need re-tuning afterwards (D7) — a material's `+0.25` code-22 hit
  meant +25 points globally and now means +25% of the weapon's own accuracy.

---

### 5.4 What the armor id ranges actually are, and why no wearable row is a material

Worth writing down, because reading `Armors.json` by id alone makes materials look like accessories —
they occupy `etypeId 2` and carry accessory-sounding names.

| ids | what they are | payload below their divider |
|---|---|---|
| **1-10** | **wearable offhand relics that are *also* donors** | code 43 (offhand skills) |
| 201-223 | element and killer glyphs / seals | code 31 |
| **224-263** | **stat gems** | **code 21** — 40 rows |
| 301-455 | refinement stat drops | codes 21 / 22 / 23 |

**Wearable gear can carry a divider, and ids 1-10 do.** They are `etypeId 2` (Offhand) with real
`params` — Omni-Badge (10) is `[0, 2500, 0, 0, 0, 300, 0, 0]` — worn for their MMP and MDF, while their
below-divider code-43 traits are an offhand skill that can be refined onto anything: a body slot, a
weapon, whatever. More transferable skills are planned, so this dual-purpose shape will grow rather than
shrink.

**This is why D5 matters.** `ownRate` counting *all* of an item's parameter traits regardless of divider
position is what makes a dual-purpose item behave correctly — worn, its below-divider payload is live
(`allTraits()` does not filter on the divider), so a percentage sitting there must scale that item just
like one above. A divider-aware `ownRate` would have silently ignored half of a relic.

None of ids 1-10 carry parameter traits below their dividers today, so 5.1's scope is unchanged: the
198 above-divider parameter traits in ids 1-300 are the ones to transcribe.

**The gems are materials and are already authored correctly.** `Life Gem I` (224) is literally
`[{code:63}, {code:21, dataId:0, value:1.05}]` — a divider and a payload, nothing else. Its code-21
trait transfers to a refinement base and there scales that base's own `params` entry. That is the
intended behaviour under localisation, not a casualty of it, and the 61-trait code-21 count breaks down
as **40 gem payloads + 20 material payloads + 1 wearable** (Mesh of Fortune, id 48, which has
`params[7] = 250` for the LUK it scales, so it works).

**One consequence worth knowing rather than fixing.** A gem's percentage only does something if the base
it lands on has a base for that stat — `Life Gem I` on a weapon with `params[0] = 0` contributes nothing.
That is the design ("refined onto equip that hopefully has the stats"), and **D8's display is what makes
it legible**: the result row will read `MHP 0 → 0` beside `+5%`, so a wasted gem is visible at the moment
of choosing rather than discovered afterwards. That is an argument for D8 being in the same PR as the
arithmetic, not a follow-up.

---

## 6. Decisions

All settled. Recorded with reasoning so the reasoning does not have to be rediscovered.

**D1 — `<thisMtp:N>` stays an authoring hook, unconsumed.** RMMZ has no trait code for max tech, so
nothing can ever scale it locally, and `<maxTp:N>` already sums globally across all notes including
equipment (`Game_Battler.js:117`). The tag and its getter exist for consistency with the other
twenty-nine, and nothing reads them. Do not wire it into `maxTp` — that would duplicate `<maxTp:>`
exactly, giving one effect two spellings.

**D2 — `<this{PARAM}:N>` is identity and never transfers.** Bases describe what an item *is*, so they
sit above the divider and stay out of every transfer path. When the `<transferrableEffectsBelow>` work
lands, `this*` tags go on the non-transferable side; nothing about that is optional. Today refinement
clones the base and never merges the material's note (1.6), so this costs no change now — it is a
constraint on the pending note-merge work.

**D3 — no material will ever carry `<passive:...>`.** `passive/core/objects/Game_Actor.js:26` lists
`equippedEquips()` as a passive-state source, and passive states join `buildTraitObjects` as **states**,
so their parameter traits are global by design — that is the deliberate escape hatch for an authored
accessory that buffs its wearer. Zero weapons or armors carry one today. Enforced by authoring, not by
code: a material carrying a passive would be the one farmable route to a global percentage.

**D4 — multiplication stays; the display carries the meaning.** See 6.1 below, which is the full
argument, because this was the only genuinely open question.

**D5 — `ownRate` counts all of an item's parameter traits**, not only below-divider ones (2.3). The
alternative makes J-Base aware of JAFTING's divider convention, which the ship contract forbids.

**D6 — code 21 stays a trait.** It already has `params[]` to multiply, so it localises with no data
change (5.1).

**D7 — material payload magnitudes get re-tuned as part of the data work** (5.3), not discovered
afterwards.

**D8 — the refinement result row shows the resulting number, with the modifier on the right.**
`Window_RefinementDetails` currently draws `now / after / delta-in-points` for numeric rows
(`drawResultComparisonRow`, line 570) and a verdict word in the rightmost column. Change to:

```
ATK      40 → 50      +25%
GRD      12 → 11      -10%
```

- Columns one and two keep the `now → after` reading, which is the primary number.
- **The rightmost column shows the actual modifier** (`+25%`, `-10%`) in place of the verdict word for
  numeric rows. That column is where `new` / `up` / `unchanged` used to live.
- Non-numeric rows (granted skills, elements, flags) keep the verdict word in that column — there is
  no modifier to show, and `drawGrantedRow` (line 477) already handles them separately.
- `rowDeltaPoints` (line 359) stops feeding the third column and instead feeds the *sign* used to
  choose the modifier's colour.

**D9 — `Window_RecipeDetails` moves to `thisBParam(N)`.** Eight sites at lines 730-786 read
`output.params.at(N)` to show a crafted item's stats; an item's base now includes its tags, so those
reads would understate it. In scope for this work.

**D10 — the `sparam` floor is deferred.** A one-line change whenever it starts mattering. Noted for
whoever revisits: with J-SDP loaded, `applySdpPanelStatFloor` already clamps actor x- and s-parameters
at 0 (`sdp/core/objects/Game_Actor.js:499-523`, `PanelStatFloorDefault = 0`), so the uncovered cases
are enemies, and actors only if SDP is absent.

### 6.1 Why multiplication, and how the sign question resolves

The tension is real and has no free answer, so here is the whole shape of it.

`ownRate` multiplies the **magnitude** of an item's contribution, so a `+50%` material on an armor with
`<thisPdr:-17>` gives `-25.5` — a *stronger* reduction. That reads naturally as "the material reinforces
the armour" but inverts the trait code's literal wording, where a higher physical-damage rate means
taking more damage.

**The additive alternative was considered and rejected.** Reading a material's trait as flat points
(`local = (base + points)/100`) removes the sign ambiguity completely — the number moves in the
direction it says — and matches the additive philosophy behind every other aggregation in J-Base. It
fails for one reason: it no longer needs a base to multiply, which restores the exact piling exploit
this design exists to close. A hundred cheap `+5 GRD` materials on a sword with no parry base would give
`+500` parry again.

**Multiplication is also required in the negative direction.** Piling `-5` PDR a hundred times under an
additive rule gives `PDR = -5.0`, and physical hits would heal for five hundred percent. Stats that want
to be negative need bounding just as much as stats that want to be large, so the mechanism has to be the
same for both — and that means the sign travels with the base.

So multiplication is kept, and the sign question is handled where it actually lives: **in what the player
reads.** Three parts, in order of how much they carry:

1. **D8's display is the resolution.** Showing `PDR -17 → -25.5` makes the outcome unambiguous no matter
   what the underlying percentage says. The player never has to reason from a rate to a result, which is
   the only place the inversion could mislead. This is why D8 matters more than it looks.
2. **Author materials in "more of what it is" language.** A reinforcement material's name and
   description say it strengthens the item's defensive properties. The trait code is an implementation
   detail the player never sees.
3. **Clamp when it bites.** For PDR specifically, a floor of `0` means "immune", which is a sane ceiling
   and forecloses the heal-inversion entirely. **This is the same clamp D10 defers**, deliberately — it is
   a one-line change and there is no reason to add it before something actually misbehaves. If you arrived
   here looking for it and found D10 saying "deferred", the two agree.

**The honest caveat:** parts 2 and 3 are convention and backstop, not mechanism. Nothing *enforces* that
a material's `+50%` reads as an improvement. The only mechanical route would be a per-parameter direction
table — positive means "improve" for the lower-is-better family — and that costs exactly the
predictability the additive design was chosen for, because the trait's stored value would then no longer
mean what it says. Not recommended, recorded as the road not taken.

### 6.2 One refinement costs one count, whatever the donor carried

**This is the goal the whole design exists to enable**, and localisation is what makes it safe:

```
[base] Iron Sword (+0)  +  [donor] Iron Sword +6  =  [result] Iron Sword +1
```

The result gains every effect the donor accumulated, for **one** refinement count.

**Why this is not an exploit.** Because stacking is additive, a material is worth the same wherever it
is spent. With a base of 35 ATK, `maxRefineCount` of 6, and materials at `+20%` each:

| route | materials | ownRate | sword ATK | gain **per material** |
|---|---|---|---|---|
| six materials refined directly | 6 | ×2.2 | 77 | **+7** |
| six maxed donors fused in | 36 | ×8.2 | 287 | **+7** |

Identical per material. Fusing donors is not an amplifier — it is a way to spend *more* materials than
one item's refine budget allows, at exactly proportional cost, in exchange for the labour of building
donors. That is a crafting loop.

**Locality is what makes it proportionate.** Under global parameters that same chain added `+720%` to the
actor's whole ATK against a class curve of 306, which is unusable. Localised, it makes one sword worth
287 instead of 35 — strong, and bounded by what a sword is permitted to be worth relative to the curve.
Remove localisation and this rule cannot exist; that is the differentiation.

### 6.3 `ownRate` has no ceiling, and that is the decision

**Deliberate. Do not add one.** Written down with its reasoning so a future reader who finds a `×20`
weapon does not "fix" it.

The ceiling is patience and material supply. Materials can **never** be bought, and gems are only
craftable from midway through the game, so a surplus is something a player goes out of their way to
build rather than something that accumulates. Reaching a very high `ownRate` means having chosen to spend
the time, and that is a reward for the time sink, not a leak.

**Refinement is not the point of the game.** It is a lever for a player to ease content they are
struggling with, and a bar to clear in the postgame. A system in that role wants a soft economic brake,
not a hard mechanical wall — a wall would punish exactly the player who engaged with it most.

If the position is ever revisited, the place for a ceiling is a clamp inside `ownRate` — one method, one
line — and specifically **not** the refine counter, which 6.2 exists to free up. `maxTraitCount` cannot
serve either: same-code-and-dataId traits consolidate additively into one entry
(`TraitResolver.#combineParameterTraitsForCode`), so it caps how many *distinct* stats an item carries,
never how large any one grows. Worth keeping for its own sake; it answers a different question.

**The thing to watch, if anything.** Parry and evasion degrade differently from attack. Damage is a ratio
against enemy stats that scale with level, so a strong weapon stays inside a curve. Parry is an opposed
roll — `JABS_Engine.js:454-463` contests the defender's `grd` against the attacker's `hit` — and
**enemies carry no equipment**, so enemy accuracy cannot be refined upward while player parry can. Pushed
far enough that stops being a contest and becomes a binary. Not a reason to cap anything now; a reason to
look at parry first if the economy ever needs tightening.

**A note for whoever sees an old save behave oddly.** `stampRefinedOutput`'s contract (JaftingManager
line 109) is that a load re-derives a refined row by replaying `determineRefinementOutput` and then
stamping it. So a savefile written under the old carry-over rule will re-derive its refined weapons at a
**lower `+N`** after this change. The traits merge identically, so power is unchanged — only the displayed
count drops. Expected, not a defect.

---

## 7. Sequencing

1. `RPG_EquipItem.ownRate` plus tests (3.1, 4.1)
2. `Game_BattlerBase` hook, helpers and the three formulas, plus tests (3.2, 4.2)
3. `Game_Actor.localisedEquips` and `paramPlus`, plus tests (3.3, 4.3)
4. The `Game_Actor` transient declaration for the new cache (3.4)
5. One-count-per-refinement, both sites, plus boundary tests (3.5)
6. `bun run hotfix`, coverage read, mutation pass (4.4, 4.5)
7. `Window_RefinementDetails` result-row rework per D8, and `Window_RecipeDetails` per D9
8. `ca` data migration (5)
9. Version bumps and `CHANGELOG:` blocks — **PR time only**, reverse-analysed from the diff per ship.
   Ships whose trees change: **`J-Base`** (1-4), **`J-Base-Save`** (4), **`J-JAFTING-Refine`** (5, 7) and
   **`J-JAFTING-Create`** (7).

**Steps 1-6 are one unit and must not be split.** Step 7 is display-only, but 5.4 argues it belongs in
the same PR: without it, a gem refined onto a base lacking the matching stat is silently worthless.

### 7.1 Total gameplay effect

Stated plainly, because the code change is far broader than the behaviour change.

**Unchanged — the bulk of it.** The 567 transcribed traits are behaviour-identical. `<thisHit:35>` summed
is the same number as `code 22 value 0.35` summed, and with no material percentage present `ownRate` is
`1.0`, so the localised result equals today's exactly. Weapon accuracy and crit, armor evasion and parry
all land where they already sit. The 40 gem payloads and 20 material payloads are unaffected — they
transfer to a base and scale it, which is the design.

**Changed, but unobservable.** Mesh of Fortune (armor 48) stops multiplying the wearer's whole LUK and
instead contributes `250 × 1.25` of its own. Undeveloped content the player cannot acquire yet, so the
balance shift cannot be seen.

**Changed, and this is the point.** Everything else is refinement: a material's percentage scales the item
it lands on rather than its wearer, so piling a stat onto gear with no base for it does nothing;
`Iron Sword +0 + Iron Sword +6 = Iron Sword +1` carrying every effect, for one count; the `+6`-onto-`+3`
block disappears; and magnitude is bounded by material supply while locality keeps the result proportionate
to what one item is allowed to be worth.

**No player-visible regression.** An earlier draft of this plan claimed the 40 gems would go inert. That
was a miscount that ignored divider position — the gems are materials, correctly authored — and it is
wrong.

**Steps 1-4 are not observably inert, and the game must not be evaluated between step 2 and step 5.**

No equipment carries a `<this{PARAM}:N>` tag yet, so the local term is zero — but the *subtraction* is
live the moment step 2 lands. All 277 weapon and 226 armor code-22 traits, plus the 18 and 46 code-23
ones, stop contributing anything. Concretely, per §1.8: weapon accuracy and crit, and armor evasion and
parry, read zero until the data pass restores them as tags.

That is the intended trajectory, not a defect — the traits are being moved, and for one step they are
in neither place. It does mean:

- The two repos' PRs **merge together**, never in sequence.
- Do not playtest between steps 2 and 5, and do not file the missing accuracy as a bug.
- `bun run hotfix` staying green through step 4 is the correct signal at that point, since the suite
  tests the arithmetic rather than the authored data.
