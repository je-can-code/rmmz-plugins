//region Game_Actor
/**
 * Extends {@link #setup}.<br/>
 * Includes parameter buff initialization.
 */
J.NATURAL.Aliased.Game_Actor.set('setup', Game_Actor.prototype.setup);
Game_Actor.prototype.setup = function(actorId)
{
  // perform original logic.
  J.NATURAL.Aliased.Game_Actor.get('setup')
    .call(this, actorId);

  // initialize the parameter buffs on this battler.
  this.refreshAllParameterBuffs();
};

/**
 * Extends {@link #onBattlerDataChange}.<br/>
 * Also refreshes all natural parameter buff values on the battler.
 */
J.NATURAL.Aliased.Game_Actor.set('onBattlerDataChange', Game_Actor.prototype.onBattlerDataChange);
Game_Actor.prototype.onBattlerDataChange = function()
{
  // perform original logic.
  J.NATURAL.Aliased.Game_Actor.get('onBattlerDataChange')
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
Game_Actor.prototype.maxTp = function()
{
  // calculate our actual max tp.
  return this.actualMaxTp();
};
//endregion max tp

//region b params
/**
 * Extends `.paramBase()` to include any natural buffs and growths as part of the base.
 */
J.NATURAL.Aliased.Game_Actor.set('paramBase', Game_Actor.prototype.paramBase);
Game_Actor.prototype.paramBase = function(paramId)
{
  // start from the engine's own base for this parameter.
  const baseParam = this.paramBaseBeforeNatural(paramId);

  // translate the engine's id into the key its natural tags are bound to.
  const parameterKey = ParameterKeys.bparamKey(paramId);

  // add whatever this actor is buffed and has grown by.
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
Game_Actor.prototype.paramBaseBeforeNatural = function(paramId)
{
  // perform original logic.
  return J.NATURAL.Aliased.Game_Actor.get('paramBase')
    .call(this, paramId);
};
//endregion b params

//region ex params
/**
 * Extends `.xparam()` to include any natural buffs and growths.
 */
J.NATURAL.Aliased.Game_Actor.set('xparam', Game_Actor.prototype.xparam);
Game_Actor.prototype.xparam = function(xparamId)
{
  // start from the engine's own value for this parameter.
  const baseParam = this.xparamBeforeNatural(xparamId);

  // translate the engine's id into the key its natural tags are bound to.
  const parameterKey = ParameterKeys.xparamKey(xparamId);

  // add whatever this actor is buffed and has grown by.
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
Game_Actor.prototype.xparamBeforeNatural = function(xparamId)
{
  // perform original logic.
  return J.NATURAL.Aliased.Game_Actor.get('xparam')
    .call(this, xparamId);
};
//endregion ex params

//region sp params
/**
 * Extends `.sparam()` to include any natural buffs and growths.
 */
J.NATURAL.Aliased.Game_Actor.set('sparam', Game_Actor.prototype.sparam);
Game_Actor.prototype.sparam = function(sparamId)
{
  // start from the engine's own value for this parameter.
  const baseParam = this.sparamBeforeNatural(sparamId);

  // translate the engine's id into the key its natural tags are bound to.
  const parameterKey = ParameterKeys.sparamKey(sparamId);

  // add whatever this actor is buffed and has grown by.
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
Game_Actor.prototype.sparamBeforeNatural = function(sparamId)
{
  // perform original logic.
  return J.NATURAL.Aliased.Game_Actor.get('sparam')
    .call(this, sparamId);
};
//endregion sp params

//region apply growths
/**
 * Extends `.levelUp()` to include applying any natural growths the battler has.
 */
J.NATURAL.Aliased.Game_Actor.set('levelUp', Game_Actor.prototype.levelUp);
Game_Actor.prototype.levelUp = function()
{
  // perform original logic.
  J.NATURAL.Aliased.Game_Actor.get('levelUp')
    .call(this);

  // applies all natural growths- permanent stat growths for this battler.
  this.applyNaturalGrowths();
};

/**
 * Applies all natural growths applied to this actor at the present moment.<br/>
 * Every parameter bound to natural growth grows here, the engine's own and every plugin's alike, which
 * is why a newly bound parameter needs nothing of its own to grow with level.
 */
Game_Actor.prototype.applyNaturalGrowths = function()
{
  // grow every bound parameter by its tags, once for this level.
  ParameterRegistry.naturallyBoundKeys()
    .forEach(parameterKey => this.applyNaturalGrowth(parameterKey));
};

/**
 * Grows one parameter by whatever its growth tags evaluate to for this actor right now.<br/>
 * Only a parameter that actually grows gets an entry, which keeps the growth tables down to what this
 * actor has really earned.
 * @param {string} parameterKey The registry key of the parameter.
 */
Game_Actor.prototype.applyNaturalGrowth = function(parameterKey)
{
  // the tags this parameter answers to, and what those tags see as their base.
  const binding = ParameterRegistry.naturalBinding(parameterKey);
  const base = this.naturalDisplayBase(parameterKey);

  // evaluate every flat growth formula this actor carries for the parameter.
  const growthPlus = this.naturalParamBuff(binding.growthPlus, base);

  // add it to the running total, when there is anything to add.
  if (growthPlus !== 0)
  {
    this.modNaturalGrowthPlus(parameterKey, growthPlus);
  }

  // evaluate every percent growth formula this actor carries for the parameter.
  const growthRate = this.naturalParamBuff(binding.growthRate, base);

  // add it to the running total, when there is anything to add.
  if (growthRate !== 0)
  {
    this.modNaturalGrowthRate(parameterKey, growthRate);
  }
};
//endregion apply growths
//endregion Game_Actor