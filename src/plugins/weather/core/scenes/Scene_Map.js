//region Scene_Map
import WeatherDirector from './../managers/WeatherDirector.js';

/**
 * Extends {@link #onMapLoaded}.<br/>
 * Works out what the weather is on the map being arrived at.
 *
 * This is the first moment `$dataMap` is the map being entered rather than the one being left, and it
 * covers every kind of arrival - a transfer, a save load, a new game, and returning from the menu.
 * That last one matters: the spriteset is rebuilt on a menu close, so the weather has to have been
 * decided again by the time it goes looking for what to draw.
 */
J.WEATHER.Aliased.Scene_Map.set('onMapLoaded', Scene_Map.prototype.onMapLoaded);
Scene_Map.prototype.onMapLoaded = function()
{
  // work out what this place's weather is before anything tries to draw it.
  WeatherDirector.refresh();

  // perform original logic.
  J.WEATHER.Aliased.Scene_Map.get('onMapLoaded')
    .call(this);
};

/**
 * Extends {@link #update}.<br/>
 * Also takes this frame's reading of how far the player has moved.
 *
 * Here rather than in the emitter because a reading has to be taken exactly once a frame to mean
 * anything, and the emitter is several sprites that all update in the same one. The scene is also
 * the only place that keeps running while the weather is being rebuilt around a menu close.
 */
J.WEATHER.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.WEATHER.Aliased.Scene_Map.get('update')
    .call(this);

  // then note where that left the player.
  WeatherDirector.trackPlayer();
};
//endregion Scene_Map