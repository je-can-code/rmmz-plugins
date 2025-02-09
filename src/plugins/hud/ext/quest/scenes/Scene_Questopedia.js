//region Scene_Questopedia
/**
 * Extends {@link onQuestopediaListSelection}.<br/>
 * Triggers a HUD update request when something is selected in the list of quests.
 */
J.HUD.EXT.QUEST.Aliased.Scene_Questopedia.set(
  'onQuestopediaListSelection',
  Scene_Questopedia.prototype.onQuestopediaListSelection);
Scene_Questopedia.prototype.onQuestopediaListSelection = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.Scene_Questopedia.get('onQuestopediaListSelection')
    .call(this);

  // also refresh the HUD when the user gets back to the map if they added/removed trackings of quests.
  $hudManager.requestQuestRefresh();
}

//endregion Scene_Questopedia