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
 * Sums the percent-points this actor's notes carry for one reward multiplier tag.
 * @param {RegExp} structure The notetag structure carrying the multiplier.
 * @returns {number} The summed percent-points.
 */
Game_Actor.prototype.rewardTagSum = function(structure)
{
  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // sum the multiplier from anything this battler has available.
  return RPGManager.getSumFromAllNotesByRegex(objectsToCheck, structure);
};

/**
 * Assembles a reward multiplier factor from this actor's notes, SDP panels and natural bonuses.
 * The notetag and panel contributions are expressed in percent-points and are summed before being
 * scaled down into the factor callers multiply by, so a notetag granting 20 and a panel granting 5
 * together produce a factor of 0.25 rather than two separately-rounded factors. Natural bonuses arrive
 * already in factor units, so they join after the scaling rather than before it.
 * @param {RegExp} structure The notetag structure carrying the multiplier.
 * @param {string} parameterKey The registry key of the multiplier, which SDP panels and natural growth
 * both know it by.
 * @returns {number} The assembled multiplier factor.
 */
Game_Actor.prototype.rewardMultiplierFactor = function(structure, parameterKey)
{
  // define the base multiplier.
  const baseMultiplier = 0;

  // get the multiplier from anything this battler has available.
  const multiplierBonus = this.rewardTagSum(structure);

  // add SDP panel bonuses (percent-points, same unit as multiplierBonus); J-SDP is optional.
  const sdpBonus = J.SDP
    ? this.getSdpBonusForParameterKey(parameterKey, 1)
    : 0;

  // calculate the multiplier factor including panel bonuses.
  const factor = (multiplierBonus + baseMultiplier + sdpBonus) / 100;

  // add whatever natural buffs and growths are bound to this multiplier.
  const naturalBonus = this.naturalBonus(parameterKey);

  return factor + naturalBonus;
};

/**
 * Overwrites {@link #baseGoldMultiplier}.<br/>
 * The gold multiplier this actor's own tags produce, scaled into a factor. This is what the gold
 * rate's natural tags see as their base.
 * @returns {number}
 */
Game_Actor.prototype.baseGoldMultiplier = function()
{
  // scale the tagged percent-points into a factor.
  return this.rewardTagSum(J.DROPS.RegExp.GoldMultiplier) / 100;
};

/**
 * Overwrites {@link #baseDropMultiplier}.<br/>
 * The drop multiplier this actor's own tags produce, scaled into a factor. This is what the drop
 * rate's natural tags see as their base.
 * @returns {number}
 */
Game_Actor.prototype.baseDropMultiplier = function()
{
  // scale the tagged percent-points into a factor.
  return this.rewardTagSum(J.DROPS.RegExp.DropMultiplier) / 100;
};

/**
 * Gets this actor's bonus drop multiplier.
 * @returns {number}
 */
Game_Actor.prototype.getDropMultiplierBonus = function()
{
  // assemble the notetag, panel and natural contributions into a factor.
  return this.rewardMultiplierFactor(J.DROPS.RegExp.DropMultiplier, 'dor');
};

/**
 * Gets this actor's bonus gold multiplier.
 * @returns {number}
 */
Game_Actor.prototype.getGoldMultiplier = function()
{
  // assemble the notetag, panel and natural contributions into a factor.
  return this.rewardMultiplierFactor(J.DROPS.RegExp.GoldMultiplier, 'gdr');
};
//endregion Game_Actor