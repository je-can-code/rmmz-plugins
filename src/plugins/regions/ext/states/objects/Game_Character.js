//region Game_Character
import RegionStateData from './../models/RegionStateData.js';
/**
 * Extends {@link #initMembers}.<br/>
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
  if (!this._j._regions._states)
  {
    this._j._regions._states = {};
  }

  /**
   * The timer that manages the (re)application of region-derived states.
   * @type {JABS_Timer}
   */
  if (!this._j._regions._states._timer)
  {
    this._j._regions._states._timer = new JABS_Timer(J.REGIONS.EXT.STATES.Metadata.delayBetweenApplications);
  }
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
 * Extends {@link #update}.<br/>
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

  // characters that are not visible should not receive region states.
  if (!this.isVisible()) return false;

  // if this character has no battler, then they cannot handle region states.
  if (!this.hasJabsBattler()) return false;

  // they probably can have region states applied!
  return true;
};

/**
 * Applies all relevant region states based on their regionId.<br/>
 * Each tagged state is one the battler standing on the region gives itself, so its chance is rolled through
 * {@link JABS_Fate.resolveStateProcCount} with that battler as both the roller and the recipient: the tag's chance
 * meets its own resistances to the state, its fate counts once, and it holds no luck over itself.<br/>
 * Every landing adds the state through {@link Game_Battler#addState}, credited to the battler itself, exactly as any
 * other application would: J-ABS checks the battler's immunities on each one, starts the state on a battler that does
 * not carry it yet, and reapplies it by the state's own rule- refreshed, extended or stacked- on a battler that
 * already does, whether the earlier landing came in this proc or a previous one. The tag's animation plays only when
 * the state landed at least once.
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

    // the one standing on the region rolls for the state and receives it, so the tag's chance meets that battler's
    // own State Rate and <stateTypeResist> for the state, and its fate counts once with no luck held over itself.
    // a region carries no skill, so the battler-wide lucky and cursed rolls are the only rolls it brings.
    const procCount = JABS_Fate.resolveStateProcCount(battler, battler, stateId, chance);

    // a roll that landed nothing abandons the whole proc, its animation included.
    if (procCount === 0) return;

    // every landing goes through the battler's own add, credited to itself, which J-ABS routes to its tracker: the
    // immunities are checked each time, a state the battler does not carry yet starts fresh, and one it already
    // carries is refreshed, extended or stacked by its own reapplication rule rather than started over.
    for (let i = 0; i < procCount; i++)
    {
      battler.addState(stateId, battler);
    }

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