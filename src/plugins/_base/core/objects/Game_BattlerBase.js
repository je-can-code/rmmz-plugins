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

  /**
   * The cached equipment contributions for this battler, keyed by `code:dataId`.
   * Null when the cache is cold; each parameter is resolved on first ask and held for the rest of
   * the cycle, because the reads behind it scan note strings once per equipped item.
   * Invalidated by {@link #onBattlerDataChange}.
   * @type {Map<string, {delta: number, local: number}>|null}
   */
  this._j._base._cachedEquipContributions = null;
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
 * Gets the cached equipment contributions for this battler, or null if the cache is cold.
 * @returns {Map<string, {delta: number, local: number}>|null}
 */
Game_BattlerBase.prototype.getCachedEquipContributions = function()
{
  return this._j._base._cachedEquipContributions;
};

/**
 * Sets the cached equipment contributions for this battler.
 * @param {Map<string, {delta: number, local: number}>|null} contributions The new cached value, or null to invalidate.
 */
Game_BattlerBase.prototype.setCachedEquipContributions = function(contributions)
{
  this._j._base._cachedEquipContributions = contributions;
};

/**
 * The trait sources on this battler whose parameter percentages apply only to themselves.
 *
 * Equipment is the one kind of trait source that is a discrete object the player swaps in and out, so a
 * percentage on it describes the item rather than its wearer. Battlers with no equipment answer with
 * nothing, which makes every localisation formula below a no-op for them rather than a special case.
 * @returns {RPG_EquipItem[]}
 */
Game_BattlerBase.prototype.localisedEquips = function()
{
  return Array.empty;
};

/**
 * What equipment contributes to a parameter, split into the share to remove from the battler-wide
 * aggregate and the share to re-apply locally.
 *
 * Cached per parameter for the rest of the data-change cycle, because the reads behind it scan a note
 * string once per equipped item and parameters are asked for during damage resolution and once per row
 * of every parameter catalog refresh.
 * @param {number} code The trait code: 21, 22, or 23.
 * @param {number} dataId The parameter id within that family.
 * @returns {{delta: number, local: number}}
 */
Game_BattlerBase.prototype.equipParameterContribution = function(code, dataId)
{
  // warm the cache on first use this cycle; the cold value is null, as with every other cache here.
  if (this.getCachedEquipContributions() === null)
  {
    this.setCachedEquipContributions(new Map());
  }

  const cache = this.getCachedEquipContributions();
  const key = `${code}:${dataId}`;

  // return the cached result if this parameter was already resolved this cycle.
  if (cache.has(key)) return cache.get(key);

  cache.set(key, this.buildEquipParameterContribution(code, dataId));

  return cache.get(key);
};

/**
 * Computes equipment's contribution to one parameter from scratch.
 *
 * `delta` is what equipment contributed to the battler-wide total, in that family's own units, and gets
 * subtracted back out. `local` is each item's own base for the parameter amplified by that same item's
 * own percentages. Both are expressed through {@link RPG_EquipItem#ownRate}, which normalises all three
 * families onto one 1.0-centred multiplier so a single subtraction serves each of them.
 *
 * `local` is always zero for base parameters — {@link Game_Actor#paramPlus} owns their local half, since
 * those are the one family with an existing field to scale.
 *
 * Tags are authored as whole percents while the engine works in rate space, hence the hundredth - the
 * same conversion J-NaturalGrowths applies to its own growth tags.
 *
 * Separated from the caching wrapper above so the arithmetic can be read and tested without the cache in
 * the way, mirroring how {@link #buildTraitObjects} sits behind {@link #traitObjects}.
 * @param {number} code The trait code: 21, 22, or 23.
 * @param {number} dataId The parameter id within that family.
 * @returns {{delta: number, local: number}}
 */
Game_BattlerBase.prototype.buildEquipParameterContribution = function(code, dataId)
{
  let delta = 0.0;
  let local = 0.0;

  this.localisedEquips()
    .forEach(equip =>
    {
      const ownRate = equip.ownRate(code, dataId);
      delta += (ownRate - 1);

      // base parameters already have somewhere to be added: paramPlus scales each item's `params` entry
      // against this same rate. So there is no base to read here, and reading one would mean asking for
      // an sp-parameter with a base-parameter id - a number nobody authored and nothing consumes.
      if (code === Game_BattlerBase.TRAIT_PARAM) return;

      const base = code === Game_BattlerBase.TRAIT_XPARAM
        ? equip.thisXParam(dataId)
        : equip.thisSParam(dataId);

      local += ((base / 100) * ownRate);
    });

  return {
    delta,
    local,
  };
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
  const { delta, local } = this.equipParameterContribution(Game_BattlerBase.TRAIT_SPARAM, sparamId);

  // additive delta stacking: sum deltas above the 1.0 baseline, then restore the baseline.
  // replaces the default traitsPi which compounded 1.5×1.5 into 2.25 instead of 2.0.
  // equipment's share is removed here and re-applied against each item's own base below.
  const global = 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_SPARAM, sparamId) - delta;

  return global + local;
};

/**
 * Overwrites {@link Game_BattlerBase#xparam}.<br/>
 * Scopes each equipped item's percentages to that item's own base rather than the battler's total.
 *
 * Vanilla aggregation is already additive here, so nothing about the stacking changes. What changes is
 * whose value a percentage on a sword is a percentage *of*: previously the wearer's whole accuracy, now
 * the sword's. Equipment's share is subtracted from the battler-wide sum and re-applied per item.
 * @param {number} xparamId The xparam index (0-9).
 * @returns {number}
 */
J.BASE.Aliased.Game_BattlerBase.set('xparam', Game_BattlerBase.prototype.xparam);
Game_BattlerBase.prototype.xparam = function(xparamId)
{
  // perform original logic.
  const global = J.BASE.Aliased.Game_BattlerBase.get('xparam')
    .call(this, xparamId);

  const { delta, local } = this.equipParameterContribution(Game_BattlerBase.TRAIT_XPARAM, xparamId);

  return (global - delta) + local;
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
  const { delta } = this.equipParameterContribution(Game_BattlerBase.TRAIT_PARAM, paramId);

  // additive delta stacking: sum deltas above the 1.0 baseline, then restore the baseline.
  // equipment's share is removed here; it reappears in paramPlus scaled against each item's own value,
  // so a percentage on a sword lifts the sword rather than the whole battler.
  const rate = 1.0 + this.traitsDeltaSum(Game_BattlerBase.TRAIT_PARAM, paramId) - delta;
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