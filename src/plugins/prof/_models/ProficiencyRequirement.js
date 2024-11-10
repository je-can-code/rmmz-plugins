//region proficiencyRequirement
/**
 * A single requirement of a skill prof conditional.
 * @constructor
 */
function ProficiencyRequirement()
{
  this.initialize(...arguments);
}

ProficiencyRequirement.prototype = {};
ProficiencyRequirement.prototype.constructor = ProficiencyRequirement;

/**
 * Initializes this class with the given parameters.
 */
ProficiencyRequirement.prototype.initialize = function(skillId, proficiency, secondarySkillIds)
{
  /**
   * The skill id for this requirement.
   * @type {number}
   */
  this.skillId = skillId;

  /**
   * The level of proficiency required to consider this requirement fulfilled.
   * @type {number}
   */
  this.proficiency = proficiency;

  /**
   * The skill ids for this requirement.
   * @type {number[]}
   */
  this.secondarySkillIds = secondarySkillIds;
};

/**
 * Check the total proficiency for this requirement to be unlocked by battler.
 * @param {Game_Actor|Game_Enemy} battler The battler whose proficiency this is being checked for.
 * @returns {number}
 */
ProficiencyRequirement.prototype.totalProficiency = function(battler)
{
  // identify the proficiency of the primary skill.
  const skillProficiency = battler.tryGetSkillProficiencyBySkillId(this.skillId);
  
  // grab the current proficiency of the skill for the battler.
  const primaryProficiency = skillProficiency.proficiency;

  // accumulate the primary proficiency plus all the secondary proficiencies.
  return this.secondarySkillIds
    .reduce((accumulator, secondarySkillId) =>
    {
      // check if there is any proficiency for the primary skill associated with the requirement.
      const secondaryProficiency = battler.tryGetSkillProficiencyBySkillId(secondarySkillId);
      
      // add the additional proficiency onto the accumulation.
      return accumulator + secondaryProficiency.proficiency;
      
      // the base proficiency is this requirement's known proficiency.
    }, primaryProficiency);
};
//endregion proficiencyRequirement