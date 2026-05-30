//region RefinementWorkflowSession
import JaftingManager from './../managers/JaftingManager.js';

/**
 * Small state machine for {@link Scene_JaftingRefine}: which list the player is on (base vs material vs confirm).<br>
 * <br>
 * **Why this exists beside the scene:** keeps phase transitions in one place so windows only advance the tracked phase
 * through these named methods—easier to grep than scattered string literals.<br>
 * <br>
 * **Money method:** {@link RefinementWorkflowSession#commitRefinement} is the only place that should spend inputs and
 * mint output; it merges salvage ledgers **before** `gainItem(-1)` so party hooks that prune bags cannot erase lineage
 * the output row still needs (see inline ordering in that method).
 */
class RefinementWorkflowSession
{
  /**
   * UX phases for base → material → confirm.
   */
  static Phase = {
    PickingBase: 'picking_base',
    PickingMaterial: 'picking_material',
    Confirming: 'confirming',
  };

  /**
   * @type {string}
   */
  #phase = RefinementWorkflowSession.Phase.PickingBase;

  /**
   * Resets when entering the scene.
   */
  reset()
  {
    this.#phase = RefinementWorkflowSession.Phase.PickingBase;
  }

  /**
   * @returns {string}
   */
  getPhase()
  {
    return this.#phase;
  }

  /**
   * @returns {{ phase: string }}
   */
  snapshot()
  {
    return { phase: this.#phase };
  }

  /**
   * Base equip chosen; list UI should switch to material selection.
   */
  beginMaterialSelection()
  {
    this.#phase = RefinementWorkflowSession.Phase.PickingMaterial;
  }

  /**
   * User backed out of material list to base list.
   */
  returnToBaseSelection()
  {
    this.#phase = RefinementWorkflowSession.Phase.PickingBase;
  }

  /**
   * Material chosen; show confirmation window.
   */
  beginConfirmation()
  {
    this.#phase = RefinementWorkflowSession.Phase.Confirming;
  }

  /**
   * User cancelled confirm; return to material selection.
   */
  returnToMaterialSelection()
  {
    this.#phase = RefinementWorkflowSession.Phase.PickingMaterial;
  }

  /**
   * Successful commit returns to base pick for the next round.
   */
  markCommittedReturnToBase()
  {
    this.#phase = RefinementWorkflowSession.Phase.PickingBase;
  }

  /**
   * Refinement lists hand {@link Scene_JaftingRefine} raw RPG datums; menus may still wrap rows in {@link Game_Item}.
   *
   * @param {Game_Item|RPG_Base|null|undefined} partyItem The party item driving this step.
   * @returns {RPG_Base|null}
   */
  static datumFromPartyItem(partyItem)
  {
    if (partyItem === null || partyItem === undefined)
    {
      return null;
    }

    // when partyItem instanceof Game_Item, take this branch.
    if (partyItem instanceof Game_Item)
    {
      return partyItem.object();
    }

    // hand back party item to the caller.
    return partyItem;
  }

  /**
   * Performs the refinement transaction: remove inputs, stamp the hydrated output row, then register it through
   * {@link JaftingManager.createRefinedOutput} (dynamic id allocation + party gain).<br>
   * Callers pass {@link Game_Item} wrappers from list windows; tests may pass bare datums—{@link
   * RefinementWorkflowSession.datumFromPartyItem} normalizes once here.
   *
   * @param {Game_Item|null|undefined} baseItem The base item driving this step.
   * @param {Game_Item|null|undefined} materialItem The material item driving this step.
   * @param {RPG_EquipItem|null|undefined} outputEquip The output equip driving this step.
   * @returns {{ ok: boolean, reason: string|null }}
   */
  commitRefinement(baseItem, materialItem, outputEquip)
  {
    if (baseItem === null || baseItem === undefined)
    {
      return { ok: false, reason: 'missing_base' };
    }

    // when materialItem  equals  null  or  materialItem  equals  undefined, take this branch.
    if (materialItem === null || materialItem === undefined)
    {
      return { ok: false, reason: 'missing_material' };
    }

    // when outputEquip  equals  null  or  outputEquip  equals  undefined, take this branch.
    if (outputEquip === null || outputEquip === undefined)
    {
      return { ok: false, reason: 'missing_output' };
    }

    // lists already resolved hydration-friendly RPG rows; tests sometimes pass bare datums—normalize once here.
    const baseDatum = RefinementWorkflowSession.datumFromPartyItem(baseItem);
    const materialDatum = RefinementWorkflowSession.datumFromPartyItem(materialItem);

    // snapshot lineage **before** `gainItem` removes copies—`afterPartyLostItem` can clear keyed party bags or
    // resync `unitLedgers` once counts drop, which would otherwise merge from an empty base and drop craft stamps.
    const mergedLedger = JaftingSalvageManager.buildRefinementOutputLedger(baseDatum, materialDatum);

    // policy step inside commit refinement.
    $gameParty.gainItem(baseItem, -1);
    $gameParty.gainItem(materialItem, -1);

    // policy step inside commit refinement.
    outputEquip._jaftingSalvageLedger = mergedLedger;

    // hands the stamped RPG row to JAFTING core so it picks the next dynamic weapon/armor slot and `gainItem`s it.
    JaftingManager.createRefinedOutput(outputEquip);
    this.markCommittedReturnToBase();

    // hand back { ok: true, reason: null } to the caller.
    return { ok: true, reason: null };
  }
}

export default RefinementWorkflowSession;

//endregion RefinementWorkflowSession