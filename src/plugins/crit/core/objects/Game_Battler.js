//region Game_Battler
/**
 * Extends {@link Game_BattlerBase#baseCriticalMultiplier}.<br/>
 * Adds any `<critMultiplierBase:NUM>` notetag contributions on top of the plugin-configured
 * floor value inherited from {@link Game_BattlerBase}, instead of replacing it outright-
 * without this alias, every battler without a notetag would floor out at 0 instead of the
 * designer-configured default.
 */
J.CRIT.Aliased.Game_Battler.set('baseCriticalMultiplier', Game_Battler.prototype.baseCriticalMultiplier);
Game_Battler.prototype.baseCriticalMultiplier = function()
{
  // perform original logic to grab the configured floor value shared by all battlers.
  const baseFactor = J.CRIT.Aliased.Game_Battler.get('baseCriticalMultiplier')
    .call(this);

  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum together all the base CDM tags.
  const baseCriticalMultiplier = RPGManager.getSumFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritDamageMultiplierBase
  );

  // calculate the factor for the CDM.
  const baseCdmFactor = baseCriticalMultiplier / 100;

  // return the floor plus any additional notetag-driven bonus.
  return baseFactor + baseCdmFactor;
};

/**
 * Calculates this battler's current critical damage multiplier.
 * @returns {number}
 */
Game_Battler.prototype.criticalDamageMultiplier = function()
{
  // sum together all cdm values across the notes.
  const cdmBonuses = this.getCriticalDamageMultiplier();

  // grab all sdp bonuses for cdm.
  const cdmSdpBonuses = this.critSdpBonuses(0, this.baseCriticalMultiplier());

  // calculate the factor for the CDM.
  const cdmFactor = (cdmBonuses + cdmSdpBonuses) / 100;

  // layer on whatever natural buffs and growths are bound to cdm, which arrive already as a factor.
  const cdmNaturalBonus = this.naturalBonus('cdm');

  // return the factor.
  return cdmFactor + cdmNaturalBonus;
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
 * Extends {@link Game_BattlerBase#baseCriticalReduction}.<br/>
 * Adds any `<critReductionBase:NUM>` notetag contributions on top of the plugin-configured
 * floor value inherited from {@link Game_BattlerBase}, instead of replacing it outright-
 * without this alias, every battler without a notetag would floor out at 0 instead of the
 * designer-configured default.
 */
J.CRIT.Aliased.Game_Battler.set('baseCriticalReduction', Game_Battler.prototype.baseCriticalReduction);
Game_Battler.prototype.baseCriticalReduction = function()
{
  // perform original logic to grab the configured floor value shared by all battlers.
  const baseFactor = J.CRIT.Aliased.Game_Battler.get('baseCriticalReduction')
    .call(this);

  // grab everything with notes.
  const objectsToCheck = this.getAllNotes();

  // sum together all the base CDR tags.
  const baseCriticalReduction = RPGManager.getSumFromAllNotesByRegex(
    objectsToCheck,
    J.CRIT.RegExp.CritDamageReductionBase
  );

  // calculate the factor for the CDR.
  const baseCdrFactor = baseCriticalReduction / 100;

  // return the floor plus any additional notetag-driven bonus.
  return baseFactor + baseCdrFactor;
};

/**
 * Gets the reduction factor for when this battler receives a critical hit.
 * @returns {number} The CDR factor for this battler.
 */
Game_Battler.prototype.criticalDamageReduction = function()
{
  // sum together all ctr values across the notes.
  const ctrBonuses = this.getCriticalDamageReduction();

  // grab all sdp bonuses for ctr.
  const ctrSdpBonuses = this.critSdpBonuses(1, this.baseCriticalReduction());

  // calculate the factor for the CTR.
  const ctrFactor = (ctrBonuses + ctrSdpBonuses) / 100;

  // layer on whatever natural buffs and growths are bound to ctr, which arrive already as a factor.
  const ctrNaturalBonus = this.naturalBonus('ctr');

  // return the factor.
  return ctrFactor + ctrNaturalBonus;
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