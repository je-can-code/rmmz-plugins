//region Game_Actor
/**
 * Extends {@link #getPassiveStateSources}.<br/>
 * Also includes the source carrying every state the difficulty layers in force grant actors. A
 * difficulty is a passive that is on for everyone, perpetually, so every actor draws from the same
 * source.
 * @returns {RPG_BaseItem[]}
 */
J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Actor.set(
  'getPassiveStateSources',
  Game_Actor.prototype.getPassiveStateSources);
Game_Actor.prototype.getPassiveStateSources = function()
{
  // perform original logic.
  const sources = J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Actor.get('getPassiveStateSources')
    .call(this);

  // the source carrying the actor states of every layer in force.
  const difficultySources = $gameTemp.actorDifficultySources();

  // a new list, so the list the original handed back is never mutated.
  return [ ...sources, ...difficultySources ];
};
//endregion Game_Actor