//region Scene_Map
import JABS_PopupMergeController from './../managers/JABS_PopupMergeController.js';

/**
 * Runs idle merge flush ticks while the map scene updates.
 */
J.POPUPS.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.POPUPS.Aliased.Scene_Map.get('update')
    .call(this);

  JABS_PopupMergeController.tickIdleFlush();
};

/**
 * Clears merge accumulators when leaving the map so floats do not leak across transfers.
 */
J.POPUPS.Aliased.Scene_Map.set('stop', Scene_Map.prototype.stop);
Scene_Map.prototype.stop = function()
{
  // perform original logic.
  J.POPUPS.Aliased.Scene_Map.get('stop')
    .call(this);

  J.POPUPS.notifyMergeFlushAll('scene-map-stop');
};
//endregion Scene_Map