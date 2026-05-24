//region Scene_Menu
import Scene_Passive from './Scene_Passive.js';

/**
 * Extends {@link #createCommandWindow}.<br>
 * Wires the passive-menu symbol to the Passives viewer scene.
 */
J.PASSIVE.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.PASSIVE.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // register the handler that opens the passive viewer.
  this._commandWindow.setHandler('passive-menu', this.commandPassive.bind(this));
};

/**
 * Opens the passive state viewer for the current menu actor.
 */
Scene_Menu.prototype.commandPassive = function()
{
  Scene_Passive.callScene();
};
//endregion Scene_Menu