//region Game_Battler
/**
 * Extends {@link #initMembers}.<br/>
 * Initializes shield parameter caches.
 */
J.ABS.EXT.SHIELD.Aliased.Game_Battler.set('initMembers', Game_Battler.prototype.initMembers);
Game_Battler.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Game_Battler.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * A grouping of all JABS shield extension properties.
   */
  this._j._abs._shield ||= {};

  /**
   * The cached result of {@link #baseSarFactor}.
   * Null when the cache is cold; invalidated by {@link #onBattlerDataChange}.
   * @type {number|null}
   */
  this._j._abs._shield._cachedSarFactor = null;

  /**
   * The cached result of {@link #baseSerFactor}.
   * Null when the cache is cold; invalidated by {@link #onBattlerDataChange}.
   * @type {number|null}
   */
  this._j._abs._shield._cachedSerFactor = null;
};

/**
 * Gets the cached SAR factor for this battler, or null if the cache is cold.
 * @returns {number|null}
 */
Game_Battler.prototype.getCachedSarFactor = function()
{
  return this._j._abs._shield._cachedSarFactor;
};

/**
 * Sets the cached SAR factor for this battler.
 * @param {number|null} value The new cached value, or null to invalidate.
 */
Game_Battler.prototype.setCachedSarFactor = function(value)
{
  this._j._abs._shield._cachedSarFactor = value;
};

/**
 * Gets the cached SER factor for this battler, or null if the cache is cold.
 * @returns {number|null}
 */
Game_Battler.prototype.getCachedSerFactor = function()
{
  return this._j._abs._shield._cachedSerFactor;
};

/**
 * Sets the cached SER factor for this battler.
 * @param {number|null} value The new cached value, or null to invalidate.
 */
Game_Battler.prototype.setCachedSerFactor = function(value)
{
  this._j._abs._shield._cachedSerFactor = value;
};

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Invalidates the SAR and SER factor caches.
 */
J.ABS.EXT.SHIELD.Aliased.Game_Battler.set('onBattlerDataChange', Game_Battler.prototype.onBattlerDataChange);
Game_Battler.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.ABS.EXT.SHIELD.Aliased.Game_Battler.get('onBattlerDataChange')
    .call(this);

  // invalidate the SAR factor cache.
  this.setCachedSarFactor(null);

  // invalidate the SER factor cache.
  this.setCachedSerFactor(null);
};

Object.defineProperties(Game_BattlerBase.prototype, {
  /**
   * Outgoing shield amplification (1.0 = baseline).
   */
  sar: {
    get: function()
    {
      return 1.0;
    },
    configurable: true,
  },

  /**
   * Incoming shield effectiveness (1.0 = baseline).
   */
  ser: {
    get: function()
    {
      return 1.0;
    },
    configurable: true,
  },
});

Object.defineProperty(Game_Battler.prototype, 'sar', {
  get: function()
  {
    let factor = this.baseSarFactor();

    if (this.getSdpBonusForParameterKey)
    {
      factor += this.getSdpBonusForParameterKey('sar', 1);
    }

    return factor;
  },
  configurable: true,
});

Object.defineProperty(Game_Battler.prototype, 'ser', {
  get: function()
  {
    let factor = this.baseSerFactor();

    if (this.getSdpBonusForParameterKey)
    {
      factor += this.getSdpBonusForParameterKey('ser', 1);
    }

    return factor;
  },
  configurable: true,
});

/**
 * Sums `<sar:X>` notetags into a multiplier factor.
 * Result is cached and invalidated by {@link #onBattlerDataChange}.
 * @returns {number}
 */
Game_Battler.prototype.baseSarFactor = function()
{
  // return the cached result if the cache is still warm.
  if (this.getCachedSarFactor() !== null)
  {
    return this.getCachedSarFactor();
  }

  // compute and cache the result.
  const bonus = RPGManager.getSumFromAllNotesByRegex(
    this.getAllNotes(),
    J.ABS.EXT.SHIELD.RegExp.ShieldAmplification
  );
  this.setCachedSarFactor((100 + bonus) / 100);

  return this.getCachedSarFactor();
};

/**
 * Sums `<ser:X>` notetags into a multiplier factor.
 * Result is cached and invalidated by {@link #onBattlerDataChange}.
 * @returns {number}
 */
Game_Battler.prototype.baseSerFactor = function()
{
  // return the cached result if the cache is still warm.
  if (this.getCachedSerFactor() !== null)
  {
    return this.getCachedSerFactor();
  }

  // compute and cache the result.
  const bonus = RPGManager.getSumFromAllNotesByRegex(
    this.getAllNotes(),
    J.ABS.EXT.SHIELD.RegExp.ShieldEffectiveness
  );
  this.setCachedSerFactor((100 + bonus) / 100);

  return this.getCachedSerFactor();
};
//endregion Game_Battler
