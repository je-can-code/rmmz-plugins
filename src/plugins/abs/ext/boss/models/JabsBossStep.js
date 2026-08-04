//region JabsBossStep
/**
 * One instruction inside a boss routine.
 *
 * A step is the smallest unit an encounter can express, and the vocabulary is deliberately small:
 * every operation observed across the existing hand-evented boss fights reduces to a handful of
 * these. Only the verbs a shipped fight actually needs are implemented- an unimplemented verb is
 * an unexercised code path, and this system earns its keep by being trustworthy rather than broad.
 */
class JabsBossStep
{
  /**
   * The verb this step performs.
   * @type {string}
   */
  #verb = String.empty;

  /**
   * The id of the skill this step operates on.
   * @type {number}
   */
  #skillId = 0;

  /**
   * The name the skill had when this step was authored, used to detect database drift.
   * @type {string}
   */
  #expect = String.empty;

  /**
   * Whether this step's skill should observe its own cast time.
   *
   * This is not cosmetic. A cast time is the telegraph- it is the window in which a player reads
   * the attack and moves out of it. Executing a skill without its cast time deletes that window
   * and turns a readable attack into an unavoidable one.
   * @type {boolean}
   */
  #cast = true;

  /**
   * Constructor.
   * @param {string} verb The verb this step performs.
   * @param {number} skillId The id of the skill this step operates on.
   * @param {string} expect The skill name recorded when this step was authored.
   * @param {boolean} cast Whether the skill should observe its own cast time.
   */
  constructor(verb, skillId, expect, cast)
  {
    this.#verb = verb;
    this.#skillId = skillId;
    this.#expect = expect;
    this.#cast = cast;
  }

  /**
   * Gets the verb this step performs.
   * @returns {string}
   */
  verb()
  {
    return this.#verb;
  }

  /**
   * Gets the id of the skill this step operates on.
   * @returns {number}
   */
  skillId()
  {
    return this.#skillId;
  }

  /**
   * Gets the skill name recorded when this step was authored.
   * @returns {string}
   */
  expect()
  {
    return this.#expect;
  }

  /**
   * Gets whether this step's skill should observe its own cast time.
   * @returns {boolean}
   */
  isCast()
  {
    return this.#cast;
  }
}

export default JabsBossStep;
//endregion JabsBossStep