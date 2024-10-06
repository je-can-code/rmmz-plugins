//region Game_Map
/**
 * Extends {@link #initialize}.<br>
 * Also initializes the region states properties.
 */
J.REGIONS.EXT.STATES.Aliased.Game_Map.set('initialize', Game_Map.prototype.initialize);
Game_Map.prototype.initialize = function()
{
  // perform original logic.
  J.REGIONS.EXT.STATES.Aliased.Game_Map.get('initialize')
    .call(this);

  // initialize the region states.
  this.initRegionStatesMembers();
};

//region properties
/**
 * Initializes all region states properties for the map.
 */
Game_Map.prototype.initRegionStatesMembers = function()
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
   * The grouping of all properties related specifically to the region states extension.
   */
  this._j._regions._states = {};

  /**
   * A map keyed by regionId of all stateIds that are applied while the character is
   * on a tile marked by the keyed regionId.
   * @type {Map<number,RegionStateData[]>}
   */
  this._j._regions._states._map = new Map();
};

/**
 * Gets the dictionary currently tracking the regionId:stateId[] for the map.
 * @return {Map<number,RegionStateData[]>}
 */
Game_Map.prototype.getRegionStates = function()
{
  return this._j._regions._states._map;
};

/**
 * Gets all stateIds to be applied on characters standing on the given regionId.
 * @return {RegionStateData[]}
 */
Game_Map.prototype.getRegionStatesByRegionId = function(regionId)
{
  return this.getRegionStates()
    .get(regionId) ?? Array.empty;
};

/**
 * Sets the stateIds to the given regionId.
 * @param {number} regionId The regionId to update with new stateIds.
 * @param {RegionStateData} regionStateData The new region state data to add to the regionId.
 */
Game_Map.prototype.addRegionStateDataByRegionId = function(regionId, regionStateData)
{
  // grab the current tracker.
  const regionStates = this.getRegionStates();

  // check if the regionId has yet to be added to the tracker.
  if (!regionStates.has(regionId))
  {
    // add it with the given stateIds.
    regionStates.set(regionId, [ regionStateData ]);
  }
  // the regionId is already being tracked.
  else
  {
    // grab the current stateIds.
    const currentRegionStateDatas = regionStates.get(regionId);

    // add the new and the old- they stack if the dev wants them to.
    const newRegionStateDatas = currentRegionStateDatas.concat(regionStateData);

    // reassign the regionId with the added stateIds.
    regionStates.set(regionId, newRegionStateDatas);
  }
};
//endregion properties

/**
 * Extends {@link #setup}.<br>
 * Also initializes this map's region-state data.
 */
J.REGIONS.EXT.STATES.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.REGIONS.EXT.STATES.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // setup the region state data.
  this.setupRegionStates();
};

/**
 * Sets up the region states based on tags for this map.
 */
Game_Map.prototype.setupRegionStates = function()
{
  // clear the existing states.
  this.clearRegionStates();

  // refresh the existing states.
  this.refreshRegionStates();
};

/**
 * Clears all region states that have been configured for this map.
 */
Game_Map.prototype.clearRegionStates = function()
{
  // grab the current tracker.
  const regionStates = this.getRegionStates();

  // clear all the tracking.
  regionStates.clear();
};

/**
 * Refreshes the region states on this map.
 */
Game_Map.prototype.refreshRegionStates = function()
{
  // if we cannot refresh region effects, we cannot refresh region states, either.
  if (!this.canRefreshRegionEffects()) return;

  // grab the region data.
  const regionStatesData = RPGManager.getArraysFromNotesByRegex({ note: this.note() },
    J.REGIONS.EXT.STATES.RegExp.RegionState,
    true);

  // stop processing if there was nothing found.
  if (!regionStatesData || !regionStatesData.length) return;

  // iterate over all the found datas for processing.
  regionStatesData.forEach(regionStateData =>
  {
    // deconstruct the data.
    const [ regionId, stateId, chanceOfApplication, animationId ] = regionStateData;

    // generate the new data based on the tag.
    const newRegionStateData = new RegionStateData(regionId, stateId, chanceOfApplication, animationId);

    // add the new data.
    this.addRegionStateDataByRegionId(regionId, newRegionStateData);
  });
};
//endregion Game_Map