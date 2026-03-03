//region JABS_Aggro
/**
 * A tracker for managing the aggro for this particular battler and its owner.
 */
function JABS_Aggro()
{
  this.initialize(...arguments);
}

JABS_Aggro.prototype = {};
JABS_Aggro.prototype.constructor = JABS_Aggro;

/**
 * Initializes this class and it's members.
 * @param {string} uuid The uuid of the battler.
 */
JABS_Aggro.prototype.initialize = function(uuid)
{
  /**
   * The unique identifier of the battler this aggro is tracked for.
   * @type {string}
   */
  this.battlerUuid = uuid;

  /**
   * The numeric measurement of aggro from this battler.
   * @type {number}
   */
  this.aggro = 0;

  /**
   * Whether or not the aggro is locked at it's current value.
   * @type {boolean}
   */
  this.locked = false;
};

/**
 * Gets the `uuid` of the battler this aggro is associated with.
 * @returns {string}
 */
JABS_Aggro.prototype.uuid = function()
{
  return this.battlerUuid;
};

/**
 * Sets a lock on this aggro to prevent any modification of the aggro
 * regarding this battler.
 */
JABS_Aggro.prototype.lock = function()
{
  this.locked = true;
};

/**
 * Removes the lock on this aggro to allow modification of the aggro
 * regarding this battler.
 */
JABS_Aggro.prototype.unlock = function()
{
  this.locked = false;
};

/**
 * Resets the aggro back to 0.
 * Will do nothing if aggro is locked unless forced.
 */
JABS_Aggro.prototype.resetAggro = function(forced = false)
{
  if (this.locked && !forced) return;
  this.aggro = 0;
};

/**
 * Sets the aggro to a specific value.
 * Will do nothing if aggro is locked unless forced.
 */
JABS_Aggro.prototype.setAggro = function(newAggro, forced = false)
{
  if (this.locked && !forced) return;

  this.aggro = newAggro;
};

/**
 * Modifies the aggro by a given amount.
 * Can be negative.
 * Will do nothing if aggro is locked unless forced.
 * @param {number} modAggro The amount to modify.
 * @param {boolean} forced Forced aggro modifications override "aggro lock".
 */
JABS_Aggro.prototype.modAggro = function(modAggro, forced = false)
{
  if (this.locked && !forced) return;

  this.aggro += modAggro;
  if (this.aggro < 0) this.aggro = 0;
};

/**
 * Determines whether or not this aggro is for a living actor.
 * @returns {boolean}
 */
JABS_Aggro.prototype.isForLivingActor = function()
{
  // grab the battler for reference.
  const battler = JABS_AiManager.getBattlerByUuid(this.battlerUuid);

  // if there was no battler by this id, then its not for an actor.
  if (!battler) return false;

  // if the battler is not an actor, then its not for an actor.
  if (battler.isActor() !== false) return false;

  // if the actor is dead, then it doesn't count.
  if (battler.isDead() === true) return false;

  // if the aggro is reset/empty, then it doesn't count.
  if (this.aggro <= 0) return false;

  // the aggro's target is a living actor.
  return true;
};
//endregion JABS_Aggro