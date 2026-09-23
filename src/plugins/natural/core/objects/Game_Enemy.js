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
 * Extends `.paramBase()` to include any natural buffs as part of the base.<br/>
 * Enemies never level, so the growth half of their natural bonus is always empty.
 */
J.NATURAL.Aliased.Game_Enemy.set('paramBase', Game_Enemy.prototype.paramBase);
Game_Enemy.prototype.paramBase = function(paramId)
{
  // start from the engine's own base for this parameter.
  const baseParam = this.paramBaseBeforeNatural(paramId);

  // translate the engine's id into the key its natural tags are bound to.
  const parameterKey = ParameterKeys.bparamKey(paramId);

  // add whatever this enemy is buffed by.
  const naturalBonus = this.engineNaturalBonus(parameterKey, baseParam);

  // return result.
  return (baseParam + naturalBonus);
};

/**
 * The engine's base for a base parameter, before any natural bonus.<br/>
 * This is what a base parameter's natural tags see as their base.
 * @param {number} paramId The id of the base parameter.
 * @returns {number}
 */
Game_Enemy.prototype.paramBaseBeforeNatural = function(paramId)
{
  // perform original logic.
  return J.NATURAL.Aliased.Game_Enemy.get('paramBase')
    .call(this, paramId);
};
//endregion b params

//region ex params
/**
 * Extends `.xparam()` to include any natural buffs.
 */
J.NATURAL.Aliased.Game_Enemy.set('xparam', Game_Enemy.prototype.xparam);
Game_Enemy.prototype.xparam = function(xparamId)
{
  // start from the engine's own value for this parameter.
  const baseParam = this.xparamBeforeNatural(xparamId);

  // translate the engine's id into the key its natural tags are bound to.
  const parameterKey = ParameterKeys.xparamKey(xparamId);

  // add whatever this enemy is buffed by.
  const naturalBonus = this.engineNaturalBonus(parameterKey, baseParam);

  // return result.
  return (baseParam + naturalBonus);
};

/**
 * The engine's value for an ex-parameter, before any natural bonus.<br/>
 * This is what an ex-parameter's natural tags see as their base.
 * @param {number} xparamId The id of the ex-parameter.
 * @returns {number}
 */
Game_Enemy.prototype.xparamBeforeNatural = function(xparamId)
{
  // perform original logic.
  return J.NATURAL.Aliased.Game_Enemy.get('xparam')
    .call(this, xparamId);
};
//endregion ex params

//region sp params
/**
 * Extends `.sparam()` to include any natural buffs.
 */
J.NATURAL.Aliased.Game_Enemy.set('sparam', Game_Enemy.prototype.sparam);
Game_Enemy.prototype.sparam = function(sparamId)
{
  // start from the engine's own value for this parameter.
  const baseParam = this.sparamBeforeNatural(sparamId);

  // translate the engine's id into the key its natural tags are bound to.
  const parameterKey = ParameterKeys.sparamKey(sparamId);

  // add whatever this enemy is buffed by.
  const naturalBonus = this.engineNaturalBonus(parameterKey, baseParam);

  // return result.
  return (baseParam + naturalBonus);
};

/**
 * The engine's value for an sp-parameter, before any natural bonus.<br/>
 * This is what an sp-parameter's natural tags see as their base.
 * @param {number} sparamId The id of the sp-parameter.
 * @returns {number}
 */
Game_Enemy.prototype.sparamBeforeNatural = function(sparamId)
{
  // perform original logic.
  return J.NATURAL.Aliased.Game_Enemy.get('sparam')
    .call(this, sparamId);
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