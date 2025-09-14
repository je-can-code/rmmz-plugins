//region RPG_Skill
/**
 * Gets all FormulaEffect packets defined on this skill via J.ABS.EXT.FORMULA.
 * Parsed once and cached on the skill instance.
 * @returns {FormulaEffect[]}
 */
RPG_Skill.prototype.jabsFormulaEffects = function()
{
  // initialize cache location if missing.
  this._j ||= {}; // shared J root.
  this._j._abs ||= {}; // JABS root.

  // build and cache on first access.
  if (!this._j._abs._formulaEffects)
  {
    this._j._abs._formulaEffects = this.extractJabsFormulaEffects();
  }

  // return cached (possibly empty) effects.
  return this._j._abs._formulaEffects;
};

/**
 * Parses the notes for all formula effects using the extension regex and central model.
 * Consumes both the "by-formula" and "by-skill" tag families.
 * @returns {FormulaEffect[]}
 */
RPG_Skill.prototype.extractJabsFormulaEffects = function()
{
  // capture tuples for by-formula (trigger, affect, resource, formula).
  const formulaTuples = RPGManager.getAllCapturesFromNoteByRegex(
    this,
    J.ABS.EXT.FORMULA.RegExp.FormulaApply,
    false) || [];

  // capture tuples for by-skill (trigger, affect, skillIdString).
  const skillTuples = RPGManager.getAllCapturesFromNoteByRegex(
    this,
    J.ABS.EXT.FORMULA.RegExp.SkillApply,
    false) || [];

  // map to FormulaEffect instances.
  const formulaEffects = formulaTuples.map(FormulaEffect.fromFormulaTuple, FormulaEffect);
  const skillEffects = skillTuples.map(FormulaEffect.fromSkillTuple, FormulaEffect);

  // combine and return (possibly empty).
  return [ ...formulaEffects, ...skillEffects ];
};
//endregion RPG_Skill