//region Game_Time
import TimeLightingCoordinator from '../managers/TimeLightingCoordinator.js';

/**
 * Extends {@link #onTimeChanged}.<br/>
 * Re-reads what the sky should look like now that the clock has moved.
 *
 * The clock announces; this decides what the announcement looks like. That is the entire bridge -
 * J-TIME knows nothing about lighting, and removing this plugin leaves it a working clock with no
 * opinion about the screen.
 *
 * The clock hands itself over rather than being looked up. The first announcement of a new game
 * comes from inside `Game_Time`'s own constructor, and `$gameTime` is still null until that
 * constructor returns - so anything reaching for the global here would crash on a fresh game.
 */
J.LIGHTING.EXT.TIME.Aliased.Game_Time.set('onTimeChanged', Game_Time.prototype.onTimeChanged);
Game_Time.prototype.onTimeChanged = function()
{
  // perform original logic.
  J.LIGHTING.EXT.TIME.Aliased.Game_Time.get('onTimeChanged')
    .call(this);

  // work out what the sky looks like at this new hour.
  TimeLightingCoordinator.declareForCurrentTime(this);
};
//endregion Game_Time