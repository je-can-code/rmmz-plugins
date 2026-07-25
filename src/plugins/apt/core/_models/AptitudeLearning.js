//region AptitudeLearning
/**
 * The current state of a skill being learned.
 */
class AptitudeLearning
{
  /**
   * Constructor.
   * @param {number} skillId The skill id to learn.
   * @param {number} requiredAp The required AP to achieve this learning.
   * @param {number} currentAp The current AP towards achieving this learning.
   */
  constructor(skillId, requiredAp, currentAp)
  {
    /**
     * The id of the skill learned when achieving this learning.
     * @type {number}
     */
    this.skillId = skillId;

    /**
     * The current AP towards achieving this learning.
     * @type {number}
     */
    this.currentAp = currentAp;

    /**
     * The required amount of AP to achieve this learning.
     * @type {number}
     */
    this.requiredAp = requiredAp;
  }

  /**
   * Gains AP towards achieving this learning.
   * @param {number} ap The amount of AP to gain.
   */
  gainAp(ap)
  {
    this.currentAp += ap;
  }

  /**
   * Sets the current AP towards achieving this learning.
   * @param {number} ap The amount of AP to set.
   */
  setAp(ap)
  {
    this.currentAp = ap;
  }

  /**
   * Sets the required AP to achieve this learning.
   * @param {number} requiredAp The amount of AP to set as required.
   */
  setRequiredAp(requiredAp)
  {
    this.requiredAp = requiredAp;
  }

  /**
   * Whether or not this learning is achieved.
   * @returns {boolean} True if the learning is achieved, false otherwise.
   */
  isLearned()
  {
    return this.currentAp >= this.requiredAp;
  }
}

SerializableRegistry.register(AptitudeLearning);

export default AptitudeLearning;
//endregion AptitudeLearning