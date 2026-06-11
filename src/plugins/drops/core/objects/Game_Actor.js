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
Game_Actor.prototype.getDropMultiplierBonus = function()
{
  // define the base multiplier.
  const baseMultiplier = 0;

  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // get the multiplier from anything this battler has available.
  const multiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.DropMultiplier);

  // calculate the multiplier factor.
  const factor = (multiplierBonus + baseMultiplier) / 100;

  // add any natural growth bonuses.
  const naturalBonus = this.dorNaturalBonuses();

  // return the factor including natural bonuses.
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
  // define the base multiplier.
  const baseMultiplier = 0;

  // grab all the notes.
  const objectsToCheck = this.getAllNotes();

  // get the multiplier from anything this battler has available.
  const multiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.DROPS.RegExp.GoldMultiplier);

  // calculate the multiplier factor.
  const factor = (multiplierBonus + baseMultiplier) / 100;

  // return the factor.
  return factor;
};
//endregion Game_Actor
