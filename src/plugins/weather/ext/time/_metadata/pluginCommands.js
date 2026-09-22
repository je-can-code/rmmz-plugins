//region plugin commands
import ForecastPlaces from '../core/ForecastPlaces.js';
import Scene_DebugForecast from '../scenes/Scene_DebugForecast.js';

/**
 * Opens the diagnostic forecast.
 *
 * **Not the player's forecast.** This lists named destinations with their exact preset and
 * strength per phase, which is how you check that what is on screen is what the sky rolled - and
 * is also a list of places the player has not necessarily found yet. The screen a player sees is
 * a separate thing entirely.
 */
PluginManager.registerCommand(J.WEATHER.EXT.TIME.Metadata.name, 'showDebugForecast', () =>
{
  Scene_DebugForecast.callScene();
});

/**
 * Re-reads every destination's map note.
 *
 * The forecast holds what it read for the life of the session, because a map's note cannot change
 * while the game is running - except during development, when it does constantly. This exists so
 * retagging a map and looking again does not mean restarting.
 */
PluginManager.registerCommand(J.WEATHER.EXT.TIME.Metadata.name, 'refreshForecastPlaces', () =>
{
  ForecastPlaces.forget();
});
//endregion plugin commands