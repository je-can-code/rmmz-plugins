//region Game_System
/**
 * Extends {@link #onAfterLoad}.<br>
 * Updates the database with the tracked refined equips.
 */
J.JAFTING.EXT.REFINE.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.JAFTING.EXT.REFINE.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // update the weapons & armor.
  $gameParty.refreshDatabaseWeapons();
  $gameParty.refreshDatabaseArmors();
};
//endregion Game_System