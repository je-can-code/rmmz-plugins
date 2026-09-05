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

/**
 * Overwrites {@link Game_CharacterBase.walkInDirectionClamped}.<br/>
 * Re-decides forced displacement- knockback, pull-forward, gap-close- in the pixel movement
 * model rather than the tile one.
 *
 * J-ABS clamps that displacement with `canPass`, which asks a tile-grid question: round the
 * coordinates to a tile, then read that tile's direction bits. Neither half of that survives
 * pixel movement. A character's `x`/`y` are fractional, and its body is an AABB hung off the
 * collision pivot, so the rounded tile is routinely not the tile the body occupies- exactly the
 * disagreement {@link Game_CharacterBase#occupiedTileY} exists to settle. A body straddling two
 * columns is never asked about the second one at all. Both gaps fail the same direction: the walk
 * approves a landing the physics would have refused, `jump` applies it without validating
 * anything, and the character comes to rest inside terrain that then denies every way back out.
 *
 * `canPassStraight` is the same predicate the character's own movement obeys every frame, so
 * routing the walk through it means forced displacement can only ever come to rest somewhere
 * walking could have reached.
 * @param {number} direction The numpad compass direction to walk in (2/4/6/8).
 * @param {number} distance The maximum number of tiles to travel.
 * @returns {[number, number]} The actual [dx, dy] reached, in whole tiles.
 */
Game_CharacterBase.prototype.walkInDirectionClamped = function(direction, distance)
{
  // the total number of tiles to attempt, rounded since distance may arrive as a float.
  const stepsToWalk = Math.round(distance);

  // how many whole tiles have cleared the probe so far.
  let stepsTaken = 0;

  // grow the probe one tile per pass instead of testing the whole distance in a single call.
  // canPassStraight substeps terrain the entire way but applies character collision only at its
  // landing point, so one long probe would sail straight over a battler standing mid-path.
  // asking for one more tile at a time stops at the first obstruction of either kind, which is
  // the walk-and-stop behavior the tile version being replaced here promised.
  while (stepsTaken < stepsToWalk)
  {
    // ask whether the body could travel this far from where it currently stands.
    if (this.canPassStraight(direction, stepsTaken + 1) === false) break;

    // it could, so bank the tile and reach for one more.
    stepsTaken++;
  }

  // translate the cleared tile count into the signed offset the caller jumps by.
  switch (direction)
  {
    case J.PIXEL.Directions.UP:
      return [ 0, -stepsTaken ];
    case J.PIXEL.Directions.DOWN:
      return [ 0, stepsTaken ];
    case J.PIXEL.Directions.LEFT:
      return [ -stepsTaken, 0 ];
    case J.PIXEL.Directions.RIGHT:
      return [ stepsTaken, 0 ];
  }

  // a direction with no cardinal meaning displaces nothing.
  return [ 0, 0 ];
};
//endregion Game_CharacterBase