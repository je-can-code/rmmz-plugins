//region BattleManager
/**
 * Gets the rewards accrued from the battle currently being resolved.
 * @returns {{exp: number, gold: number, items: RPG_BaseItem[]}} The battle rewards.
 */
BattleManager.rewards = function()
{
  // hand back the rewards bundle built when the battle was won.
  return this._rewards;
};
/**
 * Sets the rewards accrued from the battle currently being resolved.
 * @param {{exp: number, gold: number, items: RPG_BaseItem[]}} newRewards The rewards bundle.
 */
BattleManager.setRewards = function(newRewards)
{
  // assign the rewards bundle.
  this._rewards = newRewards;
};
//endregion BattleManager
