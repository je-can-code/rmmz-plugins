//region Game_Enemy
/**
 * Extends {@link Game_Enemy.setup}.<br/>
 * Includes parameter buff initialization.
 */
J.NATURAL.Aliased.Game_Enemy.set('setup', Game_Enemy.prototype.setup);
Game_Enemy.prototype.setup = function(enemyId, x, y)
{
  // perform original logic.
  J.NATURAL.Aliased.Game_Enemy.get('setup')
    .call(this, enemyId, x, y);

  // initialize the parameter buffs on this battler.
  this.refreshAllParameterBuffs();
};

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Also refreshes all natural parameter buff values on the battler.
 */
J.NATURAL.Aliased.Game_Enemy.set('onBattlerDataChange', Game_Enemy.prototype.onBattlerDataChange);
Game_Enemy.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.NATURAL.Aliased.Game_Enemy.get('onBattlerDataChange')
    .call(this);

  // refresh all our buffs, something could've changed.
  this.refreshAllParameterBuffs();
};

//region max tp
/**
 * Overwrites {@link #maxTp}.<br/>
 * Replaces the `maxTp()` function with our custom one that will respect
 * formulas and apply rates from tags, etc.
 * @returns {number}
 */
Game_Enemy.prototype.maxTp = function()
{
  // calculate our actual max tp.
  return this.actualMaxTp();
};
//endregion max tp

//region b params
/**
 * Extends `.paramBase()` to include any additional growth bonuses as part of the base.
 */
J.NATURAL.Aliased.Game_Enemy.set('paramBase', Game_Enemy.prototype.paramBase);
Game_Enemy.prototype.paramBase = function(paramId)
{
  // get original value.
  // perform original logic.
  const baseParam = J.NATURAL.Aliased.Game_Enemy.get('paramBase')
    .call(this, paramId);

  // determine the structure for this parameter.
  const paramBaseNaturalBonuses = this.paramBaseNaturalBonuses(paramId);

  // return result.
  return (baseParam + paramBaseNaturalBonuses);
};

/**
 * This is exclusively for access to the natural growth values, without the base parameter value added.
 * @param {number} paramId The parameter id in question.
 * @returns {number}
 */
Game_Enemy.prototype.paramBaseNaturalBonuses = function(paramId)
{
  // determine the structure for this parameter.
  const structures = this.getRegexByParamId(paramId);

  // if there is no regexp, then don't try to do things.
  if (!structures) return 0;

  // get original value.
  // perform original logic.
  const baseParam = J.NATURAL.Aliased.Game_Enemy.get('paramBase')
    .call(this, paramId);

  // destructure into the plus and rate regexp structures.
  const paramNaturalBonuses = this.getParamBaseNaturalBonuses(paramId, baseParam);

  // return result.
  return (paramNaturalBonuses);
};

/**
 * Gets all natural growths for this base parameter.
 * Enemies only have buffs.
 * @param {number} paramId The parameter id in question.
 * @param {number} baseParam The base parameter.
 * @returns {number} The added value of the `baseParam` + `paramBuff` + `paramGrowth`.
 */
Game_Enemy.prototype.getParamBaseNaturalBonuses = function(paramId, baseParam)
{
  // determine temporary buff for this param.
  return this.calculateBParamBuff(paramId, baseParam);
};
//endregion b params

//region ex params
/**
 * Extends `.xparam()` to include any additional growth bonuses.
 */
J.NATURAL.Aliased.Game_Enemy.set('xparam', Game_Enemy.prototype.xparam);
Game_Enemy.prototype.xparam = function(xparamId)
{
  // get original value.
  // perform original logic.
  const baseParam = J.NATURAL.Aliased.Game_Enemy.get('xparam')
    .call(this, xparamId);

  // determine the structure for this parameter.
  const xparamNaturalBonuses = this.xparamNaturalBonuses(xparamId);

  // return result.
  return (baseParam + xparamNaturalBonuses);
};

/**
 * This is exclusively for access to the natural growth values, without the ex-parameter value added.
 * @param {number} xparamId The parameter id in question.
 * @returns {number}
 */
Game_Enemy.prototype.xparamNaturalBonuses = function(xparamId)
{
  // get original value.
  // perform original logic.
  const baseParam = J.NATURAL.Aliased.Game_Enemy.get('xparam')
    .call(this, xparamId);

  // determine the structure for this parameter.
  const structures = this.getRegexByExParamId(xparamId);

  // if there is no regexp, then don't try to do things.
  if (!structures) return 0;

  // destructure into the plus and rate regexp structures.
  return this.getXparamNaturalBonuses(xparamId, baseParam);
};

/**
 * Gets all natural growths for this ex-parameter.
 * @param {number} xparamId The parameter id in question.
 * @param {number} baseParam The base parameter.
 * @returns {number} The added value of the `baseParam` + `paramBuff` + `paramGrowth`.
 */
Game_Enemy.prototype.getXparamNaturalBonuses = function(xparamId, baseParam)
{
  // determine temporary buff for this param.
  return this.calculateExParamBuff(xparamId, baseParam);
};
//endregion ex params

//region sp params
/**
 * Extends `.sparam()` to include any additional growth bonuses.
 */
J.NATURAL.Aliased.Game_Enemy.set('sparam', Game_Enemy.prototype.sparam);
Game_Enemy.prototype.sparam = function(sparamId)
{
  // get original value.
  // perform original logic.
  const baseParam = J.NATURAL.Aliased.Game_Enemy.get('sparam')
    .call(this, sparamId);

  // determine the structure for this parameter.
  const sparamNaturalBonuses = this.sparamNaturalBonuses(sparamId);

  // return result.
  return (baseParam + sparamNaturalBonuses);
};

/**
 * This is exclusively for access to the natural growth values, without the sp-parameter value added.
 * @param {number} sparamId The parameter id in question.
 * @returns {number}
 */
Game_Enemy.prototype.sparamNaturalBonuses = function(sparamId)
{
  // get original value.
  // perform original logic.
  const baseParam = J.NATURAL.Aliased.Game_Enemy.get('sparam')
    .call(this, sparamId);

  // determine the structure for this parameter.
  const structures = this.getRegexBySpParamId(sparamId);

  // if there is no regexp, then don't try to do things.
  if (!structures) return 0;

  // destructure into the plus and rate regexp structures.
  return this.getSparamNaturalBonuses(sparamId, baseParam);
};

/**
 * Gets all natural growths for this sp-parameter.
 * Enemies only have buffs.
 * @param {number} sparamId The parameter id in question.
 * @param {number} baseParam The base parameter.
 * @returns {number} The added value of the `baseParam` + `paramBuff` + `paramGrowth`.
 */
Game_Enemy.prototype.getSparamNaturalBonuses = function(sparamId, baseParam)
{
  // determine temporary buff for this param.
  return this.calculateSpParamBuff(sparamId, baseParam);
};
//endregion sp params

//region rewards
/**
 * Overwrites {@link #refreshRewardBonuses}.<br/>
 * Implements the refresh for battle reward bonuses for the enemy.
 */
Game_Enemy.prototype.refreshRewardBonuses = function()
{
  this.refreshExpRewardBonuses();
  this.refreshGoldRewardBonuses();
  this.refreshSdpRewardBonuses();
// policy step inside refresh reward bonuses.
};

/**
 * Refreshes the experience reward bonuses for this enemy.
 */
Game_Enemy.prototype.refreshExpRewardBonuses = function()
{
  // calculate all formulai found for this enemy that could affect experience.
  const bonusExp = this.naturalParamBuff(J.NATURAL.RegExp.RewardExp, this.enemy().exp);

  // update the experience reward bonus.
  this.setExpPlus(bonusExp);
};

/**
 * Refreshes the gold reward bonuses for this enemy.
 */
Game_Enemy.prototype.refreshGoldRewardBonuses = function()
{
  // calculate all formulai found for this enemy that could affect gold.
  const bonusGold = this.naturalParamBuff(J.NATURAL.RegExp.RewardGold, this.enemy().gold);

  // update the gold reward bonus.
  this.setGoldPlus(bonusGold);
};

/**
 * Refreshes the SDP reward bonuses for this enemy.
 */
Game_Enemy.prototype.refreshSdpRewardBonuses = function()
{
  // if we are not using the SDP system, then don't do this.
  if (!J.SDP) return;

  // calculate all formulai found for this enemy that could affect SDPs.
  const sdpsBonus = this.naturalParamBuff(J.NATURAL.RegExp.RewardSdps, this.enemy().sdpPoints);

  // update the reward bonus.
  this.setSdpsPlus(sdpsBonus);
};

/**
 * Extends {@link #exp}.<br/>
 * Also adds on any natural bonuses of experience.
 * @returns {number}
 */
J.NATURAL.Aliased.Game_Enemy.set("exp", Game_Enemy.prototype.exp);
Game_Enemy.prototype.exp = function()
{
  // grab the original value.
  // perform original logic.
  const baseReward = J.NATURAL.Aliased.Game_Enemy.get("exp")
    .call(this);

  // grab the bonus rewards.
  const bonus = this.expPlus();

  // return the combined value.
  return (baseReward + bonus);
};

/**
 * Extends {@link #gold}.<br/>
 * Also adds on any natural bonuses of gold.
 * @returns {number}
 */
J.NATURAL.Aliased.Game_Enemy.set("gold", Game_Enemy.prototype.gold);
Game_Enemy.prototype.gold = function()
{
  // grab the original value.
  // perform original logic.
  const baseReward = J.NATURAL.Aliased.Game_Enemy.get("gold")
    .call(this);

  // grab the bonus rewards.
  const bonus = this.goldPlus();

  // return the combined value.
  return (baseReward + bonus);
};

/**
 * Extends {@link #sdpPoints}.<br/>
 * Also adds on any natural bonuses of SDPs.
 */
J.NATURAL.Aliased.Game_Enemy.set("sdpPoints", Game_Enemy.prototype.sdpPoints);
Game_Enemy.prototype.sdpPoints = function()
{
  // grab the original value.
  // perform original logic.
  const baseReward = J.NATURAL.Aliased.Game_Enemy.get("sdpPoints")
    .call(this);

  // grab the bonus rewards.
  const bonus = this.sdpsPlus();

  // return the combined value.
  return (baseReward + bonus);
};

//endregion rewards
//endregion Game_Enemy