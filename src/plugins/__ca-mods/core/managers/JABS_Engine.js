//region JABS_Engine
/**
 * Extends {@link #canGainReward}.<br/>
 * Inanimate enemies (trees, shrubs, ore deposits, destructibles) do not grant any rewards in CA.
 * Their levels are intentionally high to gate resource access — not to serve as experience farms.
 * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
 * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
 * @returns {boolean} False if the defeated enemy is inanimate, otherwise defers to the base check.
 */
J.CAMods.Aliased.JABS_Engine.set('canGainReward', JABS_Engine.prototype.canGainReward);
JABS_Engine.prototype.canGainReward = function(defeatedEnemy, victoriousActor)
{
  // inanimate objects never grant EXP, gold, SDP, or AP in CA.
  if (defeatedEnemy.isInanimate() === true)
  {
    return false;
  }

  // perform original logic for all other cases.
  return J.CAMods.Aliased.JABS_Engine.get('canGainReward')
    .call(this, defeatedEnemy, victoriousActor);
};
//endregion JABS_Engine