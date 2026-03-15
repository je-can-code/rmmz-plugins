//region Game_Battler
/**
 * Gets the AP points this battler yields upon defeat..
 * @returns {number}
 */
Game_Battler.prototype.apPoints = function()
{
  return this.databaseData().apPoints;
};

//endregion Game_Battler