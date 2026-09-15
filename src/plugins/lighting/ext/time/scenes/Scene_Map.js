//region Scene_Map
import TimeLightingCoordinator from '../managers/TimeLightingCoordinator.js';

/**
 * Extends {@link #onMapLoaded}.<br/>
 * Works out whether the arriving map has a sky, then applies it.
 *
 * This is the one place in the extension that reads map data, and it runs here because this is the
 * first moment `$dataMap` is the map being entered rather than the one being left. It covers every
 * kind of arrival - a transfer, a save load, and a new game - which matters because only one of
 * those three actually runs the map's own setup.
 */
J.LIGHTING.EXT.TIME.Aliased.Scene_Map.set('onMapLoaded', Scene_Map.prototype.onMapLoaded);
Scene_Map.prototype.onMapLoaded = function()
{
  // find out whether this place can see the sky.
  TimeLightingCoordinator.refreshMapSuppression();

  // and then say what the sky is doing, or withdraw it entirely.
  TimeLightingCoordinator.declareForCurrentTime($gameTime);

  // perform original logic.
  J.LIGHTING.EXT.TIME.Aliased.Scene_Map.get('onMapLoaded')
    .call(this);
};
//endregion Scene_Map