//region Game_Map
/**
 * Extends {@link #setup}.<br/>
 * Upon map initialization, assigns a random integer between 1-100 to an arbitrary variable.
 * In CA, this value is used to determine the presence of "rare/named" monsters on the map.
 */
J.CAMods.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.CAMods.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // update rare/named enemy variable.
  $gameVariables.setValue(13, Math.randomInt(100) + 1);
};
//endregion Game_Map