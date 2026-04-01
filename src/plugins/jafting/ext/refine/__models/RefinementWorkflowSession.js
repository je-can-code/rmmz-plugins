//region RefinementWorkflowSession
/**
 * Owns Refinement scene phases and bundles party/database mutations for a confirmed refine into one call.
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
   * Performs the refinement transaction: remove inputs, add refined output via {@link JaftingManager}.
   *
   * @param {Game_Item|null|undefined} baseItem
   * @param {Game_Item|null|undefined} materialItem
   * @param {RPG_EquipItem|null|undefined} outputEquip
   * @returns {{ ok: boolean, reason: string|null }}
   */
  commitRefinement(baseItem, materialItem, outputEquip)
  {
    if (baseItem === null || baseItem === undefined)
    {
      return { ok: false, reason: 'missing_base' };
    }

    if (materialItem === null || materialItem === undefined)
    {
      return { ok: false, reason: 'missing_material' };
    }

    if (outputEquip === null || outputEquip === undefined)
    {
      return { ok: false, reason: 'missing_output' };
    }

    $gameParty.gainItem(baseItem, -1);
    $gameParty.gainItem(materialItem, -1);
    JaftingManager.createRefinedOutput(outputEquip);
    this.markCommittedReturnToBase();

    return { ok: true, reason: null };
  }
}

//endregion RefinementWorkflowSession
