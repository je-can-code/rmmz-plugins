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

  // capture character for downstream policy in this routine.
  const character = jabsBattler.getCharacter();

  // capture level override for downstream policy in this routine.
  const levelOverride = character.getLevelOverrides();
  if (levelOverride !== null)
  {
    battler.setCachedLevelOverride(levelOverride);

    // when J.NATURAL, take this branch.
    if (J.NATURAL)
    {
      battler.refreshAllParameterBuffs();
    }
  }
};
//endregion JABS_AiManager