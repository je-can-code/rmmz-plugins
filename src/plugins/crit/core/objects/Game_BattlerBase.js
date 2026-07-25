//region Game_BattlerBase
// add our new critical-related parameters to all battlers.
Object.defineProperties(Game_BattlerBase.prototype, {
  /**
   * The battler's critical damage multiplier.
   * Critical hits are multiplied by this amount to determine the total critical hit damage.
   * @type {number}
   */
  cdm: {
    get: function()
    {
      return this.criticalDamageMultiplier();
    },
    configurable: true
  },

  /**
   * The battler's critical taken rate.
   * Critical hit damage is reduced by this percent before being applied.
   * @type {number}
   */
  ctr: {
    get: function()
    {
      return this.criticalDamageReduction();
    },
    configurable: true
  },
});

/**
 * The base critical damage multiplier.
 * A battler's critical damage multiplier acts as the base bonus multiplier for all
 * critical hits. The individual battler's `cdm` is added to this amount to calculate
 * the damage a critical hit can potentially deal.
 * Sourced from the plugin parameter so designers can retune the default without
 * touching code- see {@link J_CriticalFactorsPluginMetadata#baseCdmFactor}.
 * @returns {number} The base multiplier for this battler.
 */
Game_BattlerBase.prototype.baseCriticalMultiplier = function()
{
  return J.CRIT.Metadata.baseCdmFactor;
};

/**
 * Gets the multiplier for this battler's critical hits.
 * @returns {number}
 */
Game_BattlerBase.prototype.criticalDamageMultiplier = function()
{
  return 0.0;
};

/**
 * The base critical taken rate.
 * A battler's critical taken rate acts as the base crit reduction for all incoming
 * critical hits. The individual battler's `ctr` is added to this amount to calculate
 * the damage a critical hit can potentially deal.
 * Sourced from the plugin parameter so designers can retune the default without
 * touching code- see {@link J_CriticalFactorsPluginMetadata#baseCtrFactor}.
 * @returns {number} The base reduction for this battler.
 */
Game_BattlerBase.prototype.baseCriticalReduction = function()
{
  return J.CRIT.Metadata.baseCtrFactor;
};

/**
 * Gets the reduction factor for when this battler receives a critical hit.
 * @returns {number}
 */
Game_BattlerBase.prototype.criticalDamageReduction = function()
{
  return 0.0;
};
//endregion Game_BattlerBase