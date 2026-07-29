//region Scene_Menu
import Scene_SDP from './Scene_SDP.js';

/**
 * Hooks into the command window creation of the menu to add functionality for the SDP menu.
 */
J.SDP.Aliased.Scene_Menu.set('createCommandWindow', Scene_Menu.prototype.createCommandWindow);
Scene_Menu.prototype.createCommandWindow = function()
{
  // perform original logic.
  J.SDP.Aliased.Scene_Menu.get('createCommandWindow')
    .call(this);

  // add an additional handler for the new menu.
  this.commandWindow().setHandler("sdp-menu", this.commandSdp.bind(this));
};

/**
 * Brings up the SDP menu.
 */
Scene_Menu.prototype.commandSdp = function()
{
  Scene_SDP.callScene();
};
//endregion Scene_Menu