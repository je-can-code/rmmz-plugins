//region Game_Actor
/**
 * Extend `.applyNaturalCustomGrowths()` to include our cdm/ctr growths.
 */
J.CRIT.Aliased.Game_Actor.set('applyNaturalCustomGrowths', Game_Actor.prototype.applyNaturalCustomGrowths);
Game_Actor.prototype.applyNaturalCustomGrowths = function()
{
  // perform original logic.
  J.CRIT.Aliased.Game_Actor.get('applyNaturalCustomGrowths')
    .call(this);

  // short circuit if aren't using the system.
  if (!J.NATURAL) return;

  // do natural cdm growths.
  this.applyNaturalCdmGrowths();

  // do natural ctr growths.
  this.applyNaturalCtrGrowths();
};

/**
 * Applies the natural CDM growths to this battler.
 */
Game_Actor.prototype.applyNaturalCdmGrowths = function()
{
  // destructure out the plus and rate structures for growths.
  const [ , , growthPlusStructure, growthRateStructure ] = this.getNaturalGrowthsRegexForCrit();

  // grab the base CDM for value basing.
  const baseCdm = this.baseCriticalMultiplier();

  // calculate the flat growth.
  const growthPlus = this.naturalParamBuff(growthPlusStructure, baseCdm);

  // add the flat growth to this battler.
  this.modCdmPlus(growthPlus);

  // calculate the rate growth.
  const growthRate = this.naturalParamBuff(growthRateStructure, baseCdm);

  // add the rate growth to this battler.
  this.modCdmRate(growthRate);
};

/**
 * Applies the natural CTR growths to this battler.
 */
Game_Actor.prototype.applyNaturalCtrGrowths = function()
{
  // destructure out the plus and rate structures for growths.
  const [ growthPlusStructure, growthRateStructure, , ] = this.getNaturalGrowthsRegexForCrit();

  // grab the base CTR for value basing.
  const baseCtr = this.baseCriticalReduction();

  // calculate the flat growth.
  const growthPlus = this.naturalParamBuff(growthPlusStructure, baseCtr);

  // add the flat growth to this battler.
  this.modCtrPlus(growthPlus);

  // calculate the rate growth.
  const growthRate = this.naturalParamBuff(growthRateStructure, baseCtr);

  // add the rate growth to this battler.
  this.modCtrRate(growthRate);
};

/**
 * Gets the various regular expressions used for getting CDM/CTR growth values.
 * @returns {[RegExp,RegExp,RegExp,RegExp]}
 */
Game_Actor.prototype.getNaturalGrowthsRegexForCrit = function()
{
  return [
    J.CRIT.RegExp.CritTakenRateGrowthPlus,
    J.CRIT.RegExp.CritTakenRateGrowthRate,
    J.CRIT.RegExp.CritDamageMultiplierGrowthPlus,
    J.CRIT.RegExp.CritDamageMultiplierGrowthRate,
  ];
};

/**
 * Gets all SDP bonuses for the given crit parameter id.
 * @param {number} critParamId The id of the crit parameter.
 * @param {number} baseParam The base value of the crit parameter in question.
 * @returns {number}
 */
Game_Actor.prototype.critSdpBonuses = function(critParamId, baseParam)
{
  const parameterKey = critParamId === 0
    ? 'cdm'
    : 'ctr';

  return this.getSdpBonusForParameterKey(parameterKey, baseParam);
};
//endregion Game_Actor