//region plugin commands
import Scene_JaftingRefine from '../scenes/Scene_JaftingRefine.js';

/**
 * A plugin command.<br>
 * Calls the JAFTING refinement menu.
 */
PluginManager.registerCommand(J.JAFTING.EXT.REFINE.Metadata.name, "call-menu", () =>
{
  Scene_JaftingRefine.callScene();
});
//endregion plugin commands