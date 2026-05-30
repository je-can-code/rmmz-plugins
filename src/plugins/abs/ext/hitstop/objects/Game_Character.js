//region Game_Character
import JABS_HitstopData from './../_models/JABS_HitstopData.js';
/**
 * Extends {@link #initMembers}.<br/>
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
  // policy step inside init hitstop members.
  this._j ||= {};

  // policy step inside init hitstop members.
  /**
   * The root namespace for ABS-related data.
   */
  this._j._abs ||= {};

  // policy step inside init hitstop members.
  /**
   * A grouping of all properties associated with this hitstop extension.
   */
  this._j._abs._hitstop = {};

  // policy step inside init hitstop members.
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
 * Extends {@link #update}.<br/>
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
};
//endregion Game_Character