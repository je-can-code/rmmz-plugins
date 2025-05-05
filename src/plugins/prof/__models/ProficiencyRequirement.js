//region proficiencyRequirement
/**
 * A single requirement of a skill proficiency conditional.
 */
class ProficiencyRequirement
{
  /**
   * The skill id for this requirement.
   * @type {number}
   */
  skillId = 0;

  /**
   * The level of proficiency required to consider this requirement fulfilled.
   * @type {number}
   */
  proficiency = 0;

  /**
   * The skill ids for this requirement.
   * @type {number[]}
   */
  secondarySkillIds = [];

  /**
   * Constructor.
   * @param {number} skillId The primary skill id of the requirement.
   * @param {number} proficiency The proficiency required.
   * @param {number[]} secondarySkillIds The secondary skill ids for the requirement.
   */
  constructor(skillId, proficiency, secondarySkillIds)
  {
    this.skillId = skillId;
    this.proficiency = proficiency;
    this.secondarySkillIds = secondarySkillIds;
  }

  /**
   * Check the total proficiency for this requirement to be unlocked by battler.
   * @param {Game_Actor|Game_Enemy} battler The battler whose proficiency this is being checked for.
   * @returns {number}
   */
  totalProficiency(battler)
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
}

//endregion proficiencyRequirement