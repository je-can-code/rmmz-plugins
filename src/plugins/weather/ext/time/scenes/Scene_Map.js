//region Scene_Map
import ForecastDirector from './../managers/ForecastDirector.js';

/**
 * Extends {@link #onMapLoaded}.<br/>
 * Says what the sky is doing before the map is built around it.
 *
 * **This is the only place the sky reaches the screen on an arrival**, and it covers every kind of
 * arrival there is - a transfer, a save load, a new game, and a menu closing. It runs before the
 * original, which is J-Weather's own `onMapLoaded`, so the weather it resolves is already resolved
 * against the right sky rather than against the one the player walked in with.
 *
 * `$dataMap` is the arriving map by the time this runs, which is what makes pushing safe here and
 * nowhere earlier. `Game_System.onAfterLoad` is specifically *not* an option:
 * `docs/save-system.md` is explicit that decoding happens before `Scene_Map.create` loads the map,
 * so a push from there would read the map the player was standing on when they saved, or none.
 */
J.WEATHER.EXT.TIME.Aliased.Scene_Map.set('onMapLoaded', Scene_Map.prototype.onMapLoaded);
Scene_Map.prototype.onMapLoaded = function()
{
  // say what the sky is doing before anything works out what this place makes of that.
  ForecastDirector.push($gameTime);

  // perform original logic.
  J.WEATHER.EXT.TIME.Aliased.Scene_Map.get('onMapLoaded')
    .call(this);
};

/**
 * Extends {@link #update}.<br/>
 * Lets a phase that turned over mid-play reach the screen.
 *
 * The clock announces a phase crossing from wherever it happens to be running, which is not
 * somewhere a map read is safe. The announcement leaves a note; this is where the note is acted
 * on, and it is acted on within a frame of being left.
 *
 * The condition itself lives in the director rather than here, because `scenes/**` is excluded
 * from coverage and a fork written in a scene is a fork nothing measures.
 */
J.WEATHER.EXT.TIME.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.WEATHER.EXT.TIME.Aliased.Scene_Map.get('update')
    .call(this);

  // and then let any phase that turned over since the last frame reach the screen.
  ForecastDirector.pushIfPending($gameTime);
};
//endregion Scene_Map