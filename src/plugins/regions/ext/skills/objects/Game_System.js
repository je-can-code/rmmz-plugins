//region Game_System
/**
 * Updates the region skills after loading a game.
 */
J.REGIONS.EXT.SKILLS.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.REGIONS.EXT.SKILLS.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // update from the latest plugin metadata.
  this.updateRegionSkillsAfterLoad();
};

/**
 * Re-initializes the region skills for the map and characters.
 */
Game_System.prototype.updateRegionSkillsAfterLoad = function()
{
  $gameMap.initRegionSkillsMembers();
  $gameMap.setupRegionSkills();
  $gamePlayer.initRegionSkillsMembers();
  $gamePlayer.followers()
    .data()
    .forEach(follower => follower.initRegionSkillsMembers());
};

//endregion Game_System