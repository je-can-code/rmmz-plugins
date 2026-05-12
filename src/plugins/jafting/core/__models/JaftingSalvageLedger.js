//region JaftingSalvageLedger
/**
 * Stateless helpers for salvage ledger **rows** (clone, merge, dedupe).<br>
 * Concrete row / snapshot / bag classes live in {@link JaftingSalvageLedgerRow},
 * {@link JaftingSalvageLedgerSnapshot}, and {@link JaftingSalvagePartyLedgerBag}
 * (see `JaftingSalvageDataModels.js`).<br>
 * Party-facing **saved** ledgers live under {@link JaftingSalvageManager} on `$gameParty` or on RPG equipment rows.<br>
 * <br>
 * **Why a global name:** JAFTING ships as concatenated plain JS (no modules). Attaching a namespace object to one
 * global is how shared utilities share scope with {@link JaftingSalvageManager} without circular ordering headaches.
 * The `var X = X || {}` idiom keeps the bucket safe if anything ever double-evaluates.<br>
 * If we outgrow it, fold these functions onto `J.JAFTING` or into the manager—behavior stays the same.
 */
var JaftingSalvageLedger = JaftingSalvageLedger || {};

/**
 * Armor type id used for ingredient-style armors (monster parts, materials).<br>
 * Must align with JAFTING Refinement UI filtering and game data conventions.
 */
JaftingSalvageLedger.MaterialArmorTypeId = 5;

/**
 * Effective armor type id for ingredient stacks (JAFTING core plugin parameter).<br>
 * {@link MaterialArmorTypeId} is the fallback when metadata is missing; -1 in parameters means disabled
 * (no armor type is treated as stack-only material).
 *
 * @returns {number}
 */
JaftingSalvageLedger.getMaterialArmorTypeId = function()
{
  if (typeof J !== 'undefined'
    && J.JAFTING !== undefined
    && J.JAFTING.Metadata !== undefined)
  {
    const v = J.JAFTING.Metadata.materialArmorTypeId;

    if (typeof v === 'number' && !Number.isNaN(v))
    {
      return v;
    }
  }

  return JaftingSalvageLedger.MaterialArmorTypeId;
};

/**
 * Weapon type id for stack-only ingredient weapons (JAFTING core plugin parameter).<br>
 * -1 disables the feature; 0 is a valid {@link RPG_Weapon#wtypeId} when you intend that type as material stacks.
 *
 * @returns {number}
 */
JaftingSalvageLedger.getMaterialWeaponTypeId = function()
{
  if (typeof J !== 'undefined'
    && J.JAFTING !== undefined
    && J.JAFTING.Metadata !== undefined)
  {
    const v = J.JAFTING.Metadata.materialWeaponTypeId;

    if (typeof v === 'number' && !Number.isNaN(v))
    {
      return v;
    }
  }

  return -1;
};

/**
 * True when this armor row uses the configured material armor type (refine primary filter, dismantle pass-through).
 *
 * @param {RPG_Armor|RPG_Base} datum
 * @returns {boolean}
 */
JaftingSalvageLedger.isMaterialArmorDatum = function(datum)
{
  const armorTypeId = JaftingSalvageLedger.getMaterialArmorTypeId();

  if (armorTypeId < 0)
  {
    return false;
  }

  return datum.isArmor() === true && datum.atypeId === armorTypeId;
};

/**
 * True when this weapon row uses the configured material weapon type (parameter must be zero or greater).
 *
 * @param {RPG_Weapon|RPG_Base} datum
 * @returns {boolean}
 */
JaftingSalvageLedger.isMaterialWeaponDatum = function(datum)
{
  const weaponTypeId = JaftingSalvageLedger.getMaterialWeaponTypeId();

  if (weaponTypeId < 0)
  {
    return false;
  }

  return datum.isWeapon() === true && datum.wtypeId === weaponTypeId;
};

/**
 * True when refine lists should keep one row with stack counts (monster parts, clip-style weapons, etc.).
 *
 * @param {RPG_EquipItem|RPG_Base} datum
 * @returns {boolean}
 */
JaftingSalvageLedger.isStackCountedRefinableEquip = function(datum)
{
  return JaftingSalvageLedger.isMaterialArmorDatum(datum)
    || JaftingSalvageLedger.isMaterialWeaponDatum(datum);
};

/**
 * Stable merge key for a ledger row (type + database id).
 *
 * @param {JaftingSalvageLedgerRow|{ t: string, id: number }} row
 * @returns {string}
 */
JaftingSalvageLedger.rowMergeKey = function(row)
{
  return `${row.t}:${row.id}`;
};

/**
 * Clones row objects for safe merging without sharing references.
 *
 * @param {JaftingSalvageLedgerRow[]|{ t: string, id: number, n: number, banned?: boolean }[]} rows
 * @returns {JaftingSalvageLedgerRow[]}
 */
JaftingSalvageLedger.cloneRows = function(rows)
{
  const list = JaftingSalvageLedgerSnapshot.coerceRows(rows);
  const out = [];

  for (let i = 0; i < list.length; i++)
  {
    out.push(list[i].clone());
  }

  return out;
};

/**
 * Merges duplicate rows by summing counts when {@link rowMergeKey} matches.<br>
 * Call this whenever a pipeline might double-count the same ingredient (parallel outputs, concat merges, reload
 * coercion).<br>
 * Banned flags OR together (if any duplicate is banned, merged row is banned).
 *
 * @param {JaftingSalvageLedgerRow[]|{ t: string, id: number, n: number, banned?: boolean }[]} rows
 * @returns {JaftingSalvageLedgerRow[]}
 */
JaftingSalvageLedger.mergeDuplicateRows = function(rows)
{
  // bucket keyed by component identity so two "horn" lines become one row with summed quantity.
  const bucket = {};
  const list = JaftingSalvageLedgerSnapshot.coerceRows(rows);

  for (let i = 0; i < list.length; i++)
  {
    const row = list[i];
    const key = JaftingSalvageLedger.rowMergeKey(row);

    if (!bucket[key])
    {
      bucket[key] = row.clone();
    }
    else
    {
      bucket[key].n += row.n;

      // any banned duplicate poisons the merged row so salvage math can skip the whole bucket later.
      if (row.banned === true)
      {
        bucket[key].banned = true;
      }
    }
  }

  return Object.keys(bucket).map(k => bucket[k]);
};

/**
 * Builds ledger rows from recipe ingredients (what crafting consumed).<br>
 * Tools are intentionally omitted — salvage stamps track consumed inputs only.
 *
 * @param {CraftingComponent[]} ingredients
 * @returns {JaftingSalvageLedgerRow[]}
 */
JaftingSalvageLedger.rowsFromCraftingComponents = function(ingredients)
{
  const rows = [];

  for (let i = 0; i < ingredients.length; i++)
  {
    const component = ingredients[i];

    if (component.isDatabaseEntry())
    {
      // mirror {@link CraftingComponent} letter codes into ledger row type letters for stash/refund routing.
      const datum = component.getItem();
      let typeLetter = 'i';

      if (component.isWeapon())
      {
        typeLetter = 'w';
      }
      else if (component.isArmor())
      {
        typeLetter = 'a';
      }

      rows.push(new JaftingSalvageLedgerRow(typeLetter, datum.id, component.quantity()));
    }
    else if (component.isGold())
    {
      rows.push(new JaftingSalvageLedgerRow(CraftingComponent.Types.Gold, 0, component.quantity()));
    }
    else if (component.isSdp())
    {
      rows.push(new JaftingSalvageLedgerRow(CraftingComponent.Types.SDP, 0, component.quantity()));
    }
  }

  // stamp uses ingredients only—tools never consume, so they never appear in dismantle refunds for v1 policy.
  return JaftingSalvageLedger.mergeDuplicateRows(rows);
};

/**
 * Concatenates two ledgers, then runs {@link mergeDuplicateRows} so overlapping `t:id` keys sum instead of duplicating
 * lines.<br>
 * Refine / craft code paths prefer this over hand-rolled loops—order only matters before dedupe, not after.
 *
 * @param {JaftingSalvageLedgerRow[]|{ t: string, id: number, n: number, banned?: boolean }[]} a
 * @param {JaftingSalvageLedgerRow[]|{ t: string, id: number, n: number, banned?: boolean }[]} b
 * @returns {JaftingSalvageLedgerRow[]}
 */
JaftingSalvageLedger.mergeRowArrays = function(a, b)
{
  // concat first so identical keys from both sides collide, then dedupe sums counts and merges banned flags.
  const combined = JaftingSalvageLedger.cloneRows(a).concat(JaftingSalvageLedger.cloneRows(b));

  return JaftingSalvageLedger.mergeDuplicateRows(combined);
};

//endregion JaftingSalvageLedger