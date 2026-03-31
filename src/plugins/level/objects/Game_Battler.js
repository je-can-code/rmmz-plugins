//region Game_Battler
/**
 * Generates the "level" property for all battlers, along with
 * a new function to calculate level retrieval.
 *
 * This is the same as `battler.lvl`.
 * @returns {number}
 */
Object.defineProperty(Game_Battler.prototype, "level", {
  get()
  {
    // get the level from this battler.
    return this.getLevel();
  },

  // sure, lets make this level property configurable.
  configurable: true,
});

/**
 * Generates the "lvl" property for all battlers, along with
 * a new function to calculate level retrieval.
 *
 * This is the same as `battler.level`.
 * @returns {number}
 */
Object.defineProperty(Game_Battler.prototype, "lvl", {
  get()
  {
    // get the level from this battler.
    return this.getLevel();
  },

  // sure, lets make this level property configurable.
  configurable: true,
});

/**
 * Gets the level for this battler.
 * @returns {number}
 */
Game_Battler.prototype.getLevel = function()
{
  this._j ||= {};
  this._j._level ||= {};

  const levelSlot = this._j._level;

  if (levelSlot._isComputingGetLevel === true)
  {
    return this.getBattlerBaseLevel() + this.getLevelBalancer();
  }

  levelSlot._isComputingGetLevel = true;

  try
  {
    const sources = this.getLevelSources();
    let level = this.getBattlerBaseLevel();
    level += this.getLevelBalancer();

    sources.forEach(rpgData =>
    {
      level += this.extractLevel(rpgData);
    }, this);

    return level;
  }
  finally
  {
    levelSlot._isComputingGetLevel = false;
  }
};

/**
 * Gets all database sources we can get levels from.
 * @returns {RPG_BaseItem[]}
 */
Game_Battler.prototype.getLevelSources = function()
{
  // our sources of data that a level can be retrieved from.
  return [];
};

/**
 * The base or default level for this battler.
 * @returns {number}
 */
Game_Battler.prototype.getBattlerBaseLevel = function()
{
  return 0;
};

/**
 * The variable level modifier for this battler.
 * @returns {number}
 */
Game_Battler.prototype.getLevelBalancer = function()
{
  return 0;
};

/**
 * Extracts the level from a given source's note data.
 * @param {RPG_BaseItem} rpgData The database object to extract level from.
 */
Game_Battler.prototype.extractLevel = function(rpgData)
{
  // extract the level from the notes.
  return RPGManager.getNumberFromNoteByRegex(rpgData, J.LEVEL.RegExp.Level);
};
//endregion Game_Battler