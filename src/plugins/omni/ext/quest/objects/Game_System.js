//region Game_System
/**
 * Update the saved data with the running cache.
 */
J.OMNI.EXT.QUEST.Aliased.Game_System.set('onBeforeSave', Game_System.prototype.onBeforeSave);
Game_System.prototype.onBeforeSave = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_System.get('onBeforeSave')
    .call(this);

  // update the cache into saveable data.
  $gameParty.synchronizeQuestopediaDataBeforeSave();
};

/**
 * Extends {@link #onAfterLoad}.<br>
 * Updates the database with the tracked refined equips.
 */
J.OMNI.EXT.QUEST.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // update the quests.
  $gameParty.updateTrackedOmniQuestsFromConfig();
  $gameParty.synchronizeQuestopediaAfterLoad();
};
//endregion Game_System