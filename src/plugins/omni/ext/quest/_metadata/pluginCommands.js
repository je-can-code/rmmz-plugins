//region plugin commands
/**
 * Plugin command for unlocking quests by their keys.
 */
PluginManager.registerCommand(J.OMNI.EXT.QUEST.Metadata.name, "unlock-quests", args =>
{
  const { keys } = args;
  const questKeys = JSON.parse(keys);
  questKeys.forEach(questKey => QuestManager.unlockQuestByKey(questKey));
});

/**
 * Plugin command for progressing a quest of a given key.
 */
PluginManager.registerCommand(J.OMNI.EXT.QUEST.Metadata.name, "progress-quest", args =>
{
  const { key } = args;
  QuestManager.progressQuest(key);
});

/**
 * Plugin command for finalizing a quest of a given key with the specified state .
 */
PluginManager.registerCommand(J.OMNI.EXT.QUEST.Metadata.name, "finalize-quest", args =>
{
  const {
    key,
    state
  } = args;
  const quest = QuestManager.quest(key);
  switch (state)
  {
    case 0:
      quest.flagAsCompleted();
      break;
    case 1:
      quest.flagAsFailed();
      break;
    case 2:
      quest.flagAsMissed();
      break;
  }
});

/**
 * Plugin command for setting the tracking state of a quest by its key.
 */
PluginManager.registerCommand(J.OMNI.EXT.QUEST.Metadata.name, "set-quest-tracking", args =>
{
  const {
    key,
    trackingState
  } = args;
  QuestManager.setQuestTrackingByKey(key, trackingState);
});
//endregion plugin commands