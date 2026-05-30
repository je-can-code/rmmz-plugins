//region JaftingSalvageManager
import JaftingSalvageLedger from '../__models/JaftingSalvageLedger.js';
import JaftingSalvageLedgerRow from '../__models/JaftingSalvageLedgerRow.js';
import JaftingSalvageLedgerSnapshot from '../__models/JaftingSalvageLedgerSnapshot.js';
import JaftingSalvagePartyLedgerBag from '../__models/JaftingSalvagePartyLedgerBag.js';

/**
 * Orchestrates **where** ledgers live, **when** they merge from craft/refine, **how** dismantle pays out, and
 * **cleanup** when the last copy of dynamic refinement rows disappears from inventory.<br>
 * <br>
 * **Two storage homes (read this before touching `getLedger*`):**<br>
 * - **Dynamic refinement rows** (`id` ≥ {@link JaftingSalvageManager.DynamicEquipIndexMin}) — stamp rides on
 *   `datum._jaftingSalvageLedger` because each `$dataWeapons` / `$dataArmors` slot is already unique.<br>
 * - **Vanilla stack templates** — stamp lives in `$gameParty._j._jafting._salvageLedgers[containerKey]` as a
 * {@link JaftingSalvagePartyLedgerBag} with `unitLedgers[]` parallel to stack height.<br>
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
   * Keeps per-slot ledger array length aligned to current party stack size (LIFO push/pop).
   *
   * @param {JaftingSalvagePartyLedgerBag} bag The bag driving this step.
   * @param {RPG_Base} datum The datum driving this step.
   */
  static syncPartyLedgerUnitCountToStack(bag, datum)
  {
    const n = $gameParty.numItems(datum);

    if (!Array.isArray(bag.unitLedgers))
    {
      bag.unitLedgers = [];
    }

    // keep looping while bag.unitLedgers.length < n.
    while (bag.unitLedgers.length < n)
    {
      bag.unitLedgers.push(null);
    }

    // keep looping while bag.unitLedgers.length > n.
    while (bag.unitLedgers.length > n)
    {
      bag.unitLedgers.pop();
    }

    JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);
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

    // `coerce` may mint a fresh bag instance—replace the map entry so later readers do not keep a stale plain object.
    if (working !== bag)
    {
      $gameParty._j._jafting._salvageLedgers[key] = working;
    }

    if (!Array.isArray(working.unitLedgers))
    {
      working.unitLedgers = [];
    }

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

    if (bag !== $gameParty._j._jafting._salvageLedgers[key])
    {
      $gameParty._j._jafting._salvageLedgers[key] = bag;
    }

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
    if (datum._jaftingSalvageLedger && datum._jaftingSalvageLedger.rows)
    {
      if ((datum._jaftingSalvageLedger instanceof JaftingSalvageLedgerSnapshot) === false)
      {
        datum._jaftingSalvageLedger = new JaftingSalvageLedgerSnapshot(datum._jaftingSalvageLedger);
      }

      return datum._jaftingSalvageLedger;
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

    // refinement ids already own a single snapshot on the row—ignore stack ordinals (UI still passes per-slot indices).
    if (datum.id >= JaftingSalvageManager.DynamicEquipIndexMin)
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

    if (itemDatum.id >= JaftingSalvageManager.DynamicEquipIndexMin)
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
   */
  static applyCraftRecipeOutputs(recipe)
  {
    const ingredientRows = JaftingSalvageLedger.rowsFromCraftingComponents(recipe.ingredients);
    const shell = new JaftingSalvageLedgerSnapshot(ingredientRows);

    for (let i = 0; i < recipe.outputs.length; i++)
    {
      const component = recipe.outputs[i];

      if (component.isDatabaseEntry())
      {
        const datum = component.getItem();

        // clone per output row so multi-output recipes cannot accidentally share one mutable array reference.
        const snapshot = JaftingSalvageLedgerSnapshot.cloneFromLedgerLike(shell);

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
    if (datum.id >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      // dynamic refinement rows are unique instances—ledger travels with the RPG object in `$data*`.
      const existingRows = JaftingSalvageLedgerSnapshot.rowsFromUnknown(datum._jaftingSalvageLedger);
      const incomingRows = JaftingSalvageLedgerSnapshot.rowsFromUnknown(incomingLedger);

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
    if (datum.id >= JaftingSalvageManager.DynamicEquipIndexMin)
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
      bag.unitLedgers[i] = JaftingSalvageLedgerSnapshot.cloneFromLedgerLike(incomingLedger);
    }

    JaftingSalvageManager.recomputeMergedRowsFromPartyLedgerBag(bag);
  }

  /**
   * True when the refinement **material** contributes **no extra dismantle rows** onto the output stamp.<br>
   * <br>
   * Check order matters: stamped ledger wins first, then ingredient-type exceptions, then the blunt "vendor shell"
   * weapon/armor rule—stack items fall through to `false` so we never mis-classify a normal item donor.<br>
   * Pair with {@link JaftingSalvageManager.buildRefinementOutputLedger}; that method mirrors these branches when
   * building rows.
   *
   * @param {RPG_Item|RPG_Weapon|RPG_Armor} materialDatum The material datum driving this step.
   * @returns {boolean}
   */
  static refinementMaterialHasNoRecoverableRows(materialDatum)
  {
    const ledger = JaftingSalvageManager.getLedgerForDatum(materialDatum);

    // crafted donors carry a stamped ledger—those rows merge back into the output.
    if (ledger && ledger.rows && ledger.rows.length > 0)
    {
      return false;
    }

    // ingredient-class armors (monster parts) always contribute one salvage row even without prior crafting history.
    if (materialDatum.isArmor()
      && materialDatum.atypeId === JaftingSalvageLedger.getMaterialArmorTypeId())
    {
      return false;
    }

    if (JaftingSalvageLedger.isMaterialWeaponDatum(materialDatum))
    {
      return false;
    }

    // bare vendor weapon/armor donors get eaten without refund rows—only gold sinks here per design policy.
    if (materialDatum.isWeapon() || materialDatum.isArmor())
    {
      return true;
    }

    return false;
  }

  /**
   * Builds the merged salvage ledger that should attach to refined output equipment.<br>
   * <br>
   * **Pipeline (same story as {@link JaftingSalvageManager.refinementMaterialHasNoRecoverableRows}, but emitting
   * rows):** clone the base stamp, optionally fold donor rows, always end on a deduped snapshot so duplicate `t:id`
   * keys from parallel crafts collapse cleanly.<br>
   * Early exit when the donor is a **gold-only** vendor shell—base lineage alone defines dismantle. Stamped donor
   * merges next. Ingredient-class gear without a nested ledger still gets a **synthetic** single row so dismantle
   * refunds the part. The final `return` catches non-equip donors where none of the above applied.
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

    if (JaftingSalvageManager.refinementMaterialHasNoRecoverableRows(materialDatum))
    {
      // vendor weapon/armor donor with no stamp and no ingredient-type pass-through—output inherits base stamp only.
      return new JaftingSalvageLedgerSnapshot(JaftingSalvageLedger.mergeDuplicateRows(baseRows));
    }

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
   * Refunds every eligible row scaled by {@link amount}.<br>
   * v1 policy: 100% of eligible rows; banned rows skip.<br>
   * <br>
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

      // `row.n` counts per **one** stamped unit—multiply by dismantle stack `amount` so bulk salvage scales refunds.
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

    // expansion can drop every row (vendor-only `w`/`a` shells)—treat that as "nothing to dismantle" even if raw
    // storage still had a stamp for UI history.
    const snap = JaftingSalvageManager.getSalvageLedgerSnapshotExpanded(datum);

    if (!snap || !snap.rows || snap.rows.length === 0)
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

    // pay from expanded snapshot so vendor `w`/`a` lines never mint items—crafted lines unpack to ingredients.
    // still runs before `loseItem` so half-empty stacks cannot strand refunds if anything downstream throws.
    JaftingSalvageManager.refundLedgerRows(snap, amount);
    $gameParty.loseItem(datum, amount);

    return true;
  }

  /**
   * Party hook after items leave inventory — reclaim refinement slots when the last copy is gone.
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

    if (itemDatum.id < JaftingSalvageManager.DynamicEquipIndexMin)
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

    // stacks still hold quantity—scrub bookkeeping only once the final copy leaves (sell, salvage, plot, etc.).
    if ($gameParty.numItems(itemDatum) > 0)
    {
      return;
    }

    JaftingSalvageManager.clearLedgerForDatum(itemDatum);

    if (itemDatum.isWeapon() && itemDatum.id >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      JaftingSalvageManager.reclaimDynamicWeaponSlot(itemDatum);

      // exit early without a payload.
      return;
    }

    if (itemDatum.isArmor() && itemDatum.id >= JaftingSalvageManager.DynamicEquipIndexMin)
    {
      JaftingSalvageManager.reclaimDynamicArmorSlot(itemDatum);
    }
  }

  /**
   * Removes refined weapon bookkeeping when the row is fully gone from inventory.
   *
   * @param {RPG_Weapon} weaponDatum The weapon datum driving this step.
   */
  static reclaimDynamicWeaponSlot(weaponDatum)
  {
    const weapons = $gameParty.getRefinedWeapons();

    // refinement tracks spawned rows for save hydration—drop stale refs when the last copy sells or dismantles.
    for (let i = 0; i < weapons.length; i++)
    {
      if (weapons[i].index === weaponDatum.id)
      {
        weapons.splice(i, 1);
        break;
      }
    }

    $dataWeapons[weaponDatum.id] = RPG_Weapon.createEmpty(weaponDatum.id);
    JaftingSalvageManager.onAfterDynamicSlotReclaimed('weapon', weaponDatum.id);
  }

  /**
   * Removes refined armor bookkeeping when the row is fully gone from inventory.
   *
   * @param {RPG_Armor} armorDatum The armor datum driving this step.
   */
  static reclaimDynamicArmorSlot(armorDatum)
  {
    const armors = $gameParty.getRefinedArmors();

    // twin path to {@link reclaimDynamicWeaponSlot} for armor-shaped refinement outputs.
    for (let i = 0; i < armors.length; i++)
    {
      if (armors[i].index === armorDatum.id)
      {
        armors.splice(i, 1);
        break;
      }
    }

    $dataArmors[armorDatum.id] = RPG_Armor.createEmpty(armorDatum.id);
    JaftingSalvageManager.onAfterDynamicSlotReclaimed('armor', armorDatum.id);
  }
}

export default JaftingSalvageManager;

//endregion JaftingSalvageManager