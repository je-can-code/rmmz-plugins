//region Game_Enemy
/**
 * Gets all sources that contribute to the hp cost reduction.
 * @returns {[RPG_Enemy, RPG_State[]]}
 */
Game_Enemy.prototype.hcrSources = function()
{
  return [
    this.databaseData(), ...this.allStates(),
  ];
};
//endregion Game_Enemy