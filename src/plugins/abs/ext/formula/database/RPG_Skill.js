//region RPG_Skill
import FormulaEffect from './../__models/FormulaEffect.js';
/**
 * Gets all FormulaEffect packets defined on this skill via J.ABS.EXT.FORMULA.
 * Parsed once and cached on the skill instance.
 * @returns {FormulaEffect[]}
 */
RPG_Skill.prototype.jabsFormulaEffects = function()
{
  // initialize cache location if missing.
  // shared J root.
  this._j ||= {};
  // jABS root.
  this._j._abs ||= {};

  // build and cache on first access.
  if (!this.formulaEffects())
  {
    this.setFormulaEffects(this.extractJabsFormulaEffects());
  }

  // return cached (possibly empty) effects.
  return this.formulaEffects();
};

/**
 * Parses the notes for all formula effects using the extension regex and central model.
 * Consumes both the "by-formula" and "by-skill" tag families.
 * @returns {FormulaEffect[]}
 */
RPG_Skill.prototype.extractJabsFormulaEffects = function()
{
  // capture tuples for by-formula (trigger, affect, resource, formula); each
  // <onApplyFormula:[...]> tag is a single bracket, so it parses directly into a tuple.
  const formulaTuples = RPGManager.getArraysFromNotesByRegex(this, J.ABS.EXT.FORMULA.RegExp.FormulaApply);

  // capture tuples for by-skill (trigger, affect, skillId); each <onApplySkill:[...]> tag
  // is a single bracket, so it parses directly into a tuple.
  const skillTuples = RPGManager.getArraysFromNotesByRegex(this, J.ABS.EXT.FORMULA.RegExp.SkillApply);

  // map to FormulaEffect instances.
  const formulaEffects = formulaTuples.map(FormulaEffect.fromFormulaTuple, FormulaEffect);
  const skillEffects = skillTuples.map(FormulaEffect.fromSkillTuple, FormulaEffect);

  // combine and return (possibly empty).
  return [ ...formulaEffects, ...skillEffects ];
};

//region properties
/**
 * Gets the formula effects.
 * @returns {*} The formulaEffects.
 */
RPG_Skill.prototype.formulaEffects = function()
{
  // hand back the formula effects.
  return this._j._abs._formulaEffects;
};

/**
 * Sets the formula effects.
 * @param {*} newFormulaEffects The new formulaEffects.
 */
RPG_Skill.prototype.setFormulaEffects = function(newFormulaEffects)
{
  // assign the formula effects.
  this._j._abs._formulaEffects = newFormulaEffects;
};
//endregion properties
//endregion RPG_Skill