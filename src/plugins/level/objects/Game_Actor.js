//region Game_Actor
/**
 * Extends {@link #initMembers}.<br>
 * Also initializes this plugin's members.
 */
J.LEVEL.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Actor.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._level ||= {};

  /**
   * The calculated max level of this actor.
   * @type {number}
   */
  this._j._level._realMaxLevel = J_LevelPluginMetadata.EditorMaxLevel;
};

Game_Actor.prototype.getRealMaxLevel = function()
{
  return this._j._level._realMaxLevel;
};

Game_Actor.prototype.setRealMaxLevel = function(newRealLevel)
{
  this._j._level._realMaxLevel = newRealLevel;
};

J.LEVEL.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_Actor.get('onBattlerDataChange')
    .call(this);

  this.updateRealMaxLevel();
};

Game_Actor.prototype.updateRealMaxLevel = function()
{
  const newMaxLevel = this.calculateRealMaxLevel();
  this.setRealMaxLevel(newMaxLevel);
};

Game_Actor.prototype.calculateRealMaxLevel = function()
{
  // grab the defined max level for this actor.
  const baseMaxLevel = this.baseMaxLevel();

  // grab the boosts to max level found across the actor.
  const maxLevelBoosts = this.maxLevelBoost();

  // if there are no boosts, then don't do any unnecessary math.
  if (maxLevelBoosts === 0) return baseMaxLevel;

  // sum the two max levels together.
  const maxLevelSum = baseMaxLevel + maxLevelBoosts;

  // can't be higher level than the defined cap.
  const cappedMaxLevel = Math.min(maxLevelSum, J.LEVEL.Metadata.trueMaxLevel);

  // have to be at least level 1.
  const normalizedMaxLevel = Math.max(cappedMaxLevel, 1);

  // return the overall normalized max level.
  return normalizedMaxLevel;
};

/**
 * Overrides {@link #maxLevel}.<br/>
 * Recalculates the max level based on the possibility of a modified max level.
 * @returns {number}
 */
Game_Actor.prototype.maxLevel = function()
{
  return this.getRealMaxLevel();
};

/**
 * Gets the max level boost from all available notes for this battler.
 * @returns {number|null}
 */
Game_Actor.prototype.maxLevelBoost = function()
{
  return RPGManager.getSumFromAllNotesByRegex(this.getAllNotes(), J.LEVEL.RegExp.MaxLevelBoost);
};

/**
 * The base max level for a given actor. If it is set below 99 in the database, it'll just be that value. If it is set
 * to 99, then it'll return what is defined in the plugin parameters.
 * @returns {number}
 */
Game_Actor.prototype.baseMaxLevel = function()
{
  // if the actor has less than 99, then obey their max level settings.
  if (this.actor().maxLevel < 99) return this.actor().maxLevel;

  // return our defined beyond max level.
  return J.LEVEL.Metadata.defaultBeyondMaxLevel;
};

/**
 * Overrides {@link #paramBase}.<br/>
 * Potentially fetches "beyond max data" for when ones level is beyond the editor max of 99.
 * @param {number} paramId The paramId to fetch the data for.
 * @returns {number}
 */
Game_Actor.prototype.paramBase = function(paramId)
{
  // TODO: use the calculated "getLevel()" instead after some sort of optimizations?
  const level = this._level;

  // check if the level is still within database norms.
  if (level <= J_LevelPluginMetadata.EditorMaxLevel)
  {
    // just return the regular database parameter.
    return this.currentClass().params[paramId][level];
  }

  // check if the cache has already been built for beyond max data.
  if ($gameTemp.hasCachedBeyondMaxData() === false)
  {
    // build it!
    $gameTemp.buildBeyondMaxData();
  }

  // grab the beyond max data instead.
  const params = $gameTemp.getBeyondMaxData(this.currentClass().id);
  return params[paramId][level];
};

/**
 * The base or default level for this battler.
 * Actors have a level tracker, so we'll use that for the base.
 * @returns {number}
 */
Game_Actor.prototype.getBattlerBaseLevel = function()
{
  return this._level;
};

/**
 * Gets all database sources we can get levels from.
 * @returns {RPG_BaseItem[]}
 */
Game_Actor.prototype.getLevelSources = function()
{
  // our sources of data that a level can be retrieved from.
  return [
    // add the actor/enemy to the source list.
    this.databaseData(),

    // add all actor equipment to the source list.
    ...this.equips(),

    // add all currently applied states to the source list.
    ...this.allStates(), ];
};

/**
 * The variable level modifier for this actor.
 * @returns {number}
 */
Game_Actor.prototype.getLevelBalancer = function()
{
  // check if we have a variable set for the fixed balancing.
  if (J.LEVEL.Metadata.actorBalanceVariable)
  {
    // return the adjustment from the variable value instead.
    return $gameVariables.value(J.LEVEL.Metadata.actorBalanceVariable);
  }

  // we don't have any balancing required.
  return 0;
};
//endregion Game_Actor