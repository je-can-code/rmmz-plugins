//region JABS_Aggro
import JABS_AiManager from './../managers/JABS_AiManager.js';
/**
 * A tracker for managing the aggro for this particular battler and its owner.
 */
class JABS_Aggro
{
  /**
   * Constructor.
   * @param {string} uuid The uuid of the battler.
   */
  constructor(uuid)
  {
    this.initialize(uuid);
  }

  /**
   * Initializes this class and it's members.
   * @param {string} uuid The uuid of the battler.
   */
  initialize(uuid)
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
  }

  /**
   * Gets the `uuid` of the battler this aggro is associated with.
   * @returns {string}
   */
  uuid()
  {
    return this.battlerUuid;
  }

  /**
   * Sets a lock on this aggro to prevent any modification of the aggro
   * regarding this battler.
   */
  lock()
  {
    this.locked = true;
  }

  /**
   * Removes the lock on this aggro to allow modification of the aggro
   * regarding this battler.
   */
  unlock()
  {
    this.locked = false;
  }

  /**
   * Resets the aggro back to 0.
   * Will do nothing if aggro is locked unless forced.
   */
  resetAggro(forced = false)
  {
    if (this.locked && !forced) return;
    this.aggro = 0;
  }

  /**
   * Sets the aggro to a specific value.
   * Will do nothing if aggro is locked unless forced.
   */
  setAggro(newAggro, forced = false)
  {
    if (this.locked && !forced) return;

    // assign aggro on this instance for callers.
    this.aggro = newAggro;
  }

  /**
   * Modifies the aggro by a given amount.
   * Can be negative.
   * Will do nothing if aggro is locked unless forced.
   * @param {number} modAggro The amount to modify.
   * @param {boolean} forced Forced aggro modifications override "aggro lock".
   */
  modAggro(modAggro, forced = false)
  {
    if (this.locked && !forced) return;

    this.aggro += modAggro;
    if (this.aggro < 0) this.aggro = 0;
  }

  /**
   * Determines whether or not this aggro is for a living actor.
   * @returns {boolean}
   */
  isForLivingActor()
  {
    // grab the battler for reference.
    const battler = JABS_AiManager.getBattlerByUuid(this.battlerUuid);

    // if there was no battler by this id, then its not for an actor.
    if (!battler) return false;

    // if the battler is not an actor, then its not for an actor.
    if (battler.isActor() === false) return false;

    // if the actor is dead, then it doesn't count.
    if (battler.isDead() === true) return false;

    // if the aggro is reset/empty, then it doesn't count.
    if (this.aggro <= 0) return false;

    // the aggro's target is a living actor.
    return true;
  }
}

export default JABS_Aggro;
//endregion JABS_Aggro