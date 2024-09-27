//region J_Timer
/**
 * A reusable timer with some nifty functions.
 */
function J_Timer(timerMax)
{
  this.initialize(timerMax);
}

J_Timer.prototype = {};
J_Timer.prototype.constructor = J_Timer;

/**
 * Constructor.
 *
 * NOTE: A key is not required, but can be set with setters.
 * @param {number=} [timerMax=0] The max duration of this timer.
 * @param {boolean=} [stopCounting=true] Whether or not to stop counting after completing; defaults to true.
 * @param {?Function} callback EXPERIMENTAL. A callback function for completion of this timer.
 */
J_Timer.prototype.initialize = function(timerMax = 0, stopCounting = true, callback = null)
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
};

/**
 * Initializes the default members for the timer.
 */
J_Timer.prototype.initMembers = function()
{
  /**
   * A key or name for this timer.
   * This is not strictly enforced by the timer, so this is for
   * developer convenience if needed.
   * @type {string}
   */
  this._key = String.empty;

  /**
   * The counter on this timer that ticks up to the max.
   * @type {number}
   */
  this._timer = 0;

  /**
   * The maximum count this timer can reach.
   * @type {number}
   */
  this._timerMax = 0;
};

/**
 * Gets the key of this timer, if one was set.
 * @returns {string|String.empty}
 */
J_Timer.prototype.getKey= function()
{
  return this._key;
}

/**
 * Sets the key of this timer to the given value.
 * @param {string} key The new key or name for this timer.
 */
J_Timer.prototype.setKey = function(key)
{
  this._key = key;
}

/**
 * Gets the current time on this timer.
 * @returns {number}
 */
J_Timer.prototype.getCurrentTime = function()
{
  return this._timer;
}

/**
 * Sets the current time of this timer to a given amount.
 * Reducing below max time will remove completion if applicable.
 * Setting at or above max time will apply completion if applicable.
 * @param {number} time The new time for this timer.
 */
J_Timer.prototype.setCurrentTime = function(time)
{
  this._timer = time;

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
J_Timer.prototype.modCurrentTime = function(time)
{
  // modify by this amount.
  this._timer += time;

  // handle the possibility of the timer becoming incomplete.
  this._handleIfIncomplete();

  // handle the possibility that this timer is completed.
  this._handleIfComplete();

  // for convenience, returns the new total.
  return this._timer;
}

/**
 * Gets the total time set to run on this timer.
 * @returns {number}
 */
J_Timer.prototype.getMaxTime = function()
{
  return this._timerMax;
}

/**
 * Sets the max time for this timer to the given amount.
 * @param {number} maxTime The new max time for this timer.
 */
J_Timer.prototype.setMaxTime = function(maxTime)
{
  this._timerMax = maxTime;
}

/**
 * Whether or not we should stop counting beyond max when updating.
 * @returns {boolean}
 */
J_Timer.prototype.shouldStopCounting = function()
{
  return this._stopCounting;
}

/**
 * Normalize time that is above bounds while the "stop counting" flag is set.
 */
J_Timer.prototype.normalizeTime = function()
{
  // don't mess with time that isn't finished.
  if (!this.isTimerComplete()) return;

  // normalize only applies to "should stop counting".
  if (!this.shouldStopCounting()) return;

  // reset the time to the max time.
  this._timer = this.getMaxTime();
}

/**
 * Checks whether or not this timer is completed.
 * @returns {boolean} True if it is completed, false otherwise.
 */
J_Timer.prototype.isTimerComplete = function()
{
  return this._timerComplete;
}

/**
 * Resets the timer back to initial state.
 */
J_Timer.prototype.reset = function()
{
  // re-initialize the timer.
  this._timer = 0;

  // re-initialize the completion flag.
  this._timerComplete = false;
}

/**
 * The main update method of this timer.
 */
J_Timer.prototype.update = function()
{
  // process the tick of this timer.
  this.tick();

  // process the tock of this timer.
  this.tock();
}

/**
 * Processes the incrementing of the time.
 */
J_Timer.prototype.tick = function()
{
  // you cannot tick past the completion.
  if (this.isTimerComplete()) return;

  // increment the timer.
  this._timer++;
}

/**
 * Processes the management of state of this timer.
 */
J_Timer.prototype.tock = function()
{
  // handle the possibility that this timer is completed.
  this._handleIfComplete();
}

/**
 * Handles the possibility of this timer becoming incomplete.
 */
J_Timer.prototype._handleIfIncomplete = function()
{
  // check if we are below the max time duration.
  if (this._timer < this._timerMax)
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
J_Timer.prototype._handleIfComplete = function()
{
  // do nothing if already complete.
  if (this.isTimerComplete()) return;

  // check if we have reached or exceeded the max time duration.
  if (this._timer >= this._timerMax)
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
J_Timer.prototype.forceComplete = function()
{
  // set the current to the max time.
  this.setCurrentTime(this.getMaxTime());

  // process completion of the timer.
  this._handleIfComplete();
}

J_Timer.prototype.onComplete = function()
{
  //console.log(`timer completed`, this);
}
//endregion J_Timer