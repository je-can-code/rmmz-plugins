//region Game_Character
/**
 * Extends {@link #initMembers}.<br>
 * Also initializes hitstop members.
 */
J.ABS.EXT.HITSTOP.Aliased.Game_Character.set('initMembers', Game_Character.prototype.initMembers);
Game_Character.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.EXT.HITSTOP.Aliased.Game_Character.get('initMembers')
    .call(this);

  // initialize the additional hitstop members.
  this.initHitstopMembers();
};

/**
 * Initializes all members associated with hitstop on this character.
 */
Game_Character.prototype.initHitstopMembers = function()
{
  /**
   * The root namespace for all plugin data.
   */
  this._j ||= {};

  /**
   * The root namespace for ABS-related data.
   */
  this._j._abs ||= {};

  /**
   * A grouping of all properties associated with this hitstop extension.
   */
  this._j._abs._hitstop = {};

  /**
   * The hitstop data model owning timers and queued effects.
   * @type {JABS_HitstopData}
   */
  this._j._abs._hitstop._data = new JABS_HitstopData();
};

/**
 * Gets the hitstop data for this character.
 * @returns {JABS_HitstopData}
 */
Game_Character.prototype.getHitstopData = function()
{
  if (!this._j._abs._hitstop)
  {
    this.initHitstopMembers();
  }

  // return the hitstop data model.
  return this._j._abs._hitstop._data;
};

/**
 * Whether or not this character is currently paused by hitstop.
 * @returns {boolean}
 */
Game_Character.prototype.isHitstopped = function()
{
  // check the hitstop data’s active flag.
  return this.getHitstopData()
    .isActive();
};

/**
 * Extends {@link #update}.<br>
 * Also pauses this character while hitstopped.
 */
J.ABS.EXT.HITSTOP.Aliased.Game_Character.set('update', Game_Character.prototype.update);
Game_Character.prototype.update = function()
{
  // if this character is currently hitstopped, tick the timer and stop here.
  if (this.isHitstopped())
  {
    // decrement the hitstop frames on this character.
    this.getHitstopData()
      .tick();

    // stop all other update progression to create the freeze effect.
    return;
  }

  // perform original logic.
  J.ABS.EXT.HITSTOP.Aliased.Game_Character.get('update')
    .call(this);

  // after a normal update, if we just came out of hitstop, apply any queued knockback.
  this.applyQueuedKnockbackIfAny();
};

/**
 * Applies any queued knockback after a hitstop release.
 */
Game_Character.prototype.applyQueuedKnockbackIfAny = function()
{
  // grab the hitstop data for this character.
  const data = this.getHitstopData();

  // grab any queued knockback.
  const vector = data.consumeQueuedKnockback();

  // if a vector exists, attempt to move accordingly.
  if (vector)
  {
    // attempt to move stepwise by vector (engine-level passability checks still apply when trying to move).
    const {
      x,
      y
    } = vector;

    // apply X displacement (tilewise) one tile at a time.
    for (let i = 0; i < Math.abs(x); i++)
    {
      // move left or right by one tile.
      if (x < 0) this.moveStraight(4);
      if (x > 0) this.moveStraight(6);
    }

    // apply Y displacement (tilewise) one tile at a time.
    for (let i = 0; i < Math.abs(y); i++)
    {
      // move up or down by one tile.
      if (y < 0) this.moveStraight(8);
      if (y > 0) this.moveStraight(2);
    }
  }
};
//endregion Game_Character