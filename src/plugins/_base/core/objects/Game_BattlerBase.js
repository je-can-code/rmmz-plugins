//region Game_BattlerBase
/**
 * Extends {@link #initMembers}.<br/>
 * Initializes the trait objects cache for this battler.
 */
J.BASE.Aliased.Game_BattlerBase.set('initMembers', Game_BattlerBase.prototype.initMembers);
Game_BattlerBase.prototype.initMembers = function()
{
  // perform original logic.
  J.BASE.Aliased.Game_BattlerBase.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the base plugin.
   */
  this._j._base ||= {};

  /**
   * The cached result of {@link #buildTraitObjects} for this battler.
   * Null when the cache is cold; populated on the first {@link #traitObjects} call after
   * construction or after {@link #onBattlerDataChange} invalidates it.
   * @type {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]|null}
   */
  this._j._base._cachedTraitObjects = null;

  /**
   * The cached result of {@link #allTraits} for this battler.
   * Null when the cache is cold; populated on the first {@link #allTraits} call after
   * construction or after {@link #onBattlerDataChange} invalidates it.
   * Every downstream trait query ({@link #traits}, {@link #traitsWithId}, {@link #traitsPi},
   * {@link #traitsDeltaSum}, {@link #traitsSum}) benefits automatically.
   * @type {MV.Trait[]|null}
   */
  this._j._base._cachedAllTraits = null;
};

/**
 * Gets the cached trait objects for this battler, or null if the cache is cold.
 * @returns {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]|null}
 */
Game_BattlerBase.prototype.getCachedTraitObjects = function()
{
  return this._j._base._cachedTraitObjects;
};

/**
 * Sets the cached trait objects for this battler.
 * @param {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]|null} traitObjects The new cached value, or null to invalidate.
 */
Game_BattlerBase.prototype.setCachedTraitObjects = function(traitObjects)
{
  this._j._base._cachedTraitObjects = traitObjects;
};

/**
 * Gets all objects that bear traits for this battler.
 *
 * The result is cached and shared across all callers within a single data-change cycle.
 * The cache is invalidated by {@link #onBattlerDataChange}, which fires whenever states,
 * equipment, skills, or any other trait-bearing data changes on this battler.
 *
 * Subclasses define their full trait object list via {@link #buildTraitObjects} rather than
 * pushing into the returned array — this keeps the cache safe from accidental mutation.
 * @returns {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]}
 */
Game_BattlerBase.prototype.traitObjects = function()
{
  // return the cached result if the cache is still warm.
  if (this.getCachedTraitObjects() !== null)
  {
    return this.getCachedTraitObjects();
  }

  // build the trait objects collection and cache it for all subsequent callers this cycle.
  this.setCachedTraitObjects(this.buildTraitObjects());

  return this.getCachedTraitObjects();
};

/**
 * Builds the complete list of objects that bear traits for this battler.
 *
 * This is the extension point for subclasses — override this instead of {@link #traitObjects}
 * so the cache layer in {@link #traitObjects} remains intact. Return a fresh array each call;
 * never mutate the result of a super call.
 * @returns {(RPG_Actor|RPG_Enemy|RPG_Class|RPG_Skill|RPG_EquipItem|RPG_State)[]}
 */
Game_BattlerBase.prototype.buildTraitObjects = function()
{
  // states are the only trait-bearing sources at the base battler level.
  return [ ...this.states() ];
};

/**
 * Gets the cached flat trait list for this battler, or null if the cache is cold.
 * @returns {MV.Trait[]|null}
 */
Game_BattlerBase.prototype.getCachedAllTraits = function()
{
  return this._j._base._cachedAllTraits;
};

/**
 * Sets the cached flat trait list for this battler.
 * @param {MV.Trait[]|null} allTraits The new cached value, or null to invalidate.
 */
Game_BattlerBase.prototype.setCachedAllTraits = function(allTraits)
{
  this._j._base._cachedAllTraits = allTraits;
};

/**
 * Gets the flat list of all traits from all trait-bearing objects for this battler.
 *
 * The result is cached and shared across all callers within a single data-change cycle.
 * Every downstream trait query — {@link #traits}, {@link #traitsWithId}, {@link #traitsPi},
 * {@link #traitsDeltaSum}, {@link #traitsSum} — benefits automatically since they all
 * call this method first.
 *
 * The cache is invalidated by {@link #onBattlerDataChange}.
 * @returns {MV.Trait[]}
 */
Game_BattlerBase.prototype.allTraits = function()
{
  // return the cached result if the cache is still warm.
  if (this.getCachedAllTraits() !== null)
  {
    return this.getCachedAllTraits();
  }

  // flatten all traits from all trait-bearing objects and cache the result.
  const allTraits = this.traitObjects()
    .reduce((r, obj) => r.concat(obj.traits), []);

  this.setCachedAllTraits(allTraits);

  return this.getCachedAllTraits();
};

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
 * Overwrites {@link Game_BattlerBase#sparam}.<br/>
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
 * Overwrites {@link Game_BattlerBase#elementRate}.<br/>
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
 * Overwrites {@link Game_BattlerBase#paramRate}.<br/>
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
 * Overwrites {@link Game_BattlerBase#stateRate}.<br/>
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

/**
 * Magic reflect rate — negative values are meaningless, so floor at zero for combat and UI.
 */
Object.defineProperty(Game_BattlerBase.prototype, 'mrf', {
  get: function()
  {
    return Math.max(0, this.xparam(5));
  },
  configurable: true,
});

/**
 * Counter rate — negative values are meaningless, so floor at zero for combat and UI.
 */
Object.defineProperty(Game_BattlerBase.prototype, 'cnt', {
  get: function()
  {
    return Math.max(0, this.xparam(6));
  },
  configurable: true,
});

/**
 * Mp cost rate — negative values would let skillMpCost() go negative, which paySkillCost()
 * would then treat as a free MP refund on cast. Floor at zero to prevent that.
 */
Object.defineProperty(Game_BattlerBase.prototype, 'mcr', {
  get: function()
  {
    return Math.max(0, this.sparam(4));
  },
  configurable: true,
});

/**
 * Tp charge rate — negative values would let TP gain from damage/items go negative, silently
 * draining TP instead of charging it. Floor at zero.
 */
Object.defineProperty(Game_BattlerBase.prototype, 'tcr', {
  get: function()
  {
    return Math.max(0, this.sparam(5));
  },
  configurable: true,
});
//endregion Game_BattlerBase