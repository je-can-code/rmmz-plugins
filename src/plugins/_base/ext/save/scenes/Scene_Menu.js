//region Scene_Menu
import Scene_Files from './Scene_Files.js';

/**
 * Overwrites {@link #commandSave}.<br/>
 * Opens the files scene rather than vanilla's save screen.
 *
 * The symbol stays `save` on purpose even though the command no longer saves. It is internal - the
 * player sees the label, which {@link Window_MenuCommand.addSaveCommand} sets - and every consumer of
 * that symbol is a handler registration in somebody else's menu. Renaming it would mean editing the
 * scene that binds the handler and the plugin parameters that describe it, in exchange for nothing the
 * player could ever observe.
 */
Scene_Menu.prototype.commandSave = function()
{
  Scene_Files.callFromMenu();
};
//endregion Scene_Menu