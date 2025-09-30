//region Game_Map
/**
 * Extends {@link Game_Map.setup}.<br>
 * Builds the PIXEL subcell collision table when a new map loads.
 * @param {number} mapId The id of the map to setup.
 */
J.ABS.EXT.PIXEL.Aliased.Game_Map.set("setup", Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // Perform the original setup logic.
  J.ABS.EXT.PIXEL.Aliased.Game_Map.get("setup")
    .call(this, mapId);

  // Build the PIXEL subcell collision table for this map.
  PIXEL_CollisionManager.setupCollision();
};
//endregion Game_Map