//region Scene_Menu
import Scene_JabsLoadout from './Scene_JabsLoadout.js';

/**
 * Extends {@link #createCommandWindow}.<br/>
 * Adds a handler for the loadout menu command.
 */
J.ABS.EXT.LOADOUT.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.ABS.EXT.LOADOUT.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // set the handler for our custom command.
  this.commandWindow().setHandler('jabs-loadout', this.commandJabsLoadout.bind(this));
};

/**
 * Opens the loadout scene.
 */
Scene_Menu.prototype.commandJabsLoadout = function()
{
  // push the new scene onto the stack.
  Scene_JabsLoadout.callScene();
};
//endregion Scene_Menu
