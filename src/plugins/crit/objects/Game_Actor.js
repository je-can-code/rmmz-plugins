//region Game_Actor
/**
 * Extend `.applyNaturalCustomGrowths()` to include our cdm/cdr growths.
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

  // do natural cdr growths.
  this.applyNaturalCdrGrowths();
};

/**
 * Extend `.longParam()` to first check for our crit params.
 */
J.CRIT.Aliased.Game_Actor.set('longParam', Game_Actor.prototype.longParam);
Game_Actor.prototype.longParam = function(longParamId)
{
  switch (longParamId)
  {
    case 28:
      return this.cdm;
    case 29:
      return this.cdr;
    default:
      return J.CRIT.Aliased.Game_Actor.get('longParam')
        .call(this, longParamId);
  }
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
 * Applies the natural CDR growths to this battler.
 */
Game_Actor.prototype.applyNaturalCdrGrowths = function()
{
  // destructure out the plus and rate structures for growths.
  const [ growthPlusStructure, growthRateStructure, , ] = this.getNaturalGrowthsRegexForCrit();

  // grab the base CDR for value basing.
  const baseCdr = this.baseCriticalReduction();

  // calculate the flat growth.
  const growthPlus = this.naturalParamBuff(growthPlusStructure, baseCdr);

  // add the flat growth to this battler.
  this.modCdrPlus(growthPlus);

  // calculate the rate growth.
  const growthRate = this.naturalParamBuff(growthRateStructure, baseCdr);

  // add the rate growth to this battler.
  this.modCdrRate(growthRate);
};

/**
 * Gets the various regular expressions used for getting CDM/CDR growth values.
 * @returns {[RegExp,RegExp,RegExp,RegExp]}
 */
Game_Actor.prototype.getNaturalGrowthsRegexForCrit = function()
{
  return [
    J.CRIT.RegExp.CritDamageReductionGrowthPlus,
    J.CRIT.RegExp.CritDamageReductionGrowthRate,
    J.CRIT.RegExp.CritDamageMultiplierGrowthPlus,
    J.CRIT.RegExp.CritDamageMultiplierGrowthRate, ];
};

/**
 * Gets all SDP bonuses for the given crit parameter id.
 * @param {number} critParamId The id of the crit parameter.
 * @param {number} baseParam The base value of the crit parameter in question.
 * @returns {number}
 */
Game_Actor.prototype.critSdpBonuses = function(critParamId, baseParam)
{
  // short circuit if aren't using the system.
  if (!J.SDP) return 0;

  // grab all the rankings this actor has earned.
  const panelRankings = this.getAllSdpRankings();

  // short circuit if we have no rankings.
  if (!panelRankings.length) return 0;

  // crit params start at 28.
  const actualCritParamId = 28 + critParamId;

  // initialize the running value.
  let val = 0;

  // iterate over each of the earned rankings.
  panelRankings.forEach(panelRanking =>
  {
    // grab our panel by its key.
    const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);

    // protect our players against changed keys mid-save file!
    if (!panel) return;

    // add the calculated bonus.
    val += panel.calculateBonusByRank(actualCritParamId, panelRanking.currentRank, baseParam, false);
  });

  // return the summed value.
  return val;
};
//endregion Game_Actor