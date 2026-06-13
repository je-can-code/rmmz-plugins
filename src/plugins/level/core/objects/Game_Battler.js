//region Game_Battler
/**
 * The level of this battler.
 *
 * This is the same as `battler.lvl`.
 * @returns {number}
 */
Object.defineProperty(Game_Battler.prototype, 'level', {
  get()
  {
    // get the level from this battler.
    return this.getLevel();
  },

  // sure, lets make this level property configurable.
  configurable: true,
});

/**
 * The level of this battler.
 *
 * This is the same as `battler.level`.
 * @returns {number}
 */
Object.defineProperty(Game_Battler.prototype, 'lvl', {
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
 *
 * Returns the cached value when available; computes and caches on the first call or after
 * {@link #refreshLevel} invalidates the cache via {@link #onBattlerDataChange}.
 * @returns {number}
 */
Game_Battler.prototype.getLevel = function()
{
  if (this._j._level._cachedLevel !== null)
  {
    return this._j._level._cachedLevel;
  }

  const computed = this.computeLevel();
  this._j._level._cachedLevel = computed;
  return computed;
};

/**
 * Computes the level for this battler from all registered sources.
 *
 * Separated from {@link #getLevel} so the cache layer stays clean.
 * Includes a re-entrancy guard for cases where computing the level would
 * otherwise trigger another level computation (e.g. a state whose note
 * calls back into level logic).
 * @returns {number}
 */
Game_Battler.prototype.computeLevel = function()
{
  if (this._j._level._isComputingGetLevel === true)
  {
    return this.getBattlerBaseLevel() + this.getLevelBalancer();
  }

  this._j._level._isComputingGetLevel = true;

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
    this._j._level._isComputingGetLevel = false;
  }
};

/**
 * Invalidates the cached level and immediately re-primes it.
 *
 * Called by {@link #onBattlerDataChange} hooks in both {@link Game_Actor} and
 * {@link Game_Enemy} so that the HUD's per-frame reads of {@link #level} remain O(1).
 */
Game_Battler.prototype.refreshLevel = function()
{
  this._j._level._cachedLevel = null;
  this.getLevel();
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