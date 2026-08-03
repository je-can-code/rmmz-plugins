//region Game_ActionResult
/**
 * Extends {@link Game_ActionResult.initMembers}.<br/>
 * Initializes additional members.
 */
J.ABS.Aliased.Game_ActionResult.set('initMembers', Game_ActionResult.prototype.initMembers);
Game_ActionResult.prototype.initMembers = function()
{
  /**
   * Whether or not the result was guarded.
   * @type {boolean}
   */
  this.guarded = false;

  /**
   * Whether or not the result was parried.
   * @type {boolean}
   */
  this.parried = false;

  /**
   * Whether or not the result was a glancing blow (implicit parry that still lands but deals reduced damage).
   * @type {boolean}
   */
  this.glancing = false;

  /**
   * The amount of damage reduced by guarding.
   * @type {number}
   */
  this.reduced = 0;

  // perform original logic.
  J.ABS.Aliased.Game_ActionResult.get('initMembers')
    .call(this);
};

/**
 * Extends `.clear()` to include wiping the custom properties.
 */
J.ABS.Aliased.Game_ActionResult.set('clear', Game_ActionResult.prototype.clear);
Game_ActionResult.prototype.clear = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_ActionResult.get('clear')
    .call(this);

  // refresh our custom parameters.
  this.guarded = false;
  this.parried = false;
  this.glancing = false;
  this.reduced = 0;
};

/**
 * Overwrites {@link #isHit}.<br/>
 * Removes the check for "hit vs rng", and adds in parry instead.
 */
Game_ActionResult.prototype.isHit = function()
{
  return this.used &&
    this.parried === false &&
    this.isEvaded() === false;
};

/**
 * Whether or not the action was evaded.
 * @returns {boolean}
 */
Game_ActionResult.prototype.isEvaded = function()
{
  return this.evaded;
};
//endregion Game_ActionResult