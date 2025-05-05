//region Game_Timer
/**
 * Extends {@link #initialize}.<br/>
 * Also initializes the duration.
 */
J.BASE.Aliased.Game_Timer.set('initialize', Game_Timer.prototype.initialize);
Game_Timer.prototype.initialize = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_Timer.get('start')
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

  this._duration = duration;
};

/**
 * Gets the elapsed amount of time relative to the duration.
 * @returns {number}
 */
Game_Timer.prototype.elapsedFrames = function()
{
  return this._duration - this._frames;
};
//endregion Game_Timer