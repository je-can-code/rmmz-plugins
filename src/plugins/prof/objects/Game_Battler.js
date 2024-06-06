//region Game_Battler
/**
 * Gets all skill proficiencies for this battler.
 * @returns {SkillProficiency[]}
 */
Game_Battler.prototype.skillProficiencies = function()
{
  return [];
};

/**
 * Gets the prof of one particular skill for this battler.
 * @param {number} skillId The id of the skill to get proficiency for.
 * @returns {number}
 */
Game_Battler.prototype.skillProficiencyBySkillId = function(skillId)
{
  return 0;
};

/**
 * Gets the total amount of proficiency gained from an action for this battler.
 * @returns {number}
 */
Game_Battler.prototype.skillProficiencyAmount = function()
{
  const base = this.baseSkillProficiencyAmount();
  const bonuses = this.bonusSkillProficiencyGains();
  return base + bonuses;
};

/**
 * Gets the base amount of proficiency gained from an action for this battler.
 * @returns {number}
 */
Game_Battler.prototype.baseSkillProficiencyAmount = function()
{
  return 1;
};

/**
 * Gets the base amount of proficiency gained from an action for this battler.
 * @returns {number}
 */
Game_Battler.prototype.bonusSkillProficiencyGains = function()
{
  return 0;
};

/**
 * Whether or not a battler can gain proficiency by using skills against this battler.
 * @returns {boolean} True if the battler can give proficiency, false otherwise.
 */
Game_Battler.prototype.canGiveProficiency = function()
{
  // return the inversion of whether or not we found any of the blocker tags.
  return !RPGManager.checkForBooleanFromAllNotesByRegex(
    this.getAllNotes(),
    J.PROF.RegExp.ProficiencyGivingBlock)
};

/**
 * Whether or not this battler can gain proficiency from using skills.
 * @returns {boolean} True if the battler can gain proficiency, false otherwise.
 */
Game_Battler.prototype.canGainProficiency = function()
{
  // return the inversion of whether or not we found any of the blocker tags.
  return !RPGManager.checkForBooleanFromAllNotesByRegex(
    this.getAllNotes(),
    J.PROF.RegExp.ProficiencyGainingBlock)
};
//endregion Game_Battler