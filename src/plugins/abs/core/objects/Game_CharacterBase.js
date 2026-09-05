//region Game_CharacterBase
import JABS_Battler from '../models/JABS_Battler.js';
/**
 * Extends the {@link Game_CharacterBase.initMembers}.<br>
 * Allows custom move speeds and dashing.
 */
J.ABS.Aliased.Game_CharacterBase.set('initMembers', Game_CharacterBase.prototype.initMembers);
Game_CharacterBase.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_CharacterBase.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * The calculated move speed of this character based on possible dodge modifications.
   * This defaults to "normal" aka `4`.
   * @type {number}
   */
  this._j._abs._realMoveSpeed = 4;

  /**
   * The modification of which this character receives when dodging.
   * @type {number}
   */
  this._j._abs._dodgeBoost = 0;

  /**
   * Whether the current jump (if any) should suppress its parabolic hop and render flat-
   * see {@link Game_CharacterBase.glideTo}. Reset to false at the start of every jump so a
   * normal jump afterward always renders its usual arc.
   * @type {boolean}
   */
  this._j._abs._noJumpArc = false;
};

/**
 * Gets the current true move speed associated with this character.
 * @returns {number}
 */
Game_CharacterBase.prototype.getRealMoveSpeed = function()
{
  return this._j._abs._realMoveSpeed;
};

/**
 * Overwrites {@link Game_CharacterBase.realMoveSpeed}.<br/>
 * Replaces the value to return our custom real move speed instead, along with dash boosts.
 * @returns {number}
 */
Game_CharacterBase.prototype.realMoveSpeed = function()
{
  // start with a baseline move speed.
  let moveSpeed = this.getRealMoveSpeed();

  // grab the dash boost based on whether or not the character is currently dashing.
  if (this.isDashing())
  {
    moveSpeed += this.getDashSpeedBoost();
  }

  // get the dodge boost based on whether or not the character is currently dodging.
  if (this.isDodging())
  {
    moveSpeed += this.getDodgeSpeedModifier();
  }

  // return the calculation.
  return moveSpeed;
};

/**
 * Calculate the current dash speed boost based on whether or not this character is dashing.
 * @returns {number}
 */
Game_CharacterBase.prototype.getDashSpeedBoost = function()
{
  return (this.isDashing()
    ? this.dashSpeed()
    : 0);
};

/**
 * Calculate the current dodge speed modifier based on whether or not this character is dodging.
 * @returns {number}
 */
Game_CharacterBase.prototype.getDodgeSpeedModifier = function()
{
  return (this.isDodging()
    ? this.dodgeModifier()
    : 0);
};

/**
 * Default speed boost for all characters when dashing.
 */
Game_CharacterBase.prototype.dashSpeed = function()
{
  return J.ABS.Metadata.DashSpeedBoost;
};

/**
 * Extends {@link Game_CharacterBase.setMoveSpeed}.<br/>
 * Also modifies custom move speeds.
 */
J.ABS.Aliased.Game_CharacterBase.set('setMoveSpeed', Game_CharacterBase.prototype.setMoveSpeed);
Game_CharacterBase.prototype.setMoveSpeed = function(moveSpeed)
{
  // perform original logic.
  J.ABS.Aliased.Game_CharacterBase.get('setMoveSpeed')
    .call(this, moveSpeed);

  // set the underlying real move speed to this.
  this._j._abs._realMoveSpeed = moveSpeed;
};

/**
 * Gets the current value of the dodge boost for this character.
 * @returns {number}
 */
Game_CharacterBase.prototype.dodgeModifier = function()
{
  return this._j._abs._dodgeBoost;
};

/**
 * Sets the boost gained when dodging to a specified amount.
 * @param {number} dodgeMoveSpeed The boost gained when dodging.
 */
Game_CharacterBase.prototype.setDodgeModifier = function(dodgeMoveSpeed)
{
  this._j._abs._dodgeBoost = dodgeMoveSpeed;
};

/**
 * Whether this character’s linked {@link JABS_Battler} is currently dodging.
 * Used by {@link Game_CharacterBase.realMoveSpeed} for dodge move-speed bonus.
 */
Game_CharacterBase.prototype.isDodging = function()
{
  // get this character's linked JABS battler, if any.
  const battler = this.getJabsBattler();

  // if no battler is linked, this character is not dodging.
  if (!battler) return false;

  // delegate to the battler's current dodge state.
  return battler.isDodging();
};

/**
 * Walks this character up to `distance` tiles in a single compass direction, testing each
 * tile's passability and stopping early the moment one blocks the way. Shared by every JABS
 * mechanic that forcibly displaces a character- push knockback, pull-forward, and terrain-
 * respecting gap-close all funnel through this one stepping routine so "stop at the last
 * passable tile" behaves identically everywhere it's used.
 * @param {number} direction The numpad compass direction to walk in (2/4/6/8).
 * @param {number} distance The maximum number of tiles to travel.
 * @returns {[number, number]} The actual [dx, dy] reached, in whole tiles.
 */
Game_CharacterBase.prototype.walkInDirectionClamped = function(direction, distance)
{
  // track the tentative landing tile as we step, starting from where we already are.
  let realX = this.x;
  let realY = this.y;

  // how many whole tiles we've successfully stepped so far.
  let stepsTaken = 0;

  // the total number of tiles to attempt, rounded since distance may arrive as a float.
  const stepsToWalk = Math.round(distance);

  // step one tile at a time, probing before committing rather than after.
  while (stepsTaken < stepsToWalk)
  {
    // canPass asks "may the character leave the tile I name, heading this way", so it has to be
    // asked from the tile we currently stand on. asked from the tile we hope to reach, it tests
    // the step after the one being decided- which both permits landing on a tile that could never
    // have been walked onto, and refuses a perfectly good tile because a wall sits beyond it.
    if (!this.canPass(realX, realY, direction)) break;

    // the step cleared, so commit to it.
    switch (direction)
    {
      case J.ABS.Directions.UP:
        realY--;
        break;
      case J.ABS.Directions.DOWN:
        realY++;
        break;
      case J.ABS.Directions.LEFT:
        realX--;
        break;
      case J.ABS.Directions.RIGHT:
        realX++;
        break;
    }

    stepsTaken++;
  }

  // report how far we actually got, relative to our starting tile.
  return [ realX - this.x, realY - this.y ];
};

/**
 * Terrain-only counterpart to vanilla {@link Game_CharacterBase.canPass}- identical except it
 * omits the character-collision check. A destination tile with a battler standing on it (the
 * normal case for gap closing, since the whole point is to reach that battler) would otherwise
 * always fail vanilla's collision check and report as unreachable.
 * @param {number} x The origin tile's X coordinate.
 * @param {number} y The origin tile's Y coordinate.
 * @param {number} d The compass direction of the step being probed.
 * @returns {boolean} True if the step is terrain-passable, ignoring any character occupying it.
 */
Game_CharacterBase.prototype.canPassTerrainOnly = function(x, y, d)
{
  // resolve the tile this step would land on.
  const x2 = $gameMap.roundXWithDirection(x, d);
  const y2 = $gameMap.roundYWithDirection(y, d);

  // a step off the edge of the map is never passable.
  if (!$gameMap.isValid(x2, y2)) return false;

  // through/debug-through characters ignore terrain entirely, same as vanilla canPass.
  if (this.isThrough() || this.isDebugThrough()) return true;

  // defer to the map's own terrain passability rules (tile flags, regions, etc).
  return this.isMapPassable(x, y, d);
};

/**
 * Terrain-only counterpart to vanilla {@link Game_CharacterBase.canPassDiagonally}- mirrors its
 * corner-cut-safe L-shaped probing (a diagonal step is valid if either of the two orthogonal
 * paths around the corner is clear), but built on {@link canPassTerrainOnly} so it shares the
 * same character-collision exemption.
 * @param {number} x The origin tile's X coordinate.
 * @param {number} y The origin tile's Y coordinate.
 * @param {number} horz The horizontal compass direction (4/6) of the diagonal step.
 * @param {number} vert The vertical compass direction (2/8) of the diagonal step.
 * @returns {boolean} True if either orthogonal path around the corner is terrain-passable.
 */
Game_CharacterBase.prototype.canPassDiagonallyTerrainOnly = function(x, y, horz, vert)
{
  // resolve the tile this diagonal step would land on.
  const x2 = $gameMap.roundXWithDirection(x, horz);
  const y2 = $gameMap.roundYWithDirection(y, vert);

  // vertical-then-horizontal path around the corner.
  if (this.canPassTerrainOnly(x, y, vert) && this.canPassTerrainOnly(x, y2, horz)) return true;

  // horizontal-then-vertical path around the corner.
  if (this.canPassTerrainOnly(x, y, horz) && this.canPassTerrainOnly(x2, y, vert)) return true;

  // both corner-cut paths are blocked.
  return false;
};

/**
 * Probes whether this character could walk the full tile-by-tile path to a delta destination
 * without moving it- unlike {@link walkInDirectionClamped}, which stops early and reports
 * however far it got, this is all-or-nothing: the moment any step along the way is blocked,
 * the whole path counts as unreachable. Steps diagonally first (using the same corner-cut-safe
 * diagonal passability vanilla RMMZ uses for player movement) for as long as both axes still
 * have distance remaining, then finishes out whichever axis is left with straight steps.
 * Uses terrain-only passability throughout, since the destination is expected to have a
 * battler standing on it- that is the entire point of gap closing.
 * @param {number} dx The destination delta on the X axis, in tiles (fractional values are rounded).
 * @param {number} dy The destination delta on the Y axis, in tiles (fractional values are rounded).
 * @returns {boolean} True if every tile along the path to the rounded delta is terrain-passable.
 */
Game_CharacterBase.prototype.canReachTileDelta = function(dx, dy)
{
  // round the raw delta down to whole tiles- probing happens one tile at a time.
  let remainingX = Math.round(dx);
  let remainingY = Math.round(dy);

  // track the probe's tentative position separately from this character's real position.
  // rounded to the nearest tile up front- with pixel movement this.x/this.y are fractional
  // sub-tile coordinates, and every subsequent step only ever adds/subtracts a whole tile via
  // roundXWithDirection, so starting from a fractional origin would keep every later lookup
  // fractional too, silently failing every $gameMap passability check along the way.
  let probeX = Math.round(this.x);
  let probeY = Math.round(this.y);

  // keep stepping until both axes have been fully walked off.
  while (remainingX !== 0 || remainingY !== 0)
  {
    // determine this step's direction on each axis- 0 means that axis is already exhausted.
    let stepX = 0;
    if (remainingX > 0) stepX = J.ABS.Directions.RIGHT;
    else if (remainingX < 0) stepX = J.ABS.Directions.LEFT;

    let stepY = 0;
    if (remainingY > 0) stepY = J.ABS.Directions.DOWN;
    else if (remainingY < 0) stepY = J.ABS.Directions.UP;

    // both axes still have distance left- attempt a diagonal step.
    if (stepX !== 0 && stepY !== 0)
    {
      // corner-cutting is disallowed here exactly like vanilla player movement disallows it.
      if (!this.canPassDiagonallyTerrainOnly(probeX, probeY, stepX, stepY)) return false;

      probeX = $gameMap.roundXWithDirection(probeX, stepX);
      probeY = $gameMap.roundYWithDirection(probeY, stepY);
      remainingX -= Math.sign(remainingX);
      remainingY -= Math.sign(remainingY);
    }
    // only the X axis has distance left- finish out with a straight step.
    else if (stepX !== 0)
    {
      if (!this.canPassTerrainOnly(probeX, probeY, stepX)) return false;

      probeX = $gameMap.roundXWithDirection(probeX, stepX);
      remainingX -= Math.sign(remainingX);
    }
    // only the Y axis has distance left- finish out with a straight step.
    else
    {
      if (!this.canPassTerrainOnly(probeX, probeY, stepY)) return false;

      probeY = $gameMap.roundYWithDirection(probeY, stepY);
      remainingY -= Math.sign(remainingY);
    }
  }

  // every step along the path was passable.
  return true;
};

/**
 * Extends {@link Game_CharacterBase.jump}.<br/>
 * Always resets arc suppression first, so a normal jump call after a glide still hops as
 * usual- only {@link glideTo} re-enables suppression, and only for the jump it triggers.
 */
J.ABS.Aliased.Game_CharacterBase.set('jump', Game_CharacterBase.prototype.jump);
Game_CharacterBase.prototype.jump = function(xPlus, yPlus)
{
  // a fresh jump always renders its normal parabolic arc unless glideTo() says otherwise.
  this.setNoJumpArc(false);

  // perform original logic.
  J.ABS.Aliased.Game_CharacterBase.get('jump')
    .call(this, xPlus, yPlus);
};

/**
 * Extends {@link Game_CharacterBase.jumpHeight}.<br/>
 * Flattens the jump arc to zero while arc suppression is active, without touching the
 * underlying `_jumpCount`/`_jumpPeak` timing- every other system that keys off
 * {@link Game_CharacterBase.isJumping} (render sync, gap-close arrival, pixel movement's
 * mid-jump guard) still behaves exactly as it does for a normal jump.
 * @returns {number} The vertical hop offset in pixels, or 0 while suppressed.
 */
J.ABS.Aliased.Game_CharacterBase.set('jumpHeight', Game_CharacterBase.prototype.jumpHeight);
Game_CharacterBase.prototype.jumpHeight = function()
{
  // arc suppressed- render perfectly flat regardless of where we are in the jump timeline.
  if (this.isNoJumpArc()) return 0;

  // perform original logic.
  return J.ABS.Aliased.Game_CharacterBase.get('jumpHeight')
    .call(this);
};

/**
 * Moves this character to a delta destination exactly like {@link Game_CharacterBase.jump},
 * reusing all of its position/timing/facing machinery, but renders as a flat ground-level
 * glide instead of a parabolic hop- a "slide" with none of the kangaroo-bounce of a jump and
 * none of the jarring pop of an instant teleport.
 * @param {number} xPlus The destination delta on the X axis.
 * @param {number} yPlus The destination delta on the Y axis.
 */
Game_CharacterBase.prototype.glideTo = function(xPlus, yPlus)
{
  // reuse jump()'s full movement, timing, and facing logic unchanged.
  this.jump(xPlus, yPlus);

  // suppress the arc for the duration of this jump only; the next jump() call resets this.
  this.setNoJumpArc(true);
};

//region properties
/**
 * Gets the no jump arc.
 * @returns {boolean} The noJumpArc.
 */
Game_CharacterBase.prototype.isNoJumpArc = function()
{
  // hand back the no jump arc.
  return this._j._abs._noJumpArc;
};

/**
 * Sets the no jump arc.
 * @param {boolean} newNoJumpArc The new noJumpArc.
 */
Game_CharacterBase.prototype.setNoJumpArc = function(newNoJumpArc)
{
  // assign the no jump arc.
  this._j._abs._noJumpArc = newNoJumpArc;
};
//endregion properties
//endregion Game_CharacterBase