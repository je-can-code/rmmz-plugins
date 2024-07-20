//region Game_Character
/**
 * Extends {@link #initMembers}.<br>
 * Also initializes the region skills members.
 */
J.REGIONS.EXT.SKILLS.Aliased.Game_Character.set('initMembers', Game_Character.prototype.initMembers);
Game_Character.prototype.initMembers = function()
{
  // perform original logic.
  J.REGIONS.EXT.SKILLS.Aliased.Game_Character.get('initMembers')
    .call(this);

  // initialize the additional members.
  this.initRegionSkillsMembers();
};

/**
 * Initializes all members associated with region states.
 */
Game_Character.prototype.initRegionSkillsMembers = function()
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
   * A grouping of all properties associated with the region skills plugin extension.
   */
  this._j._regions._skills = {};

  /**
   * The timer that manages the (re)execution of region-derived skills.
   * @type {JABS_Timer}
   */
  this._j._regions._skills._timer = new JABS_Timer(J.REGIONS.EXT.SKILLS.Metadata.delayBetweenExecutions);
};

/**
 * Gets the region skills timer for this character.
 * @return {JABS_Timer}
 */
Game_Character.prototype.getRegionSkillsTimer = function()
{
  return this._j._regions._skills._timer;
};

/**
 * Extends {@link #update}.<br>
 * Also handles region skills updates for the character.
 */
J.REGIONS.EXT.SKILLS.Aliased.Game_Character.set('update', Game_Character.prototype.update);
Game_Character.prototype.update = function()
{
  // perform original logic.
  J.REGIONS.EXT.SKILLS.Aliased.Game_Character.get('update')
    .call(this);

  // execute the various region skills if applicable.
  this.handleRegionSkills();
};

/**
 * Handles processing of the region states functionality.
 */
Game_Character.prototype.handleRegionSkills = function()
{
  // check to make sure we can even process region states for this character.
  if (!this.canHandleRegionSkills()) return;

  // grab the timer.
  const timer = this.getRegionSkillsTimer();

  // first, update it.
  timer.update();

  // now check if the timer is complete.
  if (timer.isTimerComplete())
  {
    // reset completed timers.
    timer.reset();

    // attempt to apply all the region states.
    this.executeRegionSkills();
  }
};

/**
 * Checks if this character should process their own region skills.
 * @return {boolean}
 */
Game_Character.prototype.canHandleRegionSkills = function()
{
  // if this character is a vehicle, then they cannot handle region skills.
  if (this.isVehicle()) return false;

  // if this character has no battler, then they cannot handle region skills.
  if (!this.hasJabsBattler()) return false;

  // they probably can have region skills executed!
  return true;
};

/**
 * Executes all relevant region skills based on their regionId.
 */
Game_Character.prototype.executeRegionSkills = function()
{
  // grab all the current region states by this regionId.
  const regionSkillDatas = this.getRegionSkillsByCurrentRegionId();

  // if there are no region states to apply, then they cannot handle region states.
  if (regionSkillDatas.length === 0) return;

  // grab the battler associated with this character.
  const targetJabsBattler = this.getJabsBattler();

  // iterate over each of the region states to apply it.
  regionSkillDatas.forEach(regionSkillData =>
  {
    // deconstruct the region skill data.
    const { skillId, chance, casterId, isFriendly } = regionSkillData;

    // roll the dice and see if we should even execute it.
    if (!RPGManager.chanceIn100(chance)) return;

    // grab the current dummy for inspection.
    const currentDummyCaster = $jabsEngine.getMapDamageBattler();

    // validations for whether or not we need to update the dummy casting the skill.
    const correctCaster = currentDummyCaster?.getBattlerId() === casterId;
    const correctTeam = currentDummyCaster?.isFriendlyTeam(targetJabsBattler.getTeam()) === isFriendly;

    // make sure we're using the right dummy.
    if (!correctCaster || !correctTeam)
    {
      // we weren't using the right dummy, so update it.
      $jabsEngine.setMapDamageBattler(casterId, isFriendly);
    }

    // execute the skill.
    $jabsEngine.forceMapAction(
      $jabsEngine.getMapDamageBattler(),
      skillId,
      false,
      targetJabsBattler.getX(),
      targetJabsBattler.getY(),
      true);
  });
};

/**
 * Gets all {@link RegionSkillData}s associated with this character's current regionId.
 * @return {RegionSkillData[]}
 */
Game_Character.prototype.getRegionSkillsByCurrentRegionId = function()
{
  // grab the current regionId.
  const regionId = this.regionId();

  // return all found region states by the current regionId.
  return $gameMap.getRegionSkillsByRegionId(regionId);
};
//endregion Game_Character