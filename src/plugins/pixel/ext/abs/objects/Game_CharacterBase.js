//region Game_CharacterBase
/**
 * Extends {@link Game_CharacterBase.isOverlappingSolidTiles}.<br/>
 * Enemy battlers with rectangular hitboxes need tile overlap checks based on the
 * full feet-anchored rectangle instead of a square radius around the center.
 * @param {number} px The proposed pivot x in tile units.
 * @param {number} py The proposed pivot y in tile units.
 * @param {number} radius The compatibility radius from PIXEL core.
 * @returns {boolean}
 */
J.PIXEL.EXT.ABS.Aliased.Game_CharacterBase.set(
  'isOverlappingSolidTiles',
  Game_CharacterBase.prototype.isOverlappingSolidTiles);
Game_CharacterBase.prototype.isOverlappingSolidTiles = function(px, py, radius)
{
  // if this character does not expose a custom rectangular hitbox, then perform original logic.
  if (this.hasCustomPixelHitbox() === false)
  {
    // perform original logic.
    return J.PIXEL.EXT.ABS.Aliased.Game_CharacterBase.get('isOverlappingSolidTiles').call(this, px, py, radius);
  }

  // build the full tile-space rectangle from the feet-anchored PIXEL hitbox.
  const hitbox = this._pixelHitbox(this.getEffectiveRadius());
  const left = px + hitbox.hx;
  const right = left + hitbox.w;
  const top = py + hitbox.hy;
  const bottom = top + hitbox.h;

  // define tiny epsilon to bias away from seams when flooring.
  const eps = 1e-6;

  // compute the inclusive bounds of tiles overlapped by the full rectangle.
  const minCol = Math.floor(left + eps);
  const maxCol = Math.floor(right - eps);
  const minRow = Math.floor(top + eps);
  const maxRow = Math.floor(bottom - eps);

  // iterate all overlapped tiles.
  for (let ty = minRow; ty <= maxRow; ty++)
  {
    for (let tx = minCol; tx <= maxCol; tx++)
    {
      // treat out-of-bounds as solid.
      if ($gameMap.isValid(tx, ty) === false)
      {
        return true;
      }

      // determine if this tile has any passable cardinal direction at all.
      const anyPass =
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.DOWN) ||
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.LEFT) ||
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.RIGHT) ||
        $gameMap.isPassable(tx, ty, J.PIXEL.Directions.UP);

      // a tile with no passable cardinals is a solid wall tile.
      if (anyPass === false)
      {
        return true;
      }
    }
  }

  return false;
};

/**
 * Whether this character has a custom rectangular pixel hitbox.
 * Only {@link Game_Event} overrides this to check for a hitbox tag.
 * All other character types (player, followers, enemies as characters) have no custom hitbox.
 * @returns {boolean}
 */
Game_CharacterBase.prototype.hasCustomPixelHitbox = function()
{
  // non-event characters never carry a custom hitbox model.
  return false;
};

/**
 * Provides the battler AABB model for JABS collision and overlay queries.
 * Only {@link Game_Event} overrides this to return a rectangular model when a hitbox tag is present.
 * @returns {JABS_Aabb|null}
 */
Game_CharacterBase.prototype.getPixelAbsBattlerAabbModel = function()
{
  // non-event characters have no custom rectangular AABB.
  return null;
};
//endregion Game_CharacterBase