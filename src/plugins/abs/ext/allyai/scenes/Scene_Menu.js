//region Scene_Menu
import Scene_JabsAllyAi from './Scene_JabsAllyAi.js';

/**
 * Extends {@link #createCommandWindow}.<br/>
 * Adds a handler for the ally AI menu command.
 */
J.ABS.EXT.ALLYAI.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // set the handler for our custom command.
  this.commandWindow()
    .setHandler('ally-ai', this.commandJabsAllyAi.bind(this));
};

/**
 * Opens the ally AI scene.
 */
Scene_Menu.prototype.commandJabsAllyAi = function()
{
  // push the new scene onto the stack.
  Scene_JabsAllyAi.callScene();
};
//endregion Scene_Menu
