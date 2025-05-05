//region Plugin Command Registration
/**
 * Plugin command for enabling the level scaling functionality.
 */
PluginManager.registerCommand(J.LEVEL.Metadata.name, "enableScaling", () =>
{
  J.LEVEL.Metadata.enabled = true;
  $gameSystem.enableLevelScaling();
});

/**
 * Plugin command for disabling the level scaling functionality.
 */
PluginManager.registerCommand(J.LEVEL.Metadata.name, "disableScaling", () =>
{
  J.LEVEL.Metadata.enabled = false;
  $gameSystem.disableLevelScaling();
});
//endregion Plugin Command Registration