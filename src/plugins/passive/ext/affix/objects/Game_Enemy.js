//region Game_Enemy
/**
 * Computes the combined reward multiplier for a given reward type by scanning
 * both the enemy's database note and all currently applied states.
 * Multiple sources stack multiplicatively.
 * @param {string} rewardType The reward type key: exp, gold, sdp, ap, or drops.
 * @returns {number} The combined multiplier (1.0 when no tags are present).
 */
Game_Enemy.prototype.getRewardMultiplierByType = function(rewardType)
{
  // start with a neutral multiplier.
  let multiplier = 1.0;

  // check the enemy's database note for a base multiplier on this reward type.
  const enemyMultipliers = this.enemy().rewardMultipliers;
  if (enemyMultipliers.has(rewardType))
  {
    multiplier *= enemyMultipliers.get(rewardType);
  }

  // walk all states currently on this enemy and multiply in any matching reward tags.
  this.allStates().forEach(state =>
  {
    const stateMultipliers = state.rewardMultipliers;
    if (stateMultipliers.has(rewardType))
    {
      multiplier *= stateMultipliers.get(rewardType);
    }
  });

  // hand back multiplier to the caller.
  return multiplier;
};

/**
 * Extends {@link Game_Enemy.prototype.getDropMultiplierBonus}.<br/>
 * Folds in any reward multipliers for the "drops" type from this enemy's note and states.
 * @returns {number} The adjusted drop multiplier.
 */
J.PASSIVE.EXT.AFFIX.Aliased.Game_Enemy.set('getDropMultiplierBonus', Game_Enemy.prototype.getDropMultiplierBonus);
Game_Enemy.prototype.getDropMultiplierBonus = function()
{
  // perform original logic.
  const base = J.PASSIVE.EXT.AFFIX.Aliased.Game_Enemy.get('getDropMultiplierBonus')
    .call(this);

  // apply any reward multiplier tags for the drops type.
  const rewardMultiplier = this.getRewardMultiplierByType('drops');

  // hand back base * rewardMultiplier to the caller.
  return base * rewardMultiplier;
};
//endregion Game_Enemy