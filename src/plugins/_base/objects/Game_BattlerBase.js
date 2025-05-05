//region Game_BattlerBase
/**
 * Returns a list of known base parameter ids.
 * @returns {number[]}
 */
Game_BattlerBase.knownBaseParameterIds = function()
{
  return [ 0, 1, 2, 3, 4, 5, 6, 7 ];
};

/**
 * Returns a list of known ex-parameter ids.
 * @returns {number[]}
 */
Game_BattlerBase.knownExParameterIds = function()
{
  return [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
};

/**
 * Returns a list of known sp-parameter ids.
 * @returns {number[]}
 */
Game_BattlerBase.knownSpParameterIds = function()
{
  return [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
};

/**
 * Whether or not the given long-parameter id is a known base parameter.
 * @param {number} longParameterId The long-parameter id to validate.
 * @returns {boolean}
 */
Game_BattlerBase.isBaseParam = function(longParameterId)
{
  return this.knownBaseParameterIds()
    .includes(longParameterId);
};

/**
 * Whether or not the given long-parameter id is a known ex parameter.
 * @param {number} longParameterId The long-parameter id to validate.
 * @returns {boolean}
 */
Game_BattlerBase.isExParam = function(longParameterId)
{
  return this.knownExParameterIds()
    .includes(longParameterId - 8);
};

/**
 * Whether or not the given long-parameter id is a known sp parameter.
 * @param {number} longParameterId The long-parameter id to validate.
 * @returns {boolean}
 */
Game_BattlerBase.isSpParam = function(longParameterId)
{
  return this.knownSpParameterIds()
    .includes(longParameterId - 18);
};

/**
 * Whether or not the given ex-parameter id is a known parameter.
 * Use {@link #isRegenLongParamId} for long-parameter ids.
 * @param {number} paramId The ex-parameter id to validate.
 * @returns {boolean}
 */
Game_BattlerBase.isRegenParamId = function(paramId)
{
  const regenParamIds = [ 7, 8, 9 ];
  return regenParamIds.includes(paramId);
};

/**
 * Whether or not the given long-parameter id is a known parameter.
 * Use {@link #isRegenParamId} for ex-parameter ids.
 * @param {number} longParamId The long-parameter id to validate.
 * @returns {boolean}
 */
Game_BattlerBase.isRegenLongParamId = function(longParamId)
{
  const regenParamIds = [ 7, 8, 9 ];
  return regenParamIds.includes(longParamId - 8);
};

/**
 * Gets the maximum tp/tech for this battler.
 */
Object.defineProperty(Game_BattlerBase.prototype, "mtp", {
  get: function()
  {
    return this.maxTp();
  },
  configurable: true
});
//endregion Game_BattlerBase