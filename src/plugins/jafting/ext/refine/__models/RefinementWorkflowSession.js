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
   * Performs the refinement transaction: remove inputs, stamp the hydrated output row, then register it through
   * {@link JaftingManager.createRefinedOutput} (dynamic id allocation + party gain).
   *
   * Both inputs arrive as the database rows themselves rather than `Game_Item` wrappers, because that is what the
   * refinable list windows carry and what `gainItem` reads an `id` off of further down.
   *
   * @param {RPG_EquipItem} baseDatum The base equip driving this step.
   * @param {RPG_EquipItem} materialDatum The material equip driving this step.
   * @param {RPG_EquipItem} outputEquip The output equip driving this step.
   * @returns {{ ok: boolean, reason: string|null }}
   */
  commitRefinement(baseDatum, materialDatum, outputEquip)
  {

    // snapshot lineage **before** `gainItem` removes copies—`afterPartyLostItem` can clear keyed party bags or
    // resync `unitLedgers` once counts drop, which would otherwise merge from an empty base and drop craft stamps.
    const mergedLedger = JaftingSalvageManager.buildRefinementOutputLedger(baseDatum, materialDatum);

    // refinement provenance is captured here for the same reason and one step further: when an input was itself a
    // refined row, spending its last copy makes `reclaimDynamicWeaponSlot` splice its lineage out of the party's
    // tracking list *and* blank its `$data*` slot. Reading it after the spend would find nothing to nest.
    const baseLineage = JaftingManager.lineageForDatum(baseDatum);
    const materialLineage = JaftingManager.lineageForDatum(materialDatum);

    $gameParty.gainItem(baseDatum, -1);
    $gameParty.gainItem(materialDatum, -1);

    outputEquip._jaftingSalvageLedger = mergedLedger;

    // hands the stamped RPG row to JAFTING core so it picks the next dynamic weapon/armor slot and `gainItem`s it.
    JaftingManager.createRefinedOutput(outputEquip, baseLineage, materialLineage);
    this.markCommittedReturnToBase();

    return { ok: true, reason: null };
  }
}

export default RefinementWorkflowSession;

//endregion RefinementWorkflowSession