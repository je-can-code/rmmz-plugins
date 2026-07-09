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

  // whether the most recent step landed on a passable tile.
  let canPass = true;

  // how many whole tiles we've successfully stepped so far.
  let stepsTaken = 0;

  // the total number of tiles to attempt, rounded since distance may arrive as a float.
  const stepsToWalk = Math.round(distance);

  // step one tile at a time, same technique the original knockback loop pioneered- probe the
  // next tile, and if it isn't passable, back off and stop instead of clipping through it.
  while (canPass && stepsTaken < stepsToWalk)
  {
    switch (direction)
    {
      case J.ABS.Directions.UP:
        realY--;
        canPass = this.canPass(realX, realY, direction);
        if (!canPass) realY++;
        break;
      case J.ABS.Directions.DOWN:
        realY++;
        canPass = this.canPass(realX, realY, direction);
        if (!canPass) realY--;
        break;
      case J.ABS.Directions.LEFT:
        realX--;
        canPass = this.canPass(realX, realY, direction);
        if (!canPass) realX++;
        break;
      case J.ABS.Directions.RIGHT:
        realX++;
        canPass = this.canPass(realX, realY, direction);
        if (!canPass) realX--;
        break;
      default:
        canPass = false;
        break;
    }

    // only count the step if it actually landed somewhere new.
    if (canPass) stepsTaken++;
  }

  // report how far we actually got, relative to our starting tile.
  return [ realX - this.x, realY - this.y ];
};
//endregion Game_CharacterBase