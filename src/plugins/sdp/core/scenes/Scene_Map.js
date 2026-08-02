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

//endregion Scene_Map