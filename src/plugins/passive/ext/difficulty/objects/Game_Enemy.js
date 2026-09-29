//region Game_Enemy
/**
 * Extends {@link #getPassiveStateSources}.<br/>
 * Also includes the source carrying every state the difficulty layers in force grant enemies. A
 * difficulty is a passive that is on for everyone, perpetually, so every enemy draws from the same
 * source.
 * @returns {RPG_BaseItem[]}
 */
J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Enemy.set(
  'getPassiveStateSources',
  Game_Enemy.prototype.getPassiveStateSources);
Game_Enemy.prototype.getPassiveStateSources = function()
{
  // perform original logic.
  const sources = J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Enemy.get('getPassiveStateSources')
    .call(this);

  // the source carrying the enemy states of every layer in force.
  const difficultySources = $gameTemp.enemyDifficultySources();

  // a new list, so the list the original handed back is never mutated.
  return [ ...sources, ...difficultySources ];
};
//endregion Game_Enemy