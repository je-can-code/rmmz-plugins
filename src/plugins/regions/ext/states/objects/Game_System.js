//region Game_System
/**
 * Updates the list of all available proficiency conditionals from the latest plugin metadata.
 */
J.REGIONS.EXT.STATES.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.REGIONS.EXT.STATES.Aliased.Game_System.get('onAfterLoad').call(this);

  // update from the latest plugin metadata.
  this.updateRegionStatesAfterLoad();
};

/**
 * Re-initializes the region states for the map and characters.
 */
Game_System.prototype.updateRegionStatesAfterLoad = function()
{
  $gameMap.initRegionStatesMembers();
  $gameMap.setupRegionStates();
  $gamePlayer.initRegionStatesMembers();
  $gamePlayer.followers().data().forEach(follower => follower.initRegionStatesMembers());
};

//endregion Game_System