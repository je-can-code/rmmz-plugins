//region TrackedOmniQuest
/**
 * Extends {@link refreshState}.<br/>
 * Also flags the HUD for refreshment.
 */
J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.set('refreshState', TrackedOmniQuest.prototype.refreshState);
TrackedOmniQuest.prototype.refreshState = function()
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.get('refreshState')
    .call(this);

  // also refresh the quest HUD with a progression of objectives.
  $hudManager.requestQuestRefresh();
};

/**
 * Unlocks this quest and actives the target objective. If no objectiveId is provided, then the first objective will be
 * made {@link OmniObjective.States.Active}.
 * @param {number=} objectiveId The id of the objective to initialize as active; defaults to the immediate or first.
 */
J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.set('unlock', TrackedOmniQuest.prototype.unlock);
TrackedOmniQuest.prototype.unlock = function(objectiveId = null)
{
  // perform original logic.
  J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest.get('unlock')
    .call(this, objectiveId);

  // check if we have any tracked quests.
  const hasNoTrackedQuests = QuestManager.trackedQuests().length === 0;

  // check if there is nothing else tracked, and this quest is now active.
  if (hasNoTrackedQuests && this.state === OmniQuest.States.Active)
  {
    // start tracking it!
    this.toggleTracked();

    // and also refresh the HUD.
    $hudManager.requestQuestRefresh();
  }
};

//endregion TrackedOmniQuest