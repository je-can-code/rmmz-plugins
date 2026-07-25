//region Game_BattlerBase
/**
 * The battler's cooldown reduction rate in percent-point space.
 * A value of 15 means GCD is reduced to 85% of its base duration.
 * Baseline is 0 (no reduction); reaching 100 eliminates the GCD entirely.
 * @type {number}
 */
Object.defineProperty(Game_BattlerBase.prototype, 'cdr', {
  get: function()
  {
    return this.globalCooldownReduction();
  },
  configurable: true,
});

/**
 * Gets this battler's global cooldown reduction in percent-point space.
 * @returns {number}
 */
Game_BattlerBase.prototype.globalCooldownReduction = function()
{
  return 0;
};

/**
 * The battler's parry extension rate in percent-point space.
 * A value of 50 means the precise-parry window is extended to 150% of its base duration.
 * Baseline is 0 (no extension).
 * @type {number}
 */
Object.defineProperty(Game_BattlerBase.prototype, 'per', {
  get: function()
  {
    return this.parryExtensionRate();
  },
  configurable: true,
});

/**
 * Gets this battler's parry extension rate in percent-point space.
 * @returns {number}
 */
Game_BattlerBase.prototype.parryExtensionRate = function()
{
  return 0;
};
//endregion Game_BattlerBase
