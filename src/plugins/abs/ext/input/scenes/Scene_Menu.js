//region Scene_Menu
import Scene_JabsRemap from './Scene_JabsRemap.js';
/**
 * Extends {@link #createCommandWindow}.<br/>
 * Also wires the handler for opening the JABS input remapping scene.
 */
J.ABS.EXT.INPUT.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.ABS.EXT.INPUT.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // wire the handler for our custom command symbol.
  this.commandWindow().setHandler('jabsRemap', () =>
  {
    // open the JABS remapping scene.
    SceneManager.push(Scene_JabsRemap);
  });
};
//endregion Scene_Menu