//region Game_Map
/**
 * Extends {@link #initialize}.<br>
 * Also initializes the region skills properties.
 */
J.REGIONS.EXT.SKILLS.Aliased.Game_Map.set('initialize', Game_Map.prototype.initialize);
Game_Map.prototype.initialize = function()
{
  // perform original logic.
  J.REGIONS.EXT.SKILLS.Aliased.Game_Map.get('initialize')
    .call(this);

  // initialize the region states.
  this.initRegionSkillsMembers();
};

//region properties
/**
 * Initializes all region states properties for the map.
 */
Game_Map.prototype.initRegionSkillsMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The grouping of all properties related to region effects.
   */
  this._j._regions ||= {};

  /**
   * The grouping of all properties related specifically to the region skills extension.
   */
  this._j._regions._skills = {};

  /**
   * A map keyed by regionId of all {@link RegionSkillData}s that apply while the character is on a tile
   * marked by the keyed regionId.
   * @type {Map<number,RegionSkillData[]>}
   */
  this._j._regions._skills._map = new Map();
};

/**
 * Gets the dictionary currently tracking the regions and skill data executions for the map.
 * @return {Map<number,RegionSkillData[]>}
 */
Game_Map.prototype.getRegionSkills = function()
{
  return this._j._regions._skills._map;
};

/**
 * Gets all skillIds to be executed against characters standing on the given regionId.
 * @return {RegionSkillData[]}
 */
Game_Map.prototype.getRegionSkillsByRegionId = function(regionId)
{
  return this.getRegionSkills()
    .get(regionId) ?? Array.empty;
};

/**
 * Sets the skillIds to the given regionId.
 * @param {number} regionId The regionId to update with new stateIds.
 * @param {RegionSkillData} regionSkillData The new region state data to add to the regionId.
 */
Game_Map.prototype.addRegionSkillDataByRegionId = function(regionId, regionSkillData)
{
  // grab the current tracker.
  const regionSkills = this.getRegionSkills();

  // check if the regionId has yet to be added to the tracker.
  if (!regionSkills.has(regionId))
  {
    // add it with the given stateIds.
    regionSkills.set(regionId, [ regionSkillData ]);
  }
  // the regionId is already being tracked.
  else
  {
    // grab the current stateIds.
    const currentRegionSkillDatas = regionSkills.get(regionId);

    // add the new and the old- they stack if the dev wants them to.
    const newRegionSkillDatas = currentRegionSkillDatas.concat(regionSkillData);

    // reassign the regionId with the added stateIds.
    regionSkills.set(regionId, newRegionSkillDatas);
  }
};
//endregion properties

/**
 * Extends {@link #setup}.<br>
 * Also initializes this map's region-skill data.
 */
J.REGIONS.EXT.SKILLS.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.REGIONS.EXT.SKILLS.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // setup the region state data.
  this.setupRegionSkills();
};

/**
 * Sets up the region skills based on tags for this map.
 */
Game_Map.prototype.setupRegionSkills = function()
{
  // clear the existing states.
  this.clearRegionSkills();

  // refresh the existing states.
  this.refreshRegionSkills();
};

/**
 * Clears all region skills that have been configured for this map.
 */
Game_Map.prototype.clearRegionSkills = function()
{
  // grab the current tracker.
  const regionSkills = this.getRegionSkills();

  // clear all the tracking.
  regionSkills.clear();
};

/**
 * Refreshes the region skills on this map.
 */
Game_Map.prototype.refreshRegionSkills = function()
{
  // if we cannot refresh region effects, we cannot refresh region skills, either.
  if (!this.canRefreshRegionEffects()) return;

  // grab the region data.
  const regionSkillsData = RPGManager.getArraysFromNotesByRegex({ note: this.note() },
    J.REGIONS.EXT.SKILLS.RegExp.RegionSkill,
    true);

  // stop processing if there was nothing found.
  if (!regionSkillsData || !regionSkillsData.length) return;

  // iterate over all the found datas for processing.
  regionSkillsData.forEach(regionSkillData =>
  {
    // deconstruct the data.
    const [ regionId, skillId, chanceOfApplication, casterId, isFriendly ] = regionSkillData;

    // generate the new data based on the tag.
    const newRegionSkillData = new RegionSkillData(regionId, skillId, chanceOfApplication, casterId, isFriendly);

    // add the new data.
    this.addRegionSkillDataByRegionId(regionId, newRegionSkillData);
  });
};
//endregion Game_Map