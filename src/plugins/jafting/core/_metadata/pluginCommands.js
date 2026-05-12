//region plugin commands
/**
 * A plugin command.<br>
 * Calls the core JAFTING menu.
 */
PluginManager.registerCommand(J.JAFTING.Metadata.name, "call-menu", () =>
{
  Scene_Jafting.callScene();
});

/**
 * A plugin command.<br>
 * Opens the JAFTING salvage scene directly (bypasses hub switch gating on
 * {@link Scene_JaftingSalvage.isSalvageHubCommandEnabled}).
 */
PluginManager.registerCommand(J.JAFTING.Metadata.name, "call-salvage", () =>
{
  Scene_JaftingSalvage.callScene();
});
//endregion plugin commands