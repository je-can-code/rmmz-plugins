//region JABS_SkillSlot
/**
 * Emits combo-chain cleared **before** JABS resets combo ids (extensions only; idle flush handles strike release).
 */
J.POPUPS.EXT.ABS.Aliased.JABS_SkillSlot.set('handleComboReadiness', JABS_SkillSlot.prototype.handleComboReadiness);
JABS_SkillSlot.prototype.handleComboReadiness = function()
{
  const cooldown = this.getCooldown();

  // when cooldown.needsComboClear(), take this branch.
  if (cooldown.needsComboClear())
  {
    const battlers = JABS_AiManager.getAllBattlers();

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < battlers.length; i++)
    {
      const candidate = battlers[i];
      const slot = candidate.getBattler()
        .getSkillSlotManager()
        .getSkillSlotByKey(this.key);

      // when slot  equals  this, take this branch.
      if (slot === this)
      {
        J.POPUPS.notifyComboChainCleared(candidate, this.key);
        break;
      }
    }
  }

  // perform original logic.
  J.POPUPS.EXT.ABS.Aliased.JABS_SkillSlot.get('handleComboReadiness')
    .call(this);
};
//endregion JABS_SkillSlot