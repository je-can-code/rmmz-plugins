//region Window_RefinableList
import JaftingManager from './../managers/JaftingManager.js';

/**
 * Refinement equip list helpers + {@link Window_RefinableList}.<br>
 * <br>
 * **Two different questions:** {@link refinableEquipTemplateSortHasSalvageLineage} drives **list ordering** (anything
 * with dismantle history or a refine counter sorts like a “stamped” row). {@link refinableEquipHasSalvageStamp} drives
 * **per-row paint** when the stack UI passes a `unitOrdinal` so only the expanded slot shows the hollow diamond from
 * {@link J.JAFTING.EXT.REFINE.Messages.RefinableListSalvageStampPrefix}.<br>
 * Keep those roles split—sorting on `unitOrdinal` would scramble templates every frame.
 */
/**
 * True when this row should sort with stamped-lineage priority (salvage bag, dynamic ledger, or any refine +N).
 *
 * @param {RPG_EquipItem} equip
 * @returns {boolean}
 */
function refinableEquipTemplateSortHasSalvageLineage(equip)
{
  if (equip.jaftingRefinedCount > 0)
  {
    return true;
  }

  const ledger = JaftingSalvageManager.getLedgerForDatum(equip);

  if (ledger === null || ledger === undefined)
  {
    return false;
  }

  if (!ledger.rows || ledger.rows.length === 0)
  {
    return false;
  }

  return true;
}

/**
 * True when this row should show dismantle lineage styling (per stack slot when expanded).
 *
 * @param {RPG_EquipItem} equip
 * @param {number|undefined|null} unitOrdinal
 * @returns {boolean}
 */
function refinableEquipHasSalvageStamp(equip, unitOrdinal)
{
  const ledger = JaftingSalvageManager.getLedgerUnitForDatum(equip, unitOrdinal);

  if (ledger === null || ledger === undefined)
  {
    return false;
  }

  if (!ledger.rows || ledger.rows.length === 0)
  {
    return false;
  }

  return true;
}

/**
 * Command list of party weapons/armors eligible in the Refinement scene (base pick, material pick, or projected
 * output). Pair with the two module-level helpers above for salvage-aware sort + prefix drawing.
 */
class Window_RefinableList
  extends Window_Command
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
    this.initMembers();
  }

  /**
   * Initializes the properties of this class.
   */
  initMembers()
  {
    /**
     * The currently selected index of this equip selection window.
     * @type {number}
     */
    this._currentIndex = null;

    /**
     * Whether or not this equip list window is the primary equip or not.
     * @type {boolean}
     */
    this._isPrimaryEquipWindow = false;

    /**
     * The current equip that is selected as the base for refinement.
     * @type {RPG_EquipItem}
     */
    this._primarySelection = null;

    /**
     * The projected result of refining the base item with the selected material.
     * @type {RPG_EquipItem}
     */
    this._projectedOutput = null;

    /**
     * Ordinal of the base row the player confirmed (per expanded copy); null when not tracking a slot.
     * @type {number|null}
     */
    this._baseSelectionUnitOrdinal = null;
  }

  /**
   * Gets whether or not this equip list window is the primary equip or not.
   * @returns {boolean}
   */
  get isPrimary()
  {
    return this._isPrimaryEquipWindow;
  }

  /**
   * Sets whether or not this equip list window is the base equip or not.
   */
  set isPrimary(primary)
  {
    this._isPrimaryEquipWindow = primary;
    this.refresh();
  }

  /**
   * Gets which physical copy of {@link #baseSelection} the scene locked in for material picking.
   * @returns {number|null}
   */
  get baseSelectionUnitOrdinal()
  {
    return this._baseSelectionUnitOrdinal;
  }

  /**
   * Sets which physical copy of the base equip is reserved while the consumable list is open.
   */
  set baseSelectionUnitOrdinal(value)
  {
    this._baseSelectionUnitOrdinal = value;
  }

  /**
   * Gets the base selection.
   * Always null if this is the primary equip window.
   * @returns {RPG_EquipItem}
   */
  get baseSelection()
  {
    return this._primarySelection;
  }

  /**
   * Sets the primary selection.
   */
  set baseSelection(equip)
  {
    this._primarySelection = equip;
  }

  /**
   * OVERWRITE Sets the alignment for this command window to be left-aligned.
   */
  itemTextAlign()
  {
    return "left";
  }

  /**
   * Creates a list of all available equipment in the inventory.
   */
  makeCommandList()
  {
    // this command list is based purely off of all equipment.
    let equips = $gameParty.equipItems();

    // don't make the list if we have nothing to draw.
    if (!equips.length) return;

    // primary base list omits stack-only ingredient types (configured on J-JAFTING core).
    if (this.isPrimary)
    {
      equips = equips.filter(equip =>
      {
        if (JaftingSalvageLedger.isMaterialArmorDatum(equip))
        {
          return false;
        }

        if (JaftingSalvageLedger.isMaterialWeaponDatum(equip))
        {
          return false;
        }

        return true;
      });
    }

    // sort: stamped salvage lineage first, then weapons before armor, then by id descending to group equips.
    equips.sort((a, b) =>
    {
      const stampA = refinableEquipTemplateSortHasSalvageLineage(a) ? 1 : 0;
      const stampB = refinableEquipTemplateSortHasSalvageLineage(b) ? 1 : 0;

      if (stampA !== stampB)
      {
        return stampB - stampA;
      }

      if (a.etypeId > b.etypeId) return 1;
      if (a.etypeId < b.etypeId) return -1;
      if (a.id > b.id) return 1;
      if (a.id < b.id) return -1;

      return 0;
    });

    // one row per physical copy for normal weapons/armors; stack counts only for configured material types.
    equips.forEach(equip =>
    {
      if (equip.jaftingUnrefinable)
      {
        return;
      }

      const isStackCountedRow = JaftingSalvageLedger.isStackCountedRefinableEquip(equip);
      const count = $gameParty.numItems(equip);

      if (count < 1)
      {
        return;
      }

      if (isStackCountedRow)
      {
        this.addRefinableEquipCommand(equip, null);

        return;
      }

      for (let u = 0; u < count; u++)
      {
        this.addRefinableEquipCommand(equip, { unitOrdinal: u, unitsTotal: count });
      }
    });
  }

  /**
   * Builds and appends refinable rows (enable rules, icons, salvage stamp label, optional stack counts).
   *
   * @param {RPG_EquipItem} equip
   * @param {{ unitOrdinal: number, unitsTotal: number }|null} unitSlot Pass null for stack-counted material rows.
   */
  // eslint-disable-next-line complexity -- refinement eligibility stays flat so designers can scan every branch.
  addRefinableEquipCommand(equip, unitSlot)
  {
    // don't render equipment that are totally unrefinable. That's a tease!
    if (equip.jaftingUnrefinable)
    {
      return;
    }

    const equipCount = $gameParty.numItems(equip);
    const isStackCountedRow = JaftingSalvageLedger.isStackCountedRefinableEquip(equip);
    const hasUnit = unitSlot !== null && unitSlot !== undefined;

    if (isStackCountedRow && hasUnit)
    {
      return;
    }

    if (!isStackCountedRow && !hasUnit)
    {
      return;
    }

    let rightText = String.empty;

    if (isStackCountedRow)
    {
      rightText = `x${equipCount}`;
    }

    // dismantle lineage stamps the hollow diamond; refinement (+N) always carries the same accent so outputs stay
    // visually consistent even when merged salvage rows are empty (vendor-only material, etc.).
    const hasSalvageStamp = refinableEquipHasSalvageStamp(equip, hasUnit ? unitSlot.unitOrdinal : undefined);
    const hasRefinementAccent = equip.jaftingRefinedCount > 0;
    const stamped = hasSalvageStamp || hasRefinementAccent;
    const rowName = stamped
      ? `${J.JAFTING.EXT.REFINE.Messages.RefinableListSalvageStampPrefix}${equip.name}`
      : equip.name;
    const nameColorIndex = stamped ? 6 : 0;

    const sameTemplate = equip === this.baseSelection;
    const rowOrdinal = hasUnit ? unitSlot.unitOrdinal : null;
    const baseOrdinal = this.baseSelectionUnitOrdinal;

    let samePhysicalUnit = false;

    if (sameTemplate)
    {
      if (rowOrdinal !== null && rowOrdinal !== undefined
        && baseOrdinal !== null && baseOrdinal !== undefined)
      {
        samePhysicalUnit = rowOrdinal === baseOrdinal;
      }
    }

    const templateStack = this.baseSelection
      ? $gameParty.numItems(this.baseSelection)
      : 0;
    const canSelectThisMaterial = sameTemplate === false
      || (templateStack > 1 && samePhysicalUnit === false);

    let enabled = this.isPrimary
      ? true
      : canSelectThisMaterial;

    let { iconIndex } = equip;

    let errorText = "";

    // if the equipment is completely unable to
    if (equip.jaftingUnrefinable)
    {
      enabled = false;
      iconIndex = 90;
    }

    // if this is the second equip window...
    if (!this.isPrimary)
    {
      // and the equipment has no transferable traits, then disable it.
      if (!JaftingManager.parseTraits(equip).length)
      {
        enabled = false;
        errorText += `${J.JAFTING.EXT.REFINE.Messages.NoTraitsOnMaterial}\n`;
      }

      // prevent equipment explicitly marked as "not usable as material" from being used.
      if (equip.jaftingNotRefinementMaterial)
      {
        enabled = false;
        iconIndex = 90;
      }

      // or the projected equips combined would result in over the max refined count, then disable it.
      if (this.baseSelection)
      {
        const primaryHasMaxRefineCount = this.baseSelection.jaftingMaxRefineCount > 0;
        if (primaryHasMaxRefineCount)
        {
          const primaryMaxRefineCount = this.baseSelection.jaftingMaxRefineCount;
          const projectedCount = this.baseSelection.jaftingRefinedCount + equip.jaftingRefinedCount;
          const overRefinementCount = primaryMaxRefineCount < projectedCount;
          if (overRefinementCount)
          {
            enabled = false;
            iconIndex = 90;
            // eslint-disable-next-line max-len
            errorText += `${J.JAFTING.EXT.REFINE.Messages.ExceedRefineCount} ${projectedCount}/${primaryMaxRefineCount}.<br>\n`;
          }
        }

        // check the max traits of the base equip and compare with the projected result of this item.
        // if the count is greater than the max (if there is a max), then prevent this item from being used.
        const baseMaxTraitCount = this.baseSelection.jaftingMaxTraitCount;
        const projectedResult = JaftingManager.determineRefinementOutput(this.baseSelection, equip);
        const projectedResultTraitCount = JaftingManager.parseTraits(projectedResult).length;
        const overMaxTraitCount = baseMaxTraitCount > 0 && projectedResultTraitCount > baseMaxTraitCount;
        if (overMaxTraitCount)
        {
          enabled = false;
          iconIndex = 92;
          // eslint-disable-next-line max-len
          errorText += `${J.JAFTING.EXT.REFINE.Messages.ExceedTraitCount} ${projectedResultTraitCount}/${baseMaxTraitCount}.<br>\n`;
        }
      }

      // if this is the primary equip window...
    }
    else
    {
      const equipIsMaxRefined = (equip.jaftingMaxRefineCount === 0)
        ? false // 0 max refinements means you can refine as much as you want.
        : equip.jaftingMaxRefineCount <= equip.jaftingRefinedCount;
      const equipHasMaxTraits = equip.jaftingMaxTraitCount === 0
        ? false // 0 max traits means you can have as many as you want.
        : equip.jaftingMaxTraitCount <= JaftingManager.parseTraits(equip).length;
      if (equipIsMaxRefined)
      {
        enabled = false;
        iconIndex = 92;
        errorText += `${J.JAFTING.EXT.REFINE.Messages.AlreadyMaxRefineCount}\n`;
      }

      if (equipHasMaxTraits)
      {
        enabled = false;
        iconIndex = 92;
        errorText += `${J.JAFTING.EXT.REFINE.Messages.AlreadyMaxTraitCount}\n`;
      }

      // prevent equipment explicitly marked as "not usable as base" from being used.
      if (equip.jaftingNotRefinementBase)
      {
        enabled = false;
        iconIndex = 92;
      }
    }

    const isChosenBaseRow = sameTemplate
      && rowOrdinal !== null && rowOrdinal !== undefined
      && baseOrdinal !== null && baseOrdinal !== undefined
      && rowOrdinal === baseOrdinal;

    if (isChosenBaseRow)
    {
      iconIndex = 91;
    }

    const extData = {
      data: equip,
      error: errorText,
    };

    if (hasUnit)
    {
      extData.unitOrdinal = unitSlot.unitOrdinal;
      extData.unitsTotal = unitSlot.unitsTotal;
    }

    const command = new WindowCommandBuilder(rowName)
      .setSymbol('refine-object')
      .setEnabled(enabled)
      .setExtensionData(extData)
      .setIconIndex(iconIndex)
      .setColorIndex(nameColorIndex)
      .setRightText(rightText)
      .setHelpText(equip.description)
      .build();

    this.addBuiltCommand(command);
  }
}

export default Window_RefinableList;

//endregion Window_RefinableList