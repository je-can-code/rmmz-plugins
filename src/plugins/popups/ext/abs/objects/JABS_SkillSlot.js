//region JABS_SkillSlot
/**
 * Emits combo-chain cleared **before** JABS resets combo ids (extensions only; idle flush handles strike release).
 */
J.POPUPS.EXT.ABS.Aliased.JABS_SkillSlot.set('handleComboReadiness', JABS_SkillSlot.prototype.handleComboReadiness);
JABS_SkillSlot.prototype.handleComboReadiness = function()
{
  const cooldown = this.getCooldown();

  if (cooldown.needsComboClear())
  {
    const battlers = JABS_AiManager.getAllBattlers();

    for (let i = 0; i < battlers.length; i++)
    {
      const candidate = battlers[i];
      const slot = candidate.getBattler()
        .getSkillSlotManager()
        .getSkillSlotByKey(this.key);

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