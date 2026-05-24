//region Scene_Menu (APT)
import Scene_Aptitude from './Scene_Aptitude.js';

/**
 * Extends {@link #createCommandWindow}.</br>
 * Adds a handler for the Aptitude menu command.
 */
J.APT.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.APT.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // set the handler for our custom command.
  this._commandWindow.setHandler('aptitude', this.commandAptitude.bind(this));
};

/**
 * Opens the Aptitude scene.
 */
Scene_Menu.prototype.commandAptitude = function()
{
  // push the new scene onto the stack.
  Scene_Aptitude.callScene();
};
//endregion Scene_Menu (APT)