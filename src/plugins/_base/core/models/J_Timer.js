//region J_Timer
/**
 * A reusable timer with some nifty functions.
 */
class J_Timer
{
  /**
   * Constructor.
   *
   * NOTE: A key is not required, but can be set with setters.
   * @param {number=} [timerMax=0] The max duration of this timer.
   * @param {boolean=} [stopCounting=true] Whether or not to stop counting after completing; defaults to true.
   * @param {?Function} callback EXPERIMENTAL. A callback function for completion of this timer.
   */
  constructor(timerMax = 0, stopCounting = true, callback = null)
  {
    /**
     * The maximum count this timer can reach.
     * @type {number}
     */
    this._timerMax = timerMax;

    /**
     * Whether or not to stop counting after we've reached the max.
     * @type {boolean}
     */
    this._stopCounting = stopCounting;

    /**
     * The callback function to execute when the timer completes.
     * If none is provided, nothing will happen, though the {@link #onComplete} will still execute
     * in case you would prefer to handle it in code yourself.
     * @type {Function|null}
     */
    this._callback = callback;

    this.initMembers();
  }

  /**
   * Initializes the default members for the timer.
   */
  initMembers()
  {
    /**
     * A key or name for this timer.
     * This is not strictly enforced by the timer, so this is for
     * developer convenience if needed.
     * @type {string}
     */
    // store  key on the instance for later reads.
    this._key = String.empty;

    /**
     * The counter on this timer that ticks up to the max.
     * @type {number}
     */
    this._timer = 0;
  }

  //region properties
  /**
   * Gets the timer.
   * @returns {number} The timer.
   */
  timer()
  {
    // hand back the timer.
    return this._timer;
  }

  /**
   * Sets the timer.
   * @param {number} newTimer The new timer.
   */
  setTimer(newTimer)
  {
    // assign the timer.
    this._timer = newTimer;
  }

  /**
   * Gets the timer max.
   * @returns {number} The timerMax.
   */
  timerMax()
  {
    // hand back the timer max.
    return this._timerMax;
  }

  /**
   * Sets the timer max.
   * @param {number} newTimerMax The new timerMax.
   */
  setTimerMax(newTimerMax)
  {
    // assign the timer max.
    this._timerMax = newTimerMax;
  }

  /**
   * Gets the stop counting.
   * @returns {boolean} The stopCounting.
   */
  stopCounting()
  {
    // hand back the stop counting.
    return this._stopCounting;
  }
  //endregion properties

  /**
   * Gets the key of this timer, if one was set.
   * @returns {string|String.empty}
   */
  getKey()
  {
    return this._key;
  }

  /**
   * Sets the key of this timer to the given value.
   * @param {string} key The new key or name for this timer.
   */
  setKey(key)
  {
    this._key = key;
  }

  /**
   * Gets the current time on this timer.
   * @returns {number}
   */
  getCurrentTime()
  {
    return this.timer();
  }

  /**
   * Sets the current time of this timer to a given amount.
   * Reducing below max time will remove completion if applicable.
   * Setting at or above max time will apply completion if applicable.
   * @param {number} time The new time for this timer.
   */
  setCurrentTime(time)
  {
    this.setTimer(time);

    // handle the possibility of the timer becoming incomplete.
    this._handleIfIncomplete();

    // handle the possibility that this timer is completed.
    this._handleIfComplete();
  }

  /**
   * Modify the current time of this timer by the given amount.
   * Reducing below max time will remove completion if applicable.
   * Setting at or above max time will apply completion if applicable.
   * @param {number} time The amount to modify by.
   * @returns {number} The new total after modification.
   */
  modCurrentTime(time)
  {
    // modify by this amount.
    this.setTimer(this.timer() + time);

    // handle the possibility of the timer becoming incomplete.
    this._handleIfIncomplete();

    // handle the possibility that this timer is completed.
    this._handleIfComplete();

    // for convenience, returns the new total.
    return this.timer();
  }

  /**
   * Gets the total time set to run on this timer.
   * @returns {number}
   */
  getMaxTime()
  {
    return this.timerMax();
  }

  /**
   * Sets the max time for this timer to the given amount.
   * @param {number} maxTime The new max time for this timer.
   */
  setMaxTime(maxTime)
  {
    this.setTimerMax(maxTime);
  }

  /**
   * Whether or not we should stop counting beyond max when updating.
   * @returns {boolean}
   */
  shouldStopCounting()
  {
    return this.stopCounting();
  }

  /**
   * Normalize time that is above bounds while the "stop counting" flag is set.
   */
  normalizeTime()
  {
    // don't mess with time that isn't finished.
    if (!this.isTimerComplete()) return;

    // normalize only applies to "should stop counting".
    if (!this.shouldStopCounting()) return;

    // reset the time to the max time.
    this.setTimer(this.getMaxTime());
  }

  /**
   * Checks whether or not this timer is completed.
   * @returns {boolean} True if it is completed, false otherwise.
   */
  isTimerComplete()
  {
    return this._timerComplete;
  }

  /**
   * Resets the timer back to initial state.
   */
  reset()
  {
    // re-initialize the timer.
    this.setTimer(0);

    // re-initialize the completion flag.
    this._timerComplete = false;
  }

  /**
   * The main update method of this timer.
   */
  update()
  {
    // process the tick of this timer.
    this.tick();

    // process the tock of this timer.
    this.tock();
  }

  /**
   * Processes the incrementing of the time.
   */
  tick()
  {
    // you cannot tick past the completion.
    if (this.isTimerComplete()) return;

    // increment the timer.
    this.setTimer(this.timer() + 1);
  }

  /**
   * Processes the management of state of this timer.
   */
  tock()
  {
    // handle the possibility that this timer is completed.
    this._handleIfComplete();
  }

  /**
   * Handles the possibility of this timer becoming incomplete.
   */
  _handleIfIncomplete()
  {
    // check if we are below the max time duration.
    if (this.timer() < this.timerMax())
    {
      // going below the timer marks this timer as incomplete.
      this._timerComplete = false;
    }

    // normalize if applicable.
    this.normalizeTime();
  }

  /**
   * Handles the possibility of this timer becoming complete.
   */
  _handleIfComplete()
  {
    // do nothing if already complete.
    if (this.isTimerComplete()) return;

    // check if we have reached or exceeded the max time duration.
    if (this.timer() >= this.timerMax())
    {
      // surpassing the timer marks this timer as complete.
      this._timerComplete = true;

      // normalize if applicable.
      this.normalizeTime();

      // process the on-completion event hook.
      this.onComplete();
    }
  }

  /**
   * Forcefully completes this timer.
   */
  forceComplete()
  {
    // set the current to the max time.
    this.setCurrentTime(this.getMaxTime());

    // process completion of the timer.
    this._handleIfComplete();
  }

  onComplete()
  {
    // deliberately empty: this is the extension point subclasses override to react to completion.
  }
}

export default J_Timer;
//endregion J_Timer