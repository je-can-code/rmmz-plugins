//region JaftingSalvageManager
import JaftingSalvageLedger from '../__models/JaftingSalvageLedger.js';
import JaftingSalvageLedgerRow from '../__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../__models/JaftingSalvageLedgerSnapshot.js';
import JaftingSalvagePartyLedgerBag from '../__models/JaftingSalvagePartyLedgerBag.js';

/**
 * Orchestrates **where** ledgers live, **when** they merge from craft/refine, **how** dismantle pays out, and
 * **cleanup** when the last copy of dynamic refinement rows disappears from inventory.<br>
 * <br>
 * **`id` and `index` answer different questions, and every branch below depends on the difference.**<br>
 * `id` is *what a row is OF* - "an Iron Sword" - and every instance of that thing shares it. `index` is *which
 * instance this is* - the one carrying `+2` and a fire trait, in its own datastore slot. Rows authored in the RMMZ
 * database editor have the two coincide, which is exactly why reading the wrong one looks fine for a long time.
 * Dynamic rows are where they diverge: {@link JaftingManager.stampRefinedOutput} moves only the index, so a refined
 * Iron Sword reports its base's `id` forever. **Ask `_key()` - never `id` - when the question is "is this a dynamic
 * instance?", and note that this class's threshold constant is named for the index it compares against.**<br>
 * <br>
 * **Two storage homes (read this before touching `getLedger*`):**<br>
 * - **Dynamic refinement rows** (`_key()` ≥ {@link JaftingSalvageManager.DynamicEquipIndexMin}) — stamp rides on
 *   `datum._jaftingSalvageLedger` because each `$dataWeapons` / `$dataArmors` slot is already unique.<br>
 * - **Vanilla stack templates** — stamp lives in `$gameParty._j._jafting._salvageLedgers[containerKey]` as a
 * {@link JaftingSalvagePartyLedgerBag} with `unitLedgers[]` parallel to stack height. The key is built from `id` on
 * purpose: every Iron Sword shares one bag, because a stack cannot diverge per-instance.<br>
 * <br>
 * Saved shapes are {@link JaftingSalvageLedgerSnapshot} and {@link JaftingSalvagePartyLedgerBag}; each stamped line is
 * a {@link JaftingSalvageLedgerRow}. Merge math stays on {@link JaftingSalvageLedger}.
 */
class JaftingSalvageManager
{
  /**
   * Dynamic weapon/armor indices created by JAFTING Refinement begin here.<br>
   * Must stay aligned with {@link JaftingManager.StartingIndex} when Refinement is installed.
   */
  static DynamicEquipIndexMin = 2001;

  /**
   * Extension seam: runs after a dynamic refinement slot drops out of inventory and `$dataWeapons` / `$dataArmors`
   * is reset to {@link RPG_Weapon.createEmpty} / {@link RPG_Armor.createEmpty}.<br>
   * Projects may replace this function on {@link JaftingSalvageManager} to chain extra bookkeeping—default is a no-op.
   *
   * @param {'weapon'|'armor'} kind The kind driving this step.
   * @param {number} slotId The slot id driving this step.
   */
  /* eslint-disable no-unused-vars -- default body is empty; parameters define the hook contract for replacements. */
  static onAfterDynamicSlotReclaimed(kind, slotId)
  {
  }
  /* eslint-enable no-unused-vars */

  /**
   * Container key for party-side ledger maps (vanilla stacks cannot diverge per-instance).
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @returns {string|null}
   */
  static containerKeyFromDatum(datum)
  {
    // ask the hydrated RPG wrapper—never DataManager checks here (refined ids may not sit where vanilla expects).
    if (datum.isItem())
    {
      return `i:${datum.id}`;
    }

    if (datum.isWeapon())
    {
      return `w:${datum.id}`;
    }

    if (datum.isArmor())
    {
      return `a:${datum.id}`;
    }

    return null;
  }

  /**
   * Ensures `$gameParty._j._jafting._salvageLedgers` exists.<br>
   * Invoked only from {@link DataManager.createGameObjects} and {@link DataManager.extractSaveContents} so party bags
   * are ready before any gameplay touches ledgers—ledger readers do not lazy-init this graph.
   */
  static initPartySalvageStorage()
  {
    if (!$gameParty)
    {
      return;
    }

    $gameParty._j ||= {};
    $gameParty._j._jafting ||= {};
    $gameParty._j._jafting._salvageLedgers ||= {};
  }

  /**
   * Rebuilds merged `bag.rows` from every non-empty per-slot ledger (dismantle still reads merged rows only).
   *
   * @param {JaftingSalvagePartyLedgerBag} bag The bag driving this step.
   */
  static recomputeMergedRowsFromPartyLedgerBag(bag)
  {
    // `bag.rows` is the **union** of every stamped stack slot—salvage list + layout helpers read it without walking
    // `unitLedgers[]` one by one. Rebuild from slots so losing the top copy does not leave stale merged totals behind.
    let acc = [];

    if (bag.unitLedgers && bag.unitLedgers.length > 0)
    {
      for (let i = 0; i < bag.unitLedgers.length; i++)
      {
        const unit = bag.unitLedgers[i];

        if (unit && unit.rows && unit.rows.length > 0)
        {
          acc = JaftingSalvageLedger.mergeRowArrays(acc, JaftingSalvageLedger.cloneRows(unit.rows));
        }
      }
    }

    bag.rows = JaftingSalvageLedger.mergeDuplicateRows(acc);
  }

  /**
   * How many copies of a template row the playthrough holds, wherever they are.
   *
   * The bag is only half of it. **Equipping does not consume a copy, but it does remove it from the container** -
   * so a stack of one that somebody is wearing reads as zero, and sizing the per-copy array off `numItems` alone
   * would throw that copy's provenance away and refund nothing when it is eventually taken apart. Worn copies are
   * counted rather than merely detected, because two accessory slots can hold two of the same thing.
   *
   * @param {RPG_Base} datum The template row being counted.
   * @returns {number}
   */
  static heldCountIncludingWorn(datum)
  {
    const slot = datum._key();
    const worn = $gameActors.existingActors()
      .reduce((tally, actor) => tally + JaftingSalvageManager.wornCountForActor(actor, slot), 0);

    return $gameParty.numItems(datum) + worn;
  }

  /**
   * How many copies of one slot a single actor is wearing.
   *
   * @param {Game_Actor} actor The actor whose equipment is being read.
   * @param {number} slot The datastore slot being counted.
   * @returns {number}
   */
  static wornCountForActor(actor, slot)
  {
    return actor.equips()
      .filter(equip => equip !== null && equip._key() === slot)
      .length;
  }

  /**
   * Grows the per-copy ledger array to cover every copy held, and never shrinks it.
   *
   * **Growth is safe to do immediately; shrinking is not.** A copy leaving the container might have been sold, or
   * might have been equipped, or might be mid-transaction in a trade that has not installed it anywhere yet - and
   * at the moment this runs there is no way to tell those apart. Shrinking therefore belongs to
   * {@link resizeTemplateLedgerBags}, which runs from a settled state. Dismantling is the one exception, because
   * destruction is unambiguous: {@link releaseSalvagedUnitLedgers} drops those entries on the spot.
   *
   * @param {JaftingSalvagePartyLedgerBag} bag The bag driving this step.
   * @param {RPG_Base} datum The datum driving this step.
   */
  static syncPartyLedgerUnitCountToStack(bag, datum)
  {
    const held = JaftingSalvageManager.heldCountIncludingWorn(datum);

    if (!Array.isArray(bag.unitLedgers))
    {
      bag.unitLedgers = [];
    }

    // keep looping while bag.unitLedgers.length < held.
    while (bag.unitLedgers.length < held)
    {
      bag.unitLedgers.push(null);
    }

    JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);
  }

  /**
   * Shrinks every template bag back to the number of copies actually held, and drops the ones left empty.
   *
   * The deferred half of {@link syncPartyLedgerUnitCountToStack}, and the stack-shaped twin of
   * {@link reclaimUnreferencedDynamicSlots} - same reasoning, same safe moment, so they run from the same place.
   * Trimming from the tail matches the LIFO order copies are stamped and dismantled in.
   */
  static resizeTemplateLedgerBags()
  {
    const ledgers = $gameParty._j._jafting._salvageLedgers;

    Object.keys(ledgers)
      .forEach(key => JaftingSalvageManager.resizeTemplateLedgerBag(key));
  }

  /**
   * Shrinks one template bag to what is held, then prunes it if nothing is left.
   *
   * @param {string} key The container key of the bag to resize.
   */
  static resizeTemplateLedgerBag(key)
  {
    const bag = $gameParty._j._jafting._salvageLedgers[key];
    const datum = JaftingSalvageManager.templateRowForContainerKey(key);
    const held = JaftingSalvageManager.heldCountIncludingWorn(datum);

    if (bag.unitLedgers.length > held)
    {
      bag.unitLedgers.splice(held);
      JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);
    }

    JaftingSalvageManager.pruneEmptyPartyLedgerBag(key);
  }

  /**
   * Resolves a container key back to the database row it describes.
   *
   * Safe to index a datastore with the id half of the key because **only template rows ever reach a party bag** -
   * a dynamic instance keeps its stamp on the row itself and is turned away by every path that writes one - and a
   * template row's id and index are the same number by definition.
   *
   * @param {string} key A container key shaped `i:12`, `w:4`, or `a:9`.
   * @returns {RPG_Item|RPG_Weapon|RPG_Armor}
   */
  static templateRowForContainerKey(key)
  {
    const [ letter, rawId ] = key.split(':');
    const id = Number(rawId);

    if (letter === 'i') return $dataItems[id];

    if (letter === 'w') return $dataWeapons[id];

    return $dataArmors[id];
  }

  /**
   * Ensures the party bag has a parallel {@link JaftingSalvagePartyLedgerBag#unitLedgers} array and matches current
   * `numItems`.
   *
   * @param {JaftingSalvagePartyLedgerBag|{ unitLedgers?: unknown[], rows?: unknown[] }} bag
   * @param {RPG_Base} datum The datum driving this step.
   */
  static coercePartyLedgerBagShapeForDatum(bag, datum)
  {
    const key = JaftingSalvageManager.containerKeyFromDatum(datum);
    const working = JaftingSalvagePartyLedgerBag.coerce(bag);

    // coerce mints a fresh bag when the slot is absent—write it back so later reads see it.
    if (working !== bag)
    {
      $gameParty._j._jafting._salvageLedgers[key] = working;
    }

    // shape-fixing the unit array belongs to the sync alone - it normalizes before it reads, so a bag
    // arriving without one is already handled by the time anything here could care.
    JaftingSalvageManager.syncPartyLedgerUnitCountToStack(working, datum);
  }

  /**
   * Deletes an empty keyed bag when merged rows and every slot are lineage-free.
   *
   * @param {string} key The key driving this step.
   */
  static pruneEmptyPartyLedgerBag(key)
  {
    // keyed map is unbounded—drop the entry once both the merged summary **and** every per-slot snapshot are empty so
    // saves stay lean and `getLedgerForDatum` stops returning ghost bags.
    let bag = $gameParty._j._jafting._salvageLedgers[key];

    if (!bag)
    {
      return;
    }

    bag = JaftingSalvagePartyLedgerBag.coerce(bag);

    let anyUnitRows = false;

    if (Array.isArray(bag.unitLedgers))
    {
      for (let i = 0; i < bag.unitLedgers.length; i++)
      {
        const u = bag.unitLedgers[i];

        if (u && u.rows && u.rows.length > 0)
        {
          anyUnitRows = true;
          break;
        }
      }
    }

    const mergedEmpty = !bag.rows || bag.rows.length === 0;

    if (mergedEmpty && anyUnitRows === false)
    {
      delete $gameParty._j._jafting._salvageLedgers[key];
    }
  }

  /**
   * Reads the salvage ledger attached to an RPG datum or the party bag for stacked goods.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @returns {JaftingSalvageLedgerSnapshot|JaftingSalvagePartyLedgerBag|null}
   */
  static getLedgerForDatum(datum)
  {
    // salvage UI layout runs during scene create before the candidate window has a highlighted row—`item()` is empty.
    if (datum === null || datum === undefined)
    {
      return null;
    }

    // refinement allocates unique datastore indices—those ledgers ride on the RPG row itself.
    if (datum._jaftingSalvageLedger)
    {
      return datum._jaftingSalvageLedger;
    }

    // a dynamic instance whose own ledger is empty has no bag to fall back on, and the key below would resolve to
    // the *base* it was cloned from - so continuing would read somebody else's history and, worse, resize that
    // stack's per-unit array to this instance's count on the way past.
    if (datum._key() >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      return null;
    }

    // vanilla stacks only track counts per id, so shared-template crafted goods stash their ledger on the party bag.
    const key = JaftingSalvageManager.containerKeyFromDatum(datum);
    let bag = $gameParty._j._jafting._salvageLedgers[key];

    if (bag)
    {
      JaftingSalvageManager.coercePartyLedgerBagShapeForDatum(bag, datum);
      bag = $gameParty._j._jafting._salvageLedgers[key];
    }

    if (bag && bag.rows && bag.rows.length > 0)
    {
      return bag;
    }

    return null;
  }

  /**
   * Reads the salvage ledger for one stack index (party bag) or the whole dynamic row ledger.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @param {number|null|undefined} unitOrdinal The unit ordinal driving this step.
   * @returns {JaftingSalvageLedgerSnapshot|JaftingSalvagePartyLedgerBag|null}
   */
  static getLedgerUnitForDatum(datum, unitOrdinal)
  {
    if (datum === null || datum === undefined)
    {
      return null;
    }

    // refinement slots already own a single snapshot on the row—ignore stack ordinals (UI still passes per-slot
    // indices). the slot is the instance, so `_key()` answers this and `id` would answer about the base template.
    if (datum._key() >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      return JaftingSalvageManager.getLedgerForDatum(datum);
    }

    if (unitOrdinal === null || unitOrdinal === undefined)
    {
      return JaftingSalvageManager.getLedgerForDatum(datum);
    }

    const key = JaftingSalvageManager.containerKeyFromDatum(datum);

    if (!key)
    {
      return null;
    }

    // static-template stacks: each physical copy has its own snapshot in `unitLedgers[]` so dismantle matches the slot
    // the player expanded in salvage UI—merged `bag.rows` stays the shared summary for the whole stack.
    let bag = $gameParty._j._jafting._salvageLedgers[key];

    if (!bag)
    {
      return null;
    }

    JaftingSalvageManager.coercePartyLedgerBagShapeForDatum(bag, datum);
    bag = $gameParty._j._jafting._salvageLedgers[key];

    const unit = bag.unitLedgers[unitOrdinal];

    if (!unit || !unit.rows || unit.rows.length === 0)
    {
      return null;
    }

    return unit;
  }

  /**
   * Clears ledger storage for a datum everywhere it might live.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   */
  static clearLedgerForDatum(datum)
  {
    if (datum._jaftingSalvageLedger)
    {
      datum._jaftingSalvageLedger = null;
    }

    // a dynamic instance never had a template bag of its own, and its container key resolves to the *base* it was
    // cloned from - so deleting one here can only ever throw away a bag that belongs to rows the player still owns.
    // discarding the last refined Iron Sword must not strip the salvage stamp off the ordinary Iron Swords.
    if (datum._key() >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      return;
    }

    const key = JaftingSalvageManager.containerKeyFromDatum(datum);

    if (key)
    {
      delete $gameParty._j._jafting._salvageLedgers[key];
    }
  }

  /**
   * Party hook after items enter inventory — grow per-slot lineage arrays for static-template stacks.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} itemDatum The item datum driving this step.
   * @param {number} amountGained The amount gained driving this step.
   */
  static afterPartyGainedItem(itemDatum, amountGained)
  {
    if (!itemDatum || amountGained < 1)
    {
      return;
    }

    // dynamic instances keep their stamp on the row itself and have no template bag to grow.
    if (itemDatum._key() >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      return;
    }

    const key = JaftingSalvageManager.containerKeyFromDatum(itemDatum);

    if (!key)
    {
      return;
    }

    JaftingSalvageManager.initPartySalvageStorage();
    const bag = $gameParty._j._jafting._salvageLedgers[key];

    if (!bag)
    {
      return;
    }

    JaftingSalvageManager.coercePartyLedgerBagShapeForDatum(bag, itemDatum);
    JaftingSalvageManager.pruneEmptyPartyLedgerBag(key);
  }

  /**
   * After crafting succeeds, stamps outputs using ingredient-derived ledger rows (deduped).
   *
   * @param {CraftingRecipe} recipe The recipe driving this step.
   * @param {Map<number, RPG_Item|RPG_Weapon|RPG_Armor>} selections The entry spent for each
   * categorical ingredient, keyed by its index in the recipe's ingredients.
   */
  static applyCraftRecipeOutputs(recipe, selections = new Map())
  {
    const ingredientRows = JaftingSalvageLedger.rowsFromCraftingComponents(recipe.ingredients, selections);
    const shell = new JaftingSalvageLedgerSnapshot(ingredientRows);

    for (let i = 0; i < recipe.outputs.length; i++)
    {
      const component = recipe.outputs[i];

      if (component.isDatabaseEntry())
      {
        const datum = component.getItem();

        // clone per output row so multi-output recipes cannot accidentally share one mutable array reference.
        const snapshot = JaftingSalvageLedgerSnapshot.cloneFromLedger(shell);

        JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, snapshot, component.quantity());
      }
    }
  }

  /**
   * Merges an incoming ledger snapshot into whatever storage backs {@link datum}.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @param {JaftingSalvageLedgerSnapshot|{ rows: JaftingSalvageLedgerRow[] }} incomingLedger
   */
  static mergeLedgerIntoPartyOrDatum(datum, incomingLedger)
  {
    // refinement output rows are unique `$data*` instances—merge straight onto the RPG object. stacks instead grow
    // `unitLedgers[]` so each physical copy keeps its own dismantle story.
    if (datum._key() >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      // dynamic refinement rows are unique instances—ledger travels with the RPG object in `$data*`.
      const existingRows = JaftingSalvageLedgerSnapshot.rowsFrom(datum._jaftingSalvageLedger);
      const incomingRows = JaftingSalvageLedgerSnapshot.rowsFrom(incomingLedger);

      datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot(
        JaftingSalvageLedger.mergeRowArrays(existingRows, incomingRows),
      );

      // exit early without a payload.
      return;
    }

    JaftingSalvageManager.appendStampedUnitsToPartyStack(datum, incomingLedger, 1);
  }

  /**
   * Assigns freshly crafted lineage snapshots onto the last stampedCount stack slots (LIFO stack order).<br>
   * Call after {@link Game_Party.prototype.gainItem} has already raised counts (see {@link CraftingRecipe#craft}).
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @param {JaftingSalvageLedgerSnapshot|{ rows: JaftingSalvageLedgerRow[] }} incomingLedger
   * @param {number} stampedCount The stamped count driving this step.
   */
  static appendStampedUnitsToPartyStack(datum, incomingLedger, stampedCount)
  {
    // a dynamic instance has no stack to append to; its stamp belongs on the row.
    if (datum._key() >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      return;
    }

    const key = JaftingSalvageManager.containerKeyFromDatum(datum);

    if (!key)
    {
      return;
    }

    if (stampedCount < 1)
    {
      return;
    }

    JaftingSalvageManager.initPartySalvageStorage();
    const ledgers = $gameParty._j._jafting._salvageLedgers;
    let bag = ledgers[key];

    if (!bag)
    {
      bag = new JaftingSalvagePartyLedgerBag();
      ledgers[key] = bag;
    }

    JaftingSalvageManager.coercePartyLedgerBagShapeForDatum(bag, datum);
    bag = $gameParty._j._jafting._salvageLedgers[key];

    const n = $gameParty.numItems(datum);
    const start = Math.max(0, n - stampedCount);

    // only the tail of the stack changed—older slots keep whatever stamp they already carried from prior crafts.
    for (let i = start; i < n; i++)
    {
      bag.unitLedgers[i] = JaftingSalvageLedgerSnapshot.cloneFromLedger(incomingLedger);
    }

    JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);
  }

  /**
   * Builds the merged salvage ledger that should attach to refined output equipment.<br>
   * <br>
   * **Pipeline:** clone the base stamp, optionally fold donor rows, always end on a deduped snapshot so duplicate
   * `t:id` keys from parallel crafts collapse cleanly.<br>
   * A stamped donor merges first. Ingredient-class gear without a nested ledger still gets a **synthetic** single row
   * so dismantle refunds the part. The final `return` catches everything else — non-equip donors and the gold-only
   * vendor shells that contribute no rows at all — with base lineage alone defining dismantle.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} baseDatum The base datum driving this step.
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} materialDatum The material datum driving this step.
   * @returns {JaftingSalvageLedgerSnapshot}
   */
  static buildRefinementOutputLedger(baseDatum, materialDatum)
  {
    // carry dismantle history from the base (craft + every prior refine merge), then fold in whatever the material
    // contributed—stamped donor ledger, ingredient-class part row, or nothing when the donor was a bare vendor shell.
    const baseLedger = JaftingSalvageManager.getLedgerForDatum(baseDatum);
    // clone so merge helpers never mutate party storage or the dynamic RPG row still equipped in the list window.
    const baseRows = baseLedger && baseLedger.rows
      ? JaftingSalvageLedger.cloneRows(baseLedger.rows)
      : [];

    const materialLedger = JaftingSalvageManager.getLedgerForDatum(materialDatum);

    // another crafted piece donated its whole stamped ledger—concatenate lineage for dismantle tracking.
    if (materialLedger && materialLedger.rows && materialLedger.rows.length > 0)
    {
      return new JaftingSalvageLedgerSnapshot(
        JaftingSalvageLedger.mergeRowArrays(baseRows, materialLedger.rows),
      );
    }

    if (materialDatum.isArmor()
      && materialDatum.atypeId === JaftingSalvageLedger.getMaterialArmorTypeId())
    {
      // single armor-row snapshot for ingredient-type monster drops consumed as material.
      const partRows = [
        new JaftingSalvageLedgerRow('a', materialDatum.id, 1),
      ];

      return new JaftingSalvageLedgerSnapshot(JaftingSalvageLedger.mergeRowArrays(baseRows, partRows));
    }

    if (JaftingSalvageLedger.isMaterialWeaponDatum(materialDatum))
    {
      const partRows = [
        new JaftingSalvageLedgerRow('w', materialDatum.id, 1),
      ];

      return new JaftingSalvageLedgerSnapshot(JaftingSalvageLedger.mergeRowArrays(baseRows, partRows));
    }

    // stack items and other donors that are not vendor shells still land here—no extra rows beyond the base stamp.
    return new JaftingSalvageLedgerSnapshot(JaftingSalvageLedger.mergeDuplicateRows(baseRows));
  }

  /**
   * Whether dismantling this datum would return anything after weapon/armor expansion.<br>
   * UI uses this so vendor-only stamps (bare `w`/`a` rows that unpack to nothing) never clutter the candidate list.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @returns {boolean}
   */
  static datumHasSalvageLedger(datum)
  {
    const snap = JaftingSalvageManager.getSalvageLedgerSnapshotExpanded(datum);

    return !!(snap && snap.rows && snap.rows.length > 0);
  }

  /**
   * Clone of the party/datum ledger with `w`/`a` rows replaced by nested ingredient rows (or dropped when vendor).<br>
   * Stored ledgers stay raw; dismantle + UI read through this snapshot so crafted donors never pay whole weapons back.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @returns {JaftingSalvageLedgerSnapshot|null}
   */
  static getSalvageLedgerSnapshotExpanded(datum)
  {
    const raw = JaftingSalvageManager.getLedgerForDatum(datum);

    if (!raw || !raw.rows || raw.rows.length === 0)
    {
      return null;
    }

    // step one: normalize the stored stamp (dedupe keys) without touching `$data*` yet—storage stays compact.
    const merged = JaftingSalvageLedger.mergeDuplicateRows(JaftingSalvageLedger.cloneRows(raw.rows));
    // step two: unpack nested weapon/armor history so dismantle never pays whole vendor shells for crafted donors.
    const expanded = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(merged, {});

    return new JaftingSalvageLedgerSnapshot(expanded);
  }

  /**
   * Counts non-banned rows after expansion (used for salvage UI layout).
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null|undefined} datum The datum driving this step.
   * @returns {number}
   */
  static visibleExpandedRefundRowCount(datum)
  {
    const snap = JaftingSalvageManager.getSalvageLedgerSnapshotExpanded(datum);

    if (!snap || !snap.rows)
    {
      return 0;
    }

    let n = 0;

    for (let i = 0; i < snap.rows.length; i++)
    {
      if (snap.rows[i].banned === true)
      {
        continue;
      }

      n++;
    }

    return n;
  }

  /**
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null|undefined} datum The datum driving this step.
   * @returns {number}
   */
  static layoutPreviewLineCountSingle(datum)
  {
    if (datum === null || datum === undefined)
    {
      return 1;
    }

    const n = JaftingSalvageManager.visibleExpandedRefundRowCount(datum);

    if (n < 1)
    {
      return 1;
    }

    return 3 + n;
  }

  /**
   * @param {RPG_Item|RPG_Weapon|RPG_Armor|null|undefined} datum The datum driving this step.
   * @returns {number}
   */
  static layoutPreviewLineCountTwoColumn(datum)
  {
    const n = JaftingSalvageManager.visibleExpandedRefundRowCount(datum);

    if (n < 1)
    {
      return JaftingSalvageManager.layoutPreviewLineCountSingle(datum);
    }

    return 3 + Math.ceil(n / 2);
  }

  /**
   * When a weapon/armor ledger row has no nested ledger, vendor shells drop—except material-type gear.
   *
   * @param {JaftingSalvageLedgerRow[]} flat The flat driving this step.
   * @param {JaftingSalvageLedgerRow|{ t: string, id: number, n: number, banned?: boolean }} row
   * @param {RPG_Weapon|RPG_Armor} equipDatum The equip datum driving this step.
   * @returns {boolean} true when a pass-through row was appended.
   */
  static tryPushMaterialEquipmentPassThrough(flat, row, equipDatum)
  {
    const isArmorMaterial = row.t === 'a'
      && equipDatum.isArmor()
      && equipDatum.atypeId === JaftingSalvageLedger.getMaterialArmorTypeId();
    const isWeaponMaterial = row.t === 'w'
      && equipDatum.isWeapon()
      && JaftingSalvageLedger.isMaterialWeaponDatum(equipDatum);

    if (isArmorMaterial === false && isWeaponMaterial === false)
    {
      return false;
    }

    // Append the row to the working collection.
    flat.push(new JaftingSalvageLedgerRow(row.t, row.id, row.n));

    return true;
  }

  /**
   * Replaces each `w`/`a` row with that template's stamped ledger (scaled by row count), or drops it with no
   * ledger.<br>
   * Ingredient armors ({@link JaftingSalvageLedger.getMaterialArmorTypeId}) and configured material weapons keep bare
   * `a` / `w` refund lines when the template
   * carries no nested ledger—those rows are refinement materials, not vendor-only equipment shells.<br>
   * {@link visited} breaks cycles if a ledger ever references itself transitively.
   *
   * @param {JaftingSalvageLedgerRow[]|{ t: string, id: number, n: number, banned?: boolean }[]} rows
   * @param {Record<string, boolean>} visited The visited driving this step.
   * @returns {JaftingSalvageLedgerRow[]}
   */
  static expandWeaponArmorRowsForSalvage(rows, visited)
  {
    const flat = [];

    for (let i = 0; i < rows.length; i++)
    {
      const row = rows[i];

      // banned rows stay in the stream so UI can dim them—refund skips happen later in {@link
      // JaftingSalvageManager.refundLedgerRows}.
      if (row.banned === true)
      {
        flat.push(new JaftingSalvageLedgerRow(row.t, row.id, row.n, true));

        continue;
      }

      // gold / items / SDP letters never recurse—copy forward as-is.
      if (row.t !== 'w' && row.t !== 'a')
      {
        flat.push(new JaftingSalvageLedgerRow(row.t, row.id, row.n));

        continue;
      }

      // equipment rows are the only ones that might hide a whole nested stamp under `$dataWeapons` / `$dataArmors`.
      const visitKey = `${row.t}:${row.id}`;

      if (visited[visitKey] === true)
      {
        continue;
      }

      visited[visitKey] = true;

      let equipDatum;

      if (row.t === 'w')
      {
        equipDatum = $dataWeapons[row.id];
      }
      else
      {
        equipDatum = $dataArmors[row.id];
      }

      if (!equipDatum)
      {
        continue;
      }

      const sub = JaftingSalvageManager.getLedgerForDatum(equipDatum);

      if (!sub || !sub.rows || sub.rows.length === 0)
      {
        // refinement stamps monster-part donors as bare rows—those templates usually have **no** nested ledger.
        // treat them like `i` rows here so dismantle still refunds the physical gear instead of vanishing the row.
        JaftingSalvageManager.tryPushMaterialEquipmentPassThrough(flat, row, equipDatum);

        continue;
      }

      const innerMerged = JaftingSalvageLedger.mergeDuplicateRows(JaftingSalvageLedger.cloneRows(sub.rows));
      const innerExpanded = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(innerMerged, visited);
      // outer row count stacks identical stamped units—scale every unpacked ingredient line by that stack factor.
      const mult = row.n;

      for (let j = 0; j < innerExpanded.length; j++)
      {
        const ir = innerExpanded[j];
        const piece = new JaftingSalvageLedgerRow(ir.t, ir.id, ir.n * mult, ir.banned === true);

        // Append the row to the working collection.
        flat.push(piece);
      }
    }

    return JaftingSalvageLedger.mergeDuplicateRows(flat);
  }

  /**
   * Candidate datums that may enter the salvage scene list.
   *
   * @returns {RPG_Base[]}
   */
  static getSalvageCandidateDatums()
  {
    // salvage UI wants every dismantle-eligible party row—ledger must survive expansion or the datum is filtered out.
    const all = $gameParty.allItems();
    const out = [];

    for (let i = 0; i < all.length; i++)
    {
      const datum = all[i];

      if (!datum)
      {
        continue;
      }

      if ($gameParty.numItems(datum) < 1)
      {
        continue;
      }

      if (JaftingSalvageManager.datumHasSalvageLedger(datum) === false)
      {
        continue;
      }

      // Append the row to the working collection.
      out.push(datum);
    }

    return out;
  }

  /**
   * The stamped ledgers of the copies a dismantle is about to destroy, newest first.
   *
   * A dynamic instance is a single unique row rather than a stack, so its own snapshot is the whole answer. A
   * template stack hands back the tail of {@link JaftingSalvagePartyLedgerBag#unitLedgers}, which is where the most
   * recently acquired copies live. An unstamped copy contributes nothing, which is why the array is allowed to hold
   * nulls in the first place - a stack can mix crafted copies with ones bought from a shop.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum being dismantled.
   * @param {number} amount How many copies are being destroyed.
   * @returns {Array<JaftingSalvageLedgerSnapshot>} One entry per stamped copy being destroyed.
   */
  static ledgersForSalvagedUnits(datum, amount)
  {
    // a row carrying its own stamp is one unique instance rather than a stack. this asks the question in exactly the
    // order {@link getLedgerForDatum} asks it, so the two can never disagree about where a ledger lives - and
    // because that method gates entry to this one, a stack reaching here is guaranteed to have a bag.
    if (datum._jaftingSalvageLedger)
    {
      return [ datum._jaftingSalvageLedger ];
    }

    const key = JaftingSalvageManager.containerKeyFromDatum(datum);
    const bag = $gameParty._j._jafting._salvageLedgers[key];
    const units = bag.unitLedgers;
    const start = Math.max(0, units.length - amount);

    return units.slice(start)
      .filter(unit => unit !== null);
  }

  /**
   * Builds the payout for a dismantle: every destroyed copy expanded to leaves, halved, then merged.
   *
   * The order is load-bearing. Expansion has to run **per copy** with its own visited set, or the cycle-breaker
   * would treat a second copy's identical rows as already seen and drop them. Halving has to run **per copy** too,
   * before merging, or two copies costing nine would round once against eighteen instead of twice against nine.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum being dismantled.
   * @param {number} amount How many copies are being destroyed.
   * @returns {JaftingSalvageLedgerSnapshot} What the player receives.
   */
  static refundForSalvagedUnits(datum, amount)
  {
    const ledgers = JaftingSalvageManager.ledgersForSalvagedUnits(datum, amount);
    const refundRows = [];

    ledgers.forEach(ledger =>
    {
      const stored = JaftingSalvageLedger.mergeDuplicateRows(JaftingSalvageLedger.cloneRows(ledger.rows));
      const expanded = JaftingSalvageManager.expandWeaponArmorRowsForSalvage(stored, {});

      expanded.forEach(row => refundRows.push(JaftingSalvageManager.refundableRow(row)));
    });

    return new JaftingSalvageLedgerSnapshot(JaftingSalvageLedger.mergeDuplicateRows(refundRows));
  }

  /**
   * Drops the ledgers of the copies a dismantle just destroyed.
   *
   * Destruction is the one moment a ledger can be discarded on the spot, because unlike a copy leaving the bag for
   * any other reason there is no chance it comes back. Everything else defers to the sweep.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum being dismantled.
   * @param {number} amount How many copies were destroyed.
   */
  static releaseSalvagedUnitLedgers(datum, amount)
  {
    // same precedence as {@link ledgersForSalvagedUnits}, so what gets paid out and what gets discarded can never
    // come from two different places.
    if (datum._jaftingSalvageLedger)
    {
      datum._jaftingSalvageLedger = null;

      return;
    }

    const key = JaftingSalvageManager.containerKeyFromDatum(datum);
    const bag = $gameParty._j._jafting._salvageLedgers[key];
    const units = bag.unitLedgers;

    units.splice(Math.max(0, units.length - amount), amount);

    JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);
    JaftingSalvageManager.pruneEmptyPartyLedgerBag(key);
  }

  /**
   * The share of one row's cost that dismantling hands back: half, rounded up.
   *
   * Rounding up rather than down is deliberate and it is the generous direction on purpose - a component that cost
   * one comes back whole, because rounding down would mean single-unit ingredients silently vanish and dismantling
   * a dish made of six different one-of things would pay nothing at all.
   *
   * @param {JaftingSalvageLedgerRow} row An already-expanded leaf row.
   * @returns {JaftingSalvageLedgerRow} A row carrying the refundable quantity.
   */
  static refundableRow(row)
  {
    const refundable = Math.ceil(row.n / 2);

    return new JaftingSalvageLedgerRow(row.t, row.id, refundable, row.banned === true);
  }

  /**
   * Pays out every eligible row, scaled by {@link amount}. Banned rows skip.
   *
   * **This method applies no policy of its own** - it hands over exactly what it is given. The half-refund rate
   * lives in {@link refundableRow}, applied per stamped unit by {@link executeSalvage} before rows are merged,
   * because merging first and halving after would round a different number and quietly change the rate.
   *
   * **Contract:** callers pass **already expanded** rows (see
   * {@link JaftingSalvageManager.getSalvageLedgerSnapshotExpanded})
   * so `w` / `a` lines here are leaf refunds—never whole crafted shells that still need unpacking. If you feed raw
   * storage, vendor rows could mint unintended items.
   *
   * @param {JaftingSalvageLedgerSnapshot|{ rows: JaftingSalvageLedgerRow[] }} ledger
   * @param {number} amount The amount driving this step.
   */
  static refundLedgerRows(ledger, amount)
  {
    if (amount < 1)
    {
      return;
    }

    for (let i = 0; i < ledger.rows.length; i++)
    {
      const row = ledger.rows[i];

      if (row.banned === true)
      {
        continue;
      }

      const total = row.n * amount;

      // type letters stay aligned with {@link JaftingSalvageLedger.rowsFromCraftingComponents} stamping.
      if (row.t === 'i')
      {
        $gameParty.gainItem($dataItems[row.id], total);
      }
      else if (row.t === 'w')
      {
        $gameParty.gainItem($dataWeapons[row.id], total);
      }
      else if (row.t === 'a')
      {
        $gameParty.gainItem($dataArmors[row.id], total);
      }
      else if (row.t === 'g')
      {
        $gameParty.gainGold(total);
      }
      else if (row.t === 's')
      {
        // SDP letter mirrors crafting component vocabulary—every actor receives the same flat payout for v1.
        $gameParty.members()
          .forEach(actor => actor.modSdpPoints(total));
      }
    }
  }

  /**
   * Executes salvage for {@link amount} units of {@link datum}.
   *
   * **Refunds come from the specific copies being destroyed, never from the stack's summary.** `bag.rows` is the
   * union of every stamped copy - three swords that each cost two horns summarise as six - and paying from that
   * summary refunds the whole stack's history for every single copy dismantled, so crafting a batch and taking it
   * apart one at a time multiplies materials by the stack height. The per-copy ledgers were always being recorded;
   * this is the path that finally reads them.
   *
   * Copies are consumed **last-in-first-out**, matching the order {@link appendStampedUnitsToPartyStack} writes
   * them. Two copies of one database row are indistinguishable to the player, so there is nothing to choose
   * between beyond being consistent with how they were stacked.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} datum The datum driving this step.
   * @param {number} amount The amount driving this step.
   * @returns {boolean}
   */
  static executeSalvage(datum, amount)
  {
    const raw = JaftingSalvageManager.getLedgerForDatum(datum);

    if (!raw || !raw.rows || raw.rows.length === 0)
    {
      return false;
    }

    if (amount < 1)
    {
      return false;
    }

    if ($gameParty.numItems(datum) < amount)
    {
      return false;
    }

    const refund = JaftingSalvageManager.refundForSalvagedUnits(datum, amount);

    // expansion can drop every row (vendor-only `w`/`a` shells)—treat that as "nothing to dismantle" even if raw
    // storage still had a stamp for UI history.
    if (refund.rows.length === 0)
    {
      return false;
    }

    // paying before `loseItem` so half-empty stacks cannot strand refunds if anything downstream throws. the rate
    // is already folded into these rows, so this hands over exactly what was computed.
    JaftingSalvageManager.refundLedgerRows(refund, 1);
    JaftingSalvageManager.releaseSalvagedUnitLedgers(datum, amount);
    $gameParty.loseItem(datum, amount);

    return true;
  }

  /**
   * Party hook after items leave inventory — keeps template bags sized to the stack they describe.
   *
   * **This hook deliberately does not collect anything belonging to a dynamic instance.** Leaving the bag is not
   * the same event as leaving the game: equipping is a `loseItem`, and vanilla's `tradeItemWithParty` spends the
   * row *before* `changeEquip` installs it in the slot, so at this exact moment a weapon being equipped is in
   * neither the inventory nor anyone's hands. A count of zero here answers "not in the bag", which is not the
   * question collection needs answered. {@link reclaimUnreferencedDynamicSlots} asks the real one, later, from a
   * point where the answer has settled.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} itemDatum The item datum driving this step.
   * @param {number} amountLost The amount lost driving this step.
   */
  static afterPartyLostItem(itemDatum, amountLost)
  {
    if (!itemDatum)
    {
      return;
    }

    if (amountLost < 1)
    {
      return;
    }

    // only template stacks have a party bag whose slot count needs resyncing against `numItems`.
    if (itemDatum._key() < JaftingSalvageManager.DynamicEquipIndexMin)
    {
      const key = JaftingSalvageManager.containerKeyFromDatum(itemDatum);

      if (key)
      {
        JaftingSalvageManager.initPartySalvageStorage();
        const bag = $gameParty._j._jafting._salvageLedgers[key];

        if (bag)
        {
          JaftingSalvageManager.coercePartyLedgerBagShapeForDatum(bag, itemDatum);
          JaftingSalvageManager.pruneEmptyPartyLedgerBag(key);
        }
      }
    }

    // a dynamic instance is collected by the sweep, never here - see this method's own notes for why a count of
    // zero cannot be trusted to mean the row is gone.
    if (itemDatum._key() >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      return;
    }

    // stacks still hold quantity—scrub bookkeeping only once the final copy leaves (sell, salvage, plot, etc.).
    if ($gameParty.numItems(itemDatum) > 0)
    {
      return;
    }

    JaftingSalvageManager.clearLedgerForDatum(itemDatum);
  }

  /**
   * Collects every dynamic refinement slot nothing can reach any more.
   *
   * **This is a garbage collector, and it is correct for it to run late.** The refinement counter only ever
   * increments - reclaiming a slot never returns it to the allocator - so no future refinement can land in a
   * collected slot, and nothing is ever waiting on one being freed. All collection buys is a save that stops
   * growing and a load that stops replaying rows the player no longer owns, neither of which is urgent. That is
   * what makes it safe to ask this question from a quiet moment instead of from the middle of an equip.
   *
   * Call it from somewhere the player is demonstrably done transacting - J-JAFTING-Refinement drives it off
   * `Scene_Map.start`, which every menu, shop, and battle return passes through.
   */
  static reclaimUnreferencedDynamicSlots()
  {
    // snapshot the slots before touching anything: collecting one splices the very list being walked.
    const weaponSlots = $gameParty.getRefinedWeapons()
      .map(lineage => lineage.index);
    const armorSlots = $gameParty.getRefinedArmors()
      .map(lineage => lineage.index);

    weaponSlots.forEach(slot => JaftingSalvageManager.reclaimWeaponSlotWhenUnreferenced(slot));
    armorSlots.forEach(slot => JaftingSalvageManager.reclaimArmorSlotWhenUnreferenced(slot));
  }

  /**
   * Collects one dynamic weapon slot if nothing holds it.
   *
   * @param {number} slot The `$dataWeapons` slot a tracked refinement occupies.
   */
  static reclaimWeaponSlotWhenUnreferenced(slot)
  {
    const row = $dataWeapons[slot];

    if (JaftingSalvageManager.isDynamicRowHeld(row))
    {
      return;
    }

    JaftingSalvageManager.reclaimDynamicWeaponSlot(row);
  }

  /**
   * Collects one dynamic armor slot if nothing holds it.
   *
   * @param {number} slot The `$dataArmors` slot a tracked refinement occupies.
   */
  static reclaimArmorSlotWhenUnreferenced(slot)
  {
    const row = $dataArmors[slot];

    if (JaftingSalvageManager.isDynamicRowHeld(row))
    {
      return;
    }

    JaftingSalvageManager.reclaimDynamicArmorSlot(row);
  }

  /**
   * Whether anything in the playthrough still holds this row.
   *
   * Two places can hold one, and both have to be asked. The bag is the obvious one. The other is somebody's
   * hands - and that means **every actor the save has built, not the current party roster**, because an actor
   * written out of the party keeps wearing whatever they had on. Chef Adventure splits its two leads up for
   * whole dungeons, so the character who is not currently travelling with you is exactly the one whose sword
   * would otherwise be collected out from under them.
   *
   * @param {RPG_Weapon|RPG_Armor} datum The dynamic row being considered for collection.
   * @returns {boolean}
   */
  static isDynamicRowHeld(datum)
  {
    // sitting in the bag, which covers everything short of being worn.
    if ($gameParty.numItems(datum) > 0)
    {
      return true;
    }

    return JaftingSalvageManager.isRowWornByAnyone(datum);
  }

  /**
   * Whether any actor this save has built is wearing this row.
   *
   * Reads `existingActors` rather than `actors`, because the latter hands every database id to
   * {@link Game_Actors.actor} and lazily constructs whatever is missing - which would answer "who exists" by
   * making more of them exist, on every single map entry.
   *
   * @param {RPG_Weapon|RPG_Armor} datum The dynamic row being considered for collection.
   * @returns {boolean}
   */
  static isRowWornByAnyone(datum)
  {
    const slot = datum._key();

    return $gameActors.existingActors()
      .some(actor => JaftingSalvageManager.isActorWearingSlot(actor, slot));
  }

  /**
   * Whether one actor is wearing the row occupying a given slot.
   *
   * Compares slots rather than object identity: `Game_Item` stores a refined equip by its `_key()`, so the slot
   * is what an equipped instance is actually recorded as. An empty equip slot resolves to `null` by contract -
   * that is what `Game_Item.object()` returns when nothing is set - so the list genuinely holds gaps.
   *
   * @param {Game_Actor} actor The actor whose equipment is being read.
   * @param {number} slot The datastore slot being looked for.
   * @returns {boolean}
   */
  static isActorWearingSlot(actor, slot)
  {
    return actor.equips()
      .some(equip => equip !== null && equip._key() === slot);
  }

  /**
   * Removes refined weapon bookkeeping when the row is fully gone from inventory.
   *
   * @param {RPG_Weapon} weaponDatum The weapon datum driving this step.
   */
  static reclaimDynamicWeaponSlot(weaponDatum)
  {
    const weapons = $gameParty.getRefinedWeapons();

    // the slot being handed back is the instance, so every read here is `_key()`. a lineage node names its own
    // datastore slot in `index`, and `$dataWeapons` is subscripted by index too - reading `id` would match nothing
    // and then blank whichever base row this instance happens to be a clone of.
    const slot = weaponDatum._key();

    // refinement tracks spawned rows for save hydration—drop stale refs when the last copy sells or dismantles.
    for (let i = 0; i < weapons.length; i++)
    {
      if (weapons[i].index === slot)
      {
        weapons.splice(i, 1);
        break;
      }
    }

    $dataWeapons[slot] = RPG_Weapon.createEmpty(slot);
    JaftingSalvageManager.onAfterDynamicSlotReclaimed('weapon', slot);
  }

  /**
   * Removes refined armor bookkeeping when the row is fully gone from inventory.
   *
   * @param {RPG_Armor} armorDatum The armor datum driving this step.
   */
  static reclaimDynamicArmorSlot(armorDatum)
  {
    const armors = $gameParty.getRefinedArmors();

    // twin path to {@link reclaimDynamicWeaponSlot} for armor-shaped refinement outputs, and the same reason for
    // reading the index rather than the id.
    const slot = armorDatum._key();

    for (let i = 0; i < armors.length; i++)
    {
      if (armors[i].index === slot)
      {
        armors.splice(i, 1);
        break;
      }
    }

    $dataArmors[slot] = RPG_Armor.createEmpty(slot);
    JaftingSalvageManager.onAfterDynamicSlotReclaimed('armor', slot);
  }
}

export default JaftingSalvageManager;

//endregion JaftingSalvageManager