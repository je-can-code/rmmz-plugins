//region Game_Map
import PIXEL_CollisionManager from './../managers/PIXEL_CollisionManager.js';

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
//endregion Game_Map