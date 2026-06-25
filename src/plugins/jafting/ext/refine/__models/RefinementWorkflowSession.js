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
  /**
   * Performs the refinement transaction: remove inputs, stamp the hydrated output row, then register it through
   * {@link JaftingManager.createRefinedOutput} (dynamic id allocation + party gain).
   *
   * @param {Game_Item} baseItem The base item driving this step.
   * @param {Game_Item} materialItem The material item driving this step.
   * @param {RPG_EquipItem} outputEquip The output equip driving this step.
   * @returns {{ ok: boolean, reason: string|null }}
   */
  commitRefinement(baseItem, materialItem, outputEquip)
  {
    // unwrap the Game_Item wrappers to get the underlying RPG datums.
    const baseDatum = baseItem.object();
    const materialDatum = materialItem.object();

    // snapshot lineage **before** `gainItem` removes copies—`afterPartyLostItem` can clear keyed party bags or
    // resync `unitLedgers` once counts drop, which would otherwise merge from an empty base and drop craft stamps.
    const mergedLedger = JaftingSalvageManager.buildRefinementOutputLedger(baseDatum, materialDatum);

    $gameParty.gainItem(baseItem, -1);
    $gameParty.gainItem(materialItem, -1);

    outputEquip._jaftingSalvageLedger = mergedLedger;

    // hands the stamped RPG row to JAFTING core so it picks the next dynamic weapon/armor slot and `gainItem`s it.
    JaftingManager.createRefinedOutput(outputEquip);
    this.markCommittedReturnToBase();

    return { ok: true, reason: null };
  }
}

export default RefinementWorkflowSession;

//endregion RefinementWorkflowSession