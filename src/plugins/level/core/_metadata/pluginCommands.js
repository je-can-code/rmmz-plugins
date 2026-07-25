//region Plugin Command Registration
/**
 * Plugin command for enabling the level scaling functionality.
 */
PluginManager.registerCommand(J.LEVEL.Metadata.name, "enableScaling", () =>
{
  $gameSystem.enableLevelScaling();
});

/**
 * Plugin command for disabling the level scaling functionality.
 */
PluginManager.registerCommand(J.LEVEL.Metadata.name, "disableScaling", () =>
{
  $gameSystem.disableLevelScaling();
});
//endregion Plugin Command Registration