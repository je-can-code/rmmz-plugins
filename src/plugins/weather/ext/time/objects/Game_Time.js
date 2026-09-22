//region Game_Time
import ForecastDirector from './../managers/ForecastDirector.js';

/**
 * Extends {@link #onTimeChanged}.<br/>
 * Winds the forecast forward to whatever the clock now says.
 *
 * **This announcement fires every game minute**, not every hour - roughly every six real seconds -
 * so nearly every one of these does nothing. The director dedupes on the phase, and only a genuine
 * phase crossing gets any further.
 *
 * **It advances and does not push.** The very first announcement of a new game comes from inside
 * `Game_Time`'s own constructor, during game-object creation, when there is no map to read; the
 * screen is told separately, from the map scene, where there always is one. See
 * {@link ForecastDirector} for the whole of that argument.
 *
 * The clock hands itself over rather than being looked up, for the same reason: `$gameTime` is
 * still null until that constructor returns, so anything reaching for the global here would crash
 * on a fresh game.
 */
J.WEATHER.EXT.TIME.Aliased.Game_Time.set('onTimeChanged', Game_Time.prototype.onTimeChanged);
Game_Time.prototype.onTimeChanged = function()
{
  // perform original logic.
  J.WEATHER.EXT.TIME.Aliased.Game_Time.get('onTimeChanged')
    .call(this);

  // bring the forecast up to the new time, without touching anything map-shaped.
  ForecastDirector.advance(this);
};
//endregion Game_Time