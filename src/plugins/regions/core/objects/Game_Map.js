//region Game_Map
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the region effects properties.
 */
J.REGIONS.Aliased.Game_Map.set('initMembers', Game_Map.prototype.initMembers);
Game_Map.prototype.initMembers = function()
{
  // perform original logic.
  J.REGIONS.Aliased.Game_Map.get('initMembers')
    .call(this);

  // initialize the region effects.
  this.initRegionEffectsMembers();
};

//region properties
/**
 * Initializes all region effects properties for the map.
 */
Game_Map.prototype.initRegionEffectsMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The grouping of all properties related to region effects.
   */
  this._j._regions = {};

  /**
   * The collection of region ids that deny passage.
   * @type {number[]}
   */
  this._j._regions._deny = Array.empty;

  /**
   * The collection of region ids that allow passage.
   * @type {number[]}
   */
  this._j._regions._allow = Array.empty;
};

//region allow
/**
 * Get the collection of passage-allowing region ids.
 * @returns {number[]}
 */
Game_Map.prototype.getAllowEffectRegionIds = function()
{
  return this._j._regions._allow;
};

/**
 * Adds the region id to the list of passage-allowing ids.
 * @param {number} allowRegionId The region id to add.
 */
Game_Map.prototype.addAllowEffectRegionId = function(allowRegionId)
{
  // grab the current collection of region ids.
  const allowRegionIds = this.getAllowEffectRegionIds();

  // if this id is already being tracked, don't track it again.
  if (allowRegionIds.includes(allowRegionId)) return;

  // track this region id.
  allowRegionIds.push(allowRegionId);
};

/**
 * Clears the region ids for allowing passage from this map.
 */
Game_Map.prototype.clearAllowEffectRegionIds = function()
{
  this._j._regions._allow = Array.empty;
};
//endregion allow

//region deny
/**
 * Get the collection of passage-denying region ids.
 * @returns {number[]}
 */
Game_Map.prototype.getDenyEffectRegionIds = function()
{
  return this._j._regions._deny;
};

/**
 * Adds the region id to the list of passage-denying ids.
 * @param {number} denyRegionId The region id to add.
 */
Game_Map.prototype.addDenyEffectRegionId = function(denyRegionId)
{
  // grab the current collection of region ids.
  const denyRegionIds = this.getDenyEffectRegionIds();

  // if this id is already being tracked, don't track it again.
  if (denyRegionIds.includes(denyRegionId)) return;

  // track this region id.
  denyRegionIds.push(denyRegionId);
};

/**
 * Clears the region ids for denying passage from this map.
 */
Game_Map.prototype.clearDenyEffectRegionIds = function()
{
  this._j._regions._deny = Array.empty;
};
//endregion deny
//endregion properties

/**
 * Extends {@link #setup}.<br/>
 * Also initializes this map's allow/deny region ids.
 */
J.REGIONS.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.REGIONS.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // setup all region effects.
  this.setupRegionEffects();
};

/**
 * Sets up the region effects based on tags for this map.
 */
Game_Map.prototype.setupRegionEffects = function()
{
  // clear the existing effects.
  this.clearRegionEffects();

  // refresh for new effects.
  this.refreshRegionEffects();
};

/**
 * Clears all region effects from cache.
 */
Game_Map.prototype.clearRegionEffects = function()
{
  this.clearAllowEffectRegionIds();
  this.clearDenyEffectRegionIds();
};

/**
 * Refreshes all region effects and stores them in the cache.
 */
Game_Map.prototype.refreshRegionEffects = function()
{
  // if we cannot refresh right now, then do not.
  if (!this.canRefreshRegionEffects()) return;

  // refresh the region effects.
  this.refreshAllowRegionEffects();
  this.refreshDenyRegionEffects();

  // rebuild the pixel collision table after region effects are refreshed.
  if (globalThis.PIXEL_CollisionManager)
  {
    PIXEL_CollisionManager.setupCollision();
  }
};

/**
 * Determines whether or not the region effects can be refreshed.
 * @returns {boolean}
 */
Game_Map.prototype.canRefreshRegionEffects = function()
{
  // if there is no datamap, then we cannot refresh.
  if (!$dataMap) return false;

  // refresh the regions!
  return true;
};

/**
 * Refreshes the allow region effects for the map.
 */
Game_Map.prototype.refreshAllowRegionEffects = function()
{
  // grab the regions.
  const allowedRegions = RPGManager.getArrayFromNotesByRegex({ note: this.note() }, J.REGIONS.RegExp.AllowRegions)

  // add each of the regions found to the list for this map.
  allowedRegions.forEach(this.addAllowEffectRegionId, this);
};

/**
 * Refreshes the deny region effects for the map.
 */
Game_Map.prototype.refreshDenyRegionEffects = function()
{
  // grab the regions.
  const deniedRegions = RPGManager.getArrayFromNotesByRegex({ note: this.note() }, J.REGIONS.RegExp.DenyRegions)

  // add each of the regions found to the list for this map.
  deniedRegions.forEach(this.addDenyEffectRegionId, this);
};

/**
 * Extends {@link #isPassable}.<br/>
 * Also considers region effects for passability.
 */
J.REGIONS.Aliased.Game_Map.set('isPassable', Game_Map.prototype.isPassable);
Game_Map.prototype.isPassable = function(x, y, d)
{
  // project the coordinates.
  const [ projectedX, projectedY ] = this.projectCoordinatesByDirection(x, y, d);

  // grab the current region id of the projected coordinates.
  const regionId = this.regionId(projectedX, projectedY);

  // check if we're blocked by a region for that tile.
  if (this.isDenyRegionId(regionId))
  {
    // can't pass through region-restricted tiles.
    return false;
  }

  // check if we're permitted by a region for that tile.
  if (this.isAllowRegionId(regionId))
  {
    // always pass through region-permitted tiles.
    return true;
  }

  // if we reached here, then perform original logic and return that value.
  return J.REGIONS.Aliased.Game_Map.get('isPassable')
    .call(this, x, y, d);
};

/**
 * Overwrites {@link #checkPassage}.<br/>
 * Also refuses passage over any tile carrying a globally-denied terrain tag.
 *
 * Vanilla decides passability from the tileset's direction bits alone, which leaves no way to say
 * "this tile is scenery" for something drawn on an otherwise walkable layer- ceilings and cliff
 * faces being the usual offenders. Terrain tags already mark those on the tileset, so honoring them
 * here blocks the whole family across every map at once, and it stops forced displacement such as
 * knockback from parking a battler somewhere unreachable.
 * @param {number} x The `x` coordinate.
 * @param {number} y The `y` coordinate.
 * @param {number} bit The bitwise operator being checked.
 * @returns {boolean} True if the tile can be walked on, false otherwise.
 */
Game_Map.prototype.checkPassage = function(x, y, bit)
{
  // grab all the flags for the tileset.
  const flags = this.tilesetFlags();

  // grab all the tiles available at the designated location.
  const tiles = this.allTiles(x, y);

  // grab the terrain tags that are impassable everywhere.
  const deniedTerrainTags = J.REGIONS.Metadata.globalDenyTerrainTags;

  // iterate over each tile represented at these coordinates.
  for (const tile of tiles)
  {
    // grab the flag for this tile.
    const flag = flags[tile];

    // represents [*] No effect on passage.
    if ((flag & 0x10) !== 0)
    {
      continue;
    }

    // a denied terrain tag blocks passage regardless of the direction bits beneath it.
    if (deniedTerrainTags.includes(flag >> 12))
    {
      return false;
    }

    // represents [o] Passable.
    if ((flag & bit) === 0)
    {
      return true;
    }

    // represents [x] Impassable.
    if ((flag & bit) === bit)
    {
      return false;
    }
  }

  // this tile cannot be passed.
  return false;
};

/**
 * Determines whether or not the given region id is a deny region id.
 * @param {number} regionId The given region id.
 * @returns {boolean} True if the region id will deny passage, false otherwise.
 */
Game_Map.prototype.isDenyRegionId = function(regionId)
{
  // grab the global region ids.
  const globalDenyRegionIds = J.REGIONS.Metadata.globalDenyRegions;

  // grab the region ids.
  const currentDenyRegionIds = this.getDenyEffectRegionIds();

  // combine all region ids.
  const allDenyRegionIds = globalDenyRegionIds.concat(currentDenyRegionIds);

  // check if the given id is included.
  const isDenied = allDenyRegionIds.includes(regionId);

  // return what we found.
  return isDenied;
};

/**
 * Determines whether or not the given region id is an allow region id.
 * @param {number} regionId The given region id.
 * @returns {boolean} True if the region id will allow passage, false otherwise.
 */
Game_Map.prototype.isAllowRegionId = function(regionId)
{
  // grab the global region ids.
  const globalAllowRegionIds = J.REGIONS.Metadata.globalAllowRegions;

  // grab this map's region ids.
  const currentAllowRegionIds = this.getAllowEffectRegionIds();

  // combine all region ids.
  const allAllowRegionIds = globalAllowRegionIds.concat(currentAllowRegionIds);

  // check if the given id is included.
  const isAllowed = allAllowRegionIds.includes(regionId);

  // return what we found.
  return isAllowed;
};

/**
 * Calculates the coordinates of where the player will step next based on their
 * current location and trajectory.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @param {number} d The direction faced.
 * @returns {[number, number]} An array of the projected x and y coordinates.
 */
Game_Map.prototype.projectCoordinatesByDirection = function(x, y, d)
{
  // default the projected coordinates to the current.
  let projectedX = x;
  let projectedY = y;

  // pivot on the direction headed, projecting exactly one tile in that direction.
  switch (d)
  {
    case 2:
      projectedY += 1;
      break;
    case 4:
      projectedX -= 1;
      break;
    case 6:
      projectedX += 1;
      break;
    case 8:
      projectedY -= 1;
      break;
  }

  // return the projected results.
  return [ projectedX, projectedY ];
};
//endregion Game_Map