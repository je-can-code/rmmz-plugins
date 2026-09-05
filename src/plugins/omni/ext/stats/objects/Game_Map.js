//region Game_Map
import StatistopediaRecorder from './../managers/StatistopediaRecorder.js';

/**
 * Extends {@link #setup}.<br/>
 * Also files the map as somewhere the party has now been.
 *
 * Recorded on setup rather than on transfer because setup is the one path every arrival takes-
 * a transfer, a new game, and a save loaded directly onto a map all end up here.
 * @param {number} mapId The id of the map being set up.
 */
J.OMNI.EXT.STATS.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.OMNI.EXT.STATS.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // record having been here.
  StatistopediaRecorder.trackVisitedMap(mapId);
};
//endregion Game_Map