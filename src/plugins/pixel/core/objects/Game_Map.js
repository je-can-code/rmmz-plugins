//region Game_Map
import PIXEL_CollisionManager from './../managers/PIXEL_CollisionManager.js';
import PathSearchEventIndex from './../managers/PathSearchEventIndex.js';

/**
 * Extends {@link Game_Map.setup}.<br/>
 * Builds the PIXEL subcell collision table when a new map loads.
 * @param {number} mapId The id of the map to setup.
 */
J.PIXEL.Aliased.Game_Map.set("setup", Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // Perform the original setup logic.
  // perform original logic.
  J.PIXEL.Aliased.Game_Map.get("setup")
    .call(this, mapId);

  // Build the PIXEL subcell collision table for this map.
  PIXEL_CollisionManager.setupCollision();

  // suppress Player Touch / Event Touch underfoot briefly after load/transfer.
  this._pixelFootTouchTriggerCooldown = J.PIXEL.Metadata.FootTouchEventDelayFrames;
};

/**
 * Runs a path search with a lookup of which events stand on which tile, built for its length.<br/>
 * See {@link PathSearchEventIndex} for why. The lookup is thrown away the moment the search ends,
 * however it ends, since the next thing to move would make it wrong.
 * @param {function(): {x: number, y: number, reachedGoal: boolean}} search The search to run.
 * @returns {{x: number, y: number, reachedGoal: boolean}} Whatever the search answered.
 */
Game_Map.prototype.searchWithEventIndex = function(search)
{
  // nothing moves while a search runs, so every tile can be answered for up front.
  PathSearchEventIndex.build(this.events());

  try
  {
    return search();
  }
  finally
  {
    PathSearchEventIndex.clear();
  }
};

/**
 * Extends {@link Game_Map#eventsXyNt}.<br/>
 * Answers from the path search lookup while one is built, and walks every event as the engine does
 * otherwise. Both give the same answer; the lookup just gives it without the walk.
 * @param {number} x The x tile coordinate.
 * @param {number} y The y tile coordinate.
 * @returns {Game_Event[]} The events standing on that tile that do not pass through things.
 */
J.PIXEL.Aliased.Game_Map.set('eventsXyNt', Game_Map.prototype.eventsXyNt);
Game_Map.prototype.eventsXyNt = function(x, y)
{
  // during a path search, the lookup already knows.
  if (PathSearchEventIndex.isBuilt() === true) return PathSearchEventIndex.eventsAt(x, y);

  // perform original logic.
  return J.PIXEL.Aliased.Game_Map.get('eventsXyNt')
    .call(this, x, y);
};
//endregion Game_Map