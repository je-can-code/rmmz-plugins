---
status: done
area: bug
---

> **Shipped 2026-08-06.** All eight guards read `_key()`, both reclaim paths key off the instance slot, and
> `clearLedgerForDatum` no longer reaches a template bag it does not own. 456 jafting tests green inside a green
> `hotfix` (13,667 total).
>
> **Verified twice over, because green tests were what hid this in the first place.** Reverting the reads to `id`
> turns 11 tests red — the five new cases plus six existing ones strengthened onto divergent fixtures — so none of
> them pass tautologically. And the standalone probe that originally demonstrated the bug now reports the lineage
> spliced, slot 2001 blanked, base row 5 untouched, and the base row's salvage bag intact.
>
> **Reclamation moved to a deferred sweep in the same pass, because the fix made a dead branch live.** Reclamation
> had never executed in a real game, and its assumption was wrong: `numItems() === 0` means "not in the bag", not
> "gone from the game". Equipping is a `loseItem`, and `tradeItemWithParty` spends the row *before* `changeEquip`
> installs it — so a weapon mid-equip is held nowhere, and the newly-live branch would have blanked its slot and
> spliced its lineage out from under the actor putting it on.
>
> Collection now runs from `Scene_Map.start` (`JaftingSalvageManager.reclaimUnreferencedDynamicSlots`), asking
> "does anything still hold this row" against inventory **and** every actor the save has built — not the party
> roster, since Chef Adventure splits its two leads across halves of a dungeon and the absent one is still wearing
> their gear. Running late is free: the slot allocator only counts upward, so nothing ever waits on a freed slot,
> which makes collection pure garbage collection rather than allocation relief.
>
> **The salvage refund path was rebuilt in the same pass**, because tracing the worn-gear question exposed the
> same "a count is not an answer" mistake twice more in one model:
>
> - **A live materials exploit.** `bag.rows` is the *sum* across every stamped copy, and `refundLedgerRows` treated
>   that sum as one copy's cost. Three swords each costing two horns refunded six horns *per copy dismantled* —
>   craft a batch, take it apart one at a time, walk away with stack-height times your materials. Verified by
>   running it. Refunds now come from the specific copies destroyed, LIFO, which is what the per-copy
>   `unitLedgers` were recording all along and no code had ever read.
> - **Worn copies losing their history.** `syncPartyLedgerUnitCountToStack` sized the per-copy array off `numItems`,
>   so equipping your last crafted sword popped its ledger and pruned the bag. Sizing now counts inventory **plus**
>   worn copies (tallied, not detected — two accessory slots hold two of the same thing), growth stays immediate,
>   and shrinking moved to `resizeTemplateLedgerBags` on `Scene_Map.start`. Dismantling is the one case that still
>   discards on the spot, because destruction is the one unambiguous removal.
>
> **Refund rate is now half, rounded up** (`refundableRow`) — JE's call. Rounding up is the deliberate direction:
> a one-of component comes back whole, so a dish built from several single ingredients does not refund nothing.
> Halving happens per copy *before* rows merge, or two copies costing nine would round once against eighteen.
>
> Salvage is not hypothetical: `salvage-menu-switch` is `0` in Chef Adventure, so "Salvage" is the first row of the
> JAFTING hub in the shipping game and the exploit was reachable.
>
> **What changed against the plan:** the sweep, which the plan did not contain — it was written before the
> reachability problem was understood. Also fixed the `getLedgerForDatum` fall-through, one more member of the
> same family the plan claimed to have enumerated and had not. Two extra fixture sites turned up that the plan
> had not named — bare `kindlessDatum()` / no-recognizable-kind object literals in
> `salvage-unit-ledgers.test.js` that sidestep the `fakeDatum` helper — and one existing case
> (`getLedgerUnitForDatum` ignoring the ordinal) was rebuilt onto a divergent pair so it actually exercises the
> guard it names. Everything listed as out of scope stayed out of scope.

# JAFTING salvage asks `id` where it means `index`, so dynamic rows are never reclaimed

## Source

- [`src/plugins/jafting/core/managers/JaftingSalvageManager.js`](src/plugins/jafting/core/managers/JaftingSalvageManager.js) — every affected site
- [`src/plugins/_base/core/database/base/RPG_Base.js`](src/plugins/_base/core/database/base/RPG_Base.js) — where `id` and `index` are established
- [`src/plugins/jafting/ext/refine/managers/JaftingManager.js`](src/plugins/jafting/ext/refine/managers/JaftingManager.js) — the writer, which is already correct

## Context

`id` and `index` answer two different questions, and the split is deliberate:

- **`id` — what this row is OF.** Iron Sword. Shared by every instance.
- **`index` — which instance this is.** The `+2` with the fire trait, living in its own datastore slot.

For anything authored in the RMMZ database editor the two coincide. Dynamic rows are where they
diverge, and that divergence is the entire point: `id` keeps saying "Iron Sword" while `index` says
"but this particular one."

The writer honours that. `RPG_Base`'s constructor sets `this.id = baseItem.id`; `_key()` returns
`index`; [`stampRefinedOutput`](src/plugins/jafting/ext/refine/managers/JaftingManager.js#L122) moves
only the index via `_updateIndex`. J-Base's `gainItem` / `numItems` key their containers on `_key()`.
[`lineageForDatum`](src/plugins/jafting/ext/refine/managers/JaftingManager.js#L232) reads `_key()` and
carries a comment explaining exactly why the id would be the wrong question.

`JaftingSalvageManager` asks the wrong question in eight methods. Its own constant is named
`DynamicEquip**Index**Min` — the name was always right, the field read beside it was not.

## Severity

**High, and it is a live save-integrity bug in shipped code.** Verified empirically by running a
realistically shaped refined row (`id: 5`, `index: 2001`) through `afterPartyLostItem`:

```
lineage still tracked (leak):              [{"index":2001}]
dynamic slot 2001 reclaimed?:              false
base weapon row 5 blanked?:                false
base weapon's ledger bag 'w:5' survived?:  false
```

Three consequences, in descending order of how much a player would notice:

1. **Losing the last copy of a refined item deletes the salvage stamp from the ordinary items it was
   made from.** `clearLedgerForDatum` builds the container key from `id`, so dropping a refined Iron
   Sword deletes bag `w:5` — the bag belonging to the plain Iron Swords still in the bag. Those stop
   refunding anything on dismantle.
2. **Reclamation has never once fired.** `afterPartyLostItem`'s dispatch guard reads `id`, which for a
   refined row is below the threshold, so `reclaimDynamicWeaponSlot` is unreachable in a real game. The
   slot is never blanked and the lineage is never spliced, so every refinement a player ever discards
   stays in `getRefinedWeapons()` and gets replayed into `$data*` on every subsequent load. Unbounded
   growth across a playthrough.
3. **Ledger writes for dynamic rows go to the template bag.** `appendStampedUnitsToPartyStack` and
   `mergeLedgerIntoPartyOrDatum` both fail their dynamic check and fall through to the party-bag path
   keyed on the base's id, cross-contaminating the base row's stack ledger. Reads are unaffected —
   `getLedgerForDatum` checks `_jaftingSalvageLedger` before it computes a key.

There is one accidental mercy: because the guard at
[L978](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L978) never passes, the line that
would do `$dataWeapons[5] = createEmpty(5)` — blanking a real database weapon — never runs either. Fix
the guard without fixing the body and that becomes live. **These two changes must land together.**

## Why 100% test coverage did not catch it

All three fixture helpers are `fakeDatum(kind, id)` returning `{ id, isItem, isWeapon, isArmor }` —
`id` and nothing else. They were built from what the implementation *reads* rather than from what a
caller actually *hands it*, so `id` and `index` were never distinguishable and the bug was invisible at
any coverage percentage. Same failure mode as the four bugs that survived 100% coverage previously.

## Work

### 1. Guards that mean "is this a dynamic instance?" — 7 sites, `datum.id` to `datum._key()`

| Line | Method |
|---|---|
| [264](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L264) | `getLedgerUnitForDatum` |
| [336](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L336) | `afterPartyGainedItem` |
| [398](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L398) | `mergeLedgerIntoPartyOrDatum` |
| [425](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L425) | `appendStampedUnitsToPartyStack` |
| [953](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L953) | `afterPartyLostItem`, party-bag prune block |
| [978](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L978) | `afterPartyLostItem`, weapon reclaim dispatch |
| [986](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L986) | `afterPartyLostItem`, armor reclaim dispatch |

### 2. Reclamation slot arithmetic — 8 reads across 6 statements

`reclaimDynamicWeaponSlot` [L1004](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L1004)
(`weapons[i].index === weaponDatum.id`), [L1011](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L1011)
(both reads), [L1012](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L1012); and the armor
twins at [L1027](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L1027),
[L1034](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L1034) (both reads),
[L1035](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L1035).

`lineage.index` is an index, `$dataWeapons[...]` is subscripted by index, and the
`onAfterDynamicSlotReclaimed` hook's parameter is documented as a slot id. All three are being fed an
`id` today.

### 3. `clearLedgerForDatum` needs the guard it never had

[L308](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L308) nulls the instance ledger and
then deletes the template bag unconditionally. A dynamic row has no template bag of its own, so the
delete can only ever hit somebody else's. Gate the delete behind the same `_key()` check: null the
instance ledger, leave the template bag alone. **This is the line responsible for consequence 1.**

### 4. Class docstring

[L12](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L12) documents the storage split as
"Dynamic refinement rows (`id` ≥ DynamicEquipIndexMin)". It is the sentence that taught the bug to
everything below it. Rewrite it around `_key()`, and state the `id`-vs-`index` distinction outright so
the next reader inherits the rule instead of the mistake.

### 5. Rebuild the fixtures from the caller's shape

Three helpers, all needing `index` and `_key()` added:

- [`test/plugins/jafting/core/managers/salvage-refinement-lineage.test.js`](test/plugins/jafting/core/managers/salvage-refinement-lineage.test.js) `fakeDatum` (L46)
- [`test/plugins/jafting/_component/core-salvage-manager-direct.test.js`](test/plugins/jafting/_component/core-salvage-manager-direct.test.js) `fakeDatum` (L32)
- [`test/plugins/jafting/core/managers/salvage-unit-ledgers.test.js`](test/plugins/jafting/core/managers/salvage-unit-ledgers.test.js) `fakeDatum` (L27)

Rules for the rebuild:

- Default `index` to `id`, matching a database-authored row, so existing cases keep their meaning.
- Every reclamation case gets an explicit **divergent** pair — `id: 5, index: 2001` — because a fixture
  where the two agree cannot fail this bug no matter how the production code reads them.
- The `$gameParty.numItems` stub in `core-salvage-manager-direct.test.js` currently keys off
  `containerKeyFromDatum` (an `id` key). Real `numItems` keys on `_key()`. Re-key the stub, or a test
  cannot tell a refined instance apart from the base stack it was cloned from.

New cases to add, one per branch, each pinning a consequence above rather than a line:

- losing the last refined sword leaves the base sword's template bag intact
- losing the last refined sword splices its lineage and blanks its own slot
- ...and does **not** blank the base row's slot
- a stamped dynamic row writes to `_jaftingSalvageLedger`, not to the template bag

### 6. `bun run hotfix`

Full suite plus the eleven source gates. Expect red before green: the fixtures will throw
`_key is not a function` the moment step 1 lands, which is the correct failure.

## Explicitly out of scope

- **`containerKeyFromDatum` stays on `id`.** The party bag is per-template by design — its own
  docstring says vanilla stacks "cannot diverge per-instance" — so grouping every Iron Sword under
  `w:2` is correct. It also matches the planned expandable-list UI, which groups by `id` and expands
  the indices beneath it. Once step 1 lands, dynamic rows stop reaching this path at all.
- **`JaftingSalvageLedgerRow.id` is a latent, separate naming problem.** `refundLedgerRows` and
  `expandWeaponArmorRowsForSalvage` both subscript `$dataWeapons[row.id]`, so by usage that field is an
  *index*, while [L554](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L554),
  [L563](src/plugins/jafting/core/managers/JaftingSalvageManager.js#L563) and
  [`JaftingSalvageLedger.js#L223`](src/plugins/jafting/core/__models/JaftingSalvageLedger.js#L223) fill
  it from `datum.id`. Nothing is wrong today because every row that reaches it is a vanilla one where
  the two agree. It becomes real the first time a dynamic row lands in a ledger, which is what the
  finishing-touches work would do. Decide it there, not here.
- **`mergeLedgerIntoPartyOrDatum` has zero callers in `src/`.** Fix its guard along with the rest
  rather than leaving one site wrong, but flag the method itself for a keep-or-delete call.
- **Version bumps and changelogs.** PR-time work, per repo policy — not while building.

## Notes

Blocks the JAFTING finishing-touches work. That feature mints **item** rows into a dynamic range, and
items genuinely stack, so the party-bag path stops being a bypassed branch and becomes the main road.
Every guard here would be wrong for garnished dishes too, and `containerKeyFromDatum` would collide
every garnished dish with its ungarnished base. Land this first.
