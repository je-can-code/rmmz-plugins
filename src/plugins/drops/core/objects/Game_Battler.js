//region Game_Battler
/**
 * Extends `.initNaturalGrowthParameters()` to include dor as growth-ready.
 */
J.DROPS.Aliased.Game_Battler.set('initNaturalGrowthParameters', Game_Battler.prototype.initNaturalGrowthParameters);
Game_Battler.prototype.initNaturalGrowthParameters = function()
{
  // short circuit if not using the natural growths plugin.
  if (!J.NATURAL) return;

  // perform original logic.
  J.DROPS.Aliased.Game_Battler.get('initNaturalGrowthParameters')
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
   * The permanent flat bonus for drop rate.
   * @type {number}
   */
  this._j._natural._dorPlus = 0;

  /**
   * The permanent multiplier bonus for drop rate.
   * @type {number}
   */
  this._j._natural._dorRate = 0;
};

/**
 * Gets the permanent flat bonus for drop rate.
 * @returns {number}
 */
Game_Battler.prototype.dorPlus = function()
{
  return this._j._natural._dorPlus;
};

/**
 * Modifies the permanent flat bonus for drop rate.
 * @param {number} amount The amount to modify the bonus by.
 */
Game_Battler.prototype.modDorPlus = function(amount)
{
  this._j._natural._dorPlus += amount;
};

/**
 * Gets the permanent multiplicative bonus for drop rate.
 * @returns {number}
 */
Game_Battler.prototype.dorRate = function()
{
  return this._j._natural._dorRate;
};

/**
 * Modifies the permanent multiplicative bonus for drop rate.
 * @param {number} amount The amount to modify the bonus by.
 */
Game_Battler.prototype.modDorRate = function(amount)
{
  this._j._natural._dorRate += amount;
};

/**
 * Gets all natural bonuses for dor.
 * @returns {number}
 */
Game_Battler.prototype.dorNaturalBonuses = function()
{
  // short circuit if we aren't using the natural growths plugin.
  if (!J.NATURAL) return 0;

  // calculate the natural buffs for this parameter.
  const dorBuffs = this.dorNaturalBuffs();

  // calculate the natural growths for this parameter.
  const dorGrowths = this.dorNaturalGrowths();

  // sum together the two natural bonuses.
  return (dorBuffs + dorGrowths);
};

/**
 * Calculates the buffs for drop rate.
 * @returns {number}
 */
Game_Battler.prototype.dorNaturalBuffs = function()
{
  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // base is 0 — avoid re-entering the dor getter which calls getAllNotes.
  const baseParam = 0;

  // sum together all the dor buff pluses across the notes.
  const dorBuffPlus = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.DROPS.RegExp.DropRateBuffPlus,
    baseParam,
    this
  );

  // sum together all the dor buff rates across the notes.
  const dorBuffRate = RPGManager.getResultsFromAllNotesByRegex(
    objectsToCheck,
    J.DROPS.RegExp.DropRateBuffRate,
    baseParam,
    this
  );

  // don't calculate if we don't have anything.
  if (!dorBuffPlus && !dorBuffRate) return 0;

  // return result.
  return this.calculatePlusRate(baseParam, dorBuffPlus, dorBuffRate);
};

/**
 * Calculates the growths associated with drop rate.
 * @returns {number}
 */
Game_Battler.prototype.dorNaturalGrowths = function()
{
  // base is 0 — avoid re-entering the dor getter which calls getAllNotes.
  const baseParam = 0;

  // get the current plus growth for dor.
  const growthPlus = this.dorPlus();

  // get the current rate growth for dor.
  const growthRate = this.dorRate();

  // don't calculate if we don't have anything.
  if (!growthPlus && !growthRate) return 0;

  // calculate the result.
  return this.calculatePlusRate(baseParam, growthPlus, growthRate);
};
//endregion Game_Battler
