//region AptitudeSkillSourceProgress
/**
 * Represents per‑source progress for learning a skill via aptitudes.
 */
class AptitudeSkillSourceProgress
{
  /**
   * The source key (e.g., equipment/state/skill source id string).
   * @type {string}
   */
  #sourceKey = String.empty;

  /**
   * The skill id this source contributes AP toward.
   * @type {number}
   */
  #skillId = 0;

  /**
   * The current AP accumulated toward the skill.
   * @type {number}
   */
  #currentAp = 0;

  /**
   * The total AP required to learn the skill.
   * @type {number}
   */
  #requiredAp = 0;

  /**
   * Whether or not the skill has been learned from this source.
   * @type {boolean}
   */
  #learned = false;

  /**
   * Constructor.
   * @param {string} sourceKey - The source key (e.g., equipment/state/skill source id string).
   * @param {number} skillId - The skill id this source contributes AP toward.
   * @param {number} currentAp - The current AP accumulated for this source toward the skill.
   * @param {number} requiredAp - The total AP required to learn from this source.
   * @param {boolean} learned - Whether this source already granted the skill (complete).
   */
  constructor(sourceKey, skillId, currentAp, requiredAp, learned)
  {
    // store the source key.
    this.#sourceKey = sourceKey;

    this.#skillId = skillId;

    // store current AP.
    this.#currentAp = currentAp;

    // store required AP.
    this.#requiredAp = requiredAp;

    // store learned flag.
    this.#learned = learned === true;
  }

  /**
   * The key of the source.
   * @returns {string}
   */
  sourceKey()
  {
    return this.#sourceKey;
  }

  /**
   * The skill id this source contributes AP toward.
   * @returns {number}
   */
  skillId()
  {
    return this.#skillId;
  }

  /**
   * The current AP accumulated toward the skill.
   * @returns {number}
   */
  currentAp()
  {
    return this.#currentAp;
  }

  /**
   * The total AP required to learn the skill.
   * @returns {number}
   */
  requiredAp()
  {
    return this.#requiredAp;
  }

  /**
   * Whether or not the skill has been learned from this source.
   * @returns {boolean}
   */
  learned()
  {
    return this.#learned;
  }

  /**
   * The remaining AP needed to learn the skill.
   * @returns {number}
   */
  remainingAp()
  {
    // compute how much is left to reach required AP.
    return Math.max(0, this.requiredAp() - this.currentAp());
  }
}

//endregion AptitudeSkillSourceProgress