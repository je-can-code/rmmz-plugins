//region timers
/**
 * Sets the battler's wait duration to a number. If this number is greater than
 * zero, then the battler must wait before doing anything else.
 * @param {number} wait The duration for this battler to wait.
 */
JABS_Battler.prototype.setWaitCountdown = function(wait)
{
  // reset the wait timer to start over.
  this._waitTimer.reset();

  // set the wait timer's max to a new time.
  this._waitTimer.setMaxTime(wait);
};

/**
 * Gets whether or not this battler is currently waiting.
 * @returns {boolean} True if waiting, false otherwise.
 */
JABS_Battler.prototype.isWaiting = function()
{
  return !this._waitTimer.isTimerComplete();
};

/**
 * Counts down the duration for this battler's cast time.
 */
JABS_Battler.prototype.countdownCastTime = function()
{
  this.performCastAnimation();
  if (this._castTimeCountdown > 0)
  {
    this._castTimeCountdown--;
    return;
  }

  if (this._castTimeCountdown <= 0)
  {
    this._casting = false;
    this._castTimeCountdown = 0;
  }
};

/**
 * Performs the cast animation if possible on this battler.
 */
JABS_Battler.prototype.performCastAnimation = function()
{
  // check if we can perform a cast animation.
  if (!this.canPerformCastAnimation()) return;

  // get the cast animation id.
  const animationId = this.getDecidedAction()[0].getCastAnimation();

  // show the animation.
  this.showAnimation(animationId);
};

/**
 * Determines whether or not we can perform a cast animation.
 * @returns {boolean}
 */
JABS_Battler.prototype.canPerformCastAnimation = function()
{
  // if we don't have a decided action somehow, then don't do cast animation things.
  if (!this.getDecidedAction()) return false;

  // if we don't have a cast animation, then don't do cast animation things.
  if (!this.getDecidedAction()[0].getCastAnimation()) return false;

  // don't show casting animations while other animations are playing on you.
  if (this.isShowingAnimation()) return false;

  // show cast animations!
  return true;
};

/**
 * Sets the cast time duration to a number. If this number is greater than
 * zero, then the battler must spend this duration in frames casting before
 * executing the skill.
 * @param {number} castTime The duration in frames to spend casting.
 */
JABS_Battler.prototype.setCastCountdown = function(castTime)
{
  this._castTimeCountdown = castTime;
  if (this._castTimeCountdown > 0)
  {
    this._casting = true;
  }

  if (this._castTimeCountdown <= 0)
  {
    this._casting = false;
    this._castTimeCountdown = 0;
  }
};

/**
 * Gets whether or not this battler is currently casting a skill.
 * @returns {boolean}
 */
JABS_Battler.prototype.isCasting = function()
{
  return this._casting;
};

/**
 * Counts down the alertedness of this battler.
 */
JABS_Battler.prototype.countdownAlert = function()
{
  if (this._alertedCounter > 0)
  {
    this._alertedCounter--;
    return;
  }

  if (this._alertedCounter <= 0)
  {
    this.clearAlert();
  }
};

/**
 * Removes and clears the alert state from this battler.
 */
JABS_Battler.prototype.clearAlert = function()
{
  this.setAlerted(false);
  this._alertedCounter = 0;
  // if (!this.isEngaged())
  // {
  //   this.showBalloon(J.ABS.Balloons.Silence);
  // }
};
//endregion timers
//endregion JABS_Battler