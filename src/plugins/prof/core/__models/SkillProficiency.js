//region SkillProficiency
/**
 * A data model for saving skill usage/proficiency for battlers.
 */
class SkillProficiency
{
  /**
   * Initializes this class with the given parameters.
   * @param {number} skillId The skill id of the skill for this prof.
   * @param {number} [initialProficiency] The prof the owning battler bears with this skill; defaults to 0.
   */
  constructor(skillId, initialProficiency = 0)
  {
    /**
     * The skill id of the skill for this prof.
     * @type {number}
     */
    this.skillId = skillId;

    /**
     * The prof the owning battler bears with this skill.
     * @type {number}
     */
    this.proficiency = initialProficiency;
  }

  /**
   * Gets the underlying skill of this prof.
   * @returns {RPG_Skill}
   */
  skill()
  {
    return $dataSkills[this.skillId];
  }

  /**
   * Adds a given amount of prof to the skill's current prof.
   * @param {number} value The amount of prof to add.
   */
  improve(value)
  {
    this.proficiency += value;
    if (this.proficiency < 0)
    {
      this.proficiency = 0;
    }
  }
}

SerializableRegistry.register(SkillProficiency);

export default SkillProficiency;
//endregion SkillProficiency