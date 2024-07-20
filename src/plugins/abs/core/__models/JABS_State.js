//region JABS_State
/**
 * A class for handling the state data in the context of JABS.
 */
class JABS_State
{
  //region properties
  /**
   * The list of rulesets available for how to handle reapplication of a state.
   */
  static reapplicationType = {
    /**
     * "Refresh" will refresh the duration of a state when reapplied.
     * @type {"refresh"}
     */
    Refresh: "refresh",

    /**
     * "Extend" will add the remaining duration onto the new duration when reapplied.
     * @type {"extend"}
     */
    Extend: "extend",

    /**
     * "Stack" will add an additional stack of the state when reapplied.
     * @type {"stack"}
     */
    Stack: "stack",
  }

  /**
   * The battler being afflicted with this state.
   * @type {Game_Battler}
   */
  battler = null;

  /**
   * The id of the state being tracked.
   * @type {number}
   */
  stateId = 0;

  /**
   * The icon index of the state being tracked (for visual purposes).
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The current duration of the state being tracked. Decrements over time.
   * @type {number}
   */
  duration = 0;

  /**
   * The base duration.
   * Used for reapplication and stacking purposes.
   * @type {number}
   */
  #baseDuration = 0;

  /**
   * The number of frames that defines "recently applied".
   * @type {number}
   */
  #recentlyAppliedCounter = 0;

  /**
   * Whether or not this tracked state is identified as `expired`.
   * Expired states do not apply to the battler, but are kept in the tracking collection
   * to grant the ability to refresh the state duration or whatever we choose to do.
   * @type {boolean}
   */
  expired = true;

  /**
   * The source that caused this state. Usually this is an opposing battler. If no source is specified,
   * then the afflicted battler is the source.
   * @type {Game_Battler}
   */
  source = null;

  /**
   * The number of stacks of this state applied to the tracker.
   * @type {number}
   */
  stackCount = 0;

  /**
   * The number of times this state has been refreshed.<br/>
   * This only matters when the reapplication type is {@link JABS_State.reapplicationType.Refresh}.
   * @type {number}
   */
  timesRefreshed = 0;

  /**
   * The number of frames until
   * @type {number}
   */
  #refreshResetCounter = 0;

  //endregion properties

  /**
   * Constructor.
   * @param {Game_Battler} battler The battler afflicted.
   * @param {number} stateId The id of the state being applied to the battler.
   * @param {number} iconIndex The icon index associated with the state.
   * @param {number} duration The duration in frames that this state will remain.
   * @param {number=} startingStacks The number of stacks to start out with; defaults to 1.
   * @param {Game_Battler=} source The battler who afflicted the state; defaults to self.
   */
  constructor(battler, stateId, iconIndex, duration, startingStacks = 1, source = battler)
  {
    // initialize the values of the tracker.
    this.battler = battler;
    this.stateId = stateId;
    this.iconIndex = iconIndex;
    this.duration = duration;
    this.stackCount = startingStacks;
    this.source = source;

    // mirror the duration as base duration for stacks.
    this.setBaseDuration(duration);
    this.refreshRecentlyAppliedCounter();

    // set the state to be active.
    this.expired = false;
  }

  /**
   * Updates the base duration to a new value.
   * @param {number} newBaseDuration The new base duration value.
   */
  setBaseDuration(newBaseDuration)
  {
    // updates the underlying base duration as well.
    this.#baseDuration = newBaseDuration;
  }

  /**
   * Determines whether or not the state should not expire by duration.
   * @returns {boolean} True if this state should last until removed, false otherwise.
   */
  hasEternalDuration()
  {
    // "forever" states are states that have no duration aka -1.
    if (this.#baseDuration !== -1) return false;

    // this state should never expire unless removed explicitly.
    return true;
  }

  /**
   * Whether or not this state has been refreshed recently enough that the refresh effects are diminished due to
   * repetition of being reapplied over and over again in a short amount of time.
   * @returns {boolean}
   */
  hasDiminishingRefresh()
  {
    return this.#refreshResetCounter > 0;
  }

  /**
   * Refresh the recently applied counter.
   */
  refreshRecentlyAppliedCounter()
  {
    // reset the recently applied counter.
    this.#recentlyAppliedCounter = 6;
  }

  /**
   * Refresh the refresh reset counter.
   * @param {number=} newRefreshResetAmount The count to refresh the refresh reset counter to.
   */
  refreshRefreshResetCounter(newRefreshResetAmount = J.ABS.Metadata.DefaultStateRefreshReset)
  {
    this.#refreshResetCounter = newRefreshResetAmount
  }

  /**
   * The update loop for this tracked state.
   * Handles decrementing the counter and removing the state as applicable.
   */
  update()
  {
    // handle all counters associated with the state.
    this.handleCounters();

    // remove stacks as-needed.
    this.decrementStacks();

    // handle the removal if applicable.
    this.handleExpiration();

    // reset the refresh reset counter and times refreshed counter if necessary.
    this.handleDiminishedRefresh();
  }

  /**
   * Handle all the counters that countdown on this state, like the recently applied counter, the refresh reset counter,
   * and the actual duration counter.
   */
  handleCounters()
  {
    // countdown the recently applied timer for this state.
    this.decrementRecentlyAppliedCounter();

    // countdown the refresh reset timer for this state.
    this.decrementRefreshResetCounter();

    // countdown if there is still time left to be counted down.
    this.decrementDuration();
  }

  /**
   * Decrements the recently applied counter as-needed.
   */
  decrementRecentlyAppliedCounter()
  {
    // check if we still have any counter left.
    if (this.#recentlyAppliedCounter > 0)
    {
      // decrement it as-needed.
      this.#recentlyAppliedCounter--;
    }
  }

  /**
   * Decrements the refresh reset counter as-needed.
   */
  decrementRefreshResetCounter()
  {
    // check if we still have any counter left.
    if (this.#refreshResetCounter > 0)
    {
      // decrement it as-needed.
      this.#refreshResetCounter--;
    }
  }

  /**
   * Decrements the duration as-needed.
   */
  decrementDuration()
  {
    // check if we still have time left on the clock.
    if (this.duration > 0)
    {
      // decrement the timer.
      this.duration--;
    }
  }

  /**
   * Decrement the stack counter as-needed.
   */
  decrementStacks()
  {
    // check if we are at 0 duration and have stacks remaining.
    if (this.duration <= 0 && this.stackCount > 0 && !this.hasEternalDuration())
    {
      // grab whether or not to lose all stacks at once.
      const loseAllStacksAtOnce = this.source.state(this.stateId).jabsLoseAllStacksAtOnce;

      // decrement the stack counter accordingly.
      this.stackCount -= loseAllStacksAtOnce
        ? this.stackCount
        : 1;

      // check if we STILL have stacks remaining.
      if (this.stackCount > 0)
      {
        // reset the duration to the initial duration.
        this.refreshDuration();
      }
    }
  }

  /**
   * Refreshes the duration of the state based on its original duration.
   * This does not refresh the recently applied counter.
   */
  refreshDuration(newDuration = this.#baseDuration)
  {
    // don't refresh the state if the provided duration is actually 0.
    if (newDuration <= 0) return;

    // refresh the duration.
    this.duration = newDuration;

    // unexpire the tracker.
    this.expired = false;

    // flag this as recently applied.
    this.refreshRecentlyAppliedCounter();

    // also reset the refresh reset counter.
    this.refreshRefreshResetCounter();

    // when new states are revived, they may be revived with zero stacks.
    if (this.stackCount === 0)
    {
      // they should actually be revived with a single stack.
      this.stackCount = 1;
    }
  }

  /**
   * Handles the removal of the state from the afflicted battler if applicable.
   */
  handleExpiration()
  {
    // check if we can and should remove this state from the battler.
    if (this.canRemoveFromBattler() && this.shouldRemoveFromBattler())
    {
      // actually remove the state from the battler.
      this.removeFromBattler();
    }
  }

  /**
   * Handle reset circumstances for the refresh reset counter and times refreshed counter.
   */
  handleDiminishedRefresh()
  {
    // check if we have refreshed repeatedly, but the reset counter reached zero.
    if (this.timesRefreshed > 0 && this.#refreshResetCounter === 0)
    {
      // reset the number of times this state has been refreshed.
      this.timesRefreshed = 0;
    }
  }

  /**
   * Increments the stack counter as high as the limit allows.
   * @param {number} stackIncrease The number of stacks to increase; defaults to 1.
   */
  incrementStacks(stackIncrease = 1)
  {
    // grab the max number of stacks for this state.
    const maxStacks = this.battler.state(this.stateId).jabsStateStackMax;

    // check if we still have room to add more stacks.
    if (this.stackCount < maxStacks)
    {
      // project the new stack count.
      const projectedStackCount = this.stackCount + stackIncrease;

      // increment the stack counter within threshold.
      this.stackCount = Math.min(maxStacks, projectedStackCount);
    }
  }

  /**
   * Removes this tracked state from the afflicted battler.
   */
  removeFromBattler()
  {
    // actually remove the state from the battler.
    this.battler.removeState(this.stateId);

    // expire it, too.
    this.expired = true;
  }

  /**
   * Determine if removing this state is even possible.
   * @returns {boolean} True if it is removable, false otherwise.
   */
  canRemoveFromBattler()
  {
    // if the state afflicted is death, we can't remove it.
    if (this.canHoldBecauseStateType()) return false;

    // if the battler isn't afflicted with it, we can't remove it.
    if (!this.battler.isStateAffected(this.stateId)) return false;

    // its removable.
    return true;
  }

  /**
   * Determines whether or not this state should be removed because of its type.
   * @returns {boolean}
   */
  canHoldBecauseStateType()
  {
    // if the state afflicted is death, we can't remove it.
    if (this.stateId === this.battler.deathStateId()) return true;

    // nothing is holding this state relating to its type of state.
    return false;
  }

  /**
   * Determines whether or not we should remove this state from the battler.
   * @returns {boolean} True if it should be removed, false otherwise.
   */
  shouldRemoveFromBattler()
  {
    // if there are any stacks remaining, the stacks should be decremented first.
    if (this.stackCount > 0) return false;

    // if there is still time on the clock, we shouldn't remove it.
    if (!this.shouldRemoveByDuration()) return false;

    // purge it!
    return true;
  }

  /**
   * Determines whether or not this state should be removed because of its duration.
   * @returns {boolean} True if the state should be removed, false otherwise.
   */
  shouldRemoveByDuration()
  {
    // if there is still time on the clock, we shouldn't remove it.
    if (this.duration > 0) return false;

    // if there is no time because it is an eternal state, we shouldn't remove it.
    if (this.duration <= 0 && this.hasEternalDuration()) return false;

    // time is up!
    return true;
  }

  /**
   * Determines whether or not this state is about to expire.
   * @returns {boolean} True if it is about to expire, false otherwise.
   */
  isAboutToExpire()
  {
    // define the threshold for when a state is "about to expire".
    const aboutToExpireThreshold = Math.round(this.#baseDuration / 5);

    // return whether or not the current duration is less than that.
    return (this.duration <= aboutToExpireThreshold && !this.hasEternalDuration());
  }

  /**
   * Determines whether or not this state was recently applied.
   * @returns {boolean} True if it was recently applied, false otherwise.
   */
  wasRecentlyApplied()
  {
    // return whether or not this state has been recently applied.
    return (this.#recentlyAppliedCounter > 0);
  }
}

//endregion JABS_State