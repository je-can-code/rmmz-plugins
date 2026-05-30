//region AptitudeProgress
import AptitudeLearning from './AptitudeLearning.js';

/**
 * The structure of an object and its potential {@link AptitudeLearning}s.
 */
class AptitudeProgress
{
  /**
   * Constructor.
   * @param {string} key "type:id" unique key of the aptitude being learned.
   * @param {Record<number, AptitudeLearning>} [aptitudeLearnings] The current state of learnings; defaults to nothing.
   */
  constructor(key, aptitudeLearnings = {})
  {
    /**
     * The "type:id" unique key of the aptitude being learned.
     * @type {string}
     */
    this.key = key;

    /**
     * The current state of learnings.
     * @type {Record<number, AptitudeLearning>}
     */
    this._learnings = aptitudeLearnings;
  }

  /**
   * Gets the current progress for a skill.
   * @param {number} skillId The skill id to learn.
   * @returns {AptitudeLearning|null} The current learning for the skill, or null if it doesn't exist.
   */
  learningBySkillId(skillId)
  {
    // get the current progress for the skill, or politely coalesce to null if it doesn't exist.
    return this._learnings[skillId] ?? null;
  }

  /**
   * Determines whether or not this aptitude progress has a learning for the given skill.
   * @param {number} skillId The skill id to check for.
   * @returns {boolean} True if the skill exists on this progress, false otherwise.
   */
  hasLearning(skillId)
  {
    return this._learnings[skillId] !== undefined;
  }

  /**
   * Adds or updates a learning for this aptitude progress.
   * @param {number} skillId The skill id to learn.
   * @param {number} [amount] The current amount of AP for the learning; defaults to 0.
   */
  setLearning(skillId, amount = 0)
  {
    // check if we have the learning already.
    if (this.hasLearning(skillId) === false) return;

    // we do, so just grab what exists.
    const learning = this.learningBySkillId(skillId);

    // update the AP for it.
    learning.setAp(amount);
  }

  /**
   * Creates a new learning for this aptitude progress.
   * @param {number} skillId The id of the skill for the learning.
   * @param {number} requiredAp The amount of AP required for the learning.
   * @param {number} [amount] The current amount of AP for the learning; defaults to 0.
   */
  initializeLearning(skillId, requiredAp, amount = 0)
  {
    // we don't have it, so create a new one with this amount.
    this._learnings[skillId] = new AptitudeLearning(skillId, requiredAp, amount);
  }

  /**
   * Gets the current state of learnings for this aptitude progress tracker.
   * @returns {Record<number, AptitudeLearning>}
   */
  learnings()
  {
    return this._learnings;
  }
}

SerializableRegistry.register(AptitudeProgress);

export default AptitudeProgress;
//endregion AptitudeProgress