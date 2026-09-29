//region Scene_Menu
import Scene_Classes from './Scene_Classes.js';

/**
 * Extends {@link #createCommandWindow}.<br/>
 * Adds a handler for the class command.
 */
J.CLASS.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.CLASS.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // set the handler for the class command.
  this.commandWindow()
    .setHandler('classes', this.commandClasses.bind(this));
};

/**
 * Opens the class scene from the main menu.
 */
Scene_Menu.prototype.commandClasses = function()
{
  // the scene decides for itself whether the menu may change classes.
  Scene_Classes.callFromMenu();
};
//endregion Scene_Menu