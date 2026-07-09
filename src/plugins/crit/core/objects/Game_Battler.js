//region Game_Battler
/**
 * Extends `.initNaturalGrowthParameters()` to include the new critical damage parameters as growth-ready.
 */
J.CRIT.Aliased.Game_Battler.set('initNaturalGrowthParameters', Game_Battler.prototype.initNaturalGrowthParameters);
Game_Battler.prototype.initNaturalGrowthParameters = function()
{
  // short circuit if not using the natural growths plugin.
  if (!J.NATURAL) return;

  // perform original logic.
  J.CRIT.Aliased.Game_Battler.get('initNaturalGrowthParameters')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with natural growth.
   */
  this._j._natural ||= {};

  /**
   * The permanent flat bonus for CDM.
   * @type {number}
   */
  this._j._natural._cdmPlus = 0;

  /**
   * The permanent multiplier bonus for CDR.
   * @type {number}
   */
  this._j._natural._cdmRate = 0;

  /**
   * The permanent flat bonus for CTR.
   * @type {number}
   */
  this._j._natural._ctrPlus = 0;

  /**
   * The permanent multiplier bonus for CTR.
   * @type {number}
   */
  this._j._natural._ctrRate = 0;
};

//region properties
/**
 * Gets the permanent flat bonus for CDM.
 * @returns {number}
 */
Game_Battler.prototype.cdmPlus = function()
{
  return this._j._natural._cdmPlus;
};

/**
 * Modifies the permanent flat bonus for CDM.
 * @param {number} amount The amount to modify the bonus by.
 */
Game_Battler.prototype.modCdmPlus = function(amount)
{
  this._j._natural._cdmPlus += amount;
};

/**
 * Gets the permanent multiplicative bonus for CDM.
 * @returns {number}
 */
Game_Battler.prototype.cdmRate = function()
{
  return this._j._natural._cdmRate;
};

/**
 * Modifies the permanent multiplicative bonus for CDM.
 * @param {number} amount The amount to modify the bonus by.
 */
Game_Battler.prototype.modCdmRate = function(amount)
{
  this._j._natural._cdmRate += amount;
};

/**
 * Gets the current growths applied to CTR plus.
 * @returns {number}
 */
Game_Battler.prototype.ctrPlus = function()
{
  return this._j._natural._ctrPlus;
};

/**
 * Modifies the permanent flat bonus for CTR.
 * @param {number} amount The amount to modify the bonus by.
 */
Game_Battler.prototype.modCtrPlus = function(amount)
{
  this._j._natural._ctrPlus += amount;
};

/**
 * Gets the current growths applied to CTR rate.
 * @returns {number}
 */
Game_Battler.prototype.ctrRate = function()
{
  return this._j._natural._ctrRate;
};

/**
 * Modifies the permanent multiplicative bonus for CTR.
 * @param {number} amount The amount to modify the bonus by.
 */
Game_Battler.prototype.modCtrRate = function(amount)
{
  this._j._natural._ctrRate += amount;
};
//endregion properties

/**
 * Gets the base multiplier for this battler's critical hits.
 * @returns {number}
 */
Game_Battler.prototype.baseCriticalMultiplier = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum together all the base CDM tags.
  const baseCriticalMultiplier = RPGManager.getSumFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritDamageMultiplierBase
  );

  // calculate the factor for the CDM.
  const baseCdmFactor = baseCriticalMultiplier / 100;

  // return the factor.
  return baseCdmFactor;
};

/**
 * Calculates this battler's current critical damage multiplier.
 * @returns {number}
 */
Game_Battler.prototype.criticalDamageMultiplier = function()
{
  // sum together all cdm values across the notes.
  const cdmBonuses = this.getCriticalDamageMultiplier();

  // grab all natural bonuses for cdm.
  const cdmNaturalBonuses = this.cdmNaturalBonuses();

  // grab all sdp bonuses for cdm.
  const cdmSdpBonuses = this.critSdpBonuses(0, this.baseCriticalMultiplier());

  // calculate the factor for the CDM.
  const cdmFactor = (cdmBonuses + cdmNaturalBonuses + cdmSdpBonuses) / 100;

  // return the factor.
  return cdmFactor;
};

/**
 * Gets the sum of all critical damage multipliers from all notes.
 * @returns {number}
 */
Game_Battler.prototype.getCriticalDamageMultiplier = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum together all cdm values across the notes.
  const cdmBonuses = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.CRIT.RegExp.CritDamageMultiplier);

  // return the sum of all bonuses.
  return cdmBonuses;
};

/**
 * Gets all natural bonuses for cdm, excluding the base cdm itself.
 * @returns {number}
 */
Game_Battler.prototype.cdmNaturalBonuses = function()
{
  // short circuit if we aren't using the natural growths plugin.
  if (!J.NATURAL) return 0;

  // calculate the natural buffs for this parameter.
  const cdmBuffs = this.cdmNaturalBuffs();

  // calculate the natural growths for this parameter.
  const cdmGrowths = this.cdmNaturalGrowths();

  // sum together the two natural bonuses.
  return (cdmBuffs + cdmGrowths);
};

/**
 * Calculates the buffs for critical damage multipliers.
 * @returns {number}
 */
Game_Battler.prototype.cdmNaturalBuffs = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // grab the base parameter value.
  const baseParam = this.baseCriticalMultiplier();

  // sum together all the cdm buff pluses across the notes.
  const cdmBuffPlus = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritDamageMultiplierBuffPlus,
    baseParam,
    this
  );

  // sum together all the cdm buff rates across the notes.
  const cdmBuffRate = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritDamageMultiplierBuffRate,
    baseParam,
    this
  );

  // don't calculate if we don't have anything.
  if (!cdmBuffPlus && !cdmBuffRate) return 0;

  // return result.
  return this.calculatePlusRate(baseParam, cdmBuffPlus, cdmBuffRate);
};

/**
 * Calculates the growths associated with critical damage multipliers.
 * @returns {number}
 */
Game_Battler.prototype.cdmNaturalGrowths = function()
{
  // grab the base param for calculations.
  const baseCdm = this.baseCriticalMultiplier();

  // get the current plus growth for cdm.
  const growthPlus = this.cdmPlus();

  // get the current rate growth for cdm.
  const growthRate = this.cdmRate();

  // don't calculate if we don't have anything.
  if (!growthPlus && !growthRate) return 0;

  // calculate the result.
  return this.calculatePlusRate(baseCdm, growthPlus, growthRate);
};

/**
 * Gets the base reduction for this battler's critical hits.
 * @returns {number}
 */
Game_Battler.prototype.baseCriticalReduction = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum together all the base CDR tags.
  const baseCriticalReduction = RPGManager.getSumFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritDamageReductionBase
  );

  // calculate the factor for the CDR.
  const baseCdmFactor = baseCriticalReduction / 100;

  // return the factor.
  return baseCdmFactor;
};

/**
 * Gets the reduction factor for when this battler receives a critical hit.
 * @returns {number} The CDR factor for this battler.
 */
Game_Battler.prototype.criticalDamageReduction = function()
{
  // sum together all ctr values across the notes.
  const ctrBonuses = this.getCriticalDamageReduction();

  // grab all natural bonuses for ctr.
  const ctrNaturalBonuses = this.ctrNaturalBonuses();

  // grab all sdp bonuses for ctr.
  const ctrSdpBonuses = this.critSdpBonuses(1, this.baseCriticalReduction());

  // calculate the factor for the CTR.
  const ctrFactor = (ctrBonuses + ctrNaturalBonuses + ctrSdpBonuses) / 100;

  // return the factor.
  return ctrFactor;
};

/**
 * Gets the sum of all critical damage reductions from all notes.
 * @returns {number}
 */
Game_Battler.prototype.getCriticalDamageReduction = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum together all ctr values across the notes.
  const ctrBonuses = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.CRIT.RegExp.CritDamageReduction);

  // return the sum of all bonuses.
  return ctrBonuses;
};

/**
 * Gets all natural bonuses for ctr, excluding the base ctr itself.
 * @returns {number}
 */
Game_Battler.prototype.ctrNaturalBonuses = function()
{
  // short circuit if we aren't using the natural growths plugin.
  if (!J.NATURAL) return 0;

  // calculate the natural buffs for this parameter.
  const ctrBuffs = this.ctrNaturalBuffs();

  // calculate the natural growths for this parameter.
  const ctrGrowths = this.ctrNaturalGrowths();

  // sum together the two natural bonuses.
  return (ctrBuffs + ctrGrowths);
};

/**
 * Calculates the buffs for critical taken rate.
 * @returns {number}
 */
Game_Battler.prototype.ctrNaturalBuffs = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // grab the base parameter value.
  const baseParam = this.baseCriticalReduction();

  // sum together all the ctr buff pluses across the notes.
  const ctrBuffPlus = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritTakenRateBuffPlus,
    baseParam,
    this
  );

  // sum together all the ctr buff rates across the notes.
  const ctrBuffRate = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritTakenRateBuffRate,
    baseParam,
    this
  );

  // don't calculate if we don't have anything.
  if (!ctrBuffPlus && !ctrBuffRate) return 0;

  // grab the base param for calculations.
  const baseCtr = this.baseCriticalReduction();

  // return result.
  return this.calculatePlusRate(baseCtr, ctrBuffPlus, ctrBuffRate);
};

/**
 * Calculates the growths associated with critical taken rate.
 * @returns {number}
 */
Game_Battler.prototype.ctrNaturalGrowths = function()
{
  // grab the base param for calculations.
  const baseCtr = this.baseCriticalReduction();

  // get the current plus growth for ctr.
  const growthPlus = this.ctrPlus();

  // get the current rate growth for ctr.
  const growthRate = this.ctrRate();

  // don't calculate if we don't have anything.
  if (!growthPlus && !growthRate) return 0;

  // calculate the result.
  return this.calculatePlusRate(baseCtr, growthPlus, growthRate);
};

/**
 * Whether or not this battler's on-crit state applications should skip their own chance roll and
 * always land. Scoped specifically to {@link Game_Action.rollAndApplyCritStates}- unlike
 * `isVeryLucky()`, this does not bypass any other roll site (hit chance, regular state-apply,
 * retaliation, etc). Sourced from any of this battler's own note sources via `<forceCritProcs>`.
 * @returns {boolean}
 */
Game_Battler.prototype.isForceCritProcs = function()
{
  return RPGManager.checkForBooleanFromAllNotesByRegex(this.getAllNotes(), J.CRIT.RegExp.ForceCritProcs) === true;
};
//endregion Game_Battler