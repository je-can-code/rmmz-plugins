//region AptitudeTeachable
/**
 * The runtime shape of a learnable skill and its requirements.
 */
class AptitudeTeachable
{
  /**
   * Constructor.
   * @param {number} skillId The skill id to learn.
   * @param {number} requiredAp The required AP to learn the skill.
   */
  constructor(skillId, requiredAp)
  {
    /**
     * The id of the skill to learn.
     * @type {number}
     */
    this.skillId = skillId;

    /**
     * The required AP to learn the skill.
     * @type {number}
     */
    this.requiredAp = requiredAp;
  }
}

export default AptitudeTeachable;
//endregion AptitudeTeachable