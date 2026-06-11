//region Scene_Map
import Scene_SDP from './Scene_SDP.js';
import SdpMasteryManager from '../managers/SdpMasteryManager.js';

/**
 * Reconciles subgroup mastery wrapper skills on map entry.<br/>
 * Idempotent safety net when panel content or plugin wiring changes mid dev save.
 */
J.SDP.Aliased.Scene_Map.set('start', Scene_Map.prototype.start);
Scene_Map.prototype.start = function()
{
  // perform original logic.
  J.SDP.Aliased.Scene_Map.get('start')
    .call(this);

  // learn/forget wrapper skills for every maxed subgroup on the active party.
  SdpMasteryManager.reconcileAllForParty();
};

/**
 * Adds the functionality for calling the SDP menu from the JABS quick menu.
 */
J.SDP.Aliased.Scene_Map.set('createJabsAbsMenuMainWindow', Scene_Map.prototype.createJabsAbsMenuMainWindow);
Scene_Map.prototype.createJabsAbsMenuMainWindow = function()
{
  // perform original logic.
  J.SDP.Aliased.Scene_Map.get('createJabsAbsMenuMainWindow')
    .call(this);

  // grab the list window.
  const mainMenuWindow = this.getJabsMainListWindow();

  // add an additional handler for the new menu.
  mainMenuWindow.setHandler("sdp-menu", this.commandSdp.bind(this));
};

/**
 * Brings up the SDP menu.
 */
Scene_Map.prototype.commandSdp = function()
{
  Scene_SDP.callScene();
};
//endregion Scene_Map