//region Game_Character
/**
 * Extends {@link #initMembers}.<br>
 * Also initializes the region states members.
 */
J.REGIONS.EXT.STATES.Aliased.Game_Character.set('initMembers', Game_Character.prototype.initMembers);
Game_Character.prototype.initMembers = function()
{
  // perform original logic.
  J.REGIONS.EXT.STATES.Aliased.Game_Character.get('initMembers')
    .call(this);

  // initialize the additional members.
  this.initRegionStatesMembers();
};

/**
 * Initializes all members associated with region states.
 */
Game_Character.prototype.initRegionStatesMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with REGIONS.
   */
  this._j._regions ||= {};

  /**
   * A grouping of all properties associated with the region states plugin extension.
   */
  this._j._regions._states = {};

  /**
   * The timer that manages the (re)application of region-derived states.
   * @type {JABS_Timer}
   */
  this._j._regions._states._timer = new JABS_Timer(J.REGIONS.EXT.STATES.Metadata.delayBetweenApplications);
};

/**
 * Gets the region states timer for this character.
 * @return {JABS_Timer}
 */
Game_Character.prototype.getRegionStatesTimer = function()
{
  return this._j._regions._states._timer;
};

/**
 * Extends {@link #update}.<br>
 * Also handles region states updates for the character.
 */
J.REGIONS.EXT.STATES.Aliased.Game_Character.set('update', Game_Character.prototype.update);
Game_Character.prototype.update = function()
{
  // perform original logic.
  J.REGIONS.EXT.STATES.Aliased.Game_Character.get('update')
    .call(this);

  // apply the various region states if applicable.
  this.handleRegionStates();
};

/**
 * Handles processing of the region states functionality.
 */
Game_Character.prototype.handleRegionStates = function()
{
  // check to make sure we can even process region states for this character.
  if (!this.canHandleRegionStates()) return;

  // grab the timer.
  const timer = this.getRegionStatesTimer();

  // first, update it.
  timer.update();

  // now check if the timer is complete.
  if (timer.isTimerComplete())
  {
    // reset completed timers.
    timer.reset();

    // attempt to apply all the region states.
    this.applyRegionStates();
  }
};

/**
 * Checks if this character should process their own region states.
 * @return {boolean}
 */
Game_Character.prototype.canHandleRegionStates = function()
{
  // if this character is a vehicle, then they cannot handle region states.
  if (this.isVehicle()) return false;

  // if this character has no battler, then they cannot handle region states.
  if (!this.hasJabsBattler()) return false;

  // they probably can have region states applied!
  return true;
};

/**
 * Applies all relevant region states based on their regionId.
 */
Game_Character.prototype.applyRegionStates = function()
{
  // grab all the current region states by this regionId.
  const regionStateDatas = this.getRegionStatesByCurrentRegionId();

  // if there are no region states to apply, then they cannot handle region states.
  if (regionStateDatas.length === 0) return;

  // grab the battler associated with this character.
  const battler = this.getJabsBattler()
    .getBattler();

  // iterate over each of the region states to apply it.
  regionStateDatas.forEach(regionStateData =>
  {
    // deconstruct the region state data.
    const {
      stateId,
      chance,
      animationId
    } = regionStateData;

    // get the calculated rate for the state being applied.
    const calculatedChance = battler.stateRate(stateId) * chance;

    // roll the dice and see if we should even apply it.
    if (!RPGManager.chanceIn100(calculatedChance)) return;

    // apply the state.
    battler.addState(stateId);

    // check if there is a valid animation to play.
    if (animationId > 0)
    {
      // trigger the animation.
      this.requestAnimation(animationId);
    }
  });
};

/**
 * Gets all {@link RegionStateData}s associated with this character's current regionId.
 * @return {RegionStateData[]}
 */
Game_Character.prototype.getRegionStatesByCurrentRegionId = function()
{
  // grab the current regionId.
  const regionId = this.regionId();

  // return all found region states by the current regionId.
  return $gameMap.getRegionStatesByRegionId(regionId);
};
//endregion Game_Character