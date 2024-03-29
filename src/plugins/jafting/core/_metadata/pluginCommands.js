//region plugin commands
/**
 * A plugin command.<br>
 * Calls the core JAFTING menu.
 */
PluginManager.registerCommand(
  J.JAFTING.Metadata.name,
  "call-menu",
  () =>
  {
    Scene_Jafting.callScene();
  });
//endregion plugin commands