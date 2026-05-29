//region Game_CharacterBase
import JABS_Battler from './../__models/JABS_Battler/_initialization.js';
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
  if (typeof this.getJabsBattler === 'function')
  {
    const battler = this.getJabsBattler();

    if (battler)
    {
      return battler.isDodging();
    }
  }

  return false;
};
//endregion Game_CharacterBase