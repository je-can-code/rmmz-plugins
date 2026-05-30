//region Game_Battler
import SkillProficiency from './../__models/SkillProficiency.js';

/**
 * Bonus proficiency gained when earning skill proficiency.
 */
Object.defineProperty(Game_BattlerBase.prototype, 'prof', {
  get: function()
  {
    return 0;
  },
  configurable: true,
});

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
 * @returns {SkillProficiency|null}
 */
// eslint-disable-next-line no-unused-vars
Game_Battler.prototype.skillProficiencyBySkillId = function(skillId)
{
  return null;
};

/**
 * Gets the total amount of proficiency gained from an action for this battler.
 * @returns {number}
 */
Game_Battler.prototype.skillProficiencyAmount = function()
{
  const base = this.baseSkillProficiencyAmount();
  const bonuses = this.prof;
  return base + bonuses;
// policy step inside skill proficiency amount.
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
 * Whether or not a battler can gain proficiency by using skills against this battler.
 * @returns {boolean} True if the battler can give proficiency, false otherwise.
 */
Game_Battler.prototype.canGiveProficiency = function()
{
  // return the inversion of whether or not we found any of the blocker tags.
  return !RPGManager.checkForBooleanFromAllNotesByRegex(this.getAllNotes(), J.PROF.RegExp.ProficiencyGivingBlock)
};

/**
 * Whether or not this battler can gain proficiency from using skills.
 * @returns {boolean} True if the battler can gain proficiency, false otherwise.
 */
Game_Battler.prototype.canGainProficiency = function()
{
  // return the inversion of whether or not we found any of the blocker tags.
  return !RPGManager.checkForBooleanFromAllNotesByRegex(this.getAllNotes(), J.PROF.RegExp.ProficiencyGainingBlock)
};
//endregion Game_Battler