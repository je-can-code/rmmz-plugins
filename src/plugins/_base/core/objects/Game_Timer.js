//region Game_Timer
/**
 * Extends {@link #initialize}.<br/>
 * Also initializes the duration.
 */
J.BASE.Aliased.Game_Timer.set('initialize', Game_Timer.prototype.initialize);
Game_Timer.prototype.initialize = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Timer.get('initialize')
    .call(this);

  /**
   * Also initialize the duration of the timer.
   * @type {number}
   */
  this._duration = 0;
};

/**
 * Extends {@link #start}.<br/>
 * Also sets the duration of the timer for tracking relative elapsed time.
 */
J.BASE.Aliased.Game_Timer.set('start', Game_Timer.prototype.start);
Game_Timer.prototype.start = function(duration)
{
  // perform original logic.
  J.BASE.Aliased.Game_Timer.get('start')
    .call(this, duration);

  // store  duration on the instance for later reads.
  this.setDuration(duration);
};

/**
 * Gets the elapsed amount of time relative to the duration.
 * @returns {number}
 */
Game_Timer.prototype.elapsedFrames = function()
{
  return this.duration() - this.frames();
};

//region properties
/**
 * Gets the frame count this timer was originally started with.
 * @returns {number} The starting duration in frames.
 */
Game_Timer.prototype.duration = function()
{
  // hand back the duration.
  return this._duration;
};

/**
 * Sets the frame count this timer counts down from.
 * @param {number} newDuration The starting duration in frames.
 */
Game_Timer.prototype.setDuration = function(newDuration)
{
  // assign the duration.
  this._duration = newDuration;
};
//endregion properties
//endregion Game_Timer