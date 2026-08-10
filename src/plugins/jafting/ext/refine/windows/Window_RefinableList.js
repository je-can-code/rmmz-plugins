//region Window_RefinableList
import RefinementEligibility from './../managers/RefinementEligibility.js';

/**
 * Refinement equip list + its one remaining paint helper.<br>
 * <br>
 * **Two different questions, and only one of them lives here now.** Whether a row is usable, and how usable rows
 * order against unusable ones, is {@link RefinementEligibility} - decided for every row before any row is drawn,
 * because a sort cannot put the usable ones first while each row only learns its own verdict as it is built.
 * {@link refinableEquipHasSalvageStamp} stays, and drives **per-row paint** when the stack UI passes a `unitOrdinal`
 * so only the expanded copy shows the hollow diamond from
 * {@link J.JAFTING.EXT.REFINE.Messages.RefinableListSalvageStampPrefix}.<br>
 * Keep those roles split—ordering on a `unitOrdinal` would scramble identical rows every refresh.
 */
/**
 * True when this row should show dismantle lineage styling (per stack slot when expanded).
 *
 * @param {RPG_EquipItem} equip The equip driving this step.
 * @param {number|undefined|null} unitOrdinal The unit ordinal driving this step.
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
    // perform original logic, which seeds this window's members via initMembers and then builds the
    // command list from them.
    super(rect);

    // this list sits inside the refinement panel, which draws the frame and the column heading above it.
    // a second frame here would box a column that is already boxed.
    this.opacity = 0;
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
   * Overwrites {@link #itemTextAlign}.<br/>
   * Sets the alignment for this command window to be left-aligned.
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

    // drop whatever could never fill this role at all. offering a row and then refusing it is a tease, which is a
    // rule this list already followed for outright-unrefinable gear; the per-role flags mean the same thing.
    const offerable = equips.filter(equip => !RefinementEligibility.isPermanentlyExcluded(equip, this.isPrimary));

    // judge every row up front, then order them. doing it in this order is the entire fix: eligibility used to be
    // worked out while a row was being drawn, so the sort ran first against nothing and a player hunting for their
    // one valid donor scrolled past every invalid one to reach it.
    const judged = offerable.map(equip => ({
      equip,
      verdict: RefinementEligibility.evaluate(equip, this.isPrimary, this.baseSelection),
    }));

    judged.sort(RefinementEligibility.compareCandidates);

    // one row per physical copy for normal weapons/armors; stack counts only for configured material types.
    judged.forEach(candidate =>
    {
      const { equip, verdict } = candidate;
      const isStackCountedRow = JaftingSalvageLedger.isStackCountedRefinableEquip(equip);
      const count = $gameParty.numItems(equip);

      if (count < 1)
      {
        return;
      }

      if (isStackCountedRow)
      {
        this.addRefinableEquipCommand(equip, null, verdict);

        // exit early without a payload.
        return;
      }

      for (let u = 0; u < count; u++)
      {
        const unitSlot = { unitOrdinal: u, unitsTotal: count };

        this.addRefinableEquipCommand(equip, unitSlot, verdict);
      }
    });
  }

  /**
   * Builds and appends one refinable row (salvage stamp label, optional stack count, per-copy markers).
   *
   * The verdict arrives already decided by {@link RefinementEligibility}, shared by every copy of this template.
   * What is left here is genuinely per-copy: marking the exact copy the player committed as the base, and refusing
   * to feed that copy to itself. Neither is knowable from the template alone.
   *
   * @param {RPG_EquipItem} equip The equip driving this step.
   * @param {{ unitOrdinal: number, unitsTotal: number }|null} unitSlot Pass null for stack-counted material rows.
   * @param {{ enabled: boolean, iconIndex: number, errorText: string }} verdict This template's eligibility.
   */
  addRefinableEquipCommand(equip, unitSlot, verdict)
  {
    const isStackCountedRow = JaftingSalvageLedger.isStackCountedRefinableEquip(equip);
    const hasUnit = unitSlot !== null;

    // a stack-counted template gets exactly one row and a per-copy template gets exactly one row per copy, so these
    // agreeing means the caller and this method disagree about which kind of row is being built.
    if (isStackCountedRow === hasUnit)
    {
      return;
    }

    const rowOrdinal = hasUnit
      ? unitSlot.unitOrdinal
      : null;
    const isChosenBaseCopy = this.isChosenBaseCopy(equip, rowOrdinal);
    const label = this.rowLabelFor(equip, rowOrdinal);

    // the template's verdict is the floor; a donor row additionally cannot be the very copy already committed as
    // the base, which is the one thing the template could not have told us.
    const enabled = verdict.enabled && this.isSpendableCopy(equip, isChosenBaseCopy);
    const iconIndex = isChosenBaseCopy
      ? RefinementEligibility.ChosenBaseIcon
      : verdict.iconIndex;
    const rightText = isStackCountedRow
      ? `x${$gameParty.numItems(equip)}`
      : String.empty;

    const extData = {
      data: equip,
      error: verdict.errorText,
    };

    if (hasUnit)
    {
      extData.unitOrdinal = unitSlot.unitOrdinal;
      extData.unitsTotal = unitSlot.unitsTotal;
    }

    // a row the player cannot use answers the question they are actually asking. Its flavour text is no
    // longer the interesting thing about it, and the verdict already knows why - it was being computed,
    // carried this far, and then discarded in favour of the description.
    const helpText = enabled
      ? equip.description
      : this.blockedReasonText(verdict);

    // construct command for the next step in this routine.
    const command = new WindowCommandBuilder(label.name)
      .setSymbol('refine-object')
      .setEnabled(enabled)
      .setExtensionData(extData)
      .setIconIndex(iconIndex)
      .setColorIndex(label.colorIndex)
      .setRightText(rightText)
      .setHelpText(helpText)
      .build();

    this.addBuiltCommand(command);
  }

  /**
   * The verdict's reasons, tidied into something a two-line help window can show.
   *
   * The reasons accumulate as a run-on string because more than one can apply at once, and they are not
   * consistent about how they end - some close with a newline, some with `<br>`. Normalizing here rather
   * than at each message keeps the messages readable as sentences.
   * @param {{ enabled: boolean, iconIndex: number, errorText: string }} verdict This row's eligibility.
   * @returns {string}
   */
  blockedReasonText(verdict)
  {
    return verdict.errorText.replaceAll('<br>', String.empty)
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  /**
   * Whether this row is the exact physical copy the player already committed as the base.
   *
   * Both halves matter. The same template is not enough - a player who owns three of a weapon may refine one into
   * another - and an ordinal only means something once a base copy has actually been locked in.
   *
   * @param {RPG_EquipItem} equip The equip this row draws.
   * @param {number|null} rowOrdinal Which copy this row is, or null for a stack-counted row.
   * @returns {boolean}
   */
  isChosenBaseCopy(equip, rowOrdinal)
  {
    if (equip !== this.baseSelection)
    {
      return false;
    }

    if (rowOrdinal === null)
    {
      return false;
    }

    const baseOrdinal = this.baseSelectionUnitOrdinal;

    if (baseOrdinal === null)
    {
      return false;
    }

    return rowOrdinal === baseOrdinal;
  }

  /**
   * Whether this copy may be spent as the donor.
   *
   * A template can be fed to itself - two of the same sword merging is legitimate - but only when a second copy
   * exists to be consumed, and never using the very copy standing in as the base.
   *
   * @param {RPG_EquipItem} equip The equip this row draws.
   * @param {boolean} isChosenBaseCopy Whether this row is the committed base copy.
   * @returns {boolean}
   */
  isSpendableCopy(equip, isChosenBaseCopy)
  {
    // the base list spends nothing, so there is no copy to protect.
    if (this.isPrimary)
    {
      return true;
    }

    // a different template can never collide with the base.
    if (equip !== this.baseSelection)
    {
      return true;
    }

    const templateStack = $gameParty.numItems(this.baseSelection);

    return templateStack > 1 && isChosenBaseCopy === false;
  }

  /**
   * The name and colour a row draws with.
   *
   * Dismantle lineage earns the hollow diamond, and a refine counter earns the same accent even when the merged
   * salvage rows came out empty - a `+N` output should not look like stock gear just because its donor was a
   * vendor shell with nothing to refund.
   *
   * @param {RPG_EquipItem} equip The equip this row draws.
   * @param {number|null} rowOrdinal Which copy this row is, or null for a stack-counted row.
   * @returns {{ name: string, colorIndex: number }}
   */
  rowLabelFor(equip, rowOrdinal)
  {
    const hasSalvageStamp = refinableEquipHasSalvageStamp(equip, rowOrdinal);
    const stamped = hasSalvageStamp || equip.jaftingRefinedCount > 0;

    if (!stamped)
    {
      return {
        name: equip.name,
        colorIndex: 0,
      };
    }

    const { RefinableListSalvageStampPrefix } = J.JAFTING.EXT.REFINE.Messages;

    return {
      name: `${RefinableListSalvageStampPrefix}${equip.name}`,
      colorIndex: 6,
    };
  }
}

export default Window_RefinableList;

//endregion Window_RefinableList