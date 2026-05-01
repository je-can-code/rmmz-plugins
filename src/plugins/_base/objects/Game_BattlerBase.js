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
 * Gets the sum of deltas above the 1.0 neutral baseline for all traits matching the given
 * code and dataId.  Each trait value is treated as `1.0 + delta`; this method isolates
 * the delta portion and sums them additively.
 *
 * Intended for use with multiplicative-baseline trait families (sparams, element rates) where
 * the default {@link Game_BattlerBase#traitsPi} produces unintuitive compound values when stacking.
 *
 * @param {number} code The trait code (e.g. {@link Game_BattlerBase.TRAIT_SPARAM}).
 * @param {number} id The dataId that further identifies the specific trait.
 * @returns {number} The sum of `(value - 1.0)` for all matching traits.
 */
Game_BattlerBase.prototype.traitsDeltaSum = function(code, id)
{
  return this.traitsWithId(code, id)
    .map(trait => trait.value - 1.0)
    .reduce((total, delta) => total + delta, 0.0);
};

/**
 * Overrides {@link Game_BattlerBase#sparam}.<br>
 * Replaces the default multiplicative aggregation (traitsPi) with additive delta stacking.
 *
 * RMMZ stores sparam trait values as multipliers (1.0 = baseline, 1.5 = +50%).
 * The default engine multiplies them together, so two +50% traits compound to ×2.25 instead
 * of the intuitive ×2.0. This override subtracts the 1.0 baseline from each trait value,
 * sums the deltas, then restores the 1.0 baseline — giving linear, predictable stacking
 * while keeping the 1.0 return value that engine healing/cost/damage formulas expect.
 *
 * @param {number} sparamId The sparam index (0–9).
 * @returns {number} The additively aggregated sparam value.
 */
J.BASE.Aliased.Game_BattlerBase.set('sparam', Game_BattlerBase.prototype.sparam);
Game_BattlerBase.prototype.sparam = function(sparamId)
{
  // additive delta stacking: sum deltas above the 1.0 baseline, then restore the baseline.
  // replaces the default traitsPi which compounded 1.5×1.5 into 2.25 instead of 2.0.
  return 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_SPARAM, sparamId);
};

/**
 * Overrides {@link Game_BattlerBase#elementRate}.<br>
 * Replaces the default multiplicative aggregation (traitsPi) with additive delta stacking.
 *
 * RMMZ stores element rate trait values as multipliers (1.0 = neutral, 1.2 = +20% damage taken).
 * The default engine multiplies them together, so two +20% traits compound to ×1.44 instead of
 * the intuitive ×1.4. This override subtracts the 1.0 baseline from each trait value, sums the
 * deltas, then restores the 1.0 baseline — giving linear, predictable stacking.
 *
 * The result is floored at 0 to prevent negative element rates from inverting damage direction.
 * Absorption is handled separately by J.ELEM and is not affected by this override.
 *
 * @param {number} elementId The element ID to compute the rate for.
 * @returns {number} The additively aggregated element rate, minimum 0.
 */
J.BASE.Aliased.Game_BattlerBase.set('elementRate', Game_BattlerBase.prototype.elementRate);
Game_BattlerBase.prototype.elementRate = function(elementId)
{
  // additive delta stacking: sum deltas above the 1.0 baseline, then restore the baseline.
  // floor at 0 — traits alone cannot invert damage direction; absorption lives in J.ELEM.
  const rate = 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_ELEMENT_RATE, elementId);
  return Math.max(0, rate);
};

/**
 * Overrides {@link Game_BattlerBase#paramRate}.<br>
 * Replaces the default multiplicative aggregation (traitsPi) with additive delta stacking.
 *
 * RMMZ stores param rate trait values as multipliers (1.0 = baseline, 1.5 = +50%).
 * The default engine multiplies them together, so two +50% ATK traits compound to ×2.25 instead
 * of the intuitive ×2.0. This override subtracts the 1.0 baseline from each trait value, sums
 * the deltas, then restores the 1.0 baseline — giving linear, predictable stacking.
 *
 * The result is floored at 0; the engine already enforces a param floor via paramMin(),
 * but keeping the rate non-negative avoids unexpected sign inversions from heavy reductions.
 *
 * @param {number} paramId The param index (0–7).
 * @returns {number} The additively aggregated param rate, minimum 0.
 */
J.BASE.Aliased.Game_BattlerBase.set('paramRate', Game_BattlerBase.prototype.paramRate);
Game_BattlerBase.prototype.paramRate = function(paramId)
{
  // additive delta stacking: sum deltas above the 1.0 baseline, then restore the baseline.
  const rate = 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_PARAM, paramId);
  return Math.max(0, rate);
};

/**
 * Overrides {@link Game_BattlerBase#stateRate}.<br>
 * Replaces the default multiplicative aggregation (traitsPi) with additive delta stacking.
 *
 * RMMZ stores state rate trait values as multipliers (1.0 = neutral, 0.5 = 50% less likely).
 * The default engine multiplies them together, so two 50%-resist traits compound to ×0.25 instead
 * of the intuitive ×0.0 (immunity). This override subtracts the 1.0 baseline from each trait
 * value, sums the deltas, then restores the baseline — giving linear, predictable stacking.
 *
 * The result is floored at 0 so stacked resistances can reach full immunity without going negative.
 *
 * @param {number} stateId The state ID to compute the rate for.
 * @returns {number} The additively aggregated state rate, minimum 0.
 */
J.BASE.Aliased.Game_BattlerBase.set('stateRate', Game_BattlerBase.prototype.stateRate);
Game_BattlerBase.prototype.stateRate = function(stateId)
{
  // additive delta stacking: sum deltas above the 1.0 baseline, then restore the baseline.
  // floor at 0 so full immunity is reachable through trait stacking without going negative.
  const rate = 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_STATE_RATE, stateId);
  return Math.max(0, rate);
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