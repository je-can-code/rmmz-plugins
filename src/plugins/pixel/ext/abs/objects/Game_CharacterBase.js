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
 * Extends {@link Game_CharacterBase.isCharacterCollisionAt}.<br/>
 * Character-vs-character overlap needs one shared PIXEL AABB builder so every
 * battler is compared in the same pivot-aware coordinate space.
 * @param {number} px Proposed x in fractional tiles.
 * @param {number} py Proposed y in fractional tiles.
 * @param {number=} radius Optional collision half-size in tiles.
 * @returns {boolean}
 */
J.PIXEL.EXT.ABS.Aliased.Game_CharacterBase.set(
  'isCharacterCollisionAt',
  Game_CharacterBase.prototype.isCharacterCollisionAt);
Game_CharacterBase.prototype.isCharacterCollisionAt = function(px, py, radius = 0.35)
{
  // acquire the player reference.
  const player = $gamePlayer;

  // acquire follower references.
  const followers = player._followers._data;

  // build the party list (player + followers).
  const party = [ player ].concat(followers);

  // determine if this character is part of the party.
  const selfIsParty = party.includes(this);

  // gather all map events as initial candidates.
  const events = $gameMap.events();

  // initialize candidate collection.
  const candidates = [];

  // add events that can collide.
  events.forEach(ev =>
  {
    // exclude self.
    if (ev === this) return;

    // exclude erased events.
    if (ev.isErased()) return;

    // exclude events flagged as through.
    if (ev.isThrough()) return;

    // exclude events that are not normal priority.
    if (ev.isNormalPriority() === false) return;

    // exclude JABS action sprites so they do not block physical movement.
    if (J.ABS && ev.isJabsAction()) return;

    // include this event as a candidate.
    candidates.push(ev);
  });

  // only add the player/followers if self is not a party member.
  if (selfIsParty === false)
  {
    // add the player as a candidate when not through.
    if (player !== this && player.isThrough() === false)
    {
      candidates.push(player);
    }

    // add followers that can collide.
    followers.forEach(f =>
    {
      // exclude self.
      if (f === this) return;

      // exclude through followers.
      if (f.isThrough()) return;

      // Append the row to the working collection.
      candidates.push(f);
    });
  }

  /**
   * Builds a tile-space AABB for collision testing from the character's current
   * PIXEL pivot and hitbox data.
   * @param {Game_CharacterBase} character The character being represented.
   * @param {number} logicalX The logical x coordinate to evaluate.
   * @param {number} logicalY The logical y coordinate to evaluate.
   * @param {number} halfRadius The compatibility radius for square footprints.
   * @returns {{left:number,right:number,top:number,bottom:number}}
   */
  const buildCharacterAabb = function(character, logicalX, logicalY, halfRadius)
  {
    // build from the same pivot-aware hitbox data that PIXEL movement/overlay use.
    const pivotX = logicalX + character.getCollisionPivotX();
    const pivotY = logicalY + character.getCollisionPivotY();
    const hitbox = character._pixelHitbox(halfRadius);
    const left = pivotX + hitbox.hx;
    const top = pivotY + hitbox.hy;

    return {
      left,
      right: left + hitbox.w,
      top,
      bottom: top + hitbox.h,
    };
  };

  /**
   * Determines whether or not two tile-space rectangles overlap.
   * Edge-touching is not treated as overlap, matching the legacy scalar logic.
   * @param {{left:number,right:number,top:number,bottom:number}} a The first rect.
   * @param {{left:number,right:number,top:number,bottom:number}} b The second rect.
   * @returns {boolean}
   */
  const rectanglesOverlap = function(a, b)
  {
    return a.left < b.right
      && a.right > b.left
      && a.top < b.bottom
      && a.bottom > b.top;
  };

  // build the self footprint at the proposed logical location.
  const selfAabb = buildCharacterAabb(this, px, py, radius);

  // probe the AABB for each candidate.
  for (let i = 0; i < candidates.length; i++)
  {
    // grab the candidate.
    const ch = candidates[i];

    // extra defense: skip JABS action sprites even if accidentally included above.
    if (J.ABS && ch.isJabsAction())
    {
      continue;
    }

    // the legacy footprint uses the candidate's effective radius around its logical position.
    const candidateRadius = ch.getEffectiveRadius();
    const candidateAabb = buildCharacterAabb(ch, ch.x, ch.y, candidateRadius);

    // if the rectangles overlap, then movement would collide.
    if (rectanglesOverlap(selfAabb, candidateAabb))
    {
      return true;
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