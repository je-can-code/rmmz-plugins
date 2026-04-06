//region Game_Actor
/**
 * Gets all sources that contribute to the hp cost reduction.
 * @returns {[RPG_Actor, RPG_Class, RPG_EquipItem[], RPG_State[]]}
 */
Game_Actor.prototype.hcrSources = function()
{
  return [
    this.databaseData(),
    this.currentClass(),
    ...this.equippedEquips(),
    ...this.allStates(),
  ];
};
//endregion Game_Actor