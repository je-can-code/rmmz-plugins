//region Game_Actor
Object.defineProperties(Game_BattlerBase.prototype, {
  /**
   * Gold drop rate multiplier bonus.
   */
  gdr: {
    get: function()
    {
      return 0;
    },
    configurable: true,
  },

  /**
   * Item drop rate multiplier bonus.
   */
  dor: {
    get: function()
    {
      return 0;
    },
    configurable: true,
  },
});

Object.defineProperty(Game_Actor.prototype, 'gdr', {
  get: function()
  {
    return this.getGoldMultiplier();
  },
  configurable: true,
});

Object.defineProperty(Game_Actor.prototype, 'dor', {
  get: function()
  {
    return this.getDropMultiplierBonus();
  },
  configurable: true,
});

/**
 * Gets this actor's bonus drop multiplier.
 * @returns {number}
 */
/**
 * Assembles a reward multiplier factor from this actor's notes and SDP panels.
 * Both contributions are expressed in percent-points and are summed before being scaled down
 * into the factor callers multiply by, so a notetag granting 20 and a panel granting 5 together
 * produce a factor of 0.25 rather than two separately-rounded factors.
 * @param {RegExp} structure The notetag structure carrying the multiplier.
 * @param {string} parameterKey The SDP parameter key contributing to the same multiplier.
 * @returns {number} The assembled multiplier factor.
 */
Game_Actor.prototype.rewardMultiplierFactor = function(structure, parameterKey)
{
  // define the base multiplier.
  const baseMultiplier = 0;

  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // get the multiplier from anything this battler has available.
  const multiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, structure);

  // add SDP panel bonuses (percent-points, same unit as multiplierBonus); J-SDP is optional.
  const sdpBonus = J.SDP
    ? this.getSdpBonusForParameterKey(parameterKey, 1)
    : 0;

  // calculate the multiplier factor including panel bonuses.
  return (multiplierBonus + baseMultiplier + sdpBonus) / 100;
};

Game_Actor.prototype.getDropMultiplierBonus = function()
{
  // assemble the notetag and panel contributions into a factor.
  const factor = this.rewardMultiplierFactor(J.DROPS.RegExp.DropMultiplier, 'dor');

  // add any natural growth bonuses.
  const naturalBonus = this.dorNaturalBonuses();

  return factor + naturalBonus;
};

/**
 * Extends `.applyNaturalCustomGrowths()` to include dor growths.
 */
J.DROPS.Aliased.Game_Actor.set('applyNaturalCustomGrowths', Game_Actor.prototype.applyNaturalCustomGrowths);
Game_Actor.prototype.applyNaturalCustomGrowths = function()
{
  // perform original logic.
  J.DROPS.Aliased.Game_Actor.get('applyNaturalCustomGrowths')
    .call(this);

  // short circuit if aren't using the system.
  if (!J.NATURAL) return;

  // do natural dor growths.
  this.applyNaturalDorGrowths();
};

/**
 * Applies the natural drop rate growths to this battler.
 */
Game_Actor.prototype.applyNaturalDorGrowths = function()
{
  // base is 0 — avoid re-entering the dor getter which calls getAllNotes.
  const baseParam = 0;

  // calculate the flat growth.
  const growthPlus = this.naturalParamBuff(J.DROPS.RegExp.DropRateGrowthPlus, baseParam);

  // add the flat growth to this battler.
  this.modDorPlus(growthPlus);

  // calculate the rate growth.
  const growthRate = this.naturalParamBuff(J.DROPS.RegExp.DropRateGrowthRate, baseParam);

  // add the rate growth to this battler.
  this.modDorRate(growthRate);
};

/**
 * Gets this actor's bonus gold multiplier.
 * @returns {number}
 */
Game_Actor.prototype.getGoldMultiplier = function()
{
  // gold has no natural growth counterpart, so the assembled factor is the whole answer.
  return this.rewardMultiplierFactor(J.DROPS.RegExp.GoldMultiplier, 'gdr');
};
//endregion Game_Actor
