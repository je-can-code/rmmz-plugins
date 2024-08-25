//region plugin commands
/**
 * Plugin command for doing the thing.
 */
PluginManager.registerCommand(
  J.HUD.EXT.QUEST.Metadata.name,
  "do-the-thing",
  args =>
  {
    console.log('did the thing.');
  });
//endregion plugin commands