//region JABS_AiManager
/**
 * Extends {@link #postConvertMutate}.<br/>
 * Also applies the level override.
 * @param {Game_Enemy} battler The enemy battler that was converted from the event.
 * @param {JABS_Battler} jabsBattler The created JABS battler from the event.
 */
J.LEVEL.Aliased.JABS_AiManager.set('postConvertMutate', JABS_AiManager.postConvertMutate);
JABS_AiManager.postConvertMutate = function(battler, jabsBattler)
{
  // perform original logic.
  J.LEVEL.Aliased.JABS_AiManager.get('postConvertMutate')
    .call(this, battler, jabsBattler);

  const character = jabsBattler.getCharacter();

  const levelOverride = character.getLevelOverrides();
  if (levelOverride !== null)
  {
    battler.setCachedLevelOverride(levelOverride);

    if (J.NATURAL)
    {
      battler.refreshAllParameterBuffs();
    }
  }
};
//endregion JABS_AiManager