//region plugin commands
/**
 * Plugin command for completing a quest by its key.
 */
PluginManager.registerCommand(
  J.OMNI.EXT.QUEST.Metadata.name,
  "complete-quest",
  args =>
  {
    const { questKey } = args;
    QuestManager.quest(questKey).flagAsCompleted();
  });
//endregion plugin commands