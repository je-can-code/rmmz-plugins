//region TrackedOmniObjective
/**
 * Extends {@link onObjectiveUpdate}.<br/>
 * Also refreshes the HUD for tracked quests.
 */
J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective.set('onObjectiveUpdate', TrackedOmniObjective.prototype.onObjectiveUpdate);
TrackedOmniObjective.prototype.onObjectiveUpdate = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective.get('onObjectiveUpdate')
    .call(this);

  // check if this quest is being tracked in the HUD.
  if (QuestManager.quest(this.questKey).tracked)
  {
    // refresh the quest status.
    $hudManager.requestQuestRefresh();
  }
};
//endregion TrackedOmniObjective